function permitirRoles(...allowed){
  return (req, res, next) => {
    const user = req.user;
    if(!user) return res.status(401).json({ error: 'No autorizado' });
    const roles = user.roles || [];
    const ok = roles.some(r => allowed.includes(r));
    if(!ok) return res.status(403).json({ error: 'Permiso denegado' });
    next();
  };
}

module.exports = { permitirRoles };
