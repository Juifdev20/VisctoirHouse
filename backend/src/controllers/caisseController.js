const { Facture, Recu, Client, BonSortie, LigneSortie, Article, User } = require('../models');
const { Op } = require('sequelize');
const { genererNumero, montantEnLettres } = require('../utils/helpers');

const listerFactures = async (req, res) => {
  try {
    const { statut_paiement, id_client, page = 1, limite = 20 } = req.query;
    const where = {};
    if (statut_paiement) where.statut_paiement = statut_paiement;
    if (id_client) where.id_client = id_client;

    const { count, rows } = await Facture.findAndCountAll({
      where,
      include: [{ model: Client, as: 'client', attributes: ['id', 'nom', 'telephone'] }],
      order: [['date', 'DESC']],
      limit: parseInt(limite),
      offset: (page - 1) * limite
    });
    const factures = rows.map(f => { const p = f.toJSON(); p.montant_du = Math.max(0, parseFloat(p.montant_total) - parseFloat(p.montant_paye)); return p; });
    res.json({ total: count, factures });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const obtenirFacture = async (req, res) => {
  try {
    const facture = await Facture.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: BonSortie, as: 'bonSortie', include: [
          { model: LigneSortie, as: 'lignes', include: [{ model: Article, as: 'article' }] }
        ]},
        { model: User, as: 'caissier', attributes: ['nom', 'prenom'] },
        { model: User, as: 'createur', attributes: ['nom', 'prenom'] },
        { model: Recu, as: 'recus', include: [{ model: User, as: 'caissier', attributes: ['nom', 'prenom'] }] }
      ]
    });
    if (!facture) return res.status(404).json({ message: 'Facture introuvable' });
    const plain = facture.toJSON();
    plain.montant_du = Math.max(0, parseFloat(plain.montant_total) - parseFloat(plain.montant_paye));
    res.json({ facture: plain });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const payerFacture = async (req, res) => {
  try {
    const { montant, mode_paiement = 'especes', notes = '' } = req.body;
    const montant_paye = parseFloat(montant);
    if (!montant_paye || montant_paye <= 0) return res.status(400).json({ message: 'Montant invalide' });
    const facture = await Facture.findByPk(req.params.id, {
      include: [{ model: Client, as: 'client' }]
    });
    if (!facture) return res.status(404).json({ message: 'Facture introuvable' });
    if (facture.statut_paiement === 'paye') return res.status(400).json({ message: 'Facture déjà payée' });

    const montantPayeTotal = parseFloat(facture.montant_paye) + montant_paye;
    const statut = montantPayeTotal >= parseFloat(facture.montant_total) ? 'paye' : 'partiel';

    await facture.update({
      montant_paye: montantPayeTotal,
      statut_paiement: statut,
      id_caissier: req.user.id,
      date_paiement: new Date()
    });

    // Mise à jour du solde client
    if (statut === 'paye') {
      const client = await Client.findByPk(facture.id_client);
      const nouveauSolde = Math.max(0, parseFloat(client.solde_du) - parseFloat(montant_paye));
      await client.update({ solde_du: nouveauSolde });
    }

    // Génération du reçu
    const numeroRecu = await genererNumero(Recu, 'numero', 'RECU');
    const motif = `Paiement de la facture N° ${facture.numero}`;
    const recu = await Recu.create({
      numero: numeroRecu, date: new Date(), date_paiement: new Date(),
      id_client: facture.id_client, id_facture: facture.id, motif,
      montant: montant_paye, mode_paiement,
      montant_lettres: montantEnLettres(montant_paye),
      id_caissier: req.user.id, notes: notes || null
    });

    res.json({ message: 'Paiement enregistré — reçu généré', recu_id: recu.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const listerRecus = async (req, res) => {
  try {
    const { count, rows } = await Recu.findAndCountAll({
      include: [
        { model: Client, as: 'client', attributes: ['id', 'nom'] },
        { model: Facture, as: 'facture', attributes: ['id', 'numero'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ total: count, recus: rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const obtenirRecu = async (req, res) => {
  try {
    const recu = await Recu.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: Facture, as: 'facture' },
        { model: User, as: 'caissier', attributes: ['nom', 'prenom'] }
      ]
    });
    if (!recu) return res.status(404).json({ message: 'Reçu introuvable' });
    res.json(recu);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const creances = async (req, res) => {
  try {
    const clients = await Client.findAll({
      where: { solde_du: { [Op.gt]: 0 }, actif: true },
      order: [['solde_du', 'DESC']]
    });
    const total = clients.reduce((sum, c) => sum + parseFloat(c.solde_du), 0);
    res.json({ creances: clients, total_creances: total });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { listerFactures, obtenirFacture, payerFacture, listerRecus, obtenirRecu, creances };
