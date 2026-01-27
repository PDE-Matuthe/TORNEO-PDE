# 📊 DIAGRAMA DE FLUJO - Sistema de Permisos

## 🔄 Flujo de Acceso General

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO LLEGA A LA APP                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ¿Logueado?
                    /        \
                 SÍ          NO
                /              \
               │                 │
        ¿Es Admin?          VE VISTAS PÚBLICAS
         /      \                │
       SÍ        NO      ├─ /equipos
       │         │       ├─ /equipos/:id/jugadores
       │      ERROR      ├─ /calendario
       │                 ├─ /mvp
       │                 └─ /
       │
   VE ADMIN
   ├─ /admin
   ├─ /admin/equipos
   ├─ /admin/partidas
   └─ etc...
```

---

## 🏗️ Arquitectura de Rutas

```
localhost:3000/
│
├─ PÚBLICAS (Sin autenticación)
│  ├─ GET  /                    → Inicio
│  ├─ GET  /equipos             → Lista equipos (lectura)
│  ├─ GET  /equipos/:id/jugadores → Roster (lectura)
│  ├─ GET  /calendario          → Calendario
│  ├─ GET  /mvp                 → MVP Ranking
│  └─ GET  /login               → Página login
│
├─ ADMIN (Requiere autenticación + isAdmin=1)
│  ├─ /admin/
│  │  ├─ GET  /                 → Dashboard
│  │  ├─ GET  /equipos          → Gestión equipos (CRUD)
│  │  ├─ GET  /equipos/crear
│  │  ├─ POST /equipos/crear
│  │  ├─ GET  /equipos/editar/:id
│  │  ├─ POST /equipos/editar/:id
│  │  ├─ GET  /equipos/delete/:id
│  │  ├─ GET  /equipos/:id/jugadores → Gestión jugadores
│  │  ├─ POST /equipos/:id/jugadores
│  │  ├─ GET  /equipos/:id/jugadores/delete/:jId
│  │  ├─ GET  /partidas         → Gestión partidas
│  │  ├─ POST /partidas/crear
│  │  ├─ POST /partidas/ganador
│  │  ├─ GET  /partidas/delete/:id
│  │  ├─ GET  /partidas/:pId/stats
│  │  └─ POST /partidas/:pId/stats
│  │
│  └─ GET  /logout              → Cerrar sesión
│
└─ ERROR
   └─ 404 → Página no encontrada
```

---

## 🔐 Flujo de Autenticación

```
┌──────────────────────────────────────────────────────────┐
│ USUARIO ACCEDE A /login                                  │
└────────────────────┬─────────────────────────────────────┘
                     │
        INGRESA EMAIL + PASSWORD
                     │
                     ▼
        ¿USUARIO EXISTE EN BD?
              /            \
            NO              SÍ
           │               │
      ERROR            ¿isAdmin = 1?
   (Usuario no           /      \
    encontrado)        NO        SÍ
                      │          │
                   ERROR     ¿CONTRASEÑA VÁLIDA?
              (No es admin)   /      \
                            NO       SÍ
                           │         │
                        ERROR   ✅ ÉXITO
                   (Creds      │
                    inválidas) CREATE SESSION
                              req.session.usuarioId = id
                              req.session.isAdmin = true
                              │
                              ▼
                        REDIRECT TO /admin
```

---

## 👥 Matriz de Permisos

| Acción | Visitante | Admin |
|--------|:---------:|:-----:|
| Ver equipos | ✅ | ✅ |
| Ver roster | ✅ | ✅ |
| Ver calendario | ✅ | ✅ |
| Ver MVP | ✅ | ✅ |
| Crear equipo | ❌ | ✅ |
| Editar equipo | ❌ | ✅ |
| Eliminar equipo | ❌ | ✅ |
| Agregar jugador | ❌ | ✅ |
| Eliminar jugador | ❌ | ✅ |
| Crear partida | ❌ | ✅ |
| Editar partida | ❌ | ✅ |
| Cargar stats | ❌ | ✅ |

---

## 📱 Experiencia de Navegación

### Visitante
```
Inicio (/home)
   ↓
Haz clic "🏢 Equipos"
   ↓
