
// controllers/clientes.controller.js
const pool = require("../config/db");

/**
 * GET /api/clientes
 * Opciones de query:
 *  - q (string) : búsqueda por nombre (LIKE)
 *  - limit, offset (paginación opcional)
 */
async function getAllClientes(req, res) {
  try {
    const { q, limit, offset } = req.query;
    let sql = `SELECT cliente_id, nombre, contacto, telefono, email, pais, direccion, cuit, acceso_sistema, notas, created_at
               FROM clientes`;
    const params = [];

    if (q) {
      sql += " WHERE nombre LIKE ? OR contacto LIKE ? OR telefono LIKE ? OR email LIKE ?";
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    sql += " ORDER BY nombre ASC";
    if (limit) {
      sql += " LIMIT ?";
      params.push(Number(limit));
      if (offset) {
        sql += " OFFSET ?";
        params.push(Number(offset));
      }
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("getAllClientes error:", err);
    res.status(500).json({ error: err.message || "Error obteniendo clientes" });
  }
}

/**
 * GET /api/clientes/:id
 */
async function getClienteById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT cliente_id, nombre, contacto, telefono, email, pais, direccion, cuit, acceso_sistema, notas, created_at
       FROM clientes WHERE cliente_id = ? LIMIT 1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error("getClienteById error:", err);
    res.status(500).json({ error: err.message || "Error obteniendo cliente" });
  }
}

/**
 * POST /api/clientes
 * Body esperado (ej):
 * { nombre, contacto, telefono, email, pais, direccion, cuit, acceso_sistema, notas }
 */
async function createCliente(req, res) {
  try {
    const {
      nombre,
      contacto = null,
      telefono = null,
      email = null,
      pais = null,
      direccion = null,
      cuit = null,
      acceso_sistema = false,
      notas = null,
    } = req.body;

    if (!nombre || String(nombre).trim() === "") {
      return res.status(400).json({ error: "El campo 'nombre' es obligatorio." });
    }

    const sql = `INSERT INTO clientes
      (nombre, contacto, telefono, email, pais, direccion, cuit, acceso_sistema, notas, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    const params = [
      nombre,
      contacto,
      telefono,
      email,
      pais,
      direccion,
      cuit,
      acceso_sistema ? 1 : 0,
      notas,
    ];

    const [result] = await pool.query(sql, params);
    const insertId = result.insertId;

    const [rows] = await pool.query(
      `SELECT cliente_id, nombre, contacto, telefono, email, pais, direccion, cuit, acceso_sistema, notas, created_at
       FROM clientes WHERE cliente_id = ?`,
      [insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("createCliente error:", err);
    res.status(500).json({ error: err.message || "Error creando cliente" });
  }
}

/**
 * PATCH /api/clientes/:id
 * Recibe un JSON con campos a actualizar (nombre, contacto, telefono, email, pais, direccion, cuit, acceso_sistema, notas)
 */
async function updateCliente(req, res) {
  try {
    const { id } = req.params;
    const fields = req.body;

    // Validar que hay algo para actualizar
    const allowed = ["nombre", "contacto", "telefono", "email", "pais", "direccion", "cuit", "acceso_sistema", "notas"];
    const sets = [];
    const params = [];

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        sets.push(`${key} = ?`);
        // Normalizar booleano para acceso_sistema
        if (key === "acceso_sistema") {
          params.push(fields[key] ? 1 : 0);
        } else {
          params.push(fields[key]);
        }
      }
    }

    if (!sets.length) return res.status(400).json({ error: "No se enviaron campos válidos para actualizar." });

    params.push(id);
    const sql = `UPDATE clientes SET ${sets.join(", ")} WHERE cliente_id = ?`;
    await pool.query(sql, params);

    // Devolver registro actualizado
    const [rows] = await pool.query(
      `SELECT cliente_id, nombre, contacto, telefono, email, pais, direccion, cuit, acceso_sistema, notas, created_at
       FROM clientes WHERE cliente_id = ?`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error("updateCliente error:", err);
    res.status(500).json({ error: err.message || "Error actualizando cliente" });
  }
}

/**
 * DELETE /api/clientes/:id
 * Actualmente hace DELETE físico. Si preferís eliminación lógica, reemplazar por UPDATE clientes SET deleted_at = NOW() OR activo = 0.
 */
async function deleteCliente(req, res) {
  try {
    const { id } = req.params;

    // Opción A: borrado físico (descomentar si querés usar)
    // const [result] = await pool.query(`DELETE FROM clientes WHERE cliente_id = ?`, [id]);

    // Si preferís borrado lógico (recomendado en producción), podés cambiar por:
    await pool.query("UPDATE clientes SET acceso_sistema = 0 WHERE cliente_id = ?", [id]);
    // o agregar columna deleted_at y usar: UPDATE clientes SET deleted_at = NOW() WHERE cliente_id = ?

    if (result.affectedRows === 0) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json({ ok: true, deletedId: Number(id) });
  } catch (err) {
    console.error("deleteCliente error:", err);
    res.status(500).json({ error: err.message || "Error eliminando cliente" });
  }
}

module.exports = {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
};
