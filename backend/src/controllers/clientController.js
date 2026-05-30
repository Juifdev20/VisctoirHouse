const { Client, Facture } = require('../models');
const { Op } = require('sequelize');

const lister = async (req, res) => {
  try {
    const { recherche } = req.query;
    const where = { actif: true };
    if (recherche) {
      where[Op.or] = [
        { nom: { [Op.iLike]: `%${recherche}%` } },
        { telephone: { [Op.iLike]: `%${recherche}%` } }
      ];
    }
    const clients = await Client.findAll({ where, order: [['nom', 'ASC']] });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const creer = async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json({ message: 'Client créé', client });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const modifier = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client introuvable' });
    await client.update(req.body);
    res.json({ message: 'Client modifié', client });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const obtenirDetail = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client introuvable' });

    const factures = await Facture.findAll({
      where: { id_client: client.id },
      order: [['date', 'DESC']],
      limit: 20
    });

    res.json({ client, factures });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { lister, creer, modifier, obtenirDetail };
