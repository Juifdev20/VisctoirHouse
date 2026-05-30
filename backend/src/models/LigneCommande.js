const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('LigneCommande', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_bon_commande: { type: DataTypes.INTEGER, references: { model: 'bons_commande', key: 'id' } },
    id_article: { type: DataTypes.INTEGER, references: { model: 'articles', key: 'id' } },
    quantite_commandee: { type: DataTypes.DECIMAL(15,3), allowNull: false },
    quantite_suggeree: { type: DataTypes.DECIMAL(15,3), defaultValue: 0 },
    prix_unitaire: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    prix_total: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 }
  }, {
    tableName: 'lignes_commande',
    timestamps: false
  });
};
