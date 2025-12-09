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

export default function ModificarUsuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingActualizar, setLoadingActualizar] = useState(null);
  const [error, setError] = useState("");
  const { volverSegunRol } = useRolNavigation();
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const usuarioLogueado = JSON.parse(sessionStorage.getItem("usuario"));
  const idUsuario = usuarioLogueado?.id_usuario;

  useEffect(() => {
    if (!idUsuario) {
      setError("Usuario no encontrado. Por favor, inicia sesión.");
      setLoadingInicial(false);
      return;
    }

    const fetchUsuario = async () => {
      const token = sessionStorage.getItem("jwt_token");
      if (!token) {
        setError("Usuario no autorizado.");
        setLoadingInicial(false);
        return;
      }

      try {
        const res = await axios.get(
          `${API_URL}/api/usuarios/${idUsuario}`, 
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Si tu API devuelve un solo objeto, lo convertimos en array para mapear
        setUsuarios(res.data ? [res.data] : []);
      } catch (err) {
        console.error(err);
        setError("Error al obtener el usuario.");
      } finally {
        setLoadingInicial(false);
      }
    };

    fetchUsuario();
  }, [idUsuario]);

  const actualizarCorreoUsuario = async (id_usuario, nuevoCorreo) => {
    const token = sessionStorage.getItem("jwt_token");
    if (!token) {
        setError("Usuario no autorizado.");
        return;
    }

    try {
        setLoadingActualizar(id_usuario);
        await axios.put(`${API_URL}/api/usuarios/${id_usuario}/correo`, {
            correo: nuevoCorreo
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Actualizar la lista de usuarios en la interfaz
        setUsuarios(usuarios.map(u => 
            u.id_usuario === id_usuario ? { ...u, correo: nuevoCorreo } : u
        ));
    } catch (err) {
        console.error(err);
        setError("Error al actualizar el correo del usuario.");
    } finally {
        setLoadingActualizar(null);
    }
  };

  if (loadingInicial) {
    return (
      <div className="eliminarusuario-loader-container">
        <div className="eliminarusuario-loader-logo">
          <img src={logo3} alt="Cargando" />
        </div>
        <div className="eliminarusuario-loader-texto">CARGANDO...</div>
        <div className="eliminarusuario-loader-spinner"></div>
      </div>
    );
  }

  return (
    <Layout titulo="MODIFICAR USUARIO" sidebar={<MenuDinamico activeRoute="Modificar usuario" />}>
      <div className="eliminarusuario-container">
        {error && <ErrorMensaje mensaje={error} />}

        {usuarios.length === 0 ? (
          <EmptyState
            titulo="MODIFICAR USUARIO"
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
                  <div>
                    <strong>ID:</strong> {usuario.id_usuario}
                  </div>
                  <div>
                    <strong>Correo:</strong> {usuario.correo}
                  </div>
                  <div>
                    <strong>Rol:</strong> {usuario.rol}
                  </div>
                </div>
                <button
                  className="eliminarusuario-btn-eliminar"
                  onClick={() => {
                    setUsuarioSeleccionado(usuario);
                    setModalOpen(true);
                  }}
                  disabled={loadingActualizar === usuario.id_usuario}
                >
                  {loadingActualizar === usuario.id_usuario ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <>
                      <FaUserMinus className="me-1" /> Modificar Correo
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {usuarioSeleccionado && (
          <ConfirmModal
            isOpen={modalOpen}
            title="Modificar correo"
            message={`¿Deseas actualizar el correo del usuario "${usuarioSeleccionado.correo}"?`}
            onConfirm={() => {
              const nuevoCorreo = prompt("Ingresa el nuevo correo:", usuarioSeleccionado.correo);
              if (nuevoCorreo) {
                actualizarCorreoUsuario(usuarioSeleccionado.id_usuario, nuevoCorreo);
              }
              setModalOpen(false);
              setUsuarioSeleccionado(null);
            }}
            onCancel={() => {
              setModalOpen(false);
              setUsuarioSeleccionado(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}
