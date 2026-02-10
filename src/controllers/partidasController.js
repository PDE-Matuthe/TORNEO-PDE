// ==========================================
// CONTROLADOR: Partidas (Admin)
// ==========================================
import pool from '../config/db.js' // <--- IMPORTANTE: Necesario para consultas directas
import * as partidasModel from '../models/partidas.js'
import * as equiposModel from '../models/equipos.js'
import * as torneosModel from '../models/torneos.js'
import * as estadisticasModel from '../models/estadisticas.js'
import * as jugadoresModel from '../models/jugadores.js'
import * as riotService from '../services/riotService.js' 

/**
 * GET /admin/partidas - Listado simple para la tabla nueva
 */
// En src/controllers/partidasController.js

export async function getPartidas (req, res) {
  try {
    // 1. Obtenemos los filtros de la URL
    let { torneo, fase } = req.query;

    // 2. Obtenemos la lista de torneos y el torneo activo
    const torneos = await torneosModel.getAllTorneos();
    const torneoActivo = await torneosModel.getTorneoActivo();

    // 3. LÓGICA DE DEFAULT:
    // Si el usuario NO especificó un torneo (es la primera vez que entra),
    // y existe un torneo activo, forzamos el filtro a ese torneo.
    if (!torneo && torneoActivo) {
        torneo = torneoActivo.id;
    }

    // (Nota: Si el usuario elige "Todos" en el menú, 'torneo' valdrá 'todos', 
    // así que no entrará en el if de arriba y mostrará todo correctamente).

    // 4. Obtener las partidas filtradas
    const partidas = await partidasModel.getAllPartidas({ 
        torneoId: torneo, 
        fase: fase 
    });
    
    // 5. Renderizar
    res.render('admin-partidas', { 
        partidas, 
        torneos,           
        // Si 'torneo' tiene valor (el activo o el elegido), lo usamos. Si no, 'todos'.
        filtroTorneo: torneo || 'todos', 
        filtroFase: fase || 'todas'      
    });

  } catch (error) {
    console.error('Error en getPartidas:', error.message);
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar partidas' });
  }
}

/**
 * POST /admin/partidas/:id/orden - Actualizar posición del bracket
 */
