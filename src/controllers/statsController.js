import { savePlayerStats, getMVPLeaderboard } from '../models/stats.js'
import { getJugadoresByEquipoId } from '../models/jugadores.js'
import pool from '../models/db.js' // Necesitamos pool para una query rápida manual

// --- VISTA PÚBLICA: RANKING MVP ---
export const renderMVPPage = async (req, res) => {
  const topPlayers = await getMVPLeaderboard()
  res.render('mvp', { title: 'Ranking MVP', topPlayers })
}

// --- VISTA ADMIN: FORMULARIO DE CARGA ---
export const renderCargarStats = async (req, res) => {
  const { partidaId } = req.params

  // 1. Obtenemos datos básicos de la partida para saber qué equipos juegan
  const [partida] = await pool.query(`
    SELECT 
      BIN_TO_UUID(id) as id, 
      BIN_TO_UUID(equipo_azul_id) as azul_id, 
      BIN_TO_UUID(equipo_rojo_id) as rojo_id 
    FROM partidas WHERE id = UUID_TO_BIN(?)
  `, [partidaId])

  if (partida.length === 0) return res.redirect('/calendario')

  // 2. Buscamos los jugadores de ambos equipos
  const jugadoresAzul = await getJugadoresByEquipoId(partida[0].azul_id)
  const jugadoresRojo = await getJugadoresByEquipoId(partida[0].rojo_id)

  res.render('admin-stats', {
    title: 'Cargar Estadísticas',
    partidaId,
    equipoAzul: jugadoresAzul,
    equipoRojo: jugadoresRojo
  })
}

// --- PROCESAR EL FORMULARIO ---
export const saveMatchStats = async (req, res) => {
  const { partidaId } = req.params
  const stats = req.body // Esto será un objeto con arrays de datos

  try {
    // El formulario nos enviará arrays (ej: stats.jugador_id es una lista de IDs)
    // Recorremos los datos recibidos (asumimos que llegan en orden)
    
    // NOTA: req.body.jugador_id será un array de 10 IDs (o los que hayan jugado)
    // Si solo hay 1 jugador, express lo envía como string, así que lo forzamos a array
    const jugadorIds = [].concat(req.body.jugador_id)
    const kills = [].concat(req.body.kills)
    const deaths = [].concat(req.body.deaths)
    const assists = [].concat(req.body.assists)
    const cs = [].concat(req.body.cs_min)
    const dmg = [].concat(req.body.dmg_min)

    for (let i = 0; i < jugadorIds.length; i++) {
      await savePlayerStats({
        partida_id: partidaId,
        jugador_id: jugadorIds[i],
        kills: kills[i] || 0,
        deaths: deaths[i] || 0,
        assists: assists[i] || 0,
        cs_min: cs[i] || 0,
        dmg_min: dmg[i] || 0
      })
    }

    res.redirect('/mvp') // Al terminar, vamos al ranking a ver cómo quedó
  } catch (error) {
    console.error('Error guardando stats:', error)
    res.status(500).send('Error al guardar estadísticas')
  }
}