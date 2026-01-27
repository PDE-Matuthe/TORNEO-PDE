import pool from './db.js'

export const findUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT BIN_TO_UUID(id) AS id, contrasena, isAdmin FROM usuarios WHERE mail = ?', [email])
  return rows[0]
}

export const checkUserExists = async (email) => {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE mail = ?', [email])
  return rows.length > 0
}

// Verificar si un usuario es admin
export const isUserAdmin = async (userId) => {
  const [rows] = await pool.query('SELECT isAdmin FROM usuarios WHERE id = UUID_TO_BIN(?)', [userId])
  return rows.length > 0 && rows[0].isAdmin === 1
}
