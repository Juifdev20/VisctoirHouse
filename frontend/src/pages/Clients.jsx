import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsAPI } from '../services/api';
import { Plus, Eye, Edit, Search, Loader2, Users } from 'lucide-react';

const formatFC = (v) => new Intl.NumberFormat('fr-CD').format(Math.round(v || 0));
const typeLabel = { semi_grossiste: 'Semi-grossiste', detaillant: 'Détaillant', particulier: 'Particulier', entreprise: 'Entreprise' };
const typeCouleur = { semi_grossiste: 'bg-purple-100 text-purple-700', detaillant: 'bg-blue-100 text-blue-700', particulier: 'bg-gray-100 text-gray-700', entreprise: 'bg-emerald-100 text-emerald-700' };

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');

  const charger = async () => {
    setLoading(true);
    try {
      const params = recherche ? { recherche } : {};
      const r = await clientsAPI.lister(params);
      setClients(r.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { charger(); }, [recherche]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="text-gray-400 text-sm">{clients.length} client(s) enregistré(s)</p>
        </div>
        <button onClick={() => navigate('/clients/nouveau')} className="btn-primary">
          <Plus size={17} /> Nouveau client
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Rechercher par nom ou téléphone..."
            value={recherche} onChange={e => setRecherche(e.target.value)}
            className="input-field pl-9" />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header rounded-tl-2xl">Nom</th>
                <th className="table-header hidden sm:table-cell">Téléphone</th>
                <th className="table-header">Type</th>
                <th className="table-header text-right hidden md:table-cell">Solde dû</th>
                <th className="table-header hidden lg:table-cell">Adresse</th>
                <th className="table-header rounded-tr-2xl text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Loader2 size={28} className="spinner text-navy mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Chargement...</p>
                </td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Users size={36} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Aucun client trouvé</p>
                </td></tr>
              ) : clients.map((c, i) => (
                <tr key={c.id} className={`table-row ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="table-cell font-medium text-gray-800">{c.nom}</td>
                  <td className="table-cell hidden sm:table-cell text-gray-500 text-sm">{c.telephone || '—'}</td>
                  <td className="table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeCouleur[c.type_client] || 'bg-gray-100 text-gray-600'}`}>
                      {typeLabel[c.type_client] || c.type_client}
                    </span>
                  </td>
                  <td className="table-cell text-right hidden md:table-cell">
                    <span className={parseFloat(c.solde_du) > 0 ? 'text-red-600 font-semibold' : 'text-gray-400 text-sm'}>
                      {parseFloat(c.solde_du) > 0 ? `${formatFC(c.solde_du)} FC` : '—'}
                    </span>
                  </td>
                  <td className="table-cell hidden lg:table-cell text-gray-500 text-xs truncate max-w-[180px]">{c.adresse || '—'}</td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => navigate(`/clients/${c.id}`)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg" title="Voir détail">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => navigate(`/clients/${c.id}/modifier`)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Modifier">
                        <Edit size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
