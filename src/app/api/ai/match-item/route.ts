// ============================================================
//  API Route: POST /api/ai/match-item
//
//  Recebe:
//    - imageBase64: imagem da etiqueta em base64 (data URL)
//    - listItems: [{ id, name }]  — itens da lista atual
//
//  Retorna: AiMatchResult
//
//  SEGURANÇA:
//    - A OPENAI_API_KEY nunca é exposta ao cliente.
//    - A imagem é enviada apenas para a OpenAI, não é persistida.
//    - Validação rigorosa de entrada para evitar prompt injection.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { AiMatchResult } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tamanho máximo permitido para a imagem (~5 MB em base64)
const MAX_IMAGE_SIZE_BYTES = 7 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Validação de entrada ──────────────────────────────
    const { imageBase64, listItems } = body as {
      imageBase64: string;
      listItems: { id: string; name: string }[];
    };

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ error: "Immagine mancante" }, { status: 400 });
    }

    if (!imageBase64.startsWith("data:image/")) {
      return NextResponse.json({ error: "Formato immagine non valido" }, { status: 400 });
    }

    if (imageBase64.length > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Immagine troppo grande (max 5 MB)" }, { status: 400 });
    }

    if (!Array.isArray(listItems) || listItems.length === 0) {
      return NextResponse.json({ error: "Lista articoli vuota" }, { status: 400 });
    }

    // Sanitiza os nomes para evitar prompt injection
    const sanitizedItems = listItems
      .slice(0, 50) // limita a 50 itens
      .map((item) => ({
        id: String(item.id).slice(0, 36),
        // Remove caracteres que poderiam ser usados para injeção de prompt
        name: String(item.name).replace(/[<>{}\[\]\\]/g, "").slice(0, 80),
      }));

    const itemsJson = JSON.stringify(sanitizedItems);

    // ── Prompt para a OpenAI Vision API ──────────────────
    //
    // Instruções de design do prompt:
    //  1. Definir papel (OCR + correspondência semântica)
    //  2. Fornecer a lista com IDs para o modelo retornar o ID correto
    //  3. Solicitar resposta APENAS em JSON (sem markdown)
    //  4. Exemplos few-shot embutidos para calibrar o match semântico
    //  5. Regras explícitas contra injeção de conteúdo da imagem
    //
    const systemPrompt = `Sei il motore di Intelligenza Artificiale specializzato in Visione Computazionale, OCR (Riconoscimento Ottico dei Caratteri) e Analisi Semantica Multilingue dell'applicazione "Spesa Condivisa". La tua funzione è analizzare immagini rumorose (volantini di offerte, etichette di scaffale, scontrini) e incrociare i dati con gli articoli della lista della spesa, identificando il prodotto corrispondente ed estraendo il suo prezzo unitario.

## 1. Equivalenza Semantica Multilingue
Gli articoli nella lista possono essere scritti in una lingua diversa dal testo stampato nell'immagine (es. Portoghese o Inglese). Esegui automaticamente la traduzione concettuale.
- "Batata" (PT-BR) → "Patate" (IT) ✓
- "Butter" (EN) → "Burro" (IT) ✓
- "Frango" (PT-BR) → "Pollo" (IT) ✓
- "Pomodoro Pachino" → "Pomodoro" ✓  |  "Latte intero Parmalat" → "Latte" ✓

## 2. Estrazione del Prezzo e Isolamento del Rumore
- Localizza il valore monetario associato strettamente al prodotto identificato.
- Ignora prezzi di prodotti vicini, codici a barre, date o testi promozionali secondari non pertinenti.
- Converti il prezzo in un numero decimale puro (usa il punto come separatore decimale).

## 3. Formato della Risposta (lingua di output: Italiano)
Rispondi SOLO con un oggetto JSON valido, senza markdown, senza testo fuori dal JSON.

Schema obbligatorio:
{
  "matched_item_id": "<uuid dell'articolo corrispondente nella lista, o null se nessuno>",
  "matched_label": "<nome esatto del prodotto letto nell'immagine>",
  "suggested_price": <prezzo float in euro con punto decimale, o null se non leggibile>,
  "ocr_raw": "<frammento testuale grezzo estratto per audit, max 200 caratteri>",
  "confidence": <float 0.0-1.0 che indica la confidenza del match>,
  "explanation": "<frase concisa in italiano, es: 'Il prodotto riconosciuto è X, che corrisponde semanticamente a Y nella lista.'>"
}

## Restrizioni
- Se l'immagine non contiene un prodotto semanticamente equivalente a nessun articolo della lista, imposta matched_item_id e suggested_price a null e spiega amichevolmente in italiano nell'explanation.
- Non inventare o assumere valori non esplicitamente visibili nell'immagine.`;

    // ── Chamada à API OpenAI Vision ───────────────────────
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 400,
      temperature: 0.1,   // baixa temperatura para respostas determinísticas
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
              text: `Articoli nella lista della spesa:\n${itemsJson}\n\nAnalizza l'immagine e rispondi con il JSON.`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
                detail: "low", // suficiente para OCR; economiza tokens
              },
            },
          ],
        },
      ],
    });

    const rawContent = response.choices[0]?.message?.content ?? "";

    // ── Parse e validação da resposta ─────────────────────
    let result: AiMatchResult;
    try {
      // Remove eventuais backticks de markdown que o modelo possa incluir
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      // Valida que o matched_item_id pertence à lista enviada
      const validIds = new Set(sanitizedItems.map((i) => i.id));
      const matchedId =
        parsed.matched_item_id && validIds.has(parsed.matched_item_id)
          ? parsed.matched_item_id
          : null;

      result = {
        matched_item_id: matchedId,
        matched_label:   String(parsed.matched_label ?? "").slice(0, 100),
        suggested_price: typeof parsed.suggested_price === "number" ? parsed.suggested_price : null,
        ocr_raw:         String(parsed.ocr_raw ?? "").slice(0, 200),
        confidence:      Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
        explanation:     String(parsed.explanation ?? "").slice(0, 300),
      };
    } catch {
      return NextResponse.json(
        { error: "Risposta AI non valida. Riprova." },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[ai/match-item]", err);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
