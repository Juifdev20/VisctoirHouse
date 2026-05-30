import { useState, useEffect } from 'react';
import { alertesAPI } from '../services/api';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const typeConfig = {
  rupture_stock: { emoji: '🔴', label: 'Rupture de stock', bg: 'bg-red-50 border-red-200' },
  stock_min: { emoji: '🟠', label: 'Seuil minimum', bg: 'bg-amber-50 border-amber-200' },
  expiration: { emoji: '🟡', label: 'Expiration proche', bg: 'bg-yellow-50 border-yellow-200' },
  commande_attente: { emoji: '🔵', label: 'Commande en attente', bg: 'bg-blue-50 border-blue-200' },
  approbation: { emoji: '🟣', label: 'En attente d\'approbation', bg: 'bg-purple-50 border-purple-200' },
};

export default function Alertes() {
  const [alertes, setAlertes] = useState([]);
  const [nonLues, setNonLues] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('');

  const charger = async () => {
    setLoading(true);
    try {
      const r = await alertesAPI.lister();
      setAlertes(r.data.alertes);
      setNonLues(r.data.nonLues);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const marquerLue = async (id) => {
    try {
      await alertesAPI.marquerLue(id);
      setAlertes(a => a.map(al => al.id === id ? { ...al, lue: true } : al));
      setNonLues(n => Math.max(0, n - 1));
    } catch { toast.error('Erreur'); }
  };

  const marquerToutesLues = async () => {
    try {
      await alertesAPI.marquerToutesLues();
      setAlertes(a => a.map(al => ({ ...al, lue: true })));
      setNonLues(0);
      toast.success('Toutes les alertes marquées comme lues');
    } catch { toast.error('Erreur'); }
  };

  const filtered = filtre ? alertes.filter(a => filtre === 'non_lues' ? !a.lue : a.type_alerte === filtre) : alertes;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Centre de Notifications</h1>
          <p className="text-gray-400 text-sm">{nonLues} non lue(s) · {alertes.length} au total</p>
        </div>
        {nonLues > 0 && (
          <button onClick={marquerToutesLues} className="btn-secondary text-sm">
            <CheckCheck size={15} /> Tout marquer lu
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {[
          ['', 'Toutes'],
          ['non_lues', `Non lues (${nonLues})`],
          ['rupture_stock', '🔴 Ruptures'],
          ['stock_min', '🟠 Seuil min'],
          ['expiration', '🟡 Expirations'],
          ['commande_attente', '🔵 Commandes'],
        ].map(([val, label]) => (
          <button key={val} onClick={() => setFiltre(val)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${filtre === val ? 'bg-navy text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="spinner text-navy" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Bell size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Aucune notification dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alerte => {
            const config = typeConfig[alerte.type_alerte] || { emoji: '📢', label: alerte.type_alerte, bg: 'bg-gray-50 border-gray-200' };
            return (
              <div key={alerte.id}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${config.bg} ${!alerte.lue ? 'shadow-sm' : 'opacity-60'}`}>
                <span className="text-2xl flex-shrink-0">{config.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{config.label}</span>
                    {!alerte.lue && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>}
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{alerte.message}</p>
                  {alerte.article && (
                    <p className="text-xs text-gray-500 mt-1">Article : <strong>{alerte.article.designation}</strong> ({alerte.article.code})</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(alerte.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!alerte.lue && (
                  <button onClick={() => marquerLue(alerte.id)}
                    className="flex-shrink-0 text-xs text-primary-600 hover:text-primary-800 font-medium px-3 py-1.5 bg-white rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors">
                    Marquer lu
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
