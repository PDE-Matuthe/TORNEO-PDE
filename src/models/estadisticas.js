// ==========================================
// MODELO: Estadísticas (CORREGIDO FINAL)
// ==========================================
import pool from '../config/db.js'

/**
 * Crear una estadística nueva (Al cargar partida)
 */
export async function createEstadistica (partidaId, jugadorId, equipoId, data) {
  try {
    const { rol, kills, deaths, assists, cs_min, dmg_min, champion_name, win } = data
    
    // Convertir booleano/numérico a 1/0 para MySQL
    const winVal = (win === true || win === 1 || win === '1') ? 1 : 0;

    await pool.query(`
      INSERT INTO estadisticas 
      (id, partida_id, jugador_id, equipo_id, rol, kills, deaths, assists, cs_min, dmg_min, champion_name, win)
      VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?)
    `, [partidaId, jugadorId, equipoId, rol, kills, deaths, assists, cs_min, dmg_min, champion_name, winVal])
    
  } catch (error) {
    console.error('Error createEstadistica:', error.message)
    throw error
  }
}

/**
 * Obtener Resumen General de un Jugador (KDA, Winrate, etc.)
 */
export async function getResumenJugador (jugadorId) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as partidas_jugadas,
        COALESCE(SUM(case when win = 1 then 1 else 0 end), 0) as victorias,
        COALESCE(SUM(kills), 0) as total_kills,
        COALESCE(SUM(deaths), 0) as total_deaths,
        COALESCE(SUM(assists), 0) as total_assists,
        COALESCE(SUM(cs_min), 0) as total_cs,
        COALESCE(SUM(dmg_min), 0) as total_dmg
      FROM estadisticas
      WHERE jugador_id = UUID_TO_BIN(?)
    `, [jugadorId])
    
    // Si no hay datos, devolvemos un objeto con ceros
    return rows[0] || { partidas_jugadas: 0, victorias: 0, total_kills: 0, total_deaths: 0, total_assists: 0 };
  } catch (error) {
    console.error('Error getResumenJugador:', error.message)
    throw error
  }
}

/**
 * Obtener Top Campeones del Jugador
 */
export async function getTopChampionsJugador (jugadorId) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        champion_name,
        COUNT(*) as partidas,
        SUM(case when win = 1 then 1 else 0 end) as victorias,
        SUM(kills) as total_kills,
        SUM(deaths) as total_deaths,
        SUM(assists) as total_assists
      FROM estadisticas
      WHERE jugador_id = UUID_TO_BIN(?)
      GROUP BY champion_name
      ORDER BY partidas DESC, victorias DESC
      LIMIT 3
    `, [jugadorId])
    return rows
  } catch (error) {
    console.error('Error getTopChampionsJugador:', error.message)
    throw error
  }
}

/**
 * Obtener historial de partidas recientes
 */
export async function getEstadisticasByJugador (jugadorId) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        BIN_TO_UUID(e.partida_id) as partida_id,
        e.champion_name,
        e.kills, e.deaths, e.assists,
        e.win, e.cs_min, e.dmg_min, e.rol,
        p.fecha_partida
      FROM estadisticas e
      JOIN partidas p ON e.partida_id = p.id
      WHERE e.jugador_id = UUID_TO_BIN(?)
      ORDER BY p.fecha_partida DESC
      LIMIT 10
    `, [jugadorId])
    return rows
  } catch (error) {
    console.error('Error getEstadisticasByJugador:', error.message)
    throw error
  }
}

/**
 * Obtener estadísticas de una partida específica
 */
export async function getEstadisticasByPartida (partidaId) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        BIN_TO_UUID(e.jugador_id) as jugador_id,
        BIN_TO_UUID(e.equipo_id) as equipo_id,
        j.nombre_invocador,
        e.rol, e.champion_name,
        e.kills, e.deaths, e.assists,
        e.cs_min, e.dmg_min, e.win
      FROM estadisticas e
      JOIN jugadores j ON e.jugador_id = j.id
      WHERE e.partida_id = UUID_TO_BIN(?)
    `, [partidaId])
    return rows
  } catch (error) {
    console.error('Error getEstadisticasByPartida:', error.message)
    throw error
  }
}

