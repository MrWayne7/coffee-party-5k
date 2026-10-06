/* ============================================================
   Cloudflare Pages Function — POST /api/wompi-webhook
   Wompi llama aquí automáticamente cuando una transacción cambia de
   estado. Verificamos la firma del evento y, si el pago fue APROBADO,
   marcamos el pedido como pagado y disparamos la confirmación.

   NOTA: Wompi YA envía al comprador un recibo por correo automático.
   Este webhook es para (a) dejar registro en tu base y (b) enviar una
   confirmación propia/branded por WhatsApp o correo si lo quieres.

   Configura la URL del webhook en el panel de Wompi:
     https://coffee-party-5k.pages.dev/api/wompi-webhook
   Variable de entorno requerida:
     WOMPI_EVENTS_SECRET  -> secreto de eventos de la cuenta Wompi
   ============================================================ */
export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return new Response("bad", { status: 400 }); }

  // --- verificar firma del evento ---
  const sig = body && body.signature;
  if (env.WOMPI_EVENTS_SECRET && sig && Array.isArray(sig.properties)) {
    const concat =
      sig.properties.map((p) => getPath(body.data, p)).join("") +
      body.timestamp +
      env.WOMPI_EVENTS_SECRET;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(concat));
    const calc = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    if (calc !== sig.checksum) return new Response("firma invalida", { status: 401 });
  }

  const tx = body && body.data && body.data.transaction;
  if (tx && tx.status === "APPROVED") {
    // 1) marcar pagado en D1 (si está configurado)
    if (env.DB) {
      try {
        await env.DB.prepare("UPDATE ordenes SET estado=?, txid=? WHERE ref=?")
          .bind("PAGADO", tx.id, tx.reference).run();
      } catch (e) {}
    }
    // 2) 🔁 confirmación propia (opcional): correo con Resend o WhatsApp API.
    //    Ejemplo de correo con Resend (necesita RESEND_API_KEY):
    // if (env.RESEND_API_KEY) {
    //   await fetch("https://api.resend.com/emails", {
    //     method:"POST",
    //     headers:{ "Authorization":"Bearer "+env.RESEND_API_KEY, "Content-Type":"application/json" },
    //     body: JSON.stringify({
    //       from:"Coffee Party 5K <no-reply@tudominio.com>",
    //       to: tx.customer_email,
    //       subject:"¡Tu cupo está confirmado! 🎄 Coffee Party 5K",
    //       html:`<h1>¡Nos vemos el 14 de diciembre!</h1><p>Pago aprobado · Ref ${tx.reference}</p>`
    //     })
    //   });
    // }
  }

  return new Response("ok");
}

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}
