import { motion, AnimatePresence } from 'framer-motion';
import { Camera } from 'lucide-react';

interface StickyUploadButtonProps {
  isVisible: boolean;
  onClick: () => void;
  pendingCount: number;
}

export function StickyUploadButton({ isVisible, onClick, pendingCount }: StickyUploadButtonProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={onClick}
          className="btn-fab bottom-6 right-6 safe-bottom"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          whileTap={{ scale: 0.9 }}
        >
          <Camera className="w-6 h-6 text-primary-foreground" />
          
          {/* Pending badge */}
          <AnimatePresence>
            {pendingCount > 0 && (
              <motion.span
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                {pendingCount > 9 ? '9+' : pendingCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </AnimatePresence>
  );
}