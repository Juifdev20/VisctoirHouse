import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { articlesAPI } from '../services/api';
import { ArrowLeft, Edit, Package, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatFC = (v) => new Intl.NumberFormat('fr-CD').format(Math.round(v || 0));
const categorieLabel = { alimentation:'Alimentation', boissons:'Boissons', electronique:'Électronique', menager:'Ménager', construction:'Construction', autres:'Autres' };

export default function ArticleDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    articlesAPI.ficheStock(id)
      .then(r => { setArticle(r.data.article); setMouvements(r.data.mouvements); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-navy border-t-transparent rounded-full spinner"></div></div>;
  if (!article) return <div className="text-center py-20 text-gray-400">Article introuvable</div>;

  const marge = article.prix_vente > 0 ? (((article.prix_vente - article.prix_achat) / article.prix_vente) * 100).toFixed(1) : 0;
  const statutStock = parseFloat(article.stock_actuel) === 0 ? 'rupture' : parseFloat(article.stock_actuel) <= parseFloat(article.stock_minimum) ? 'alerte' : 'ok';

  // Données pour le graphique d'évolution
  const chartData = mouvements.map(m => ({
    date: new Date(m.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' }),
    stock: parseFloat(m.stock_apres)
  }));

  const typeIcon = { ENTREE: <TrendingUp size={14} className="text-emerald-600" />, SORTIE: <TrendingDown size={14} className="text-amber-600" />, RETOUR: <RotateCcw size={14} className="text-blue-600" />, AJUSTEMENT: <Package size={14} className="text-purple-600" /> };
  const typeBg = { ENTREE: 'bg-emerald-50 text-emerald-700', SORTIE: 'bg-amber-50 text-amber-700', RETOUR: 'bg-blue-50 text-blue-700', AJUSTEMENT: 'bg-purple-50 text-purple-700' };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/articles')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{article.designation}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statutStock === 'ok' ? 'bg-emerald-100 text-emerald-700' : statutStock === 'alerte' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {statutStock === 'ok' ? '✅ En stock' : statutStock === 'alerte' ? '⚠️ Alerte' : '🔴 Rupture'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-0.5 font-mono">{article.code}</p>
          </div>
        </div>
        <button onClick={() => navigate(`/articles/${id}/modifier`)} className="btn-secondary text-sm flex-shrink-0">
          <Edit size={15} /> Modifier
        </button>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Stock actuel', val: `${article.stock_actuel} ${article.unite}`, color: statutStock === 'ok' ? 'text-emerald-600' : statutStock === 'alerte' ? 'text-amber-600' : 'text-red-600' },
          { label: 'CAUM', val: `${formatFC(article.caum)} FC`, color: 'text-navy' },
          { label: 'Valeur stock', val: `${formatFC(parseFloat(article.stock_actuel) * parseFloat(article.caum))} FC`, color: 'text-navy' },
          { label: 'Marge commerciale', val: `${marge}%`, color: parseFloat(marge) >= 20 ? 'text-emerald-600' : 'text-amber-600' }
        ].map((item, i) => (
          <div key={i} className="card text-center py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
            <p className={`text-xl font-bold font-poppins break-words ${item.color}`}>{item.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations */}
        <div className="card">
          <h3 className="section-title mb-4">Informations de l'article</h3>
          <dl className="space-y-3">
            {[
              ['Catégorie', categorieLabel[article.categorie]],
              ['Unité', article.unite],
              ['Fournisseur principal', article.fournisseur?.nom || '—'],
              ['Emplacement', article.emplacement || '—'],
              ['Seuil minimum', `${article.stock_minimum} ${article.unite}`],
              ['Seuil maximum', `${article.stock_maximum} ${article.unite}`],
              ['Stock sécurité', `${article.stock_securite_pct}%`],
              ['Méthode', article.methode_gestion],
              ['Catégorie ABC', article.categorie_abc],
              ['Prix d\'achat', `${formatFC(article.prix_achat)} FC`],
              ['Prix de vente', `${formatFC(article.prix_vente)} FC`],
              ...(article.date_expiration ? [['Date expiration', new Date(article.date_expiration).toLocaleDateString('fr-FR')]] : [])
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-800">{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Graphique évolution */}
        <div className="card">
          <h3 className="section-title mb-4">Évolution du stock</h3>
          {chartData.length < 2 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Données insuffisantes</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="stock" stroke="#1E3A5F" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Historique mouvements */}
      <div className="card">
        <h3 className="section-title mb-4">Historique des mouvements</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header rounded-tl-xl">Date</th>
                <th className="table-header">Type</th>
                <th className="table-header text-right">Quantité</th>
                <th className="table-header text-right hidden sm:table-cell">PU (FC)</th>
                <th className="table-header text-right hidden sm:table-cell">PT (FC)</th>
                <th className="table-header hidden md:table-cell">Document</th>
                <th className="table-header text-right">Stock après</th>
                <th className="table-header rounded-tr-xl hidden md:table-cell">Agent</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Aucun mouvement enregistré</td></tr>
              ) : [...mouvements].reverse().map((m, i) => (
                <tr key={m.id} className={`table-row ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="table-cell text-xs">{new Date(m.date).toLocaleDateString('fr-FR')} {new Date(m.date).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}</td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${typeBg[m.type_mouvement]}`}>
                      {typeIcon[m.type_mouvement]} {m.type_mouvement}
                    </span>
                  </td>
                  <td className={`table-cell text-right font-semibold ${m.type_mouvement === 'ENTREE' ? 'text-emerald-600' : m.type_mouvement === 'SORTIE' ? 'text-amber-700' : 'text-blue-600'}`}>
                    {m.type_mouvement === 'ENTREE' || m.type_mouvement === 'RETOUR' ? '+' : '-'}{m.quantite}
                  </td>
                  <td className="table-cell text-right hidden sm:table-cell text-gray-500 text-xs">{formatFC(m.prix_unitaire)}</td>
                  <td className="table-cell text-right hidden sm:table-cell text-gray-700 font-medium text-xs">{formatFC(m.prix_total)}</td>
                  <td className="table-cell hidden md:table-cell font-mono text-xs text-primary-600">{m.reference_document || '—'}</td>
                  <td className="table-cell text-right font-semibold text-navy">{m.stock_apres}</td>
                  <td className="table-cell hidden md:table-cell text-xs text-gray-500">{m.utilisateur?.prenom} {m.utilisateur?.nom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
