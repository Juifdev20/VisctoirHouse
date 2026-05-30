const { Fournisseur, BonCommande } = require('../models');
const { Op } = require('sequelize');

const lister = async (req, res) => {
  try {
    const fournisseurs = await Fournisseur.findAll({ where: { actif: true }, order: [['nom', 'ASC']] });
    res.json(fournisseurs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const creer = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.create(req.body);
    res.status(201).json({ message: 'Fournisseur créé', fournisseur });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const modifier = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByPk(req.params.id);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable' });
    await fournisseur.update(req.body);
    res.json({ message: 'Fournisseur modifié', fournisseur });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const desactiver = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByPk(req.params.id);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable' });
    await fournisseur.update({ actif: false });
    res.json({ message: 'Fournisseur désactivé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const obtenirDetail = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByPk(req.params.id);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable' });

    const commandes = await BonCommande.findAll({
      where: { id_fournisseur: fournisseur.id },
      order: [['date_creation', 'DESC']],
      limit: 20
    });

    res.json({ fournisseur, commandes });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { lister, creer, modifier, desactiver, obtenirDetail };
