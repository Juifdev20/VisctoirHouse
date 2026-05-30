import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventairesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Send, Check, Loader2, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { imprimerInventaire } from '../utils/pdf';

const formatFC = (v) => new Intl.NumberFormat('fr-CD').format(Math.round(v || 0));

export default function InventaireDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [inventaire, setInventaire] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const charger = () => {
    inventairesAPI.obtenir(id)
      .then(r => { setInventaire(r.data); setLignes(r.data.lignes || []); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { charger(); }, [id]);

  const majLigne = (i, k, v) => {
    setLignes(ls => {
      const nls = [...ls];
      nls[i] = { ...nls[i], [k]: v };
      if (k === 'stock_physique') {
        nls[i].ecart = parseFloat(v) - parseFloat(nls[i].stock_theorique);
        nls[i].valeur_ecart = nls[i].ecart * parseFloat(nls[i].article?.prix_achat || 0);
      }
      return nls;
    });
  };

  const enregistrer = async () => {
    setSaving(true);
    try {
      await inventairesAPI.majLignes(id, { lignes: lignes.map(l => ({ id: l.id, stock_physique: l.stock_physique, observation: l.observation })) });
      toast.success('Lignes enregistrées');
    } catch { toast.error('Erreur lors de l\'enregistrement'); }
    setSaving(false);
  };

  const soumettre = async () => {
    setSaving(true);
    try {
      await enregistrer();
      await inventairesAPI.soumettre(id);
      toast.success('Inventaire soumis pour approbation');
      charger();
    } catch { toast.error('Erreur'); }
    setSaving(false);
  };

  const approuver = async () => {
    setSaving(true);
    try {
      await inventairesAPI.approuver(id);
      toast.success('Inventaire approuvé — stock ajusté');
      charger();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="spinner text-navy" /></div>;
  if (!inventaire) return <div className="text-center py-20 text-gray-400">Inventaire introuvable</div>;

  const totalEcartVal = lignes.reduce((s, l) => s + parseFloat(l.valeur_ecart || 0), 0);
  const nbEcarts = lignes.filter(l => l.ecart !== 0).length;
  const peutModifier = inventaire.statut === 'en_cours';
  const peutSoumettre = inventaire.statut === 'en_cours' && hasRole('gerant', 'agent_stock');
  const peutApprouver = inventaire.statut === 'soumis' && hasRole('gerant');

  const typeLabel = { QUOTIDIEN: 'Quotidien', HEBDO: 'Hebdomadaire', MENSUEL: 'Mensuel', ANNUEL: 'Annuel' };
  const statutColor = { en_cours: 'bg-amber-100 text-amber-700', soumis: 'bg-blue-100 text-blue-700', approuve: 'bg-emerald-100 text-emerald-700', rejete: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/inventaire')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="page-title">Inventaire {typeLabel[inventaire.type]} — {new Date(inventaire.date).toLocaleDateString('fr-FR')}</h1>
            <p className="text-gray-400 text-sm">Agent : {inventaire.agent?.prenom} {inventaire.agent?.nom}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statutColor[inventaire.statut]}`}>{inventaire.statut}</span>
          {peutModifier && <button onClick={enregistrer} disabled={saving} className="btn-secondary text-sm"><Save size={15} />Enregistrer</button>}
          {peutSoumettre && <button onClick={soumettre} disabled={saving} className="btn-primary text-sm"><Send size={15} />Soumettre</button>}
          {peutApprouver && <button onClick={approuver} disabled={saving} className="btn-success text-sm"><Check size={15} />Approuver & Ajuster stock</button>}
          <button onClick={() => imprimerInventaire(inventaire, lignes)} className="btn-secondary text-sm"><Printer size={15} />Imprimer PDF</button>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Nb articles', val: lignes.length, color: 'text-navy' },
          { label: 'Articles avec écart', val: nbEcarts, color: nbEcarts > 0 ? 'text-amber-600' : 'text-emerald-600' },
          { label: 'Valeur écart total', val: `${formatFC(Math.abs(totalEcartVal))} FC`, color: totalEcartVal < 0 ? 'text-red-600' : totalEcartVal > 0 ? 'text-emerald-600' : 'text-gray-600' },
          { label: 'Taux conformité', val: `${lignes.length > 0 ? (((lignes.length - nbEcarts) / lignes.length) * 100).toFixed(1) : 100}%`, color: 'text-navy' },
        ].map((item, i) => (
          <div key={i} className="card text-center py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</p>
            <p className={`text-xl font-bold font-poppins mt-1 break-words ${item.color}`}>{item.val}</p>
          </div>
        ))}
      </div>

      {/* Lignes d'inventaire */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="section-title">Feuille de comptage</h3>
          {peutModifier && <p className="text-sm text-gray-400 mt-1">Saisissez le stock physique compté pour chaque article.</p>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-header">Code</th>
              <th className="table-header">Désignation</th>
              <th className="table-header text-right">Stock théorique</th>
              <th className="table-header text-right">Stock physique</th>
              <th className="table-header text-right">Écart</th>
              <th className="table-header text-right hidden md:table-cell">Valeur écart</th>
              <th className="table-header hidden sm:table-cell">Observation</th>
            </tr></thead>
            <tbody>
              {lignes.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center">
                  <p className="text-gray-400 text-sm">Aucun article dans cet inventaire.</p>
                  <p className="text-gray-300 text-xs mt-1">Aucun article actif ne correspondait au filtre ABC au moment de la création.</p>
                </td></tr>
              )}
              {lignes.map((l, i) => {
                const ecart = parseFloat(l.ecart || 0);
                return (
                  <tr key={l.id} className={`border-b border-gray-100 ${ecart !== 0 ? 'bg-amber-50/30' : ''}`}>
                    <td className="py-2.5 px-4 font-mono text-xs text-navy font-semibold">{l.article?.code}</td>
                    <td className="py-2.5 px-4 text-sm font-medium text-gray-800">{l.article?.designation}</td>
                    <td className="py-2.5 px-4 text-right text-sm text-gray-600">{l.stock_theorique} {l.article?.unite}</td>
                    <td className="py-2.5 px-4 text-right">
                      {peutModifier ? (
                        <input type="number" min="0" className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-navy"
                          value={l.stock_physique}
                          onChange={e => majLigne(i, 'stock_physique', parseFloat(e.target.value) || 0)} />
                      ) : <span className="text-sm font-medium">{l.stock_physique}</span>}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-semibold text-sm ${ecart > 0 ? 'text-emerald-600' : ecart < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {ecart > 0 ? '+' : ''}{ecart}
                    </td>
                    <td className="py-2.5 px-4 text-right hidden md:table-cell">
                      <span className={`text-xs font-medium ${ecart !== 0 ? (ecart < 0 ? 'text-red-600' : 'text-emerald-600') : 'text-gray-400'}`}>
                        {ecart !== 0 ? `${ecart < 0 ? '-' : '+'}${formatFC(Math.abs(l.valeur_ecart))} FC` : '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 hidden sm:table-cell">
                      {peutModifier ? (
                        <input className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-navy"
                          placeholder="Note..." value={l.observation || ''}
                          onChange={e => majLigne(i, 'observation', e.target.value)} />
                      ) : <span className="text-xs text-gray-400">{l.observation || '—'}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
