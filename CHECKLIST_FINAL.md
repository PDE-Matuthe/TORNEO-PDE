# ✅ CHECKLIST FINAL DE IMPLEMENTACIÓN

## 1️⃣ Preparación (Antes de empezar)

- [ ] Tengo backup de mi base de datos
- [ ] Tengo backup de mi código
- [ ] El servidor está apagado
- [ ] Estoy en la rama main/master de git (si usas git)

---

## 2️⃣ Base de Datos (SQL)

### Ejecutar migración:
```sql
ALTER TABLE usuarios ADD COLUMN isAdmin TINYINT(1) DEFAULT 0;
```

- [ ] Ejecuté la query SQL
- [ ] Verifiqué que la columna existe: `DESC usuarios;`
- [ ] No hay errores de sintaxis

### Crear primer admin:

Opción A - Generar hash en Node.js:
```javascript
// En tu terminal Node.js o app
const bcrypt = require('bcrypt');
bcrypt.hash('tu_contraseña_segura_aqui', 10).then(hash => {
  console.log('COPIA ESTE HASH:');
  console.log(hash);
});
```

Opción B - Usar hash de ejemplo:
```sql
-- Reemplaza [HASH_AQUI] con el hash que obtuviste arriba
INSERT INTO usuarios (id, mail, contrasena, nombre_completo, isAdmin) 
VALUES (UUID_TO_BIN(UUID()), 'admin@torneolol.com', '[HASH_AQUI]', 'Admin Torneo', 1);
```

- [ ] Copié un hash válido
- [ ] Reemplacé el email con el mío
- [ ] Ejecuté la query INSERT
- [ ] Verifiqué: `SELECT * FROM usuarios WHERE isAdmin = 1;`
- [ ] Veo mi usuario con isAdmin = 1

---

## 3️⃣ Código (JavaScript/Node.js)

### Verificar archivos modificados:

- [ ] `src/models/users.js` - Tiene función `isUserAdmin()`
- [ ] `src/controllers/authController.js` - Sin registro, con verificación admin
- [ ] `src/controllers/equiposController.js` - Tiene funciones públicas
- [ ] `src/routes/rutas.js` - Rutas reorganizadas con `/admin`
- [ ] `src/views/partials/nav.ejs` - Menú actualizado

### Verificar nuevas vistas:

- [ ] `src/views/equipos-public.ejs` - NUEVA
- [ ] `src/views/roster-public.ejs` - NUEVA
- [ ] `src/views/admin-dashboard.ejs` - NUEVA

### Verificar vistas actualizadas:

- [ ] `src/views/login.ejs` - Sin opción de registro
- [ ] `src/views/editar.ejs` - Reescrito para equipos
- [ ] `src/views/crear.ejs` - Ruta actualizada
- [ ] `src/views/equipos.ejs` - Rutas admin
- [ ] `src/views/roster.ejs` - Rutas admin

---

## 4️⃣ Verificación de Código

### Sintaxis JavaScript:

```bash
# Si usas linter (como eslint), corre:
npm run lint
# O manualmente revisa que no hay errores rojos

# Si usas VSCode, busca errores en la sección "Problems"
```

- [ ] No hay errores de sintaxis
- [ ] No hay warnings importantes

### Imports/Exports:

- [ ] Todos los imports existen
- [ ] Todos los exports están definidos
- [ ] No hay imports circulares

---

## 5️⃣ Configuración de Entorno

### Variables de entorno (si aplica):

- [ ] `.env` tiene todas las variables necesarias
- [ ] `DB_HOST` = localhost
- [ ] `DB_USER` = root
- [ ] `DB_PASSWORD` = (tu contraseña)
- [ ] `DB_NAME` = torneodb

### Si no tienes `.env`, crea uno:

```bash
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=torneodb
PORT=3000
NODE_ENV=development
EOF
```

- [ ] Creé `.env` o verifiqué que existe
- [ ] Actualicé con mis credenciales

---

## 6️⃣ Instalación de Dependencias

```bash
# Verifica que todas las dependencias estén instaladas
npm install

# Verifica que bcrypt está instalado (lo necesita para hashing)
npm list bcrypt
```

- [ ] Ejecuté `npm install`
- [ ] `bcrypt` está instalado
- [ ] No hay advertencias de seguridad críticas

---

## 7️⃣ Iniciar Servidor

```bash
# En una terminal nueva
npm run dev
```

- [ ] El servidor inicia sin errores
- [ ] Veo "Server is running on http://localhost:3000"
- [ ] No hay errores de conexión a BD
- [ ] No hay errores de módulos faltantes

---

## 8️⃣ Pruebas Rápidas (Manuales)

### Acceso Público (Sin login):

```
✓ http://localhost:3000 → Funciona
✓ http://localhost:3000/equipos → Funciona (sin edit/delete)
✓ http://localhost:3000/calendario → Funciona
✓ http://localhost:3000/mvp → Funciona
```

