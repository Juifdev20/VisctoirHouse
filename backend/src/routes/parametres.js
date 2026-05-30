const router = require('express').Router();
const ctrl = require('../controllers/parametreController');
const { authentifier } = require('../middleware/auth');
const { verifierRole } = require('../middleware/roleCheck');

router.get('/', authentifier, ctrl.obtenirParametres);
router.put('/', authentifier, verifierRole('gerant'), ctrl.mettreAJour);
router.get('/audit', authentifier, verifierRole('gerant'), ctrl.obtenirAudit);

module.exports = router;
