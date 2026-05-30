const { Article, MouvementStock, BonCommande, Facture, Alerte, sequelize } = require('../models');
const { Op } = require('sequelize');

const obtenirDashboard = async (req, res) => {
  try {
    const aujourd_hui = new Date();
    const debutJour = new Date(aujourd_hui.setHours(0, 0, 0, 0));
    const finJour = new Date(aujourd_hui.setHours(23, 59, 59, 999));

    // KPIs articles
    const totalArticles = await Article.count({ where: { actif: true } });
    const articlesAlerte = await Article.count({
      where: { actif: true, stock_actuel: { [Op.gt]: 0, [Op.lte]: sequelize.col('stock_minimum') } }
    });
    const articlesRupture = await Article.count({ where: { actif: true, stock_actuel: 0 } });

    // Valeur totale du stock
    const articles = await Article.findAll({ where: { actif: true }, attributes: ['stock_actuel', 'prix_achat'] });
    const valeurStock = articles.reduce((sum, a) => sum + parseFloat(a.stock_actuel) * parseFloat(a.prix_achat), 0);

    // Commandes en attente
    const commandesEnAttente = await BonCommande.count({ where: { statut: ['brouillon', 'en_attente', 'approuve'] } });

    // CA du jour
    const caJour = await Facture.sum('montant_total', {
      where: { date: { [Op.between]: [debutJour, finJour] }, statut_paiement: 'paye' }
    }) || 0;

    // Mouvements 7 derniers jours
    const sept_jours = new Date();
    sept_jours.setDate(sept_jours.getDate() - 7);
    const mouvements7j = await MouvementStock.findAll({
      where: { date: { [Op.gte]: sept_jours } },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('date')), 'jour'],
        'type_mouvement',
        [sequelize.fn('SUM', sequelize.col('quantite')), 'total_quantite'],
        [sequelize.fn('SUM', sequelize.col('prix_total')), 'total_valeur']
      ],
      group: [sequelize.fn('DATE', sequelize.col('date')), 'type_mouvement'],
      order: [[sequelize.fn('DATE', sequelize.col('date')), 'ASC']]
    });

    // Répartition par catégorie
    const repartitionCategorie = await Article.findAll({
      where: { actif: true },
      attributes: [
        'categorie',
        [sequelize.fn('COUNT', sequelize.col('id')), 'nb_articles'],
        [sequelize.fn('SUM', sequelize.literal('stock_actuel * prix_achat')), 'valeur']
      ],
      group: ['categorie']
    });

    // Alertes actives
    const alertes = await Alerte.findAll({
      where: { lue: false },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Derniers mouvements
    const derniersMouvements = await MouvementStock.findAll({
      include: [{ model: require('../models').Article, as: 'article', attributes: ['designation', 'unite'] }],
      order: [['date', 'DESC']],
      limit: 5
    });

    // Articles sous seuil
    const articlesSeuil = await Article.findAll({
      where: { actif: true, stock_actuel: { [Op.lte]: sequelize.col('stock_minimum') } },
      include: [{ model: require('../models').Fournisseur, as: 'fournisseur', attributes: ['nom'] }],
      limit: 10
    });

    res.json({
      kpis: { totalArticles, articlesAlerte, articlesRupture, valeurStock, commandesEnAttente, caJour },
      mouvements7j,
      repartitionCategorie,
      alertes,
      derniersMouvements,
      articlesSeuil
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { obtenirDashboard };
