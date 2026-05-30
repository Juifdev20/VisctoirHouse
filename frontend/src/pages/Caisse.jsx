import { Routes, Route, NavLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { caisseAPI } from '../services/api';
import { Eye, CreditCard, Loader2, DollarSign, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const formatFC = (v) => new Intl.NumberFormat('fr-CD').format(Math.round(v || 0));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

// ---- Factures ----
const Factures = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('');

  useEffect(() => {
    caisseAPI.listerFactures().then(r => setItems(r.data.factures || [])).finally(() => setLoading(false));
  }, []);

  const filtered = filtre ? items.filter(f => f.statut_paiement === filtre) : items;
  const totalImpaye = items.filter(f => f.statut_paiement !== 'paye').reduce((s, f) => s + parseFloat(f.montant_du), 0);

  return (
    <div className="space-y-5">
      {totalImpaye > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 text-sm font-medium">
            Total des créances en cours : <strong>{formatFC(totalImpaye)} FC</strong>
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {[['', 'Toutes'], ['non_paye', 'Impayées'], ['partiel', 'Partielles'], ['paye', 'Payées']].map(([val, label]) => (
          <button key={val} onClick={() => setFiltre(val)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${filtre === val ? 'bg-navy text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-header rounded-tl-2xl">N° Facture</th>
              <th className="table-header">Client</th>
              <th className="table-header hidden sm:table-cell">Date</th>
              <th className="table-header text-right">Montant</th>
              <th className="table-header text-right hidden md:table-cell">Payé</th>
              <th className="table-header text-right hidden md:table-cell">Restant</th>
              <th className="table-header">Statut</th>
              <th className="table-header rounded-tr-2xl text-center">Action</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="py-16 text-center"><Loader2 size={28} className="spinner text-navy mx-auto" /></td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-sm">Aucune facture</td></tr>
              : filtered.map((f, i) => (
                <tr key={f.id} className={`table-row ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="table-cell font-mono text-xs text-primary-600 font-semibold">{f.numero}</td>
                  <td className="table-cell font-medium text-gray-800">{f.client?.nom}</td>
                  <td className="table-cell hidden sm:table-cell text-sm">{fmtDate(f.date)}</td>
                  <td className="table-cell text-right font-semibold">{formatFC(f.montant_total)} FC</td>
                  <td className="table-cell text-right hidden md:table-cell text-emerald-600 font-medium">{formatFC(f.montant_paye)} FC</td>
                  <td className="table-cell text-right hidden md:table-cell text-red-600 font-medium">{formatFC(f.montant_du)} FC</td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${f.statut_paiement === 'paye' ? 'bg-emerald-100 text-emerald-700' : f.statut_paiement === 'partiel' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {f.statut_paiement === 'paye' ? 'Payé' : f.statut_paiement === 'partiel' ? 'Partiel' : 'Impayé'}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <button onClick={() => navigate(`/caisse/factures/${f.id}`)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg">
                      <Eye size={15} />
                    </button>
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

// ---- Recus ----
const Recus = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { caisseAPI.listerRecus().then(r => setItems(r.data.recus || [])).finally(() => setLoading(false)); }, []);

  return (
    <div className="space-y-5">
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-header rounded-tl-2xl">N° Reçu</th>
              <th className="table-header">Client</th>
              <th className="table-header">Facture liée</th>
              <th className="table-header hidden sm:table-cell">Date</th>
              <th className="table-header text-right">Montant encaissé</th>
              <th className="table-header rounded-tr-2xl hidden sm:table-cell">Mode</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="py-16 text-center"><Loader2 size={28} className="spinner text-navy mx-auto" /></td></tr>
              : items.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Aucun reçu enregistré</td></tr>
              : items.map((r, i) => (
                <tr key={r.id} className={`table-row ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="table-cell font-mono text-xs text-primary-600 font-semibold">{r.numero}</td>
                  <td className="table-cell font-medium">{r.client?.nom}</td>
                  <td className="table-cell font-mono text-xs text-gray-500">{r.facture?.numero || '—'}</td>
                  <td className="table-cell hidden sm:table-cell text-sm">{fmtDate(r.date_paiement)}</td>
                  <td className="table-cell text-right font-bold text-emerald-600">{formatFC(r.montant)} FC</td>
                  <td className="table-cell hidden sm:table-cell capitalize text-sm">{r.mode_paiement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ---- Créances ----
const Creances = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { caisseAPI.creances().then(r => setData(r.data.creances || [])).finally(() => setLoading(false)); }, []);

  const total = data.reduce((s, c) => s + parseFloat(c.solde_du), 0);

  return (
    <div className="space-y-5">
      {total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card text-center py-4 border-2 border-red-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total créances</p>
            <p className="text-xl font-bold text-red-600 font-poppins mt-1 break-words">{formatFC(total)} FC</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Nb clients débiteurs</p>
            <p className="text-xl font-bold text-navy font-poppins mt-1">{data.length}</p>
          </div>
        </div>
      )}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-header rounded-tl-2xl">Client</th>
              <th className="table-header text-right">Montant dû</th>
              <th className="table-header text-right hidden sm:table-cell">Limite crédit</th>
              <th className="table-header hidden sm:table-cell">Téléphone</th>
              <th className="table-header rounded-tr-2xl text-center">Action</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="py-16 text-center"><Loader2 size={28} className="spinner text-navy mx-auto" /></td></tr>
              : data.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-emerald-600 font-medium">✅ Aucune créance en cours</td></tr>
              : data.map((c, i) => (
                <tr key={c.id} className={`table-row ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="table-cell font-medium text-gray-800">{c.nom}</td>
                  <td className="table-cell text-right font-bold text-red-600">{formatFC(c.solde_du)} FC</td>
                  <td className="table-cell text-right hidden sm:table-cell text-gray-500">{formatFC(c.limite_credit)} FC</td>
                  <td className="table-cell hidden sm:table-cell text-gray-500 text-sm">{c.telephone || '—'}</td>
                  <td className="table-cell text-center">
                    <button onClick={() => navigate(`/clients/${c.id}`)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg">
                      <Eye size={15} />
                    </button>
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

const navCaisse = [
  { path: '/caisse/factures', label: '🧾 Factures' },
  { path: '/caisse/recus', label: '✅ Reçus de paiement' },
  { path: '/caisse/creances', label: '⚠️ Suivi créances' },
];

export default function Caisse() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
        {navCaisse.map(n => (
          <NavLink key={n.path} to={n.path}
            className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-navy text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
            {n.label}
          </NavLink>
        ))}
      </div>
      <Routes>
        <Route index element={<Navigate to="factures" replace />} />
        <Route path="factures" element={<Factures />} />
        <Route path="recus" element={<Recus />} />
        <Route path="creances" element={<Creances />} />
        <Route path="*" element={<Navigate to="factures" replace />} />
      </Routes>
    </div>
  );
}
