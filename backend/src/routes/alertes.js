const router = require('express').Router();
const ctrl = require('../controllers/alerteController');
const { authentifier } = require('../middleware/auth');

router.get('/', authentifier, ctrl.lister);
router.put('/:id/lire', authentifier, ctrl.marquerLue);
router.put('/lire-tout', authentifier, ctrl.marquerToutesLues);

module.exports = router;
