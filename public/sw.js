/**
 * Service Worker — Spesa Condivisa
 * ────────────────────────────────────────────────────────────────
 * Estratégia: NETWORK-ONLY (sem cache de aplicação).
 *
 * Motivo: este app é 100% dependente de dados em tempo real
 * (Supabase Realtime + REST). A versão anterior (gerada pelo
 * next-pwa/Workbox) cacheava documentos HTML, payloads RSC e
 * rotas /api com StaleWhileRevalidate. Isso causava:
 *   • páginas antigas após deploy (chunks que não existem mais);
 *   • tela travada exigindo fechar/reabrir o navegador;
 *   • listas "desatualizadas" mesmo com o banco já alterado.
 *
 * Este SW existe apenas para manter o app instalável (PWA) e
 * para limpar todos os caches criados pela versão anterior.
 * Nenhuma requisição é servida do cache.
 * ────────────────────────────────────────────────────────────────
 */

const SW_VERSION = "spesa-sw-v3-network-only";

/**
 * true quando este SW substitui um SW anterior (upgrade).
 * Durante o `install`, registration.active ainda é o worker ANTIGO;
 * no primeiro acesso de todos é null.
 */
let isUpgrade = false;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      isUpgrade = Boolean(self.registration.active || self.registration.waiting);
      // Assume o controle assim que possível (substitui o SW antigo)
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove TODOS os caches legados (workbox-precache, others,
      // static-js-assets, start-url, …). O app não usa cache offline.
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
        /* caches indisponíveis — ignora */
      }

      await self.clients.claim();

      // Avisa as abas abertas que o SW antigo foi substituído
      try {
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((client) => {
          client.postMessage({ type: "SW_UPDATED", version: SW_VERSION });
        });
      } catch {
        /* ignora */
      }

      // Se esta é uma ATUALIZAÇÃO, as páginas abertas ainda rodam o
      // bundle antigo (que pode referenciar chunks inexistentes).
      // Recarregamos cada uma para que peguem HTML/JS frescos da rede.
      // No primeiro acesso (install limpo) nada acontece.
      if (!isUpgrade) return;

      try {
        const clients = await self.clients.matchAll({ type: "window" });
        await Promise.all(
          clients.map((client) =>
            typeof client.navigate === "function"
              ? client.navigate(client.url).catch(() => null)
              : null
          )
        );
      } catch {
        /* ignora */
      }
    })()
  );
});

/**
 * Pass-through: o evento existe para manter os critérios de
 * instalabilidade do PWA, mas NUNCA chama respondWith() — ou seja,
 * toda requisição vai direto para a rede, sem cache.
 */
self.addEventListener("fetch", () => {
  /* network-only */
});
