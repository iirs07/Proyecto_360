import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/VerProyecto.css";
import { 
  FaCalendarAlt, 
  FaTasks, 
  FaExclamationTriangle, 
  FaSearch,
  FaEye,
  FaInfoCircle,
  FaPlus,
  FaHourglassHalf,
  FaFilter
} from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import SelectDinamico from "../components/SelectDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";
import { getPStatusTagStyle, getBorderClase } from "../components/estatusUtils";

function ListaProyectos() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("alfabetico");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const agregarTarea = (idProyecto, nombreProyecto) => {
    navigate("/agregarTareas", { 
      state: { 
        id_proyecto: idProyecto, 
        nombre_proyecto: nombreProyecto 
      } 
    });
  };

  const verTareas = (idProyecto) => {
    sessionStorage.setItem("id_proyecto", idProyecto);
    navigate("/ListaDeTareas", { state: { id_proyecto: idProyecto } });
  };

  useEffect(() => {
    const cargarProyectos = async () => {
      const usuario = JSON.parse(sessionStorage.getItem("usuario"));
      const token = sessionStorage.getItem("jwt_token");
      const idUsuario = usuario?.id_usuario;

      if (!idUsuario) return alert("Usuario no encontrado.");
      if (!token) return alert("No hay token de autenticación, inicia sesión.");

      try {
        setLoading(true);
        const res = await fetch(
  `${API_URL}/api/proyectos/general?usuario=${idUsuario}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json().catch(async () => ({ error: await res.text() }));
        if (res.ok && data.success) {
          setProyectos(data.proyectos || []);
        } else {
          setProyectos([]);
        }
      } catch (err) {
        console.error("Error cargando proyectos:", err);
      } finally {
        setLoading(false);
      }
    };

    cargarProyectos();
  }, []);

  const proyectosTotales = proyectos.length;
  const proyectosVencidos = proyectos.filter(p => {
    const fechaFin = new Date(p.pf_fin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaFin < hoy;
  }).length;

  return (
    <Layout 
      titulo="PROYECTOS" 
      sidebar={<MenuDinamico activeRoute="ver" />}
    >
      <div className="container my-4">

        {/* FILTROS */}
        {proyectos.length > 0 && (
          <div className="lp-filtros-container">
            <div className="lp-search-filter-wrapper">
              
              {/* BUSCADOR */}
              <div className="lp-search-box">
                <FaSearch className="lp-search-icon" />
                <input
                  type="text"
                  placeholder="Buscar proyectos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="lp-search-input"
                />
                {busqueda && (
                  <button
                    className="lp-search-clear-btn"
                    onClick={() => setBusqueda("")}
                  >
                    <FiX />
                  </button>
                )}
              </div>

           
{mostrarSelect && (
  <div className="lp-filter-box">
    <FaFilter className="lp-filter-icon" />
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
              <div className="lp-search-results-info">
                <span className="lp-results-count">
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
        <div className="lp-proyectos-grid">
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

              const diasRestantes = Math.floor((fechaFin - hoy) / (1000 * 60 * 60 * 24));
              const esProximo = diasRestantes >= 0;
              const estaVencido = diasRestantes < 0;

              return (
                <div 
                  key={p.id_proyecto} 
                  className={`lp-proyecto-card ${getBorderClase(p.p_estatus)}`}
                >
                  {/* HEADER */}
                  <div className="lp-proyecto-card-header">
                    <h3 className="lp-proyecto-nombre">{p.p_nombre}</h3>
                    <div className="lp-proyecto-status-badge">
                      <span style={getPStatusTagStyle(p.p_estatus)}>
                        {p.p_estatus || "Sin estatus"}
                      </span>
                    </div>
                  </div>

                  {/* INFO */}
                  <div className="lp-proyecto-info-grid">

                  
<div className="lp-info-item">
  <FaCalendarAlt className="lp-info-icon" />
  <div className="lp-info-content">
    <div className="lp-info-label">Fecha límite</div>
    <div className="lp-info-value">{fechaFin.toLocaleDateString()}</div>
  </div>
</div>

{/* DÍAS RESTANTES */}
<div className="lp-info-item">
  <FaHourglassHalf className="lp-info-icon" />
  <div className="lp-info-content">
    <div className="lp-info-label">Días restantes</div>
    <div className="lp-info-value">
      {estaVencido
        ? "Proyecto vencido"
        : diasRestantes === 0
          ? "Hoy"
          : `${diasRestantes} día${diasRestantes > 1 ? "s" : ""}`}
    </div>
    </div>
</div>


                    {/* TAREAS */}
                    <div className="lp-info-item">
                      <FaTasks className="lp-info-icon" />
                      <div className="lp-info-content">
                        <div className="lp-info-label">Tareas totales</div>
                        <div className="lp-info-value">{p.total_tareas || 0}</div>
                      </div>
                    </div>
   
                     
                    </div>
                

                  <div className="lp-proyecto-actions">
                    {p.total_tareas === 0 ? (
                      <button
                        className="btn btn-primary lp-btn-icon"
                        onClick={() => agregarTarea(p.id_proyecto, p.p_nombre)}
                      >
                        <FaPlus />
                        <span>Agregar primera tarea</span>
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary lp-btn-icon"
                        onClick={() => verTareas(p.id_proyecto)}
                      >
                        <FaEye />
                        <span>Ver tareas</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : busqueda.length === 0 ? (
            <EmptyState
              titulo="PROYECTOS"
              mensaje="No hay proyectos disponibles."
              botonTexto="Volver al Tablero"
              onVolver={volverSegunRol}
              icono={logo3}
            />
          ) : null}
        </div>
      </div>
    </Layout>
  );
}

export default ListaProyectos;











