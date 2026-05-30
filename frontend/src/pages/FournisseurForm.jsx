import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fournisseursAPI } from '../services/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FournisseurForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nom: '', pays: '', ville: '', adresse: '', contact_nom: '', telephone: '',
    email: '', produits_fournis: '', delai_moyen_jours: 7, stock_securite_pct: 15,
    mode_paiement: '', devise: 'USD', notes: ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (isEdit) {
      fournisseursAPI.obtenir(id)
        .then(r => { const f = r.data.fournisseur; setForm({ nom:f.nom, pays:f.pays, ville:f.ville||'', adresse:f.adresse||'', contact_nom:f.contact_nom||'', telephone:f.telephone||'', email:f.email||'', produits_fournis:f.produits_fournis||'', delai_moyen_jours:f.delai_moyen_jours, stock_securite_pct:f.stock_securite_pct, mode_paiement:f.mode_paiement||'', devise:f.devise||'USD', notes:f.notes||'' }); })
        .catch(() => toast.error('Fournisseur introuvable'));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) { await fournisseursAPI.modifier(id, form); toast.success('Fournisseur modifié'); }
      else { await fournisseursAPI.creer(form); toast.success('Fournisseur créé'); }
      navigate('/fournisseurs');
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/fournisseurs')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={20} /></button>
        <h1 className="page-title">{isEdit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h1>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['Raison sociale / Nom *', 'nom', 'text', true],
            ['Pays d\'origine *', 'pays', 'text', true],
            ['Ville', 'ville', 'text', false],
            ['Nom du contact principal', 'contact_nom', 'text', false],
            ['Téléphone (WhatsApp)', 'telephone', 'tel', false],
            ['Email', 'email', 'email', false],
          ].map(([label, key, type, req]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input type={type} className="input-field" value={form[key]} onChange={e => set(key, e.target.value)} required={req} />
            </div>
          ))}
          <div className="col-span-1 sm:col-span-2">
            <label className="label">Adresse complète</label>
            <textarea rows={2} className="input-field resize-none" value={form.adresse} onChange={e => set('adresse', e.target.value)} />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="label">Produits fournis</label>
            <input className="input-field" placeholder="Ex: Appareils électroniques, accessoires..." value={form.produits_fournis} onChange={e => set('produits_fournis', e.target.value)} />
          </div>
          <div>
            <label className="label">Délai moyen de livraison (jours)</label>
            <input type="number" min="1" className="input-field" value={form.delai_moyen_jours} onChange={e => set('delai_moyen_jours', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">Stock de sécurité (%)</label>
            <input type="number" min="0" max="100" className="input-field" value={form.stock_securite_pct} onChange={e => set('stock_securite_pct', parseFloat(e.target.value))} />
            <p className="text-xs text-gray-400 mt-1">Chine=15%, Ouganda=35%, Dar-es-Salaam=50%</p>
          </div>
          <div>
            <label className="label">Mode de paiement habituel</label>
            <select className="select-field" value={form.mode_paiement} onChange={e => set('mode_paiement', e.target.value)}>
              <option value="">Sélectionner...</option>
              <option value="especes">Espèces</option>
              <option value="virement">Virement bancaire</option>
              <option value="credit">Crédit fournisseur</option>
            </select>
          </div>
          <div>
            <label className="label">Devise</label>
            <select className="select-field" value={form.devise} onChange={e => set('devise', e.target.value)}>
              <option value="USD">USD</option><option value="FC">FC</option><option value="EUR">EUR</option><option value="UGX">UGX</option>
            </select>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="label">Notes</label>
            <textarea rows={3} className="input-field resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button type="button" onClick={() => navigate('/fournisseurs')} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <><Loader2 size={15} className="spinner" /> Enregistrement...</> : <><Save size={15} /> {isEdit ? 'Enregistrer' : 'Créer'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
