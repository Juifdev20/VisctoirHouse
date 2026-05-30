const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('LigneReception', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_bordereau: { type: DataTypes.INTEGER, references: { model: 'bons_reception', key: 'id' } },
    id_article: { type: DataTypes.INTEGER, references: { model: 'articles', key: 'id' } },
    quantite_commandee: { type: DataTypes.DECIMAL(15,3), defaultValue: 0 },
    quantite_recue: { type: DataTypes.DECIMAL(15,3), allowNull: false },
    unite: { type: DataTypes.STRING },
    prix_unitaire: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    prix_total: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    etat: {
      type: DataTypes.ENUM('conforme', 'non_conforme', 'manquant', 'abime'),
      defaultValue: 'conforme'
    },
    observations: { type: DataTypes.TEXT }
  }, {
    tableName: 'lignes_reception',
    timestamps: false
  });
};
