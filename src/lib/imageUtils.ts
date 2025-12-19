import heic2any from 'heic2any';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
const THUMB_MAX_SIZE = 400;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImage(file: File): ValidationResult {
  // Check file type
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  // HEIC files sometimes don't have proper MIME type
  const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif') || 
                 fileType === 'image/heic' || fileType === 'image/heif';
  
  if (!ALLOWED_TYPES.includes(fileType) && !isHeic) {
    return { valid: false, error: `Formato não suportado: ${file.type || 'desconhecido'}. Use JPEG, PNG ou HEIC.` };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `Arquivo muito grande (${sizeMB}MB). Máximo: 15MB.` };
  }
  
  return { valid: true };
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif') || 
                 fileType === 'image/heic' || fileType === 'image/heif';
  
  if (!isHeic) return file;
  
  try {
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });
    
    const blob = Array.isArray(result) ? result[0] : result;
    const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (error) {
    console.error('HEIC conversion failed:', error);
    // Return original file if conversion fails
    return file;
  }
}

export async function createThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    img.onload = () => {
      // Calculate dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > THUMB_MAX_SIZE) {
          height = (height * THUMB_MAX_SIZE) / width;
          width = THUMB_MAX_SIZE;
        }
      } else {
        if (height > THUMB_MAX_SIZE) {
          width = (width * THUMB_MAX_SIZE) / height;
          height = THUMB_MAX_SIZE;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        },
        'image/jpeg',
        0.8
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
