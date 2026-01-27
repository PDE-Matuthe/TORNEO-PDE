# Proyecto Node.js con Express y MySQL

## Descripción

Este es un proyecto de gestión de usuarios y tareas desarrollado con Node.js, Express y MySQL. Permite registrar usuarios, iniciar sesión y administrar tareas con diferentes categorías.

---

## Requisitos

- **Node.js** (versión 16 o superior).
- **MySQL** (instancia activa y configurada).

---

## Instalación

1. **Clonar el repositorio**:

2. **Instalar dependencias**:

   ```bash
   npm install
   ```

3. **Configurar la base de datos**:

   - Asegúrate de contar con un servidor de MySQL. Puedes optar por instalar MySQL localmente o usar herramientas como:

     - [DBngin](https://dbngin.com/): Ideal para gestionar bases de datos localmente de manera sencilla.
     - [PlanetScale](https://planetscale.com/): Base de datos escalable en la nube.
     - [Amazon RDS](https://aws.amazon.com/rds/): Servicio gestionado para bases de datos relacionales.

   - Accede a tu servidor MySQL utilizando un cliente de base de datos, como:

     - MySQL Workbench.
     - phpMyAdmin.
     - Línea de comandos de MySQL.

   - Crea una base de datos llamada `tareasDB`:

     ```sql
     CREATE DATABASE tareasDB;
     ```

   - Selecciona la base de datos para trabajar:

     ```sql
     USE tareasDB;
     ```

   - Crea las tablas necesarias ejecutando las siguientes consultas:

     ```sql
     CREATE TABLE `usuarios` (
       `id` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
       `mail` varchar(255) NOT NULL,
       `contrasena` varchar(255) NOT NULL,
       `nombre_completo` varchar(255) NOT NULL,
       PRIMARY KEY (`id`),
       UNIQUE KEY `mail` (`mail`)
     ) 
     CREATE TABLE `tareas` (
       `id` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
       `titulo` varchar(255) NOT NULL,
       `categoria` enum('Trabajo','Personal','Hogar','Estudios','Finanzas','Salud','Entretenimiento','Otros') NOT NULL,
       `descripcion` text,
       `completada` tinyint(1) NOT NULL DEFAULT '0',
       `usuario_id` binary(16) NOT NULL,
       PRIMARY KEY (`id`),
       KEY `usuario_id` (`usuario_id`),
       CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
     ) 
     ```

     Verifica que las tablas se hayan creado correctamente ejecutando:

     ```sql
     SHOW TABLES;
     ```

4. **Actualizar la configuración de la base de datos**: En el archivo `db.js`, verifica que las credenciales de MySQL sean correctas:

   ```javascript
   const pool = mysql.createPool({
     connectionLimit: 10,
     host: 'localhost',
     user: 'root',
     port: 3306,
     password: '', // Agrega tu contraseña si es necesaria
     database: 'tareasDB'
   });
   ```

---

## Uso

1. **Iniciar el servidor**:

   ```bash
   npm run dev
   ```

2. **Abrir en el navegador**:

   - El proyecto estará disponible en [http://localhost:3000](http://localhost:3000).

---

## Funcionalidades

- **Gestor de usuarios**:
  - Registro de usuarios.
  - Inicio de sesión.
  - Cierre de sesión.
- **Gestor de tareas**:
  - Crear tareas.
  - Editar tareas.
  - Eliminar tareas.
  - Filtrar tareas por categoría.

---

¡Gracias por utilizar este proyecto! Si tienes alguna duda o sugerencia, no dudes en compartirla. 😊

