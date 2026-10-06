# Coffee Party 5K — activar el pago en línea (Wompi)

La página ya trae todo armado. El cobro con **tarjeta, PSE, Nequi, Bancolombia y Daviplata**
y la **confirmación automática por correo** los hace Wompi. Solo falta conectar las llaves.

## 1. Cuenta Wompi
Crear/entrar a la cuenta del comercio en https://comercios.wompi.co y copiar de "Desarrolladores":
- Llave pública (`pub_prod_...` para producción, `pub_test_...` para pruebas)
- Secreto de integridad
- Secreto de eventos

## 2. Poner las llaves como secretos (desde la terminal, nunca en el código)

```
cd ~/Sites/coffee-party-5k
npx wrangler@latest pages secret put WOMPI_PUBLIC_KEY --project-name=coffee-party-5k
npx wrangler@latest pages secret put WOMPI_INTEGRITY_SECRET --project-name=coffee-party-5k
npx wrangler@latest pages secret put WOMPI_EVENTS_SECRET --project-name=coffee-party-5k
```

Cada comando pide pegar el valor. (Opcional) fijar la URL de retorno:

```
npx wrangler@latest pages secret put REDIRECT_URL --project-name=coffee-party-5k
```

Valor sugerido: `https://coffee-party-5k.pages.dev/gracias`

## 3. Webhook de confirmación
En el panel de Wompi, sección Eventos, poner la URL:

```
https://coffee-party-5k.pages.dev/api/wompi-webhook
```

## 4. (Opcional) Base de datos para registro de pedidos

```
npx wrangler@latest d1 create coffee-party-5k
npx wrangler@latest d1 execute coffee-party-5k --file=schema.sql --remote
```

Luego descomentar el bloque `[[d1_databases]]` en `wrangler.toml` y pegar el `database_id`.

## 5. Desplegar

```
npx wrangler@latest pages deploy . --project-name=coffee-party-5k --commit-dirty=true
```

## Flujo del pago
1. El cliente elige entradas y llena sus datos.
2. "Pagar en línea" llama a `/api/firma` (genera referencia + firma segura).
3. Se redirige al checkout de Wompi con todos los métodos.
4. Wompi cobra y envía el recibo por correo automático.
5. Vuelve a `/gracias`, que confirma el estado del pago.
6. Wompi avisa a `/api/wompi-webhook` (registro + confirmación propia opcional).

Mientras no haya llaves, "Pagar en línea" avisa que no está activo y el botón
"Reservar por WhatsApp" sigue funcionando como alternativa.
