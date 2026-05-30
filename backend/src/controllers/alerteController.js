const { Alerte, Article } = require('../models');

const lister = async (req, res) => {
  try {
    const alertes = await Alerte.findAll({
      include: [{ model: Article, as: 'article', attributes: ['id', 'code', 'designation'] }],
      order: [['created_at', 'DESC']],
      limit: 50
    });
    const nonLues = await Alerte.count({ where: { lue: false } });
    res.json({ alertes, nonLues });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const marquerLue = async (req, res) => {
  try {
    await Alerte.update({ lue: true }, { where: { id: req.params.id } });
    res.json({ message: 'Alerte marquée comme lue' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const marquerToutesLues = async (req, res) => {
  try {
    await Alerte.update({ lue: true }, { where: { lue: false } });
    res.json({ message: 'Toutes les alertes marquées comme lues' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { lister, marquerLue, marquerToutesLues };
