import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/EliminarProyectos.css";
import { FaSearch, FaTrash, FaCalendarAlt } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";
import ConfirmModal from "../components/ConfirmModal";

function EliminarProyectos() {
  const [busqueda, setBusqueda] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [proyectoAEliminar, setProyectoAEliminar] = useState(null);
  const navigate = useNavigate();
  const { volverSegunRol } = useRolNavigation();


  // Cargar proyectos sin tareas
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const idUsuario = usuario?.id_usuario;
    const token = localStorage.getItem("jwt_token");

    if (!idUsuario || !token) {
      setLoading(false);
      return;
    }

    fetch(`http://127.0.0.1:8000/api/proyectos/sin-tareas?usuario=${idUsuario}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("jwt_token");
          localStorage.removeItem("usuario");
          navigate("/Login", { replace: true });
          return { success: false, mensaje: "No autorizado" };
        }
        return res.json();
      })
      .then((data) => {
        if (data?.success) setProyectos(data.proyectos || []);
        else {
          console.error("Error en la respuesta:", data?.mensaje);
          setProyectos([]);
        }
      })
      .catch((err) => {
        console.error("Error en la petición:", err);
        setProyectos([]);
      })
      .finally(() => setLoading(false));
  }, [navigate]);
  const confirmarEliminar = (proyecto) => {
    setProyectoAEliminar(proyecto);
    setModalOpen(true);
  };
  const eliminarProyecto = () => {
    if (!proyectoAEliminar) return;
    const token = localStorage.getItem("jwt_token");

    fetch(`http://127.0.0.1:8000/api/proyectos/${proyectoAEliminar.id_proyecto}/eliminar`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProyectos(proyectos.filter(p => p.id_proyecto !== proyectoAEliminar.id_proyecto));
          console.log("Proyecto eliminado correctamente");
        } else {
          console.error(data.mensaje || "Error eliminando proyecto");
        }
      })
      .catch(err => console.error("Error en la petición:", err))
      .finally(() => {
        setModalOpen(false);
        setProyectoAEliminar(null);
      });
  };

  const proyectosFiltrados = proyectos.filter((p) =>
    p.p_nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

 return (
  <Layout titulo="ELIMINAR PROYECTOS" sidebar={<MenuDinamico activeRoute="Eliminar proyecto" />}>
    <div className="container my-4">

      {/* Barra de búsqueda */}
      {proyectos.length > 0 && (
        <div className="barra-busqueda-global-container mb-4">
          <div className="barra-busqueda-global-wrapper">
            <FaSearch className="barra-busqueda-global-icon" />
            <input
              type="text"
              placeholder="Buscar proyectos por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="barra-busqueda-global-input"
            />
            {busqueda && (
              <button className="buscador-clear-global" onClick={() => setBusqueda("")}>
                <FiX />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista de proyectos */}
      <div className="eliminar-proyectos-lista">
        {loading ? (
          <div className="loader-container">
            <div className="loader-logo">
              <img src={logo3} alt="Cargando" />
            </div>
            <div className="loader-texto">CARGANDO...</div>
            <div className="loader-spinner"></div>
          </div>
        ) : proyectosFiltrados.length === 0 ? (
          <EmptyState
            titulo="ELIMINAR PROYECTOS"
            mensaje="No hay proyectos disponibles."
            botonTexto="Volver al Tablero"
            onVolver={volverSegunRol}
            icono={logo3}
          />
        ) : (
          proyectosFiltrados.map((p) => {
            const fechaFin = new Date(p.pf_fin);
            const hoy = new Date();
            fechaFin.setHours(0, 0, 0, 0);
            hoy.setHours(0, 0, 0, 0);

            const estaVencido = fechaFin < hoy;

            return (
              <div key={p.id_proyecto} className="eliminar-proyectos-card">
                <h5 className="eliminar-proyectos-nombre">{p.p_nombre}</h5>

                <div className="eliminar-proyectos-fp">
                  <div className="eliminar-info-item">
                                          <FaCalendarAlt className="eliminar-info-icon" />
                                          <span>
                                            <strong>Finaliza:</strong> {fechaFin.toLocaleDateString()}
                                          </span>
                                        </div>
                  {estaVencido && (
                    <div className="eliminar-alerta">
                      <FaExclamationTriangle /> <strong>¡Vencido!</strong>
                    </div>
                  )}
                </div>

                <div className="eliminar-proyectos-botones">
                  <button
  className="eliminar-proyectos-btn eliminar"
  onClick={() => confirmarEliminar(p)}
>
  <FaTrash style={{ marginRight: "8px" }} /> Eliminar proyecto
</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={modalOpen}
        title="Confirmar eliminación"
        message={`¿Estás seguro que deseas eliminar el proyecto "${proyectoAEliminar?.p_nombre}"?`}
        onConfirm={eliminarProyecto}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  </Layout>
);

}

export default EliminarProyectos;





