const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('BonRetour', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: { type: DataTypes.STRING, unique: true, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    id_client: { type: DataTypes.INTEGER, references: { model: 'clients', key: 'id' } },
    id_facture_origine: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'factures', key: 'id' } },
    motif_general: { type: DataTypes.TEXT },
    montant_total: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    id_agent: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' } },
    statut: {
      type: DataTypes.ENUM('en_attente', 'valide', 'annule'),
      defaultValue: 'en_attente'
    },
    valide: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'bons_retour',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
