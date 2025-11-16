// utils/responses.js - versión final correcta

const exito = (respuesta, mensaje, datos = null, codigoEstado = 200) => {
  const respuestaEstandar = {
    exito: true,
    mensaje,
    datos,
    marcaTiempo: new Date().toISOString(),
  };
  return respuesta.status(codigoEstado).json(respuestaEstandar);
};

const error = (res, mensaje, codigoEstado = 500, detallesError = null) => {
  const respuestaEstandar = {
    exito: false,
    mensaje,
    ...(detallesError && { detallesError }),
    marcaTiempo: new Date().toISOString()
  };
  return res.status(codigoEstado).json(respuestaEstandar);
};

module.exports = { exito, error };
