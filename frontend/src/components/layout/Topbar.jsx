import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, Bell, User, LogOut, Settings, ChevronDown, Sun, Moon,
  ChevronLeft, RefreshCw, Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { alertesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const roleLabel = {
  gerant: 'Gérant',
  agent_stock: 'Agent de Stock',
  caissier: 'Caissier',
  agent_securite: 'Sécurité',
};

const searchRoutes = [
  { keys: ['article', 'produit', 'stock'], path: '/articles' },
  { keys: ['client', 'acheteur'], path: '/clients' },
  { keys: ['fournisseur', 'supplier'], path: '/fournisseurs' },
  { keys: ['facture', 'invoice'], path: '/caisse/factures' },
  { keys: ['reçu', 'recu', 'paiement'], path: '/caisse/recus' },
  { keys: ['commande', 'bon commande'], path: '/operations/commandes' },
  { keys: ['sortie', 'bon sortie'], path: '/operations/sorties' },
  { keys: ['réception', 'reception'], path: '/operations/receptions' },
  { keys: ['inventaire'], path: '/inventaire' },
  { keys: ['rapport', 'statistique'], path: '/rapports' },
  { keys: ['alerte', 'notification'], path: '/alertes' },
  { keys: ['utilisateur', 'user'], path: '/utilisateurs' },
];

export default function Topbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [alertesOpen, setAlertesOpen] = useState(false);
  const [alertes, setAlertes] = useState([]);
  const [nonLues, setNonLues] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchAlertes = async () => {
      try {
        const res = await alertesAPI.lister();
        setAlertes(res.data.alertes || []);
        setNonLues(res.data.nonLues || 0);
      } catch {}
    };
    fetchAlertes();
    const interval = setInterval(fetchAlertes, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setAlertesOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const marquerToutesLues = async () => {
    await alertesAPI.marquerToutesLues();
    setNonLues(0);
    setAlertes(a => a.map(al => ({ ...al, lue: true })));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    const match = searchRoutes.find(r => r.keys.some(k => q.includes(k)));
    if (match) {
      navigate(match.path);
      setSearchQuery('');
    } else {
      toast('Aucune page trouvée pour cette recherche.', { icon: '🔍' });
    }
  };

  const typeAlerteCouleur = {
    rupture_stock: 'bg-red-900/40 text-red-300',
    stock_min: 'bg-amber-900/40 text-amber-300',
    expiration: 'bg-yellow-900/40 text-yellow-300',
    commande_attente: 'bg-blue-900/40 text-blue-300',
    approbation: 'bg-purple-900/40 text-purple-300',
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-14 flex items-center gap-3 px-3 md:px-5 flex-shrink-0 z-10">

      {/* ── Gauche : hamburger (mobile) + navigation ── */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Menu size={20} />
        </button>
        <img src="/logo.png" alt="La Victoire House" className="lg:hidden w-8 h-8 rounded-lg object-cover shadow-sm ml-1 flex-shrink-0" />

        {/* Boutons navigation */}
        <div className="hidden lg:flex items-center gap-0.5">
          <button
            onClick={() => navigate(-1)}
            title="Page précédente"
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => window.location.reload()}
            title="Actualiser"
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Centre : barre de recherche ── */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher un article, client, facture..."
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-navy dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
          />
        </div>
      </form>

      {/* ── Droite : actions + utilisateur ── */}
      <div className="flex items-center gap-1 flex-shrink-0" ref={dropdownRef}>

        {/* Toggle dark / light */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Mode clair' : 'Mode sombre'}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setAlertesOpen(!alertesOpen); setDropdownOpen(false); }}
            className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell size={18} />
            {nonLues > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {nonLues > 9 ? '9+' : nonLues}
              </span>
            )}
          </button>

          {alertesOpen && (
            <div className="absolute right-0 top-11 w-80 bg-gray-900 dark:bg-gray-950 rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <span className="font-semibold text-white font-poppins text-sm">Notifications</span>
                {nonLues > 0 && (
                  <button onClick={marquerToutesLues} className="text-xs text-gold-400 hover:underline">
                    Tout marquer lu
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {alertes.length === 0 ? (
                  <p className="text-center text-white/30 py-8 text-sm">Aucune notification</p>
                ) : alertes.slice(0, 8).map(al => (
                  <div key={al.id} className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!al.lue ? 'bg-blue-500/10' : ''}`}>
                    <div className="flex items-start gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${typeAlerteCouleur[al.type_alerte] || 'bg-white/10 text-white/60'}`}>
                        {al.type_alerte === 'rupture_stock' ? '🔴' : al.type_alerte === 'stock_min' ? '🟠' : al.type_alerte === 'expiration' ? '🟡' : '🔵'}
                      </span>
                      <p className="text-xs text-white/70 leading-relaxed">{al.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-white/10">
                <button
                  onClick={() => { navigate('/alertes'); setAlertesOpen(false); }}
                  className="w-full text-xs text-gold-400 hover:text-gold-300 font-medium"
                >
                  Voir toutes les alertes →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Menu utilisateur */}
        <div className="relative">
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setAlertesOpen(false); }}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate max-w-28">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-[10px] text-navy dark:text-gold-400 uppercase tracking-widest font-medium">
                {roleLabel[user?.role] || user?.role}
              </p>
            </div>
            <ChevronDown size={13} className="text-gray-400 dark:text-gray-500 hidden md:block flex-shrink-0" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 w-52 bg-gray-900 dark:bg-gray-950 rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden animate-fade-in">
              <div className="p-3 border-b border-white/10">
                <p className="text-sm font-semibold text-white">{user?.prenom} {user?.nom}</p>
                <p className="text-xs text-white/40 mt-0.5">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => { navigate('/profil'); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <User size={15} /> Mon profil
                </button>
                {user?.role === 'gerant' && (
                  <button
                    onClick={() => { navigate('/parametres'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <Settings size={15} /> Paramètres
                  </button>
                )}
                <hr className="my-1.5 border-white/10" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <LogOut size={15} /> Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
