// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// function authMiddleware(req, res, next){
//   const header = req.headers['authorization'];
//   if(!header) return res.status(401).json({ error: 'No token provided' });
//   const parts = header.split(' ');
//   if(parts.length !== 2) return res.status(401).json({ error: 'Token formato inválido' });
//   const token = parts[1];
//   try{
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // { userId, username, roles }
//     return next();
//   } catch(err){
//     return res.status(401).json({ error: 'Token inválido' });
//   }
// }

// module.exports = authMiddleware;
