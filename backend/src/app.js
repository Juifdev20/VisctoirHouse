require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const { gestionErreur } = require('./middleware/errorHandler');

const app = express();

// CORS : autoriser le frontend local et le frontend en production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (Postman, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../uploads');
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/fournisseurs', require('./routes/fournisseurs'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/operations', require('./routes/operations'));
app.use('/api/caisse', require('./routes/caisse'));
app.use('/api/inventaires', require('./routes/inventaires'));
app.use('/api/rapports', require('./routes/rapports'));
app.use('/api/alertes', require('./routes/alertes'));
app.use('/api/utilisateurs', require('./routes/utilisateurs'));
app.use('/api/parametres', require('./routes/parametres'));

// Route de santé
app.get('/api/health', (req, res) => res.json({ status: 'OK', app: 'La Victoire House API', version: '1.0.0' }));

// Servir le frontend en production
const distPath = path.join(__dirname, '../../frontend/dist');
if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath));
  // Fallback SPA — toutes les routes non-API vers index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// Gestion des erreurs
app.use(gestionErreur);

const PORT = process.env.PORT || 5000;

const demarrer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL établie');
    await sequelize.sync({ alter: true });
    console.log('✅ Base de données synchronisée');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur La Victoire House démarré sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Erreur démarrage:', err);
    process.exit(1);
  }
};

demarrer();
