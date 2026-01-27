# ❓ PREGUNTAS FRECUENTES (FAQ)

## 🔐 Autenticación y Permisos

### P: ¿Cómo creo un usuario administrador?

**R:** Necesitas ejecutar esta query SQL después de obtener el hash de contraseña:

```sql
-- Primero, genera el hash en Node.js:
-- const hash = await bcrypt.hash('tu_contraseña', 10);

INSERT INTO usuarios (id, mail, contrasena, nombre_completo, isAdmin) 
VALUES (UUID_TO_BIN(UUID()), 'admin@email.com', 'HASH_AQUI', 'Admin', 1);
```

O desde la app (en Node.js):
```javascript
const bcrypt = require('bcrypt');
const password = 'tu_contraseña_segura';
bcrypt.hash(password, 10).then(hash => {
  console.log('INSERT INTO usuarios (id, mail, contrasena, nombre_completo, isAdmin)');
  console.log(`VALUES (UUID_TO_BIN(UUID()), 'admin@email.com', '${hash}', 'Admin', 1);`);
});
```

### P: ¿Qué pasa si olvido la contraseña del admin?

**R:** Tienes dos opciones:

**Opción 1 - Generar nueva contraseña:**
```sql
-- Genera un nuevo hash y actualiza
UPDATE usuarios SET contrasena = 'NUEVO_HASH' WHERE mail = 'admin@email.com';
```

**Opción 2 - Crear otro admin temporal:**
```sql
INSERT INTO usuarios (id, mail, contrasena, nombre_completo, isAdmin) 
VALUES (UUID_TO_BIN(UUID()), 'admin2@email.com', 'HASH_TEMP', 'Admin Temp', 1);

-- Luego elimina después de cambiar contraseña:
DELETE FROM usuarios WHERE mail = 'admin2@email.com';
```

### P: ¿Puedo tener múltiples administradores?

**R:** Sí, absolutamente. Inserta múltiples usuarios con `isAdmin = 1`:
```sql
INSERT INTO usuarios (id, mail, contrasena, nombre_completo, isAdmin) VALUES (..., 1);
INSERT INTO usuarios (id, mail, contrasena, nombre_completo, isAdmin) VALUES (..., 1);
INSERT INTO usuarios (id, mail, contrasena, nombre_completo, isAdmin) VALUES (..., 1);
```

Verifica quiénes son admins:
```sql
SELECT mail, nombre_completo FROM usuarios WHERE isAdmin = 1;
```

### P: ¿Cómo quito permisos de admin a un usuario?

**R:** Cambia el valor de `isAdmin` a 0:
```sql
UPDATE usuarios SET isAdmin = 0 WHERE mail = 'admin@email.com';
```

Ese usuario ya no podrá iniciar sesión en el panel admin.

---

## 🌐 Públicas vs Admin

### P: ¿Qué pueden ver los visitantes (sin login)?

**R:** Pueden ver (solo lectura):
- ✅ Inicio
- ✅ Lista de equipos
- ✅ Roster de cada equipo (jugadores)
- ✅ Calendario de partidas
- ✅ Ranking MVP

**NO pueden ver:**
- ❌ Formularios de edición
- ❌ Botones de crear/editar/eliminar
- ❌ Panel admin

### P: ¿Qué pueden hacer los administradores?

**R:** Los admins pueden:
- ✅ Crear equipos
- ✅ Editar equipos
- ✅ Eliminar equipos
- ✅ Agregar jugadores a equipos
- ✅ Eliminar jugadores
- ✅ Crear partidas
- ✅ Definir ganadores
- ✅ Cargar estadísticas

### P: ¿Dónde está el botón para auto-registrarse?

**R:** No existe. El auto-registro fue completamente removido. Solo los admins pueden iniciar sesión, y deben ser creados manualmente en la BD con `isAdmin = 1`.

---

## 🔧 Rutas y URLs

### P: ¿Cuál es la URL del login?

**R:** `http://localhost:3000/login`

### P: ¿Cuál es la URL del panel admin?

**R:** `http://localhost:3000/admin` (si estás logueado como admin)

### P: ¿Qué URLs son públicas?

**R:** Estas URLs NO requieren login:
- `/` - Inicio
- `/equipos` - Lista de equipos
- `/equipos/:id/jugadores` - Roster
- `/calendario` - Calendario
- `/mvp` - MVP ranking
- `/login` - Página de login

### P: ¿Qué URLs requieren admin?

**R:** Todas las URLs bajo `/admin/*`:
- `/admin`
- `/admin/equipos`
- `/admin/equipos/crear`
- `/admin/partidas`
- etc.

Si intentas acceder sin estar logueado como admin, se redirige a `/login`.

### P: ¿Qué pasa si voy a `/admin/equipos` sin estar logueado?

**R:** Te redirige automáticamente a `/login`.

### P: ¿Puedo acceder a las vistas de edición desde la URL directamente?

**R:** No. Las vistas de edición (formularios) solo existen en URLs de admin (`/admin/equipos/editar/:id`). Las URLs públicas (`/equipos/:id`) no tienen formularios.

---

## 🐛 Solución de Problemas

### P: Intento iniciar sesión pero dice "Acceso denegado"

**R:** Significa que el usuario existe pero `isAdmin = 0`. Soluciones:

1. **Verifica el usuario:**
```sql
SELECT mail, isAdmin FROM usuarios WHERE mail = 'tu_email@admin.com';
```

2. **Si isAdmin = 0, actualiza:**
```sql
UPDATE usuarios SET isAdmin = 1 WHERE mail = 'tu_email@admin.com';
```

