"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN") router.push("/dashboard");
      }
    );
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-surface-900">
      {/* Logo / header */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-surface-700 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5 shadow-lg">
          🛒
        </div>
        <h1 className="text-4xl font-bold text-zinc-100">Spesa Condivisa</h1>
        <p className="text-zinc-400 mt-2 text-base">
          La tua lista della spesa collaborativa
        </p>
      </div>

      {/* Auth UI do Supabase */}
      <div className="w-full max-w-sm">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#deff9a",
                  brandAccent: "#b8d970",
                  inputBackground: "#27272a",
                  inputBorder: "#3f3f46",
                  inputText: "#f4f4f5",
                  inputPlaceholder: "#71717a",
                  defaultButtonBackground: "#27272a",
                  defaultButtonBorder: "#3f3f46",
                  defaultButtonText: "#f4f4f5",
                  dividerBackground: "#3f3f46",
                  messageText: "#f4f4f5",
                  anchorTextColor: "#deff9a",
                },
                radii: {
                  borderRadiusButton: "16px",
                  inputBorderRadius: "16px",
                },
                fonts: {
                  bodyFontFamily: "var(--font-urbanist), system-ui, sans-serif",
                  buttonFontFamily: "var(--font-urbanist), system-ui, sans-serif",
                },
              },
            },
          }}
          providers={["google"]}
          redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`}
          localization={{
            variables: {
              sign_in: {
                email_label: "Email",
                password_label: "Password",
                button_label: "Accedi",
                link_text: "Hai già un account? Accedi",
              },
              sign_up: {
                email_label: "Email",
                password_label: "Password",
                button_label: "Registrati",
                link_text: "Non hai un account? Registrati",
              },
            },
          }}
        />
      </div>
    </div>
  );
}
