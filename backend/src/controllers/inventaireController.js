const { Inventaire, LigneInventaire, Article, User, MouvementStock, sequelize } = require('../models');
const { enregistrerAudit } = require('../utils/audit');

const lister = async (req, res) => {
  try {
    const inventaires = await Inventaire.findAll({
      include: [{ model: User, as: 'agent', attributes: ['nom', 'prenom'] }],
      order: [['created_at', 'DESC']]
    });
    res.json(inventaires);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const creer = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { type, observations } = req.body;

    const inventaire = await Inventaire.create({
      date: new Date(), type, statut: 'en_cours',
      id_agent: req.user.id, observations
    }, { transaction: t });

    // Générer les lignes selon le type
    let whereArticle = { actif: true };
    if (type === 'QUOTIDIEN') whereArticle.categorie_abc = 'A';
    else if (type === 'HEBDO') whereArticle.categorie_abc = ['A', 'B'];

    let articles = await Article.findAll({ where: whereArticle });

    // Si aucun article ne correspond au filtre ABC, inclure tous les articles actifs
    if (articles.length === 0) {
      articles = await Article.findAll({ where: { actif: true } });
    }

    for (const article of articles) {
      await LigneInventaire.create({
        id_inventaire: inventaire.id,
        id_article: article.id,
        stock_theorique: article.stock_actuel,
        stock_physique: 0,
        ecart: -article.stock_actuel,
        valeur_ecart: -article.stock_actuel * article.prix_achat
      }, { transaction: t });
    }

    await t.commit();
    await enregistrerAudit(req.user, 'CREATE_INVENTAIRE', 'INVENTAIRE', { type }, req.ip);
    res.status(201).json({ message: 'Inventaire créé', inventaire_id: inventaire.id });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const obtenirDetail = async (req, res) => {
  try {
    const inventaire = await Inventaire.findByPk(req.params.id, {
      include: [
        { model: User, as: 'agent', attributes: ['nom', 'prenom'] },
        { model: LigneInventaire, as: 'lignes', include: [{ model: Article, as: 'article', attributes: ['id', 'code', 'designation', 'unite', 'prix_achat'] }] }
      ]
    });
    if (!inventaire) return res.status(404).json({ message: 'Inventaire introuvable' });
    res.json(inventaire);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const mettreAJourLignes = async (req, res) => {
  try {
    const { lignes } = req.body;
    for (const ligne of lignes) {
      const ligneInv = await LigneInventaire.findByPk(ligne.id);
      if (ligneInv) {
        const article = await Article.findByPk(ligneInv.id_article);
        const ecart = ligne.stock_physique - ligneInv.stock_theorique;
        const valeur_ecart = ecart * parseFloat(article.prix_achat);
        await ligneInv.update({ stock_physique: ligne.stock_physique, ecart, valeur_ecart, observation: ligne.observation });
      }
    }
    res.json({ message: 'Lignes mises à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const soumettre = async (req, res) => {
  try {
    const inventaire = await Inventaire.findByPk(req.params.id);
    if (!inventaire) return res.status(404).json({ message: 'Inventaire introuvable' });
    await inventaire.update({ statut: 'soumis' });
    res.json({ message: 'Inventaire soumis pour approbation' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const approuver = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const inventaire = await Inventaire.findByPk(req.params.id, {
      include: [{ model: LigneInventaire, as: 'lignes' }]
    });
    if (!inventaire) return res.status(404).json({ message: 'Inventaire introuvable' });

    for (const ligne of inventaire.lignes) {
      if (ligne.ecart !== 0) {
        const article = await Article.findByPk(ligne.id_article, { transaction: t });
        const stockAvant = parseFloat(article.stock_actuel);
        const stockApres = parseFloat(ligne.stock_physique);
        await article.update({ stock_actuel: stockApres }, { transaction: t });
        await MouvementStock.create({
          date: new Date(), id_article: article.id, type_mouvement: 'AJUSTEMENT',
          quantite: Math.abs(ligne.ecart), prix_unitaire: article.prix_achat,
          prix_total: Math.abs(ligne.ecart) * article.prix_achat,
          stock_avant: stockAvant, stock_apres: stockApres,
          reference_document: `INV-${inventaire.id}`, type_document: 'INVENTAIRE',
          id_utilisateur: req.user.id, notes: 'Ajustement inventaire'
        }, { transaction: t });
      }
    }

    await inventaire.update({ statut: 'approuve', id_gerant: req.user.id, date_approbation: new Date() }, { transaction: t });
    await t.commit();
    res.json({ message: 'Inventaire approuvé — stock ajusté' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { lister, creer, obtenirDetail, mettreAJourLignes, soumettre, approuver };
