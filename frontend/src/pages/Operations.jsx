import { Routes, Route, NavLink, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { operationsAPI, articlesAPI, fournisseursAPI, clientsAPI } from '../services/api';
import { Plus, Eye, Check, Send, Trash2, Loader2, ArrowLeft, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { imprimerBonCommande, imprimerBonReception, imprimerBonSortie } from '../utils/pdf';

const formatFC = (v) => new Intl.NumberFormat('fr-CD').format(Math.round(v || 0));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const statutBC = { brouillon:'Brouillon', en_attente:'En attente', approuve:'Approuvé', partiellement_recu:'Partiel. reçu', recu:'Reçu', annule:'Annulé' };
const couleurBC = { brouillon:'badge-info', en_attente:'badge-alerte', approuve:'badge-ok', partiellement_recu:'badge-alerte', recu:'badge-ok', annule:'badge-rupture' };
const statutBR = { en_cours:'En cours', conforme:'Conforme', non_conforme:'Non conforme', partielle:'Partielle' };
const statutBS = { prepare:'Préparé', livre:'Livré', facture:'Facturé', retourne:'Retourné' };

// ============ LISTE GENERIQUE ============
const ListeGenerique = ({ titre, colonnes, items, loading, onNouveau, onVoir, roles, badge, total, page, setPage }) => {
  const { hasRole } = useAuth();
  const peutCreer = !roles || hasRole(...roles);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title text-lg">{titre}</h2><p className="text-gray-400 text-sm">{total || items.length} document(s)</p></div>
        {peutCreer && <button onClick={onNouveau} className="btn-primary text-sm"><Plus size={16}/>Nouveau</button>}
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{colonnes.map(c=><th key={c.key} className="table-header">{c.label}</th>)}<th className="table-header">Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={colonnes.length+1} className="py-16 text-center"><Loader2 size={28} className="spinner text-navy mx-auto"/></td></tr>
              : items.length===0 ? <tr><td colSpan={colonnes.length+1} className="py-16 text-center text-gray-400 text-sm">Aucun document</td></tr>
              : items.map((item,i)=>(
                <tr key={item.id} className={`table-row ${i%2===0?'':'bg-gray-50/50'}`}>
                  {colonnes.map(c=>(
                    <td key={c.key} className="table-cell">
                      {c.badge ? badge(item) : c.render ? c.render(item) : item[c.key] ?? '—'}
                    </td>
                  ))}
                  <td className="table-cell">
                    <button onClick={()=>onVoir(item.id)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"><Eye size={15}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============ BONS DE COMMANDE ============
const ListeCommandes = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(()=>{ operationsAPI.listerCommandes().then(r=>setItems(r.data.commandes||[])).finally(()=>setLoading(false)); },[]);
  return <ListeGenerique titre="Bons de Commande" items={items} loading={loading}
    onNouveau={()=>navigate('/operations/commandes/nouveau')}
    onVoir={id=>navigate(`/operations/commandes/${id}`)}
    colonnes={[
      {key:'numero',label:'N° BC'},{key:'fournisseur',label:'Fournisseur',render:i=>i.fournisseur?.nom||'—'},
      {key:'date_creation',label:'Date',render:i=>fmtDate(i.date_creation)},
      {key:'montant_total',label:'Montant',render:i=>`${formatFC(i.montant_total)} FC`},
      {key:'statut',label:'Statut',badge:true}
    ]}
    badge={i=><span className={couleurBC[i.statut]}>{statutBC[i.statut]}</span>}
  />;
};

const FormulaireCommande = () => {
  const navigate = useNavigate();
  const [fournisseurs, setFournisseurs] = useState([]); const [articles, setArticles] = useState([]);
  const [form, setForm] = useState({ id_fournisseur:'', date_echeance:'', mode_paiement:'especes', observations:'', lignes:[] });
  const [saving, setSaving] = useState(false);
  useEffect(()=>{ fournisseursAPI.lister().then(r=>setFournisseurs(r.data)); articlesAPI.lister({limite:200}).then(r=>setArticles(r.data.articles)); },[]);

  const ajouterLigne = () => setForm(f=>({...f, lignes:[...f.lignes,{id_article:'',quantite_commandee:1,prix_unitaire:0}]}));
  const majLigne = (i,k,v) => setForm(f=>{ const l=[...f.lignes]; l[i]={...l[i],[k]:v}; if(k==='id_article'){ const art=articles.find(a=>a.id==v); if(art) l[i].prix_unitaire=parseFloat(art.prix_achat)||0; } return {...f,lignes:l}; });
  const supprimerLigne = (i) => setForm(f=>({...f, lignes:f.lignes.filter((_,idx)=>idx!==i)}));
  const total = form.lignes.reduce((s,l)=>s+(l.quantite_commandee*l.prix_unitaire),0);

  const soumettre = async (statut) => {
    if (!form.id_fournisseur || form.lignes.length===0) { toast.error('Fournisseur et articles requis'); return; }
    setSaving(true);
    try {
      const res = await operationsAPI.creerCommande(form);
      if (statut==='soumettre') await operationsAPI.soumettreCommande(res.data.bc.id);
      toast.success('Bon de commande créé');
      navigate('/operations/commandes');
    } catch(err){ toast.error(err.response?.data?.message||'Erreur'); }
    setSaving(false);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={()=>navigate('/operations/commandes')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={20} className="text-gray-600"/></button>
        <h2 className="section-title text-lg">Nouveau Bon de Commande</h2>
      </div>
      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Fournisseur *</label>
            <select className="select-field" value={form.id_fournisseur} onChange={e=>setForm(f=>({...f,id_fournisseur:e.target.value}))}>
              <option value="">Sélectionner...</option>
              {fournisseurs.map(f=><option key={f.id} value={f.id}>{f.nom} ({f.pays})</option>)}
            </select></div>
          <div><label className="label">Date livraison souhaitée</label>
            <input type="date" className="input-field" value={form.date_echeance} onChange={e=>setForm(f=>({...f,date_echeance:e.target.value}))}/></div>
          <div><label className="label">Mode de paiement</label>
            <select className="select-field" value={form.mode_paiement} onChange={e=>setForm(f=>({...f,mode_paiement:e.target.value}))}>
              <option value="especes">Espèces</option><option value="virement">Virement</option><option value="credit">Crédit fournisseur</option>
            </select></div>
          <div><label className="label">Observations</label>
            <input className="input-field" value={form.observations} onChange={e=>setForm(f=>({...f,observations:e.target.value}))}/></div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Articles à commander</h3>
            <button type="button" onClick={ajouterLigne} className="btn-secondary text-sm py-2"><Plus size={14}/>Ajouter</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="table-header">Article</th><th className="table-header text-right">Stock actuel</th><th className="table-header text-right">Qté commandée</th><th className="table-header text-right">PU (FC)</th><th className="table-header text-right">PT (FC)</th><th className="table-header"></th></tr></thead>
              <tbody>
                {form.lignes.map((l,i)=>{
                  const art = articles.find(a=>a.id==l.id_article);
                  return (<tr key={i} className="border-b border-gray-100">
                    <td className="py-2 px-3"><select className="select-field py-2 text-sm" value={l.id_article} onChange={e=>majLigne(i,'id_article',e.target.value)}>
                      <option value="">Choisir...</option>{articles.map(a=><option key={a.id} value={a.id}>{a.designation}</option>)}
                    </select></td>
                    <td className="py-2 px-3 text-right text-sm text-gray-500">{art?`${art.stock_actuel} ${art.unite}`:'—'}</td>
                    <td className="py-2 px-3"><input type="number" min="1" className="input-field py-2 text-sm text-right w-24 ml-auto" value={l.quantite_commandee} onChange={e=>majLigne(i,'quantite_commandee',parseFloat(e.target.value))}/></td>
                    <td className="py-2 px-3"><input type="number" min="0" className="input-field py-2 text-sm text-right w-32 ml-auto" value={l.prix_unitaire} onChange={e=>majLigne(i,'prix_unitaire',parseFloat(e.target.value))}/></td>
                    <td className="py-2 px-3 text-right font-semibold text-sm">{formatFC(l.quantite_commandee*l.prix_unitaire)}</td>
                    <td className="py-2 px-3"><button onClick={()=>supprimerLigne(i)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button></td>
                  </tr>);
                })}
                <tr className="bg-gray-50"><td colSpan={4} className="py-3 px-4 text-right font-semibold text-gray-700">TOTAL</td><td className="py-3 px-4 text-right font-bold text-navy text-lg">{formatFC(total)} FC</td><td></td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button onClick={()=>navigate('/operations/commandes')} className="btn-secondary text-sm">Annuler</button>
          <button onClick={()=>soumettre('brouillon')} disabled={saving} className="btn-secondary text-sm">{saving?<Loader2 size={14} className="spinner"/>:null} Enregistrer brouillon</button>
          <button onClick={()=>soumettre('soumettre')} disabled={saving} className="btn-primary text-sm"><Send size={15}/> Soumettre pour approbation</button>
        </div>
      </div>
    </div>
  );
};

const DetailCommande = () => {
  const { id } = useParams(); const navigate = useNavigate(); const { hasRole } = useAuth();
  const [bc, setBc] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(()=>{ operationsAPI.obtenirCommande(id).then(r=>setBc(r.data)).finally(()=>setLoading(false)); },[id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="spinner text-navy"/></div>;
  if (!bc) return <div className="text-center py-20 text-gray-400">Document introuvable</div>;

  const approuver = async () => {
    try { await operationsAPI.approuverCommande(id); toast.success('Bon de commande approuvé'); operationsAPI.obtenirCommande(id).then(r=>setBc(r.data)); }
    catch(err){ toast.error(err.response?.data?.message||'Erreur'); }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={()=>navigate('/operations/commandes')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={20}/></button>
          <div><h2 className="section-title text-lg">{bc.numero}</h2><p className="text-gray-400 text-sm">{fmtDate(bc.date_creation)}</p></div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <span className={couleurBC[bc.statut]}>{statutBC[bc.statut]}</span>
          {hasRole('gerant') && bc.statut==='en_attente' && <button onClick={approuver} className="btn-success text-sm"><Check size={15}/>Approuver</button>}
          <button onClick={()=>imprimerBonCommande(bc)} className="btn-secondary text-sm"><Printer size={14}/>Imprimer PDF</button>
        </div>
      </div>
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div><p className="text-xs text-gray-400 uppercase">Fournisseur</p><p className="font-semibold text-gray-800">{bc.fournisseur?.nom}</p></div>
          <div><p className="text-xs text-gray-400 uppercase">Pays</p><p className="font-semibold text-gray-800">{bc.fournisseur?.pays}</p></div>
          <div><p className="text-xs text-gray-400 uppercase">Livraison souhaitée</p><p className="font-semibold text-gray-800">{fmtDate(bc.date_echeance)}</p></div>
          <div><p className="text-xs text-gray-400 uppercase">Mode paiement</p><p className="font-semibold text-gray-800 capitalize">{bc.mode_paiement}</p></div>
        </div>
        <table className="w-full">
          <thead><tr><th className="table-header">Article</th><th className="table-header text-right">Qté</th><th className="table-header text-right">PU</th><th className="table-header text-right">PT</th></tr></thead>
          <tbody>
            {(bc.lignes||[]).map((l,i)=>(
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm">{l.article?.designation}</td>
                <td className="py-3 px-4 text-right text-sm">{l.quantite_commandee}</td>
                <td className="py-3 px-4 text-right text-sm">{formatFC(l.prix_unitaire)} FC</td>
                <td className="py-3 px-4 text-right font-semibold text-sm">{formatFC(l.prix_total)} FC</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold"><td colSpan={3} className="py-3 px-4 text-right">TOTAL</td><td className="py-3 px-4 text-right text-navy text-lg">{formatFC(bc.montant_total)} FC</td></tr>
          </tbody>
        </table>
        {bc.observations && <p className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-xl p-3"><strong>Observations :</strong> {bc.observations}</p>}
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-sm text-gray-500">
          <span>Créé par : <strong>{bc.createur?.prenom} {bc.createur?.nom}</strong></span>
          {bc.validateur && <span>Validé par : <strong>{bc.validateur?.prenom} {bc.validateur?.nom}</strong></span>}
        </div>
      </div>
    </div>
  );
};

// ============ RÉCEPTIONS ============
const ListeReceptions = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(()=>{ operationsAPI.listerReceptions().then(r=>setItems(r.data.receptions||[])).finally(()=>setLoading(false)); },[]);
  return <ListeGenerique titre="Bordereaux de Réception" items={items} loading={loading}
    onNouveau={()=>navigate('/operations/receptions/nouveau')}
    onVoir={id=>navigate(`/operations/receptions/${id}`)}
    colonnes={[
      {key:'numero',label:'N° BR'},{key:'fournisseur',label:'Fournisseur',render:i=>i.fournisseur?.nom||'—'},
      {key:'date_reception',label:'Date',render:i=>fmtDate(i.date_reception)},
      {key:'bonCommande',label:'BC lié',render:i=>i.bonCommande?.numero||'—'},
      {key:'statut_global',label:'Statut',badge:true}
    ]}
    badge={i=><span className={i.statut_global==='conforme'?'badge-ok':i.statut_global==='non_conforme'?'badge-rupture':'badge-alerte'}>{statutBR[i.statut_global]||i.statut_global}</span>}
  />;
};

const FormulaireReception = () => {
  const navigate = useNavigate();
  const [fournisseurs, setFournisseurs] = useState([]); const [articles, setArticles] = useState([]); const [commandes, setCommandes] = useState([]);
  const [form, setForm] = useState({ id_fournisseur:'', id_bon_commande:'', nom_livreur:'', tel_livreur:'', observations:'', lignes:[] });
  const [saving, setSaving] = useState(false);
  useEffect(()=>{ fournisseursAPI.lister().then(r=>setFournisseurs(r.data)); articlesAPI.lister({limite:200}).then(r=>setArticles(r.data.articles)); operationsAPI.listerCommandes({statut:'approuve'}).then(r=>setCommandes(r.data.commandes||[])); },[]);

  const ajouterLigne = () => setForm(f=>({...f, lignes:[...f.lignes,{id_article:'',quantite_commandee:0,quantite_recue:0,unite:'pièce',prix_unitaire:0,etat:'conforme',observations:''}]}));
  const majLigne = (i,k,v) => setForm(f=>{ const l=[...f.lignes]; l[i]={...l[i],[k]:v}; if(k==='id_article'){ const art=articles.find(a=>a.id==v); if(art){ l[i].prix_unitaire=parseFloat(art.prix_achat)||0; l[i].unite=art.unite||'pièce'; } } return {...f,lignes:l}; });
  const supprimerLigne = (i) => setForm(f=>({...f, lignes:f.lignes.filter((_,idx)=>idx!==i)}));

  const valider = async () => {
    if (!form.id_fournisseur || form.lignes.length===0) { toast.error('Fournisseur et articles requis'); return; }
    setSaving(true);
    try {
      const res = await operationsAPI.creerReception(form);
      await operationsAPI.validerReception(res.data.br.id);
      toast.success('Réception validée — stock mis à jour');
      navigate('/operations/receptions');
    } catch(err){ toast.error(err.response?.data?.message||'Erreur'); }
    setSaving(false);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={()=>navigate('/operations/receptions')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={20}/></button>
        <h2 className="section-title text-lg">Nouveau Bordereau de Réception</h2>
      </div>
      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Fournisseur *</label>
            <select className="select-field" value={form.id_fournisseur} onChange={e=>setForm(f=>({...f,id_fournisseur:e.target.value}))}>
              <option value="">Sélectionner...</option>{fournisseurs.map(f=><option key={f.id} value={f.id}>{f.nom}</option>)}
            </select></div>
          <div><label className="label">Lié au BC (optionnel)</label>
            <select className="select-field" value={form.id_bon_commande} onChange={e=>setForm(f=>({...f,id_bon_commande:e.target.value}))}>
              <option value="">Sans BC</option>{commandes.map(c=><option key={c.id} value={c.id}>{c.numero} — {c.fournisseur?.nom}</option>)}
            </select></div>
          <div><label className="label">Nom du livreur</label>
            <input className="input-field" value={form.nom_livreur} onChange={e=>setForm(f=>({...f,nom_livreur:e.target.value}))}/></div>
          <div><label className="label">Téléphone livreur</label>
            <input className="input-field" value={form.tel_livreur} onChange={e=>setForm(f=>({...f,tel_livreur:e.target.value}))}/></div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Articles reçus</h3>
            <button type="button" onClick={ajouterLigne} className="btn-secondary text-sm py-2"><Plus size={14}/>Ajouter</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="table-header">Article</th><th className="table-header text-right">Qté reçue</th><th className="table-header text-right">PU (FC)</th><th className="table-header">État</th><th className="table-header"></th></tr></thead>
              <tbody>
                {form.lignes.map((l,i)=>(
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 px-3"><select className="select-field py-2 text-sm" value={l.id_article} onChange={e=>majLigne(i,'id_article',e.target.value)}>
                      <option value="">Choisir...</option>{articles.map(a=><option key={a.id} value={a.id}>{a.designation}</option>)}
                    </select></td>
                    <td className="py-2 px-3"><input type="number" min="0" className="input-field py-2 text-sm text-right w-24 ml-auto" value={l.quantite_recue} onChange={e=>majLigne(i,'quantite_recue',parseFloat(e.target.value))}/></td>
                    <td className="py-2 px-3"><input type="number" min="0" className="input-field py-2 text-sm text-right w-32 ml-auto" value={l.prix_unitaire} onChange={e=>majLigne(i,'prix_unitaire',parseFloat(e.target.value))}/></td>
                    <td className="py-2 px-3"><select className="select-field py-2 text-sm w-36" value={l.etat} onChange={e=>majLigne(i,'etat',e.target.value)}>
                      <option value="conforme">✅ Conforme</option><option value="non_conforme">❌ Non conforme</option><option value="manquant">⚠️ Manquant</option><option value="abime">🔴 Abîmé</option>
                    </select></td>
                    <td className="py-2 px-3"><button onClick={()=>supprimerLigne(i)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div><label className="label">Observations générales</label>
          <textarea rows={2} className="input-field resize-none" value={form.observations} onChange={e=>setForm(f=>({...f,observations:e.target.value}))}/></div>
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button onClick={()=>navigate('/operations/receptions')} className="btn-secondary text-sm">Annuler</button>
          <button onClick={valider} disabled={saving} className="btn-success text-sm">
            {saving?<Loader2 size={14} className="spinner"/>:<Check size={15}/>} Valider la réception
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ BONS DE SORTIE ============
const ListeSorties = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(()=>{ operationsAPI.listerSorties().then(r=>setItems(r.data.sorties||[])).finally(()=>setLoading(false)); },[]);
  return <ListeGenerique titre="Bons de Sortie" items={items} loading={loading}
    onNouveau={()=>navigate('/operations/sorties/nouveau')}
    onVoir={id=>navigate(`/operations/sorties/${id}`)}
    colonnes={[
      {key:'numero',label:'N° BS'},{key:'client',label:'Client',render:i=>i.client?.nom||'—'},
      {key:'date',label:'Date',render:i=>fmtDate(i.date)},
      {key:'montant_total',label:'Montant',render:i=>`${formatFC(i.montant_total)} FC`},
      {key:'statut_paiement',label:'Paiement',render:i=><span className={i.statut_paiement==='paye'?'badge-ok':'badge-alerte'}>{i.statut_paiement==='paye'?'Payé':'À crédit'}</span>},
      {key:'statut',label:'Statut',badge:true}
    ]}
    badge={i=><span className={i.statut==='livre'?'badge-ok':i.statut==='prepare'?'badge-alerte':'badge-info'}>{statutBS[i.statut]||i.statut}</span>}
  />;
};

const FormulaireSortie = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]); const [articles, setArticles] = useState([]);
  const [form, setForm] = useState({ id_client:'', mode_livraison:'sur_place', statut_paiement:'paye', observations:'', lignes:[] });
  const [saving, setSaving] = useState(false);
  useEffect(()=>{ clientsAPI.lister().then(r=>setClients(r.data)); articlesAPI.lister({limite:200}).then(r=>setArticles(r.data.articles)); },[]);

  const ajouterLigne = () => setForm(f=>({...f, lignes:[...f.lignes,{id_article:'',quantite:1,prix_unitaire:0,remarques:''}]}));
  const majLigne = (i,k,v) => { const ls=[...form.lignes]; ls[i]={...ls[i],[k]:v}; if(k==='id_article'){ const art=articles.find(a=>a.id==v); if(art) ls[i].prix_unitaire=art.prix_vente; } setForm(f=>({...f,lignes:ls})); };
  const supprimerLigne = (i) => setForm(f=>({...f, lignes:f.lignes.filter((_,idx)=>idx!==i)}));
  const total = form.lignes.reduce((s,l)=>s+(l.quantite*l.prix_unitaire),0);

  const valider = async () => {
    if (!form.id_client || form.lignes.length===0) { toast.error('Client et articles requis'); return; }
    setSaving(true);
    try {
      const res = await operationsAPI.creerSortie(form);
      await operationsAPI.validerSortie(res.data.bs.id);
      toast.success('Sortie validée — stock mis à jour — facture générée');
      navigate('/operations/sorties');
    } catch(err){ toast.error(err.response?.data?.message||'Erreur'); }
    setSaving(false);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={()=>navigate('/operations/sorties')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={20}/></button>
        <h2 className="section-title text-lg">Nouveau Bon de Sortie</h2>
      </div>
      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="label">Client *</label>
            <select className="select-field" value={form.id_client} onChange={e=>setForm(f=>({...f,id_client:e.target.value}))}>
              <option value="">Sélectionner...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
            </select></div>
          <div><label className="label">Mode de livraison</label>
            <select className="select-field" value={form.mode_livraison} onChange={e=>setForm(f=>({...f,mode_livraison:e.target.value}))}>
              <option value="sur_place">Sur place</option><option value="domicile">Livraison à domicile</option><option value="moto_taxi">Moto-taxi</option>
            </select></div>
          <div><label className="label">Statut de paiement</label>
            <select className="select-field" value={form.statut_paiement} onChange={e=>setForm(f=>({...f,statut_paiement:e.target.value}))}>
              <option value="paye">Payé comptant</option><option value="credit">À crédit</option>
            </select></div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Articles à sortir</h3>
            <button type="button" onClick={ajouterLigne} className="btn-secondary text-sm py-2"><Plus size={14}/>Ajouter</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="table-header">Article</th><th className="table-header text-right">Stock dispo</th><th className="table-header text-right">Quantité</th><th className="table-header text-right">PU (FC)</th><th className="table-header text-right">PT (FC)</th><th className="table-header"></th></tr></thead>
              <tbody>
                {form.lignes.map((l,i)=>{
                  const art=articles.find(a=>a.id==l.id_article);
                  const insuffisant = art && parseFloat(art.stock_actuel)<l.quantite;
                  return (<tr key={i} className="border-b border-gray-100">
                    <td className="py-2 px-3"><select className="select-field py-2 text-sm" value={l.id_article} onChange={e=>majLigne(i,'id_article',e.target.value)}>
                      <option value="">Choisir...</option>{articles.map(a=><option key={a.id} value={a.id}>{a.designation}</option>)}
                    </select></td>
                    <td className={`py-2 px-3 text-right text-sm ${insuffisant?'text-red-600 font-bold':'text-gray-500'}`}>{art?`${art.stock_actuel} ${art.unite}`:'—'}</td>
                    <td className="py-2 px-3"><input type="number" min="1" className={`input-field py-2 text-sm text-right w-24 ml-auto ${insuffisant?'border-red-400':''}`} value={l.quantite} onChange={e=>majLigne(i,'quantite',parseFloat(e.target.value))}/></td>
                    <td className="py-2 px-3 text-right">
                      <div className={`inline-block text-sm font-semibold px-3 py-2 rounded-lg w-32 text-right ${l.prix_unitaire>0?'bg-navy/5 text-navy':'bg-gray-100 text-gray-400'}`}>
                        {l.prix_unitaire>0?`${formatFC(l.prix_unitaire)} FC`:'—'}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">{formatFC(l.quantite*l.prix_unitaire)}</td>
                    <td className="py-2 px-3"><button onClick={()=>supprimerLigne(i)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button></td>
                  </tr>);
                })}
                <tr className="bg-gray-50 font-bold"><td colSpan={4} className="py-3 px-4 text-right text-gray-700">TOTAL</td><td className="py-3 px-4 text-right text-navy text-lg">{formatFC(total)} FC</td><td></td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div><label className="label">Observations</label>
          <input className="input-field" value={form.observations} onChange={e=>setForm(f=>({...f,observations:e.target.value}))}/></div>
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button onClick={()=>navigate('/operations/sorties')} className="btn-secondary text-sm">Annuler</button>
          <button onClick={valider} disabled={saving} className="btn-primary text-sm">
            {saving?<Loader2 size={14} className="spinner"/>:<Check size={15}/>} Valider et sortir du stock
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailReception = () => {
  const { id } = useParams(); const navigate = useNavigate();
  const [br, setBr] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(()=>{ operationsAPI.obtenirReception(id).then(r=>setBr(r.data)).finally(()=>setLoading(false)); },[id]);
  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="spinner text-navy"/></div>;
  if (!br) return <div className="text-center py-20 text-gray-400">Document introuvable</div>;
  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={()=>navigate('/operations/receptions')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={20}/></button>
          <div><h2 className="section-title text-lg">{br.numero}</h2><p className="text-gray-400 text-sm">{fmtDate(br.date_reception)}</p></div>
        </div>
        <div className="flex gap-2 items-center">
          <span className={br.statut_global==='conforme'?'badge-ok':br.statut_global==='non_conforme'?'badge-rupture':'badge-alerte'}>{statutBR[br.statut_global]||br.statut_global}</span>
          <button onClick={()=>imprimerBonReception(br)} className="btn-secondary text-sm"><Printer size={14}/>Imprimer PDF</button>
        </div>
      </div>
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          <div><p className="text-xs text-gray-400 uppercase">Fournisseur</p><p className="font-semibold">{br.fournisseur?.nom}</p></div>
          <div><p className="text-xs text-gray-400 uppercase">BC lié</p><p className="font-semibold font-mono text-sm">{br.bonCommande?.numero||'—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase">Livreur</p><p className="font-semibold">{br.nom_livreur||'—'}</p></div>
        </div>
        <table className="w-full">
          <thead><tr><th className="table-header">Article</th><th className="table-header text-right">Qté reçue</th><th className="table-header text-right hidden sm:table-cell">PU</th><th className="table-header text-right hidden sm:table-cell">PT</th><th className="table-header">État</th></tr></thead>
          <tbody>
            {(br.lignes||[]).map((l,i)=>(
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm">{l.article?.designation}</td>
                <td className="py-3 px-4 text-right text-sm">{l.quantite_recue} {l.article?.unite}</td>
                <td className="py-3 px-4 text-right text-sm hidden sm:table-cell">{formatFC(l.prix_unitaire)} FC</td>
                <td className="py-3 px-4 text-right font-semibold text-sm hidden sm:table-cell">{formatFC(l.prix_total)} FC</td>
                <td className="py-3 px-4"><span className={l.etat==='conforme'?'badge-ok':l.etat==='non_conforme'?'badge-rupture':'badge-alerte'}>{l.etat}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DetailSortie = () => {
  const { id } = useParams(); const navigate = useNavigate();
  const [bs, setBs] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(()=>{ operationsAPI.obtenirSortie(id).then(r=>setBs(r.data)).finally(()=>setLoading(false)); },[id]);
  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="spinner text-navy"/></div>;
  if (!bs) return <div className="text-center py-20 text-gray-400">Document introuvable</div>;
  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={()=>navigate('/operations/sorties')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={20}/></button>
          <div><h2 className="section-title text-lg">{bs.numero}</h2><p className="text-gray-400 text-sm">{fmtDate(bs.date)}</p></div>
        </div>
        <div className="flex gap-2 items-center">
          <span className={bs.statut==='livre'?'badge-ok':'badge-alerte'}>{statutBS[bs.statut]||bs.statut}</span>
          <button onClick={()=>imprimerBonSortie(bs)} className="btn-secondary text-sm"><Printer size={14}/>Imprimer PDF</button>
        </div>
      </div>
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          <div><p className="text-xs text-gray-400 uppercase">Client</p><p className="font-semibold">{bs.client?.nom}</p></div>
          <div><p className="text-xs text-gray-400 uppercase">Livraison</p><p className="font-semibold capitalize">{bs.mode_livraison}</p></div>
          <div><p className="text-xs text-gray-400 uppercase">Paiement</p><p className="font-semibold capitalize">{bs.statut_paiement}</p></div>
        </div>
        <table className="w-full">
          <thead><tr><th className="table-header">Article</th><th className="table-header text-right">Quantité</th><th className="table-header text-right hidden sm:table-cell">PU (FC)</th><th className="table-header text-right">PT (FC)</th></tr></thead>
          <tbody>
            {(bs.lignes||[]).map((l,i)=>(
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm font-medium">{l.article?.designation}</td>
                <td className="py-3 px-4 text-right text-sm">{l.quantite} {l.article?.unite}</td>
                <td className="py-3 px-4 text-right text-sm hidden sm:table-cell">{formatFC(l.prix_unitaire)}</td>
                <td className="py-3 px-4 text-right font-semibold text-sm">{formatFC(l.prix_total)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold"><td colSpan={3} className="py-3 px-4 text-right">TOTAL</td><td className="py-3 px-4 text-right text-navy text-lg">{formatFC(bs.montant_total)} FC</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============ RETOURS ============
const ListeRetours = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(()=>{ operationsAPI.listerRetours().then(r=>setItems(r.data.retours||[])).finally(()=>setLoading(false)); },[]);
  return <ListeGenerique titre="Bons de Retour Clients" items={items} loading={loading}
    onNouveau={()=>navigate('/operations/retours/nouveau')}
    onVoir={id=>navigate(`/operations/retours/${id}`)}
    colonnes={[
      {key:'numero',label:'N° RET'},{key:'client',label:'Client',render:i=>i.client?.nom||'—'},
      {key:'date',label:'Date',render:i=>fmtDate(i.date)},
      {key:'montant_total',label:'Montant',render:i=>`${formatFC(i.montant_total)} FC`},
      {key:'statut',label:'Statut',badge:true}
    ]}
    badge={i=><span className={i.statut==='valide'?'badge-ok':i.statut==='annule'?'badge-rupture':'badge-alerte'}>{i.statut==='valide'?'Validé':i.statut==='annule'?'Annulé':'En attente'}</span>}
  />;
};

// ============ CONSULTATION ============
const Consultation = () => {
  const [onglet, setOnglet] = useState('entrees');
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);

  useEffect(()=>{
    setLoading(true);
    const fn = onglet==='entrees' ? operationsAPI.consulterEntrees : operationsAPI.consulterSorties;
    fn().then(r=>setItems(r.data.entrees||r.data.sorties||[])).finally(()=>setLoading(false));
  },[onglet]);

  return (
    <div className="space-y-5">
      <h2 className="section-title text-lg">Consultation — Historique</h2>
      <div className="flex gap-2">
        {['entrees','sorties'].map(t=>(
          <button key={t} onClick={()=>setOnglet(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${onglet===t?'bg-navy text-white':'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {t==='entrees'?'📥 Entrées':'📤 Sorties'}
          </button>
        ))}
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className="table-header">Date</th><th className="table-header">Article</th><th className="table-header text-right">Quantité</th><th className="table-header text-right hidden sm:table-cell">PU (FC)</th><th className="table-header text-right hidden sm:table-cell">PT (FC)</th><th className="table-header hidden md:table-cell">Document</th><th className="table-header hidden md:table-cell">Agent</th></tr></thead>
            <tbody>
              {loading?<tr><td colSpan={7} className="py-12 text-center"><Loader2 size={24} className="spinner text-navy mx-auto"/></td></tr>
              :items.length===0?<tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">Aucun mouvement</td></tr>
              :items.map((m,i)=>(
                <tr key={m.id} className={`table-row ${i%2===0?'':'bg-gray-50/50'}`}>
                  <td className="table-cell text-xs">{fmtDate(m.date)}</td>
                  <td className="table-cell font-medium">{m.article?.designation}</td>
                  <td className="table-cell text-right font-semibold text-emerald-600">{m.quantite} {m.article?.unite}</td>
                  <td className="table-cell text-right hidden sm:table-cell text-sm">{formatFC(m.prix_unitaire)}</td>
                  <td className="table-cell text-right hidden sm:table-cell font-medium">{formatFC(m.prix_total)}</td>
                  <td className="table-cell hidden md:table-cell font-mono text-xs text-primary-600">{m.reference_document}</td>
                  <td className="table-cell hidden md:table-cell text-xs text-gray-500">{m.utilisateur?.prenom} {m.utilisateur?.nom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============ NAVIGATION PRINCIPALE ============
const navOps = [
  { path: '/operations/commandes', label: '📋 Bons de Commande' },
  { path: '/operations/receptions', label: '📦 Réceptions' },
  { path: '/operations/sorties', label: '📤 Bons de Sortie' },
  { path: '/operations/retours', label: '↩️ Retours Clients' },
  { path: '/operations/consultation', label: '👁️ Consultation' },
];

export default function Operations() {
  return (
    <div className="space-y-5">
      {/* Tabs de navigation */}
      <div className="flex flex-wrap gap-2 bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
        {navOps.map(n=>(
          <NavLink key={n.path} to={n.path}
            className={({isActive})=>`px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive?'bg-navy text-white shadow-md':'text-gray-600 hover:bg-gray-100'}`}>
            {n.label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index element={<Navigate to="commandes" replace />} />
        <Route path="commandes" element={<ListeCommandes />} />
        <Route path="commandes/nouveau" element={<FormulaireCommande />} />
        <Route path="commandes/:id" element={<DetailCommande />} />
        <Route path="receptions" element={<ListeReceptions />} />
        <Route path="receptions/nouveau" element={<FormulaireReception />} />
        <Route path="receptions/:id" element={<DetailReception />} />
        <Route path="sorties" element={<ListeSorties />} />
        <Route path="sorties/nouveau" element={<FormulaireSortie />} />
        <Route path="sorties/:id" element={<DetailSortie />} />
        <Route path="retours" element={<ListeRetours />} />
        <Route path="consultation" element={<Consultation />} />
        <Route path="*" element={<Navigate to="commandes" replace />} />
      </Routes>
    </div>
  );
}
