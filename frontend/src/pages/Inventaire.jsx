import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventairesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Eye, Loader2, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

const statutLabel = { en_cours: 'En cours', soumis: 'Soumis', approuve: 'Approuvé', rejete: 'Rejeté' };
const statutColor = { en_cours: 'badge-alerte', soumis: 'badge-info', approuve: 'badge-ok', rejete: 'badge-rupture' };
const typeLabel = { QUOTIDIEN: 'Quotidien (Catégorie A)', HEBDO: 'Hebdomadaire (A+B)', MENSUEL: 'Mensuel (complet)', ANNUEL: 'Annuel (général)' };

export default function Inventaire() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNouveauForm, setShowNouveauForm] = useState(false);
  const [form, setForm] = useState({ type: 'QUOTIDIEN', observations: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { inventairesAPI.lister().then(r => setItems(r.data)).finally(() => setLoading(false)); }, []);

  const creer = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await inventairesAPI.creer(form);
      toast.success('Inventaire créé');
      navigate(`/inventaire/${res.data.inventaire_id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setCreating(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Gestion des Inventaires</h1>
          <p className="text-gray-400 text-sm">{items.length} inventaire(s) enregistré(s)</p>
        </div>
        {hasRole('gerant', 'agent_stock') && (
          <button onClick={() => setShowNouveauForm(!showNouveauForm)} className="btn-primary">
            <Plus size={17} /> Nouvel inventaire
          </button>
        )}
      </div>

      {/* Formulaire création */}
      {showNouveauForm && (
        <form onSubmit={creer} className="card border-2 border-navy/10 space-y-4">
          <h3 className="section-title">Lancer un nouvel inventaire</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Type d'inventaire</label>
              <select className="select-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Observations / Motif</label>
              <input className="input-field" value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} />
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            ⚠️ Les lignes seront générées automatiquement selon le type choisi. Le stock théorique sera figé au moment de la création.
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowNouveauForm(false)} className="btn-secondary text-sm">Annuler</button>
            <button type="submit" disabled={creating} className="btn-primary text-sm">
              {creating ? <Loader2 size={14} className="spinner" /> : <ClipboardList size={15} />} Lancer l'inventaire
            </button>
          </div>
        </form>
      )}

      {/* Explication */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { type: 'Quotidien', desc: 'Articles A uniquement', freq: 'Chaque jour ouvrable', couleur: 'text-red-600', bg: 'bg-red-50' },
          { type: 'Hebdomadaire', desc: 'Articles A + B', freq: 'Chaque semaine', couleur: 'text-amber-600', bg: 'bg-amber-50' },
          { type: 'Mensuel', desc: 'Tous les articles (A+B+C)', freq: 'Fin de mois', couleur: 'text-blue-600', bg: 'bg-blue-50' },
          { type: 'Annuel', desc: 'Inventaire général complet', freq: 'Fin d\'exercice', couleur: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(item => (
          <div key={item.type} className={`card py-3 px-4 border-l-4 ${item.bg}`} style={{ borderLeftColor: 'currentColor' }}>
            <p className={`font-semibold text-sm ${item.couleur}`}>{item.type}</p>
            <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
            <p className="text-xs text-gray-400 mt-1">{item.freq}</p>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-header rounded-tl-2xl">Date</th>
              <th className="table-header">Type</th>
              <th className="table-header hidden sm:table-cell">Agent responsable</th>
              <th className="table-header hidden md:table-cell">Observations</th>
              <th className="table-header">Statut</th>
              <th className="table-header rounded-tr-2xl text-center">Action</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="py-16 text-center"><Loader2 size={28} className="spinner text-navy mx-auto" /></td></tr>
              : items.length === 0 ? <tr><td colSpan={6} className="py-16 text-center text-gray-400 text-sm">Aucun inventaire enregistré</td></tr>
              : items.map((inv, i) => (
                <tr key={inv.id} className={`table-row ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="table-cell text-sm">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                  <td className="table-cell font-medium text-gray-800">{typeLabel[inv.type] || inv.type}</td>
                  <td className="table-cell hidden sm:table-cell text-gray-600 text-sm">{inv.agent?.prenom} {inv.agent?.nom}</td>
                  <td className="table-cell hidden md:table-cell text-gray-500 text-xs truncate max-w-[180px]">{inv.observations || '—'}</td>
                  <td className="table-cell"><span className={statutColor[inv.statut]}>{statutLabel[inv.statut]}</span></td>
                  <td className="table-cell text-center">
                    <button onClick={() => navigate(`/inventaire/${inv.id}`)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg">
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
