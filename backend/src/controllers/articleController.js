const { Article, Fournisseur, MouvementStock, User, Alerte } = require('../models');
const { Op } = require('sequelize');
const { enregistrerAudit } = require('../utils/audit');

const listerArticles = async (req, res) => {
  try {
    const { page = 1, limite = 20, recherche, categorie, id_fournisseur, statut } = req.query;
    const offset = (page - 1) * limite;

    const where = { actif: true };
    if (recherche) {
      where[Op.or] = [
        { designation: { [Op.iLike]: `%${recherche}%` } },
        { code: { [Op.iLike]: `%${recherche}%` } }
      ];
    }
    if (categorie) where.categorie = categorie;
    if (id_fournisseur) where.id_fournisseur_principal = id_fournisseur;
    if (statut === 'alerte') where.stock_actuel = { [Op.lte]: require('sequelize').col('stock_minimum') };
    if (statut === 'rupture') where.stock_actuel = 0;

    const { count, rows } = await Article.findAndCountAll({
      where,
      include: [{ model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nom', 'pays'] }],
      order: [['designation', 'ASC']],
      limit: parseInt(limite),
      offset
    });

    res.json({ total: count, page: parseInt(page), articles: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const obtenirArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [{ model: Fournisseur, as: 'fournisseur' }]
    });
    if (!article) return res.status(404).json({ message: 'Article introuvable' });

    const mouvements = await MouvementStock.findAll({
      where: { id_article: article.id },
      include: [{ model: User, as: 'utilisateur', attributes: ['nom', 'prenom'] }],
      order: [['date', 'DESC']],
      limit: 50
    });

    res.json({ article, mouvements });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const creerArticle = async (req, res) => {
  try {
    const { code, designation, categorie, unite, methode_gestion, categorie_abc, emplacement, notes, stock_initial } = req.body;
    const id_fournisseur_principal = req.body.id_fournisseur_principal || null;
    const date_expiration = req.body.date_expiration || null;
    const stock_minimum = parseFloat(req.body.stock_minimum) || 0;
    const stock_maximum = parseFloat(req.body.stock_maximum) || 0;
    const stock_securite_pct = parseFloat(req.body.stock_securite_pct) || 15;
    const prix_achat = parseFloat(req.body.prix_achat) || 0;
    const prix_vente = parseFloat(req.body.prix_vente) || 0;

    let codeArticle = code;
    if (!codeArticle) {
      const count = await Article.count();
      codeArticle = `ART-${String(count + 1).padStart(4, '0')}`;
    }

    const article = await Article.create({
      code: codeArticle, designation, categorie, unite: unite || 'pièce',
      id_fournisseur_principal,
      stock_actuel: parseFloat(stock_initial) || 0,
      stock_minimum, stock_maximum, stock_securite_pct,
      prix_achat, prix_vente, caum: prix_achat,
      methode_gestion: methode_gestion || 'FIFO',
      categorie_abc: categorie_abc || 'C',
      emplacement: emplacement || null,
      date_expiration, notes: notes || null
    });

    if (stock_initial && stock_initial > 0) {
      await MouvementStock.create({
        date: new Date(), id_article: article.id, type_mouvement: 'ENTREE',
        quantite: stock_initial, prix_unitaire: prix_achat,
        prix_total: stock_initial * prix_achat,
        stock_avant: 0, stock_apres: stock_initial,
        reference_document: 'STOCK_INITIAL', type_document: 'INITIAL',
        id_utilisateur: req.user.id, notes: 'Stock initial'
      });
    }

    await enregistrerAudit(req.user, 'CREATE_ARTICLE', 'ARTICLES', { code: codeArticle, designation }, req.ip);
    res.status(201).json({ message: 'Article créé avec succès', article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const modifierArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article introuvable' });

    const { designation, categorie, unite, methode_gestion, categorie_abc, emplacement, notes } = req.body;
    const id_fournisseur_principal = req.body.id_fournisseur_principal || null;
    const date_expiration = req.body.date_expiration || null;
    const stock_minimum = parseFloat(req.body.stock_minimum) || 0;
    const stock_maximum = parseFloat(req.body.stock_maximum) || 0;
    const stock_securite_pct = parseFloat(req.body.stock_securite_pct) || 15;
    const prix_achat = parseFloat(req.body.prix_achat) || 0;
    const prix_vente = parseFloat(req.body.prix_vente) || 0;

    await article.update({
      designation, categorie, unite: unite || 'pièce', id_fournisseur_principal,
      stock_minimum, stock_maximum, stock_securite_pct, prix_achat, prix_vente,
      methode_gestion: methode_gestion || 'FIFO',
      categorie_abc: categorie_abc || 'C',
      emplacement: emplacement || null, date_expiration, notes: notes || null
    });

    await enregistrerAudit(req.user, 'UPDATE_ARTICLE', 'ARTICLES', { id: article.id }, req.ip);
    res.json({ message: 'Article modifié avec succès', article });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const desactiverArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article introuvable' });
    await article.update({ actif: false });
    res.json({ message: 'Article désactivé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const obtenirFicheStock = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [{ model: Fournisseur, as: 'fournisseur' }]
    });
    if (!article) return res.status(404).json({ message: 'Article introuvable' });

    const mouvements = await MouvementStock.findAll({
      where: { id_article: article.id },
      include: [{ model: User, as: 'utilisateur', attributes: ['nom', 'prenom'] }],
      order: [['date', 'ASC']]
    });

    res.json({ article, mouvements });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { listerArticles, obtenirArticle, creerArticle, modifierArticle, desactiverArticle, obtenirFicheStock };
