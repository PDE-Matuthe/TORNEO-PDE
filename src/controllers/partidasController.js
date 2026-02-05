// ==========================================
// CONTROLADOR: Partidas (Admin)
// ==========================================
import * as partidasModel from '../models/partidas.js'
import * as equiposModel from '../models/equipos.js'
import * as torneosModel from '../models/torneos.js'
import * as estadisticasModel from '../models/estadisticas.js'
import * as jugadoresModel from '../models/jugadores.js'
import * as riotService from '../services/riotService.js' 

/**
 * GET /admin/partidas - Listado agrupado
 */
export async function getPartidas (req, res) {
  try {
    const partidasRaw = await partidasModel.getAllPartidas()
    
    // Agrupar por Torneo
    const partidasPorTorneo = {}
    partidasRaw.forEach(p => {
      const nombreTorneo = p.torneo_nombre || 'Partidas Sin Torneo Asignado'
      if (!partidasPorTorneo[nombreTorneo]) {
        partidasPorTorneo[nombreTorneo] = []
      }
      partidasPorTorneo[nombreTorneo].push(p)
    })

    res.render('admin-partidas', { partidasPorTorneo })
  } catch (error) {
    console.error('Error en getPartidas:', error.message)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar partidas' })
  }
}

/**
 * GET /admin/partidas/crear
 */
export async function getCreatePartida (req, res) {
  try {
    const torneos = await torneosModel.getAllTorneos()
    res.render('admin-partidas-crear', { torneos })
  } catch (error) {
    console.error('Error en getCreatePartida:', error.message)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar formulario' })
  }
}

/**
 * POST /admin/partidas
 */
export async function postCreatePartida (req, res) {
  try {
    const { torneo_id, equipo_azul, equipo_rojo, fecha_partida, fase_torneo } = req.body

    if (!torneo_id || !equipo_azul || !equipo_rojo || !fecha_partida) {
       const torneos = await torneosModel.getAllTorneos()
       return res.render('admin-partidas-crear', { 
          torneos, 
          error: 'Todos los campos son obligatorios.' 
       })
    }

    if (equipo_azul === equipo_rojo) {
      const torneos = await torneosModel.getAllTorneos()
      return res.render('admin-partidas-crear', { 
        torneos, 
        error: 'El equipo Azul y Rojo no pueden ser el mismo.' 
      })
    }

    await partidasModel.createPartida(equipo_azul, equipo_rojo, fecha_partida, fase_torneo, torneo_id)
    
    console.log(`✅ Partida creada en torneo ${torneo_id}`)
    res.redirect('/admin/partidas?success=Partida programada exitosamente')

  } catch (error) {
    console.error('Error en postCreatePartida:', error.message)
    res.redirect('/admin/partidas/crear?error=Error al crear la partida')
  }
}

/**
 * GET /admin/partidas/:id/editar
 */
export async function getEditPartida (req, res) {
  try {
    const { id } = req.params
    const partida = await partidasModel.getPartidaById(id)
    
    if (!partida) return res.status(404).render('error', { codigo: 404, mensaje: 'Partida no encontrada' })
    
    res.render('admin-partidas-editar', { partida })
  } catch (error) {
    console.error('Error en getEditPartida:', error.message)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar edición' })
  }
}

/**
 * POST /admin/partidas/:id/update
 */
export async function postUpdatePartida (req, res) {
  try {
    const { id } = req.params
    let { fecha_partida, fase_torneo, estado, stream_url, swap_sides } = req.body

    if (estado === 'EN_VIVO') {
        if (!stream_url) {
            estado = 'ACTIVO'; 
        } else {
            await partidasModel.resetOtrasPartidasEnVivo(id);
        }
    } else {
        stream_url = null;
    }

    const updates = { fecha_partida, fase_torneo, estado, stream_url };
    
    if (swap_sides === 'on') {
        const currentPartida = await partidasModel.getPartidaById(id);
        updates.equipo_azul_id = currentPartida.rojo_id;
        updates.equipo_rojo_id = currentPartida.azul_id;
    }

    await partidasModel.updatePartida(id, updates);
    res.redirect('/admin/partidas?success=Partida modificada correctamente');

  } catch (error) {
    console.error('Error en postUpdatePartida:', error.message)
    res.redirect(`/admin/partidas?error=Error al actualizar partida`);
  }
}

/**
 * GET /admin/partidas/:id/cargar
 */
export async function getPartidaDetalle (req, res) {
  try {
    const { id } = req.params

    const partida = await partidasModel.getPartidaById(id)
    if (!partida) return res.status(404).render('error', { codigo: 404, mensaje: 'Partida no encontrada' })

    const stats = await estadisticasModel.getEstadisticasByPartida(id)
    const jugadoresAzul = await jugadoresModel.getJugadoresByEquipo(partida.azul_id)
    const jugadoresRojo = await jugadoresModel.getJugadoresByEquipo(partida.rojo_id)

    res.render('admin-partida-detalle', {
      partida,
      stats,
      jugadoresAzul,
      jugadoresRojo,
      riotConfigured: riotService.isApiKeyConfigured()
    })
  } catch (error) {
    console.error('Error en getPartidaDetalle:', error.message)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar detalle' })
  }
}

/**
 * POST /admin/partidas/:id/guardar-manual (CON ROL Y SUPLENTES)
 */
