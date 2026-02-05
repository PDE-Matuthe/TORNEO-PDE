// ==========================================
// SERVICIO: Riot Games API (Actualizado Riot ID)
// ==========================================
import axios from 'axios'

const RIOT_API_KEY = process.env.RIOT_API_KEY
const RIOT_REGION = process.env.RIOT_REGION || 'LA2'
// Para Account-V1 necesitamos la región "AMERICAS", "EUROPE", "ASIA"
// LA1, LA2, NA1, BR1 -> americas
const RIOT_CLUSTER = 'americas' 

const riotClient = axios.create({
  baseURL: `https://${RIOT_CLUSTER}.api.riotgames.com`, // Cambiamos base a cluster (americas)
  headers: {
    'X-Riot-Token': RIOT_API_KEY
  }
})

const matchClient = axios.create({
  baseURL: `https://${RIOT_CLUSTER}.api.riotgames.com`,
  headers: { 'X-Riot-Token': RIOT_API_KEY }
})

/**
 * Buscar Match ID de Riot usando Riot ID (Nombre#TAG)
 * @param {string} fullRiotId - Ejemplo: "Matuthe#LAS"
 * @returns {Promise<string>} - Match ID
 */
export async function getMatchIdByRiotId (fullRiotId) {
  try {
    // 1. Separar Nombre y Tag
    // Si el usuario no pone #TAG, asumimos #LAS por defecto (opcional)
    let [gameName, tagLine] = fullRiotId.split('#')
    
    if (!tagLine) {
       tagLine = 'LAS' // Tag por defecto si se olvida
       console.warn(`⚠️ No se detectó #TAG, usando #${tagLine} por defecto.`)
    }

    // 2. Obtener PUUID desde Account-V1 (Endpoint correcto para Riot ID)
    const accountResponse = await riotClient.get(
      `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    )
    const puuid = accountResponse.data.puuid

    // 3. Obtener lista de matches recientes del PUUID
    // Nota: Matches usa el cluster (americas), no la región específica (la2)
    const matchesResponse = await matchClient.get(
      `/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      {
        params: {
          start: 0,
          count: 5 // Traemos 5 por si la última fue un remake o arena
        }
      }
    )

    return matchesResponse.data[0] || null
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`⚠️ Riot ID no encontrado: ${fullRiotId}`)
      return null
    }
    if (error.response?.status === 403) {
      console.error('❌ API Key inválida o expirada')
    }
    console.error('Error en getMatchIdByRiotId:', error.message)
    throw error
  }
}

/**
 * Obtener detalles completos de una partida
 */
export async function getMatchDetails (matchId) {
  try {
    // Match V5 usa región 'americas' (cluster)
    const response = await matchClient.get(`/lol/match/v5/matches/${matchId}`)
    return response.data
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`⚠️ Match no encontrado: ${matchId}`)
      return null
    }
    console.error('Error en getMatchDetails:', error.message)
    throw error
  }
}

/**
 * Extraer estadísticas de un jugador en una partida
 * Busca por Riot ID (gameName + tagLine) o solo gameName si es único en la partida
 */
export async function extractPlayerStats (matchData, fullRiotId) {
  try {
    if (!matchData || !matchData.info) return null

    const [targetName] = fullRiotId.split('#') // Tomamos la parte del nombre para buscar

    // Buscar al jugador en los participantes
    // Riot API v5 devuelve 'riotIdGameName' y 'riotIdTagLine'
    const participant = matchData.info.participants.find(p => 
      p.riotIdGameName.toLowerCase() === targetName.toLowerCase() || 
      p.summonerName.toLowerCase() === targetName.toLowerCase()
    )

    if (!participant) {
      console.warn(`⚠️ Jugador ${fullRiotId} no encontrado en la partida`)
      return null
    }

    // Calcular CS/min y Dmg/min
    const durationMin = matchData.info.gameDuration / 60
    
    return {
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      cs_min: (participant.totalMinionsKilled + participant.neutralMinionsKilled) / durationMin,
      dmg_min: participant.totalDamageDealtToChampions / durationMin,
      champion_name: participant.championName,
      win: participant.win,
      duration_segundos: matchData.info.gameDuration
    }
  } catch (error) {
    console.error('Error en extractPlayerStats:', error.message)
    throw error
  }
}

/**
 * Importar estadísticas completas de una partida
 */
export async function importMatchStats (riotMatchId) {
  try {
    const matchData = await getMatchDetails(riotMatchId)
    if (!matchData) throw new Error('No se pudo obtener datos de la partida')

    const stats = []

    for (const participant of matchData.info.participants) {
      const durationMin = matchData.info.gameDuration / 60
      
      // Construimos el nombre completo para guardar en DB
      const fullName = `${participant.riotIdGameName}#${participant.riotIdTagLine}`

      stats.push({
        summoner_name: fullName, // Guardamos Nombre#Tag
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        cs_min: (participant.totalMinionsKilled + participant.neutralMinionsKilled) / durationMin,
        dmg_min: participant.totalDamageDealtToChampions / durationMin,
        champion_name: participant.championName,
        win: participant.win,
        team: participant.teamId === 100 ? 'azul' : 'rojo'
      })
    }

    return {
      match_id: riotMatchId,
      duration_segundos: matchData.info.gameDuration,
      timestamp: matchData.info.gameEndTimestamp,
      game_mode: matchData.info.gameMode,
      stats: stats
    }
  } catch (error) {
    console.error('Error en importMatchStats:', error.message)
    throw error
  }
}

export function isApiKeyConfigured () {
  return !!RIOT_API_KEY && RIOT_API_KEY !== 'RGAPI-xxxxxxxxxxxx-xxxxxxxxxxxx'
}