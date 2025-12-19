// src/pages/AdminLogin.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  /* ================= AUTH CHECK ================= */

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', session.user.id)
          .single();

        if (profile?.is_admin) {
          navigate('/admin/lia-xv');
        }
      }
      setCheckingAuth(false);
    };

    check();
  }, [navigate]);

  /* ================= LOGIN ================= */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', data.user.id)
        .single();

      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        throw new Error('Acesso não autorizado.');
      }

      navigate('/admin/lia-xv');
    } catch (err) {
      toast({
        title: 'Falha no acesso',
        description:
          err instanceof Error ? err.message : 'Credenciais inválidas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* FOTO REAL DE FUNDO */}
      <img
        src="/heroxv.jpeg"
        alt="XV da Lia"
        className="absolute inset-0 h-full w-full object-cover scale-110"
        draggable={false}
      />

      {/* BLUR + CORREÇÃO DE CONTRASTE */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/55" />

      {/* CONTEÚDO */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div
            className="rounded-3xl border border-white/60 bg-white/65 backdrop-blur-xl"
            style={{
              boxShadow:
                '0 30px 90px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.75)',
              padding: 'clamp(20px, 6vw, 28px)',
            }}
          >
            <form onSubmit={handleLogin} className="space-y-5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full rounded-xl bg-white/85 px-4 py-3 text-base outline-none border border-white/60 focus:border-primary/40"
                style={{ fontSize: '16px' }}
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                required
                className="w-full rounded-xl bg-white/85 px-4 py-3 text-base outline-none border border-white/60 focus:border-primary/40"
                style={{ fontSize: '16px' }}
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-princess w-full py-3.5 text-base disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <a
                href="/lia-xv"
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Voltar para a galeria
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