export async function postCargarStatsManual (req, res) {
  try {
    const { id } = req.params
    const { duracion_minutos, ganador_id, datos_jugadores } = req.body
    
    // Parsear si viene como string
    const playersData = typeof datos_jugadores === 'string' ? JSON.parse(datos_jugadores) : datos_jugadores;

    // 1. Limpiar stats previas
    await estadisticasModel.deleteEstadisticasByPartida(id)

    // 2. Procesar filas
    if (playersData && Array.isArray(playersData)) {
      for (const row of playersData) {
         
         let jugadorId = row.jugador_id;
         const nombreJugador = row.nombre_nuevo || 'Desconocido';
         const equipoId = row.equipo_id;

         // Si es Jugador Nuevo (Suplente)
         if (jugadorId === 'NEW' || !jugadorId) {
            console.log(`👤 Creando jugador nuevo: ${nombreJugador} en equipo ${equipoId}`);
            
            const nuevoJugador = await jugadoresModel.createJugador({
                nombre_invocador: nombreJugador,
                rol_principal: row.rol || 'FILL', // Usamos el rol seleccionado como principal también
                rango: 'UNRANKED',
                equipo_id: equipoId,
                tipo_rol: 'SUPLENTE'
            });
            jugadorId = nuevoJugador.id || nuevoJugador; 
         }

         const kills = parseInt(row.kills) || 0
         const deaths = parseInt(row.deaths) || 0
         const assists = parseInt(row.assists) || 0
         const cs = parseInt(row.cs) || 0
         const dmg = parseInt(row.dmg) || 0
         
         // Guardar estadística con el ROL
         await estadisticasModel.createEstadistica(
           id,
           jugadorId,
           equipoId,
           {
             rol: row.rol, // <--- Importante: Pasamos el Rol
             kills, deaths, assists,
             cs_min: cs,
             dmg_min: dmg,
             champion_name: row.champion,
             win: (equipoId === ganador_id) ? 1 : 0
           }
         )
      }
    }

    // 3. Finalizar partida
    const duracionSegundos = (parseInt(duracion_minutos) || 0) * 60;

    await partidasModel.updatePartida(id, {
      ganador_id: ganador_id,
      duracion_segundos: duracionSegundos,
      estado: 'FINALIZADO'
    })

    console.log(`📝 Stats guardadas con roles. Partida ${id} finalizada.`)
    res.json({ success: true, redirect: `/admin/partidas/${id}/cargar?success=Datos guardados` });

  } catch (error) {
    console.error('Error en postCargarStatsManual:', error.message)
    res.status(500).json({ error: 'Error al guardar datos: ' + error.message });
  }
}

/**
 * POST /admin/partidas/:id/import-riot (Legacy)
 */
export async function postImportRiotStats (req, res) {
  try {
    const { id: partidaId } = req.params
    const { riot_match_id } = req.body

    if (!riotService.isApiKeyConfigured()) return res.status(400).json({ error: 'API Key no configurada' })

    const partida = await partidasModel.getPartidaById(partidaId)
    const riotData = await riotService.importMatchStats(riot_match_id)
    if (!riotData) return res.status(404).json({ error: 'Partida no encontrada en Riot' })

    await estadisticasModel.deleteEstadisticasByPartida(partidaId)

    let statsCreados = 0
    for (const stat of riotData.stats) {
      const jugador = await jugadoresModel.getJugadorByNombreInvocador(stat.summoner_name)
      if (!jugador) continue 

      let equipoId = (stat.team === 'azul') ? partida.azul_id : partida.rojo_id

      await estadisticasModel.createEstadistica(
        partidaId, jugador.id, equipoId,
        {
          rol: stat.role || 'UNKNOWN', // Riot suele dar esto
          kills: stat.kills, deaths: stat.deaths, assists: stat.assists,
          cs_min: stat.cs_min, dmg_min: stat.dmg_min,
          champion_name: stat.champion_name, win: stat.win
        }
      )
      statsCreados++
    }

    const ganadorId = riotData.stats[0].win ? partida.azul_id : partida.rojo_id;
    await partidasModel.updatePartida(partidaId, {
      riot_match_id: riot_match_id,
      duracion_segundos: riotData.duration_segundos,
      ganador_id: ganadorId,
      estado: 'FINALIZADO'
    })

    res.json({ success: true, message: `Importado exitosamente: ${statsCreados} jugadores.` })

  } catch (error) {
    console.error('Error en postImportRiotStats:', error.message)
    res.status(500).json({ error: error.message || 'Error al importar' })
  }
}

export async function postDeletePartida (req, res) {
  try {
    const { id } = req.params
    await estadisticasModel.deleteEstadisticasByPartida(id)
    await partidasModel.deletePartida(id)
    res.redirect('/admin/partidas?success=Partida eliminada')
  } catch (error) {
    console.error('Error en postDeletePartida:', error.message)
    res.redirect('/admin/partidas?error=No se pudo eliminar la partida')
  }
}

export async function getTestRiot (req, res) {
  try {
    const { riotId } = req.query 
    if (!riotId) return res.send('Falta riotId')
    const datos = await riotService.importMatchStats(riotId)
    res.json(datos) 
  } catch (error) {
    res.status(500).json({ error: 'Falló la prueba', detalle: error.message })
  }
}

export async function getStats (req, res) { res.send('Stats: En construcción') }