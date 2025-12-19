import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IntroOverlay } from "@/components/IntroOverlay";
import { HeroSection } from "@/components/HeroSection";
import { UploadPanel } from "@/components/UploadPanel";
import { GalleryGrid } from "@/components/GalleryGrid";
import { PrintProtection } from "@/components/PrintProtection";
import { StickyUploadButton } from "@/components/StickyUploadButton";
import { Stardust } from "@/components/Stardust";
import { useUploadQueue } from "@/hooks/useUploadQueue";

import heroBg from "@/assets/hero.jpeg";

const INTRO_SEEN_KEY = "lia_xv_intro_seen";

export default function LiaXV() {
  const [showIntro, setShowIntro] = useState(true);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [showStickyButton, setShowStickyButton] = useState(false);
  const { uploads } = useUploadQueue();

  const pendingCount = uploads.filter(
    (u) => u.status === "pending" || u.status === "uploading"
  ).length;

  useEffect(() => {
    const seen = localStorage.getItem(INTRO_SEEN_KEY);
    if (seen === "true") setShowIntro(false);
  }, []);

  const handleEnterGallery = () => {
    setShowIntro(false);
    localStorage.setItem(INTRO_SEEN_KEY, "true");
  };

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      setShowStickyButton(window.scrollY > heroHeight * 0.6);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToGallery = () => {
    const gallery = document.getElementById("gallery");
    gallery?.scrollIntoView({ behavior: "smooth" });
  };

  const handleUploadClick = () => setShowUploadPanel(true);

  return (
    <div className="min-h-screen relative scroll-smooth overflow-x-hidden">
      {/* BACKGROUND GLOBAL */}
      {!showIntro && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Base image */}
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${heroBg})` }}
          />

          {/* Soft wash */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/45 to-white/80" />

          {/* Animated texture */}
          <motion.div
            className="absolute inset-0 opacity-35 mix-blend-screen"
            style={{
              backgroundImage: `url(${heroBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(2px)",
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 0.35,
              scale: [1, 1.03, 1],
              y: [0, -12, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Stardust */}
          <motion.div
            className="absolute inset-0 opacity-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <Stardust density="low" />
          </motion.div>
        </div>
      )}

      {/* Intro overlay (fica acima do BG) */}
      <div className="relative z-20">
        <IntroOverlay isVisible={showIntro} onEnter={handleEnterGallery} />
      </div>

      {/* Main content (acima do BG) */}
      <motion.main
        className="relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: showIntro ? 0 : 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <HeroSection onUploadClick={handleUploadClick} onGalleryClick={scrollToGallery} />

        <GalleryGrid />

        <footer className="py-14 px-5 text-center border-t border-border/40 bg-gradient-to-b from-white/40 to-white/80">
          <p className="font-display text-xl text-muted-foreground mb-2">
            Obrigada por registrar esse momento comigo
          </p>
          <p className="text-sm text-muted-foreground mb-7">
            Com carinho,{" "}
            <span className="signature text-lg text-primary-deep">Lia</span>{" "}
            💙
          </p>

        </footer>
      </motion.main>

      {/* Upload panel */}
      <div className="relative z-30">
        <UploadPanel isOpen={showUploadPanel} onClose={() => setShowUploadPanel(false)} />
      </div>

      {/* Sticky upload button */}
      <div className="relative z-30">
        <StickyUploadButton
          isVisible={showStickyButton && !showUploadPanel}
          onClick={handleUploadClick}
          pendingCount={pendingCount}
        />
      </div>

      {/* Print protection overlay */}
      <div className="relative z-40">
        <PrintProtection />
      </div>
    </div>
  );
}
