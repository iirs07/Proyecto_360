import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { useAuthGuard } from "../hooks/useAuthGuard";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/EliminarProyectos.css";
import { 
  FaCalendarAlt, 
  FaTasks, 
  FaExclamationTriangle, 
  FaSearch,
  FaTrash,
  FaInfoCircle,
  FaHourglassHalf,
  FaFilter
} from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import SelectDinamico from "../components/SelectDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";
import ConfirmModal from "../components/ConfirmModal";
import { getPStatusTagStyle, getBorderClase } from "../components/estatusUtils";

function EliminarProyectos() {
  useAuthGuard();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("alfabetico");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [proyectoAEliminar, setProyectoAEliminar] = useState(null);
  const navigate = useNavigate();
  const { volverSegunRol } = useRolNavigation();
  const API_URL = import.meta.env.VITE_API_URL;

  const opciones = [
    { value: "alfabetico", label: "Orden alfabético (A-Z)" },
    { value: "alfabetico_desc", label: "Orden alfabético (Z-A)" },
    { value: "fecha_proxima", label: "Fecha más próxima" },
    { value: "fecha_lejana", label: "Fecha más lejana" },
  ];

  const proyectosFiltrados = proyectos
    .filter((p) => p.p_nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      switch (filtro) {
        case "alfabetico":
          return a.p_nombre.localeCompare(b.p_nombre);
        case "alfabetico_desc":
          return b.p_nombre.localeCompare(a.p_nombre);
        case "fecha_proxima":
          return new Date(a.pf_fin) - new Date(b.pf_fin);
        case "fecha_lejana":
          return new Date(b.pf_fin) - new Date(a.pf_fin);
        default:
          return 0;
      }
    });

  const mostrarSelect = proyectos.length > 0 && proyectosFiltrados.length > 0;

  const cargarProyectosInicial = useCallback(async () => {
  const usuario = JSON.parse(sessionStorage.getItem("usuario"));
  const idUsuario = usuario?.id_usuario;
  const token = sessionStorage.getItem("jwt_token");

  if (!idUsuario || !token) {
    setLoading(false);
    return;
  }

  try {
    setLoading(true); 
    const res = await fetch(`${API_URL}/api/proyectos/general?usuario=${idUsuario}`, {
      headers: { Authorization: `Bearer ${token}`, 
      Accept: "application/json", "Content-Type": "application/json" },
    });

    const data = await res.json().catch(async () => ({ error: await res.text() }));
    if (res.ok && data.success) setProyectos(data.proyectos || []);
    else setProyectos([]);
  } catch (err) {
    console.error("Error cargando proyectos:", err);
    setProyectos([]);
  } finally {
    setLoading(false);
  }
}, [API_URL]);

