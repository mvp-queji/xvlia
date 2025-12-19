import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface UploadQueueDB extends DBSchema {
  pendingUploads: {
    key: string;
    value: {
      id: string;
      file: File;
      originalName: string;
      mimeType: string;
      status: 'pending' | 'uploading' | 'failed';
      retryCount: number;
      createdAt: number;
      errorMessage?: string;
    };
    indexes: { 'by-status': string };
  };
}

let db: IDBPDatabase<UploadQueueDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<UploadQueueDB>> {
  if (db) return db;
  
  db = await openDB<UploadQueueDB>('lia-xv-uploads', 1, {
    upgrade(database) {
      const store = database.createObjectStore('pendingUploads', { keyPath: 'id' });
      store.createIndex('by-status', 'status');
    },
  });
  
  return db;
}

export interface QueuedUpload {
  id: string;
  file: File;
  originalName: string;
  mimeType: string;
  status: 'pending' | 'uploading' | 'failed';
  retryCount: number;
  createdAt: number;
  errorMessage?: string;
}

export async function addToQueue(file: File): Promise<QueuedUpload> {
  const database = await getDB();
  const id = crypto.randomUUID();
  
  const upload: QueuedUpload = {
    id,
    file,
    originalName: file.name,
    mimeType: file.type,
    status: 'pending',
    retryCount: 0,
    createdAt: Date.now(),
  };
  
  await database.add('pendingUploads', upload);
  return upload;
}

export async function updateUploadStatus(
  id: string, 
  status: QueuedUpload['status'], 
  errorMessage?: string
): Promise<void> {
  const database = await getDB();
  const upload = await database.get('pendingUploads', id);
  
  if (upload) {
    upload.status = status;
    if (errorMessage) upload.errorMessage = errorMessage;
    if (status === 'failed') upload.retryCount++;
    await database.put('pendingUploads', upload);
  }
}

export async function removeFromQueue(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('pendingUploads', id);
}

export async function getPendingUploads(): Promise<QueuedUpload[]> {
  const database = await getDB();
  return database.getAllFromIndex('pendingUploads', 'by-status', 'pending');
}

export async function getFailedUploads(): Promise<QueuedUpload[]> {
  const database = await getDB();
  return database.getAllFromIndex('pendingUploads', 'by-status', 'failed');
}

export async function getAllUploads(): Promise<QueuedUpload[]> {
  const database = await getDB();
  return database.getAll('pendingUploads');
}

export async function retryFailedUpload(id: string): Promise<void> {
  const database = await getDB();
  const upload = await database.get('pendingUploads', id);
  
  if (upload) {
    upload.status = 'pending';
    await database.put('pendingUploads', upload);
  }
}

export async function clearCompleted(): Promise<void> {
  const database = await getDB();
  const all = await database.getAll('pendingUploads');
  
  for (const upload of all) {
    if (upload.status !== 'pending' && upload.status !== 'uploading') {
      await database.delete('pendingUploads', upload.id);
    }
  }
}
