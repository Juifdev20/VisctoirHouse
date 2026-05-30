const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Parametre', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    cle: { type: DataTypes.STRING, unique: true, allowNull: false },
    valeur: { type: DataTypes.TEXT },
    description: { type: DataTypes.STRING }
  }, {
    tableName: 'parametres',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
