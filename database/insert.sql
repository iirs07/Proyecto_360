-- Borrar registros
DELETE FROM invitaciones;
DELETE FROM usuario;
DELETE FROM c_usuario;
DELETE FROM c_departamento;
DELETE FROM c_areas;

-- Insertar áreas, departamentos y usuarios
INSERT INTO c_areas (nombre, created_at, updated_at)
VALUES ('TI', NOW(), NOW());

INSERT INTO c_departamento (d_nombre, area_id, created_at, updated_at)
VALUES ('Sistemas', 1, NOW(), NOW());

INSERT INTO c_usuario (id_departamento, u_nombre, a_paterno, a_materno, telefono, created_at, updated_at)
VALUES (1, 'Sofia', 'Romay', 'Hernandez', '2281234567', NOW(), NOW());

INSERT INTO usuario (id_usuario_login, rol, correo, contrasena, created_at, updated_at)
VALUES (1, 'Jefe', 'sofiahromay@gmail.com', '$2y$12$1jGasv5F9cZQIJmVmekVjeS72nVFeHXKI660/8NJFsKgS6MvsvMzK', NOW(), NOW());

INSERT INTO invitaciones (token, rol, id_departamento, creado_por, max_usuarios, usuarios_registrados, usado, creado_en, expira_en)
VALUES ('TOKEN_SUPERUSER', 'Superusuario', 1, 1, 1, 0, false, NOW(), NOW() + INTERVAL '7 days');
INSERT INTO c_usuario (id_departamento, u_nombre, a_paterno, a_materno, telefono, created_at, updated_at)
VALUES (1, 'Sofia', 'Hernandez', 'Romay', '9222094573', NOW(), NOW())
RETURNING id_usuario;

INSERT INTO usuario (id_usuario_login, rol, correo, contrasena, created_at, updated_at)
VALUES (1, 'Jefe', 'sofiahromay@gmail.com', '$2y$12$bMpsNd977xM.R0rNKPXKdOC1RsYywq0OULNGIy1zF4u6R.4sRjy.e', NOW(), NOW());

INSERT INTO c_usuario (id_departamento, u_nombre, a_paterno, a_materno, telefono, created_at, updated_at)
VALUES (1, 'Violeta', 'Romay', 'Hernandez', '2281234567', NOW(), NOW());

INSERT INTO usuario (id_usuario_login, rol, correo, contrasena, created_at, updated_at)
VALUES (2, 'Usuario', 'coralsofia2003@outlook.com', '$2y$12$bMpsNd977xM.R0rNKPXKdOC1RsYywq0OULNGIy1zF4u6R.4sRjy.e', NOW(), NOW());
