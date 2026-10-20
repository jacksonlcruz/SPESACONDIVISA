/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // App Router: sem cache de navegação no cliente. Como tudo é
    // server-rendered e em tempo real, voltar para o dashboard deve
    // SEMPRE buscar dados frescos (evita "página desatualizada").
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  images: {
    domains: ["lh3.googleusercontent.com", "avatars.githubusercontent.com"],
  },
  async headers() {
    return [
      {
        // O service worker nunca pode vir do cache do browser, senão a
        // atualização do app fica "presa" no celular.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

// ────────────────────────────────────────────────────────────
// PWA: NÃO usamos mais o next-pwa/Workbox.
// O service worker agora é estático (public/sw.js) e network-only,
// porque o cache StaleWhileRevalidate servia HTML/RSC antigos e
// travava o app no celular. Ver src/components/AppHealth.tsx.
// ────────────────────────────────────────────────────────────
module.exports = nextConfig;
