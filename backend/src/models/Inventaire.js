const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Inventaire', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    type: {
      type: DataTypes.ENUM('QUOTIDIEN', 'HEBDO', 'MENSUEL', 'ANNUEL'),
      allowNull: false
    },
    statut: {
      type: DataTypes.ENUM('en_cours', 'soumis', 'approuve', 'rejete'),
      defaultValue: 'en_cours'
    },
    id_agent: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' } },
    id_gerant: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    observations: { type: DataTypes.TEXT },
    date_approbation: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'inventaires',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
