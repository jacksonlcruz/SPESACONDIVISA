// ============================================================
//  API Route: POST /api/ai/scan-any
//
//  Scanner Geral — identifica QUALQUER produto e preço
//  sem a necessidade de um "target_item" obrigatório.
//
//  Recebe:
//    - imageBase64: imagem da etiqueta em base64 (data URL)
//
//  Retorna: ScanAnyResult { product, price, ocr_raw, confidence, explanation, is_food }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_IMAGE_SIZE_BYTES = 7 * 1024 * 1024; // ~5 MB em base64

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64 } = body as { imageBase64: string };

    // ── Validação ──────────────────────────────────────────
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ error: "Immagine mancante" }, { status: 400 });
    }

    if (!imageBase64.startsWith("data:image/")) {
      return NextResponse.json({ error: "Formato immagine non valido" }, { status: 400 });
    }

    if (imageBase64.length > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Immagine troppo grande (max 5 MB)" }, { status: 400 });
    }

    // ── System Prompt: identificação livre ─────────────────
    const systemPrompt = `Sei il motore di Intelligenza Artificiale specializzato in Visione Computazionale e OCR dell'applicazione "Spesa Condivisa". La tua funzione è analizzare immagini (etichette di scaffale, volantini, scontrini, prodotti) e identificare il prodotto e il suo prezzo.

## Istruzioni
1. Identifica qual è il prodotto nella foto. Sii specifico ma conciso (es. "Latte intero Parmalat", "Pasta Barilla", "Pomodori ciliegino").
2. Estrai il prezzo associato al prodotto. Ignora prezzi di prodotti vicini, codici a barre o testi promozionali non pertinenti.
3. Converti il prezzo in un numero decimale puro (usa il punto come separatore decimale, es. 1.50).
4. Se l'immagine non contiene un prodotto riconoscibile, restituisci product come stringa vuota e price come null.
5. Classifica il prodotto in base alla sua natura merceologica:
   - "is_food": true → prodotto alimentare oppure bevanda NON alcolica destinata al consumo umano (pasta, latte, frutta, carne, pane, acqua, succhi, bibite/refrigeranti come Fanta, Coca-Cola, Sprite, Pepsi, energizzanti, caffè, tè, surgelati, snack, dolci…).
   - "is_food": false → prodotto non alimentare (detersivi, detergenti, igiene personale, carta, sacchetti, stoviglie, pile, prodotti per animali, casalinghi…) e anche QUALSIASI bevanda alcolica (vino, birra, spumante, prosecco, superalcolici, liquori, cocktail come spritz o mojito), perché i ticket alimentari dell'utente non coprono l'alcol.
   - Eccezione: le bevande dichiarate "analcoliche" (es. birra analcolica, vino senza alcol, "alcohol free") sono true.
   - In caso di dubbio, se il prodotto si trova abitualmente nel reparto alimentari usa true, altrimenti false.

## Formato della Risposta (lingua di output: Italiano)
Rispondi SOLO con un oggetto JSON valido, senza markdown, senza testo fuori dal JSON.

Schema obbligatorio:
{
  "product": "<nome del prodotto identificato>",
  "price": <prezzo float in euro con punto decimale, o null se non leggibile>,
  "ocr_raw": "<frammento testuale grezzo estratto per audit, max 200 caratteri>",
  "confidence": <float 0.0-1.0>,
  "explanation": "<breve frase in italiano su cosa è stato identificato>",
  "is_food": <true se è un alimento o bevanda non alcolica, false se non alimentare o se è una bevanda alcolica>
}

## Restrizioni
- Non inventare prodotti non visibili nell'immagine.
- Non assumere prezzi se non chiaramente leggibili.
- Mantieni l'output JSON pulito, senza markdown.`;

    // ── Chamada à API OpenAI Vision ───────────────────────
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 400,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analizza l'immagine e identifica il prodotto e il prezzo. Rispondi con il JSON.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
                detail: "low",
              },
            },
          ],
        },
      ],
    });

    const rawContent = response.choices[0]?.message?.content ?? "";

    // ── Parse e validação ─────────────────────────────────
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      const result = {
        product: String(parsed.product ?? "").slice(0, 100).trim(),
        price: typeof parsed.price === "number" && parsed.price > 0 ? parsed.price : null,
        ocr_raw: String(parsed.ocr_raw ?? "").slice(0, 200),
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
        explanation: String(parsed.explanation ?? "").slice(0, 300),
        // Categoria alimentar: só aceita booleano; qualquer outra
        // coisa vira null (o app então usa o palpite local)
        is_food: typeof parsed.is_food === "boolean" ? parsed.is_food : null,
      };

      // Se não identificou produto, retorna erro amigável
      if (!result.product) {
        return NextResponse.json(
          { error: "Nessun prodotto riconosciuto nell'immagine. Riprova con una foto più chiara." },
          { status: 422 }
        );
      }

      return NextResponse.json(result);
    } catch {
      return NextResponse.json(
        { error: "Risposta AI non valida. Riprova." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[ai/scan-any]", err);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}