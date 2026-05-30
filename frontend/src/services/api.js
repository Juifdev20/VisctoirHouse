import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});

// Injecter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gérer les erreurs d'authentification
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  modifierProfil: (data) => api.put('/auth/update-profile', data),
  changerMdp: (data) => api.put('/auth/change-password', data),
};

// Dashboard
export const dashboardAPI = {
  obtenir: () => api.get('/dashboard'),
};

// Articles
export const articlesAPI = {
  lister: (params) => api.get('/articles', { params }),
  obtenir: (id) => api.get(`/articles/${id}`),
  ficheStock: (id) => api.get(`/articles/${id}/fiche-stock`),
  creer: (data) => api.post('/articles', data),
  modifier: (id, data) => api.put(`/articles/${id}`, data),
  desactiver: (id) => api.delete(`/articles/${id}`),
};

// Fournisseurs
export const fournisseursAPI = {
  lister: () => api.get('/fournisseurs'),
  obtenir: (id) => api.get(`/fournisseurs/${id}`),
  creer: (data) => api.post('/fournisseurs', data),
  modifier: (id, data) => api.put(`/fournisseurs/${id}`, data),
};

// Clients
export const clientsAPI = {
  lister: (params) => api.get('/clients', { params }),
  obtenir: (id) => api.get(`/clients/${id}`),
  creer: (data) => api.post('/clients', data),
  modifier: (id, data) => api.put(`/clients/${id}`, data),
};

// Opérations
export const operationsAPI = {
  // Commandes
  listerCommandes: (params) => api.get('/operations/commandes', { params }),
  obtenirCommande: (id) => api.get(`/operations/commandes/${id}`),
  creerCommande: (data) => api.post('/operations/commandes', data),
  soumettreCommande: (id) => api.post(`/operations/commandes/${id}/soumettre`),
  approuverCommande: (id) => api.post(`/operations/commandes/${id}/approuver`),
  // Réceptions
  listerReceptions: (params) => api.get('/operations/receptions', { params }),
  obtenirReception: (id) => api.get(`/operations/receptions/${id}`),
  creerReception: (data) => api.post('/operations/receptions', data),
  validerReception: (id) => api.post(`/operations/receptions/${id}/valider`),
  // Sorties
  listerSorties: (params) => api.get('/operations/sorties', { params }),
  obtenirSortie: (id) => api.get(`/operations/sorties/${id}`),
  creerSortie: (data) => api.post('/operations/sorties', data),
  validerSortie: (id) => api.post(`/operations/sorties/${id}/valider`),
  // Retours
  listerRetours: (params) => api.get('/operations/retours', { params }),
  obtenirRetour: (id) => api.get(`/operations/retours/${id}`),
  creerRetour: (data) => api.post('/operations/retours', data),
  validerRetour: (id) => api.post(`/operations/retours/${id}/valider`),
  // Consultation
  consulterEntrees: (params) => api.get('/operations/consultation/entrees', { params }),
  consulterSorties: (params) => api.get('/operations/consultation/sorties', { params }),
};

// Caisse
export const caisseAPI = {
  listerFactures: (params) => api.get('/caisse/factures', { params }),
  obtenirFacture: (id) => api.get(`/caisse/factures/${id}`),
  payerFacture: (id, data) => api.post(`/caisse/factures/${id}/payer`, data),
  listerRecus: () => api.get('/caisse/recus'),
  obtenirRecu: (id) => api.get(`/caisse/recus/${id}`),
  creances: () => api.get('/caisse/creances'),
};

// Inventaires
export const inventairesAPI = {
  lister: () => api.get('/inventaires'),
  obtenir: (id) => api.get(`/inventaires/${id}`),
  creer: (data) => api.post('/inventaires', data),
  majLignes: (id, data) => api.put(`/inventaires/${id}/lignes`, data),
  soumettre: (id) => api.post(`/inventaires/${id}/soumettre`),
  approuver: (id) => api.post(`/inventaires/${id}/approuver`),
};

// Rapports
export const rapportsAPI = {
  etatStock: () => api.get('/rapports/stock'),
  mouvements: (params) => api.get('/rapports/mouvements', { params }),
  ventes: (params) => api.get('/rapports/ventes', { params }),
  approvisionnements: (params) => api.get('/rapports/approvisionnements', { params }),
  kpis: () => api.get('/rapports/kpis'),
};

// Alertes
export const alertesAPI = {
  lister: () => api.get('/alertes'),
  marquerLue: (id) => api.put(`/alertes/${id}/lire`),
  marquerToutesLues: () => api.put('/alertes/lire-tout'),
};

// Utilisateurs
export const utilisateursAPI = {
  lister: () => api.get('/utilisateurs'),
  creer: (data) => api.post('/utilisateurs', data),
  modifier: (id, data) => api.put(`/utilisateurs/${id}`, data),
  reinitMdp: (id, data) => api.put(`/utilisateurs/${id}/reset-password`, data),
};

// Paramètres
export const parametresAPI = {
  obtenir: () => api.get('/parametres'),
  mettreAJour: (data) => api.put('/parametres', data),
  audit: (params) => api.get('/parametres/audit', { params }),
};

export default api;
