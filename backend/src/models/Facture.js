const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Facture', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: { type: DataTypes.STRING, unique: true, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    id_client: { type: DataTypes.INTEGER, references: { model: 'clients', key: 'id' } },
    id_bon_sortie: { type: DataTypes.INTEGER, references: { model: 'bons_sortie', key: 'id' } },
    montant_total: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    montant_paye: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    statut_paiement: {
      type: DataTypes.ENUM('impaye', 'partiel', 'paye'),
      defaultValue: 'impaye'
    },
    id_caissier: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    id_createur: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    date_paiement: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT }
  }, {
    tableName: 'factures',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
