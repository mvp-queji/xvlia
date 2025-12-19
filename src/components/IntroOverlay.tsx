import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock } from "lucide-react";

interface IntroOverlayProps {
  isVisible: boolean;
  onEnter: () => void;
}

const ACCESS_KEY = "lia_xv_access_granted_v2";

export function IntroOverlay({ isVisible, onEnter }: IntroOverlayProps) {
  const requiredCode =
    (import.meta.env.VITE_EVENT_ACCESS_CODE as string | undefined) ?? "XVLIA";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Auto-enter se já validou
  useEffect(() => {
    if (!isVisible) return;
    if (localStorage.getItem(ACCESS_KEY) === "true") onEnter();
  }, [isVisible, onEnter]);

  // Parallax extremamente sutil (não distrai)
  useEffect(() => {
    if (!isVisible) return;

    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
      setTilt({ x: nx * 6, y: ny * 6 });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove as any);
  }, [isVisible]);

  const validateAndEnter = () => {
    const normalized = code.trim().toUpperCase();
    const required = requiredCode.trim().toUpperCase();

    if (!normalized || normalized !== required) {
      setError("Código incorreto.");
      setShake(true);
      setTimeout(() => setShake(false), 420);
      return;
    }

    localStorage.setItem(ACCESS_KEY, "true");
    onEnter();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* FUNDO */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#edf4ff] to-white" />

          {/* XV DE FUNDO */}
          <motion.div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0)`,
            }}
          >
            <div
              className="select-none"
              style={{
                fontSize: "clamp(260px, 70vw, 420px)",
                fontFamily: "ui-serif, 'Playfair Display', serif",
                color: "#000",
                opacity: 0.06,
                filter: "blur(1px)",
              }}
            >
              XV
            </div>
          </motion.div>

          {/* CONTEÚDO */}
          <div className="relative z-10 w-full max-w-[360px] px-6 text-center flex flex-col items-center">
            {/* TEXTO */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mb-10"
            >
              <div
                style={{
                  fontFamily: "ui-serif, 'Playfair Display', serif",
                  fontSize: "clamp(36px, 9vw, 48px)",
                  marginBottom: "10px",
                  color: "#1f2937",
                }}
              >
                Olá,
              </div>

              <div
                style={{
                  fontFamily: "ui-serif, 'Playfair Display', serif",
                  fontSize: "clamp(18px, 5vw, 20px)",
                  lineHeight: 1.55,
                  color: "#334155",
                  maxWidth: "20ch",
                  margin: "0 auto",
                }}
              >
                Ficaria muito feliz se você postasse aqui as fotos de hoje.
              </div>

              <div
                style={{
                  marginTop: "10px",
                  fontSize: "15px",
                  color: "#64748b",
                }}
              >
                São lembranças importantes para mim.
              </div>
            </motion.div>

            {/* INPUT */}
            <motion.div
              className={[
                "w-full flex items-center gap-3 rounded-xl px-4 py-3 bg-white border",
                shake ? "animate-[shake_.42s_ease-in-out]" : "",
              ].join(" ")}
              style={{
                borderColor: "rgba(0,0,0,0.08)",
                boxShadow: "0 14px 40px rgba(0,0,0,0.08)",
              }}
            >
              <Lock className="w-4 h-4 text-slate-400" />

              <input
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Código do evento"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") validateAndEnter();
                }}
                className="flex-1 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                style={{
                  fontSize: "16px",
                  letterSpacing: "0.08em",
                }}
              />
            </motion.div>

            {error && (
              <p className="mt-2 text-xs text-rose-500">{error}</p>
            )}

            {/* BOTÃO */}
            <button
              onClick={validateAndEnter}
              className="mt-6 w-[85%] rounded-xl text-white"
              style={{
                padding: "14px 0",
                fontSize: "15px",
                background:
                  "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow: "0 12px 32px rgba(37,99,235,0.35)",
              }}
            >
              Abrir galeria
            </button>

            <p className="mt-3 text-[11px] text-slate-400">
              Dica: o código está na mesa do evento.
            </p>
          </div>

          <style>{`
            @keyframes shake {
              0% { transform: translateX(0); }
              20% { transform: translateX(-6px); }
              40% { transform: translateX(6px); }
              60% { transform: translateX(-4px); }
              80% { transform: translateX(4px); }
              100% { transform: translateX(0); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
