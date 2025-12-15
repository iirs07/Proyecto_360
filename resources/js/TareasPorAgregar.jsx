import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import '../css/global.css';
import "../css/AgregarT.css";
import { FaCalendarAlt, FaClock, FaTasks, FaSearch, FaFilter } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import MenuDinamico from "../components/MenuDinamico";
import Layout from "../components/Layout";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";
import { useAuthGuard } from "../hooks/useAuthGuard";
import SelectDinamico from "../components/SelectDinamico";

function TareasPorAgregar() {
  useAuthGuard();
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
  ];

  useEffect(() => {
  const fetchProyectosUsuario = async () => {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    const token = sessionStorage.getItem("jwt_token");
    const idUsuario = usuario?.id_usuario;

    if (!idUsuario || !token) {
      navigate("/Login", { replace: true });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/agregar/tareas?usuario=${idUsuario}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        sessionStorage.clear();
        navigate("/Login", { replace: true });
        return;
      }

      const data = await res.json().catch(async () => ({ error: await res.text() }));

      if (res.ok && data.success) {
        setProyectos(data.proyectos || []);
      } else if (!data.success) {
        console.error("Error al cargar proyectos:", data.mensaje || data);
      }
    } catch (err) {
      console.error("Error al cargar proyectos:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchProyectosUsuario();
}, []);


  const handleAgregarTarea = (idProyecto, nombreProyecto) => {
    navigate("/AgregarTareas", { 
      state: { 
        id_proyecto: idProyecto,
        nombre: nombreProyecto
      } 
    });
  };

  // Filtrado igual pero adaptado a la estructura de AgregarT
  const proyectosFiltrados = proyectos
    .map(({ proyecto, tareas = [] }) => {
      const proyectoCoincide = proyecto.p_nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase());

      // Para AgregarT, solo filtramos por proyecto ya que no mostramos tareas individuales
      return {
        proyecto,
        tareas: [], // No mostramos tareas en AgregarT, pero mantenemos la estructura
        mostrar: proyectoCoincide
      };
    })
    .filter(({ mostrar }) => mostrar)
    .sort((a, b) => {
      switch (filtro) {
        case "alfabetico":
          return a.proyecto.p_nombre.localeCompare(b.proyecto.p_nombre);
        case "alfabetico_desc":
          return b.proyecto.p_nombre.localeCompare(a.proyecto.p_nombre);
        default:
          return 0;
      }
    });

  return (
    <Layout
      titulo="AGREGAR TAREAS"
      sidebar={<MenuDinamico activeRoute="modificar" />}
    >
      <div className="contenedor-global">
        {/* Barra de búsqueda y select - EXACTAMENTE IGUAL que ModificarTareas */}
        {proyectos.length > 0 && (
          <div className="tp-filtros-container mb-4">
            <div className="tp-search-filter-wrapper">
              {/* Input de búsqueda */}
              <div className="tp-search-box">
                <FaSearch className="tp-search-icon" />
                <input
                  type="text"
                  placeholder="Buscar proyectos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="tp-search-input"
                />
                {busqueda && (
                  <button
                    className="tp-search-clear-btn"
                    onClick={() => setBusqueda("")}
                    aria-label="Limpiar búsqueda"
                  >
                    <FiX />
                  </button>
                )}
              </div>

              {/* Select de filtros */}
              <div className="tp-filter-box">
                <FaFilter className="tp-filter-icon" />
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

            {/* Info de resultados */}
            {(busqueda || filtro !== "alfabetico") && (
              <div className="tp-search-results-info">
                <span className="tp-results-count">{proyectosFiltrados.length}</span>{" "}
                {proyectosFiltrados.length === 1 ? "resultado" : "resultados"} encontrado(s)
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="loader-container">
            <div className="loader-logo">
              <img src={logo3} alt="Cargando" />
            </div>
            <div className="loader-texto">CARGANDO...</div>
            <div className="loader-spinner"></div>
          </div>
        ) : proyectos.length === 0 ? (
          <EmptyState
            titulo="AGREGAR TAREAS"
            mensaje="Actualmente no tienes proyectos a los cuales agregar tareas."
            botonTexto="Volver al Tablero"
            onVolver={volverSegunRol}
            icono={logo3}
          />
        ) : (
          // Renderizamos los proyectos con clases específicas para AgregarT
          proyectosFiltrados.map((p) => (
            <div key={p.proyecto.id_proyecto} className="at-card">
              <h5 className="at-nombre-proyecto">{p.proyecto.p_nombre}</h5>

              <div className="at-info">
  <div className="at-info-item">
    <FaCalendarAlt className="at-info-icon" />
    <span>
      <strong>Inicia:</strong> {p.proyecto.pf_inicio}
    </span>
  </div>
  <div className="at-info-item">
    <FaClock className="at-info-icon" />
    <span>
      <strong>Finaliza:</strong> {p.proyecto.pf_fin}
    </span>
  </div>
</div>

              <div className="at-botones">
                <button
                  className="at-btn-agregar-tarea"
                  onClick={() => handleAgregarTarea(p.proyecto.id_proyecto, p.proyecto.p_nombre)}
                >
                  <FaTasks style={{ marginRight: "8px" }} /> Agregar Tarea
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}

export default TareasPorAgregar;
