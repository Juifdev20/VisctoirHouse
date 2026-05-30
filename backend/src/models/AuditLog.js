const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('AuditLog', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    id_utilisateur: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    nom_utilisateur: { type: DataTypes.STRING },
    action: { type: DataTypes.STRING, allowNull: false },
    module: { type: DataTypes.STRING },
    details_json: { type: DataTypes.JSONB },
    ip_address: { type: DataTypes.STRING }
  }, {
    tableName: 'audit_log',
    timestamps: false
  });
};
