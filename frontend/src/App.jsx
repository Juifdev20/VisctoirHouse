import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import ArticleForm from './pages/ArticleForm';
import ArticleDetail from './pages/ArticleDetail';
import Operations from './pages/Operations';
import Fournisseurs from './pages/Fournisseurs';
import FournisseurForm from './pages/FournisseurForm';
import FournisseurDetail from './pages/FournisseurDetail';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import ClientDetail from './pages/ClientDetail';
import Caisse from './pages/Caisse';
import FactureDetail from './pages/FactureDetail';
import Inventaire from './pages/Inventaire';
import InventaireDetail from './pages/InventaireDetail';
import Rapports from './pages/Rapports';
import Alertes from './pages/Alertes';
import Utilisateurs from './pages/Utilisateurs';
import Parametres from './pages/Parametres';
import Profil from './pages/Profil';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full spinner mx-auto mb-4"></div>
        <p className="text-gray-500 font-inter">Chargement...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/articles" element={<PrivateRoute roles={['gerant','agent_stock']}><Articles /></PrivateRoute>} />
        <Route path="/articles/nouveau" element={<PrivateRoute roles={['gerant','agent_stock']}><ArticleForm /></PrivateRoute>} />
        <Route path="/articles/:id" element={<PrivateRoute roles={['gerant','agent_stock']}><ArticleDetail /></PrivateRoute>} />
        <Route path="/articles/:id/modifier" element={<PrivateRoute roles={['gerant','agent_stock']}><ArticleForm /></PrivateRoute>} />
        <Route path="/operations/*" element={<PrivateRoute roles={['gerant','agent_stock','agent_securite']}><Operations /></PrivateRoute>} />
        <Route path="/fournisseurs" element={<PrivateRoute roles={['gerant','agent_stock']}><Fournisseurs /></PrivateRoute>} />
        <Route path="/fournisseurs/nouveau" element={<PrivateRoute roles={['gerant','agent_stock']}><FournisseurForm /></PrivateRoute>} />
        <Route path="/fournisseurs/:id" element={<PrivateRoute roles={['gerant','agent_stock']}><FournisseurDetail /></PrivateRoute>} />
        <Route path="/fournisseurs/:id/modifier" element={<PrivateRoute roles={['gerant','agent_stock']}><FournisseurForm /></PrivateRoute>} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/nouveau" element={<ClientForm />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/clients/:id/modifier" element={<ClientForm />} />
        <Route path="/caisse/*" element={<PrivateRoute roles={['gerant','caissier']}><Caisse /></PrivateRoute>} />
        <Route path="/caisse/factures/:id" element={<PrivateRoute roles={['gerant','caissier']}><FactureDetail /></PrivateRoute>} />
        <Route path="/inventaire" element={<PrivateRoute roles={['gerant','agent_stock']}><Inventaire /></PrivateRoute>} />
        <Route path="/inventaire/:id" element={<PrivateRoute roles={['gerant','agent_stock']}><InventaireDetail /></PrivateRoute>} />
        <Route path="/rapports" element={<PrivateRoute roles={['gerant','caissier']}><Rapports /></PrivateRoute>} />
        <Route path="/alertes" element={<Alertes />} />
        <Route path="/utilisateurs" element={<PrivateRoute roles={['gerant']}><Utilisateurs /></PrivateRoute>} />
        <Route path="/parametres" element={<PrivateRoute roles={['gerant']}><Parametres /></PrivateRoute>} />
        <Route path="/profil" element={<Profil />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
