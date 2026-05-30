const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  }
});

// Import des modèles
const User = require('./User')(sequelize);
const Fournisseur = require('./Fournisseur')(sequelize);
const Client = require('./Client')(sequelize);
const Article = require('./Article')(sequelize);
const BonCommande = require('./BonCommande')(sequelize);
const LigneCommande = require('./LigneCommande')(sequelize);
const BonReception = require('./BonReception')(sequelize);
const LigneReception = require('./LigneReception')(sequelize);
const BonSortie = require('./BonSortie')(sequelize);
const LigneSortie = require('./LigneSortie')(sequelize);
const Facture = require('./Facture')(sequelize);
const Recu = require('./Recu')(sequelize);
const BonRetour = require('./BonRetour')(sequelize);
const LigneRetour = require('./LigneRetour')(sequelize);
const MouvementStock = require('./MouvementStock')(sequelize);
const Inventaire = require('./Inventaire')(sequelize);
const LigneInventaire = require('./LigneInventaire')(sequelize);
const Alerte = require('./Alerte')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);
const Parametre = require('./Parametre')(sequelize);

// Associations
Article.belongsTo(Fournisseur, { foreignKey: 'id_fournisseur_principal', as: 'fournisseur' });
Fournisseur.hasMany(Article, { foreignKey: 'id_fournisseur_principal', as: 'articles' });

BonCommande.belongsTo(Fournisseur, { foreignKey: 'id_fournisseur', as: 'fournisseur' });
BonCommande.belongsTo(User, { foreignKey: 'id_createur', as: 'createur' });
BonCommande.belongsTo(User, { foreignKey: 'id_validateur_gerant', as: 'validateur' });
BonCommande.hasMany(LigneCommande, { foreignKey: 'id_bon_commande', as: 'lignes' });

LigneCommande.belongsTo(BonCommande, { foreignKey: 'id_bon_commande' });
LigneCommande.belongsTo(Article, { foreignKey: 'id_article', as: 'article' });

BonReception.belongsTo(Fournisseur, { foreignKey: 'id_fournisseur', as: 'fournisseur' });
BonReception.belongsTo(BonCommande, { foreignKey: 'id_bon_commande', as: 'bonCommande' });
BonReception.belongsTo(User, { foreignKey: 'id_agent', as: 'agent' });
BonReception.hasMany(LigneReception, { foreignKey: 'id_bordereau', as: 'lignes' });

LigneReception.belongsTo(BonReception, { foreignKey: 'id_bordereau' });
LigneReception.belongsTo(Article, { foreignKey: 'id_article', as: 'article' });

BonSortie.belongsTo(Client, { foreignKey: 'id_client', as: 'client' });
BonSortie.belongsTo(User, { foreignKey: 'id_agent', as: 'agent' });
BonSortie.hasMany(LigneSortie, { foreignKey: 'id_bon_sortie', as: 'lignes' });
BonSortie.hasOne(Facture, { foreignKey: 'id_bon_sortie', as: 'facture' });

LigneSortie.belongsTo(BonSortie, { foreignKey: 'id_bon_sortie' });
LigneSortie.belongsTo(Article, { foreignKey: 'id_article', as: 'article' });

Facture.belongsTo(Client, { foreignKey: 'id_client', as: 'client' });
Facture.belongsTo(BonSortie, { foreignKey: 'id_bon_sortie', as: 'bonSortie' });
Facture.belongsTo(User, { foreignKey: 'id_caissier', as: 'caissier' });
Facture.belongsTo(User, { foreignKey: 'id_createur', as: 'createur' });
Facture.hasMany(Recu, { foreignKey: 'id_facture', as: 'recus' });

Recu.belongsTo(Facture, { foreignKey: 'id_facture', as: 'facture' });
Recu.belongsTo(Client, { foreignKey: 'id_client', as: 'client' });
Recu.belongsTo(User, { foreignKey: 'id_caissier', as: 'caissier' });

BonRetour.belongsTo(Client, { foreignKey: 'id_client', as: 'client' });
BonRetour.belongsTo(Facture, { foreignKey: 'id_facture_origine', as: 'factureOrigine' });
BonRetour.belongsTo(User, { foreignKey: 'id_agent', as: 'agent' });
BonRetour.hasMany(LigneRetour, { foreignKey: 'id_bon_retour', as: 'lignes' });

LigneRetour.belongsTo(BonRetour, { foreignKey: 'id_bon_retour' });
LigneRetour.belongsTo(Article, { foreignKey: 'id_article', as: 'article' });

MouvementStock.belongsTo(Article, { foreignKey: 'id_article', as: 'article' });
MouvementStock.belongsTo(User, { foreignKey: 'id_utilisateur', as: 'utilisateur' });

Inventaire.belongsTo(User, { foreignKey: 'id_agent', as: 'agent' });
Inventaire.hasMany(LigneInventaire, { foreignKey: 'id_inventaire', as: 'lignes' });

LigneInventaire.belongsTo(Inventaire, { foreignKey: 'id_inventaire' });
LigneInventaire.belongsTo(Article, { foreignKey: 'id_article', as: 'article' });

Alerte.belongsTo(Article, { foreignKey: 'id_article', as: 'article' });
Alerte.belongsTo(User, { foreignKey: 'id_destinataire', as: 'destinataire' });

AuditLog.belongsTo(User, { foreignKey: 'id_utilisateur', as: 'utilisateur' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Fournisseur,
  Client,
  Article,
  BonCommande,
  LigneCommande,
  BonReception,
  LigneReception,
  BonSortie,
  LigneSortie,
  Facture,
  Recu,
  BonRetour,
  LigneRetour,
  MouvementStock,
  Inventaire,
  LigneInventaire,
  Alerte,
  AuditLog,
  Parametre
};
