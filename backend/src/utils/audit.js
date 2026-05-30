const { AuditLog } = require('../models');

const enregistrerAudit = async (utilisateur, action, module, details = {}, ip = null) => {
  try {
    await AuditLog.create({
      date: new Date(),
      id_utilisateur: utilisateur ? utilisateur.id : null,
      nom_utilisateur: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Système',
      action,
      module,
      details_json: details,
      ip_address: ip
    });
  } catch (err) {
    console.error('Erreur audit:', err.message);
  }
};

module.exports = { enregistrerAudit };
