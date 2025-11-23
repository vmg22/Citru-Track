const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.obtenerTodosUsuarios = async (req, res) => {
  try {
    const [usuarios] = await db.query(
      `
      SELECT 
          u.user_id, 
          u.username, 
          u.email, 
          u.nombre, 
          u.telefono, 
          u.activo, 
          u.created_at, 
          u.updated_at, 
          u.last_login,
          -- Usamos GROUP_CONCAT para listar todos los roles asignados
          GROUP_CONCAT(r.name SEPARATOR ', ') AS roles_asignados 
      FROM 
          users u
      LEFT JOIN 
          user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN 
          roles r ON ur.role_id = r.role_id
      WHERE 
          u.activo = TRUE 
      GROUP BY
          u.user_id, u.username, u.email, u.nombre, u.telefono, u.activo, u.created_at, u.updated_at, u.last_login
      ORDER BY 
          u.user_id DESC
      `
    );
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

exports.obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [[usuario]] = await db.query(
      'SELECT user_id, username, email, nombre, telefono, activo, created_at, updated_at, last_login FROM users WHERE user_id = ?',
      [id]
    );
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

exports.obtenerUsuariosInactivos = async (req, res) => {
  try {
    const [usuarios] = await db.query(
      'SELECT user_id, username, email, nombre, telefono, activo, created_at, updated_at, last_login FROM users WHERE activo = FALSE ORDER BY updated_at DESC'
    );
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios inactivos:', error);
    res.status(500).json({ error: 'Error al obtener usuarios inactivos' });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const { username, password, email, nombre, telefono, roles } = req.body;
    
    if (!username || !password || !email) {
      return res.status(400).json({ 
        error: 'Los campos username, password y email son obligatorios' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    const [[usernameExistente]] = await db.query(
      'SELECT user_id FROM users WHERE username = ?',
      [username]
    );
    
    if (usernameExistente) {
      return res.status(409).json({ error: 'El username ya está en uso' });
    }

    const [[emailExistente]] = await db.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );
    
    if (emailExistente) {
      return res.status(409).json({ error: 'El email ya está en uso' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed_password = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO users (username, email, hashed_password, nombre, telefono) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashed_password, nombre || null, telefono || null]
    );

    const userId = result.insertId;

// INICIO DE LA LÓGICA DE ROLES
    if (Array.isArray(roles) && roles.length > 0) {
      for (const roleName of roles) {
        const [[role]] = await db.query(
          'SELECT role_id FROM roles WHERE name = ?', // Busca el ID del rol por su nombre
          [roleName]
        );
        
        if (role) {
          await db.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', // Asigna el rol al usuario
            [userId, role.role_id]
          );
        }
      }
    }

    const [[nuevoUsuario]] = await db.query(
      'SELECT user_id, username, email, nombre, telefono, activo, created_at, updated_at, last_login FROM users WHERE user_id = ?',
      [userId]
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: nuevoUsuario
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, email, nombre, telefono, activo } = req.body;
    
    const [[usuarioExistente]] = await db.query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [id]
    );
    
    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const fields = [];
    const values = [];

    if (username !== undefined) {
      const [[usernameEnUso]] = await db.query(
        'SELECT user_id FROM users WHERE username = ? AND user_id != ?',
        [username, id]
      );
      
      if (usernameEnUso) {
        return res.status(409).json({ 
          error: 'El username ya está en uso por otro usuario' 
        });
      }
      
      fields.push('username = ?');
      values.push(username);
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
      }

      const [[emailEnUso]] = await db.query(
        'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
        [email, id]
      );
      
      if (emailEnUso) {
        return res.status(409).json({ 
          error: 'El email ya está en uso por otro usuario' 
        });
      }
      
      fields.push('email = ?');
      values.push(email);
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'La contraseña debe tener al menos 6 caracteres' 
        });
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashed_password = await bcrypt.hash(password, salt);
      fields.push('hashed_password = ?');
      values.push(hashed_password);
    }

    if (nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(nombre);
    }

    if (telefono !== undefined) {
      fields.push('telefono = ?');
      values.push(telefono);
    }

    if (activo !== undefined) {
      fields.push('activo = ?');
      values.push(activo);
    }

    if (fields.length === 0) {
      return res.status(400).json({ 
        error: 'Debe proporcionar al menos un campo para actualizar' 
      });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    values.push(id);

    await db.query(query, values);

    const [[usuarioActualizado]] = await db.query(
      'SELECT user_id, username, email, nombre, telefono, activo, created_at, updated_at, last_login FROM users WHERE user_id = ?',
      [id]
    );
    
    res.json({
      message: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

exports.actualizarUsuarioParcial = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ 
        error: 'Debe proporcionar al menos un campo para actualizar' 
      });
    }

    const [[usuarioExistente]] = await db.query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [id]
    );
    
    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const fields = [];
    const values = [];

    if (data.username !== undefined) {
      const [[usernameEnUso]] = await db.query(
        'SELECT user_id FROM users WHERE username = ? AND user_id != ?',
        [data.username, id]
      );
      
      if (usernameEnUso) {
        return res.status(409).json({ 
          error: 'El username ya está en uso por otro usuario' 
        });
      }
      
      fields.push('username = ?');
      values.push(data.username);
    }

    if (data.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
      }

      const [[emailEnUso]] = await db.query(
        'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
        [data.email, id]
      );
      
      if (emailEnUso) {
        return res.status(409).json({ 
          error: 'El email ya está en uso por otro usuario' 
        });
      }
      
      fields.push('email = ?');
      values.push(data.email);
    }

    if (data.password !== undefined) {
      if (data.password.length < 6) {
        return res.status(400).json({ 
          error: 'La contraseña debe tener al menos 6 caracteres' 
        });
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashed_password = await bcrypt.hash(data.password, salt);
      fields.push('hashed_password = ?');
      values.push(hashed_password);
    }

    if (data.nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(data.nombre);
    }

    if (data.telefono !== undefined) {
      fields.push('telefono = ?');
      values.push(data.telefono);
    }

    if (data.activo !== undefined) {
      fields.push('activo = ?');
      values.push(data.activo);
    }

    if (fields.length === 0) {
      return res.status(400).json({ 
        error: 'No hay campos válidos para actualizar' 
      });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    values.push(id);

    await db.query(query, values);

    const [[usuarioActualizado]] = await db.query(
      'SELECT user_id, username, email, nombre, telefono, activo, created_at, updated_at, last_login FROM users WHERE user_id = ?',
      [id]
    );
    
    res.json({
      message: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error al actualizar usuario parcialmente:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};



// Actualiza el campo de último login del usuario
exports.actualizarUltimoLogin = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
      [id]
    );
    
    res.json({ message: 'Último login actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar último login:', error);
    res.status(500).json({ error: 'Error al actualizar último login' });
  }
};

 
// Elimina (desactiva) un usuario cambiando su estado a inactivo
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query(
      'UPDATE users SET activo = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ message: 'Usuario desactivado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};


// Restaura un usuario cambiando su estado a activo
exports.restaurarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query(
      'UPDATE users SET activo = TRUE, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const [[usuarioRestaurado]] = await db.query(
      'SELECT user_id, username, email, nombre, telefono, activo, created_at, updated_at, last_login FROM users WHERE user_id = ?',
      [id]
    );
    
    res.json({
      message: 'Usuario restaurado exitosamente',
      usuario: usuarioRestaurado
    });
  } catch (error) {
    console.error('Error al restaurar usuario:', error);
    res.status(500).json({ error: 'Error al restaurar usuario' });
  }
};


// Elimina permanentemente un usuario de la base de datos
exports.eliminarUsuarioPermanente = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM user_roles WHERE user_id = ?', [id]);
    
    const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ message: 'Usuario eliminado permanentemente' });
  } catch (error) {
    console.error('Error al eliminar usuario permanentemente:', error);
    res.status(500).json({ error: 'Error al eliminar usuario permanentemente' });
  }
};

