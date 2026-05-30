const router = require('express').Router();
const ctrl = require('../controllers/utilisateurController');
const { authentifier } = require('../middleware/auth');
const { verifierRole } = require('../middleware/roleCheck');

const gerantOnly = verifierRole('gerant');

router.get('/', authentifier, gerantOnly, ctrl.lister);
router.post('/', authentifier, gerantOnly, ctrl.creer);
router.put('/:id', authentifier, gerantOnly, ctrl.modifier);
router.put('/:id/reset-password', authentifier, gerantOnly, ctrl.reinitialiserMdp);
router.get('/connexions/historique', authentifier, gerantOnly, ctrl.historiqueConnexions);

module.exports = router;
