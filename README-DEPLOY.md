# Déploiement sur Render — La Victoire House

## Architecture déployée

| Service | Type | Description |
|---------|------|-------------|
| `la-victoire-house` | Web Service (Node.js) | Backend Express + Frontend React servis ensemble |
| `victoirehouse-db` | PostgreSQL | Base de données managée |

Le backend sert les fichiers statiques du frontend (`frontend/dist`). Toutes les routes non-`/api` redirigent vers `index.html` (comportement SPA).

---

## Prérequis

- Compte [Render](https://render.com) (gratuit)
- Projet poussé sur **GitHub**

---

## Méthode 1 : Blueprint (recommandée) — `render.yaml`

1. **Poussez le code sur GitHub**
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin main
   ```

2. **Créez un Blueprint sur Render**
   - Allez sur [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
   - Cliquez **New Blueprint Instance**
   - Connectez votre repo GitHub
   - Sélectionnez le repo `La Victoire House`
   - Render lit automatiquement `render.yaml` et crée :
     - Le Web Service `la-victoire-house`
     - La base PostgreSQL `victoirehouse-db`

3. **Attendez le premier déploiement**
   - Le build installe les dépendances frontend + backend
   - Le frontend est compilé dans `frontend/dist/`
   - Le backend démarre et sert le frontend

4. **Seed la base de données (UNE SEULE FOIS)**
   - Allez dans l'onglet **Shell** du Web Service
   - Exécutez :
     ```bash
     node seeders/initialData.js
     ```

---

## Méthode 2 : Manuelle (si Blueprint échoue)

### Étape 1 : Créer la base PostgreSQL

1. Dashboard → **New** → **PostgreSQL**
2. Nom : `victoirehouse-db`
3. Region : `Frankfurt (EU Central)`
4. Plan : **Free**
5. Créez → copiez la **Internal Database URL**

### Étape 2 : Créer le Web Service

1. Dashboard → **New** → **Web Service**
2. Connectez votre repo GitHub
3. Configurez :

   | Paramètre | Valeur |
   |-----------|--------|
   | Name | `la-victoire-house` |
   | Region | `Frankfurt (EU Central)` |
   | Branch | `main` |
   | Root Directory | `backend` |
   | Runtime | `Node` |
   | Build Command | `npm run build && npm install` |
   | Start Command | `npm start` |

4. **Environment Variables** :

   | Clé | Valeur |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `DATABASE_URL` | *(collez l'URL interne de la BD)* |
   | `JWT_SECRET` | Générez une chaîne longue aléatoire |
   | `JWT_EXPIRES_IN` | `8h` |
   | `FRONTEND_URL` | `https://la-victoire-house.onrender.com` |

5. Déployez → attendez le build

### Étape 3 : Seeder la base

- Onglet **Shell** du Web Service :
  ```bash
  node seeders/initialData.js
  ```

---

## Vérifications post-déploiement

| Test | URL |
|------|-----|
| API Health | `https://<votre-url>/api/health` |
| Page login | `https://<votre-url>/login` |
| Logo visible | `https://<votre-url>/logo.png` |

**Compte admin par défaut** (créé par le seeder) :
- Email : `admin@victoirehouse.cd`
- Mot de passe : `Admin@2024`

---

## Variables d'environnement importantes

### Backend (`backend/.env` en local)

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://...
JWT_SECRET=GENERATE_A_STRONG_RANDOM_SECRET
JWT_EXPIRES_IN=8h
FRONTEND_URL=https://la-victoire-house.onrender.com
```

### Frontend (aucune `.env` requise en prod)

Le frontend utilise `import.meta.env.VITE_API_URL || '/api'`. Comme le backend et le frontend sont servis sur le même domaine, `/api` fonctionne automatiquement. Aucune variable d'environnement frontend n'est nécessaire.

---

## Limites du plan gratuit Render

| Ressource | Limite |
|-----------|--------|
| Web Service | S'endort après 15 min d'inactivité (réveil ~30s) |
| PostgreSQL | 1 Go, s'expire après 90 jours d'inactivité |
| Bande passante | 100 Go/mois |

Pour éviter la mise en veille : configurez un **Cron Job** gratuit qui ping `/api/health` toutes les 10 minutes, ou passez au plan payant ($7/mois).

---

## Dépannage

### Erreur `Cannot find module 'frontend/dist'`
Le build frontend n'a pas été exécuté. Vérifiez que `Build Command` contient `npm run build` (qui exécute `cd ../frontend && npm install && npm run build`).

### Erreur `connection refused` PostgreSQL
Vérifiez que `DATABASE_URL` pointe vers l'URL **interne** de Render (pas l'externe). Le format attendu :
```
postgresql://user:pass@host:5432/dbname
```

### Page blanche après login
Vérifiez la console navigateur (F12) → onglet **Network**. Si les appels API renvoient 404, le `baseURL` est peut-être mal configuré. Avec le déploiement ci-dessus, `/api` devrait fonctionner nativement.

---

## Mise à jour du déploiement

```bash
git add .
git commit -m "Mise à jour fonctionnalité X"
git push origin main
```

Render redéploie automatiquement à chaque push sur `main`.
