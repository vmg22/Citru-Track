//con esto generamos un codigo aleatorio de 8 caracteres alfanumericos
const crypto = require("crypto");

const generarCodigo = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 caracteres alfanuméricos
};

module.exports = { generarCodigo };
