-- Crear base de datos
CREATE DATABASE "Proyecto360_copia" WITH ENCODING='UTF8' TEMPLATE=template0;

\c Proyecto360_copia;

-- Tabla c_areas
CREATE TABLE c_areas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Tabla c_departamento
CREATE TABLE c_departamento (
    id_departamento SERIAL PRIMARY KEY,
    area_id INT NOT NULL,
    d_nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_departamento_area
        FOREIGN KEY (area_id)
        REFERENCES c_areas(id)
        ON DELETE CASCADE
);

-- Tabla c_usuario
CREATE TABLE c_usuario (
    id_usuario SERIAL PRIMARY KEY,
    id_departamento INT NOT NULL,
    u_nombre VARCHAR(50) NOT NULL,
    a_paterno VARCHAR(50) NOT NULL,
    a_materno VARCHAR(50) NULL,
    telefono VARCHAR(20) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_usuario_departamento
        FOREIGN KEY (id_departamento)
        REFERENCES c_departamento(id_departamento)
        ON DELETE CASCADE
);

-- Tabla usuario
CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    id_usuario_login INT NOT NULL,
    rol VARCHAR(50) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_usuario_login
        FOREIGN KEY (id_usuario_login)
        REFERENCES c_usuario(id_usuario)
        ON DELETE CASCADE
);

-- Tabla proyectos
CREATE TABLE proyectos (
    id_proyecto SERIAL PRIMARY KEY,
    id_departamento INT NOT NULL,
    p_nombre VARCHAR(100) NULL,
    pf_inicio DATE NULL,
    pf_fin DATE NULL,
    p_estatus VARCHAR(50) DEFAULT 'EN PROCESO',
    descripcion TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_proyecto_departamento
        FOREIGN KEY (id_departamento)
        REFERENCES c_departamento(id_departamento)
        ON DELETE CASCADE
);

-- Tabla proyectos_departamentos (relación muchos a muchos)
CREATE TABLE proyectos_departamentos (
    id_proyectos_departamentos SERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL,
    id_departamento INT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_pd_proyecto
        FOREIGN KEY (id_proyecto)
        REFERENCES proyectos(id_proyecto)
        ON DELETE CASCADE,
    CONSTRAINT fk_pd_departamento
        FOREIGN KEY (id_departamento)
        REFERENCES c_departamento(id_departamento)
        ON DELETE CASCADE
);

-- Tabla tareas
CREATE TABLE tareas (
    id_tarea SERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL,
    id_usuario INT NOT NULL,
    t_nombre VARCHAR(100) NOT NULL,
    t_estatus VARCHAR(50) DEFAULT 'PENDIENTE',
    tf_inicio DATE NULL,
    tf_completada DATE NULL,
    tf_fin DATE NULL,
    descripcion TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_tarea_proyecto
        FOREIGN KEY (id_proyecto)
        REFERENCES proyectos(id_proyecto)
        ON DELETE CASCADE,
    CONSTRAINT fk_tarea_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES c_usuario(id_usuario)
        ON DELETE CASCADE
);

-- Tabla evidencias
CREATE TABLE evidencias (
    id_evidencia SERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL,
    id_tarea INT NOT NULL,
    id_departamento INT NOT NULL,
    id_usuario INT NOT NULL,
    ruta_archivo VARCHAR(255) NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_evidencia_proyecto
        FOREIGN KEY (id_proyecto)
        REFERENCES proyectos(id_proyecto)
        ON DELETE CASCADE,
    CONSTRAINT fk_evidencia_tarea
        FOREIGN KEY (id_tarea)
        REFERENCES tareas(id_tarea)
        ON DELETE CASCADE,
    CONSTRAINT fk_evidencia_departamento
        FOREIGN KEY (id_departamento)
        REFERENCES c_departamento(id_departamento)
        ON DELETE CASCADE,
    CONSTRAINT fk_evidencia_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES c_usuario(id_usuario)
        ON DELETE CASCADE
);
CREATE TABLE historial_modificaciones (
    id_historial SERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL,
    id_tarea INT NULL,
    id_usuario INT NOT NULL,
    accion VARCHAR(255) NOT NULL,
    detalles TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    CONSTRAINT fk_historial_proyecto
        FOREIGN KEY (id_proyecto)
        REFERENCES proyectos(id_proyecto)
        ON DELETE CASCADE,

    CONSTRAINT fk_historial_tarea
        FOREIGN KEY (id_tarea)
        REFERENCES tareas(id_tarea)
        ON DELETE SET NULL,

    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES c_usuario(id_usuario)
        ON DELETE CASCADE
);


-- Tabla invitaciones
CREATE TABLE invitaciones (
    id_invitacion SERIAL PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    rol VARCHAR(50) NOT NULL,
    id_departamento INT NOT NULL,
    creado_por INT NOT NULL,
    max_usuarios INT DEFAULT 1,
    usuarios_registrados INT DEFAULT 0,
    usado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMP NULL,
    CONSTRAINT fk_invitacion_departamento
        FOREIGN KEY (id_departamento)
        REFERENCES c_departamento(id_departamento)
        ON DELETE CASCADE,
    CONSTRAINT fk_invitacion_creado_por
        FOREIGN KEY (creado_por)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
);

-- Tabla password_reset_tokens
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    correo VARCHAR(100) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    usado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMP NULL
);
