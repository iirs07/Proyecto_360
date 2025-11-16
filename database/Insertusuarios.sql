psql -U postgres -d Proyecto360 -h localhost -p 5432

-- Borrar registros dependientes
DELETE FROM invitaciones;
DELETE FROM proyectos;
DELETE FROM usuario;
DELETE FROM c_usuario;

-- Reiniciar secuencias para que comiencen desde 1
ALTER SEQUENCE c_usuario_id_usuario_seq RESTART WITH 1;
ALTER SEQUENCE usuario_id_usuario_seq RESTART WITH 1;
ALTER SEQUENCE proyectos_id_proyecto_seq RESTART WITH 1;
ALTER SEQUENCE invitaciones_id_invitacion_seq RESTART WITH 1;

-- Insertar un solo usuario y persona, IDs coincidentes
INSERT INTO c_usuario (id_departamento, u_nombre, a_paterno, a_materno, telefono)
VALUES
(3, 'ITZEL', 'RAMOS', 'SANTIAGO', '1234567890');


INSERT INTO usuario (id_usuario_login, rol, correo, contrasena)
VALUES (1, 'Jefe', 'noviramos20@gmail.com', '$2y$12$1jGasv5F9cZQIJmVmekVjeS72nVFeHXKI660/8NJFsKgS6MvsvMzK');

-- Insertar un proyecto
INSERT INTO proyectos (id_departamento, p_nombre, pf_inicio, pf_fin, p_estatus, descripcion)
VALUES (
    7,
    E'Optimizaci\u00f3n de Recursos',
    '2025-10-13',
    '2026-01-13',
    'En proceso',
    E'Proyecto para mejorar la eficiencia de procesos en la regidur\u00eda'
);
-- Insertar tareas
INSERT INTO Tareas (id_proyecto, id_usuario, t_nombre, t_estatus, tf_inicio, tf_fin, descripcion)
VALUES 
    (1, 3, 'Analisis de procesos', 'Pendiente', '2025-10-14', '2025-10-18', 'Revisar los procesos actuales del proyecto'),
    (1, 3, 'Documentacion de recursos', 'Pendiente', '2025-10-19', '2025-10-22', 'Registrar los recursos y materiales disponibles'),
    (1, 3, 'Evaluacion de riesgos', 'Pendiente', '2025-10-23', '2025-10-26', 'Identificar riesgos y posibles problemas del proyecto');


UPDATE Tareas
SET t_estatus = 'Finalizado'
WHERE id_proyecto = 1
  AND id_usuario = 3
  AND t_nombre IN (
      'Analisis de procesos',
       'Documentacion de recursos'
  );
      'Documentacion de recursos',

INSERT INTO Proyectos (id_departamento, p_nombre, pf_inicio, pf_fin, p_estatus, descripcion)
VALUES (7, 'Digitalizacion de Procesos', '2025-11-01', '2026-02-01', 'En proceso', 'Proyecto para implementar herramientas digitales y mejorar la gestion documental en la regiduria');
INSERT INTO Proyectos (id_departamento, p_nombre, pf_inicio, pf_fin, p_estatus, descripcion)
VALUES (7, 'Mejora de Comunicacion Interna', '2025-11-15', '2026-03-15', 'En proceso', 'Proyecto para optimizar los canales de comunicacion interna y la colaboracion entre areas de la regiduria'); 




-- 1️⃣ Insertar en c_usuario
INSERT INTO c_usuario (id_departamento, u_nombre, a_paterno, a_materno, telefono, created_at, updated_at)
VALUES (1, 'Itzel', 'Ramos', 'Santiago', '9222094573', NOW(), NOW())
RETURNING id_usuario;

-- Supongamos que devuelve id_usuario = 1

-- 2️⃣ Insertar en usuario
INSERT INTO usuario (id_usuario_login, rol, correo, contrasena, created_at, updated_at)
VALUES (1, 'Superusuario', 'ramossantiagoitzelivonne@gmail.com', '$2y$12$bMpsNd977xM.R0rNKPXKdOC1RsYywq0OULNGIy1zF4u6R.4sRjy.e', NOW(), NOW());

-- 3️⃣ Opcional: crear invitación para ese rol (aunque superusuario no suele necesitar)
INSERT INTO invitaciones (token, rol, id_departamento, creado_por, max_usuarios, usuarios_registrados, usado, creado_en, expira_en)
VALUES ('TOKEN_SUPERUSER', 'Superusuario', 1, 1, 1, 0, false, NOW(), NOW() + INTERVAL '7 days');
