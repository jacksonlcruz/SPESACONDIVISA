/**
 * Utilitário: withTimeout
 *
 * Executa uma promise com limite de tempo. Serve para que nenhuma
 * operação de escrita deixe a UI "presa" (spinner infinito, modal com
 * botões desabilitados) quando a rede móvel simplesmente não responde.
 *
 * Importante: o request original NÃO é cancelado no servidor — apenas
 * paramos de esperar e liberamos a interface. O Realtime/reconciliação
 * corrige o estado local quando/se a resposta chegar.
 */
export function withTimeout<T>(
  promise: PromiseLike<T>,
  ms = 15_000,
  message = "Connessione lenta. Riprova."
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    }, ms);

    Promise.resolve(promise).then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
