const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('BonSortie', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: { type: DataTypes.STRING, unique: true, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    id_client: { type: DataTypes.INTEGER, references: { model: 'clients', key: 'id' } },
    mode_livraison: {
      type: DataTypes.ENUM('sur_place', 'domicile', 'moto_taxi'),
      defaultValue: 'sur_place'
    },
    statut_paiement: {
      type: DataTypes.ENUM('paye', 'credit'),
      defaultValue: 'paye'
    },
    montant_total: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    observations: { type: DataTypes.TEXT },
    id_agent: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' } },
    statut: {
      type: DataTypes.ENUM('prepare', 'livre', 'facture', 'retourne'),
      defaultValue: 'prepare'
    },
    valide: { type: DataTypes.BOOLEAN, defaultValue: false },
    date_validation: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'bons_sortie',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
