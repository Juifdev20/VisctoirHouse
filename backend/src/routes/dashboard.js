const router = require('express').Router();
const { obtenirDashboard } = require('../controllers/dashboardController');
const { authentifier } = require('../middleware/auth');

router.get('/', authentifier, obtenirDashboard);

module.exports = router;
