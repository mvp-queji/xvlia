import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";

export function PrintProtection() {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const trigger = (duration = 1400) => {
      setShowOverlay(true);
      setTimeout(() => setShowOverlay(false), duration);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) trigger(1600);
    };

    const handleBlur = () => {
      trigger(1200);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        trigger(1800);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" || target.closest(".protected-image")) {
        e.preventDefault();
        trigger(1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Fundo suave */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-md" />

          {/* Card central */}
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-w-xs w-full mx-6 rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl px-8 py-7 text-center shadow-[0_30px_90px_rgba(0,0,0,0.18)]"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-inner">
              <Lock className="w-6 h-6 text-slate-500" />
            </div>

            <p className="font-display text-xl text-slate-800 mb-1">
              Conteúdo protegido
            </p>

            <p className="text-sm text-slate-500 leading-relaxed">
              Depois mando as fotos para você!!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
