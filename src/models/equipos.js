import pool from './db.js'

// Obtener todos los equipos de un administrador (usuario)
export const getEquiposByUsuarioId = async (usuarioId) => {
  const [rows] = await pool.query(
    'SELECT BIN_TO_UUID(id) as id, nombre, region, logo_url, verificado FROM equipos WHERE usuario_id = UUID_TO_BIN(?) ORDER BY id DESC',
    [usuarioId]
  )
  return rows
}

// Crear un nuevo equipo
export const createEquipo = async (usuarioId, nombre, region, logoUrl) => {
  await pool.query(
    'INSERT INTO equipos (usuario_id, nombre, region, logo_url) VALUES (UUID_TO_BIN(?), ?, ?, ?)',
    [usuarioId, nombre, region, logoUrl]
  )
}

// Obtener un equipo específico por su ID (para editarlo)
export const getEquipoById = async (equipoId) => {
  const [rows] = await pool.query(
    'SELECT BIN_TO_UUID(id) as id, nombre, region, logo_url, verificado FROM equipos WHERE BIN_TO_UUID(id) = ?',
    [equipoId]
  )
  return rows[0]
}

// Actualizar datos de un equipo
export const updateEquipo = async (equipoId, nombre, region, logoUrl) => {
  await pool.query(
    'UPDATE equipos SET nombre = ?, region = ?, logo_url = ? WHERE BIN_TO_UUID(id) = ?',
    [nombre, region, logoUrl, equipoId]
  )
}

// Borrar un equipo
export const deleteEquipo = async (equipoId) => {
  await pool.query('DELETE FROM equipos WHERE BIN_TO_UUID(id) = ?', [equipoId])
}