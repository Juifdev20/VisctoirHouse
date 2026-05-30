import { useState, useEffect } from 'react';
import { utilisateursAPI } from '../services/api';
import { Plus, Edit, Key, Loader2, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';

const roleLabel = { gerant: 'Gérant', agent_stock: 'Agent de Stock', caissier: 'Caissier/Comptable', agent_securite: 'Agent de Sécurité' };
const roleCouleur = { gerant: 'bg-purple-100 text-purple-700', agent_stock: 'bg-blue-100 text-blue-700', caissier: 'bg-emerald-100 text-emerald-700', agent_securite: 'bg-gray-100 text-gray-700' };

const Modal = ({ titre, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 font-poppins">{titre}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', mot_de_passe: '', role: 'agent_stock' });
  const [editForm, setEditForm] = useState({ nom: '', prenom: '', role: 'agent_stock', actif: true });
  const [resetMdp, setResetMdp] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const charger = () => { utilisateursAPI.lister().then(r => setUsers(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { charger(); }, []);

  const creer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await utilisateursAPI.creer(form);
      toast.success('Utilisateur créé avec succès');
      setModal(null);
      charger();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setSaving(false);
  };

  const modifier = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await utilisateursAPI.modifier(selectedUser.id, editForm);
      toast.success('Utilisateur modifié');
      setModal(null);
      charger();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setSaving(false);
  };

  const reinitMdp = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await utilisateursAPI.reinitMdp(selectedUser.id, { nouveau_mdp: resetMdp });
      toast.success('Mot de passe réinitialisé');
      setModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setSaving(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Gestion des Utilisateurs</h1>
          <p className="text-gray-400 text-sm">{users.length} compte(s) dans le système</p>
        </div>
        <button onClick={() => { setForm({ nom:'', prenom:'', email:'', mot_de_passe:'', role:'agent_stock' }); setModal('creer'); }} className="btn-primary">
          <Plus size={17} /> Nouvel utilisateur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? <div className="col-span-3 flex justify-center py-16"><Loader2 size={28} className="spinner text-navy" /></div>
        : users.map(user => (
          <div key={user.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-navy rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user.prenom?.[0]}{user.nom?.[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{user.prenom} {user.nom}</h3>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {user.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div className="mb-4">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${roleCouleur[user.role]}`}>
                {roleLabel[user.role]}
              </span>
              {user.doit_changer_mdp && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">🔑 Changement MDP requis</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mb-4">
              Dernière connexion : {user.derniere_connexion ? new Date(user.derniere_connexion).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Jamais'}
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button onClick={() => { setSelectedUser(user); setEditForm({ nom:user.nom, prenom:user.prenom, role:user.role, actif:user.actif }); setModal('modifier'); }}
                className="flex-1 py-2 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-1">
                <Edit size={13} /> Modifier
              </button>
              <button onClick={() => { setSelectedUser(user); setResetMdp(''); setModal('reinit'); }}
                className="flex-1 py-2 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors flex items-center justify-center gap-1">
                <Key size={13} /> Réinitialiser MDP
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Créer */}
      {modal === 'creer' && (
        <Modal titre="Nouvel utilisateur" onClose={() => setModal(null)}>
          <form onSubmit={creer} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Prénom *</label><input className="input-field" required value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} /></div>
              <div><label className="label">Nom *</label><input className="input-field" required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
            </div>
            <div><label className="label">Email *</label><input type="email" className="input-field" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><label className="label">Mot de passe temporaire *</label><input type="password" className="input-field" required value={form.mot_de_passe} onChange={e => setForm(f => ({ ...f, mot_de_passe: e.target.value }))} /></div>
            <div><label className="label">Rôle</label>
              <select className="select-field" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {Object.entries(roleLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary text-sm flex-1">Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm flex-1">
                {saving ? <Loader2 size={14} className="spinner" /> : <Plus size={15} />} Créer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Modifier */}
      {modal === 'modifier' && selectedUser && (
        <Modal titre={`Modifier — ${selectedUser.prenom} ${selectedUser.nom}`} onClose={() => setModal(null)}>
          <form onSubmit={modifier} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Prénom</label><input className="input-field" value={editForm.prenom} onChange={e => setEditForm(f => ({ ...f, prenom: e.target.value }))} /></div>
              <div><label className="label">Nom</label><input className="input-field" value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} /></div>
            </div>
            <div><label className="label">Rôle</label>
              <select className="select-field" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                {Object.entries(roleLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="actif" checked={editForm.actif} onChange={e => setEditForm(f => ({ ...f, actif: e.target.checked }))} className="w-4 h-4 accent-navy" />
              <label htmlFor="actif" className="text-sm text-gray-700">Compte actif</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary text-sm flex-1">Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm flex-1">
                {saving ? <Loader2 size={14} className="spinner" /> : <Edit size={15} />} Enregistrer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Réinit MDP */}
      {modal === 'reinit' && selectedUser && (
        <Modal titre={`Réinitialiser MDP — ${selectedUser.prenom} ${selectedUser.nom}`} onClose={() => setModal(null)}>
          <form onSubmit={reinitMdp} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              ⚠️ L'utilisateur devra changer son mot de passe à la prochaine connexion.
            </div>
            <div>
              <label className="label">Nouveau mot de passe temporaire</label>
              <input type="password" className="input-field" placeholder="Laisser vide pour 'Temp@2024'" value={resetMdp} onChange={e => setResetMdp(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary text-sm flex-1">Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm flex-1">
                {saving ? <Loader2 size={14} className="spinner" /> : <Key size={15} />} Réinitialiser
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
