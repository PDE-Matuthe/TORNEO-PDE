-- ============================================
-- INSTRUCCIONES PARA ACTUALIZAR LA BD
-- ============================================
-- Ejecuta estos comandos en tu MySQL para implementar el nuevo sistema

-- 1. AGREGAR CAMPO isAdmin a la tabla usuarios
-- Este campo determina si un usuario puede iniciar sesión como administrador
ALTER TABLE usuarios ADD COLUMN isAdmin TINYINT(1) DEFAULT 0;

-- 2. CREAR UN USUARIO ADMINISTRADOR
-- Reemplaza los valores con tus datos reales
-- Nota: La contraseña debe estar hasheada con bcrypt
-- Puedes generar el hash en tu aplicación Node con: bcrypt.hash('tu_contraseña', 10)

-- Ejemplo (sin hash real - solo para demostración):
INSERT INTO usuarios (id, mail, contrasena, nombre_completo, isAdmin) 
VALUES (
    UUID_TO_BIN(UUID()), 
    'admin@torneolol.com',           -- Cambia este email
    '$2b$10$abcdef1234567890xyz',    -- Cambia esto por el hash real
    'Administrador Torneo',          -- Nombre del admin
    1                                 -- isAdmin = 1 (es administrador)
);

-- 3. PARA CREAR UN ADMIN CON HASH CORRECTO:
-- Usa este script de Node.js en tu terminal:
/*
const bcrypt = require('bcrypt');
const password = 'tu_contraseña_segura';
bcrypt.hash(password, 10).then(hash => {
    console.log('Copia este hash en la query:');
    console.log(hash);
});
*/

-- 4. DESPUÉS DE OBTENER EL HASH, EJECUTA ESTA QUERY:
-- INSERT INTO usuarios (id, mail, contrasena, nombre_completo, isAdmin) 
-- VALUES (UUID_TO_BIN(UUID()), 'admin@torneolol.com', '[HASH_AQUI]', 'Admin Torneo', 1);

-- 5. VERIFICAR QUE EL ADMIN FUE CREADO:
SELECT BIN_TO_UUID(id) AS id, mail, nombre_completo, isAdmin FROM usuarios WHERE isAdmin = 1;

-- 6. CREAR MÚLTIPLES ADMINS (OPCIONAL):
-- Repite el paso 4 para cada administrador que necesites

-- ============================================
-- SEGURIDAD ADICIONAL (OPCIONAL)
-- ============================================

-- Si deseas permitir que solo ciertos emails sean admins, puedes crear una tabla:
CREATE TABLE admin_whitelist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Luego, en tu lógica de login, verifica:
-- SELECT isAdmin FROM usuarios WHERE mail = ? AND isAdmin = 1

-- ============================================
-- QUERIES ÚTILES
-- ============================================

-- Ver todos los admins
SELECT BIN_TO_UUID(id) AS id, mail, nombre_completo FROM usuarios WHERE isAdmin = 1;

-- Hacer admin a un usuario existente
UPDATE usuarios SET isAdmin = 1 WHERE mail = 'usuario@ejemplo.com';

-- Remover permisos de admin
UPDATE usuarios SET isAdmin = 0 WHERE mail = 'usuario@ejemplo.com';

-- Eliminar un admin (pero mantener el registro)
DELETE FROM usuarios WHERE mail = 'admin@torneolol.com' AND isAdmin = 1;

-- ============================================
-- IMPORTANTE
-- ============================================
-- • Usa contraseñas seguras para los admins
-- • No compartas las credenciales de admin
-- • Guarda los emails de admins en un lugar seguro
-- • Considera implementar 2FA en el futuro
