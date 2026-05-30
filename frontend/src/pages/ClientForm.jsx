import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clientsAPI } from '../services/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nom: '', telephone: '', adresse: '', type_client: 'particulier', limite_credit: 0, observations: ''
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (isEdit) {
      clientsAPI.obtenir(id).then(r => {
        const c = r.data.client;
        setForm({ nom: c.nom, telephone: c.telephone || '', adresse: c.adresse || '', type_client: c.type_client, limite_credit: c.limite_credit, observations: c.observations || '' });
      }).catch(() => toast.error('Client introuvable'));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom) { toast.error('Le nom est obligatoire'); return; }
    setSaving(true);
    try {
      if (isEdit) { await clientsAPI.modifier(id, form); toast.success('Client modifié'); }
      else { await clientsAPI.creer(form); toast.success('Client créé'); }
      navigate('/clients');
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/clients')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={20} /></button>
        <h1 className="page-title">{isEdit ? 'Modifier le client' : 'Nouveau client'}</h1>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Nom complet *</label>
            <input className="input-field" value={form.nom} onChange={e => set('nom', e.target.value)} required />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input type="tel" className="input-field" placeholder="+243 9XX XXX XXX" value={form.telephone} onChange={e => set('telephone', e.target.value)} />
          </div>
          <div>
            <label className="label">Type de client</label>
            <select className="select-field" value={form.type_client} onChange={e => set('type_client', e.target.value)}>
              <option value="particulier">Particulier</option>
              <option value="detaillant">Détaillant</option>
              <option value="semi_grossiste">Semi-grossiste</option>
              <option value="entreprise">Entreprise</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Adresse</label>
            <input className="input-field" placeholder="Quartier, avenue..." value={form.adresse} onChange={e => set('adresse', e.target.value)} />
          </div>
          <div>
            <label className="label">Limite de crédit (FC)</label>
            <input type="number" min="0" className="input-field" value={form.limite_credit} onChange={e => set('limite_credit', parseFloat(e.target.value))} />
            <p className="text-xs text-gray-400 mt-1">0 = pas de crédit accordé</p>
          </div>
          <div>
            <label className="label">Observations</label>
            <input className="input-field" value={form.observations} onChange={e => set('observations', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button type="button" onClick={() => navigate('/clients')} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <><Loader2 size={15} className="spinner" /> Enregistrement...</> : <><Save size={15} /> {isEdit ? 'Enregistrer' : 'Créer le client'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
