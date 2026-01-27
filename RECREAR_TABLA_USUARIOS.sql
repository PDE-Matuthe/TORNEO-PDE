-- ============================================
-- SCRIPT PARA RECREAR LA TABLA USUARIOS
-- ============================================
-- Este script elimina y recrea la tabla usuarios con la nueva estructura

-- 1. ELIMINAR LA TABLA EXISTENTE (CUIDADO: ESTO BORRA TODOS LOS DATOS)
DROP TABLE IF EXISTS usuarios;

-- 2. CREAR LA TABLA NUEVAMENTE CON LA ESTRUCTURA CORRECTA
CREATE TABLE usuarios (
    id BINARY(16) PRIMARY KEY COMMENT 'ID único en formato UUID',
    mail VARCHAR(255) NOT NULL UNIQUE COMMENT 'Email del usuario',
    contrasena VARCHAR(255) NOT NULL COMMENT 'Contraseña hasheada con bcrypt',
    nombre_completo VARCHAR(255) NOT NULL COMMENT 'Nombre completo del usuario',
    isAdmin TINYINT(1) DEFAULT 0 COMMENT '1 = Es administrador, 0 = No es admin',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de usuarios y administradores';

-- 3. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
CREATE INDEX idx_mail ON usuarios(mail);
CREATE INDEX idx_isAdmin ON usuarios(isAdmin);

-- 4. INSERTAR UN USUARIO ADMIN POR DEFECTO (IMPORTANTE: CAMBIAR LA CONTRASEÑA)
-- Nota: El hash debajo es un ejemplo. Debes:
-- 1. Ejecutar en Node.js: const bcrypt = require('bcrypt'); bcrypt.hash('tu_contraseña', 10).then(h => console.log(h));
-- 2. Copiar el hash y reemplazar en la siguiente query
-- 3. O comentar esta línea y crear admins manualmente después

INSERT INTO usuarios (id, mail, contrasena, nombre_completo, isAdmin) 
VALUES (
    UUID_TO_BIN(UUID()),
    'admin@torneolol.com',
    '$2b$10$abcdefghijklmnopqrstuvwxyz',  -- CAMBIAR ESTE HASH POR UNO REAL
    'Administrador del Torneo',
    1
);

-- 5. VERIFICAR QUE LA TABLA SE CREÓ CORRECTAMENTE
DESCRIBE usuarios;

-- 6. VERIFICAR QUE EL ADMIN SE CREÓ
SELECT BIN_TO_UUID(id) AS id, mail, nombre_completo, isAdmin FROM usuarios WHERE isAdmin = 1;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- • Esto BORRA TODOS los datos existentes
-- • Si tienes datos que conservar, HACES BACKUP PRIMERO
-- • El hash de admin debe ser real (generado con bcrypt)
-- • Cambia el email admin por el tuyo
-- • Después de crear la tabla, reinicia el servidor
-- • Prueba el login con admin@torneolol.com
