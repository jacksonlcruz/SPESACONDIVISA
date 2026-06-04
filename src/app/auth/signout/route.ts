import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/database.types";

// POST /auth/signout — encerra sessão
export async function POST() {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get:    (name) => cookieStore.get(name)?.value,
        set:    (name, value, options) => cookieStore.set({ name, value, ...options }),
        remove: (name, options) => cookieStore.delete({ name, ...options }),
      },
    }
  );

  await supabase.auth.signOut();
  redirect("/login");
}
