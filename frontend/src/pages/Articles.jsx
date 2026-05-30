import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { articlesAPI, fournisseursAPI } from '../services/api';
import { Plus, Search, Filter, Eye, Edit, Loader2, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const statutBadge = (art) => {
  if (parseFloat(art.stock_actuel) <= 0) return <span className="badge-rupture">Rupture</span>;
  if (parseFloat(art.stock_actuel) <= parseFloat(art.stock_minimum)) return <span className="badge-alerte">Alerte</span>;
  return <span className="badge-ok">OK</span>;
};

const formatFC = (v) => new Intl.NumberFormat('fr-CD').format(Math.round(v || 0));

const categorieLabel = { alimentation: 'Alimentation', boissons: 'Boissons', electronique: 'Électronique', menager: 'Ménager', construction: 'Construction', autres: 'Autres' };

export default function Articles() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limite = 20;
  const [filtres, setFiltres] = useState({ recherche: '', categorie: '', id_fournisseur: '', statut: '' });
  const [showFiltres, setShowFiltres] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const params = { page, limite, ...Object.fromEntries(Object.entries(filtres).filter(([,v]) => v)) };
      const res = await articlesAPI.lister(params);
      setArticles(res.data.articles);
      setTotal(res.data.total);
    } catch { toast.error('Erreur lors du chargement'); }
    setLoading(false);
  };

  useEffect(() => { charger(); }, [page, filtres]);
  useEffect(() => { fournisseursAPI.lister().then(r => setFournisseurs(r.data)); }, []);

  const totalPages = Math.ceil(total / limite);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Catalogue Articles</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total} article(s) au total</p>
        </div>
        <button onClick={() => navigate('/articles/nouveau')} className="btn-primary">
          <Plus size={17} /> Nouvel article
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, code..."
              value={filtres.recherche}
              onChange={e => { setFiltres(f => ({ ...f, recherche: e.target.value })); setPage(1); }}
              className="input-field pl-9"
            />
          </div>
          <button onClick={() => setShowFiltres(!showFiltres)} className={`btn-secondary text-sm ${showFiltres ? 'bg-navy text-white border-navy' : ''}`}>
            <Filter size={15} /> Filtres
          </button>
        </div>

        {showFiltres && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            <div>
              <label className="label">Catégorie</label>
              <select className="select-field" value={filtres.categorie} onChange={e => { setFiltres(f => ({ ...f, categorie: e.target.value })); setPage(1); }}>
                <option value="">Toutes les catégories</option>
                {Object.entries(categorieLabel).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fournisseur</label>
              <select className="select-field" value={filtres.id_fournisseur} onChange={e => { setFiltres(f => ({ ...f, id_fournisseur: e.target.value })); setPage(1); }}>
                <option value="">Tous les fournisseurs</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Statut stock</label>
              <select className="select-field" value={filtres.statut} onChange={e => { setFiltres(f => ({ ...f, statut: e.target.value })); setPage(1); }}>
                <option value="">Tous</option>
                <option value="alerte">En alerte</option>
                <option value="rupture">En rupture</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header rounded-tl-2xl">Code</th>
                <th className="table-header">Désignation</th>
                <th className="table-header hidden md:table-cell">Catégorie</th>
                <th className="table-header hidden lg:table-cell">Fournisseur</th>
                <th className="table-header text-center">Stock actuel</th>
                <th className="table-header hidden sm:table-cell text-right">Prix vente</th>
                <th className="table-header text-center">Statut</th>
                <th className="table-header rounded-tr-2xl text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16">
                  <Loader2 size={28} className="spinner text-navy mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Chargement...</p>
                </td></tr>
              ) : articles.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16">
                  <Package size={36} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Aucun article trouvé</p>
                </td></tr>
              ) : articles.map((art, i) => (
                <tr key={art.id} className={`table-row ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="table-cell font-mono text-xs text-navy font-semibold">{art.code}</td>
                  <td className="table-cell font-medium text-gray-800 max-w-[200px] truncate">{art.designation}</td>
                  <td className="table-cell hidden md:table-cell">
                    <span className="badge-info">{categorieLabel[art.categorie] || art.categorie}</span>
                  </td>
                  <td className="table-cell hidden lg:table-cell text-gray-500 text-xs">{art.fournisseur?.nom || '—'}</td>
                  <td className="table-cell text-center">
                    <span className={`font-semibold ${parseFloat(art.stock_actuel) === 0 ? 'text-red-600' : parseFloat(art.stock_actuel) <= parseFloat(art.stock_minimum) ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {art.stock_actuel} {art.unite}
                    </span>
                  </td>
                  <td className="table-cell hidden sm:table-cell text-right text-gray-700 font-medium">{formatFC(art.prix_vente)} FC</td>
                  <td className="table-cell text-center">{statutBadge(art)}</td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => navigate(`/articles/${art.id}`)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Voir détail">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => navigate(`/articles/${art.id}/modifier`)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Modifier">
                        <Edit size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-400">Page {page} sur {totalPages} ({total} résultats)</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Précédent
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
