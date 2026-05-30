import { useState, useEffect } from 'react';
import { rapportsAPI } from '../services/api';
import { RefreshCw, Loader2, Download } from 'lucide-react';
import { exporterRapportStock, exporterRapportVentes } from '../utils/pdf';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const formatFC = (v) => new Intl.NumberFormat('fr-CD').format(Math.round(v || 0));
const COULEURS = ['#1E3A5F', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];
const catLabel = { alimentation: 'Alimentation', boissons: 'Boissons', electronique: 'Électronique', menager: 'Ménager', construction: 'Construction', autres: 'Autres' };

export default function Rapports() {
  const [onglet, setOnglet] = useState('stock');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [filtres, setFiltres] = useState({ periode: 'mois', date_debut: '', date_fin: '' });

  const charger = async () => {
    setLoading(true);
    try {
      let res;
      if (onglet === 'stock') res = await rapportsAPI.etatStock();
      else if (onglet === 'ventes') res = await rapportsAPI.ventes(filtres);
      else if (onglet === 'mouvements') res = await rapportsAPI.mouvements(filtres);
      else if (onglet === 'approvisionnements') res = await rapportsAPI.approvisionnements(filtres);
      else if (onglet === 'kpis') res = await rapportsAPI.kpis();
      setData(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { charger(); }, [onglet]);

  const onglets = [
    { key: 'stock', label: '📦 État du Stock' },
    { key: 'ventes', label: '💰 Ventes' },
    { key: 'mouvements', label: '↔️ Mouvements' },
    { key: 'approvisionnements', label: '🚚 Approvisionnements' },
    { key: 'kpis', label: '📊 KPIs' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Rapports & Statistiques</h1>
        <div className="flex gap-2">
          {onglet === 'stock' && data && (
            <button onClick={() => exporterRapportStock(data.articles || [], data.stats)} className="btn-secondary text-sm"><Download size={15}/>Export PDF</button>
          )}
          {onglet === 'ventes' && data && (
            <button onClick={() => exporterRapportVentes(data.factures || [], data.top_articles, data.ca_total)} className="btn-secondary text-sm"><Download size={15}/>Export PDF</button>
          )}
          <button onClick={charger} className="btn-secondary text-sm"><RefreshCw size={15} />Actualiser</button>
        </div>
      </div>

      {/* Navigation onglets */}
      <div className="flex flex-wrap gap-2 bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
        {onglets.map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${onglet === o.key ? 'bg-navy text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Filtres date si nécessaire */}
      {['ventes', 'mouvements', 'approvisionnements'].includes(onglet) && (
        <div className="card p-4">
          <div className="flex flex-wrap items-end gap-4">
            {onglet === 'ventes' && (
              <div>
                <label className="label">Période</label>
                <select className="select-field py-2" value={filtres.periode} onChange={e => setFiltres(f => ({ ...f, periode: e.target.value }))}>
                  <option value="jour">Aujourd'hui</option>
                  <option value="semaine">Cette semaine</option>
                  <option value="mois">Ce mois</option>
                </select>
              </div>
            )}
            {['mouvements', 'approvisionnements'].includes(onglet) && (
              <>
                <div><label className="label">Du</label><input type="date" className="input-field py-2" value={filtres.date_debut} onChange={e => setFiltres(f => ({ ...f, date_debut: e.target.value }))} /></div>
                <div><label className="label">Au</label><input type="date" className="input-field py-2" value={filtres.date_fin} onChange={e => setFiltres(f => ({ ...f, date_fin: e.target.value }))} /></div>
              </>
            )}
            <button onClick={charger} className="btn-primary text-sm py-2">Appliquer</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="spinner text-navy" /></div>
      ) : (
        <div className="space-y-6">
          {/* ---- État du stock ---- */}
          {onglet === 'stock' && data && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total articles', val: data.stats.total_articles, color: 'text-navy' },
                  { label: 'En alerte', val: data.stats.articles_alerte, color: 'text-amber-600' },
                  { label: 'En rupture', val: data.stats.articles_rupture, color: 'text-red-600' },
                  { label: 'Valeur totale', val: `${formatFC(data.stats.valeur_totale)} FC`, color: 'text-emerald-600' },
                ].map((item, i) => (
                  <div key={i} className="card text-center py-4">
                    <p className="text-xs text-gray-400 uppercase">{item.label}</p>
                    <p className={`text-xl font-bold font-poppins mt-1 break-words ${item.color}`}>{item.val}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="section-title mb-4">Valeur par catégorie</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={Object.entries(data.stats.par_categorie || {}).map(([k, v]) => ({ name: catLabel[k] || k, value: v.valeur }))}
                        cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={3}>
                        {Object.keys(data.stats.par_categorie || {}).map((_, i) => <Cell key={i} fill={COULEURS[i % COULEURS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => formatFC(v) + ' FC'} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <h3 className="section-title mb-4">Résumé par catégorie</h3>
                  <div className="space-y-2">
                    {Object.entries(data.stats.par_categorie || {}).map(([cat, v]) => (
                      <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">{catLabel[cat] || cat}</span>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-navy">{formatFC(v.valeur)} FC</p>
                          <p className="text-xs text-gray-400">{v.nb} article(s)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-gray-100"><h3 className="section-title">Liste détaillée du stock</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr>
                      <th className="table-header">Code</th>
                      <th className="table-header">Désignation</th>
                      <th className="table-header hidden sm:table-cell">Catégorie</th>
                      <th className="table-header text-right">Stock</th>
                      <th className="table-header text-right hidden md:table-cell">CAUM</th>
                      <th className="table-header text-right">Valeur</th>
                      <th className="table-header text-center">Statut</th>
                    </tr></thead>
                    <tbody>
                      {(data.articles || []).map((a, i) => {
                        const statut = parseFloat(a.stock_actuel) === 0 ? 'rupture' : parseFloat(a.stock_actuel) <= parseFloat(a.stock_minimum) ? 'alerte' : 'ok';
                        return (
                          <tr key={a.id} className={`table-row ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                            <td className="table-cell font-mono text-xs text-navy font-semibold">{a.code}</td>
                            <td className="table-cell font-medium text-gray-800">{a.designation}</td>
                            <td className="table-cell hidden sm:table-cell"><span className="badge-info text-xs">{catLabel[a.categorie]}</span></td>
                            <td className="table-cell text-right font-semibold">{a.stock_actuel} {a.unite}</td>
                            <td className="table-cell text-right hidden md:table-cell text-sm">{formatFC(a.prix_achat)} FC</td>
                            <td className="table-cell text-right font-semibold text-navy">{formatFC(parseFloat(a.stock_actuel) * parseFloat(a.prix_achat))} FC</td>
                            <td className="table-cell text-center">
                              <span className={statut === 'ok' ? 'badge-ok' : statut === 'alerte' ? 'badge-alerte' : 'badge-rupture'}>
                                {statut === 'ok' ? 'OK' : statut === 'alerte' ? 'Alerte' : 'Rupture'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ---- Ventes ---- */}
          {onglet === 'ventes' && data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card text-center py-5">
                  <p className="text-xs text-gray-400 uppercase">CA de la période</p>
                  <p className="text-3xl font-bold text-emerald-600 font-poppins mt-2">{formatFC(data.caTotal)} FC</p>
                  <p className="text-sm text-gray-400 mt-1">{data.factures?.length || 0} facture(s) payée(s)</p>
                </div>
              </div>
              <div className="card">
                <h3 className="section-title mb-4">Top 10 articles vendus</h3>
                {(data.topArticles || []).length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Aucune donnée</p> : (
                  <div className="space-y-2">
                    {data.topArticles.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{a.article?.designation}</p>
                          <p className="text-xs text-gray-400">{a.total_qte} {a.article?.unite} vendus</p>
                        </div>
                        <p className="font-semibold text-emerald-600 text-sm flex-shrink-0">{formatFC(a.total_ca)} FC</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ---- Mouvements ---- */}
          {onglet === 'mouvements' && data && (
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-100"><h3 className="section-title">Journal des mouvements</h3><p className="text-gray-400 text-sm">{data.length} mouvement(s)</p></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">Article</th>
                    <th className="table-header">Type</th>
                    <th className="table-header text-right">Quantité</th>
                    <th className="table-header text-right hidden sm:table-cell">Valeur</th>
                    <th className="table-header hidden md:table-cell">Document</th>
                  </tr></thead>
                  <tbody>
                    {(data || []).map((m, i) => (
                      <tr key={m.id} className={`table-row ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                        <td className="table-cell text-xs">{new Date(m.date).toLocaleDateString('fr-FR')}</td>
                        <td className="table-cell font-medium">{m.article?.designation}</td>
                        <td className="table-cell"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.type_mouvement === 'ENTREE' ? 'bg-emerald-100 text-emerald-700' : m.type_mouvement === 'SORTIE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{m.type_mouvement}</span></td>
                        <td className="table-cell text-right font-semibold">{m.quantite}</td>
                        <td className="table-cell text-right hidden sm:table-cell">{formatFC(m.prix_total)} FC</td>
                        <td className="table-cell hidden md:table-cell font-mono text-xs text-primary-600">{m.reference_document}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---- KPIs ---- */}
          {onglet === 'kpis' && data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { label: 'Taux de rotation stock', val: `${parseFloat(data.tauxRotation || 0).toFixed(2)}x`, desc: 'Fois / an', couleur: 'text-navy' },
                { label: 'Taux de rupture', val: `${parseFloat(data.tauxRupture || 0).toFixed(1)}%`, desc: 'Articles en rupture', couleur: parseFloat(data.tauxRupture) > 10 ? 'text-red-600' : 'text-emerald-600' },
                { label: 'Taux de surstock', val: `${parseFloat(data.tauxSurstock || 0).toFixed(1)}%`, desc: 'Articles en surstock', couleur: parseFloat(data.tauxSurstock) > 20 ? 'text-amber-600' : 'text-emerald-600' },
                { label: 'Taux de marge', val: `${parseFloat(data.tauxMarge || 0).toFixed(1)}%`, desc: 'Marge commerciale', couleur: parseFloat(data.tauxMarge) >= 20 ? 'text-emerald-600' : 'text-amber-600' },
                { label: 'Total ventes (payées)', val: `${formatFC(data.totalVentes)} FC`, desc: 'Chiffre d\'affaires', couleur: 'text-emerald-600' },
                { label: 'Total achats', val: `${formatFC(data.totalAchats)} FC`, desc: 'Coût des entrées', couleur: 'text-navy' },
              ].map((kpi, i) => (
                <div key={i} className="card flex flex-col gap-2 py-5">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{kpi.label}</p>
                  <p className={`text-3xl font-bold font-poppins ${kpi.couleur}`}>{kpi.val}</p>
                  <p className="text-xs text-gray-400">{kpi.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
