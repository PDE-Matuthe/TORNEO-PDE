// ==========================================
// MIDDLEWARE: Autenticación
// ==========================================

/**
 * Middleware para verificar si el usuario está autenticado
 * Redirige a /login si no lo está
 */
export function isAuthenticated (req, res, next) {
  if (req.session && req.session.usuarioId) {
    return next()
  }
  res.redirect('/login')
}

/**
 * Middleware para verificar si el usuario es admin
 * Redirige a home si no lo es
 */
export function isAdmin (req, res, next) {
  if (req.session && req.session.usuarioId && req.session.isAdmin) {
    return next()
  }
  return res.status(403).render('error', {
    codigo: 403,
    mensaje: 'Acceso denegado: Solo administradores pueden acceder a esta sección'
  })
}

/**
 * Middleware para pasar información del usuario a las vistas
 */
export function userLocals (req, res, next) {
  res.locals.usuario = null
  res.locals.isAdmin = false

  if (req.session && req.session.usuarioId) {
    res.locals.usuario = {
      id: req.session.usuarioId,
      mail: req.session.mail,
      nombre: req.session.nombre
    }
    res.locals.isAdmin = req.session.isAdmin || false
  }

  next()
}
