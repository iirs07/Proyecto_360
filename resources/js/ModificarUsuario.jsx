import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/ModificarUsuario.css";
import Layout from "../components/Layout";
import ErrorMensaje from "../components/ErrorMensaje";
import MenuDinamico from "../components/MenuDinamico";
import { FaUserMinus } from "react-icons/fa";
import EmptyState from "../components/EmptyState";
import logo3 from "../imagenes/logo3.png";
import ConfirmModal from "../components/ConfirmModal";

export default function ModificarUsuario() {
  const [departamentos, setDepartamentos] = useState([]);
  const [idDepartamentoSeleccionado, setIdDepartamentoSeleccionado] = useState("");
  const [usuariosDepartamento, setUsuariosDepartamento] = useState([]);
  const [correosEditados, setCorreosEditados] = useState({});
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [loadingActualizar, setLoadingActualizar] = useState(null);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // Cargar departamentos
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const token = sessionStorage.getItem("jwt_token");
        const res = await axios.get(`${API_URL}/api/CatalogoDepartamentos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDepartamentos(res.data);
      } catch (error) {
        console.error(error);
        setError("Error al cargar los departamentos.");
      }
    };
    fetchDepartamentos();
  }, []);

  // Cargar usuarios por departamento
  const fetchUsuariosDepartamento = async (id) => {
    if (!id) return;
    setLoadingUsuarios(true);
    try {
      const token = sessionStorage.getItem("jwt_token");
      const res = await axios.get(
        `${API_URL}/api/departamentos/${id}/usuarios`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsuariosDepartamento(res.data);

      const correos = {};
      res.data.forEach((u) => {
        correos[u.id_usuario] = u.correo;
      });
      setCorreosEditados(correos);

    } catch (error) {
      console.error(error);
      setError("Error al cargar los usuarios del departamento.");
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // Actualizar correo del usuario
  const actualizarCorreoUsuario = async (id_usuario, nuevoCorreo) => {
    const token = sessionStorage.getItem("jwt_token");
    if (!token) {
      setError("Usuario no autorizado.");
      return;
    }

    try {
      setLoadingActualizar(id_usuario);
      await axios.put(
        `${API_URL}/api/usuarios/${id_usuario}/correo`,
        { correo: nuevoCorreo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsuariosDepartamento(idDepartamentoSeleccionado);
    } catch (err) {
      console.error(err);
      setError("Error al actualizar el correo del usuario.");
    } finally {
      setLoadingActualizar(null);
    }
  };

  return (
    <Layout titulo="MODIFICAR USUARIO" sidebar={<MenuDinamico activeRoute="Modificar usuario" />}>
      <div className="modificarusuario-container">

        {/* SELECT DE DEPARTAMENTOS */}
        <div className="form-group mb-4">
          <label><strong>Seleccione un departamento:</strong></label>
          <select
            className="form-control"
            value={idDepartamentoSeleccionado}
            onChange={(e) => {
              setIdDepartamentoSeleccionado(e.target.value);
              fetchUsuariosDepartamento(e.target.value);
            }}
          >
            <option value="">Selecciona un departamento</option>
            {departamentos.map((dep) => (
              <option key={dep.id_departamento} value={dep.id_departamento}>
                {dep.d_nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Renderiza este bloque SOLO si hay un departamento seleccionado */}
        {idDepartamentoSeleccionado !== "" && (
          <div className="usuarios-departamento-lista">
            <h3>Usuarios</h3>

            {/* Loader global mientras se cargan los usuarios */}
            {loadingUsuarios && (
              <div className="loader-container">
                 <div className="loader-logo">
                   <img src={logo3} alt="Cargando" />
                 </div>
                 <div className="loader-texto">CARGANDO...</div>
                 <div className="loader-spinner"></div>
               </div>
            )}

            {/* Lista de usuarios */}
            {!loadingUsuarios && usuariosDepartamento.length > 0 && usuariosDepartamento.map((u) => (
              <div key={u.id_usuario} className="usuario-card">

                <div className="usuario-info">
                  <div className="usuario-nombre">
                    <strong>Nombre:</strong> {u.nombre} {u.apaterno} {u.amaterno}
                  </div>

                  <div className="usuario-correo">
                    <strong>Correo:</strong>
                    <input
                      type="email"
                      className="correo-input"
                      value={correosEditados[u.id_usuario] || ""}
                      onChange={(e) => {
                        setCorreosEditados({
                          ...correosEditados,
                          [u.id_usuario]: e.target.value
                        });
                        if (error) setError("");
                      }}
                    />
                    {error && correosEditados[u.id_usuario]?.trim() === "" && (
                      <ErrorMensaje mensaje={error} />
                    )}
                  </div>
                </div>

                <button
                  className="btn-modificar"
                  onClick={() => {
                    const correoActual = correosEditados[u.id_usuario]?.trim();
                    if (!correoActual) {
                      setError("El correo no puede estar vacío.");
                      return;
                    }
                    setUsuarioSeleccionado(u);
                    setModalOpen(true);
                  }}
                  disabled={loadingActualizar === u.id_usuario}
                >
                  {loadingActualizar === u.id_usuario ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <><FaUserMinus className="me-1" /> Modificar</>
                  )}
                </button>

              </div>
            ))}

            {/* Estado vacío si no hay usuarios y no se está cargando */}
            {!loadingUsuarios && usuariosDepartamento.length === 0 && (
              <EmptyState
                titulo="SIN USUARIOS"
                mensaje="Este departamento no tiene usuarios registrados."
                icono={logo3}
              />
            )}
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN */}
        {usuarioSeleccionado && (
          <ConfirmModal
            isOpen={modalOpen}
            title="Confirmar modificación"
            message={`¿Deseas actualizar el correo del usuario "${usuarioSeleccionado.nombre}"?`}
            onConfirm={() => {
              const nuevoCorreo = correosEditados[usuarioSeleccionado.id_usuario];
              actualizarCorreoUsuario(usuarioSeleccionado.id_usuario, nuevoCorreo);
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

