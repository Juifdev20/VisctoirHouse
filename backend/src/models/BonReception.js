const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('BonReception', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: { type: DataTypes.STRING, unique: true, allowNull: false },
    date_reception: { type: DataTypes.DATEONLY, allowNull: false },
    id_fournisseur: { type: DataTypes.INTEGER, references: { model: 'fournisseurs', key: 'id' } },
    id_bon_commande: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'bons_commande', key: 'id' } },
    nom_livreur: { type: DataTypes.STRING },
    tel_livreur: { type: DataTypes.STRING },
    statut_global: {
      type: DataTypes.ENUM('en_cours', 'conforme', 'non_conforme', 'partielle'),
      defaultValue: 'en_cours'
    },
    observations: { type: DataTypes.TEXT },
    id_agent: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' } },
    valide: { type: DataTypes.BOOLEAN, defaultValue: false },
    date_validation: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'bons_reception',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
