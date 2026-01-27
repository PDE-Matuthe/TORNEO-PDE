import pool from './db.js'

// Obtener todas las partidas (para el Calendario Público)
export const getAllPartidas = async () => {
  const [rows] = await pool.query(`
    SELECT 
      BIN_TO_UUID(p.id) as id,
      p.fecha_partida,
      p.fase_torneo,
      BIN_TO_UUID(p.ganador_id) as ganador_id,
      
      -- Datos del Equipo Azul
      BIN_TO_UUID(e1.id) as azul_id,
      e1.nombre as azul_nombre, 
      e1.logo_url as azul_logo,
      
      -- Datos del Equipo Rojo
      BIN_TO_UUID(e2.id) as rojo_id,
      e2.nombre as rojo_nombre, 
      e2.logo_url as rojo_logo
      
    FROM partidas p
    JOIN equipos e1 ON p.equipo_azul_id = e1.id
    JOIN equipos e2 ON p.equipo_rojo_id = e2.id
    ORDER BY p.fecha_partida ASC
  `)
  return rows
}

// Crear una nueva partida
export const createPartida = async (equipoAzul, equipoRojo, fecha, fase) => {
  await pool.query(`
    INSERT INTO partidas (equipo_azul_id, equipo_rojo_id, fecha_partida, fase_torneo)
    VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?)
  `, [equipoAzul, equipoRojo, fecha, fase])
}

// Actualizar el ganador de una partida
export const setGanador = async (partidaId, ganadorId) => {
  await pool.query(`
    UPDATE partidas 
    SET ganador_id = UUID_TO_BIN(?) 
    WHERE id = UUID_TO_BIN(?)
  `, [ganadorId, partidaId])
}

// Borrar partida
export const deletePartida = async (partidaId) => {
  await pool.query('DELETE FROM partidas WHERE id = UUID_TO_BIN(?)', [partidaId])
}