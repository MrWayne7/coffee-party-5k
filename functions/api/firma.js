/* ============================================================
   Cloudflare Pages Function — POST /api/firma
   Genera la referencia y la FIRMA DE INTEGRIDAD de Wompi de forma
   segura (el secreto NUNCA viaja al navegador). El front llama aquí,
   recibe {publicKey, reference, signature, amountInCents, redirectUrl}
   y con eso abre el Web Checkout de Wompi.

   Requiere estas variables de entorno (se ponen con wrangler, ver LEEME-PAGOS.md):
     WOMPI_PUBLIC_KEY        -> pub_prod_xxx  (o pub_test_xxx en pruebas)
     WOMPI_INTEGRITY_SECRET  -> secreto de integridad de la cuenta
     REDIRECT_URL  (opcional) -> p.ej. https://coffee-party-5k.pages.dev/gracias
   ============================================================ */
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const amt = Math.round(Number(data.amount));
    if (!amt || amt < 1500) return json({ error: "monto_invalido" }, 400);
    if (!env.WOMPI_PUBLIC_KEY || !env.WOMPI_INTEGRITY_SECRET) {
      return json({ error: "sin_configurar" }, 500);
    }

    const amountInCents = amt * 100;
    const currency = "COP";
    const reference =
      "CP5K-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    // firma = SHA256( reference + amountInCents + currency + integritySecret )
    const toSign = `${reference}${amountInCents}${currency}${env.WOMPI_INTEGRITY_SECRET}`;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(toSign));
    const signature = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

    const origin = new URL(request.url).origin;

    // (opcional) guardar el pedido como "pendiente" en D1, si existe el binding DB
    if (env.DB) {
      try {
        await env.DB.prepare(
          "INSERT INTO ordenes (ref, monto, email, nombre, telefono, items, estado, creado) VALUES (?,?,?,?,?,?,?,?)"
        )
          .bind(
            reference, amt, data.email || "", data.name || "", data.phone || "",
            JSON.stringify({ items: data.items || [], donation: data.donation || 0 }),
            "PENDIENTE", new Date().toISOString()
          )
          .run();
      } catch (e) { /* si no existe la tabla, seguimos igual */ }
    }

    return json({
      publicKey: env.WOMPI_PUBLIC_KEY,
      reference,
      signature,
      amountInCents,
      currency,
      redirectUrl: env.REDIRECT_URL || origin + "/gracias",
    });
  } catch (e) {
    return json({ error: "solicitud_invalida" }, 400);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
