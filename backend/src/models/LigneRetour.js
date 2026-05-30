const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('LigneRetour', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_bon_retour: { type: DataTypes.INTEGER, references: { model: 'bons_retour', key: 'id' } },
    id_article: { type: DataTypes.INTEGER, references: { model: 'articles', key: 'id' } },
    quantite: { type: DataTypes.DECIMAL(15,3), allowNull: false },
    prix_unitaire: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    prix_total: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    motif: {
      type: DataTypes.ENUM('defectueux', 'erreur_commande', 'excedent', 'autre'),
      defaultValue: 'autre'
    }
  }, {
    tableName: 'lignes_retour',
    timestamps: false
  });
};
