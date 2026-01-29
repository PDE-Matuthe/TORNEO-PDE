// ==========================================
// MODELO: Usuarios
// ==========================================
import pool from '../config/db.js'

/**
 * Buscar usuario por email
 */
export async function findByEmail (email) {
  try {
    const [rows] = await pool.query(
      'SELECT BIN_TO_UUID(id) as id, mail, contrasena, nombre_completo, isAdmin FROM usuarios WHERE mail = ?',
      [email]
    )
    return rows.length > 0 ? rows[0] : null
  } catch (error) {
    console.error('Error en findByEmail:', error.message)
    throw error
  }
}

/**
 * Buscar usuario por ID
 */
export async function findById (usuarioId) {
  try {
    const [rows] = await pool.query(
      'SELECT BIN_TO_UUID(id) as id, mail, nombre_completo, isAdmin FROM usuarios WHERE id = UUID_TO_BIN(?)',
      [usuarioId]
    )
    return rows.length > 0 ? rows[0] : null
  } catch (error) {
    console.error('Error en findById:', error.message)
    throw error
  }
}

/**
 * Obtener todos los usuarios (admin)
 */
export async function getAllUsers () {
  try {
    const [rows] = await pool.query(
      'SELECT BIN_TO_UUID(id) as id, mail, nombre_completo, isAdmin FROM usuarios ORDER BY nombre_completo'
    )
    return rows
  } catch (error) {
    console.error('Error en getAllUsers:', error.message)
    throw error
  }
}

/**
 * Crear nuevo usuario
 */
export async function createUser (mail, hashedPassword, nombreCompleto, isAdmin = 0) {
  try {
    const [result] = await pool.query(
      'INSERT INTO usuarios (id, mail, contrasena, nombre_completo, isAdmin) VALUES (UUID_TO_BIN(UUID()), ?, ?, ?, ?)',
      [mail, hashedPassword, nombreCompleto, isAdmin]
    )
    return {
      id: result.insertId,
      mail,
      nombre_completo: nombreCompleto,
      isAdmin
    }
  } catch (error) {
    console.error('Error en createUser:', error.message)
    throw error
  }
}

/**
 * Actualizar usuario
 */
export async function updateUser (usuarioId, updates) {
  try {
    const fields = []
    const values = []

    if (updates.nombre_completo) {
      fields.push('nombre_completo = ?')
      values.push(updates.nombre_completo)
    }
    if (updates.contrasena) {
      fields.push('contrasena = ?')
      values.push(updates.contrasena)
    }
    if (updates.isAdmin !== undefined) {
      fields.push('isAdmin = ?')
      values.push(updates.isAdmin)
    }

    if (fields.length === 0) return null

    values.push(usuarioId)

    const [result] = await pool.query(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?)`,
      values
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en updateUser:', error.message)
    throw error
  }
}

/**
 * Eliminar usuario
 */
export async function deleteUser (usuarioId) {
  try {
    const [result] = await pool.query(
      'DELETE FROM usuarios WHERE id = UUID_TO_BIN(?)',
      [usuarioId]
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en deleteUser:', error.message)
    throw error
  }
}
