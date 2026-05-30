import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clientsAPI } from '../services/api';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';

const formatFC = (v) => new Intl.NumberFormat('fr-CD').format(Math.round(v || 0));
const typeLabel = { semi_grossiste: 'Semi-grossiste', detaillant: 'Détaillant', particulier: 'Particulier', entreprise: 'Entreprise' };

export default function ClientDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientsAPI.obtenir(id)
      .then(r => { setClient(r.data.client); setFactures(r.data.factures || []); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="spinner text-navy" /></div>;
  if (!client) return <div className="text-center py-20 text-gray-400">Client introuvable</div>;

  const totalAchats = factures.filter(f => f.statut_paiement === 'paye').reduce((s, f) => s + parseFloat(f.montant_total), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/clients')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="page-title">{client.nom}</h1>
            <p className="text-gray-400 text-sm">{typeLabel[client.type_client] || client.type_client}</p>
          </div>
        </div>
        <button onClick={() => navigate(`/clients/${id}/modifier`)} className="btn-secondary text-sm">
          <Edit size={15} /> Modifier
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total achats', val: `${formatFC(totalAchats)} FC`, color: 'text-navy' },
          { label: 'Solde dû', val: `${formatFC(client.solde_du)} FC`, color: parseFloat(client.solde_du) > 0 ? 'text-red-600' : 'text-emerald-600' },
          { label: 'Limite crédit', val: parseFloat(client.limite_credit) > 0 ? `${formatFC(client.limite_credit)} FC` : 'Non accordé', color: 'text-gray-700' },
          { label: 'Nb factures', val: factures.length, color: 'text-navy' },
        ].map((item, i) => (
          <div key={i} className="card text-center py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
            <p className={`text-lg font-bold font-poppins ${item.color}`}>{item.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title mb-4">Informations du client</h3>
          <dl className="space-y-3">
            {[
              ['Téléphone', client.telephone || '—'],
              ['Adresse', client.adresse || '—'],
              ['Type', typeLabel[client.type_client]],
              ['Statut', client.actif ? '✅ Actif' : '❌ Inactif'],
              ...(client.observations ? [['Observations', client.observations]] : []),
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card">
          <h3 className="section-title mb-4">Factures récentes</h3>
          {factures.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Aucune facture</p>
          ) : (
            <div className="space-y-2">
              {factures.slice(0, 8).map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/caisse/factures/${f.id}`)}>
                  <div>
                    <p className="text-sm font-mono font-semibold text-primary-600">{f.numero}</p>
                    <p className="text-xs text-gray-400">{new Date(f.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{formatFC(f.montant_total)} FC</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${f.statut_paiement === 'paye' ? 'bg-emerald-100 text-emerald-700' : f.statut_paiement === 'partiel' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {f.statut_paiement === 'paye' ? 'Payé' : f.statut_paiement === 'partiel' ? 'Partiel' : 'Impayé'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
