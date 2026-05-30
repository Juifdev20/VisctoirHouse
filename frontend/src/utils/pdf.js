import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parametresAPI } from '../services/api';

let _logoPDF = null;
try {
  const _img = new Image();
  _img.onload = () => {
    try {
      const c = document.createElement('canvas');
      c.width = _img.naturalWidth; c.height = _img.naturalHeight;
      c.getContext('2d').drawImage(_img, 0, 0);
      _logoPDF = c.toDataURL('image/png');
    } catch {}
  };
  _img.src = '/logo.png';
} catch {}

let _params = null;
const _fetchParams = async () => {
  if (_params) return _params;
  try { const r = await parametresAPI.obtenir(); _params = r.data || {}; }
  catch { _params = {}; }
  return _params;
};
export const clearParamsCache = () => { _params = null; };

const NAVY = [30, 58, 95];
const GOLD = [245, 158, 11];
const LIGHT = [248, 250, 252];
const WHITE = [255, 255, 255];
const GRAY = [107, 114, 128];

const formatFC = (v) => {
  const n = Math.round(v || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FC';
};
const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
};
const now = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};
// Nettoyer les chaînes de tous les caractères Unicode incompatibles avec Helvetica/jsPDF
const s = (v) => String(v || '-')
  .replace(/\u2014/g, '-').replace(/\u2013/g, '-')
  .replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ').replace(/\u2009/g, ' ')
  .replace(/[^\x00-\xFF]/g, '?');

function entete(doc, titre, numero, infosSupp = [], infos = {}) {
  const W = doc.internal.pageSize.getWidth();
  const nom = s(infos.nom_entreprise || 'LA VICTOIRE HOUSE');
  const adr = s(infos.adresse || 'Beni, Nord-Kivu - Republique Democratique du Congo');
  const contact = s(`${infos.telephone || '+243 XXX XXX XXX'}  |  ${infos.email || 'victoirehouse.cd'}`);

  // Bandeau Navy
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 28, 'F');

  // Logo
  if (_logoPDF) {
    try { doc.addImage(_logoPDF, 'PNG', 14, 2, 24, 24); } catch {}
  }
  const tX = _logoPDF ? 42 : 14;

  // Nom entreprise
  doc.setTextColor(...WHITE);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(nom, tX, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(adr, tX, 19);
  doc.text(contact, tX, 24);

  // Titre document (côté droit)
  doc.setTextColor(...GOLD);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(titre, W - 14, 12, { align: 'right' });

  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(numero, W - 14, 20, { align: 'right' });

  // Ligne dorée
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(0, 28, W, 28);

  // Infos supplémentaires
  let y = 36;
  if (infosSupp.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    infosSupp.forEach((info, i) => {
      const col = i % 2 === 0 ? 14 : W / 2;
      const row = Math.floor(i / 2) * 7;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text(info.label + ' :', col, y + row);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      const val = String(info.value || '-').replace(/\u2014/g, '-').replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ');
      doc.text(val, col + 35, y + row);
    });
    y += Math.ceil(infosSupp.length / 2) * 7 + 6;
  }
  return y;
}