Ve lista de equipos (sin botones edit/delete)
   ↓
Haz clic en un equipo
   ↓
Ve roster (sin botones agregar/eliminar)
   ↓
Vuelve al inicio o va a Calendario/MVP
```

### Administrador
```
Inicio (/home)
   ↓
Haz clic "🔐 Admin Login"
   ↓
Ingresa credenciales
   ↓
Entra a /admin (Dashboard)
   ↓
Haz clic "Gestionar Equipos"
   ↓
Ve lista con botones edit/delete/crear
   ↓
Puede crear/editar/eliminar equipos
   ↓
Puede agregar/eliminar jugadores por equipo
   ↓
Haz clic "Gestionar Partidas"
   ↓
Puede crear/editar partidas y cargar stats
   ↓
Haz clic "Cerrar Sesión" para logout
```

---

## 🗄️ Estructura Base de Datos (Actualizada)

```sql
usuarios
├─ id (UUID)
├─ mail (STRING, UNIQUE)
├─ contrasena (STRING, HASHED)
├─ nombre_completo (STRING)
└─ isAdmin (TINYINT) ← NUEVO CAMPO
```

### Valores isAdmin:
- `0` = Usuario regular (visitante)
- `1` = Administrador

---

## 🔗 Relaciones de Datos

```
usuarios (isAdmin=1)
    │
    ├─ crea ──→ equipos
    │               │
    │               ├─ tiene ──→ jugadores
    │               │
    │               └─ juega ──→ partidas
    │
    ├─ crea ──→ partidas
    │               │
    │               └─ tiene ──→ stats
    │
    └─ carga ──→ stats
```

---

## 📋 Middleware Stack

```
Solicitud HTTP
    ↓
router.use() → Calcula isAuthenticated y isAdmin
    ↓
¿Ruta protegida (/admin/*)?
    /                         \
   SÍ                          NO
   │                           │
isAuthenticated() middleware   Continúa
   /           \
 Sí            No
 │             │
Continúa   Redirect /login
│
Procesea
```

---

## 🎯 Estados de Sesión

```
┌──────────────────────────────────────────────┐
│ SIN SESIÓN (Visitante)                       │
├──────────────────────────────────────────────┤
│ req.session.usuarioId = undefined            │
│ req.session.isAdmin = undefined              │
│ res.locals.isAuthenticated = false           │
│ res.locals.isAdmin = false                   │
│ Puede ver: vistas públicas                   │
│ No puede: acceder a /admin                   │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ CON SESIÓN ADMIN                             │
├──────────────────────────────────────────────┤
│ req.session.usuarioId = "abc-123..."         │
│ req.session.isAdmin = true                   │
│ res.locals.isAuthenticated = true            │
│ res.locals.isAdmin = true                    │
│ Puede ver: todas las vistas                  │
│ Puede editar: todo                           │
└──────────────────────────────────────────────┘
```

---

## 🔍 Verificación de Acceso

```javascript
// MIDDLEWARE PROTEGIDO
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.usuarioId && req.session.isAdmin) {
    // ✅ Usuario logueado como admin
    next()
  } else {
    // ❌ No logueado o no es admin
    req.session.redirectTo = req.originalUrl
    res.redirect('/login')
  }
}
```

---

## 📊 Estadísticas del Sistema

- **Rutas Públicas:** 5
- **Rutas Admin:** 13+
- **Vistas Públicas:** 3 nuevas
- **Vistas Admin:** 8+
- **Campos BD Nuevos:** 1 (isAdmin)
- **Archivos Modificados:** 11
- **Archivos Nuevos:** 4

---

## 🚀 Flujo de Implementación

```
1. Ejecutar SQL migration
   ↓
2. Crear usuario admin
   ↓
3. Reiniciar servidor
   ↓
4. Login como admin
   ↓
5. Acceder a /admin
   ↓
6. Gestionar equipos/partidas
   ↓
7. ✅ Sistema funcionando
```

---

## 📝 Notas Importantes

- Las sesiones se almacenan en memoria (desarrollo)
- En producción, usar redis o database sessions
- isAdmin es verificado en CADA request
- No hay caché, cambios se ven inmediatamente
- Logout destruye la sesión completamente

