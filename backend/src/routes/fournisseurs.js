const router = require('express').Router();
const ctrl = require('../controllers/fournisseurController');
const { authentifier } = require('../middleware/auth');
const { verifierRole } = require('../middleware/roleCheck');

const acces = verifierRole('gerant', 'agent_stock');

router.get('/', authentifier, acces, ctrl.lister);
router.get('/:id', authentifier, acces, ctrl.obtenirDetail);
router.post('/', authentifier, acces, ctrl.creer);
router.put('/:id', authentifier, acces, ctrl.modifier);
router.delete('/:id', authentifier, verifierRole('gerant'), ctrl.desactiver);

module.exports = router;
