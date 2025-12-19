import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type HeroImageRow = {
  slot: number;
  storage_path: string;
};

export function useHeroImages(eventSlug: string) {
  const [rows, setRows] = useState<HeroImageRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Escape hatch apenas para tabela não presente no Database types
  const sb = supabase as unknown as { from: (table: string) => any };

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!eventSlug) {
        setRows([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const res = await sb
        .from("event_hero_images")
        .select("slot, storage_path")
        .eq("event_slug", eventSlug)
        .order("slot", { ascending: true });

      const { data, error } = res as unknown as {
        data: HeroImageRow[] | null;
        error: unknown | null;
      };

      if (!alive) return;

      if (error) {
        console.error("useHeroImages error:", error);
        setRows([]);
        setLoading(false);
        return;
      }

      setRows(data ?? []);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`hero-images:${eventSlug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_hero_images",
          filter: `event_slug=eq.${eventSlug}`,
        },
        () => load()
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [eventSlug]);

  const urls = useMemo(() => {
    const bySlot = new Map<number, string>();

    for (const r of rows) {
      const { data } = supabase.storage
        .from("event-hero")
        .getPublicUrl(r.storage_path);

      bySlot.set(r.slot, data.publicUrl);
    }

    return [1, 2, 3].map((s) => bySlot.get(s) ?? "");
  }, [rows]);

  return { urls, rows, loading };
}
