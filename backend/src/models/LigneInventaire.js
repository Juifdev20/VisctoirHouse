const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('LigneInventaire', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_inventaire: { type: DataTypes.INTEGER, references: { model: 'inventaires', key: 'id' } },
    id_article: { type: DataTypes.INTEGER, references: { model: 'articles', key: 'id' } },
    stock_theorique: { type: DataTypes.DECIMAL(15,3), defaultValue: 0 },
    stock_physique: { type: DataTypes.DECIMAL(15,3), defaultValue: 0 },
    ecart: { type: DataTypes.DECIMAL(15,3), defaultValue: 0 },
    valeur_ecart: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    observation: { type: DataTypes.TEXT }
  }, {
    tableName: 'lignes_inventaire',
    timestamps: false
  });
};
