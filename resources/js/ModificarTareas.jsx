import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/ModificarTareas.css";
import { FaClock, FaSearch, FaTasks, FaCalendarAlt,  FaEdit,FaFilter} from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";
import { useAuthGuard } from "../hooks/useAuthGuard";
import SelectDinamico from "../components/SelectDinamico";


function ModificarTareas() {
  useAuthGuard();
  const navigate = useNavigate();
  const { volverSegunRol } = useRolNavigation();
const API_URL = import.meta.env.VITE_API_URL;
  const [busqueda, setBusqueda] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("alfabetico");
  const opciones = [
  { value: "alfabetico", label: "Orden alfabético (A-Z)" },
  { value: "alfabetico_desc", label: "Orden alfabético (Z-A)" },
];

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
  `${API_URL}/api/tareasPorDepartamento?usuario=${usuario.id_usuario}`,
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

 const handleModificarTarea = (tarea) => {
  navigate("/EditarTareas", { state: { tarea } });
};


  return (
    <Layout titulo="MODIFICAR TAREAS" sidebar={<MenuDinamico activeRoute="modificar" />}>
  <div className="contenedor-global">

    {proyectos.length > 0 && (
      <div className="tp-filtros-container mb-4">
  <div className="tp-search-filter-wrapper">
 
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
    titulo="MODIFICAR TAREAS"
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
                    onClick={() => handleModificarTarea(tarea)}
                  >
                    <FaEdit style={{ marginRight: "8px" }} /> Modificar
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

  </div>
</Layout>

  );
}

export default ModificarTareas;





