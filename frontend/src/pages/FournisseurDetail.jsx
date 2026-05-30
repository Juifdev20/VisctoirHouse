import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fournisseursAPI } from '../services/api';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';

const formatFC = (v) => new Intl.NumberFormat('fr-CD').format(Math.round(v || 0));

export default function FournisseurDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [fournisseur, setFournisseur] = useState(null);
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fournisseursAPI.obtenir(id)
      .then(r => { setFournisseur(r.data.fournisseur); setCommandes(r.data.commandes || []); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="spinner text-navy" /></div>;
  if (!fournisseur) return <div className="text-center py-20 text-gray-400">Fournisseur introuvable</div>;

  const drapeaux = { Chine: '🇨🇳', Tanzanie: '🇹🇿', Ouganda: '🇺🇬' };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/fournisseurs')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={20} /></button>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{drapeaux[fournisseur.pays] || '🌍'}</span>
            <div>
              <h1 className="page-title">{fournisseur.nom}</h1>
              <p className="text-gray-400 text-sm">{fournisseur.ville}, {fournisseur.pays}</p>
            </div>
          </div>
        </div>
        <button onClick={() => navigate(`/fournisseurs/${id}/modifier`)} className="btn-secondary text-sm">
          <Edit size={15} /> Modifier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title mb-4">Coordonnées</h3>
          <dl className="space-y-3">
            {[
              ['Contact principal', fournisseur.contact_nom || '—'],
              ['Téléphone', fournisseur.telephone || '—'],
              ['Email', fournisseur.email || '—'],
              ['Adresse', fournisseur.adresse || '—'],
              ['Produits fournis', fournisseur.produits_fournis || '—'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card">
          <h3 className="section-title mb-4">Conditions commerciales</h3>
          <dl className="space-y-3">
            {[
              ['Délai moyen livraison', `${fournisseur.delai_moyen_jours} jours`],
              ['Stock de sécurité', `${fournisseur.stock_securite_pct}%`],
              ['Mode de paiement', fournisseur.mode_paiement || '—'],
              ['Devise', fournisseur.devise || 'USD'],
              ['Statut', fournisseur.actif ? '✅ Actif' : '❌ Inactif'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-800">{val}</dd>
              </div>
            ))}
          </dl>
          {fournisseur.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 font-medium mb-1">Notes</p>
              <p className="text-sm text-gray-700">{fournisseur.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Historique des commandes */}
      <div className="card">
        <h3 className="section-title mb-4">Historique des commandes ({commandes.length})</h3>
        {commandes.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Aucune commande passée à ce fournisseur</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">N° BC</th>
                <th className="table-header">Date</th>
                <th className="table-header text-right">Montant</th>
                <th className="table-header">Statut</th>
              </tr></thead>
              <tbody>
                {commandes.map((c, i) => (
                  <tr key={c.id} className={`table-row ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="table-cell font-mono text-xs text-primary-600 font-semibold">{c.numero}</td>
                    <td className="table-cell text-sm">{new Date(c.date_creation).toLocaleDateString('fr-FR')}</td>
                    <td className="table-cell text-right font-medium">{formatFC(c.montant_total)} FC</td>
                    <td className="table-cell"><span className="badge-info capitalize">{c.statut}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
