import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/EliminarUsuario.css";
import Layout from "../components/Layout";
import ErrorMensaje from "../components/ErrorMensaje";
import MenuDinamico from "../components/MenuDinamico";
import { useRolNavigation } from "./utils/navigation";
import { FaUserMinus } from "react-icons/fa"; 
import EmptyState from "../components/EmptyState";
import logo3 from "../imagenes/logo3.png";
import ConfirmModal from "../components/ConfirmModal";
import { useAuthGuard } from "../hooks/useAuthGuard";

export default function EliminarUsuario() {
  useAuthGuard();
  const [usuarios, setUsuarios] = useState([]);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingEliminar, setLoadingEliminar] = useState(null);
  const [error, setError] = useState("");
  const { volverSegunRol } = useRolNavigation();
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
const API_URL = import.meta.env.VITE_API_URL;
  const usuarioLogueado = JSON.parse(sessionStorage.getItem("usuario"));
  const idUsuario = usuarioLogueado?.id_usuario;

 useEffect(() => {
  if (!idUsuario) {
    setError("Usuario no encontrado. Por favor, inicia sesión.");
    setLoadingInicial(false);
    return;
  }

  const fetchUsuarios = async () => {
    const token = sessionStorage.getItem("jwt_token");
    if (!token) {
      navigate("/Login", { replace: true });
      return;
    }

    setLoadingInicial(true);

    try {
      const res = await axios.get(
        `${API_URL}/api/usuarios/departamento/${idUsuario}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => true, 
        }
      );

      if (res.status === 401) {
        sessionStorage.clear();
        navigate("/Login", { replace: true });
        return;
      }

      setUsuarios(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Error al obtener los usuarios.");
    } finally {
      setLoadingInicial(false);
    }
  };

  fetchUsuarios();
}, [idUsuario]);


  const eliminarUsuario = async (id_usuario) => {
  const token = sessionStorage.getItem("jwt_token");
  if (!token) {
    navigate("/Login", { replace: true });
    return;
  }

  try {
    setLoadingEliminar(id_usuario);

    const res = await axios.delete(`${API_URL}/api/usuarios/${id_usuario}`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: (status) => true, 
    });

    if (res.status === 401) {
      sessionStorage.clear();
      navigate("/Login", { replace: true });
      return;
    }

    setUsuarios((prev) => prev.filter((u) => u.id_usuario !== id_usuario));
  } catch (err) {
    setError("Error al eliminar el usuario.");
  } finally {
    setLoadingEliminar(null);
  }
};


  if (loadingInicial) {
    return (
       <div className="loader-container">
    <div className="loader-logo">
     <img src={logo3} alt="Cargando" />
     </div>
     <div className="loader-texto">CARGANDO...</div>
     <div className="loader-spinner"></div>
      </div>
    );
  }

  return (
    <Layout titulo="ELIMINAR USUARIOS" sidebar={<MenuDinamico activeRoute="Eliminar usuarios" />}>
      <div className="eliminarusuario-container">
        {error && <ErrorMensaje mensaje={error} />}

        {usuarios.length === 0 ? (
          <EmptyState
            titulo="ELIMINAR USUARIO"
            mensaje="No hay usuarios disponibles."
            botonTexto="Volver al Tablero"
            onVolver={volverSegunRol}
            icono={logo3}
          />
        ) : (
          <div className="eliminarusuario-usuarios-lista">
            {usuarios.map((usuario) => (
              <div key={usuario.id_usuario} className="eliminarusuario-usuario-card">
                <div className="eliminarusuario-usuario-info">
                  <div className="eliminarusuario-usuario-nombre">
                    {usuario.nombre} {usuario.apaterno} {usuario.amaterno}
                  </div>
                </div>
                <button
                  className="eliminarusuario-btn-eliminar"
                  onClick={() => {
                    setUsuarioAEliminar(usuario);
                    setModalOpen(true);
                  }}
                  disabled={loadingEliminar === usuario.id_usuario}
                >
                  {loadingEliminar === usuario.id_usuario ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <>
                      <FaUserMinus className="me-1" /> Eliminar
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {usuarioAEliminar && (
          <ConfirmModal
            isOpen={modalOpen}
            title="Confirmar eliminación"
            message={`¿Estás seguro que deseas eliminar al usuario "${usuarioAEliminar.nombre} ${usuarioAEliminar.apaterno} ${usuarioAEliminar.amaterno}"?`}
            onConfirm={() => {
              eliminarUsuario(usuarioAEliminar.id_usuario);
              setModalOpen(false);
              setUsuarioAEliminar(null);
            }}
            onCancel={() => {
              setModalOpen(false);
              setUsuarioAEliminar(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}

