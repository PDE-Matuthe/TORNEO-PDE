// ==========================================
// MODELO: Equipos
// ==========================================
import pool from '../config/db.js'

/**
 * Obtener todos los equipos
 */
export async function getAllEquipos () {
  try {
    const [rows] = await pool.query(
      'SELECT BIN_TO_UUID(id) as id, nombre, siglas, logo_url FROM equipos ORDER BY nombre'
    )
    return rows
  } catch (error) {
    console.error('Error en getAllEquipos:', error.message)
    throw error
  }
}

/**
 * Obtener equipo por ID
 */
export async function getEquipoById (equipoId) {
  try {
    const [rows] = await pool.query(
      'SELECT BIN_TO_UUID(id) as id, nombre, siglas, logo_url FROM equipos WHERE id = UUID_TO_BIN(?)',
      [equipoId]
    )
    return rows.length > 0 ? rows[0] : null
  } catch (error) {
    console.error('Error en getEquipoById:', error.message)
    throw error
  }
}

/**
 * Obtener equipos de un torneo
 */
export async function getEquiposByTorneo (torneoId) {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(e.id) as id, e.nombre, e.siglas, e.logo_url
       FROM equipos e
       INNER JOIN torneo_equipos te ON e.id = te.equipo_id
       WHERE te.torneo_id = UUID_TO_BIN(?)
       ORDER BY e.nombre`,
      [torneoId]
    )
    return rows
  } catch (error) {
    console.error('Error en getEquiposByTorneo:', error.message)
    throw error
  }
}

/**
 * Crear nuevo equipo
 */
export async function createEquipo (nombre, siglas, logoUrl = null) {
  try {
    const [result] = await pool.query(
      'INSERT INTO equipos (id, nombre, siglas, logo_url) VALUES (UUID_TO_BIN(UUID()), ?, ?, ?)',
      [nombre, siglas, logoUrl]
    )
    return {
      id: result.insertId,
      nombre,
      siglas,
      logo_url: logoUrl
    }
  } catch (error) {
    console.error('Error en createEquipo:', error.message)
    throw error
  }
}

/**
 * Actualizar equipo
 */
export async function updateEquipo (equipoId, updates) {
  try {
    const fields = []
    const values = []

    if (updates.nombre) {
      fields.push('nombre = ?')
      values.push(updates.nombre)
    }
    if (updates.siglas) {
      fields.push('siglas = ?')
      values.push(updates.siglas)
    }
    if (updates.logo_url) {
      fields.push('logo_url = ?')
      values.push(updates.logo_url)
    }

    if (fields.length === 0) return null

    values.push(equipoId)

    const [result] = await pool.query(
      `UPDATE equipos SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?)`,
      values
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en updateEquipo:', error.message)
    throw error
  }
}

/**
 * Agregar equipo a torneo
 */
export async function addEquipoToTorneo (torneoId, equipoId) {
  try {
    const [result] = await pool.query(
      'INSERT INTO torneo_equipos (torneo_id, equipo_id) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?))',
      [torneoId, equipoId]
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en addEquipoToTorneo:', error.message)
    throw error
  }
}

/**
 * Remover equipo de torneo
 */
export async function removeEquipoFromTorneo (torneoId, equipoId) {
  try {
    const [result] = await pool.query(
      'DELETE FROM torneo_equipos WHERE torneo_id = UUID_TO_BIN(?) AND equipo_id = UUID_TO_BIN(?)',
      [torneoId, equipoId]
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en removeEquipoFromTorneo:', error.message)
    throw error
  }
}

/**
 * Eliminar equipo (solo si no está en ningún torneo)
 */
export async function deleteEquipo (equipoId) {
  try {
    const [result] = await pool.query(
      'DELETE FROM equipos WHERE id = UUID_TO_BIN(?)',
      [equipoId]
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en deleteEquipo:', error.message)
    throw error
  }
}