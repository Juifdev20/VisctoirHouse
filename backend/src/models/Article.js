const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Article', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING, unique: true, allowNull: false },
    designation: { type: DataTypes.STRING, allowNull: false },
    categorie: {
      type: DataTypes.ENUM('alimentation', 'boissons', 'electronique', 'menager', 'construction', 'autres'),
      allowNull: false
    },
    unite: { type: DataTypes.STRING, defaultValue: 'pièce' },
    id_fournisseur_principal: { type: DataTypes.INTEGER, references: { model: 'fournisseurs', key: 'id' } },
    stock_actuel: { type: DataTypes.DECIMAL(15,3), defaultValue: 0 },
    stock_minimum: { type: DataTypes.DECIMAL(15,3), defaultValue: 0 },
    stock_maximum: { type: DataTypes.DECIMAL(15,3), defaultValue: 0 },
    stock_securite_pct: { type: DataTypes.DECIMAL(5,2), defaultValue: 15 },
    prix_achat: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    prix_vente: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    caum: { type: DataTypes.DECIMAL(15,2), defaultValue: 0 },
    methode_gestion: { type: DataTypes.ENUM('FIFO', 'FEFO'), defaultValue: 'FIFO' },
    categorie_abc: { type: DataTypes.ENUM('A', 'B', 'C'), defaultValue: 'C' },
    emplacement: { type: DataTypes.STRING },
    date_expiration: { type: DataTypes.DATEONLY, allowNull: true },
    photo_url: { type: DataTypes.STRING, allowNull: true },
    notes: { type: DataTypes.TEXT },
    actif: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'articles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeSave: (article) => {
        if (!article.code) {
          article.code = 'ART-' + Date.now();
        }
      }
    }
  });
};
