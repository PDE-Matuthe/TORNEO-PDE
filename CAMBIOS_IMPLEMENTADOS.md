# 🏆 Torneo League of Legends - Cambios Implementados

## Resumen de Cambios

Se ha rediseñado completamente el sistema de acceso y permisos de la aplicación según los siguientes requisitos:

### ✅ Visitantes (Acceso Público - Sin Autenticación)
Los visitantes pueden acceder a las siguientes páginas SIN necesidad de iniciar sesión:

1. **Inicio** (`/`) - Página principal del torneo
2. **Equipos** (`/equipos`) - Lista de todos los equipos participantes (SOLO LECTURA)
3. **Roster de Equipos** (`/equipos/:id/jugadores`) - Ver jugadores de cada equipo (SOLO LECTURA)
4. **Calendario** (`/calendario`) - Ver fechas y resultados de las partidas
5. **MVP** (`/mvp`) - Ranking de jugadores destacados

**No pueden:**
- Crear, editar o eliminar equipos
- Agregar o eliminar jugadores
- Crear o modificar partidas
- Cargar estadísticas

### 🔐 Administradores (Acceso Restringido)
Solo los administradores pueden iniciar sesión. El acceso es restringido a través de un campo `isAdmin` en la base de datos.

**Rutas Admin (Protegidas):**
1. **Gestión de Equipos** (`/admin/equipos`)
   - Ver todos los equipos
   - Crear nuevo equipo (`/admin/equipos/crear`)
   - Editar equipo (`/admin/equipos/editar/:id`)
   - Eliminar equipo (`/admin/equipos/delete/:id`)

2. **Gestión de Jugadores** (`/admin/equipos/:id/jugadores`)
   - Ver roster de un equipo
   - Agregar jugadores
   - Eliminar jugadores

3. **Gestión de Partidas** (`/admin/partidas`)
   - Ver calendario
   - Crear partidas
   - Definir ganadores
   - Eliminar partidas

4. **Cargar Estadísticas** (`/admin/partidas/:partidaId/stats`)
   - Cargar stats de cada jugador por partida

---

## Cambios en la Base de Datos

### ⚠️ IMPORTANTE: Actualizar la tabla `usuarios`

Necesitas agregar el campo `isAdmin` a tu tabla de usuarios:

```sql
ALTER TABLE usuarios ADD COLUMN isAdmin TINYINT(1) DEFAULT 0;
```

Luego, para crear un usuario administrador:

```sql
INSERT INTO usuarios (id, mail, contrasena, nombre_completo, isAdmin) 
VALUES (UUID_TO_BIN(UUID()), 'admin@torneo.com', '<contraseña_hasheada>', 'Admin Torneo', 1);
```

### Eliminado
- Ruta `/register` - Ya NO existe
- Función de auto-registro - Los usuarios NO pueden crear cuentas

---

## Cambios de Navegación

La barra de navegación se ha actualizado:

### Para Visitantes:
- 🏢 Equipos
- 📅 Calendario
- ⭐ Ranking MVP
- 🔐 Admin Login (enlace discreto)

### Para Administradores:
- 🏢 Equipos
- 📅 Calendario
- ⭐ Ranking MVP
- ⚙️ Admin (menú desplegable)
  - Gestionar Equipos
  - Gestionar Partidas
- Cerrar Sesión

---

## Cambios en los Archivos

### Modelos (`src/models/`)
- **users.js**: Agregada función `isUserAdmin()` para verificar permisos

### Controladores (`src/controllers/`)
- **authController.js**: 
  - Removido `renderRegisterPage` y `handleRegister`
  - Modificado `handleLogin` para verificar que el usuario es admin

- **equiposController.js**:
  - Agregadas funciones públicas: `renderEquiposPagePublic()` y `renderRosterPagePublic()`
  - Rutas de admin actualizadas a `/admin/equipos/*`

- **jugadoresController.js**:
  - Rutas de admin actualizadas a `/admin/equipos/:id/jugadores/*`

### Rutas (`src/routes/rutas.js`)
- Separadas rutas públicas de rutas protegidas
- Middleware mejorado para verificar admin
- Rutas re-organizadas bajo `/admin/*`

### Vistas (`src/views/`)
- **login.ejs**: Actualizado con mensaje "Admin Login" y sin opción de registro
- **equipos.ejs**: Ahora es la vista ADMIN (editar/crear/eliminar)
- **equipos-public.ejs**: ✨ NUEVA - Vista pública solo lectura
- **roster.ejs**: Ahora es la vista ADMIN (agregar/eliminar jugadores)
- **roster-public.ejs**: ✨ NUEVA - Vista pública del roster
- **nav.ejs**: Actualizado con menú dinámico según rol (admin o visitante)
- **crear.ejs**: Ruta del formulario actualizada a `/admin/equipos/crear`
- **editar.ejs**: Completamente reescrito para equipos (estaba roto)

---

## Flujos de Acceso

### 👤 Visitante Típico:
1. Accede a `/` (inicio)
2. Ve la lista de equipos en `/equipos`
3. Haz clic en un equipo para ver su roster
4. Navega al calendario y al ranking MVP
5. TODO es de solo lectura

### 🔑 Administrador:
1. Va a `/login`
2. Ingresa credenciales (solo si `isAdmin = 1` en BD)
3. Accede al panel admin (`/admin/equipos`, `/admin/partidas`)
4. Puede crear, editar y eliminar contenido
5. Cierra sesión con el botón "Cerrar Sesión"

---

## ⚠️ Próximos Pasos para Ti

1. **Agregar la columna `isAdmin` a la BD:**
   ```sql
   ALTER TABLE usuarios ADD COLUMN isAdmin TINYINT(1) DEFAULT 0;
   ```

2. **Crear un usuario admin:**
   ```sql
   -- Primero, genera un hash de contraseña en tu app o usa bcrypt
   UPDATE usuarios SET isAdmin = 1 WHERE mail = 'tu_email@admin.com';
   ```

3. **Probar la aplicación:**
   - Accede como visitante (sin login) a `/equipos`
   - Intenta acceder a `/admin/equipos` (debe redirigir a login)
   - Inicia sesión como admin (solo funciona si `isAdmin = 1`)
   - Verifica que puedas gestionar equipos

4. **Opcional:** Crear una página de "Admin Dashboard" en `/admin` para centralizar todo

---

## 🔒 Seguridad

- ✅ Las rutas protegidas verifican `req.session.isAdmin`
- ✅ Los visitantes solo ven vistas de solo lectura
- ✅ No hay opción de auto-registro
- ✅ El login solo funciona para admins

---

## 📝 Notas

- El campo `isAdmin` está en la tabla `usuarios` con valor default 0 (no admin)
- Puedes tener múltiples admins en la misma aplicación
- Las sesiones expiran según tu configuración en `server.js`
