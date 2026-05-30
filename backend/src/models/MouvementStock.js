const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('MouvementStock', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    id_article: { type: DataTypes.INTEGER, references: { model: 'articles', key: 'id' } },
    type_mouvement: {
      type: DataTypes.ENUM('ENTREE', 'SORTIE', 'RETOUR', 'AJUSTEMENT'),
      allowNull: false
    },
    quantite: { type: DataTypes.DECIMAL(15,3), allowNull: false },
    prix_unitaire: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    prix_total: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    stock_avant: { type: DataTypes.DECIMAL(15,3), defaultValue: 0 },
    stock_apres: { type: DataTypes.DECIMAL(15,3), defaultValue: 0 },
    reference_document: { type: DataTypes.STRING },
    type_document: { type: DataTypes.STRING },
    id_utilisateur: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' } },
    notes: { type: DataTypes.TEXT }
  }, {
    tableName: 'mouvements_stock',
    timestamps: false
  });
};