- [ ] Todas las rutas públicas funcionan
- [ ] No veo botones de edición en páginas públicas
- [ ] Veo "🔐 Admin Login" en la nav

### Login:

```
✓ http://localhost:3000/login → Carga
✓ Intento con credenciales INCORRECTAS → Error
✓ Intento con credenciales CORRECTAS → Entra a /admin
```

- [ ] Página de login carga
- [ ] Rechaza credenciales incorrectas
- [ ] Acepta credenciales correctas
- [ ] Redirige a `/admin`

### Admin (Con login):

```
✓ http://localhost:3000/admin → Carga dashboard
✓ http://localhost:3000/admin/equipos → Carga gestión
✓ Veo "⚙️ Admin" en la nav
✓ Veo botón "Cerrar Sesión"
```

- [ ] Dashboard admin funciona
- [ ] Gestión de equipos funciona
- [ ] Puedo crear equipo
- [ ] Puedo editar equipo
- [ ] Puedo eliminar equipo
- [ ] Puedo agregar jugador
- [ ] Puedo eliminar jugador
- [ ] Logout funciona

### Seguridad:

```
✓ Salgo del navegador (logout)
✓ Vuelvo a http://localhost:3000/admin → Me redirige a login
✓ En otro navegador (sin login) voy a /admin → Me redirige a login
```

- [ ] Las rutas admin requieren autenticación
- [ ] No hay acceso sin login
- [ ] Logout limpia la sesión

---

## 9️⃣ Pruebas Extensas (Según GUIA_PRUEBAS.md)

Si pasaste todas las pruebas rápidas:

- [ ] Ejecuté el checklist completo en `GUIA_PRUEBAS.md`
- [ ] Todas las pruebas pasaron ✅

---

## 🔟 Documentación

### Archivos creados:

- [ ] `CAMBIOS_IMPLEMENTADOS.md` - Detalles de cambios
- [ ] `SETUP_BASE_DATOS.sql` - Instrucciones SQL
- [ ] `GUIA_PRUEBAS.md` - Checklist de pruebas
- [ ] `DIAGRAMA_FLUJO.md` - Diagramas del sistema
- [ ] `FAQ.md` - Preguntas frecuentes
- [ ] `README_CAMBIOS.md` - Resumen ejecutivo

### Documentos originales:

- [ ] `README.md` - Original (intacto)
- [ ] `package.json` - Original (intacto)

---

## 1️⃣1️⃣ Limpieza (Opcional)

```bash
# Opcional: Limpiar archivos no usados
# rm src/views/register.ejs  # No se usa más

# Opcional: Crear commit en git
git add .
git commit -m "Implementar sistema de permisos (admin + visitantes)"
```

- [ ] Decidí si mantener o eliminar `register.ejs`
- [ ] Si uso git, hice commit de cambios

---

## 1️⃣2️⃣ Producción (Cuando lances a producción)

- [ ] Cambié `secure: false` a `secure: true` en session cookie (si usas HTTPS)
- [ ] Cambié `express-session` a usar Redis o DB (no memory)
- [ ] Configuré HTTPS/SSL
- [ ] Guardé credenciales de admin en lugar SEGURO (no en código)
- [ ] Hice backup de BD
- [ ] Hice test de recuperación ante fallos
- [ ] Configuré logging y monitoreo

---

## 📊 Resumen de Cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| Auto-registro | ✅ Habilitado | ❌ Deshabilitado |
| Login público | ✅ Abierto | 🔐 Solo admins |
| Roles | ❌ No | ✅ Visitante + Admin |
| Vistas públicas | ⚠️ Limitadas | ✅ Completas (5) |
| Admin panel | ❌ No | ✅ Sí (/admin) |
| Permisos | ❌ No | ✅ Sí |

---

## 🎯 Status Final

Cuando completes TODO el checklist ✅:

- ✅ Base de datos actualizada
- ✅ Código deployado
- ✅ Primerseguridad implementada
- ✅ Pruebas pasadas
- ✅ Documentación completa
- ✅ Listo para producción

---

## 🆘 Si algo falla

### Problema durante SQL:
- Revisa `SETUP_BASE_DATOS.sql`
- Verifica sintaxis de query
- Comprueba permisos de BD

### Problema durante código:
- Revisa `CAMBIOS_IMPLEMENTADOS.md`
- Busca el archivo específico
- Verifica imports/exports

### Problema durante pruebas:
- Revisa `GUIA_PRUEBAS.md`
- Reinicia servidor
- Limpia caché del navegador

### Problema de login:
- Revisa `FAQ.md`
- Verifica que `isAdmin = 1`
- Verifica hash de contraseña

---

## ✨ ¡Listo!

Si pasaste TODO este checklist, tu sistema de permisos está implementado correctamente.

**Próximo paso:** Invita a tus usuarios a ver el torneo público y a los admins a gestionar desde `/admin`.

---

**Checklist versión:** 2.0
**Fecha:** Enero 2026
**Status:** ✅ COMPLETO
