import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Package, Truck, Users, ShoppingCart, CreditCard,
  ClipboardList, BarChart3, Bell, Settings, UserCog, X,
  ArrowLeftRight, ChevronDown, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  {
    label: 'Tableau de bord', icon: LayoutDashboard, path: '/dashboard',
    roles: ['gerant', 'agent_stock', 'caissier', 'agent_securite']
  },
  {
    label: 'Articles', icon: Package, path: '/articles',
    roles: ['gerant', 'agent_stock']
  },
  {
    label: 'Opérations de Stock', icon: ArrowLeftRight, path: '/operations',
    roles: ['gerant', 'agent_stock', 'agent_securite'],
    children: [
      { label: 'Bons de Commande', path: '/operations/commandes' },
      { label: 'Réceptions', path: '/operations/receptions' },
      { label: 'Bons de Sortie', path: '/operations/sorties' },
      { label: 'Retours Clients', path: '/operations/retours' },
      { label: 'Consultation', path: '/operations/consultation' },
    ]
  },
  {
    label: 'Fournisseurs', icon: Truck, path: '/fournisseurs',
    roles: ['gerant', 'agent_stock']
  },
  {
    label: 'Clients', icon: Users, path: '/clients',
    roles: ['gerant', 'agent_stock', 'caissier']
  },
  {
    label: 'Caisse & Facturation', icon: CreditCard, path: '/caisse',
    roles: ['gerant', 'caissier'],
    children: [
      { label: 'Factures', path: '/caisse/factures' },
      { label: 'Reçus de paiement', path: '/caisse/recus' },
      { label: 'Suivi des créances', path: '/caisse/creances' },
    ]
  },
  {
    label: 'Inventaire', icon: ClipboardList, path: '/inventaire',
    roles: ['gerant', 'agent_stock']
  },
  {
    label: 'Rapports', icon: BarChart3, path: '/rapports',
    roles: ['gerant', 'caissier']
  },
  {
    label: 'Alertes', icon: Bell, path: '/alertes',
    roles: ['gerant', 'agent_stock', 'caissier', 'agent_securite']
  },
  {
    label: 'Utilisateurs', icon: UserCog, path: '/utilisateurs',
    roles: ['gerant']
  },
  {
    label: 'Paramètres', icon: Settings, path: '/parametres',
    roles: ['gerant']
  },
];

const NavItem = ({ item, onClose }) => {
  const location = useLocation();
  const [expanded, setExpanded] = useState(
    item.children?.some(c => location.pathname.startsWith(c.path))
  );

  if (item.children) {
    const isActive = item.children.some(c => location.pathname.startsWith(c.path));
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            isActive
              ? 'bg-navy dark:bg-gray-700 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <item.icon size={18} className="flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {expanded && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-300 dark:border-gray-600 pl-3">
            {item.children.map(child => (
              <NavLink
                key={child.path}
                to={child.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gold-500 text-white shadow-md'
                      : 'text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-navy dark:bg-gray-700 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
        }`
      }
    >
      <item.icon size={18} className="flex-shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
};

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  const itemsVisibles = menuItems.filter(item =>
    item.roles.includes(user?.role)
  );

  const roleLabel = {
    gerant: 'Gérant',
    agent_stock: 'Agent de Stock',
    caissier: 'Caissier/Comptable',
    agent_securite: 'Agent de Sécurité'
  };

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-30
      w-64 flex-shrink-0 flex flex-col
      bg-gray-100 dark:bg-gray-800
      border-r border-gray-200 dark:border-gray-700
      transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="La Victoire House" className="w-10 h-10 rounded-xl object-cover shadow-lg" />
          <div>
            <p className="text-gray-900 dark:text-white font-bold text-sm font-poppins leading-tight">LA VICTOIRE</p>
            <p className="text-navy dark:text-gold-400 text-xs font-semibold tracking-wide">HOUSE</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {itemsVisibles.map(item => (
          <NavItem key={item.path} item={item} onClose={onClose} />
        ))}
      </nav>

      {/* Utilisateur connecté */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <NavLink to="/profil" onClick={onClose} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <div className="w-9 h-9 bg-gold-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-800 dark:text-white text-sm font-medium truncate">{user?.prenom} {user?.nom}</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{roleLabel[user?.role]}</p>
          </div>
        </NavLink>
      </div>
    </aside>
  );
}
