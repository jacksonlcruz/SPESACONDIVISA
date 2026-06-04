"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
      <p className="text-4xl">⚠️</p>
      <h2 className="text-lg font-semibold text-gray-800">Qualcosa è andato storto</h2>
      <p className="text-sm text-gray-500 font-mono break-all max-w-sm">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm"
      >
        Riprova
      </button>
    </div>
  );
}
