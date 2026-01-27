# ✅ GUÍA DE PRUEBAS - Nuevo Sistema de Permisos

## 🚀 Antes de Empezar

1. **Ejecuta la migración de BD:**
   ```sql
   ALTER TABLE usuarios ADD COLUMN isAdmin TINYINT(1) DEFAULT 0;
   ```

2. **Crea un usuario admin** (ver SETUP_BASE_DATOS.sql)

3. **Reinicia el servidor:**
   ```bash
   npm run dev
   ```

---

## 📋 Checklist de Pruebas

### Parte 1: Acceso Público (Sin Login)
- [ ] Accedo a `http://localhost:3000` - Veo la página de inicio
- [ ] Hago clic en "🏢 Equipos" - Veo la lista de equipos (SIN botones de editar/eliminar)
- [ ] Hago clic en un equipo - Veo el roster (SIN botones de agregar/eliminar jugadores)
- [ ] Hago clic en "📅 Calendario" - Veo el calendario (SIN opciones de crear partidas)
- [ ] Hago clic en "⭐ Ranking MVP" - Veo el ranking (SIN opciones de editar)
- [ ] En la nav veo el botón "🔐 Admin Login" (NO veo "Registrarse")

### Parte 2: Intento de Acceso Admin sin Login
- [ ] Voy a `http://localhost:3000/admin` - Me redirige a `/login`
- [ ] Voy a `http://localhost:3000/admin/equipos` - Me redirige a `/login`
- [ ] Voy a `http://localhost:3000/admin/partidas` - Me redirige a `/login`

### Parte 3: Login Admin (Usuario NO Admin)
- [ ] Si tengo un usuario SIN isAdmin=1:
  - [ ] Intento iniciar sesión
  - [ ] Veo el error: "Acceso denegado. Solo administradores pueden iniciar sesión."
  - [ ] NO me deja entrar

### Parte 4: Login Admin (Usuario Admin)
- [ ] Hago clic en "🔐 Admin Login"
- [ ] Ingreso credenciales de admin (email + contraseña)
- [ ] Se inicia sesión correctamente
- [ ] Me redirige a `/admin` (Dashboard)

### Parte 5: Dashboard Admin
- [ ] Veo el "Panel de Administración"
- [ ] Veo dos opciones principales:
  - [ ] "Gestión de Equipos"
  - [ ] "Gestión de Partidas"
- [ ] Veo la sección "Vistas Públicas" con enlaces a equipos, calendario, MVP
- [ ] En la nav ahora veo "⚙️ Admin" con opciones desplegables

### Parte 6: Admin - Gestión de Equipos
- [ ] Hago clic en "Ir a Equipos" o en "Admin → Gestionar Equipos"
- [ ] Veo el panel `/admin/equipos` con lista de equipos
- [ ] Veo el botón "+ Nuevo Equipo"
- [ ] Veo botones "Gestionar Roster", "Editar", "Eliminar" en cada equipo
- [ ] Creo un nuevo equipo (test):
  - [ ] Nombre: "Team Test"
  - [ ] Región: "LAN"
  - [ ] Logo URL: (opcional)
  - [ ] Se crea correctamente
  - [ ] Aparece en la lista

### Parte 7: Admin - Gestión de Jugadores (Roster)
- [ ] Hago clic en "Gestionar Roster" en un equipo
- [ ] Veo el formulario para agregar jugadores
- [ ] Agrego un jugador test:
  - [ ] Riot ID: "Faker#KR1"
  - [ ] Rol: "TITULAR"
  - [ ] Posición: "MID"
  - [ ] Rango: "Challenger"
  - [ ] Se agrega correctamente
- [ ] Veo el jugador en la tabla
- [ ] Veo el botón de eliminar (basura) para cada jugador
- [ ] Intento eliminar el jugador test
  - [ ] Se pide confirmación
  - [ ] Se elimina correctamente

### Parte 8: Admin - Editar Equipo
- [ ] Desde `/admin/equipos`, hago clic en "Editar"
- [ ] Se abre el formulario de edición
- [ ] Cambio el nombre a "Team Test EDITADO"
- [ ] Cambio la región a "EUW"
- [ ] Hago clic en "Guardar Cambios"
- [ ] Vuelvo a `/admin/equipos`
- [ ] Verifico que los cambios se guardaron

### Parte 9: Admin - Eliminar Equipo
- [ ] Desde `/admin/equipos`, hago clic en "Eliminar" en "Team Test EDITADO"
- [ ] Se pide confirmación
- [ ] El equipo se elimina
- [ ] Ya no aparece en la lista

### Parte 10: Admin - Gestión de Partidas
- [ ] Hago clic en "Ir a Partidas" o en "Admin → Gestionar Partidas"
- [ ] Veo el panel `/admin/partidas`
- [ ] Veo opciones para crear partidas, definir ganadores, etc.
- [ ] (Las pruebas específicas dependen de tu implementación actual)

### Parte 11: Logout
- [ ] Desde cualquier página admin, hago clic en "Cerrar Sesión"
- [ ] Me redirige a `/`
- [ ] Ya no veo la nav con opciones admin
- [ ] Vuelvo a ver "🔐 Admin Login" (NO veo "Registrarse")
- [ ] Intento acceder a `/admin` - Me redirige a `/login`

---

## 🔍 Verificaciones de Seguridad

- [ ] No puedo acceder a `/admin/*` sin estar logueado
- [ ] No puedo usar POST requests a `/admin/*` sin estar logueado
- [ ] Un usuario NO-admin no puede iniciar sesión (solo muestra error)
- [ ] Los botones de edición/eliminación NO aparecen en vistas públicas
- [ ] Los formularios admin NO existen en URLs públicas

---

## 🐛 Solución de Problemas

### Problema: Login funciona pero no me deja entrar
**Solución:** Verifica que el usuario tenga `isAdmin = 1`:
```sql
SELECT * FROM usuarios WHERE mail = 'tu_email@admin.com';
```

### Problema: Veo "Acceso denegado" al intentar login
**Solución:** El usuario probablemente tiene `isAdmin = 0`. Actualiza:
```sql
UPDATE usuarios SET isAdmin = 1 WHERE mail = 'tu_email@admin.com';
```

### Problema: Hay una ruta que no redirige correctamente
**Solución:** Reinicia el servidor:
```bash
# Termina el proceso actual (Ctrl+C)
npm run dev
```

### Problema: Veo formularios de edición donde no debería
**Solución:** Verifica que estés accediendo a URLs `/admin/*` y no a `/equipos/*`

---

## ✨ Pruebas Adicionales (Bonus)

- [ ] Creo 2 admins y verifico que ambos pueden iniciar sesión
- [ ] Cambio un admin a no-admin y verifico que no puede entrar
- [ ] Pruebo en navegadores diferentes (Chrome, Firefox, Edge)
- [ ] Pruebo desde dispositivos móviles (responsive design)

---

## 📊 Resultado Final

Si todas las pruebas pasaron ✅, el sistema está listo para usar:
- ✅ Visitantes ven solo lectura
- ✅ Admins pueden gestionar todo
- ✅ Sin auto-registro
- ✅ Acceso restringido a admin

**¡Felicidades! Tu torneo está seguro y funcional.** 🎉
