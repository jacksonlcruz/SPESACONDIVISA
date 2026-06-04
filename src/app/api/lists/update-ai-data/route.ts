// API Route: PATCH /api/lists/update-ai-data
// Persiste os dados de IA (matched_label, ocr_raw) no item

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function PATCH(req: NextRequest) {
  const cookieStore = cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { itemId, aiMatchedLabel, ocrRawPrice } = await req.json();

  if (!itemId || typeof itemId !== "string") {
    return NextResponse.json({ error: "itemId mancante" }, { status: 400 });
  }

  const { error } = await supabase
    .from("list_items")
    .update({
      ai_matched_label: String(aiMatchedLabel ?? "").slice(0, 100) || null,
      ocr_raw_price:    String(ocrRawPrice    ?? "").slice(0, 50)  || null,
    })
    .eq("id", itemId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
