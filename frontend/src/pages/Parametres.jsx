import { useState, useEffect } from 'react';
import { parametresAPI } from '../services/api';
import { clearParamsCache } from '../utils/pdf';
import { Save, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Parametres() {
  const [params, setParams] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [onglet, setOnglet] = useState('entreprise');

  useEffect(() => {
    parametresAPI.obtenir().then(r => setParams(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (onglet === 'audit') {
      parametresAPI.audit().then(r => setAuditLogs(r.data.logs || []));
    }
  }, [onglet]);

  const set = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const sauvegarder = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await parametresAPI.mettreAJour(params);
      clearParamsCache();
      toast.success('Paramètres sauvegardés');
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    setSaving(false);
  };

  const onglets = [
    { key: 'entreprise', label: '🏢 Entreprise' },
    { key: 'systeme', label: '⚙️ Système' },
    { key: 'audit', label: '🔍 Journal d\'audit' },
  ];

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="spinner text-navy" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="page-title">Paramètres Système</h1>

      <div className="flex flex-wrap gap-2 bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
        {onglets.map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${onglet === o.key ? 'bg-navy text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
            {o.label}
          </button>
        ))}
      </div>

      {onglet !== 'audit' ? (
        <form onSubmit={sauvegarder} className="space-y-6">
          {onglet === 'entreprise' && (
            <div className="card space-y-5">
              <h3 className="section-title">Informations de l'entreprise</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['Nom de l\'entreprise', 'nom_entreprise'],
                  ['Numéro RC', 'rc'],
                  ['NIF (Numéro Fiscal)', 'nif'],
                  ['Téléphone', 'telephone'],
                  ['Email', 'email'],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input className="input-field" value={params[key] || ''} onChange={e => set(key, e.target.value)} />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="label">Adresse complète</label>
                  <textarea rows={2} className="input-field resize-none" value={params.adresse || ''} onChange={e => set('adresse', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Mention légale sur les factures</label>
                  <textarea rows={2} className="input-field resize-none" value={params.mention_legale || ''} onChange={e => set('mention_legale', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {onglet === 'systeme' && (
            <div className="card space-y-5">
              <h3 className="section-title">Paramètres système et financiers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['Devise principale', 'devise_principale'],
                  ['Devise secondaire', 'devise_secondaire'],
                  ['Taux de change FC/USD', 'taux_change_fc_usd'],
                  ['Préfixe Bon de Commande', 'prefixe_bc'],
                  ['Préfixe Bordereau Réception', 'prefixe_br'],
                  ['Préfixe Bon de Sortie', 'prefixe_bs'],
                  ['Préfixe Facture', 'prefixe_fac'],
                  ['Préfixe Reçu', 'prefixe_recu'],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input className="input-field" value={params[key] || ''} onChange={e => set(key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 size={15} className="spinner" /> Sauvegarde...</> : <><Save size={15} /> Sauvegarder les paramètres</>}
            </button>
          </div>
        </form>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Shield size={18} className="text-navy" />
            <h3 className="section-title">Journal d'audit système</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">Date & Heure</th>
                <th className="table-header">Utilisateur</th>
                <th className="table-header">Action</th>
                <th className="table-header hidden sm:table-cell">Module</th>
                <th className="table-header hidden md:table-cell">IP</th>
              </tr></thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-sm">Aucune entrée dans le journal</td></tr>
                ) : auditLogs.map((log, i) => (
                  <tr key={log.id} className={`table-row ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="table-cell text-xs">{new Date(log.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                    <td className="table-cell text-sm font-medium">{log.nom_utilisateur || '—'}</td>
                    <td className="table-cell"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded-lg text-gray-700">{log.action}</span></td>
                    <td className="table-cell hidden sm:table-cell text-xs text-gray-500">{log.module || '—'}</td>
                    <td className="table-cell hidden md:table-cell font-mono text-xs text-gray-400">{log.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
