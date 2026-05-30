const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Alerte', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type_alerte: {
      type: DataTypes.ENUM('rupture_stock', 'stock_min', 'expiration', 'commande_attente', 'approbation'),
      allowNull: false
    },
    id_article: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'articles', key: 'id' } },
    message: { type: DataTypes.TEXT, allowNull: false },
    lue: { type: DataTypes.BOOLEAN, defaultValue: false },
    id_destinataire: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    reference_document: { type: DataTypes.STRING, allowNull: true }
  }, {
    tableName: 'alertes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
};
