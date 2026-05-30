import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Save, Loader2, Lock, Eye, EyeOff, Pencil, X, User, Mail, BadgeCheck, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const roleLabel = { gerant: 'Gérant', agent_stock: 'Agent de Stock', caissier: 'Caissier/Comptable', agent_securite: 'Agent de Sécurité' };
const roleBadge = { gerant: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300', agent_stock: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300', caissier: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300', agent_securite: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' };

export default function Profil() {
  const { user, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profil, setProfil] = useState({ prenom: user?.prenom || '', nom: user?.nom || '', email: user?.email || '' });
  const [savingProfil, setSavingProfil] = useState(false);

  const [mdpForm, setMdpForm] = useState({ ancien_mdp: '', nouveau_mdp: '', confirmer_mdp: '' });
  const [savingMdp, setSavingMdp] = useState(false);
  const [show, setShow] = useState({ ancien: false, nouveau: false, confirmer: false });

  const entrerEdition = () => {
    setProfil({ prenom: user?.prenom || '', nom: user?.nom || '', email: user?.email || '' });
    setEditMode(true);
  };

  const annuler = () => {
    setProfil({ prenom: user?.prenom || '', nom: user?.nom || '', email: user?.email || '' });
    setEditMode(false);
  };

  const sauvegarderProfil = async (e) => {
    e.preventDefault();
    if (!profil.prenom.trim() || !profil.nom.trim() || !profil.email.trim()) {
      toast.error('Tous les champs sont obligatoires');
      return;
    }
    setSavingProfil(true);
    try {
      const res = await authAPI.modifierProfil(profil);
      updateUser(res.data.user);
      toast.success('Profil mis à jour avec succès');
      setEditMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
    setSavingProfil(false);
  };

  const changerMdp = async (e) => {
    e.preventDefault();
    if (mdpForm.nouveau_mdp !== mdpForm.confirmer_mdp) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (mdpForm.nouveau_mdp.length < 8) { toast.error('Minimum 8 caractères requis'); return; }
    setSavingMdp(true);
    try {
      await authAPI.changerMdp({ ancien_mot_de_passe: mdpForm.ancien_mdp, nouveau_mot_de_passe: mdpForm.nouveau_mdp });
      toast.success('Mot de passe modifié avec succès');
      setMdpForm({ ancien_mdp: '', nouveau_mdp: '', confirmer_mdp: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setSavingMdp(false);
  };

  const PasswordInput = ({ label, field, showKey }) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type={show[showKey] ? 'text' : 'password'} className="input-field pl-9 pr-10"
          value={mdpForm[field]} onChange={e => setMdpForm(f => ({ ...f, [field]: e.target.value }))} required />
        <button type="button" onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="page-title">Mon Profil</h1>

      {/* ── Carte avatar + infos ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-navy dark:bg-gray-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white font-poppins">
                {user?.prenom} {user?.nom}
              </h2>
              <p className="text-gray-400 dark:text-gray-500 text-sm">{user?.email}</p>
              <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${roleBadge[user?.role]}`}>
                {roleLabel[user?.role]}
              </span>
            </div>
          </div>
          {!editMode ? (
            <button onClick={entrerEdition} className="btn-secondary flex items-center gap-2 text-sm">
              <Pencil size={14} /> Modifier
            </button>
          ) : (
            <button onClick={annuler} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Affichage lecture seule */}
        {!editMode && (
          <dl className="grid grid-cols-2 gap-3">
            {[
              ['Prénom', user?.prenom, <User size={14} />],
              ['Nom', user?.nom, <User size={14} />],
              ['Email', user?.email, <Mail size={14} />],
              ['Rôle', roleLabel[user?.role], <BadgeCheck size={14} />],
              ['Statut', user?.actif ? '✅ Actif' : '❌ Inactif', null],
              ['Dernière connexion', user?.derniere_connexion
                ? new Date(user.derniere_connexion).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Première connexion', <Calendar size={14} />],
            ].map(([label, val]) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-600">
                <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">{label}</dt>
                <dd className="text-sm font-medium text-gray-800 dark:text-gray-100">{val}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Formulaire édition */}
        {editMode && (
          <form onSubmit={sauvegarderProfil} className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Prénom *</label>
                <input
                  type="text"
                  className="input-field"
                  value={profil.prenom}
                  onChange={e => setProfil(p => ({ ...p, prenom: e.target.value }))}
                  placeholder="Votre prénom"
                  required
                />
              </div>
              <div>
                <label className="label">Nom *</label>
                <input
                  type="text"
                  className="input-field"
                  value={profil.nom}
                  onChange={e => setProfil(p => ({ ...p, nom: e.target.value }))}
                  placeholder="Votre nom"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="input-field"
                value={profil.email}
                onChange={e => setProfil(p => ({ ...p, email: e.target.value }))}
                placeholder="votre@email.com"
                required
              />
            </div>

            {/* Champs non modifiables */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-600 opacity-60">
                <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Rôle</dt>
                <dd className="text-sm font-medium text-gray-600 dark:text-gray-400">{roleLabel[user?.role]} <span className="text-xs">(non modifiable)</span></dd>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-600 opacity-60">
                <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Statut</dt>
                <dd className="text-sm font-medium text-gray-600 dark:text-gray-400">{user?.actif ? 'Actif' : 'Inactif'} <span className="text-xs">(non modifiable)</span></dd>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button type="button" onClick={annuler} className="btn-secondary text-sm">
                Annuler
              </button>
              <button type="submit" disabled={savingProfil} className="btn-primary text-sm">
                {savingProfil
                  ? <><Loader2 size={14} className="spinner" /> Enregistrement...</>
                  : <><Save size={14} /> Enregistrer les modifications</>}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Changement de mot de passe ── */}
      <div className="card">
        <h3 className="section-title mb-5">Modifier mon mot de passe</h3>
        {user?.doit_changer_mdp && (
          <div className="mb-5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-700 dark:text-amber-400">
            ⚠️ Vous devez changer votre mot de passe temporaire avant de continuer.
          </div>
        )}
        <form onSubmit={changerMdp} className="space-y-4">
          <PasswordInput label="Mot de passe actuel *" field="ancien_mdp" showKey="ancien" />
          <PasswordInput label="Nouveau mot de passe *" field="nouveau_mdp" showKey="nouveau" />
          <PasswordInput label="Confirmer le nouveau mot de passe *" field="confirmer_mdp" showKey="confirmer" />
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-xs text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-600">
            <strong>Règles :</strong> minimum 8 caractères, avec majuscule, chiffre et caractère spécial recommandés.
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={savingMdp} className="btn-primary text-sm">
              {savingMdp ? <><Loader2 size={14} className="spinner" /> Enregistrement...</> : <><Save size={14} /> Modifier le mot de passe</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
