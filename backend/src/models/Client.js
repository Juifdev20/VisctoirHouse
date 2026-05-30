const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Client', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nom: { type: DataTypes.STRING, allowNull: false },
    telephone: { type: DataTypes.STRING },
    adresse: { type: DataTypes.TEXT },
    type_client: {
      type: DataTypes.ENUM('semi_grossiste', 'detaillant', 'particulier', 'entreprise'),
      defaultValue: 'particulier'
    },
    limite_credit: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    solde_du: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    observations: { type: DataTypes.TEXT },
    actif: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'clients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
