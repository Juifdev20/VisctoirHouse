const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Recu', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: { type: DataTypes.STRING, unique: true, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    id_client: { type: DataTypes.INTEGER, references: { model: 'clients', key: 'id' } },
    id_facture: { type: DataTypes.INTEGER, references: { model: 'factures', key: 'id' } },
    motif: { type: DataTypes.STRING },
    montant: { type: DataTypes.DECIMAL(15,2), allowNull: false },
    montant_lettres: { type: DataTypes.STRING },
    mode_paiement: { type: DataTypes.ENUM('especes', 'virement', 'cheque'), defaultValue: 'especes' },
    date_paiement: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT },
    id_caissier: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' } }
  }, {
    tableName: 'recus',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
};
