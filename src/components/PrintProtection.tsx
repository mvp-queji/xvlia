import { useEffect, useState } from 'react';

/**
 * Best-effort print/screenshot protection.
 * NOTE: This is NOT 100% effective - users can always find ways to capture content.
 * This simply makes it less convenient, not impossible.
 */
export function PrintProtection() {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Detect visibility change (tab switch, screenshot apps sometimes trigger this)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShowOverlay(true);
        setTimeout(() => setShowOverlay(false), 1500);
      }
    };

    // Detect blur (window loses focus)
    const handleBlur = () => {
      setShowOverlay(true);
      setTimeout(() => setShowOverlay(false), 1000);
    };

    // Detect PrintScreen key (only works for keyboard, not built-in tools)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        setShowOverlay(true);
        setTimeout(() => setShowOverlay(false), 2000);
      }
    };

    // Prevent right-click context menu on images
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.closest('.protected-image')) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div className={`print-protection-overlay ${showOverlay ? 'active' : ''}`}>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="font-display text-2xl text-foreground mb-2">
            Conteúdo Protegido
          </p>
          <p className="text-muted-foreground">
            As fotos são memórias especiais ✨
          </p>
        </div>
      </div>
    </div>
  );
}