/**
 * Borrar estadísticas de una partida (Para regenerarlas)
 */
export async function deleteEstadisticasByPartida (partidaId) {
  try {
    await pool.query('DELETE FROM estadisticas WHERE partida_id = UUID_TO_BIN(?)', [partidaId])
  } catch (error) {
    console.error('Error deleteEstadisticasByPartida:', error.message)
    throw error
  }
}

/**
 * Ranking MVP (Para el Torneo) - CORREGIDO
 * Usa LEFT JOIN para equipos y BIN_TO_UUID directamente
 */
/**
 * Ranking MVP (Sistema de Puntos Ponderado)
 * Premia la constancia y el avance en el torneo, no solo el KDA de una partida.
 */
export async function getMVPRanking(torneoId) {
    try {
        const [rows] = await pool.query(`
        SELECT 
            j.nombre_invocador,
            j.rol_juego,
            BIN_TO_UUID(e.jugador_id) as id,
            COALESCE(eq.nombre, 'Agente Libre') as equipo_nombre,
            COALESCE(eq.logo_url, 'https://via.placeholder.com/50') as equipo_logo,
            
            COUNT(e.partida_id) as partidas_jugadas,
            COALESCE(SUM(e.kills), 0) as total_kills,
            COALESCE(SUM(e.deaths), 0) as total_deaths,
            COALESCE(SUM(e.assists), 0) as total_assists,
            
            (COALESCE(SUM(e.kills),0) + COALESCE(SUM(e.assists),0)) / GREATEST(COALESCE(SUM(e.deaths),0), 1) as kda_ratio,

            -- NUEVA FORMULA (Sin puntos por participar)
            (
                (SUM(e.kills) * 3) +                 -- 3 pts por Kill
                (SUM(e.assists) * 1.5) +             -- 1.5 pts por Assist
                (SUM(e.deaths) * -1) +               -- -1 pt por Death
                (SUM(CASE WHEN e.win = 1 THEN 10 ELSE 0 END)) + -- 10 pts por Victoria
                (AVG(e.cs_min) * 1)                  -- 1 pt por cada CS/min
            ) as mvp_score

        FROM estadisticas e
        JOIN partidas p ON e.partida_id = p.id
        JOIN jugadores j ON e.jugador_id = j.id
        LEFT JOIN equipos eq ON e.equipo_id = eq.id
        
        WHERE p.torneo_id = UUID_TO_BIN(?)
        GROUP BY e.jugador_id, j.nombre_invocador, j.rol_juego, eq.id, eq.nombre, eq.logo_url
        
        ORDER BY mvp_score DESC
        LIMIT 100
      `, [torneoId]);

        return rows;
    } catch (error) {
        console.error('Error SQL en getMVPRanking:', error.message);
        return [];
    }
}

// Helper rápido para Ranking MVP simple
export async function getMVPRankingSimple (torneoId) {
    try {
        const [rows] = await pool.query(`
            SELECT 
                BIN_TO_UUID(e.jugador_id) as id,
                j.nombre_invocador,
                eq.nombre as equipo_nombre,
                eq.logo_url as equipo_logo,
                (SUM(e.kills) + SUM(e.assists)) / GREATEST(SUM(e.deaths), 1) as kda
            FROM estadisticas e
            JOIN partidas p ON e.partida_id = p.id
            JOIN jugadores j ON e.jugador_id = j.id
            JOIN equipos eq ON e.equipo_id = eq.id
            WHERE p.torneo_id = UUID_TO_BIN(?)
            GROUP BY e.jugador_id, j.nombre_invocador, eq.id
            ORDER BY kda DESC
            LIMIT 5
        `, [torneoId]);
        return rows;
    } catch (error) {
        console.error('Error getMVPRankingSimple:', error.message);
        return [];
    }
}