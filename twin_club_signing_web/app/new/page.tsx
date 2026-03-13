"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewSessionPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function createRoom() {
      if (!supabase) {
        setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.");
        setLoading(false);
        return;
      }
      try {
        const { data, error: err } = await supabase
          .from("signing_rooms")
          .insert({})
          .select("id")
          .single();
        if (err) throw err;
        if (data?.id) {
          router.replace(`/sign/${data.id}`);
        } else {
          throw new Error("Failed to create room");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create session");
        setLoading(false);
      }
    }
    createRoom();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-zinc-50 to-stone-100 dark:from-zinc-950">
        <div className="text-zinc-500">Creating session…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-zinc-50 to-stone-100 dark:from-zinc-950 px-6">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <a
          href="/"
          className="text-zinc-600 dark:text-zinc-400 hover:underline"
        >
          ← Back
        </a>
      </div>
    );
  }

  return null;
}
