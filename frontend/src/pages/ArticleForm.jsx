import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { articlesAPI, fournisseursAPI } from '../services/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['alimentation','boissons','electronique','menager','construction','autres'];
const CATEGORIES_LABEL = { alimentation:'Alimentation', boissons:'Boissons', electronique:'Électronique', menager:'Ménager', construction:'Construction', autres:'Autres' };
const UNITES = ['pièce','kg','litre','carton','sac','boîte','paquet','lot','mètre','tonne'];

export default function ArticleForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '', designation: '', categorie: 'alimentation', unite: 'pièce',
    id_fournisseur_principal: '', stock_initial: 0,
    stock_minimum: 0, stock_maximum: 0, stock_securite_pct: 15,
    prix_achat: 0, prix_vente: 0, methode_gestion: 'FIFO', categorie_abc: 'C',
    emplacement: '', date_expiration: '', notes: ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const marge = form.prix_vente > 0 ? (((form.prix_vente - form.prix_achat) / form.prix_vente) * 100).toFixed(1) : 0;

  useEffect(() => {
    fournisseursAPI.lister().then(r => setFournisseurs(r.data));
    if (isEdit) {
      setLoading(true);
      articlesAPI.obtenir(id)
        .then(r => {
          const a = r.data.article;
          setForm({ code: a.code, designation: a.designation, categorie: a.categorie, unite: a.unite,
            id_fournisseur_principal: a.id_fournisseur_principal || '',
            stock_initial: a.stock_actuel, stock_minimum: a.stock_minimum,
            stock_maximum: a.stock_maximum, stock_securite_pct: a.stock_securite_pct,
            prix_achat: a.prix_achat, prix_vente: a.prix_vente,
            methode_gestion: a.methode_gestion, categorie_abc: a.categorie_abc,
            emplacement: a.emplacement || '', date_expiration: a.date_expiration || '', notes: a.notes || ''
          });
        })
        .catch(() => toast.error('Article introuvable'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.designation || !form.categorie) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await articlesAPI.modifier(id, form);
        toast.success('Article modifié avec succès');
      } else {
        await articlesAPI.creer(form);
        toast.success('Article créé avec succès');
      }
      navigate('/articles');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={30} className="spinner text-navy" /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/articles')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Modifier l\'article' : 'Nouvel article'}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{isEdit ? `Modification de ${form.designation}` : 'Ajouter un article au catalogue'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <div className="card">
          <h3 className="section-title mb-5">Informations générales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Code article</label>
              <input className="input-field font-mono" placeholder="ART-001 (auto si vide)" value={form.code} onChange={e => set('code', e.target.value)} />
            </div>
            <div>
              <label className="label">Désignation <span className="text-red-500">*</span></label>
              <input className="input-field" placeholder="Nom du produit" value={form.designation} onChange={e => set('designation', e.target.value)} required />
            </div>
            <div>
              <label className="label">Catégorie <span className="text-red-500">*</span></label>
              <select className="select-field" value={form.categorie} onChange={e => set('categorie', e.target.value)} required>
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORIES_LABEL[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unité de mesure</label>
              <select className="select-field" value={form.unite} onChange={e => set('unite', e.target.value)}>
                {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fournisseur principal</label>
              <select className="select-field" value={form.id_fournisseur_principal} onChange={e => set('id_fournisseur_principal', e.target.value)}>
                <option value="">Sélectionner un fournisseur</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom} ({f.pays})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Emplacement (entrepôt)</label>
              <input className="input-field" placeholder="Ex: Zone A - Rayonnage 3" value={form.emplacement} onChange={e => set('emplacement', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="card">
          <h3 className="section-title mb-5">Gestion du stock</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {!isEdit && (
              <div>
                <label className="label">Stock initial</label>
                <input type="number" min="0" className="input-field" value={form.stock_initial} onChange={e => set('stock_initial', parseFloat(e.target.value))} />
              </div>
            )}
            <div>
              <label className="label">Seuil minimum (alerte)</label>
              <input type="number" min="0" className="input-field" value={form.stock_minimum} onChange={e => set('stock_minimum', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="label">Seuil maximum</label>
              <input type="number" min="0" className="input-field" value={form.stock_maximum} onChange={e => set('stock_maximum', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="label">Stock de sécurité (%)</label>
              <input type="number" min="0" max="100" className="input-field" value={form.stock_securite_pct} onChange={e => set('stock_securite_pct', parseFloat(e.target.value))} />
              <p className="text-xs text-gray-400 mt-1">Chine=15%, Ouganda=35%, Dar-es-Salaam=50%</p>
            </div>
            <div>
              <label className="label">Méthode de gestion</label>
              <select className="select-field" value={form.methode_gestion} onChange={e => set('methode_gestion', e.target.value)}>
                <option value="FIFO">FIFO (Premier Entré, Premier Sorti)</option>
                <option value="FEFO">FEFO (Premier Expiré, Premier Sorti)</option>
              </select>
            </div>
            <div>
              <label className="label">Catégorie ABC</label>
              <select className="select-field" value={form.categorie_abc} onChange={e => set('categorie_abc', e.target.value)}>
                <option value="A">A — Suivi quotidien (80% du CA)</option>
                <option value="B">B — Suivi hebdomadaire (15% du CA)</option>
                <option value="C">C — Suivi mensuel (5% du CA)</option>
              </select>
            </div>
            <div>
              <label className="label">Date d'expiration</label>
              <input type="date" className="input-field" value={form.date_expiration} onChange={e => set('date_expiration', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Prix */}
        <div className="card">
          <h3 className="section-title mb-5">Prix et valorisation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="label">Prix d'achat unitaire (FC)</label>
              <input type="number" min="0" className="input-field" value={form.prix_achat} onChange={e => set('prix_achat', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="label">Prix de vente unitaire (FC)</label>
              <input type="number" min="0" className="input-field" value={form.prix_vente} onChange={e => set('prix_vente', parseFloat(e.target.value))} />
            </div>
            <div className="flex flex-col justify-end">
              <div className={`p-4 rounded-xl text-center ${parseFloat(marge) >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <p className="text-xs text-gray-500 mb-1">Taux de marge commerciale</p>
                <p className={`text-2xl font-bold font-poppins ${parseFloat(marge) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{marge}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <label className="label">Notes / Observations</label>
          <textarea rows={3} className="input-field resize-none" placeholder="Informations complémentaires..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate('/articles')} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <><Loader2 size={16} className="spinner" /> Enregistrement...</> : <><Save size={16} /> {isEdit ? 'Enregistrer les modifications' : 'Créer l\'article'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
