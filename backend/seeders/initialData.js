require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { sequelize, User, Fournisseur, Parametre, Article } = require('../src/models');

const seeder = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Base de données connectée');

    // Compte Gérant par défaut
    const existant = await User.findOne({ where: { email: 'admin@victoirehouse.cd' } });
    if (!existant) {
      const hash = await bcrypt.hash('Admin@2024', 12);
      await User.create({
        nom: 'KABAGAMBE', prenom: 'Archipe', email: 'admin@victoirehouse.cd',
        password_hash: hash, role: 'gerant', actif: true, doit_changer_mdp: true
      });
      console.log('✅ Compte gérant créé : admin@victoirehouse.cd / Admin@2024');
    }

    // Compte Agent de Stock par défaut
    const agentExistant = await User.findOne({ where: { email: 'agent@victoirehouse.cd' } });
    if (!agentExistant) {
      const hash = await bcrypt.hash('Agent@2024', 12);
      await User.create({
        nom: 'AGENT', prenom: 'Stock', email: 'agent@victoirehouse.cd',
        password_hash: hash, role: 'agent_stock', actif: true, doit_changer_mdp: true
      });
      console.log('✅ Compte agent de stock créé : agent@victoirehouse.cd / Agent@2024');
    }

    // Compte Caissier par défaut
    const caissierExistant = await User.findOne({ where: { email: 'caisse@victoirehouse.cd' } });
    if (!caissierExistant) {
      const hash = await bcrypt.hash('Caisse@2024', 12);
      await User.create({
        nom: 'CAISSIER', prenom: 'Principal', email: 'caisse@victoirehouse.cd',
        password_hash: hash, role: 'caissier', actif: true, doit_changer_mdp: true
      });
      console.log('✅ Compte caissier créé : caisse@victoirehouse.cd / Caisse@2024');
    }

    // Fournisseurs pré-configurés
    const fournisseurs = [
      {
        nom: 'GUANGZHOU ELECTRONICS CO. LTD',
        pays: 'Chine',
        ville: 'Guangzhou',
        adresse: 'Guangzhou, Province du Guangdong, Chine',
        contact_nom: 'M. Chen Wei',
        telephone: '+86-20-12345678',
        email: 'contact@guangzhouelectronics.cn',
        produits_fournis: 'Appareils Électroniques, Téléphones, Accessoires',
        delai_moyen_jours: 30,
        stock_securite_pct: 15,
        devise: 'USD',
        mode_paiement: 'Virement bancaire international'
      },
      {
        nom: 'AZAM BEVERAGES DAR ES SALAAM',
        pays: 'Tanzanie',
        ville: 'Dar-es-Salaam',
        adresse: 'Industrial Area, Dar-es-Salaam, Tanzanie',
        contact_nom: 'M. Juma Hassan',
        telephone: '+255-22-2345678',
        email: 'supply@azambeverages.tz',
        produits_fournis: 'Boissons AZAM, Produits alimentaires, Eau minérale',
        delai_moyen_jours: 15,
        stock_securite_pct: 50,
        devise: 'USD',
        mode_paiement: 'Virement / Espèces'
      },
      {
        nom: 'KAMPALA GOODS SUPPLIERS LTD',
        pays: 'Ouganda',
        ville: 'Kampala',
        adresse: 'Nakasero Market, Kampala, Ouganda',
        contact_nom: 'Mme. Sarah Namutebi',
        telephone: '+256-41-4567890',
        email: 'orders@kampalagoods.ug',
        produits_fournis: 'Houille végétal, Sucre, Biscuits, Riz, Farine',
        delai_moyen_jours: 5,
        stock_securite_pct: 35,
        devise: 'UGX',
        mode_paiement: 'Espèces / Crédit fournisseur'
      }
    ];

    for (const f of fournisseurs) {
      const existantF = await Fournisseur.findOne({ where: { nom: f.nom } });
      if (!existantF) {
        await Fournisseur.create(f);
        console.log(`✅ Fournisseur créé : ${f.nom} (${f.pays})`);
      }
    }

    // Paramètres de l'entreprise
    const params = [
      { cle: 'nom_entreprise', valeur: 'ETS LA VICTOIRE HOUSE', description: "Nom de l'entreprise" },
      { cle: 'adresse', valeur: 'Com. Mulekera, Q/Matonge, Rue Maman Stella, Beni, Nord-Kivu, RDC', description: 'Adresse complète' },
      { cle: 'telephone', valeur: '+243 97X XXX XXX', description: 'Téléphone principal' },
      { cle: 'email', valeur: 'info@victoirehouse.cd', description: 'Email' },
      { cle: 'devise_principale', valeur: 'FC', description: 'Devise principale' },
      { cle: 'devise_secondaire', valeur: 'USD', description: 'Devise secondaire' },
      { cle: 'taux_change_fc_usd', valeur: '2800', description: 'Taux de change FC/USD' },
      { cle: 'rc', valeur: 'RC-XXXX-BENI', description: 'Numéro Registre de Commerce' },
      { cle: 'nif', valeur: 'NIF-XXXXXXXXXX', description: 'Numéro Identification Fiscale' },
      { cle: 'prefixe_bc', valeur: 'BC', description: 'Préfixe Bon de Commande' },
      { cle: 'prefixe_br', valeur: 'BR', description: 'Préfixe Bordereau de Réception' },
      { cle: 'prefixe_bs', valeur: 'BS', description: 'Préfixe Bon de Sortie' },
      { cle: 'prefixe_fac', valeur: 'FAC', description: 'Préfixe Facture' },
      { cle: 'prefixe_recu', valeur: 'RECU', description: 'Préfixe Reçu de Paiement' },
      { cle: 'mention_legale', valeur: 'Les marchandises vendues ne sont ni remises ni échangées', description: 'Mention légale facture' }
    ];

    for (const p of params) {
      await Parametre.upsert(p);
    }
    console.log('✅ Paramètres entreprise initialisés');

    // Articles de démonstration
    const fournisseurChine = await Fournisseur.findOne({ where: { pays: 'Chine' } });
    const fournisseurTanzanie = await Fournisseur.findOne({ where: { pays: 'Tanzanie' } });
    const fournisseurOuganda = await Fournisseur.findOne({ where: { pays: 'Ouganda' } });

    const articlesDemo = [
      { code: 'ELEC-001', designation: 'Téléphone Samsung Galaxy A15', categorie: 'electronique', unite: 'pièce', id_fournisseur_principal: fournisseurChine?.id, stock_actuel: 25, stock_minimum: 5, stock_maximum: 50, prix_achat: 280000, prix_vente: 350000, categorie_abc: 'A' },
      { code: 'ELEC-002', designation: 'Chargeur USB Type-C 65W', categorie: 'electronique', unite: 'pièce', id_fournisseur_principal: fournisseurChine?.id, stock_actuel: 80, stock_minimum: 20, stock_maximum: 150, prix_achat: 15000, prix_vente: 25000, categorie_abc: 'B' },
      { code: 'BOIS-001', designation: 'Eau AZAM 1.5L (carton 12)', categorie: 'boissons', unite: 'carton', id_fournisseur_principal: fournisseurTanzanie?.id, stock_actuel: 120, stock_minimum: 30, stock_maximum: 300, prix_achat: 18000, prix_vente: 22000, categorie_abc: 'A' },
      { code: 'BOIS-002', designation: 'Jus AZAM Orange 500ml (carton 24)', categorie: 'boissons', unite: 'carton', id_fournisseur_principal: fournisseurTanzanie?.id, stock_actuel: 60, stock_minimum: 15, stock_maximum: 200, prix_achat: 24000, prix_vente: 30000, categorie_abc: 'A' },
      { code: 'ALIM-001', designation: 'Sucre cristallisé 50kg (sac)', categorie: 'alimentation', unite: 'sac', id_fournisseur_principal: fournisseurOuganda?.id, stock_actuel: 40, stock_minimum: 10, stock_maximum: 100, prix_achat: 115000, prix_vente: 130000, categorie_abc: 'A' },
      { code: 'ALIM-002', designation: 'Riz parfumé 25kg (sac)', categorie: 'alimentation', unite: 'sac', id_fournisseur_principal: fournisseurOuganda?.id, stock_actuel: 35, stock_minimum: 8, stock_maximum: 80, prix_achat: 65000, prix_vente: 78000, categorie_abc: 'A' },
      { code: 'ALIM-003', designation: 'Biscuits UGACHOC assortis (carton)', categorie: 'alimentation', unite: 'carton', id_fournisseur_principal: fournisseurOuganda?.id, stock_actuel: 50, stock_minimum: 10, stock_maximum: 100, prix_achat: 32000, prix_vente: 40000, categorie_abc: 'B' },
      { code: 'MENA-001', designation: 'Savon de ménage GEISHA (paquet 10)', categorie: 'menager', unite: 'paquet', id_fournisseur_principal: fournisseurOuganda?.id, stock_actuel: 0, stock_minimum: 5, stock_maximum: 50, prix_achat: 8500, prix_vente: 12000, categorie_abc: 'B' },
      { code: 'MENA-002', designation: 'Lessive OMO 1kg', categorie: 'menager', unite: 'pièce', id_fournisseur_principal: fournisseurTanzanie?.id, stock_actuel: 75, stock_minimum: 15, stock_maximum: 150, prix_achat: 4500, prix_vente: 6000, categorie_abc: 'B' },
      { code: 'CONS-001', designation: 'Ciment Portland 50kg (sac)', categorie: 'construction', unite: 'sac', id_fournisseur_principal: fournisseurChine?.id, stock_actuel: 200, stock_minimum: 50, stock_maximum: 500, prix_achat: 25000, prix_vente: 30000, categorie_abc: 'A' }
    ];

    for (const art of articlesDemo) {
      const existantArt = await Article.findOne({ where: { code: art.code } });
      if (!existantArt) {
        await Article.create({ ...art, caum: art.prix_achat });
        console.log(`✅ Article créé : ${art.designation}`);
      }
    }

    console.log('\n🎉 Initialisation terminée !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Comptes créés :');
    console.log('   Gérant    : admin@victoirehouse.cd  / Admin@2024');
    console.log('   Agent Stock: agent@victoirehouse.cd  / Agent@2024');
    console.log('   Caissier  : caisse@victoirehouse.cd / Caisse@2024');
    console.log('⚠️  Changez les mots de passe à la première connexion !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur initialisation:', err);
    process.exit(1);
  }
};

seeder();
