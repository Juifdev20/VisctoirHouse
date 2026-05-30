const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nom: { type: DataTypes.STRING, allowNull: false },
    prenom: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('gerant', 'agent_stock', 'caissier', 'agent_securite'),
      allowNull: false
    },
    actif: { type: DataTypes.BOOLEAN, defaultValue: true },
    derniere_connexion: { type: DataTypes.DATE, allowNull: true },
    doit_changer_mdp: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  User.prototype.verifierMotDePasse = async function(motDePasse) {
    return bcrypt.compare(motDePasse, this.password_hash);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  };

  return User;
};
