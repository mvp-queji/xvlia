// src/components/gallery/GalleryGrid.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, ImageOff } from "lucide-react";
import { LightboxModal } from "./LightboxModal";

interface Photo {
  id: string;
  storage_path: string;
  thumb_path: string | null;
  original_name: string | null;
  created_at: string;
  is_hidden: boolean;
}

const PAGE_SIZE = 24;
const EVENT_SLUG = "lia-xv";

export function GalleryGrid() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  /* ================= FETCH ================= */

  const fetchPhotos = useCallback(async (cursor?: string) => {
    try {
      let query = supabase
        .from("event_photos")
        .select(
          "id, storage_path, thumb_path, original_name, created_at, is_hidden"
        )
        .eq("event_slug", EVENT_SLUG)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (cursor) query = query.lt("created_at", cursor);

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        setPhotos(prev => (cursor ? [...prev, ...data] : data));
        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error("Gallery fetch failed:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  /* ================= REALTIME ================= */

  useEffect(() => {
    const channel = supabase
      .channel("gallery-lia-xv-public")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_photos",
          filter: `event_slug=eq.${EVENT_SLUG}`,
        },
        payload => {
          const row = payload.new as Photo | null;
          const oldRow = payload.old as Photo | null;

          setPhotos(prev => {
            // DELETE
            if (payload.eventType === "DELETE" && oldRow) {
              return prev.filter(p => p.id !== oldRow.id);
            }

            // INSERT
            if (payload.eventType === "INSERT" && row && !row.is_hidden) {
              return [row, ...prev];
            }

            // UPDATE
            if (payload.eventType === "UPDATE" && row) {
              // ficou oculta → remove
              if (row.is_hidden) {
                return prev.filter(p => p.id !== row.id);
              }
              // ficou visível → adiciona se não existir
              const exists = prev.some(p => p.id === row.id);
              if (!exists) {
                return [row, ...prev];
              }
            }

            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ================= INFINITE SCROLL ================= */

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loadingMore &&
          !loading
        ) {
          setLoadingMore(true);
          const last = photos[photos.length - 1];
          if (last) fetchPhotos(last.created_at);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [photos, hasMore, loadingMore, loading, fetchPhotos]);

  const getPhotoUrl = (photo: Photo, thumb = true) => {
    const path =
      thumb && photo.thumb_path ? photo.thumb_path : photo.storage_path;
    return supabase.storage.from("event-photos").getPublicUrl(path).data
      .publicUrl;
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <section id="gallery" className="py-14 px-5">
        <div className="max-w-7xl mx-auto text-center">
          <GalleryHeader count={0} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            className="inline-block mt-16"
          >
            <Loader2 className="w-8 h-8 text-primary-deep" />
          </motion.div>
        </div>
      </section>
    );
  }

  /* ================= EMPTY ================= */

  if (photos.length === 0) {
    return (
      <section id="gallery" className="py-14 px-5">
        <div className="max-w-7xl mx-auto">
          <GalleryHeader count={0} />
          <motion.div
            className="mx-auto max-w-sm rounded-3xl border border-white/60 bg-white/55 backdrop-blur-xl p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.12)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70">
              <ImageOff className="h-8 w-8 text-slate-400" />
            </div>
            <p className="font-display text-xl text-slate-700 mb-2">
              Ainda não há fotos
            </p>
            <p className="text-sm text-slate-500">
              Seja o primeiro a compartilhar um momento especial!
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  /* ================= GRID ================= */

  return (
    <section id="gallery" className="py-14 px-5">
      <div className="max-w-7xl mx-auto">
        <GalleryHeader count={photos.length} />

        <div className="masonry-grid">
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              onClick={() => setSelectedIndex(index)}
              getPhotoUrl={getPhotoUrl}
            />
          ))}
        </div>

        <div ref={loadMoreRef} className="py-10 flex justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-primary-deep" />
              <span className="text-sm">Carregando mais…</span>
            </div>
          )}
        </div>
      </div>

      <LightboxModal
        photos={photos.map(p => ({
          id: p.id,
          url: getPhotoUrl(p, false),
          name: p.original_name || "",
        }))}
        selectedIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onNavigate={setSelectedIndex}
      />
    </section>
  );
}

/* ================= HEADER ================= */

function GalleryHeader({ count }: { count: number }) {
  return (
    <motion.div
      className="text-center mb-12"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center justify-center gap-3 mb-3">
        <Sparkles className="w-5 h-5 text-slate-400" />
        <h2 className="font-display text-3xl sm:text-4xl text-slate-700">
          Fotos da Noite
        </h2>
        <Sparkles className="w-5 h-5 text-slate-400" />
      </div>
      {count > 0 && (
        <p className="text-slate-500">
          {count} momento{count !== 1 ? "s" : ""} compartilhado
          {count !== 1 ? "s" : ""}
        </p>
      )}
    </motion.div>
  );
}

/* ================= CARD ================= */

interface PhotoCardProps {
  photo: Photo;
  index: number;
  onClick: () => void;
  getPhotoUrl: (photo: Photo, useThumb?: boolean) => string;
}

function PhotoCard({ photo, index, onClick, getPhotoUrl }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const delay = (index % 6) * 0.06;

  if (error) {
    return (
      <div className="aspect-square rounded-2xl bg-slate-100 flex items-center justify-center">
        <ImageOff className="w-8 h-8 text-slate-400" />
      </div>
    );
  }

  return (
    <motion.div
      className="relative aspect-square overflow-hidden rounded-2xl border border-white/50 bg-white/40 backdrop-blur-md shadow-[0_18px_60px_rgba(0,0,0,0.12)] cursor-pointer"
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      onContextMenu={e => e.preventDefault()}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200/60 to-slate-100/60 animate-pulse" />
      )}

      <img
        src={getPhotoUrl(photo)}
        alt={photo.original_name || "Momento especial"}
        className={`protected-image h-full w-full object-cover transition-all duration-700 ${
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
        }`}
        loading="lazy"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-blue-200/10" />
    </motion.div>
  );
}
