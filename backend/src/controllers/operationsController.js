const { sequelize, BonCommande, LigneCommande, BonReception, LigneReception,
  BonSortie, LigneSortie, BonRetour, LigneRetour,
  Article, Fournisseur, Client, User, MouvementStock, Facture, Alerte } = require('../models');
const { Op } = require('sequelize');
const { genererNumero } = require('../utils/helpers');
const { enregistrerAudit } = require('../utils/audit');

// ===================== BONS DE COMMANDE =====================
const listerCommandes = async (req, res) => {
  try {
    const { statut, id_fournisseur, page = 1, limite = 20 } = req.query;
    const where = {};
    if (statut) where.statut = statut;
    if (id_fournisseur) where.id_fournisseur = id_fournisseur;

    const { count, rows } = await BonCommande.findAndCountAll({
      where,
      include: [
        { model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nom', 'pays'] },
        { model: User, as: 'createur', attributes: ['nom', 'prenom'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limite),
      offset: (page - 1) * limite
    });
    res.json({ total: count, commandes: rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const obtenirCommande = async (req, res) => {
  try {
    const bc = await BonCommande.findByPk(req.params.id, {
      include: [
        { model: Fournisseur, as: 'fournisseur' },
        { model: User, as: 'createur', attributes: ['nom', 'prenom'] },
        { model: User, as: 'validateur', attributes: ['nom', 'prenom'] },
        { model: LigneCommande, as: 'lignes', include: [{ model: Article, as: 'article' }] }
      ]
    });
    if (!bc) return res.status(404).json({ message: 'Bon de commande introuvable' });
    res.json(bc);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const creerCommande = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { mode_paiement, observations, lignes } = req.body;
    const id_fournisseur = req.body.id_fournisseur || null;
    const date_echeance = req.body.date_echeance || null;
    const numero = await genererNumero(BonCommande, 'numero', 'BC');

    if (!id_fournisseur) { await t.rollback(); return res.status(400).json({ message: 'Fournisseur requis' }); }
    if (!lignes || lignes.length === 0) { await t.rollback(); return res.status(400).json({ message: 'Au moins une ligne requise' }); }

    const montant_total = lignes.reduce((sum, l) => sum + ((parseFloat(l.quantite_commandee) || 0) * (parseFloat(l.prix_unitaire) || 0)), 0);

    const bc = await BonCommande.create({
      numero, date_creation: new Date(), id_fournisseur, date_echeance,
      mode_paiement: mode_paiement || 'especes', observations: observations || null,
      montant_total, statut: 'brouillon', id_createur: req.user.id
    }, { transaction: t });

    for (const ligne of lignes) {
      const id_article = ligne.id_article || null;
      if (!id_article) continue;
      await LigneCommande.create({
        id_bon_commande: bc.id, id_article,
        quantite_commandee: parseFloat(ligne.quantite_commandee) || 0,
        quantite_suggeree: parseFloat(ligne.quantite_suggeree) || 0,
        prix_unitaire: parseFloat(ligne.prix_unitaire) || 0,
        prix_total: (parseFloat(ligne.quantite_commandee) || 0) * (parseFloat(ligne.prix_unitaire) || 0)
      }, { transaction: t });
    }

    await t.commit();
    await enregistrerAudit(req.user, 'CREATE_BC', 'OPERATIONS', { numero }, req.ip);
    res.status(201).json({ message: 'Bon de commande créé', bc });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const soumettreCommande = async (req, res) => {
  try {
    const bc = await BonCommande.findByPk(req.params.id);
    if (!bc) return res.status(404).json({ message: 'Bon de commande introuvable' });
    if (bc.statut !== 'brouillon') return res.status(400).json({ message: 'Ce bon de commande ne peut plus être soumis' });

    await bc.update({ statut: 'en_attente' });

    await Alerte.create({
      type_alerte: 'approbation',
      message: `Bon de commande ${bc.numero} en attente d'approbation`,
      reference_document: bc.numero
    });

    res.json({ message: 'Bon de commande soumis pour approbation' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const approuverCommande = async (req, res) => {
  try {
    const bc = await BonCommande.findByPk(req.params.id);
    if (!bc) return res.status(404).json({ message: 'Bon de commande introuvable' });
    if (bc.statut !== 'en_attente') return res.status(400).json({ message: 'Statut invalide pour approbation' });

    await bc.update({ statut: 'approuve', id_validateur_gerant: req.user.id, date_validation: new Date() });
    res.json({ message: 'Bon de commande approuvé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ===================== RÉCEPTIONS =====================
const listerReceptions = async (req, res) => {
  try {
    const { statut_global, id_fournisseur, page = 1, limite = 20 } = req.query;
    const where = {};
    if (statut_global) where.statut_global = statut_global;
    if (id_fournisseur) where.id_fournisseur = id_fournisseur;

    const { count, rows } = await BonReception.findAndCountAll({
      where,
      include: [
        { model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nom'] },
        { model: BonCommande, as: 'bonCommande', attributes: ['id', 'numero'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limite),
      offset: (page - 1) * limite
    });
    res.json({ total: count, receptions: rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const creerReception = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { nom_livreur, tel_livreur, observations, lignes } = req.body;
    const id_fournisseur = req.body.id_fournisseur || null;
    const id_bon_commande = req.body.id_bon_commande || null;
    const numero = await genererNumero(BonReception, 'numero', 'BR');

    if (!id_fournisseur) { await t.rollback(); return res.status(400).json({ message: 'Fournisseur requis' }); }
    if (!lignes || lignes.length === 0) { await t.rollback(); return res.status(400).json({ message: 'Au moins une ligne requise' }); }

    const br = await BonReception.create({
      numero, date_reception: new Date(), id_fournisseur, id_bon_commande,
      nom_livreur: nom_livreur || null, tel_livreur: tel_livreur || null,
      observations: observations || null, statut_global: 'en_cours',
      id_agent: req.user.id
    }, { transaction: t });

    for (const ligne of lignes) {
      const id_article = ligne.id_article || null;
      if (!id_article) continue;
      await LigneReception.create({
        id_bordereau: br.id, id_article,
        quantite_commandee: parseFloat(ligne.quantite_commandee) || 0,
        quantite_recue: parseFloat(ligne.quantite_recue) || 0,
        unite: ligne.unite || 'pièce',
        prix_unitaire: parseFloat(ligne.prix_unitaire) || 0,
        prix_total: (parseFloat(ligne.quantite_recue) || 0) * (parseFloat(ligne.prix_unitaire) || 0),
        etat: ligne.etat || 'conforme',
        observations: ligne.observations || null
      }, { transaction: t });
    }

    await t.commit();
    await enregistrerAudit(req.user, 'CREATE_BR', 'OPERATIONS', { numero }, req.ip);
    res.status(201).json({ message: 'Bordereau de réception créé', br });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const validerReception = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const br = await BonReception.findByPk(req.params.id, {
      include: [{ model: LigneReception, as: 'lignes' }]
    });
    if (!br) return res.status(404).json({ message: 'Bordereau introuvable' });
    if (br.valide) return res.status(400).json({ message: 'Déjà validé' });

    for (const ligne of br.lignes) {
      if (ligne.quantite_recue > 0 && ligne.etat !== 'abime') {
        const article = await Article.findByPk(ligne.id_article, { transaction: t });
        const stockAvant = parseFloat(article.stock_actuel);
        const stockApres = stockAvant + parseFloat(ligne.quantite_recue);

        const ancienCaum = parseFloat(article.caum) || 0;
        const ancienneValeur = stockAvant * ancienCaum;
        const valeurEntree = parseFloat(ligne.quantite_recue) * parseFloat(ligne.prix_unitaire);
        const nouveauCaum = (ancienneValeur + valeurEntree) / stockApres;

        await article.update({ stock_actuel: stockApres, caum: nouveauCaum }, { transaction: t });

        await MouvementStock.create({
          date: new Date(), id_article: article.id, type_mouvement: 'ENTREE',
          quantite: ligne.quantite_recue, prix_unitaire: ligne.prix_unitaire,
          prix_total: ligne.quantite_recue * ligne.prix_unitaire,
          stock_avant: stockAvant, stock_apres: stockApres,
          reference_document: br.numero, type_document: 'BR',
          id_utilisateur: req.user.id
        }, { transaction: t });

        if (stockApres > 0 && stockAvant === 0) {
          await Alerte.destroy({ where: { type_alerte: 'rupture_stock', id_article: article.id } });
        }
      }
    }

    let statutGlobal = 'conforme';
    const nonConformes = br.lignes.filter(l => l.etat === 'non_conforme' || l.etat === 'abime');
    if (nonConformes.length > 0) statutGlobal = 'non_conforme';

    await br.update({ valide: true, statut_global: statutGlobal, date_validation: new Date() }, { transaction: t });

    if (br.id_bon_commande) {
      const bc = await BonCommande.findByPk(br.id_bon_commande);
      if (bc) await bc.update({ statut: 'recu' }, { transaction: t });
    }

    await t.commit();
    await enregistrerAudit(req.user, 'VALIDER_BR', 'OPERATIONS', { numero: br.numero }, req.ip);
    res.json({ message: 'Réception validée — stock mis à jour' });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const obtenirReception = async (req, res) => {
  try {
    const br = await BonReception.findByPk(req.params.id, {
      include: [
        { model: Fournisseur, as: 'fournisseur' },
        { model: BonCommande, as: 'bonCommande', attributes: ['id', 'numero'] },
        { model: User, as: 'agent', attributes: ['nom', 'prenom'] },
        { model: LigneReception, as: 'lignes', include: [{ model: Article, as: 'article' }] }
      ]
    });
    if (!br) return res.status(404).json({ message: 'Bordereau introuvable' });
    res.json(br);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ===================== BONS DE SORTIE =====================
const listerSorties = async (req, res) => {
  try {
    const { statut, id_client, page = 1, limite = 20 } = req.query;
    const where = {};
    if (statut) where.statut = statut;
    if (id_client) where.id_client = id_client;

    const { count, rows } = await BonSortie.findAndCountAll({
      where,
      include: [{ model: Client, as: 'client', attributes: ['id', 'nom', 'telephone'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limite),
      offset: (page - 1) * limite
    });
    res.json({ total: count, sorties: rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const creerSortie = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { mode_livraison, statut_paiement, observations, lignes } = req.body;
    const id_client = req.body.id_client || null;
    const numero = await genererNumero(BonSortie, 'numero', 'BS');

    if (!id_client) { await t.rollback(); return res.status(400).json({ message: 'Client requis' }); }
    if (!lignes || lignes.length === 0) { await t.rollback(); return res.status(400).json({ message: 'Au moins une ligne requise' }); }

    const montant_total = lignes.reduce((sum, l) => sum + ((parseFloat(l.quantite) || 0) * (parseFloat(l.prix_unitaire) || 0)), 0);

    const bs = await BonSortie.create({
      numero, date: new Date(), id_client,
      mode_livraison: mode_livraison || 'sur_place',
      statut_paiement: statut_paiement || 'paye',
      observations: observations || null, montant_total,
      statut: 'prepare', id_agent: req.user.id
    }, { transaction: t });

    for (const ligne of lignes) {
      const id_article = ligne.id_article || null;
      if (!id_article) continue;
      await LigneSortie.create({
        id_bon_sortie: bs.id, id_article,
        reference: ligne.reference || null,
        quantite: parseFloat(ligne.quantite) || 0,
        prix_unitaire: parseFloat(ligne.prix_unitaire) || 0,
        prix_total: (parseFloat(ligne.quantite) || 0) * (parseFloat(ligne.prix_unitaire) || 0),
        remarques: ligne.remarques || null
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: 'Bon de sortie créé', bs });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const validerSortie = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const bs = await BonSortie.findByPk(req.params.id, {
      include: [{ model: LigneSortie, as: 'lignes' }]
    });
    if (!bs) return res.status(404).json({ message: 'Bon de sortie introuvable' });
    if (bs.valide) return res.status(400).json({ message: 'Déjà validé' });

    // Vérification des stocks
    for (const ligne of bs.lignes) {
      const article = await Article.findByPk(ligne.id_article, { transaction: t });
      if (parseFloat(article.stock_actuel) < parseFloat(ligne.quantite)) {
        await t.rollback();
        return res.status(400).json({
          message: `Stock insuffisant pour "${article.designation}" (disponible: ${article.stock_actuel} ${article.unite}, demandé: ${ligne.quantite})`
        });
      }
    }

    // Sortie FIFO
    for (const ligne of bs.lignes) {
      const article = await Article.findByPk(ligne.id_article, { transaction: t });
      const stockAvant = parseFloat(article.stock_actuel);
      const stockApres = stockAvant - parseFloat(ligne.quantite);

      await article.update({ stock_actuel: stockApres }, { transaction: t });

      await MouvementStock.create({
        date: new Date(), id_article: article.id, type_mouvement: 'SORTIE',
        quantite: ligne.quantite, prix_unitaire: ligne.prix_unitaire,
        prix_total: ligne.quantite * ligne.prix_unitaire,
        stock_avant: stockAvant, stock_apres: stockApres,
        reference_document: bs.numero, type_document: 'BS',
        id_utilisateur: req.user.id
      }, { transaction: t });

      // Alertes automatiques
      if (stockApres <= 0) {
        await Alerte.create({
          type_alerte: 'rupture_stock', id_article: article.id,
          message: `RUPTURE DE STOCK : ${article.designation} (stock = 0)`
        }, { transaction: t });
      } else if (stockApres <= parseFloat(article.stock_minimum)) {
        await Alerte.create({
          type_alerte: 'stock_min', id_article: article.id,
          message: `Stock bas : ${article.designation} (${stockApres} ${article.unite} — seuil: ${article.stock_minimum})`
        }, { transaction: t });
      }
    }

    await bs.update({ valide: true, statut: 'livre', date_validation: new Date() }, { transaction: t });

    // Génération automatique de la facture
    const numeroFac = await genererNumero(Facture, 'numero', 'FAC');
    const facture = await Facture.create({
      numero: numeroFac, date: new Date(), id_client: bs.id_client,
      id_bon_sortie: bs.id, montant_total: bs.montant_total,
      montant_paye: bs.statut_paiement === 'paye' ? bs.montant_total : 0,
      statut_paiement: bs.statut_paiement === 'paye' ? 'paye' : 'impaye'
    }, { transaction: t });

    if (bs.statut_paiement === 'credit') {
      const client = await Client.findByPk(bs.id_client, { transaction: t });
      await client.update({ solde_du: parseFloat(client.solde_du) + parseFloat(bs.montant_total) }, { transaction: t });
    }

    await t.commit();
    await enregistrerAudit(req.user, 'VALIDER_BS', 'OPERATIONS', { numero: bs.numero }, req.ip);
    res.json({ message: 'Sortie validée — stock mis à jour — facture générée', facture_id: facture.id });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const obtenirSortie = async (req, res) => {
  try {
    const bs = await BonSortie.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'agent', attributes: ['nom', 'prenom'] },
        { model: LigneSortie, as: 'lignes', include: [{ model: Article, as: 'article' }] }
      ]
    });
    if (!bs) return res.status(404).json({ message: 'Bon de sortie introuvable' });
    res.json(bs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ===================== RETOURS =====================
const listerRetours = async (req, res) => {
  try {
    const { count, rows } = await BonRetour.findAndCountAll({
      include: [{ model: Client, as: 'client', attributes: ['id', 'nom'] }],
      order: [['created_at', 'DESC']]
    });
    res.json({ total: count, retours: rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const creerRetour = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id_client, id_facture_origine, motif_general, lignes } = req.body;
    const numero = await genererNumero(BonRetour, 'numero', 'RET');
    const montant_total = lignes.reduce((sum, l) => sum + (l.quantite * l.prix_unitaire), 0);

    const br = await BonRetour.create({
      numero, date: new Date(), id_client, id_facture_origine,
      motif_general, montant_total, id_agent: req.user.id, statut: 'en_attente'
    }, { transaction: t });

    for (const ligne of lignes) {
      await LigneRetour.create({
        id_bon_retour: br.id, id_article: ligne.id_article,
        quantite: ligne.quantite, prix_unitaire: ligne.prix_unitaire,
        prix_total: ligne.quantite * ligne.prix_unitaire, motif: ligne.motif
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: 'Bon de retour créé', br });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const validerRetour = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const br = await BonRetour.findByPk(req.params.id, {
      include: [{ model: LigneRetour, as: 'lignes' }]
    });
    if (!br) return res.status(404).json({ message: 'Bon de retour introuvable' });
    if (br.valide) return res.status(400).json({ message: 'Déjà validé' });

    for (const ligne of br.lignes) {
      const article = await Article.findByPk(ligne.id_article, { transaction: t });
      const stockAvant = parseFloat(article.stock_actuel);
      const stockApres = stockAvant + parseFloat(ligne.quantite);

      await article.update({ stock_actuel: stockApres }, { transaction: t });

      await MouvementStock.create({
        date: new Date(), id_article: article.id, type_mouvement: 'RETOUR',
        quantite: ligne.quantite, prix_unitaire: ligne.prix_unitaire,
        prix_total: ligne.quantite * ligne.prix_unitaire,
        stock_avant: stockAvant, stock_apres: stockApres,
        reference_document: br.numero, type_document: 'RET',
        id_utilisateur: req.user.id
      }, { transaction: t });
    }

    await br.update({ valide: true, statut: 'valide' }, { transaction: t });
    await t.commit();
    res.json({ message: 'Retour validé — stock réintégré' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const obtenirRetour = async (req, res) => {
  try {
    const br = await BonRetour.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: LigneRetour, as: 'lignes', include: [{ model: Article, as: 'article' }] }
      ]
    });
    if (!br) return res.status(404).json({ message: 'Bon de retour introuvable' });
    res.json(br);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ===================== CONSULTATION =====================
const consulterEntrees = async (req, res) => {
  try {
    const { id_article, id_fournisseur, date_debut, date_fin, page = 1, limite = 20 } = req.query;
    const where = { type_mouvement: 'ENTREE' };
    if (id_article) where.id_article = id_article;
    if (date_debut && date_fin) {
      where.date = { [Op.between]: [new Date(date_debut), new Date(date_fin)] };
    }

    const { count, rows } = await MouvementStock.findAndCountAll({
      where,
      include: [
        { model: Article, as: 'article', attributes: ['id', 'code', 'designation', 'unite'] },
        { model: User, as: 'utilisateur', attributes: ['nom', 'prenom'] }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limite),
      offset: (page - 1) * limite
    });
    res.json({ total: count, entrees: rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const consulterSorties = async (req, res) => {
  try {
    const { id_article, date_debut, date_fin, page = 1, limite = 20 } = req.query;
    const where = { type_mouvement: 'SORTIE' };
    if (id_article) where.id_article = id_article;
    if (date_debut && date_fin) {
      where.date = { [Op.between]: [new Date(date_debut), new Date(date_fin)] };
    }

    const { count, rows } = await MouvementStock.findAndCountAll({
      where,
      include: [
        { model: Article, as: 'article', attributes: ['id', 'code', 'designation', 'unite'] },
        { model: User, as: 'utilisateur', attributes: ['nom', 'prenom'] }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limite),
      offset: (page - 1) * limite
    });
    res.json({ total: count, sorties: rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  listerCommandes, obtenirCommande, creerCommande, soumettreCommande, approuverCommande,
  listerReceptions, creerReception, validerReception, obtenirReception,
  listerSorties, creerSortie, validerSortie, obtenirSortie,
  listerRetours, creerRetour, validerRetour, obtenirRetour,
  consulterEntrees, consulterSorties
};
