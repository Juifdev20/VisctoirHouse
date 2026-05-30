# 🏢 La Victoire House — Système de Gestion des Stocks

Application web complète de gestion des stocks pour **ETS La Victoire House**, Beni, Nord-Kivu, RDC.

---

## 🛠️ Stack Technique

| Couche | Technologie |
|---|---|
| Backend | Node.js + Express.js |
| Base de données | PostgreSQL + Sequelize ORM |
| Authentification | JWT (8h expiry) + bcryptjs |
| Frontend | React.js 18 + Vite |
| CSS | Tailwind CSS 3 |
| Graphiques | Recharts |
| Notifications | React Hot Toast |

---

## 📁 Structure du projet

```
La Victoire House/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration DB
│   │   ├── controllers/     # Logique métier
│   │   ├── middleware/      # Auth, roleCheck, errorHandler
│   │   ├── models/          # Modèles Sequelize
│   │   ├── routes/          # Routes Express
│   │   └── utils/           # Helpers, audit
│   ├── seeders/
│   │   └── initialData.js   # Données initiales
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # Layout (Sidebar, Topbar)
    │   ├── context/         # AuthContext
    │   ├── pages/           # Toutes les pages
    │   └── services/        # API calls (axios)
    └── package.json
```

---

## 🚀 Installation et démarrage

### 1. Prérequis
- Node.js >= 18
- PostgreSQL >= 14

### 2. Backend

```bash
cd backend
npm install
```

Créer le fichier `.env` :
```bash
cp .env.example .env
```

Éditer `.env` avec vos informations :
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/victoire_house_db
JWT_SECRET=votre_secret_tres_securise_ici
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:3000
```

Créer la base de données PostgreSQL :
```sql
CREATE DATABASE victoire_house_db;
```

Démarrer le serveur (synchronise automatiquement la DB) :
```bash
npm run dev
```

Initialiser les données de base (comptes + fournisseurs + articles démo) :
```bash
node seeders/initialData.js
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application sera disponible sur **http://localhost:3000**

---

## 🔐 Comptes par défaut (après seed)

| Rôle | Email | Mot de passe |
|---|---|---|
| Gérant | admin@victoirehouse.cd | Admin@2024 |
| Agent de Stock | agent@victoirehouse.cd | Agent@2024 |
| Caissier | caisse@victoirehouse.cd | Caisse@2024 |

> ⚠️ Changer les mots de passe à la première connexion !

---

## 👤 Rôles et accès

| Module | Gérant | Agent Stock | Caissier | Agent Sécurité |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Articles | ✅ | ✅ | ❌ | ❌ |
| Opérations | ✅ | ✅ | ❌ | 👁️ Lecture |
| Fournisseurs | ✅ | ✅ | ❌ | ❌ |
| Clients | ✅ | ✅ | ✅ | ❌ |
| Caisse/Factures | ✅ | ❌ | ✅ | ❌ |
| Inventaire | ✅ | ✅ | ❌ | ❌ |
| Rapports | ✅ | ❌ | ✅ | ❌ |
| Alertes | ✅ | ✅ | ✅ | ✅ |
| Utilisateurs | ✅ | ❌ | ❌ | ❌ |
| Paramètres | ✅ | ❌ | ❌ | ❌ |

---

## 📦 API Endpoints

| Préfixe | Description |
|---|---|
| `/api/auth` | Authentification JWT |
| `/api/dashboard` | KPIs et données tableau de bord |
| `/api/articles` | CRUD articles + fiche stock |
| `/api/fournisseurs` | CRUD fournisseurs |
| `/api/clients` | CRUD clients |
| `/api/operations` | BC, BR, BS, retours, consultation |
| `/api/caisse` | Factures, reçus, créances |
| `/api/inventaires` | Gestion des inventaires |
| `/api/rapports` | Rapports et KPIs |
| `/api/alertes` | Centre de notifications |
| `/api/utilisateurs` | Gestion des comptes |
| `/api/parametres` | Paramètres système + journal audit |
| `/api/health` | État du serveur |

---

## ⚙️ Règles métier clés

- **FIFO** : Gestion des sorties premier entré = premier sorti
- **CAUM** : Coût d'Achat Unitaire Moyen recalculé à chaque réception
- **Stocks de sécurité** : Chine=15%, Ouganda=35%, Dar-es-Salaam=50%
- **Alertes automatiques** : Rupture, seuil minimum, expiration proche
- **Numérotation** : Format `PREFIX-YYYY-NNN` (ex: `BC-2024-001`)
- **Workflows** : BC (brouillon → soumis → approuvé → reçu)
- **Audit log** : Toutes les actions critiques sont enregistrées
- **Pas de suppression** : Les utilisateurs sont désactivés, jamais supprimés

---

## 🌐 Interface utilisateur

- **Langue** : Français uniquement
- **Couleurs** : Navy #1E3A5F, Or #F59E0B, Blanc cassé #F8FAFC
- **Polices** : Poppins (titres), Inter (corps de texte)
- **Responsive** : Mobile, tablette et desktop