const actualizarProyectos = useCallback(async () => {
  const usuario = JSON.parse(sessionStorage.getItem("usuario"));
  const idUsuario = usuario?.id_usuario;
  const token = sessionStorage.getItem("jwt_token");

  if (!idUsuario || !token) return;

  try {
    const res = await fetch(
      `${API_URL}/api/proyectos/general?usuario=${idUsuario}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (res.status === 401) {
      sessionStorage.clear();
      navigate("/Login", { replace: true });
      return;
    }

    const data = await res.json().catch(async () => ({
      error: await res.text(),
    }));

    if (res.ok && data.success) {
      setProyectos(data.proyectos || []);
    }
  } catch (err) {
    console.error("Error actualizando proyectos:", err);
  }
}, [API_URL, navigate]);


useEffect(() => {
  cargarProyectosInicial();
}, [cargarProyectosInicial]);

useAutoRefresh(actualizarProyectos, 5000);


  const confirmarEliminar = (proyecto) => {
    setProyectoAEliminar(proyecto);
    setModalOpen(true);
  };

  const eliminarProyecto = () => {
    if (!proyectoAEliminar) return;
    const token = sessionStorage.getItem("jwt_token");

    fetch(`${API_URL}/api/proyectos/${proyectoAEliminar.id_proyecto}/eliminar`, {
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

  return (
    <Layout 
      titulo="ELIMINAR PROYECTOS" 
      sidebar={<MenuDinamico activeRoute="eliminar" />}
    >
  

        {/* FILTROS */}
        {proyectos.length > 0 && (
          <div className="eliminar-filtros-container">
            <div className="eliminar-search-filter-wrapper">
              
              {/* BUSCADOR */}
              <div className="eliminar-search-box">
                <FaSearch className="eliminar-search-icon" />
                <input
                  type="text"
                  placeholder="Buscar proyectos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="eliminar-search-input"
                />
                {busqueda && (
                  <button
                    className="eliminar-search-clear-btn"
                    onClick={() => setBusqueda("")}
                  >
                    <FiX />
                  </button>
                )}
              </div>

              {/* SELECT */}
              {mostrarSelect && (
                <div className="eliminar-filter-box">
                  <FaFilter className="eliminar-filter-icon" />
                  <div className="desktop-only">
                    <SelectDinamico
                      opciones={opciones.map((o) => o.label)}
                      valor={opciones.find((o) => o.value === filtro)?.label}
                      setValor={(labelSeleccionado) => {
                        const opcion = opciones.find((o) => o.label === labelSeleccionado);
                        if (opcion) setFiltro(opcion.value);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* RESULTADOS */}
            {busqueda && (
              <div className="eliminar-search-results-info">
                <span className="eliminar-results-count">
                  {proyectos.filter((p) =>
                    p.p_nombre.toLowerCase().includes(busqueda.toLowerCase())
                  ).length}
                </span> 
                resultado(s) para "{busqueda}"
              </div>
            )}
          </div>
        )}

        {/* LISTA DE PROYECTOS */}
        <div className="eliminar-proyectos-grid">
          {loading ? (
            <div className="loader-container">
              <div className="loader-logo">
                <img src={logo3} alt="Cargando proyectos" />
              </div>
              <div className="loader-texto">CARGANDO PROYECTOS...</div>
              <div className="loader-spinner"></div>
            </div>
          ) : proyectosFiltrados.length > 0 ? (
            proyectosFiltrados.map((p) => {
              const fechaFin = new Date(p.pf_fin);
              const hoy = new Date();
              fechaFin.setHours(0, 0, 0, 0);
              hoy.setHours(0, 0, 0, 0);

              const diasRestantes = Math.floor((fechaFin - hoy) / (1000 * 60 * 60 * 24)) + 1;
              const esProximo = diasRestantes >= 0;
              const estaVencido = diasRestantes < 0;
                const mostrarDiasRestantes = p.p_estatus?.toLowerCase() !== "finalizado";

              return (
                <div 
                  key={p.id_proyecto} 
                  className={`eliminar-proyecto-card ${getBorderClase(p.p_estatus)}`}
                >
             
<div className="eliminar-proyecto-card-header">
  
  <div className="eliminar-header-top">
    <h3 className="eliminar-proyecto-nombre">{p.p_nombre}</h3>
    <div className="eliminar-proyecto-status-badge">
      <span style={getPStatusTagStyle(p.p_estatus)}>
        {p.p_estatus || "Sin estatus"}
      </span>
    </div>
  </div>
  {/* -------------------------------------------------------- */}

  <p className="eliminar-proyecto-descripcion">{p.descripcion}</p>
</div>

                  {/* INFO */}
                  <div className="eliminar-proyecto-info-grid">
                    
                    <div className="eliminar-info-item">
                      <FaCalendarAlt className="eliminar-info-icon" />
                      <div className="eliminar-info-content">
                        <div className="eliminar-info-label">Fecha límite</div>
                        <div className="eliminar-info-value">{p.pf_fin}</div>
                      </div>
                    </div>

                  
                  
{mostrarDiasRestantes && (
  <div className="eliminar-info-item">
    <FaHourglassHalf className="eliminar-info-icon" />
    <div className="eliminar-info-content">
      <div className="eliminar-info-label">Días restantes</div>
      <div className="eliminar-info-value">
        {estaVencido
          ? "Proyecto vencido"
          : diasRestantes === 0
            ? "Hoy"
            : `${diasRestantes} día${diasRestantes > 1 ? "s" : ""}`}
      </div>
    </div>
  </div>
)}

                    <div className="eliminar-info-item">
                      <FaTasks className="eliminar-info-icon" />
                      <div className="eliminar-info-content">
                        <div className="eliminar-info-label">Tareas totales</div>
                        <div className="eliminar-info-value">{p.total_tareas || 0}</div>
                      </div>
                    </div>
                  </div>
                  <div className="eliminar-proyecto-actions">
                    <button
                      className="eliminar-btn-icon"
                      onClick={() => confirmarEliminar(p)}
                    >
                      <FaTrash />
                      <span>Eliminar proyecto</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : busqueda.length === 0 ? (
            <EmptyState
              titulo="ELIMINAR PROYECTOS"
              mensaje="No hay proyectos disponibles."
              botonTexto="Volver al Tablero"
              onVolver={volverSegunRol}
              icono={logo3}
            />
          ) : null}
        </div>

        <ConfirmModal
          isOpen={modalOpen}
          title="Confirmar eliminación"
         message="¿Estás seguro de que deseas eliminar el proyecto? Todas las tareas relacionadas también se eliminarán."
          onConfirm={eliminarProyecto}
          onCancel={() => setModalOpen(false)}
        />
  
    </Layout>
  );
}

export default EliminarProyectos;





