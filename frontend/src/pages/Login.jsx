import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', mot_de_passe: '' });
  const [showMdp, setShowMdp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.mot_de_passe) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.mot_de_passe);
      toast.success('Connexion réussie — Bienvenue !');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-primary-800 to-primary-900 flex items-center justify-center p-4">
      {/* Motif de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-5 bg-white" style={{
            width: `${100 + i * 80}px`, height: `${100 + i * 80}px`,
            top: `${10 + i * 12}%`, left: `${-5 + i * 15}%`
          }} />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Titre */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="La Victoire House" className="w-28 h-28 rounded-3xl shadow-2xl mb-5 object-cover block mx-auto" />
          <h1 className="text-3xl font-bold text-white font-poppins tracking-tight">LA VICTOIRE HOUSE</h1>
          <p className="text-white/60 mt-2 text-sm">Beni, Nord-Kivu — République Démocratique du Congo</p>
          <div className="mt-3 inline-block px-4 py-1.5 bg-white/10 rounded-full">
            <p className="text-gold-400 text-xs font-semibold tracking-wider uppercase">Gestion des Stocks</p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-1 font-poppins">Connexion</h2>
          <p className="text-gray-400 text-sm mb-7">Accédez à votre espace de gestion</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Adresse email</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="votre@email.cd"
                  className="input-field pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showMdp ? 'text' : 'password'}
                  value={form.mot_de_passe}
                  onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowMdp(!showMdp)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showMdp ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-navy text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-primary-800 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <><Loader2 size={18} className="spinner" /> Connexion en cours...</> : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          © 2026 La Victoire House — Système de Gestion des Stocks v1.0
        </p>
      </div>
    </div>
  );
}
