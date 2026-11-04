import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Injects Google Tag Manager into index.html. GTM only loads when the
// container ID is set, so local dev and preview builds without it don't send
// analytics. GA4 is configured inside GTM.
function googleTagManager(gtmId: string | undefined): Plugin {
  return {
    name: 'google-tag-manager',
    transformIndexHtml() {
      if (!gtmId) return []
      return [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
        },
        // GTM's no-JavaScript fallback.
        {
          tag: 'noscript',
          injectTo: 'body-prepend',
          children: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
        },
      ]
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Empty prefix so non-VITE_ vars (dev-server only, never bundled) load too.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), googleTagManager(env.VITE_APP_GTM_ID)],
    server: {
      port: 3004,
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: 'localhost',
        },
      },
    },
  }
})
