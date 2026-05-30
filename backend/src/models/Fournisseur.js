const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Fournisseur', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nom: { type: DataTypes.STRING, allowNull: false },
    pays: { type: DataTypes.STRING, allowNull: false },
    ville: { type: DataTypes.STRING },
    adresse: { type: DataTypes.TEXT },
    contact_nom: { type: DataTypes.STRING },
    telephone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    produits_fournis: { type: DataTypes.TEXT },
    delai_moyen_jours: { type: DataTypes.INTEGER, defaultValue: 7 },
    stock_securite_pct: { type: DataTypes.DECIMAL(5,2), defaultValue: 15.00 },
    mode_paiement: { type: DataTypes.STRING },
    devise: { type: DataTypes.STRING, defaultValue: 'USD' },
    notes: { type: DataTypes.TEXT },
    actif: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'fournisseurs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
