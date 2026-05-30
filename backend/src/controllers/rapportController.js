const { Article, MouvementStock, Facture, BonCommande, LigneSortie, Client, Fournisseur, sequelize } = require('../models');
const { Op } = require('sequelize');

const etatStock = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: { actif: true },
      include: [{ model: Fournisseur, as: 'fournisseur', attributes: ['nom', 'pays'] }],
      order: [['designation', 'ASC']]
    });

    const stats = {
      total_articles: articles.length,
      articles_alerte: articles.filter(a => parseFloat(a.stock_actuel) > 0 && parseFloat(a.stock_actuel) <= parseFloat(a.stock_minimum)).length,
      articles_rupture: articles.filter(a => parseFloat(a.stock_actuel) === 0).length,
      valeur_totale: articles.reduce((sum, a) => sum + parseFloat(a.stock_actuel) * parseFloat(a.prix_achat), 0),
      par_categorie: {}
    };

    articles.forEach(a => {
      if (!stats.par_categorie[a.categorie]) {
        stats.par_categorie[a.categorie] = { nb: 0, valeur: 0 };
      }
      stats.par_categorie[a.categorie].nb++;
      stats.par_categorie[a.categorie].valeur += parseFloat(a.stock_actuel) * parseFloat(a.prix_achat);
    });

    res.json({ articles, stats });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const mouvements = async (req, res) => {
  try {
    const { date_debut, date_fin, id_article, type_mouvement } = req.query;
    const where = {};
    if (id_article) where.id_article = id_article;
    if (type_mouvement) where.type_mouvement = type_mouvement;
    if (date_debut && date_fin) {
      where.date = { [Op.between]: [new Date(date_debut), new Date(date_fin + 'T23:59:59')] };
    }

    const data = await MouvementStock.findAll({
      where,
      include: [
        { model: Article, as: 'article', attributes: ['code', 'designation', 'unite'] },
        { model: require('../models').User, as: 'utilisateur', attributes: ['nom', 'prenom'] }
      ],
      order: [['date', 'DESC']]
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const ventes = async (req, res) => {
  try {
    const { periode = 'mois' } = req.query;
    const now = new Date();
    let dateDebut;

    if (periode === 'jour') { dateDebut = new Date(now.setHours(0, 0, 0, 0)); }
    else if (periode === 'semaine') { dateDebut = new Date(); dateDebut.setDate(dateDebut.getDate() - 7); }
    else { dateDebut = new Date(); dateDebut.setDate(1); }

    const factures = await Facture.findAll({
      where: { date: { [Op.gte]: dateDebut }, statut_paiement: 'paye' },
      include: [{ model: Client, as: 'client', attributes: ['nom'] }]
    });

    const caTotal = factures.reduce((sum, f) => sum + parseFloat(f.montant_total), 0);

    // Top 10 articles vendus
    const topArticles = await LigneSortie.findAll({
      attributes: [
        'id_article',
        [sequelize.fn('SUM', sequelize.col('quantite')), 'total_qte'],
        [sequelize.fn('SUM', sequelize.col('prix_total')), 'total_ca']
      ],
      include: [{ model: Article, as: 'article', attributes: ['designation', 'unite'] }],
      group: ['id_article', 'article.id', 'article.designation', 'article.unite'],
      order: [[sequelize.fn('SUM', sequelize.col('prix_total')), 'DESC']],
      limit: 10
    });

    res.json({ factures, caTotal, topArticles });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const approvisionnements = async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query;
    const where = {};
    if (date_debut && date_fin) {
      where.created_at = { [Op.between]: [new Date(date_debut), new Date(date_fin + 'T23:59:59')] };
    }

    const commandes = await BonCommande.findAll({
      where,
      include: [{ model: Fournisseur, as: 'fournisseur', attributes: ['nom', 'pays'] }],
      order: [['created_at', 'DESC']]
    });

    const totalParFournisseur = {};
    commandes.forEach(c => {
      const nom = c.fournisseur?.nom || 'Inconnu';
      if (!totalParFournisseur[nom]) totalParFournisseur[nom] = 0;
      totalParFournisseur[nom] += parseFloat(c.montant_total);
    });

    res.json({ commandes, totalParFournisseur, total: commandes.reduce((s, c) => s + parseFloat(c.montant_total), 0) });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const kpis = async (req, res) => {
  try {
    const articles = await Article.findAll({ where: { actif: true } });
    const totalSorties = await MouvementStock.sum('quantite', { where: { type_mouvement: 'SORTIE' } }) || 0;
    const stockMoyen = articles.reduce((sum, a) => sum + parseFloat(a.stock_actuel), 0) / (articles.length || 1);
    const tauxRotation = stockMoyen > 0 ? (totalSorties / stockMoyen) : 0;

    const tauxRupture = articles.filter(a => parseFloat(a.stock_actuel) === 0).length / (articles.length || 1) * 100;
    const tauxSurstock = articles.filter(a => parseFloat(a.stock_actuel) > parseFloat(a.stock_maximum) && parseFloat(a.stock_maximum) > 0).length / (articles.length || 1) * 100;

    const totalVentes = await Facture.sum('montant_total', { where: { statut_paiement: 'paye' } }) || 0;
    const totalAchats = await MouvementStock.sum('prix_total', { where: { type_mouvement: 'ENTREE' } }) || 0;
    const tauxMarge = totalVentes > 0 ? ((totalVentes - totalAchats) / totalVentes) * 100 : 0;

    res.json({ tauxRotation, tauxRupture, tauxSurstock, tauxMarge, totalVentes, totalAchats });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { etatStock, mouvements, ventes, approvisionnements, kpis };
