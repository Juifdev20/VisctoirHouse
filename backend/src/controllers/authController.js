const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { enregistrerAudit } = require('../utils/audit');

const connexion = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    if (!user.actif) {
      return res.status(403).json({ message: 'Compte désactivé. Contactez le gérant.' });
    }

    const mdpValide = await user.verifierMotDePasse(mot_de_passe);
    if (!mdpValide) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    await user.update({ derniere_connexion: new Date() });

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await enregistrerAudit(user, 'CONNEXION', 'AUTH', { email: user.email }, req.ip);

    res.json({
      message: 'Connexion réussie',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const obtenirProfil = async (req, res) => {
  res.json({ user: req.user.toJSON() });
};

const modifierProfil = async (req, res) => {
  try {
    const { prenom, nom, email } = req.body;
    const user = req.user;

    if (!prenom || !nom || !email) {
      return res.status(400).json({ message: 'Prénom, nom et email sont obligatoires' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    if (email.toLowerCase() !== user.email) {
      const { User } = require('../models');
      const existing = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre compte' });
      }
    }

    await user.update({
      prenom: prenom.trim(),
      nom: nom.trim().toUpperCase(),
      email: email.toLowerCase().trim()
    });

    await enregistrerAudit(user, 'MODIFICATION_PROFIL', 'AUTH', { prenom, nom, email }, req.ip);

    res.json({ message: 'Profil mis à jour avec succès', user: user.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const changerMotDePasse = async (req, res) => {
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe, ancien_mdp, nouveau_mdp } = req.body;
    const ancienMdp = ancien_mot_de_passe || ancien_mdp;
    const nouveauMdp = nouveau_mot_de_passe || nouveau_mdp;
    const user = req.user;

    if (!ancienMdp || !nouveauMdp) {
      return res.status(400).json({ message: 'Ancien et nouveau mot de passe requis' });
    }

    const valide = await user.verifierMotDePasse(ancienMdp);
    if (!valide) {
      return res.status(400).json({ message: 'Ancien mot de passe incorrect' });
    }

    if (nouveauMdp.length < 8) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit avoir au moins 8 caractères' });
    }

    const hash = await bcrypt.hash(nouveauMdp, 12);
    await user.update({ password_hash: hash, doit_changer_mdp: false });

    await enregistrerAudit(user, 'CHANGEMENT_MDP', 'AUTH', {}, req.ip);

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const deconnexion = async (req, res) => {
  await enregistrerAudit(req.user, 'DECONNEXION', 'AUTH', {}, req.ip);
  res.json({ message: 'Déconnexion réussie' });
};

module.exports = { connexion, obtenirProfil, modifierProfil, changerMotDePasse, deconnexion };
