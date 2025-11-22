function permitirRoles(...allowed) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    
    // Soportar tanto 'rol' (singular) como 'roles' (array)
    let userRoles = [];
    if (Array.isArray(user.roles)) {
      userRoles = user.roles;
    } else if (user.rol) {
      userRoles = [user.rol];
    }
    
    const ok = userRoles.some(r => allowed.includes(r));
    if (!ok) {
      return res.status(403).json({ 
        error: 'Permiso denegado',
        rolRequerido: allowed,
        rolActual: userRoles
      });
    }
    next();
  };
}

module.exports = { permitirRoles };