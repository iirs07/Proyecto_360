import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import EmptyState from "../components/EmptyState";
import logo3 from "../imagenes/logo3.png";

const Empty = () => {
  const navigate = useNavigate();
  const rol = sessionStorage.getItem("rol");

  const handleVolver = () => {
    switch (rol) {
      case "Jefe":
        navigate("/GestionProyectos");
        break;
      case "Usuario":
        navigate("/GestionProyectosUsuario");
        break;
      case "Administrador":
        navigate("/admin");
        break;
      case "Superusuario":
        navigate("/Principal");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <Layout
      titulo="TAREAS PENDIENTES POR REVISAR"
      sidebar={<MenuDinamico activeRoute="revision" />}
    >
      <EmptyState
        titulo="¡Estás al día!"
        mensaje="No hay proyectos ni tareas pendientes de revisión en este momento."
        botonTexto="Volver al Tablero"
        onVolver={handleVolver}
        icono={logo3}
      />
    </Layout>
  );
};

export default Empty;
