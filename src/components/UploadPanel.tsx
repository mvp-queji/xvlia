import { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Camera,
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  WifiOff,
  Loader2,
  ImagePlus,
  Sparkles
} from 'lucide-react';
import { useUploadQueue, UploadItem } from '@/hooks/useUploadQueue';

interface UploadPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadPanel({ isOpen, onClose }: UploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    uploads, 
    isUploading, 
    isOnline, 
    addFiles, 
    retryFailed, 
    retryAllFailed,
    removeUpload,
    clearSuccessful 
  } = useUploadQueue();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  }, [addFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const pendingCount = uploads.filter(u => u.status === 'pending' || u.status === 'uploading').length;
  const failedCount = uploads.filter(u => u.status === 'failed').length;
  const successCount = uploads.filter(u => u.status === 'success').length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-foreground/30 backdrop-blur-md z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Panel - Full screen on mobile */}
          <motion.div
            className="fixed inset-0 sm:inset-auto sm:right-4 sm:bottom-4 sm:top-auto sm:left-auto sm:w-[420px] sm:max-h-[85vh] sm:rounded-3xl z-50 bg-background flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border safe-top">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-medium">Enviar Fotos</h2>
                  <p className="text-xs text-muted-foreground">Compartilhe seus momentos</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 rounded-full hover:bg-muted transition-colors touch-target"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Offline warning */}
            <AnimatePresence>
              {!isOnline && (
                <motion.div 
                  className="px-5 py-4 bg-destructive/10 border-b border-destructive/20 flex items-center gap-3"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <WifiOff className="w-5 h-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">
                    Sem conexão. Suas fotos ficam salvas e serão enviadas quando a internet voltar 💙
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload zone */}
            <div
              className="p-5"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-12 border-2 border-dashed border-silver rounded-2xl hover:border-primary hover:bg-primary/5 transition-all duration-300 flex flex-col items-center gap-4 active:scale-[0.98]"
              >
                <motion.div 
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ImagePlus className="w-10 h-10 text-primary" />
                </motion.div>
                <div className="text-center px-4">
                  <p className="font-display text-xl text-foreground mb-1">
                    Selecionar fotos
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Envie quantas fotos quiser durante a noite!
                  </p>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  JPEG, PNG, HEIC • Máximo 15MB
                </p>
              </button>
            </div>

            {/* Stats bar */}
            <AnimatePresence>
              {uploads.length > 0 && (
                <motion.div 
                  className="px-5 py-3 bg-muted/50 border-y border-border flex items-center justify-between"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="flex items-center gap-4 text-sm">
                    {pendingCount > 0 && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        {pendingCount} enviando
                      </span>
                    )}
                    {successCount > 0 && (
                      <span className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        {successCount} ✓
                      </span>
                    )}
                    {failedCount > 0 && (
                      <span className="flex items-center gap-1.5 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        {failedCount}
                      </span>
                    )}
                  </div>
                  {failedCount > 0 && (
                    <button
                      onClick={retryAllFailed}
                      className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tentar
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2 hide-scrollbar">
              {uploads.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-silver mx-auto mb-3" />
                  <p className="text-muted-foreground font-display text-lg">
                    Nenhuma foto ainda
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Suas fotos aparecerão aqui
                  </p>
                </div>
              ) : (
                uploads.map((upload) => (
                  <UploadItemRow
                    key={upload.id}
                    upload={upload}
                    onRetry={() => retryFailed(upload.id)}
                    onRemove={() => removeUpload(upload.id)}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {successCount > 0 && (
              <div className="p-5 border-t border-border safe-bottom">
                <button
                  onClick={clearSuccessful}
                  className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted"
                >
                  Limpar enviadas
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface UploadItemRowProps {
  upload: UploadItem;
  onRetry: () => void;
  onRemove: () => void;
}

function UploadItemRow({ upload, onRetry, onRemove }: UploadItemRowProps) {
  return (
    <motion.div 
      className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      layout
    >
      {/* Status icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-muted">
        {upload.status === 'pending' && (
          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
        )}
        {upload.status === 'uploading' && (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        )}
        {upload.status === 'success' && (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        )}
        {upload.status === 'failed' && (
          <AlertCircle className="w-5 h-5 text-destructive" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{upload.name}</p>
        {upload.status === 'uploading' && (
          <div className="upload-progress mt-2">
            <motion.div 
              className="upload-progress-bar" 
              initial={{ width: 0 }}
              animate={{ width: `${upload.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        {upload.status === 'failed' && upload.error && (
          <p className="text-xs text-destructive mt-1 truncate">{upload.error}</p>
        )}
        {upload.status === 'success' && (
          <p className="text-xs text-green-600 mt-1">Enviada! ✨</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {upload.status === 'failed' && (
          <button
            onClick={onRetry}
            className="p-2.5 rounded-xl hover:bg-muted transition-colors touch-target"
            title="Tentar novamente"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        {upload.status !== 'uploading' && (
          <button
            onClick={onRemove}
            className="p-2.5 rounded-xl hover:bg-muted transition-colors touch-target"
            title="Remover"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </motion.div>
  );
}