3. **Reinicia el servidor y vuelve a intentar**

### P: El email existe pero la contraseña no funciona

**R:** La contraseña está hasheada. No puedes verla. Opciones:

1. **Genera un nuevo hash:**
```javascript
const bcrypt = require('bcrypt');
bcrypt.hash('nueva_contraseña', 10).then(hash => console.log(hash));
```

2. **Actualiza en la BD:**
```sql
UPDATE usuarios SET contrasena = 'NUEVO_HASH' WHERE mail = 'admin@email.com';
```

3. **Intenta login de nuevo**

### P: No veo el botón "Admin Login" en la nav

**R:** Probablemente estás logueado. Haz logout:
- Haz clic en "Cerrar Sesión" (si estás en admin)
- O ejecuta: `http://localhost:3000/logout`

Después recarga la página y debería aparecer "🔐 Admin Login".

### P: Veo formularios de edición en la página pública

**R:** No debería pasar. Comprueba:
1. ¿Estás en `/equipos` (público) o `/admin/equipos` (admin)?
2. Si estás en público y ves formularios, recarga la página (caché)
3. Limpia el caché del navegador (Ctrl+Shift+Del)

### P: Agregué un equipo pero no aparece en la lista pública

**R:** Probablemente estés en `/admin/equipos`. Ve a `/equipos` para ver la lista pública.

---

## 📊 Base de Datos

### P: ¿Qué campo nuevos agregué a usuarios?

**R:** Un solo campo:
```sql
isAdmin TINYINT(1) DEFAULT 0
```

Valores:
- `0` = No es admin (visitante)
- `1` = Es admin

### P: ¿Dónde veo si estoy logueado como admin?

**R:** Comprueba:
1. **En la BD:**
```sql
SELECT mail, isAdmin FROM usuarios WHERE isAdmin = 1;
```

2. **En la app:** Intenta acceder a `/admin`. Si te redirige a login, no estás logueado como admin.

3. **En la nav:** Si ves "⚙️ Admin" en el menú, estás logueado como admin.

### P: ¿Qué pasa si borro un admin de la BD?

**R:** Ese usuario ya no podrá iniciar sesión. Si borro todos los admins, nadie podrá entrar al panel. Por eso siempre es bueno tener al menos 2 admins.

---

## 🔒 Seguridad

### P: ¿Es seguro tener múltiples admins?

**R:** Sí, pero considera:
- Cada admin tiene acceso a TODO
- No hay forma de limitar qué puede hacer cada admin
- En el futuro, puedes agregar "roles" (editor, moderador, etc.)

### P: ¿Las contraseñas se guardan en texto plano?

**R:** No. Se guardan hasheadas con bcrypt (algoritmo de 10 rondas). Incluso tú no puedes ver la contraseña original.

### P: ¿Qué pasa si alguien roba las credenciales del admin?

**R:** Pueden entrar al panel y modificar TODO. Protecciones:
- Usa contraseñas fuertes (14+ caracteres)
- Usa HTTPS en producción
- Considera 2FA en el futuro
- Revisa logs de quién hizo qué cambios

### P: ¿Cómo protejo mejor el login?

**R:** Ideas para mejorar:
1. **Rate limiting** - Limita intentos de login
2. **HTTPS** - Encripta la conexión
3. **2FA** - Autenticación de dos factores (email, SMS, Google Authenticator)
4. **CAPTCHA** - Evita bots
5. **Auditoría** - Registra quién hizo qué y cuándo

---

## 🚀 Deployment

### P: ¿Cómo pongo esto en producción?

**R:** Checklist:
- [ ] Actualizar BD (agregar isAdmin)
- [ ] Crear admin en producción
- [ ] Cambiar `express-session` a usar Redis o DB (no memory)
- [ ] Configurar HTTPS
- [ ] Usar variables de entorno para secrets
- [ ] Probar thoroughly
- [ ] Hacer backup de BD
- [ ] Documentar contraseñas en lugar seguro

### P: ¿Funciona en Heroku/AWS/Azure?

**R:** Sí, pero necesitas:
- Express session debe usar una store persistente (Redis, MongoDB, etc.)
- Actualizar las credenciales de BD
- Configurar variables de entorno
- HTTPS debe estar habilitado

### P: ¿Puedo hacer backup del sistema?

**R:** Sí:
```bash
# Exportar BD
mysqldump -u root torneodb > backup.sql

# Exportar código
git commit -m "Backup before changes"

# Exportar todo
zip -r torneo_backup.zip .
```

---

## 📚 Recursos

### Archivos importantes:
- `CAMBIOS_IMPLEMENTADOS.md` - Detalles técnicos
- `SETUP_BASE_DATOS.sql` - Instrucciones SQL
- `GUIA_PRUEBAS.md` - Checklist de pruebas
- `DIAGRAMA_FLUJO.md` - Visualización del sistema
- `src/controllers/authController.js` - Lógica de auth
- `src/routes/rutas.js` - Todas las rutas

### Comandos útiles:
```bash
# Iniciar servidor
npm run dev

# Ver logs
tail -f logs/app.log

# Reset DB (cuidado!)
mysql -u root < SETUP_BASE_DATOS.sql
```

---

## 💬 Más Preguntas?

Si tienes una pregunta que no está aquí:

1. Revisa el archivo `CAMBIOS_IMPLEMENTADOS.md`
2. Mira `DIAGRAMA_FLUJO.md` para entender el flujo
3. Prueba según `GUIA_PRUEBAS.md`
4. Revisa el código en `src/`

---

**Última actualización:** Enero 2026
