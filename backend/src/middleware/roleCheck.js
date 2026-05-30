const verifierRole = (...rolesAutorises) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    if (!rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé — droits insuffisants' });
    }
    next();
  };
};

const ROLES = {
  GERANT: 'gerant',
  AGENT_STOCK: 'agent_stock',
  CAISSIER: 'caissier',
  AGENT_SECURITE: 'agent_securite'
};

module.exports = { verifierRole, ROLES };
