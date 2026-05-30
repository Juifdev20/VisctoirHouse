const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('BonCommande', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: { type: DataTypes.STRING, unique: true, allowNull: false },
    date_creation: { type: DataTypes.DATEONLY, allowNull: false },
    id_fournisseur: { type: DataTypes.INTEGER, references: { model: 'fournisseurs', key: 'id' } },
    date_echeance: { type: DataTypes.DATEONLY },
    statut: {
      type: DataTypes.ENUM('brouillon', 'en_attente', 'approuve', 'partiellement_recu', 'recu', 'annule'),
      defaultValue: 'brouillon'
    },
    mode_paiement: { type: DataTypes.STRING },
    montant_total: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    observations: { type: DataTypes.TEXT },
    id_createur: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' } },
    id_validateur_gerant: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    date_validation: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'bons_commande',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
