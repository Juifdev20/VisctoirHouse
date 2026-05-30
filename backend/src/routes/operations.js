const router = require('express').Router();
const ctrl = require('../controllers/operationsController');
const { authentifier } = require('../middleware/auth');
const { verifierRole } = require('../middleware/roleCheck');

const acces = verifierRole('gerant', 'agent_stock');
const lecture = verifierRole('gerant', 'agent_stock', 'agent_securite');

// Bons de Commande
router.get('/commandes', authentifier, acces, ctrl.listerCommandes);
router.get('/commandes/:id', authentifier, acces, ctrl.obtenirCommande);
router.post('/commandes', authentifier, acces, ctrl.creerCommande);
router.post('/commandes/:id/soumettre', authentifier, acces, ctrl.soumettreCommande);
router.post('/commandes/:id/approuver', authentifier, verifierRole('gerant'), ctrl.approuverCommande);

// Réceptions
router.get('/receptions', authentifier, acces, ctrl.listerReceptions);
router.get('/receptions/:id', authentifier, acces, ctrl.obtenirReception);
router.post('/receptions', authentifier, acces, ctrl.creerReception);
router.post('/receptions/:id/valider', authentifier, acces, ctrl.validerReception);

// Bons de Sortie
router.get('/sorties', authentifier, acces, ctrl.listerSorties);
router.get('/sorties/:id', authentifier, acces, ctrl.obtenirSortie);
router.post('/sorties', authentifier, acces, ctrl.creerSortie);
router.post('/sorties/:id/valider', authentifier, acces, ctrl.validerSortie);

// Retours
router.get('/retours', authentifier, acces, ctrl.listerRetours);
router.get('/retours/:id', authentifier, acces, ctrl.obtenirRetour);
router.post('/retours', authentifier, acces, ctrl.creerRetour);
router.post('/retours/:id/valider', authentifier, acces, ctrl.validerRetour);

// Consultation (lecture seule)
router.get('/consultation/entrees', authentifier, lecture, ctrl.consulterEntrees);
router.get('/consultation/sorties', authentifier, lecture, ctrl.consulterSorties);

module.exports = router;
