import pool from './db.js'

// 1. Guardar estadísticas de UN jugador en UNA partida
export const savePlayerStats = async (data) => {
  const { partida_id, jugador_id, kills, deaths, assists, cs_min, dmg_min } = data
  
  // Calculamos el KP% (Kill Participation) luego, por ahora guardamos lo básico
  // Ojo: Si ya existen datos para este jugador en esta partida, los actualizamos
  await pool.query(`
    INSERT INTO estadisticas (partida_id, jugador_id, kills, deaths, assists, cs_min, dmg_min)
    VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    kills = VALUES(kills), deaths = VALUES(deaths), assists = VALUES(assists), 
    cs_min = VALUES(cs_min), dmg_min = VALUES(dmg_min)
  `, [partida_id, jugador_id, kills, deaths, assists, cs_min, dmg_min])
}

// 2. Obtener el Ranking MVP (Top jugadores por KDA)
export const getMVPLeaderboard = async () => {
  const [rows] = await pool.query(`
    SELECT 
      j.nombre_invocador,
      j.rol_juego,
      e.nombre as equipo,
      e.logo_url as equipo_logo,
      SUM(s.kills) as total_kills,
      SUM(s.deaths) as total_deaths,
      SUM(s.assists) as total_assists,
      -- Fórmula de KDA: (K + A) / D (Si muertes es 0, usamos 1 para no dividir por cero)
      ROUND((SUM(s.kills) + SUM(s.assists)) / GREATEST(SUM(s.deaths), 1), 2) as kda_ratio,
      AVG(s.cs_min) as avg_cs,
      AVG(s.dmg_min) as avg_dmg
    FROM estadisticas s
    JOIN jugadores j ON s.jugador_id = j.id
    JOIN equipos e ON j.equipo_id = e.id
    GROUP BY j.id
    ORDER BY kda_ratio DESC, total_kills DESC
    LIMIT 10
  `)
  return rows
}