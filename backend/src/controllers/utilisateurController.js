const bcrypt = require('bcryptjs');
const { User, AuditLog } = require('../models');

const lister = async (req, res) => {
  try {
    const users = await User.findAll({ order: [['nom', 'ASC']] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const creer = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, role } = req.body;
    const existant = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existant) return res.status(409).json({ message: 'Cet email est déjà utilisé' });

    const password_hash = await bcrypt.hash(mot_de_passe, 12);
    const user = await User.create({
      nom, prenom, email: email.toLowerCase(), password_hash, role, doit_changer_mdp: true
    });
    res.status(201).json({ message: 'Utilisateur créé avec succès', user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const modifier = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const { nom, prenom, role, actif } = req.body;
    await user.update({ nom, prenom, role, actif });
    res.json({ message: 'Utilisateur modifié', user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const reinitialiserMdp = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const { nouveau_mdp } = req.body;
    const password_hash = await bcrypt.hash(nouveau_mdp || 'Temp@2026', 12);
    await user.update({ password_hash, doit_changer_mdp: true });
    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const historiqueConnexions = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      where: { action: 'CONNEXION' },
      order: [['date', 'DESC']],
      limit: 50
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { lister, creer, modifier, reinitialiserMdp, historiqueConnexions };
