"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function CreateListButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lists")
        .insert({ owner_id: userId, title: "Lista della spesa", emoji: "🛒" })
        .select("id")
        .single();

      if (error || !data) throw error;
      router.push(`/lista/${data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Errore: ${msg}`);
      console.error("[CreateList]", err);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="w-14 h-14 bg-brand-500 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform disabled:opacity-70"
      aria-label="Crea nuova lista"
    >
      {loading ? (
        <Loader2 size={22} className="animate-spin text-white" />
      ) : (
        <Plus size={26} className="text-white" />
      )}
    </button>
  );
}
