import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Package, AlertTriangle, XCircle, DollarSign, ShoppingCart, TrendingUp,
  Plus, ArrowRight, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from 'recharts';

const COULEURS_CATEGORIE = ['#1E3A5F','#F59E0B','#10B981','#3B82F6','#EF4444','#8B5CF6'];

const formatFC = (val) => {
  const n = Math.round(val || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FC';
};

const KPICard = ({ titre, valeur, icone: Icone, couleur, bg, sous }) => (
  <div className="card flex flex-col gap-2 hover:shadow-lg transition-shadow">
    <div className="flex items-center gap-2">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icone size={17} className={couleur} />
      </div>
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">{titre}</p>
    </div>
    <p className="text-xl font-bold text-gray-800 font-poppins leading-snug break-words">{valeur}</p>
    {sous && <p className="text-xs text-gray-400">{sous}</p>}
  </div>
);

export default function Dashboard() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const charger = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.obtenir();
      setData(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-navy border-t-transparent rounded-full spinner mx-auto mb-3"></div>
        <p className="text-gray-400 text-sm">Chargement du tableau de bord...</p>
      </div>
    </div>
  );

  const kpis = data?.kpis || {};
  const mouvements7j = data?.mouvements7j || [];
  const repartition = data?.repartitionCategorie || [];
  const articlesSeuil = data?.articlesSeuil || [];
  const derniersMvt = data?.derniersMouvements || [];

  // Formater les données pour les graphiques
  const joursUniques = [...new Set(mouvements7j.map(m => m.jour))];
  const chartBarData = joursUniques.map(jour => {
    const entree = mouvements7j.find(m => m.jour === jour && m.type_mouvement === 'ENTREE');
    const sortie = mouvements7j.find(m => m.jour === jour && m.type_mouvement === 'SORTIE');
    return {
      jour: new Date(jour).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      Entrées: parseFloat(entree?.total_valeur || 0),
      Sorties: parseFloat(sortie?.total_valeur || 0)
    };
  });

  const chartPieData = repartition.map(r => ({
    name: r.categorie?.charAt(0).toUpperCase() + r.categorie?.slice(1),
    value: parseFloat(r.valeur || 0)
  }));

  const categorieLabel = { alimentation: 'Alimentation', boissons: 'Boissons', electronique: 'Électronique', menager: 'Ménager', construction: 'Construction', autres: 'Autres' };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="text-gray-400 text-sm mt-0.5">Vue d'ensemble en temps réel — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={charger} className="btn-secondary text-sm py-2">
          <RefreshCw size={15} /> Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard titre="Articles en stock" valeur={kpis.totalArticles || 0} icone={Package} couleur="text-blue-600" bg="bg-blue-50" />
        <KPICard titre="En alerte" valeur={kpis.articlesAlerte || 0} icone={AlertTriangle} couleur="text-amber-600" bg="bg-amber-50" sous="Sous seuil min." />
        <KPICard titre="En rupture" valeur={kpis.articlesRupture || 0} icone={XCircle} couleur="text-red-600" bg="bg-red-50" sous="Stock = 0" />
        <KPICard titre="Valeur du stock" valeur={formatFC(kpis.valeurStock)} icone={DollarSign} couleur="text-emerald-600" bg="bg-emerald-50" />
        <KPICard titre="Cmdes en attente" valeur={kpis.commandesEnAttente || 0} icone={ShoppingCart} couleur="text-purple-600" bg="bg-purple-50" />
        <KPICard titre="CA du jour" valeur={formatFC(kpis.caJour)} icone={TrendingUp} couleur="text-gold-600" bg="bg-amber-50" />
      </div>

      {/* Raccourcis rapides */}
      {hasRole('gerant', 'agent_stock') && (
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/operations/receptions/nouveau')} className="btn-primary text-sm">
            <Plus size={16} /> Nouvelle entrée
          </button>
          <button onClick={() => navigate('/operations/sorties/nouveau')} className="btn-gold text-sm">
            <Plus size={16} /> Nouvelle sortie
          </button>
          <button onClick={() => navigate('/operations/commandes/nouveau')} className="btn-secondary text-sm">
            <Plus size={16} /> Bon de commande
          </button>
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique barres */}
        <div className="card">
          <h3 className="section-title mb-4">Mouvements des 7 derniers jours</h3>
          {chartBarData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Aucune donnée disponible</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="jour" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={v => new Intl.NumberFormat('fr', { notation: 'compact' }).format(v)} />
                <Tooltip formatter={(v) => formatFC(v)} contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #E2E8F0' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Entrées" fill="#10B981" radius={[4,4,0,0]} />
                <Bar dataKey="Sorties" fill="#F59E0B" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Graphique donut */}
        <div className="card">
          <h3 className="section-title mb-4">Répartition du stock par catégorie</h3>
          {chartPieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Aucune donnée disponible</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {chartPieData.map((_, i) => <Cell key={i} fill={COULEURS_CATEGORIE[i % COULEURS_CATEGORIE.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatFC(v)} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Articles sous seuil + Derniers mouvements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Articles sous seuil */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title text-amber-600">⚠️ Articles à réapprovisionner</h3>
            {hasRole('gerant','agent_stock') && (
              <button onClick={() => navigate('/operations/commandes/nouveau')} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                Commander <ArrowRight size={12} />
              </button>
            )}
          </div>
          {articlesSeuil.length === 0 ? (
            <p className="text-sm text-emerald-600 text-center py-6">✅ Tous les stocks sont conformes</p>
          ) : (
            <div className="space-y-2">
              {articlesSeuil.map(art => (
                <div key={art.id} onClick={() => navigate(`/articles/${art.id}`)}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{art.designation}</p>
                    <p className="text-xs text-gray-500">{art.fournisseur?.nom || '—'}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <span className={`text-sm font-bold ${parseFloat(art.stock_actuel) === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {art.stock_actuel} {art.unite}
                    </span>
                    <p className="text-xs text-gray-400">min: {art.stock_minimum}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Derniers mouvements */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Derniers mouvements</h3>
            <button onClick={() => navigate('/operations/consultation')} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          {derniersMvt.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucun mouvement enregistré</p>
          ) : (
            <div className="space-y-2">
              {derniersMvt.map(mvt => (
                <div key={mvt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    mvt.type_mouvement === 'ENTREE' ? 'bg-emerald-100 text-emerald-700' :
                    mvt.type_mouvement === 'SORTIE' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {mvt.type_mouvement === 'ENTREE' ? '↑' : mvt.type_mouvement === 'SORTIE' ? '↓' : '↺'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{mvt.article?.designation}</p>
                    <p className="text-xs text-gray-400">{new Date(mvt.date).toLocaleDateString('fr-FR')} · {mvt.reference_document}</p>
                  </div>
                  <span className={`text-sm font-semibold flex-shrink-0 ${mvt.type_mouvement === 'ENTREE' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {mvt.type_mouvement === 'ENTREE' ? '+' : '-'}{mvt.quantite} {mvt.article?.unite}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
