const router = require('express').Router();
const ctrl = require('../controllers/inventaireController');
const { authentifier } = require('../middleware/auth');
const { verifierRole } = require('../middleware/roleCheck');

const acces = verifierRole('gerant', 'agent_stock');

router.get('/', authentifier, acces, ctrl.lister);
router.get('/:id', authentifier, acces, ctrl.obtenirDetail);
router.post('/', authentifier, acces, ctrl.creer);
router.put('/:id/lignes', authentifier, acces, ctrl.mettreAJourLignes);
router.post('/:id/soumettre', authentifier, acces, ctrl.soumettre);
router.post('/:id/approuver', authentifier, verifierRole('gerant'), ctrl.approuver);

module.exports = router;
