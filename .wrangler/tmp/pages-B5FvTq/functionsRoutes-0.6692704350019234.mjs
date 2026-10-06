import { onRequestPost as __api_firma_js_onRequestPost } from "/Users/mrwayne/Documents/CUP/WEBSITE/V03/functions/api/firma.js"
import { onRequestPost as __api_wompi_webhook_js_onRequestPost } from "/Users/mrwayne/Documents/CUP/WEBSITE/V03/functions/api/wompi-webhook.js"

export const routes = [
    {
      routePath: "/api/firma",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_firma_js_onRequestPost],
    },
  {
      routePath: "/api/wompi-webhook",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_wompi_webhook_js_onRequestPost],
    },
  ]