// ==========================================
// SERVICIO: Riot Games API
// ==========================================
import axios from 'axios'

const RIOT_API_KEY = process.env.RIOT_API_KEY
const RIOT_REGION = process.env.RIOT_REGION || 'LA2'
const RIOT_PLATFORM_ID = process.env.RIOT_PLATFORM_ID || 'LA2'

const riotClient = axios.create({
  baseURL: `https://${RIOT_REGION}.api.riotgames.com`,
  headers: {
    'X-Riot-Token': RIOT_API_KEY
  }
})

/**
 * Buscar Match ID de Riot a través del Summoner Name
 * @param {string} summonerName - Nombre del invocador
 * @returns {Promise<string>} - Match ID
 */
export async function getMatchIdBySummonerName (summonerName) {
  try {
    // 1. Obtener Summoner Name normalizado
    const summonerResponse = await riotClient.get(
      `/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`
    )
    const puuid = summonerResponse.data.puuid

    // 2. Obtener lista de matches recientes del PUUID
    const matchesResponse = await riotClient.get(
      `/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      {
        params: {
          start: 0,
          count: 20
        }
      }
    )

    return matchesResponse.data[0] || null
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`⚠️ Summoner no encontrado: ${summonerName}`)
      return null
    }
    if (error.response?.status === 403) {
      console.error('❌ API Key inválida o expirada')
    }
    console.error('Error en getMatchIdBySummonerName:', error.message)
    throw error
  }
}

/**
 * Obtener detalles completos de una partida
 * @param {string} matchId - ID de la partida
 * @returns {Promise<Object>} - Detalles de la partida
 */
export async function getMatchDetails (matchId) {
  try {
    const response = await riotClient.get(`/lol/match/v5/matches/${matchId}`)
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
 * @param {Object} matchData - Datos de la partida
 * @param {string} summonerName - Nombre del invocador a buscar
 * @returns {Promise<Object|null>} - Stats del jugador
 */
export async function extractPlayerStats (matchData, summonerName) {
  try {
    if (!matchData || !matchData.info) {
      console.error('❌ Datos de partida inválidos')
      return null
    }

    // Buscar al jugador en los participantes
    const participant = matchData.info.participants.find(
      p => p.summonerName.toLowerCase() === summonerName.toLowerCase()
    )

    if (!participant) {
      console.warn(`⚠️ Jugador ${summonerName} no encontrado en la partida`)
      return null
    }

    // Extraer estadísticas relevantes
    return {
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      cs_min: (participant.totalMinionsKilled + participant.neutralMinionsKilled) / (matchData.info.gameDuration / 60),
      dmg_min: participant.totalDamageDealtToChampions / (matchData.info.gameDuration / 60),
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
 * Importar estadísticas completas de una partida de Riot
 * Retorna las estadísticas para todos los 10 jugadores
 * @param {string} riotMatchId - ID de la partida de Riot
 * @returns {Promise<Array>} - Array con stats de todos los jugadores
 */
export async function importMatchStats (riotMatchId) {
  try {
    const matchData = await getMatchDetails(riotMatchId)
    if (!matchData) throw new Error('No se pudo obtener datos de la partida')

    const stats = []

    // Extraer stats de los 10 jugadores
    for (const participant of matchData.info.participants) {
      stats.push({
        summoner_name: participant.summonerName,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        cs_min: (participant.totalMinionsKilled + participant.neutralMinionsKilled) / (matchData.info.gameDuration / 60),
        dmg_min: participant.totalDamageDealtToChampions / (matchData.info.gameDuration / 60),
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

/**
 * Validar si el API Key está configurado
 */
export function isApiKeyConfigured () {
  return !!RIOT_API_KEY && RIOT_API_KEY !== 'RGAPI-xxxxxxxxxxxx-xxxxxxxxxxxx'
}

/**
 * Obtener información del cliente
 */
export function getClientInfo () {
  return {
    api_key_configured: isApiKeyConfigured(),
    region: RIOT_REGION,
    platform_id: RIOT_PLATFORM_ID
  }
}
