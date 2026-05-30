const router = require('express').Router();
const ctrl = require('../controllers/articleController');
const { authentifier } = require('../middleware/auth');
const { verifierRole } = require('../middleware/roleCheck');

const accesArticles = verifierRole('gerant', 'agent_stock');

router.get('/', authentifier, accesArticles, ctrl.listerArticles);
router.get('/:id', authentifier, accesArticles, ctrl.obtenirArticle);
router.get('/:id/fiche-stock', authentifier, ctrl.obtenirFicheStock);
router.post('/', authentifier, accesArticles, ctrl.creerArticle);
router.put('/:id', authentifier, accesArticles, ctrl.modifierArticle);
router.delete('/:id', authentifier, verifierRole('gerant'), ctrl.desactiverArticle);

module.exports = router;
