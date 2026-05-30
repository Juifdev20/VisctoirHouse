const router = require('express').Router();
const ctrl = require('../controllers/caisseController');
const { authentifier } = require('../middleware/auth');
const { verifierRole } = require('../middleware/roleCheck');

const acces = verifierRole('gerant', 'caissier');

router.get('/factures', authentifier, acces, ctrl.listerFactures);
router.get('/factures/:id', authentifier, acces, ctrl.obtenirFacture);
router.post('/factures/:id/payer', authentifier, acces, ctrl.payerFacture);
router.get('/recus', authentifier, acces, ctrl.listerRecus);
router.get('/recus/:id', authentifier, acces, ctrl.obtenirRecu);
router.get('/creances', authentifier, acces, ctrl.creances);

module.exports = router;
