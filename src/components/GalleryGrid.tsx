import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, ImageOff } from "lucide-react";
import { LightboxModal } from "./LightboxModal";

/* ================= TYPES ================= */

interface Photo {
  id: string;
  storage_path: string;
  thumb_path: string | null;
  original_name: string | null;
  created_at: string;
  is_hidden: boolean;
}

/* ================= CONST ================= */

const PAGE_SIZE = 24;
const EVENT_SLUG = "lia-xv";

/* ================= PROTECTION HOOK ================= */

function useBestEffortProtection(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const onContextMenu = (e: Event) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      if (
        (ctrlOrCmd && (key === "s" || key === "p" || key === "u")) ||
        (ctrlOrCmd && e.shiftKey && (key === "i" || key === "j" || key === "c")) ||
        key === "printscreen"
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onDragStart = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("contextmenu", onContextMenu, { passive: false });
    document.addEventListener("keydown", onKeyDown, { passive: false });
    document.addEventListener("dragstart", onDragStart as any, { passive: false });

    return () => {
      document.removeEventListener("contextmenu", onContextMenu as any);
      document.removeEventListener("keydown", onKeyDown as any);
      document.removeEventListener("dragstart", onDragStart as any);
    };
  }, [enabled]);
}

/* ================= MAIN ================= */

export function GalleryGrid() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useBestEffortProtection(true);

  /* ================= ANIMATIONS ================= */

  const listVariants = useMemo(
    () => ({
      hidden: {},
      show: {
        transition: { staggerChildren: 0.03, delayChildren: 0.05 },
      },
    }),
    []
  );

  const itemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 18, scale: 0.985 },
      show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
      },
    }),
    []
  );

  /* ================= FETCH ================= */

  const fetchPhotos = useCallback(async (cursor?: string) => {
    try {
      let query = supabase
        .from("event_photos")
        .select("id, storage_path, thumb_path, original_name, created_at, is_hidden")
        .eq("event_slug", EVENT_SLUG)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (cursor) query = query.lt("created_at", cursor);

      const { data, error } = await query;
      if (error) throw error;

      setPhotos(prev => (cursor ? [...prev, ...(data || [])] : data || []));
      setHasMore((data?.length || 0) === PAGE_SIZE);
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
            if (payload.eventType === "DELETE" && oldRow) {
              return prev.filter(p => p.id !== oldRow.id);
            }

            if (payload.eventType === "INSERT" && row && !row.is_hidden) {
              if (prev.some(p => p.id === row.id)) return prev;
              return [row, ...prev];
            }

            if (payload.eventType === "UPDATE" && row) {
              if (row.is_hidden) {
                return prev.filter(p => p.id !== row.id);
              }

              const idx = prev.findIndex(p => p.id === row.id);
              if (idx === -1) return [row, ...prev];

              const copy = [...prev];
              copy[idx] = row;
              return copy;
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
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setLoadingMore(true);
          const last = photos[photos.length - 1];
          if (last) fetchPhotos(last.created_at);
        }
      },
      { threshold: 0.12 }
    );

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [photos, hasMore, loadingMore, loading, fetchPhotos]);

  const getPhotoUrl = (photo: Photo, thumb = true) => {
    const path = thumb && photo.thumb_path ? photo.thumb_path : photo.storage_path;
    return supabase.storage.from("event-photos").getPublicUrl(path).data.publicUrl;
  };

  /* ================= STATES ================= */

  if (loading) {
    return (
      <section id="gallery" className="py-14 px-5 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-deep" />
      </section>
    );
  }

  if (photos.length === 0) {
    return (
      <section id="gallery" className="py-14 px-5 text-center">
        <ImageOff className="w-10 h-10 mx-auto text-slate-400 mb-3" />
        <p className="text-slate-600">Ainda não há fotos</p>
      </section>
    );
  }

  /* ================= RENDER ================= */

  return (
    <section id="gallery" className="py-14 px-5 select-none">
      <div className="max-w-7xl mx-auto">
        <GalleryHeader count={photos.length} />

        <motion.div
          className="masonry-grid"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              onClick={() => setSelectedIndex(index)}
              getPhotoUrl={getPhotoUrl}
              itemVariants={itemVariants}
            />
          ))}
        </motion.div>

        <div ref={loadMoreRef} className="py-10 flex justify-center">
          <AnimatePresence>
            {loadingMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-slate-400"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Carregando mais…</span>
              </motion.div>
            )}
          </AnimatePresence>
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

      <style>{`
        @media print {
          #gallery { display: none !important; }
        }
        .protected-image { -webkit-touch-callout: none; }
      `}</style>
    </section>
  );
}

/* ================= HEADER ================= */

function GalleryHeader({ count }: { count: number }) {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 mb-2">
        <Sparkles className="w-5 h-5 text-slate-400" />
        <h2 className="font-display text-3xl text-slate-700">Fotos da Noite</h2>
        <Sparkles className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-slate-500">{count} momentos compartilhados</p>
    </div>
  );
}

/* ================= CARD ================= */

interface PhotoCardProps {
  photo: Photo;
  index: number;
  onClick: () => void;
  getPhotoUrl: (photo: Photo, useThumb?: boolean) => string;
  itemVariants: any;
}

function PhotoCard({ photo, index, onClick, getPhotoUrl, itemVariants }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);
  const delay = (index % 10) * 0.025;

  return (
    <motion.div
      variants={itemVariants}
      transition={{ delay }}
      className="relative aspect-square overflow-hidden rounded-2xl cursor-pointer"
      onClick={onClick}
      onContextMenu={e => e.preventDefault()}
    >
      {!loaded && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}

      <img
        src={getPhotoUrl(photo)}
        alt={photo.original_name || "Foto"}
        className={`protected-image h-full w-full object-cover transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        draggable={false}
        onLoad={() => setLoaded(true)}
      />
    </motion.div>
  );
}
