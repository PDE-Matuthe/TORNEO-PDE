-- OPCIÓN SIMPLIFICADA: Solo recrear la tabla sin admin por defecto

DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id BINARY(16) PRIMARY KEY,
    mail VARCHAR(255) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    isAdmin TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear índices para mejor rendimiento
CREATE INDEX idx_mail ON usuarios(mail);
CREATE INDEX idx_isAdmin ON usuarios(isAdmin);

-- Verificar estructura
DESCRIBE usuarios;
