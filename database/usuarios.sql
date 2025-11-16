-- Crear un único usuario
CREATE USER proyecto360_user WITH PASSWORD '12345';

-- Dar permisos en la base original
\c "Proyecto360"
GRANT CONNECT ON DATABASE "Proyecto360" TO proyecto360_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO proyecto360_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO proyecto360_user;

-- Dar permisos en la base copia
\c "Proyecto360_copia"
GRANT CONNECT ON DATABASE "Proyecto360_copia" TO proyecto360_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO proyecto360_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO proyecto360_user;

----permisos--
-- Conectarte como superusuario
\c Proyecto360

-- Reemplaza 'proyecto360_user' por tu usuario
DO $$
DECLARE
    seq RECORD;
BEGIN
    FOR seq IN
        SELECT c.relname AS sequence_name
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'S' -- secuencias
    LOOP
        EXECUTE format('GRANT USAGE, SELECT, UPDATE ON SEQUENCE %I TO proyecto360_user;', seq.sequence_name);
    END LOOP;
END $$;






BEGIN;

DO $$
DECLARE
    fecha_inicio DATE;
    fecha_fin DATE;
BEGIN
    -- Calcular rango del trimestre
    fecha_inicio := date_trunc('quarter', CURRENT_DATE)::date;
    fecha_fin := (fecha_inicio + interval '3 months' - interval '1 day')::date;

    -- Tablas maestras: insertar solo nuevos registros
    INSERT INTO Proyecto360_copia.c_areas(id, nombre, created_at, updated_at)
    SELECT id, nombre, created_at, updated_at
    FROM Proyecto360.c_areas
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO Proyecto360_copia.c_departamento(id_departamento, area_id, d_nombre, created_at, updated_at)
    SELECT id_departamento, area_id, d_nombre, created_at, updated_at
    FROM Proyecto360.c_departamento
    ON CONFLICT (id_departamento) DO NOTHING;

    INSERT INTO Proyecto360_copia.c_usuario(id_usuario, id_departamento, u_nombre, a_paterno, a_materno, telefono, created_at, updated_at)
    SELECT id_usuario, id_departamento, u_nombre, a_paterno, a_materno, telefono, created_at, updated_at
    FROM Proyecto360.c_usuario
    ON CONFLICT (id_usuario) DO NOTHING;

    INSERT INTO Proyecto360_copia.usuario(id_usuario, id_usuario_login, rol, correo, contrasena, created_at, updated_at)
    SELECT id_usuario, id_usuario_login, rol, correo, contrasena, created_at, updated_at
    FROM Proyecto360.usuario
    ON CONFLICT (id_usuario) DO NOTHING;

    -- Tablas de transacciones: mover solo registros del trimestre
    INSERT INTO Proyecto360_copia.proyectos
    SELECT *
    FROM Proyecto360.proyectos
    WHERE created_at >= fecha_inicio AND created_at <= fecha_fin;

    DELETE FROM Proyecto360.proyectos
    WHERE created_at >= fecha_inicio AND created_at <= fecha_fin;

    INSERT INTO Proyecto360_copia.proyectos_departamentos
    SELECT *
    FROM Proyecto360.proyectos_departamentos
    WHERE created_at >= fecha_inicio AND created_at <= fecha_fin;

    DELETE FROM Proyecto360.proyectos_departamentos
    WHERE created_at >= fecha_inicio AND created_at <= fecha_fin;

    INSERT INTO Proyecto360_copia.tareas
    SELECT *
    FROM Proyecto360.tareas
    WHERE created_at >= fecha_inicio AND created_at <= fecha_fin;

    DELETE FROM Proyecto360.tareas
    WHERE created_at >= fecha_inicio AND created_at <= fecha_fin;

END $$;

COMMIT;





-----permisos---
GRANT ALL PRIVILEGES ON DATABASE "Proyecto360" TO proyecto360_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO proyecto360_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO proyecto360_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO proyecto360_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO proyecto360_user;

-----cambiar dueño----
ALTER DATABASE "Proyecto360" OWNER TO proyecto360_user;

\c Proyecto360

ALTER SCHEMA public OWNER TO proyecto360_user;

DO $$
DECLARE 
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO proyecto360_user';
    END LOOP;
END $$;

DO $$
DECLARE 
    r RECORD;
BEGIN
    FOR r IN 
        SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE public.' || quote_ident(r.sequence_name) || ' OWNER TO proyecto360_user';
    END LOOP;
END $$;
