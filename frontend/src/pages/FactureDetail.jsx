import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { caisseAPI } from '../services/api';
import { ArrowLeft, Loader2, DollarSign, Printer, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { imprimerFacture, imprimerRecu } from '../utils/pdf';

const formatFC = (v) => new Intl.NumberFormat('fr-CD').format(Math.round(v || 0));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function FactureDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [facture, setFacture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paiement, setPaiement] = useState({ montant: 0, mode_paiement: 'especes', notes: '' });
  const [paying, setPaying] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const charger = () => {
    caisseAPI.obtenirFacture(id).then(r => setFacture(r.data.facture)).finally(() => setLoading(false));
  };
  useEffect(() => { charger(); }, [id]);

  const payer = async (e) => {
    e.preventDefault();
    if (!paiement.montant || paiement.montant <= 0) { toast.error('Montant invalide'); return; }
    setPaying(true);
    try {
      await caisseAPI.payerFacture(id, paiement);
      toast.success('Paiement enregistré — reçu généré');
      setShowForm(false);
      charger();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setPaying(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="spinner text-navy" /></div>;
  if (!facture) return <div className="text-center py-20 text-gray-400">Facture introuvable</div>;

  const statutColor = facture.statut_paiement === 'paye' ? 'bg-emerald-100 text-emerald-700' : facture.statut_paiement === 'partiel' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  const statutLabel = facture.statut_paiement === 'paye' ? '✅ Payé' : facture.statut_paiement === 'partiel' ? '⚠️ Partiel' : '🔴 Impayé';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/caisse/factures')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="page-title">{facture.numero}</h1>
            <p className="text-gray-400 text-sm">{new Date(facture.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statutColor}`}>{statutLabel}</span>
          <button onClick={() => imprimerFacture(facture)} className="btn-secondary text-sm"><Printer size={15} /> Imprimer PDF</button>
        </div>
      </div>

      {/* Résumé paiement */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Montant total', val: `${formatFC(facture.montant_total)} FC`, color: 'text-navy' },
          { label: 'Montant payé', val: `${formatFC(facture.montant_paye)} FC`, color: 'text-emerald-600' },
          { label: 'Restant dû', val: `${formatFC(facture.montant_du)} FC`, color: parseFloat(facture.montant_du) > 0 ? 'text-red-600' : 'text-emerald-600' },
        ].map((item, i) => (
          <div key={i} className="card text-center py-4">
            <p className="text-xs text-gray-400 uppercase">{item.label}</p>
            <p className={`text-xl font-bold font-poppins mt-1 break-words ${item.color}`}>{item.val}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div><p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Client</p><p className="font-semibold text-gray-800 dark:text-gray-100">{facture.client?.nom}</p></div>
          <div><p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Téléphone</p><p className="font-semibold text-gray-800 dark:text-gray-100">{facture.client?.telephone || '—'}</p></div>
          <div><p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Bon de Sortie</p><p className="font-semibold text-gray-800 dark:text-gray-100 font-mono text-sm">{facture.bonSortie?.numero || '—'}</p></div>
          <div><p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Mode de livraison</p><p className="font-semibold text-gray-800 dark:text-gray-100 capitalize">{facture.bonSortie?.mode_livraison || '—'}</p></div>
        </div>

        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Détail des articles</h3>
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Désignation</th>
            <th className="table-header text-right">Qté</th>
            <th className="table-header text-right hidden sm:table-cell">PU (FC)</th>
            <th className="table-header text-right">PT (FC)</th>
          </tr></thead>
          <tbody>
            {(facture.bonSortie?.lignes || []).map((l, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                <td className="py-3 px-4 text-sm font-medium text-gray-800 dark:text-gray-100">{l.article?.designation}</td>
                <td className="py-3 px-4 text-right text-sm text-gray-700 dark:text-gray-200">{l.quantite} {l.article?.unite}</td>
                <td className="py-3 px-4 text-right text-sm hidden sm:table-cell text-gray-700 dark:text-gray-200">{formatFC(l.prix_unitaire)}</td>
                <td className="py-3 px-4 text-right font-semibold text-sm text-gray-800 dark:text-gray-100">{formatFC(l.prix_total)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 dark:bg-gray-700/50 font-bold">
              <td colSpan={3} className="py-3 px-4 text-right text-gray-700 dark:text-gray-200">TOTAL</td>
              <td className="py-3 px-4 text-right text-navy text-xl font-poppins">{formatFC(facture.montant_total)} FC</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Créé par : <strong>{facture.createur?.prenom} {facture.createur?.nom}</strong>
          </div>
          {facture.statut_paiement !== 'paye' && (
            <button onClick={() => setShowForm(!showForm)} className="btn-gold text-sm">
              <DollarSign size={16} /> Enregistrer un paiement
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={payer} className="mt-5 p-5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl space-y-4 border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-700">Nouveau paiement</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Montant (FC) *</label>
                <input type="number" min="1" max={facture.montant_du} className="input-field" required
                  value={paiement.montant} onChange={e => setPaiement(p => ({ ...p, montant: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Mode de paiement</label>
                <select className="select-field" value={paiement.mode_paiement} onChange={e => setPaiement(p => ({ ...p, mode_paiement: e.target.value }))}>
                  <option value="especes">Espèces</option>
                  <option value="virement">Virement Mobile</option>
                  <option value="cheque">Chèque</option>
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input-field" value={paiement.notes} onChange={e => setPaiement(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Annuler</button>
              <button type="submit" disabled={paying} className="btn-success text-sm">
                {paying ? <Loader2 size={14} className="spinner" /> : <DollarSign size={15} />} Confirmer le paiement
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Historique des paiements */}
      {(facture.recus || []).length > 0 && (
        <div className="card">
          <h3 className="section-title mb-4">Historique des paiements</h3>
          <div className="space-y-2">
            {facture.recus.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <div>
                  <p className="text-sm font-mono font-semibold text-navy">{r.numero}</p>
                  <p className="text-xs text-gray-400">{fmtDate(r.date_paiement)} · <span className="capitalize">{r.mode_paiement}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-emerald-600">{formatFC(r.montant)} FC</p>
                  <button onClick={() => imprimerRecu({ ...r, facture, client: facture.client })} className="p-1.5 text-navy hover:bg-navy/10 rounded-lg" title="Imprimer reçu"><Download size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
