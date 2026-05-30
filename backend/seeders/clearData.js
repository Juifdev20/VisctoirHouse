require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../src/models');
const { QueryTypes } = require('sequelize');

const clearData = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion base de données OK\n');
    console.log('🗑️  Suppression de toutes les données de démonstration...\n');

    // Désactiver les contraintes FK temporairement
    await sequelize.query('SET session_replication_role = replica;', { type: QueryTypes.RAW });

    // Ordre de suppression : tables dépendantes en premier
    const tables = [
      'audit_logs',
      'alertes',
      'lignes_inventaire',
      'inventaires',
      'mouvements_stock',
      'recus',
      'factures',
      'lignes_retour',
      'bons_retour',
      'lignes_sortie',
      'bons_sortie',
      'lignes_reception',
      'bons_reception',
      'lignes_commande',
      'bons_commande',
      'articles',
      'fournisseurs',
      'clients',
    ];

    for (const table of tables) {
      try {
        const result = await sequelize.query(`DELETE FROM "${table}"`, { type: QueryTypes.DELETE });
        console.log(`✅ Table "${table}" vidée`);
      } catch (err) {
        console.log(`⚠️  Table "${table}" : ${err.message}`);
      }
    }

    // Réactiver les contraintes FK
    await sequelize.query('SET session_replication_role = DEFAULT;', { type: QueryTypes.RAW });

    // Remettre les séquences à 1
    const seqTables = ['articles', 'fournisseurs', 'clients', 'bons_commande', 'bons_reception',
      'bons_sortie', 'bons_retour', 'factures', 'recus', 'inventaires', 'alertes', 'audit_logs', 'mouvements_stock'];

    for (const t of seqTables) {
      try {
        await sequelize.query(`ALTER SEQUENCE IF EXISTS "${t}_id_seq" RESTART WITH 1`, { type: QueryTypes.RAW });
      } catch {}
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Nettoyage terminé avec succès !');
    console.log('');
    console.log('✅ Conservé  : Comptes utilisateurs + Paramètres système');
    console.log('🗑️  Supprimé  : Articles, Fournisseurs, Clients, Opérations,');
    console.log('               Factures, Reçus, Inventaires, Alertes, Audit');
    console.log('');
    console.log('👉 Vous pouvez maintenant saisir vos vraies données.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  }
};

clearData();
