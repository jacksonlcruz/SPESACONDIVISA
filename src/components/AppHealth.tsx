"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

// ──────────────────────────────────────────────────────────
// Componente: AppHealth
//
// "Guarda-costas" do app no celular. Resolve três sintomas
// clássicos de PWA / mobile:
//
//  1. Pop-up (toast) que não desaparece → o timer do
//     react-hot-toast pausa no hover e, no toque, o "hover"
//     fica preso. Limpamos todos os toasts quando o app volta
//     ao primeiro plano.
//  2. Tela travada após deploy → se um chunk antigo não
//     existir mais, recarregamos a página uma única vez.
//  3. Service worker legado (next-pwa/Workbox) servindo
//     HTML/RSC em cache → registramos o SW network-only
//     (public/sw.js), que limpa os caches e recarrega as abas
//     abertas quando substitui a versão antiga.
// ──────────────────────────────────────────────────────────

/** Chave usada para não entrar em loop de recarregamento */
const CHUNK_RELOAD_KEY = "spesa-chunk-reloaded-at";
const CHUNK_RELOAD_MIN_INTERVAL_MS = 15_000;

/** Erros que indicam bundle/asset antigo ou chunk inexistente */
const CHUNK_ERROR_PATTERN =
  /ChunkLoadError|Loading chunk [\w-]+ failed|Loading CSS chunk|Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i;

function shouldRecoverFrom(message: string): boolean {
  return CHUNK_ERROR_PATTERN.test(message);
}

export default function AppHealth() {
  useEffect(() => {
    // ── 1. Limpa toasts "presos" ao voltar ao app ──────────
    const dismissToasts = () => {
      try {
        toast.dismiss();
      } catch {
        /* react-hot-toast ainda não montado */
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") dismissToasts();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", dismissToasts);
    window.addEventListener("focus", dismissToasts);

    // ── 2. Recuperação de bundle antigo / chunk inexistente ─
    const recoverFromChunkError = (message: string) => {
      if (!shouldRecoverFrom(message)) return;

      try {
        const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? "0");
        if (Date.now() - last < CHUNK_RELOAD_MIN_INTERVAL_MS) return;
        sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
      } catch {
        /* sessionStorage bloqueado — recarrega mesmo assim */
      }

      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      recoverFromChunkError(event?.message ?? "");
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const message =
        reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "";
      recoverFromChunkError(message);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    // ── 3. Registro do service worker (network-only) ───────
    let cancelled = false;

    const registerServiceWorker = async () => {
      if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

      // O próprio SW (public/sw.js) recarrega as abas abertas quando
      // substitui uma versão antiga (upgrade) — ver handler "activate".
      // Aqui apenas garantimos o registro e forçamos a checagem de
      // atualização, ignorando o cache HTTP do /sw.js.
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;
        void registration.update().catch(() => {});
      } catch {
        /* ambiente sem suporte (ex.: navegador in-app) */
      }
    };

    void registerServiceWorker();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", dismissToasts);
      window.removeEventListener("focus", dismissToasts);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
