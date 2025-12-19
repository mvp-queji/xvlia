import { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface LightboxPhoto {
  id: string;
  url: string;
  name: string;
}

interface LightboxModalProps {
  photos: LightboxPhoto[];
  selectedIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function LightboxModal({ photos, selectedIndex, onClose, onNavigate }: LightboxModalProps) {
  const isOpen = selectedIndex !== null;
  const currentPhoto = selectedIndex !== null ? photos[selectedIndex] : null;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const constraintsRef = useRef(null);

  const goNext = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setImageLoaded(false);
      onNavigate(selectedIndex + 1);
    }
  }, [selectedIndex, photos.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setImageLoaded(false);
      onNavigate(selectedIndex - 1);
    }
  }, [selectedIndex, onNavigate]);

  // Handle swipe gestures
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(velocity) > 500 || Math.abs(offset) > threshold) {
      if (offset > 0 || velocity > 500) {
        goPrev();
      } else if (offset < 0 || velocity < -500) {
        goNext();
      }
    }
    setDragOffset(0);
  }, [goNext, goPrev]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
        case 'ArrowRight':
          goNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goNext, goPrev]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset loaded state when photo changes
  useEffect(() => {
    setImageLoaded(false);
  }, [currentPhoto?.id]);

  return (
    <AnimatePresence>
      {isOpen && currentPhoto && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onContextMenu={(e) => e.preventDefault()}
          ref={constraintsRef}
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-foreground/95 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Close button */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-4 rounded-full bg-background/10 hover:bg-background/20 transition-colors touch-target safe-top"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.1 }}
          >
            <X className="w-6 h-6 text-background" />
          </motion.button>

          {/* Navigation buttons - Hidden on mobile, show on desktop */}
          {selectedIndex !== null && selectedIndex > 0 && (
            <motion.button
              onClick={goPrev}
              className="absolute left-4 z-20 p-4 rounded-full bg-background/10 hover:bg-background/20 transition-colors hidden sm:flex"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ChevronLeft className="w-6 h-6 text-background" />
            </motion.button>
          )}

          {selectedIndex !== null && selectedIndex < photos.length - 1 && (
            <motion.button
              onClick={goNext}
              className="absolute right-4 z-20 p-4 rounded-full bg-background/10 hover:bg-background/20 transition-colors hidden sm:flex"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ChevronRight className="w-6 h-6 text-background" />
            </motion.button>
          )}

          {/* Image container with swipe support */}
          <motion.div
            className="relative w-full h-full flex items-center justify-center px-4 py-20 sm:px-12"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDrag={(_, info) => setDragOffset(info.offset.x)}
            onDragEnd={handleDragEnd}
            style={{ x: dragOffset * 0.3 }}
          >
            {/* Loading spinner */}
            <AnimatePresence>
              {!imageLoaded && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="w-10 h-10 text-background/50 animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image */}
            <motion.img
              key={currentPhoto.id}
              src={currentPhoto.url}
              alt={currentPhoto.name}
              className={`protected-image max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              draggable={false}
              onLoad={() => setImageLoaded(true)}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: imageLoaded ? 1 : 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            />
          </motion.div>

          {/* Counter and swipe hint */}
          <motion.div 
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 safe-bottom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.15 }}
          >
            <div className="px-5 py-2.5 rounded-full bg-background/15 backdrop-blur-md text-background text-sm">
              {(selectedIndex ?? 0) + 1} / {photos.length}
            </div>
            <p className="text-background/50 text-xs sm:hidden">
              ← deslize para navegar →
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}