import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/ModificarTareas.css";
import { FaClock, FaSearch, FaTasks, FaCalendarAlt,  FaEdit} from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";
import SelectDinamico from "../components/SelectDinamico";


function ModificarTareas() {
  const navigate = useNavigate();
  const { volverSegunRol } = useRolNavigation();

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

  // --- 1. CARGA DE DATOS ---
  useEffect(() => {
  const fetchTareasPorProyecto = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      const token = localStorage.getItem("jwt_token"); // <-- obtener token

      if (!usuario?.id_usuario || !token) {
        setLoading(false); 
        return;
      }

      const res = await fetch(
        `http://127.0.0.1:8000/api/tareasPorDepartamento?usuario=${usuario.id_usuario}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, 
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("usuario");
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
 const handleModificarTarea = (tarea) => {
  navigate("/EditarTareas", { state: { tarea } });
};


  return (
    <Layout titulo="MODIFICAR TAREAS" sidebar={<MenuDinamico activeRoute="modificar" />}>
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

    {/* Lista de proyectos y tareas */}
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
                <strong>Tareas:</strong> {tareas.length}
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
                            <FaEdit style={{ marginRight: "8px" }} /> 
                            Modificar
                          </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              titulo="MODIFICAR TAREAS"
              mensaje="No hay tareas disponibles para este proyecto."
              botonTexto="Volver al Tablero"
              onVolver={volverSegunRol}
              icono={logo3}
            />
          )}
        </div>
      ))
    )}
  </div>
</Layout>

  );
}

export default ModificarTareas;





