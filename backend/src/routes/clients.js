const router = require('express').Router();
const ctrl = require('../controllers/clientController');
const { authentifier } = require('../middleware/auth');
const { verifierRole } = require('../middleware/roleCheck');

router.get('/', authentifier, verifierRole('gerant', 'agent_stock', 'caissier'), ctrl.lister);
router.get('/:id', authentifier, verifierRole('gerant', 'agent_stock', 'caissier'), ctrl.obtenirDetail);
router.post('/', authentifier, verifierRole('gerant', 'agent_stock', 'caissier'), ctrl.creer);
router.put('/:id', authentifier, verifierRole('gerant', 'agent_stock', 'caissier'), ctrl.modifier);

module.exports = router;
