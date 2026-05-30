const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('LigneSortie', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_bon_sortie: { type: DataTypes.INTEGER, references: { model: 'bons_sortie', key: 'id' } },
    id_article: { type: DataTypes.INTEGER, references: { model: 'articles', key: 'id' } },
    reference: { type: DataTypes.STRING },
    quantite: { type: DataTypes.DECIMAL(15,3), allowNull: false },
    prix_unitaire: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    prix_total: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    remarques: { type: DataTypes.TEXT }
  }, {
    tableName: 'lignes_sortie',
    timestamps: false
  });
};
