import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/ProyectosM.css";
import { FaSearch, FaProjectDiagram } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import ConfirmModal from "../components/ConfirmModal";

function EliminarProyectos() {
  const [busqueda, setBusqueda] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [proyectoAEliminar, setProyectoAEliminar] = useState(null);
  const navigate = useNavigate();

  // Cargar proyectos sin tareas
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const idUsuario = usuario?.id_usuario;
    const token = localStorage.getItem("jwt_token");

    if (!idUsuario || !token) {
      console.error("❌ No se encontró id_usuario o token JWT");
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

  // Abrir modal de confirmación
  const confirmarEliminar = (proyecto) => {
    setProyectoAEliminar(proyecto);
    setModalOpen(true);
  };

  // Función para eliminar un proyecto
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
        <h1 className="titulo-global">Proyectos</h1>

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
        <div className="modificar-proyectos-lista">
          {loading ? (
            <div className="loader-container">
              <div className="loader-logo">
                <img src={logo3} alt="Cargando" />
              </div>
              <div className="loader-texto">CARGANDO...</div>
              <div className="loader-spinner"></div>
            </div>
          ) : proyectosFiltrados.length === 0 ? (
            <div className="empty-state-global">
              <FaProjectDiagram className="empty-icon-global" size={48} />
              <h3 className="empty-title-global">No se encontraron proyectos</h3>
              <p className="empty-text-global">Intenta con otros términos de búsqueda</p>
            </div>
          ) : (
            proyectosFiltrados.map((p) => (
              <div key={p.id_proyecto} className="modificar-proyectos-card">
                <h5 className="modificar-proyectos-nombre">{p.p_nombre}</h5>
                <div className="modificar-proyectos-fp">
                  <div>Fin: {p.pf_fin}</div>
                </div>
                <div className="modificar-proyectos-botones">
                  <button
                    className="modificar-proyectos-btn eliminar"
                    onClick={() => confirmarEliminar(p)}
                  >
                    Eliminar proyecto
                  </button>
                </div>
              </div>
            ))
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





