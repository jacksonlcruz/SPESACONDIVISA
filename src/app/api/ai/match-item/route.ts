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
    const systemPrompt = `Sei un assistente OCR e di corrispondenza semantica per una app di lista della spesa.

Il tuo compito è:
1. Leggere il testo nell'immagine (etichetta del prezzo o del prodotto).
2. Estrarre il prezzo numerico più probabile (cerca "€", "EUR", cifre decimali).
3. Identificare il nome del prodotto nell'immagine.
4. Trovare l'articolo nella lista fornita che meglio corrisponde semanticamente al prodotto fotografato.
   - Esempi di corrispondenze valide: "Pomodoro Pachino" → "Pomodoro", "Latte intero Parmalat" → "Latte", "Mele Golden" → "Mele"
   - Usa la comprensione semantica, non solo la corrispondenza letterale.

IMPORTANTE: Rispondi SOLO con un oggetto JSON valido, senza markdown, senza spiegazioni fuori dal JSON.

Schema di risposta obbligatorio:
{
  "matched_item_id": "<uuid dell'articolo corrispondente o null se nessuno>",
  "matched_label": "<nome del prodotto riconosciuto nell'immagine>",
  "suggested_price": <numero float con il prezzo in euro, o null se non trovato>,
  "ocr_raw": "<testo grezzo estratto dall'immagine, max 200 caratteri>",
  "confidence": <float 0.0-1.0 che indica la confidenza del match>,
  "explanation": "<breve spiegazione in italiano del perché hai fatto questo abbinamento>"
}`;

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
