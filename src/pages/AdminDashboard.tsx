// src/pages/AdminDashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatFileSize } from '@/lib/imageUtils';
import {
  Loader2,
  LogOut,
  Download,
  Check,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Photo {
  id: string;
  storage_path: string;
  thumb_path: string | null;
  original_name: string | null;
  size_bytes: number | null;
  created_at: string;
  is_hidden: boolean;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [downloading, setDownloading] = useState(false);

  /* ================= AUTH ================= */

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/admin/lia-xv/login');

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        navigate('/admin/lia-xv/login');
        return;
      }

      fetchPhotos();
    };

    run();
  }, [navigate]);

  /* ================= DATA ================= */

  const fetchPhotos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('event_photos')
      .select('*')
      .eq('event_slug', 'lia-xv')
      .order('created_at', { ascending: false });

    setPhotos(
      (data || []).map(p => ({
        ...p,
        is_hidden: p.is_hidden ?? false,
      }))
    );
    setLoading(false);
  };

  /* ================= ACTIONS ================= */

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleVisibility = async (photo: Photo) => {
    await supabase
      .from('event_photos')
      .update({ is_hidden: !photo.is_hidden })
      .eq('id', photo.id);

    setPhotos(prev =>
      prev.map(p =>
        p.id === photo.id ? { ...p, is_hidden: !p.is_hidden } : p
      )
    );
  };

  const downloadSelected = useCallback(async () => {
    if (!selected.size) return;

    setDownloading(true);

    for (const photo of photos.filter(p => selected.has(p.id))) {
      const { data } = await supabase.storage
        .from('event-photos')
        .createSignedUrl(photo.storage_path, 60);

      if (data?.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = photo.original_name || 'foto.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await new Promise(r => setTimeout(r, 350));
      }
    }

    toast({ title: 'Download iniciado' });
    setDownloading(false);
  }, [selected, photos]);

  /* ================= FILTER ================= */

  const filtered = photos.filter(p => {
    if (filter === 'hidden') return p.is_hidden;
    if (filter === 'visible') return !p.is_hidden;
    return true;
  });

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg">Admin · XV da Lia</h1>
            <p className="text-xs text-muted-foreground">Painel do evento</p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/admin/lia-xv/login');
            }}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* STATS */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        <Stat
          icon={<ImageIcon />}
          value={photos.length}
          label="Fotos"
        />
        <Stat
          icon={<Download />}
          value={formatFileSize(
            photos.reduce((a, p) => a + (p.size_bytes || 0), 0)
          )}
          label="Total"
        />
      </div>

      {/* FILTER */}
      <div className="px-4 flex gap-2 mb-3">
        <Filter active={filter === 'all'} onClick={() => setFilter('all')}>
          Todas
        </Filter>
        <Filter active={filter === 'visible'} onClick={() => setFilter('visible')}>
          Visíveis
        </Filter>
        <Filter active={filter === 'hidden'} onClick={() => setFilter('hidden')}>
          Ocultas
        </Filter>
      </div>

      {/* GRID */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {filtered.map(photo => (
          <motion.div
            key={photo.id}
            whileTap={{ scale: 0.97 }}
            className={`relative rounded-xl overflow-hidden border ${
              selected.has(photo.id) ? 'border-primary' : 'border-transparent'
            }`}
            onClick={() => toggleSelect(photo.id)}
          >
            <img
              src={
                supabase.storage
                  .from('event-photos')
                  .getPublicUrl(photo.thumb_path || photo.storage_path)
                  .data.publicUrl
              }
              className={`w-full aspect-square object-cover ${
                photo.is_hidden ? 'opacity-40 grayscale' : ''
              }`}
              draggable={false}
            />

            {/* CHECK */}
            {selected.has(photo.id) && (
              <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                <Check className="w-4 h-4" />
              </div>
            )}

            {/* VISIBILITY */}
            <button
              onClick={e => {
                e.stopPropagation();
                toggleVisibility(photo);
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white"
            >
              {photo.is_hidden ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* ACTION BAR */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-background border-t px-4 py-3 flex gap-3">
          <button
            onClick={downloadSelected}
            disabled={downloading}
            className="btn-princess flex-1 py-3 text-base"
          >
            {downloading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Baixar ({selected.size})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: any;
  label: string;
}) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Filter({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded-full text-sm ${
        active
          ? 'bg-primary text-white'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {children}
    </button>
  );
}
