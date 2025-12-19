import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  addToQueue, 
  updateUploadStatus, 
  removeFromQueue, 
  getAllUploads,
  retryFailedUpload,
  QueuedUpload 
} from '@/lib/uploadQueue';
import { 
  validateImage, 
  convertHeicToJpeg, 
  createThumbnail,
  getImageDimensions 
} from '@/lib/imageUtils';
import { toast } from '@/hooks/use-toast';

const BATCH_SIZE = 5;
const RETRY_DELAY = 3000;

export interface UploadItem {
  id: string;
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  progress: number;
  error?: string;
}

export function useUploadQueue() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const processingRef = useRef(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Conexão restaurada",
        description: "Continuando envio das fotos...",
      });
      processQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Sem conexão",
        description: "Suas fotos serão enviadas quando a internet voltar.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load queue on mount
  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const queued = await getAllUploads();
      setUploads(queued.map(q => ({
        id: q.id,
        name: q.originalName,
        status: q.status === 'uploading' ? 'pending' : q.status,
        progress: 0,
        error: q.errorMessage,
      })));
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  };

  const uploadFile = async (queued: QueuedUpload): Promise<boolean> => {
    try {
      await updateUploadStatus(queued.id, 'uploading');
      setUploads(prev => prev.map(u => 
        u.id === queued.id ? { ...u, status: 'uploading' as const, progress: 10 } : u
      ));

      // Convert HEIC if needed
      let file = queued.file;
      if (queued.mimeType.includes('heic') || queued.mimeType.includes('heif') || 
          queued.originalName.toLowerCase().includes('.heic')) {
        file = await convertHeicToJpeg(queued.file);
        setUploads(prev => prev.map(u => 
          u.id === queued.id ? { ...u, progress: 20 } : u
        ));
      }

      // Get dimensions
      const dimensions = await getImageDimensions(file);
      setUploads(prev => prev.map(u => 
        u.id === queued.id ? { ...u, progress: 30 } : u
      ));

      // Create thumbnail
      const thumbnail = await createThumbnail(file);
      setUploads(prev => prev.map(u => 
        u.id === queued.id ? { ...u, progress: 40 } : u
      ));

      // Generate paths
      const now = new Date();
      const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
      const fileId = crypto.randomUUID();
      const ext = file.name.split('.').pop() || 'jpg';
      const storagePath = `lia-xv/${datePath}/${fileId}.${ext}`;
      const thumbPath = `lia-xv/${datePath}/${fileId}_thumb.jpg`;

      // Upload original
      const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;
      
      setUploads(prev => prev.map(u => 
        u.id === queued.id ? { ...u, progress: 70 } : u
      ));

      // Upload thumbnail
      const { error: thumbError } = await supabase.storage
        .from('event-photos')
        .upload(thumbPath, thumbnail);

      if (thumbError) {
        console.warn('Thumbnail upload failed:', thumbError);
      }

      setUploads(prev => prev.map(u => 
        u.id === queued.id ? { ...u, progress: 85 } : u
      ));

      // Insert record
      const { error: dbError } = await supabase
        .from('event_photos')
        .insert({
          event_slug: 'lia-xv',
          storage_path: storagePath,
          thumb_path: thumbError ? null : thumbPath,
          original_name: queued.originalName,
          mime_type: file.type,
          size_bytes: file.size,
          width: dimensions.width,
          height: dimensions.height,
        });

      if (dbError) throw dbError;

      // Success
      await removeFromQueue(queued.id);
      setUploads(prev => prev.map(u => 
        u.id === queued.id ? { ...u, status: 'success' as const, progress: 100 } : u
      ));

      return true;
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      await updateUploadStatus(queued.id, 'failed', errorMessage);
      setUploads(prev => prev.map(u => 
        u.id === queued.id ? { ...u, status: 'failed' as const, error: errorMessage } : u
      ));
      return false;
    }
  };

  const processQueue = useCallback(async () => {
    if (processingRef.current || !navigator.onLine) return;
    
    processingRef.current = true;
    setIsUploading(true);

    try {
      const queued = await getAllUploads();
      const pending = queued.filter(q => q.status === 'pending' || q.status === 'failed');

      // Process in batches
      for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        if (!navigator.onLine) break;
        
        const batch = pending.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(uploadFile));
      }
    } catch (error) {
      console.error('Queue processing failed:', error);
    } finally {
      processingRef.current = false;
      setIsUploading(false);
    }
  }, []);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newUploads: UploadItem[] = [];
    
    for (const file of fileArray) {
      const validation = validateImage(file);
      
      if (!validation.valid) {
        toast({
          title: "Arquivo inválido",
          description: validation.error,
          variant: "destructive",
        });
        continue;
      }

      try {
        const queued = await addToQueue(file);
        newUploads.push({
          id: queued.id,
          name: queued.originalName,
          status: 'pending',
          progress: 0,
        });
      } catch (error) {
        console.error('Failed to add file to queue:', error);
      }
    }

    if (newUploads.length > 0) {
      setUploads(prev => [...newUploads, ...prev]);
      
      toast({
        title: `${newUploads.length} foto${newUploads.length > 1 ? 's' : ''} adicionada${newUploads.length > 1 ? 's' : ''}`,
        description: navigator.onLine ? "Enviando..." : "Será enviada quando houver internet.",
      });
      
      if (navigator.onLine) {
        processQueue();
      }
    }
  }, [processQueue]);

  const retryFailed = useCallback(async (id: string) => {
    await retryFailedUpload(id);
    setUploads(prev => prev.map(u => 
      u.id === id ? { ...u, status: 'pending' as const, error: undefined } : u
    ));
    processQueue();
  }, [processQueue]);

  const retryAllFailed = useCallback(async () => {
    const failed = uploads.filter(u => u.status === 'failed');
    for (const upload of failed) {
      await retryFailedUpload(upload.id);
    }
    setUploads(prev => prev.map(u => 
      u.status === 'failed' ? { ...u, status: 'pending' as const, error: undefined } : u
    ));
    processQueue();
  }, [uploads, processQueue]);

  const removeUpload = useCallback(async (id: string) => {
    await removeFromQueue(id);
    setUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  const clearSuccessful = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status !== 'success'));
  }, []);

  return {
    uploads,
    isUploading,
    isOnline,
    addFiles,
    retryFailed,
    retryAllFailed,
    removeUpload,
    clearSuccessful,
    processQueue,
  };
}
