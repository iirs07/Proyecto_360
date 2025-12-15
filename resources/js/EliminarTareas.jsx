import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/EliminarTareas.css"; 
import { FaTrash, FaSearch, FaTasks, FaCalendarAlt, FaEdit, FaFilter} from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";
import SelectDinamico from "../components/SelectDinamico";
import { useAuthGuard } from "../hooks/useAuthGuard";
import ConfirmModal from "../components/ConfirmModal";


function EliminarTareas() {
   useAuthGuard();
  const navigate = useNavigate();
  const { volverSegunRol } = useRolNavigation();
  const [modalOpen, setModalOpen] = useState(false);
  const [tareaAEliminar, setTareaAEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("alfabetico");
const API_URL = import.meta.env.VITE_API_URL;

  const opciones = [
    { value: "alfabetico", label: "Orden alfabético (A-Z)" },
    { value: "alfabetico_desc", label: "Orden alfabético (Z-A)" },
 
    { value: "fecha_proxima", label: "Fecha más próxima" },
    { value: "fecha_lejana", label: "Fecha más lejana" },
  ];

  // --- 1. CARGA DE DATOS ---
  useEffect(() => {
    
    const fetchTareasPorProyecto = async () => {
      try {
        const usuario = JSON.parse(sessionStorage.getItem("usuario"));
        const token = sessionStorage.getItem("jwt_token"); 

        if (!usuario?.id_usuario || !token) {
          setLoading(false); 
          return;
        }

      const res = await fetch(
  `${API_URL}/api/EliminarTareasPorDepartamento?usuario=${usuario.id_usuario}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, 
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (res.status === 401) {
          sessionStorage.removeItem("jwt_token");
          sessionStorage.removeItem("usuario");
          navigate("/Login", { replace: true });
          return;
        }

        const data = await res.json();

        if (data.success) {
          setProyectos(data.proyectos);
        } else {
          console.error("Error al cargar proyectos y tareas:", data.mensaje);
        }
      } catch (error) {
        console.error("Error al cargar proyectos y tareas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTareasPorProyecto();
  }, [navigate]);


  // --- 2. FILTRO ---
  const proyectosFiltrados = proyectos
    .map(({ proyecto, tareas }) => {
      const proyectoCoincide = proyecto.p_nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase());

      const tareasFiltradas = proyectoCoincide
        ? tareas
        : tareas.filter((t) =>
            t.t_nombre?.toLowerCase().includes(busqueda.toLowerCase())
          );

      return {
        proyecto,
        tareas: tareasFiltradas,
        mostrar: proyectoCoincide || tareasFiltradas.length > 0,
      };
    })
    .filter(({ mostrar }) => mostrar);

  // --- 3. ACCIONES ---
  const eliminarTarea = async () => {
    if (!tareaAEliminar) return;

    try {
      const token = sessionStorage.getItem("jwt_token");
      const res = await fetch(
  `${API_URL}/api/EliminarTarea/${tareaAEliminar.id_tarea}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        // Actualizar el estado para eliminar la tarea de la UI
        setProyectos((prevProyectos) =>
          prevProyectos.map(({ proyecto, tareas }) => ({
            proyecto,
            tareas: tareas.filter((t) => t.id_tarea !== tareaAEliminar.id_tarea),
          }))
        );
        setModalOpen(false);
        setTareaAEliminar(null);
      } else {
        console.error("Error al eliminar la tarea:", data.message || data.error);
      }
    } catch (error) {
      console.error("Error al eliminar la tarea:", error);
    }
  };

  const handleEliminarClick = (tarea) => {
    setTareaAEliminar(tarea);
    setModalOpen(true);
  };


  return (
    <Layout titulo="ELIMINAR TAREAS" sidebar={<MenuDinamico activeRoute="eliminar" />}>
      <div className="contenedor-global">
        {/* Barra de búsqueda y select - ESTRUCTURA DE MODIFICARTAREAS */}
        {proyectos.length > 0 && (
          <div className="tp-filtros-container mb-4">
            <div className="tp-search-filter-wrapper">
              {/* Input de búsqueda */}
              <div className="tp-search-box">
                <FaSearch className="tp-search-icon" />
                <input
                  type="text"
                  placeholder="Buscar proyectos o tareas..."
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
            titulo="ELIMINAR TAREAS"
            mensaje="No hay proyectos disponibles."
            botonTexto="Volver al Tablero"
            onVolver={volverSegunRol}
            icono={logo3}
          />
        ) : (
       
          proyectosFiltrados.map(({ proyecto, tareas }) => (
            <div key={proyecto.id_proyecto} className="mt-card">
              <h5 className="mt-nombre-proyecto">{proyecto.p_nombre}</h5>

              <div className="mt-info">
                <div className="mt-info-item">
                  <FaTasks className="mt-info-icon" />
                  <span>
                    <strong>Tareas: {tareas.length}</strong>
                  </span>
                </div>
              </div>

              {tareas.length > 0 ? (
                <ul className="mt-tareas-lista">
                  {tareas.map((tarea) => (
                    <li key={tarea.id_tarea} className="mt-item-en-proceso">
                      <div className="mt-info">
                        <div className="mt-header">
                          <label className="mt-nombre-tarea">{tarea.t_nombre}</label>
                        </div>
                        <div className="mt-footer">
                          <span className={`mt-estatus ${tarea.t_estatus?.toLowerCase().replace(' ', '-')}`}>
                            {tarea.t_estatus}
                          </span>
                          <span className="mt-fecha">
                            <FaCalendarAlt className="mt-fecha-icon" />
                            Vence: {tarea.tf_fin || tarea.fechaVencimiento}
                          </span>

                          <button
                            className="mt-btn-modificar-tarea" 
                            onClick={() => handleEliminarClick(tarea)}
                           
                          >
                            <FaTrash style={{ marginRight: "8px" }} /> Eliminar
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null }
            </div>
          ))
        )}

        <ConfirmModal
          isOpen={modalOpen}
          title="Confirmar eliminación"
          message={`¿Estás seguro que deseas eliminar la tarea "${tareaAEliminar?.t_nombre}"?`}
          onConfirm={eliminarTarea}
          onCancel={() => setModalOpen(false)}
        />

      </div>
    </Layout>

  );
}

export default EliminarTareas;




