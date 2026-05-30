const router = require('express').Router();
const { connexion, obtenirProfil, modifierProfil, changerMotDePasse, deconnexion } = require('../controllers/authController');
const { authentifier } = require('../middleware/auth');

router.post('/login', connexion);
router.post('/logout', authentifier, deconnexion);
router.get('/me', authentifier, obtenirProfil);
router.put('/update-profile', authentifier, modifierProfil);
router.put('/change-password', authentifier, changerMotDePasse);

module.exports = router;
