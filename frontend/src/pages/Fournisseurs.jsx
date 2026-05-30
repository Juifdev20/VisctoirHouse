import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fournisseursAPI } from '../services/api';
import { Plus, Eye, Edit, Loader2, Truck } from 'lucide-react';

export default function Fournisseurs() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fournisseursAPI.lister().then(r => setItems(r.data)).finally(() => setLoading(false)); }, []);

  const drapeaux = { Chine: '🇨🇳', Tanzanie: '🇹🇿', Ouganda: '🇺🇬', RDC: '🇨🇩' };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Fournisseurs</h1><p className="text-gray-400 text-sm">{items.length} fournisseur(s)</p></div>
        <button onClick={() => navigate('/fournisseurs/nouveau')} className="btn-primary"><Plus size={17} />Nouveau fournisseur</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 flex justify-center py-16"><Loader2 size={28} className="spinner text-navy" /></div>
        ) : items.map(f => (
          <div key={f.id} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/fournisseurs/${f.id}`)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{drapeaux[f.pays] || '🌍'}</div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight">{f.nom}</h3>
                  <p className="text-xs text-gray-400">{f.ville}, {f.pays}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {f.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Délai moyen</span>
                <span className="font-medium text-gray-700">{f.delai_moyen_jours} jours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Stock sécurité</span>
                <span className="font-medium text-amber-600">{f.stock_securite_pct}%</span>
              </div>
              {f.telephone && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Contact</span>
                  <span className="font-medium text-gray-700 text-xs">{f.telephone}</span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
              <button onClick={e => { e.stopPropagation(); navigate(`/fournisseurs/${f.id}`); }}
                className="flex-1 py-2 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors flex items-center justify-center gap-1">
                <Eye size={13} /> Détail
              </button>
              <button onClick={e => { e.stopPropagation(); navigate(`/fournisseurs/${f.id}/modifier`); }}
                className="flex-1 py-2 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-1">
                <Edit size={13} /> Modifier
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
