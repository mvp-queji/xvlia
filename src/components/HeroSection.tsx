import { useEffect, useMemo } from "react";
import { Camera, Sparkles, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useHeroImages } from "@/hooks/useHeroImages";

interface HeroSectionProps {
  onUploadClick: () => void;
  onGalleryClick: () => void;
}

const EVENT_SLUG = "lia-xv";

export function HeroSection({ onUploadClick, onGalleryClick }: HeroSectionProps) {
  const { urls, loading } = useHeroImages(EVENT_SLUG);

  const bgImage = useMemo(() => {
    return urls.filter(Boolean)[0] ?? null;
  }, [urls]);

  return (
    <section className="relative isolate">
      {/* HERO */}
      <div className="relative h-[72dvh] min-h-[520px] w-full overflow-hidden">
        {/* FOTO DE FUNDO */}
        {bgImage && (
          <div
            className="absolute inset-0 scale-110"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              filter: "blur(26px) brightness(1.05) saturate(1.05)",
            }}
          />
        )}

        {/* CAMADA DE INTENÇÃO */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/65 via-white/35 to-white" />

        {/* VINHETA */}
        <div className="absolute inset-0 shadow-[inset_0_-120px_180px_rgba(255,255,255,0.85)]" />

        {/* GRAIN */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(255,255,255,.9), transparent 35%)," +
              "radial-gradient(circle at 80% 30%, rgba(255,255,255,.8), transparent 40%)," +
              "radial-gradient(circle at 40% 90%, rgba(255,255,255,.7), transparent 45%)",
          }}
        />

        {/* XV PRATA 3D — FINAL DA HERO */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center">
          <div
            className="select-none leading-none"
            style={{
              fontSize: "clamp(120px, 32vw, 220px)",
              fontFamily: "ui-serif, 'Playfair Display', serif",
              background:
                "linear-gradient(180deg, #ffffff 0%, #e6e8ec 18%, #b8bcc4 38%, #f5f6f8 55%, #9aa0aa 72%, #ffffff 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow:
                "0 6px 12px rgba(255,255,255,0.6), 0 22px 60px rgba(0,0,0,0.25)",
              opacity: 0.95,
            }}
          >
            XV
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="px-5 pt-6 pb-10">
        <div className="mx-auto w-full max-w-[420px] text-center">
          <p className="font-display text-[18px] leading-relaxed text-slate-700 italic">
            “Gostaria muito que enviassem aqui todas as fotos que tirassem nessa
            noite, são lembranças importantes para mim!!”
          </p>

          <p className="mt-3 text-sm text-slate-500">
            Com carinho,{" "}
            <span className="signature text-lg text-primary-deep">Lia</span> 💙
          </p>

          <div className="mt-6 grid gap-3">
            <button
              onClick={onUploadClick}
              className="btn-princess w-full py-4 text-base flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>Enviar minhas fotos</span>
            </button>

            <button
              onClick={onGalleryClick}
              className="btn-secondary w-full py-3.5 text-base flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Ver galeria de fotos</span>
            </button>

          
          </div>

          <motion.div
            className="flex justify-center mt-7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <motion.div
              className="flex flex-col items-center text-slate-400/70"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-xs mb-1">deslize</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>

      
        </div>
      </div>
    </section>
  );
}