export async function actualizarOrdenPartida(req, res) {
    const { id } = req.params;
    // Recibimos los filtros del cuerpo del formulario
    const { posicion_bracket, torneo_actual, fase_actual } = req.body;

    try {
        // Usamos db o pool según cómo lo tengas importado ahora
        await pool.query(
            'UPDATE partidas SET posicion_bracket = ? WHERE id = UUID_TO_BIN(?)',
            [posicion_bracket, id]
        );

        // Construimos la redirección manteniendo los filtros
        const params = new URLSearchParams();
        
        if (torneo_actual && torneo_actual !== 'todos') {
            params.append('torneo', torneo_actual);
        }
        
        if (fase_actual && fase_actual !== 'todas') {
            params.append('fase', fase_actual);
        }

        // Redirigimos a /admin/partidas?torneo=...&fase=...
        res.redirect(`/admin/partidas?${params.toString()}`);

    } catch (error) {
        console.error("Error al actualizar orden:", error);
        res.status(500).send("Error actualizando el orden");
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

    if (!torneo_id || !fecha_partida) {
       const torneos = await torneosModel.getAllTorneos()
       return res.render('admin-partidas-crear', { 
          torneos, 
          error: 'Torneo y Fecha son obligatorios.' 
       })
    }
    
    // Permitimos equipos NULL para crear huecos de bracket
    // Si vienen vacíos, pasamos null
    const azul = equipo_azul || null;
    const rojo = equipo_rojo || null;

    if (azul && rojo && azul === rojo) {
      const torneos = await torneosModel.getAllTorneos()
      return res.render('admin-partidas-crear', { 
        torneos, 
        error: 'El equipo Azul y Rojo no pueden ser el mismo.' 
      })
    }

    await partidasModel.createPartida(azul, rojo, fecha_partida, fase_torneo, torneo_id)
    
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
    let { fecha_partida, fase_torneo, estado, swap_sides, vod_url } = req.body

    if (estado === 'EN_VIVO') {
        await partidasModel.resetOtrasPartidasEnVivo(id);
    }

    const updates = { 
        fecha_partida, 
        fase_torneo, 
        estado, 
        vod_url
    };
    
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
 * POST /admin/partidas/:id/guardar-manual
 */
export async function postCargarStatsManual (req, res) {
  try {
    const { id } = req.params
    const { duracion_minutos, ganador_id, datos_jugadores } = req.body
    
    const playersData = typeof datos_jugadores === 'string' ? JSON.parse(datos_jugadores) : datos_jugadores;

    // 1. Limpiar stats previas
    await estadisticasModel.deleteEstadisticasByPartida(id)

    // 2. Procesar filas
    if (playersData && Array.isArray(playersData)) {
      for (const row of playersData) {
         let jugadorId = row.jugador_id;
         const nombreJugador = row.nombre_nuevo || 'Desconocido';
         const equipoId = row.equipo_id;

         if (jugadorId === 'NEW' || !jugadorId) {
            const nuevoJugador = await jugadoresModel.createJugador({
                nombre_invocador: nombreJugador,
                rol_principal: row.rol || 'FILL', 
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
         
         await estadisticasModel.createEstadistica(
           id, jugadorId, equipoId,
           {
             rol: row.rol,
             kills, deaths, assists, cs_min: cs, dmg_min: dmg,
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
      estado: 'FINALIZADO' // O 'FINALIZADA', según tu ENUM
    })

    // ======================================================
    // LOGICA DE BRACKET AUTOMÁTICO
    // ======================================================
    try {
        await procesarAvanceBracket(id, ganador_id);
    } catch (bracketError) {
        console.error('Error avanzando bracket:', bracketError);
    }
    // ======================================================

    console.log(`📝 Stats guardadas. Partida ${id} finalizada.`)
    res.json({ success: true, redirect: `/admin/partidas/${id}/cargar?success=Datos guardados` });

  } catch (error) {
    console.error('Error en postCargarStatsManual:', error.message)
    res.status(500).json({ error: 'Error al guardar datos: ' + error.message });
  }
}

/**
 * POST /admin/partidas/:id/import-riot
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
          rol: stat.role || 'UNKNOWN',
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

    // Avance de bracket también en importación Riot
    try { await procesarAvanceBracket(partidaId, ganadorId); } catch (e) { console.error(e); }

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

// ==========================================
// FUNCIONES AUXILIARES (BRACKET)
// ==========================================

async function procesarAvanceBracket(partidaId, ganadorId) {
    try {
        const [rows] = await pool.query(
            'SELECT fase_torneo, posicion_bracket, BIN_TO_UUID(torneo_id) as torneo_id, fecha_partida FROM partidas WHERE id = UUID_TO_BIN(?)', 
            [partidaId]
        );
        const partida = rows[0];

        if (!partida || !partida.posicion_bracket) return;
        
        const siguienteFase = obtenerSiguienteFase(partida.fase_torneo);
        if (!siguienteFase) return; 

        const siguientePosicion = Math.ceil(partida.posicion_bracket / 2);
        const columnaDestino = (partida.posicion_bracket % 2 !== 0) ? 'equipo_azul_id' : 'equipo_rojo_id';

        const [sigRows] = await pool.query(
            'SELECT id FROM partidas WHERE torneo_id = UUID_TO_BIN(?) AND fase_torneo = ? AND posicion_bracket = ?',
            [partida.torneo_id, siguienteFase, siguientePosicion]
        );

        if (sigRows.length > 0) {
            console.log(`🔄 Actualizando partida existente en ${siguienteFase}...`);
            await pool.query(
                `UPDATE partidas SET ${columnaDestino} = UUID_TO_BIN(?) WHERE id = ?`,
                [ganadorId, sigRows[0].id]
            );
        } else {
            console.log(`✨ Creando NUEVA partida en ${siguienteFase}...`);
            const fechaEstimada = new Date(partida.fecha_partida);
            fechaEstimada.setDate(fechaEstimada.getDate() + 7);
            
            // Usamos 'PENDIENTE' para evitar errores de enum
            await pool.query(`
                INSERT INTO partidas (
                    id, torneo_id, fase_torneo, posicion_bracket, estado, fecha_partida, ${columnaDestino}
                ) VALUES (
                    UUID_TO_BIN(UUID()), 
                    UUID_TO_BIN(?), 
                    ?, 
                    ?, 
                    'ACTIVO', 
                    ?, 
                    UUID_TO_BIN(?)
                )`,
                [partida.torneo_id, siguienteFase, siguientePosicion, fechaEstimada, ganadorId]
            );
        }

    } catch (error) {
        console.error("Error en procesarAvanceBracket:", error);
    }
}

function obtenerSiguienteFase(faseActual) {
    const mapa = {
        'Dieciseisavos': 'Octavos',
        'Octavos': 'Cuartos',
        'Cuartos': 'Semifinal',
        'Semifinal': 'Final',
        'Final': null
    };
    return mapa[faseActual] || null;
}