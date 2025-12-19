import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Lock, KeyRound } from "lucide-react";

interface IntroOverlayProps {
  isVisible: boolean;
  onEnter: () => void;
}

const ACCESS_KEY = "lia_xv_access_granted_v2";

export function IntroOverlay({ isVisible, onEnter }: IntroOverlayProps) {
  const requiredCode =
    (import.meta.env.VITE_EVENT_ACCESS_CODE as string | undefined) ?? "1500";

  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const messages = useMemo(
    () => [
      "Olá…",
      "Ficaria muito feliz se você postasse aqui as fotos que tirar hoje.",
      "São lembranças importantes para mim.",
    ],
    []
  );

  // Se já liberou antes, entra direto
  useEffect(() => {
    if (!isVisible) return;
    const granted = localStorage.getItem(ACCESS_KEY) === "true";
    if (granted) onEnter();
  }, [isVisible, onEnter]);

  // Sequência de texto
  useEffect(() => {
    if (!isVisible) return;
    setStep(0);
    const t1 = setTimeout(() => setStep(1), 850);
    const t2 = setTimeout(() => setStep(2), 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isVisible]);

  // Parallax leve
  useEffect(() => {
    if (!isVisible) return;

    const onMouseMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      setTilt({ x: nx * 5, y: ny * 5 });
    };

    const onDevice = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 0;
      const x = Math.max(-6, Math.min(6, gamma / 7));
      const y = Math.max(-6, Math.min(6, (beta - 20) / 12));
      setTilt({ x, y });
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("deviceorientation", onDevice as any, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", onMouseMove as any);
      window.removeEventListener("deviceorientation", onDevice as any);
    };
  }, [isVisible]);

  const validateAndEnter = () => {
    const normalized = code.trim();
    if (!normalized) {
      setError("Digite o código para abrir.");
      setShake(true);
      setTimeout(() => setShake(false), 420);
      return;
    }

    if (normalized !== requiredCode) {
      setError("Código incorreto. Tente novamente.");
      setShake(true);
      setTimeout(() => setShake(false), 420);
      return;
    }

    setError(null);
    localStorage.setItem(ACCESS_KEY, "true");
    onEnter();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-50 overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* BASE */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#e8f2ff] via-[#f6fbff] to-white" />

          {/* BLOBS / LIGHTS (parallax) */}
          <motion.div
            className="absolute inset-0"
            style={{
              transform: `translate3d(${tilt.x * 1.3}px, ${tilt.y * 1.3}px, 0)`,
            }}
          >
            <motion.div
              className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/65 blur-3xl"
              animate={{ opacity: [0.12, 0.26, 0.12], scale: [1, 1.06, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-6 -right-28 h-[420px] w-[420px] rounded-full bg-[#cfe6ff]/55 blur-3xl"
              animate={{ opacity: [0.10, 0.22, 0.10], scale: [1, 1.09, 1] }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.8,
              }}
            />
            <motion.div
              className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-white/55 blur-3xl"
              animate={{ opacity: [0.08, 0.18, 0.08], scale: [1, 1.05, 1] }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.4,
              }}
            />
          </motion.div>

          {/* STARDUST */}
          <motion.div
            className="absolute inset-0 opacity-60"
            style={{
              transform: `translate3d(${tilt.x * 2.0}px, ${tilt.y * 2.0}px, 0)`,
              backgroundImage:
                "radial-gradient(circle at 12% 18%, rgba(255,255,255,.9) 0 1px, transparent 2px)," +
                "radial-gradient(circle at 72% 22%, rgba(255,255,255,.7) 0 1px, transparent 2px)," +
                "radial-gradient(circle at 28% 62%, rgba(255,255,255,.55) 0 1px, transparent 2px)," +
                "radial-gradient(circle at 86% 74%, rgba(255,255,255,.75) 0 1px, transparent 2px)",
            }}
          />

          {/* VEIL */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/10 to-white/45" />

          {/* WATERMARK XV — fundo de verdade */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `translate3d(${tilt.x * 1.6}px, ${tilt.y * 1.6}px, 0)`,
              zIndex: 0,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: 0.14, // baixa presença (não compete)
                filter: "blur(0.25px)",
              }}
            >
              <div
                className="select-none leading-none tracking-tight"
                style={{
                  fontSize: "clamp(220px, 58vw, 460px)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(220,230,245,0.85) 35%, rgba(170,185,210,0.60) 70%, rgba(255,255,255,0.70) 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "0 80px 180px rgba(0,0,0,0.08)",
                  fontFamily: "ui-serif, 'Playfair Display', serif",
                }}
              >
                XV
              </div>
            </div>
          </motion.div>

          {/* CONTEÚDO (acima do fundo) */}
          <div
            className="relative z-10 min-h-[100dvh] w-full"
            style={{
              paddingTop: "calc(env(safe-area-inset-top) + 16px)",
              paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
            }}
          >
            <div className="mx-auto h-full w-full max-w-[420px] px-6">
              <div
                className="grid h-[100dvh]"
                style={{
                  gridTemplateRows: "1fr auto auto",
                  rowGap: "clamp(12px, 2.2vh, 22px)",
                }}
              >
                {/* TOP spacer */}
                <div />

                {/* CENTRO: XV + texto sem card */}
                <div className="flex flex-col items-center text-center">
                  {/* XV principal (âncora) */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.965 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.85,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="mb-2"
                    style={{ zIndex: 10 }}
                  >
                    <div
                      className="select-none leading-none tracking-tight"
                      style={{
                        fontSize: "clamp(92px, 23vw, 145px)",
                        background:
                          "linear-gradient(180deg, #ffffff 0%, #eef2f8 25%, #cfd8e6 55%, #f8f9fc 75%, #b6c2d3 100%)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        textShadow: "0 26px 70px rgba(0,0,0,0.12)",
                        fontFamily: "ui-serif, 'Playfair Display', serif",
                      }}
                    >
                      XV
                    </div>
                  </motion.div>

                  {/* Mensagens (sem card) */}
                  <div
                    className="w-full flex items-center justify-center"
                    style={{ minHeight: "clamp(78px, 12vh, 110px)" }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{
                          duration: 0.5,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="text-slate-700"
                        style={{
                          fontSize: "clamp(18px, 4.6vw, 22px)",
                          lineHeight: 1.55,
                          fontFamily: "ui-serif, 'Playfair Display', serif",
                          maxWidth: "24ch",
                          textShadow: "0 10px 30px rgba(255,255,255,0.8)", // leve “lift” sem card
                        }}
                      >
                        {messages[Math.min(step, messages.length - 1)]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>

                {/* BASE: input + botão */}
                <div className="pb-2">
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.1 }}
                    className="w-full"
                  >
                    {/* Input clean (sem exagero visual) */}
                    <motion.div
                      className={[
                        "flex items-center gap-3 rounded-2xl border border-white/60 bg-white/72 backdrop-blur-md px-4 py-2.5",
                        "shadow-[0_16px_50px_rgba(0,0,0,0.08)]",
                        shake ? "animate-[shake_.42s_ease-in-out]" : "",
                      ].join(" ")}
                      style={{
                        boxShadow:
                          "0 16px 50px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.55)",
                      }}
                    >
                      <div className="grid place-items-center h-9 w-9 rounded-xl bg-white/85">
                        <KeyRound className="w-5 h-5 text-slate-500" />
                      </div>

                      <input
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Código do evento"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          setError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") validateAndEnter();
                        }}
                        className="flex-1 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                        style={{
                          fontSize: "16px",
                          letterSpacing: "0.01em",
                          fontFamily:
                            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
                        }}
                      />

                      <div className="grid place-items-center h-9 w-9 rounded-xl bg-white/85">
                        <Lock className="w-5 h-5 text-slate-500" />
                      </div>
                    </motion.div>

                    {error && (
                      <p className="mt-2 text-xs text-rose-500">{error}</p>
                    )}

                    <button
                      onClick={validateAndEnter}
                      className="btn-princess w-full mt-4 flex items-center justify-center gap-2"
                      style={{
                        paddingTop: "12px",
                        paddingBottom: "12px",
                        fontSize: "15px",
                        borderRadius: "18px",
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Abrir galeria</span>
                    </button>

                    <p className="mt-3 text-[11px] text-slate-400 text-center">
                      Dica: o código está na mesa do evento.
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
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
