import { getAllPartidas, createPartida, deletePartida, setGanador } from '../models/partidas.js'
import { getEquiposByUsuarioId } from '../models/equipos.js'
// Nota: Usamos getEquiposByUsuarioId para llenar el select del formulario, 
// pero en un torneo real quizás quieras una función 'getAllEquipos' global.

// --- VISTA PÚBLICA ---
export const renderCalendario = async (req, res) => {
  const partidas = await getAllPartidas()
  res.render('calendario', { 
    title: 'Calendario de Partidas', 
    partidas 
  })
}

// --- VISTAS DE ADMIN (Protegidas) ---

// Mostrar formulario para crear partida
export const renderAdminPartidas = async (req, res) => {
  // Necesitamos la lista de equipos para que el admin elija quienes juegan
  const usuarioId = req.session.usuarioId
  const equipos = await getEquiposByUsuarioId(usuarioId)
  
  res.render('admin-partidas', { 
    title: 'Administrar Partidas', 
    equipos 
  })
}

// Procesar la creación de partida
export const createMatch = async (req, res) => {
  const { equipo_azul, equipo_rojo, fecha, hora, fase } = req.body
  
  // Combinamos fecha y hora en un formato DATETIME de SQL
  const fechaFinal = `${fecha} ${hora}:00`

  try {
    await createPartida(equipo_azul, equipo_rojo, fechaFinal, fase)
    res.redirect('/calendario') // Lo mandamos al calendario público para que vea que se creó
  } catch (error) {
    console.error(error)
    res.status(500).send('Error al crear partida')
  }
}

// Definir Ganador
export const updateWinner = async (req, res) => {
  const { partidaId, ganadorId } = req.body
  try {
    await setGanador(partidaId, ganadorId)
    res.redirect('/calendario')
  } catch (error) {
    console.error(error)
    res.status(500).send('Error al definir ganador')
  }
}

// Borrar Partida
export const deleteMatch = async (req, res) => {
  const { id } = req.params
  await deletePartida(id)
  res.redirect('/calendario')
}