function pied(doc, numero, infos = {}) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(...NAVY);
  doc.rect(0, H - 12, W, 12, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${numero}  —  Imprimé le ${now()}`, 14, H - 4.5);
  const piedParts = [infos.nom_entreprise || 'La Victoire House', infos.rc ? `RC: ${infos.rc}` : null, infos.nif ? `NIF: ${infos.nif}` : null].filter(Boolean);
  doc.text(s(piedParts.join('  |  ')), W - 14, H - 4.5, { align: 'right' });
}

// ===================== FACTURE =====================
export async function imprimerFacture(facture) {
  const infos = await _fetchParams();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const statutLabel = { paye: 'PAYÉ', partiel: 'PAIEMENT PARTIEL', impaye: 'IMPAYÉ' };
  const statutColor = { paye: [16, 185, 129], partiel: [245, 158, 11], impaye: [239, 68, 68] };

  const y = entete(doc, 'FACTURE', facture.numero, [
    { label: 'Date', value: fmtDate(facture.date) },
    { label: 'Statut', value: statutLabel[facture.statut_paiement] || facture.statut_paiement },
    { label: 'Client', value: facture.client?.nom },
    { label: 'Téléphone', value: facture.client?.telephone },
    { label: 'Bon de Sortie', value: facture.bonSortie?.numero },
    { label: 'Livraison', value: facture.bonSortie?.mode_livraison },
  ], infos);

  // Badge statut
  const sc = statutColor[facture.statut_paiement] || [100, 100, 100];
  doc.setFillColor(...sc);
  doc.roundedRect(W - 50, 30, 36, 8, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(s(statutLabel[facture.statut_paiement] || 'INCONNU'), W - 32, 35.5, { align: 'center' });

  // Tableau des articles
  const lignes = (facture.bonSortie?.lignes || []).map(l => [
    s(l.article?.designation),
    s(l.article?.unite || ''),
    String(l.quantite || 0),
    formatFC(l.prix_unitaire),
    formatFC(l.prix_total),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Désignation', 'Unité', 'Qté', 'Prix Unitaire', 'Prix Total']],
    body: lignes,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 70 },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 },
  });

  // Récapitulatif financier
  let finalY = doc.lastAutoTable.finalY + 6;
  const boxX = W - 80;

  doc.setFillColor(...LIGHT);
  doc.roundedRect(boxX, finalY, 66, 30, 3, 3, 'F');
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, finalY, 66, 30, 3, 3, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Montant total :', boxX + 4, finalY + 8);
  doc.text('Montant payé :', boxX + 4, finalY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Restant dû :', boxX + 4, finalY + 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(formatFC(facture.montant_total), boxX + 62, finalY + 8, { align: 'right' });
  doc.setTextColor(16, 185, 129);
  doc.text(formatFC(facture.montant_paye), boxX + 62, finalY + 16, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const duColor = parseFloat(facture.montant_du) > 0 ? [239, 68, 68] : [16, 185, 129];
  doc.setTextColor(...duColor);
  doc.text(formatFC(facture.montant_du), boxX + 62, finalY + 24, { align: 'right' });

  finalY += 38;

  // Montant en lettres
  if (facture.bonSortie) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GRAY);
    doc.text(`Arrêté à la somme de : ${formatFC(facture.montant_total)}`, 14, finalY);
    finalY += 8;
  }

  // Mention légale (toujours affichée si configurée)
  if (infos.mention_legale) {
    const H = doc.internal.pageSize.getHeight();
    if (finalY + 20 > H - 20) { doc.addPage(); entete(doc, 'FACTURE', facture.numero, [], infos); finalY = 40; }
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    const mentionLines = doc.splitTextToSize(s(infos.mention_legale), W - 28);
    doc.text(mentionLines, 14, finalY);
    finalY += mentionLines.length * 5 + 4;
  }

  // Signatures
  finalY += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Signature du Caissier', 30, finalY, { align: 'center' });
  doc.text('Signature du Client', W - 30, finalY, { align: 'center' });
  doc.setDrawColor(180, 180, 180);
  doc.line(14, finalY + 14, 60, finalY + 14);
  doc.line(W - 60, finalY + 14, W - 14, finalY + 14);

  pied(doc, facture.numero, infos);
  doc.save(`Facture_${facture.numero}.pdf`);
}

// ===================== REÇU =====================
export async function imprimerRecu(recu) {
  const infos = await _fetchParams();
  const doc = new jsPDF({ unit: 'mm', format: [80, 120] });
  const W = 80;
  const nom = s(infos.nom_entreprise || 'LA VICTOIRE HOUSE');

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 26, 'F');
  if (_logoPDF) {
    try { doc.addImage(_logoPDF, 'PNG', 4, 4, 18, 18); } catch {}
  }
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(nom, _logoPDF ? 25 : W / 2, 13, { align: _logoPDF ? 'left' : 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('REÇU DE PAIEMENT', _logoPDF ? 25 : W / 2, 20, { align: _logoPDF ? 'left' : 'center' });

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(recu.numero, W / 2, 32, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const rows = [
    ['Date', fmtDate(recu.date_paiement)],
    ['Client', s(recu.client?.nom)],
    ['Motif', s(recu.motif)],
    ['Mode', s(recu.mode_paiement)],
    ['Facture', s(recu.facture?.numero)],
  ];
  let y = 40;
  rows.forEach(([k, v]) => {
    doc.setTextColor(...GRAY);
    doc.text(k + ' :', 6, y);
    doc.setTextColor(30, 30, 30);
    doc.text(s(v), 30, y);
    y += 7;
  });

  doc.setFillColor(...NAVY);
  doc.roundedRect(6, y + 2, W - 12, 12, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatFC(recu.montant), W / 2, y + 10, { align: 'center' });

  y += 20;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Signature :', 6, y);
  doc.setDrawColor(180, 180, 180);
  doc.line(6, y + 12, W - 6, y + 12);

  doc.save(`Recu_${recu.numero}.pdf`);
}

// ===================== BON DE COMMANDE =====================
export async function imprimerBonCommande(bc) {
  const infos = await _fetchParams();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  const y = entete(doc, 'BON DE COMMANDE', bc.numero, [
    { label: 'Date création', value: fmtDate(bc.date_creation) },
    { label: 'Livraison souhaitée', value: fmtDate(bc.date_echeance) },
    { label: 'Fournisseur', value: bc.fournisseur?.nom },
    { label: 'Pays', value: bc.fournisseur?.pays },
    { label: 'Mode paiement', value: bc.mode_paiement },
    { label: 'Créé par', value: bc.createur ? `${bc.createur.prenom} ${bc.createur.nom}` : '-' },
  ], infos);

  const lignes = (bc.lignes || []).map(l => [
    s(l.article?.designation),
    s(l.article?.unite || ''),
    String(l.quantite_commandee || 0),
    formatFC(l.prix_unitaire),
    formatFC(l.prix_total),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Désignation', 'Unité', 'Qté commandée', 'Prix Unitaire', 'Prix Total']],
    body: lignes,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
    foot: [['', '', '', 'TOTAL', formatFC(bc.montant_total)]],
    footStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', halign: 'right' },
  });

  if (bc.observations) {
    const fy = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text('Observations : ' + bc.observations, 14, fy);
  }

  const fy2 = doc.lastAutoTable.finalY + 25;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Signature & Cachet', 30, fy2, { align: 'center' });
  doc.text('Responsable des Achats', W - 30, fy2, { align: 'center' });
  doc.setDrawColor(180, 180, 180);
  doc.line(14, fy2 + 14, 60, fy2 + 14);
  doc.line(W - 60, fy2 + 14, W - 14, fy2 + 14);

  pied(doc, bc.numero, infos);
  doc.save(`BC_${bc.numero}.pdf`);
}

// ===================== BORDEREAU DE RÉCEPTION =====================
export async function imprimerBonReception(br) {
  const infos = await _fetchParams();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  const y = entete(doc, 'BORDEREAU DE RECEPTION', br.numero, [
    { label: 'Date réception', value: fmtDate(br.date_reception) },
    { label: 'Fournisseur', value: br.fournisseur?.nom },
    { label: 'BC lié', value: br.bonCommande?.numero },
    { label: 'Nom livreur', value: br.nom_livreur },
    { label: 'Tél. livreur', value: br.tel_livreur },
    { label: 'Agent', value: br.agent ? `${br.agent.prenom} ${br.agent.nom}` : '-' },
  ], infos);

  const lignes = (br.lignes || []).map(l => [
    s(l.article?.designation),
    s(l.article?.unite || ''),
    String(l.quantite_commandee || 0),
    String(l.quantite_recue || 0),
    formatFC(l.prix_unitaire),
    formatFC(l.prix_total),
    l.etat === 'conforme' ? 'Conforme' : l.etat === 'non_conforme' ? 'Non conforme' : 'Abime',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Désignation', 'Unité', 'Qté cmd.', 'Qté reçue', 'PU', 'PT', 'État']],
    body: lignes,
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      2: { halign: 'center' }, 3: { halign: 'center' },
      4: { halign: 'right' }, 5: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 },
  });

  pied(doc, br.numero, infos);
  doc.save(`BR_${br.numero}.pdf`);
}

// ===================== BON DE SORTIE =====================
export async function imprimerBonSortie(bs) {
  const infos = await _fetchParams();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  const y = entete(doc, 'BON DE SORTIE', bs.numero, [
    { label: 'Date', value: fmtDate(bs.date) },
    { label: 'Client', value: bs.client?.nom },
    { label: 'Téléphone', value: bs.client?.telephone },
    { label: 'Mode livraison', value: bs.mode_livraison },
    { label: 'Statut paiement', value: bs.statut_paiement },
    { label: 'Agent', value: bs.agent ? `${bs.agent.prenom} ${bs.agent.nom}` : '-' },
  ], infos);

  const lignes = (bs.lignes || []).map(l => [
    s(l.article?.designation),
    s(l.article?.unite || ''),
    String(l.quantite || 0),
    formatFC(l.prix_unitaire),
    formatFC(l.prix_total),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Désignation', 'Unité', 'Quantité', 'Prix Unitaire', 'Prix Total']],
    body: lignes,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
    foot: [['', '', '', 'TOTAL', formatFC(bs.montant_total)]],
    footStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold' },
  });

  const fy = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Signature du Livreur', 30, fy, { align: 'center' });
  doc.text('Signature du Client', W - 30, fy, { align: 'center' });
  doc.setDrawColor(180, 180, 180);
  doc.line(14, fy + 14, 60, fy + 14);
  doc.line(W - 60, fy + 14, W - 14, fy + 14);

  pied(doc, bs.numero, infos);
  doc.save(`BS_${bs.numero}.pdf`);
}

// ===================== INVENTAIRE =====================
export async function imprimerInventaire(inventaire, lignes) {
  const infos = await _fetchParams();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const type = { QUOTIDIEN: 'Quotidien', HEBDO: 'Hebdomadaire', MENSUEL: 'Mensuel', ANNUEL: 'Annuel' };
  const y = entete(doc, 'FICHE D\'INVENTAIRE', `INV-${inventaire.id}`, [
    { label: 'Date', value: fmtDate(inventaire.date) },
    { label: 'Type', value: type[inventaire.type] || inventaire.type },
    { label: 'Statut', value: inventaire.statut },
    { label: 'Agent', value: inventaire.agent ? `${inventaire.agent.prenom} ${inventaire.agent.nom}` : '-' },
  ], infos);

  const rows = lignes.map(l => [
    s(l.article?.code),
    s(l.article?.designation),
    s(l.article?.unite || ''),
    String(parseFloat(l.stock_theorique || 0).toFixed(2)),
    String(parseFloat(l.stock_physique || 0).toFixed(2)),
    String(parseFloat(l.ecart || 0).toFixed(2)),
    formatFC(l.valeur_ecart),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Code', 'Désignation', 'Unité', 'Stock théorique', 'Stock physique', 'Écart', 'Valeur écart']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      3: { halign: 'right' }, 4: { halign: 'right' },
      5: { halign: 'right' }, 6: { halign: 'right' }
    },
    margin: { left: 10, right: 10 },
  });

  pied(doc, `INV-${inventaire.id}`, infos);
  doc.save(`Inventaire_${inventaire.date}.pdf`);
}

// ===================== RAPPORT STOCK =====================
export async function exporterRapportStock(articles, stats) {
  const infos = await _fetchParams();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  const y = entete(doc, 'ETAT DU STOCK', `Rapport du ${now().slice(0, 10)}`, [
    { label: 'Total articles', value: stats?.total_articles },
    { label: 'Valeur totale', value: formatFC(stats?.valeur_totale) },
    { label: 'En alerte', value: stats?.articles_alerte },
    { label: 'En rupture', value: stats?.articles_rupture },
  ], infos);

  const rows = articles.map(a => {
    const stock = parseFloat(a.stock_actuel);
    const min = parseFloat(a.stock_minimum);
    const etat = stock === 0 ? 'RUPTURE' : stock <= min ? 'ALERTE' : 'OK';
    return [
      s(a.code), s(a.designation), s(a.categorie || '-'),
      `${stock} ${s(a.unite)}`, `${min} ${s(a.unite)}`,
      formatFC(stock * parseFloat(a.prix_achat)),
      etat,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Code', 'Désignation', 'Catégorie', 'Stock actuel', 'Stock min.', 'Valeur stock', 'État']],
    body: rows,
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT },
    didDrawCell: (data) => {
      if (data.column.index === 6 && data.section === 'body') {
        const val = data.cell.text[0];
        const color = val === 'RUPTURE' ? [239, 68, 68] : val === 'ALERTE' ? [245, 158, 11] : [16, 185, 129];
        data.doc.setTextColor(...color);
      }
    },
    margin: { left: 10, right: 10 },
  });

  pied(doc, 'RAPPORT-STOCK', infos);
  doc.save(`Rapport_Stock_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ===================== RAPPORT VENTES =====================
export async function exporterRapportVentes(factures, topArticles, caTotal) {
  const infos = await _fetchParams();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const y = entete(doc, 'RAPPORT DES VENTES', `Rapport du ${now().slice(0, 10)}`, [
    { label: 'Nombre de ventes', value: factures.length },
    { label: 'CA total', value: formatFC(caTotal) },
  ], infos);

  autoTable(doc, {
    startY: y,
    head: [['Facture', 'Date', 'Client', 'Montant']],
    body: factures.slice(0, 30).map(f => [s(f.numero), fmtDate(f.date), s(f.client?.nom), formatFC(f.montant_total)]),
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  });

  if (topArticles?.length > 0) {
    const fy = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('Top 10 Articles', 14, fy);

    autoTable(doc, {
      startY: fy + 5,
      head: [['Article', 'Qté vendue', 'CA']],
      body: topArticles.map(a => [s(a.article?.designation), a.total_qte, formatFC(a.total_ca)]),
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: GOLD, textColor: WHITE, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    });
  }

  pied(doc, 'RAPPORT-VENTES', infos);
  doc.save(`Rapport_Ventes_${new Date().toISOString().slice(0, 10)}.pdf`);
}
