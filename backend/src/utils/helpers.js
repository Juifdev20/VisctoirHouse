// Génération de numéros de documents auto-incrémentés
const genererNumero = async (modele, champ, prefixe) => {
  const annee = new Date().getFullYear();
  const dernier = await modele.findOne({
    where: { [champ]: { [require('sequelize').Op.like]: `${prefixe}-${annee}-%` } },
    order: [[champ, 'DESC']]
  });

  let sequence = 1;
  if (dernier) {
    const parts = dernier[champ].split('-');
    sequence = parseInt(parts[parts.length - 1]) + 1;
  }

  return `${prefixe}-${annee}-${String(sequence).padStart(3, '0')}`;
};

// Conversion d'un montant en lettres (français)
const montantEnLettres = (montant) => {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  if (montant === 0) return 'zéro franc congolais';

  const convertirGroupe = (n) => {
    if (n === 0) return '';
    if (n < 20) return unites[n];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      if (d === 7) return 'soixante-' + unites[10 + u];
      if (d === 9) return 'quatre-vingt-' + (u === 0 ? '' : unites[u]);
      return dizaines[d] + (u === 1 && d !== 8 ? '-et-' : u > 0 ? '-' : '') + (u > 0 ? unites[u] : '');
    }
    const c = Math.floor(n / 100);
    const reste = n % 100;
    return (c === 1 ? 'cent' : unites[c] + ' cent') + (reste > 0 ? ' ' + convertirGroupe(reste) : '');
  };

  const entier = Math.floor(montant);
  let resultat = '';

  if (entier >= 1000000) {
    const m = Math.floor(entier / 1000000);
    resultat += convertirGroupe(m) + (m === 1 ? ' million ' : ' millions ');
  }
  if (entier >= 1000) {
    const k = Math.floor((entier % 1000000) / 1000);
    if (k > 0) resultat += (k === 1 ? 'mille ' : convertirGroupe(k) + ' mille ');
  }
  const reste = entier % 1000;
  if (reste > 0) resultat += convertirGroupe(reste);

  return resultat.trim() + ' francs congolais';
};

// Calcul du point de commande
const calculerQuantiteSuggeree = (article, fournisseur) => {
  const consommationMensuelle = 50; // valeur par défaut, à remplacer par calcul réel
  const delaiJours = fournisseur ? fournisseur.delai_moyen_jours : 7;
  const stockSecuritePct = fournisseur ? fournisseur.stock_securite_pct : 15;
  const stockSecurite = (article.stock_maximum * stockSecuritePct) / 100;
  const quantite = (consommationMensuelle * delaiJours / 30) + stockSecurite - article.stock_actuel;
  return Math.max(0, Math.ceil(quantite));
};

// Formater la date en français
const formaterDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

module.exports = { genererNumero, montantEnLettres, calculerQuantiteSuggeree, formaterDate };
