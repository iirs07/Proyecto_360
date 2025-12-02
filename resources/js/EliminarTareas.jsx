import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/EliminarTareas.css";
import { FaTrash, FaSearch, FaTasks, FaCalendarAlt,  FaEdit} from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";
import SelectDinamico from "../components/SelectDinamico";
import ConfirmModal from "../components/ConfirmModal";


function EliminarTareas() {
  const navigate = useNavigate();
  const { volverSegunRol } = useRolNavigation();
const [modalOpen, setModalOpen] = useState(false);
const [tareaAEliminar, setTareaAEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("alfabetico");
  const opciones = [
  { value: "alfabetico", label: "Nombre (A-Z)" },
  { value: "alfabetico_desc", label: "Nombre (Z-A)" },
  { value: "fecha_proxima", label: "Fecha más próxima" },
  { value: "fecha_lejana", label: "Fecha más lejana" },
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
        `http://127.0.0.1:8000/api/EliminarTareasPorDepartamento?usuario=${usuario.id_usuario}`,
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

const eliminarTarea = async () => {
  if (!tareaAEliminar) return;

  try {
    const token = sessionStorage.getItem("jwt_token");
    const res = await fetch(
      `http://127.0.0.1:8000/api/EliminarTarea/${tareaAEliminar.id_tarea}`,
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
    <Layout titulo="ELIMINAR TAREAS" sidebar={<MenuDinamico activeRoute="modificar" />}>
  <div className="contenedor-global">
    {/* Barra de búsqueda y select */}
    {proyectos.length > 0 && (
      <div className="barra-busqueda-global-container mb-4">
        <div className="barra-busqueda-global-wrapper">
          <FaSearch className="barra-busqueda-global-icon" />
          <input
            type="text"
            placeholder="Buscar proyectos o tareas..."
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
         {busqueda && (
                <div className="buscador-verproyectos-resultados-info">
                  {proyectosFiltrados.length} resultado(s) para "{busqueda}"
                </div>
              )}
        {proyectosFiltrados.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <SelectDinamico
              opciones={opciones.map((o) => o.label)}
              valor={opciones.find((o) => o.value === filtro)?.label}
              setValor={(labelSeleccionado) => {
                const opcion = opciones.find((o) => o.label === labelSeleccionado);
                if (opcion) setFiltro(opcion.value);
              }}
              placeholder="Selecciona un filtro"
            />
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
  // EmptyState solo cuando backend NO devolvió proyectos
  <EmptyState
    titulo="ELIMINAR TAREAS"
    mensaje="No hay proyectos disponibles."
    botonTexto="Volver al Tablero"
    onVolver={volverSegunRol}
    icono={logo3}
  />
) : (
  
  proyectosFiltrados.map(({ proyecto, tareas }) => (
    <div key={proyecto.id_proyecto} className="et-card">
      <h5 className="et-nombre-proyecto">{proyecto.p_nombre}</h5>

      <div className="et-info">
        <div className="et-info-item">
          <FaTasks className="et-info-icon" />
          <span>
            <strong>Tareas:</strong> {tareas.length}
          </span>
        </div>
      </div>

      {tareas.length > 0 ? (
        <ul className="et-tareas-lista">
          {tareas.map((tarea) => (
            <li key={tarea.id_tarea} className="et-item-en-proceso">
              <div className="et-info">
                <div className="et-header">
                  <label className="et-nombre-tarea">{tarea.t_nombre}</label>
                </div>
                <div className="et-footer">
                  <span className={`et-estatus ${tarea.t_estatus?.toLowerCase().replace(' ', '-')}`}>
                    {tarea.t_estatus}
                  </span>
                  <span className="et-fecha">
                    <FaCalendarAlt className="et-fecha-icon" />
                    Vence: {tarea.tf_fin || tarea.fechaVencimiento}
                  </span>

                  <button
                    className="et-btn-tarea"
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




