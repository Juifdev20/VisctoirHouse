const router = require('express').Router();
const ctrl = require('../controllers/rapportController');
const { authentifier } = require('../middleware/auth');
const { verifierRole } = require('../middleware/roleCheck');

const acces = verifierRole('gerant', 'caissier');

router.get('/stock', authentifier, acces, ctrl.etatStock);
router.get('/mouvements', authentifier, acces, ctrl.mouvements);
router.get('/ventes', authentifier, acces, ctrl.ventes);
router.get('/approvisionnements', authentifier, acces, ctrl.approvisionnements);
router.get('/kpis', authentifier, acces, ctrl.kpis);

module.exports = router;
