const { Parametre, AuditLog } = require('../models');

const obtenirParametres = async (req, res) => {
  try {
    const params = await Parametre.findAll();
    const result = {};
    params.forEach(p => { result[p.cle] = p.valeur; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const mettreAJour = async (req, res) => {
  try {
    const donnees = req.body;
    for (const [cle, valeur] of Object.entries(donnees)) {
      await Parametre.upsert({ cle, valeur: String(valeur) });
    }
    res.json({ message: 'Paramètres mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const obtenirAudit = async (req, res) => {
  try {
    const { page = 1, limite = 50 } = req.query;
    const { count, rows } = await AuditLog.findAndCountAll({
      order: [['date', 'DESC']],
      limit: parseInt(limite),
      offset: (page - 1) * limite
    });
    res.json({ total: count, logs: rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { obtenirParametres, mettreAJour, obtenirAudit };
