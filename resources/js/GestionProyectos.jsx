import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaCheckCircle,
  FaHourglassHalf,
  FaTasks,
  FaSearch,
  FaProjectDiagram,
  FaCalendarAlt,
  FaChartLine, FaLayerGroup,
  FaExclamationTriangle
} from "react-icons/fa";
import "../css/formulario.css";
import "../css/Gestionproyectos.css";
import MenuDinamico from "../components/MenuDinamico";
import Layout from "../components/Layout";
import logo3 from "../imagenes/logo3.png";

const TaskDonutChart = ({ completadas, pendientes, enProceso, total }) => {
  if (total === 0) {
    return (
      <div className="tdj-grafica-circular tdj-sin-tareas">
        <div className="tdj-circular-center">
          <span className="tdj-circular-porcentaje">0%</span>
        </div>
      </div>
    );
  }

  const pctCompletadas = (completadas / total) * 100;
  const pctEnProceso = (enProceso / total) * 100;
  const pctPendientes = (pendientes / total) * 100;

  const gradient = `
    conic-gradient(
      #28a745 0% ${pctCompletadas}%,
      #ffc107 ${pctCompletadas}% ${pctCompletadas + pctEnProceso}%,
      #dc3545 ${pctCompletadas + pctEnProceso}% 100%
    )
  `;

  return (
    <div
      className="tdj-grafica-circular"
      style={{
        background: gradient,
      }}
    >
      <div className="tdj-circular-center">
        <span className="tdj-circular-porcentaje">{Math.round(pctCompletadas)}%</span>
      </div>
    </div>
  );
};

const calcularDiasRestantes = (fechaFin) => {
  if (!fechaFin) return null;
  const hoy = new Date();
  const fin = new Date(fechaFin);
  const diffTime = fin - hoy;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};
// === Componente de tarjeta de métricas===
const MetricCard = ({ icon, number, label, subtext, color, className }) => (
  <div className={`tdu-metrica-card ${className}`}>
    <div className="tdu-metrica-icono" style={{ color }}>
      {icon}
    </div>
    <div className="tdu-metrica-content">
      <div className="tdu-metrica-numero">{number}</div>
      <div className="tdu-metrica-label">{label}</div>
      <div className="tdu-metrica-subtext">{subtext}</div>
    </div>
    <div className="tdu-metrica-decoration"></div>
  </div>
);


function GestionProyectos() {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [tareasCompletadas, setTareasCompletadas] = useState([]);
  const [tareasPendientes, setTareasPendientes] = useState([]);
  const [tareasEnProceso, setTareasEnProceso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [usuario, setUsuario] = useState(null);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  useEffect(() => {
    // Leer usuario y guardarlo en estado para usar en el JSX
    const user = JSON.parse(localStorage.getItem("usuario"));
    setUsuario(user || null);

    if (!user?.id_usuario) {
      // Si no hay usuario, no hay datos que pedir; quitar loader
      setLoading(false);
      return;
    }

    const obtenerDatos = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://127.0.0.1:8000/api/dashboard-departamento?usuario=${user.id_usuario}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();

        if (data) {
          const completadas = (data.tareas || []).filter(t => (t.t_estatus || "").toLowerCase() === 'finalizada');
          const pendientes = (data.tareas || []).filter(t => (t.t_estatus || "").toLowerCase() === 'pendiente');
          const enProceso = (data.tareas || []).filter(t => (t.t_estatus || "").toLowerCase() === 'en proceso');

          setTareasCompletadas(completadas);
          setTareasPendientes(pendientes);
          setTareasEnProceso(enProceso);

          const proyectosConMetricas = (data.proyectos || []).map(proyecto => {
            const tareasDelProyecto = (data.tareas || []).filter(t => t.id_proyecto === proyecto.id_proyecto);
            const diasRestantes = calcularDiasRestantes(proyecto.pf_fin);

            return {
              ...proyecto,
              tareas_completadas: tareasDelProyecto.filter(t => (t.t_estatus || "").toLowerCase() === 'finalizada').length,
              tareas_pendientes: tareasDelProyecto.filter(t => (t.t_estatus || "").toLowerCase() === 'pendiente').length,
              tareas_en_progreso: tareasDelProyecto.filter(t => (t.t_estatus || "").toLowerCase() === 'en proceso').length,
              total_tareas: tareasDelProyecto.length,
              dias_restantes: diasRestantes,
              prioridad: diasRestantes !== null && diasRestantes < 7 ? 'alta' : 'normal'
            };
          });

          setProyectos(proyectosConMetricas);
        }
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- no dependencias; se ejecuta una vez al montar

  const filteredProyectos = proyectos.filter(proyecto =>
    (proyecto.p_nombre || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTareas = tareasCompletadas.length + tareasPendientes.length + tareasEnProceso.length;
  const porcentajeCompletitud = totalTareas > 0 ? Math.round((tareasCompletadas.length / totalTareas) * 100) : 0;

  const irAProyecto = (id, nombre) => {
    localStorage.setItem("id_proyecto", id);
    localStorage.setItem("nombre_proyecto", nombre);
    navigate(`/proyecto/${id}`);
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-logo">
          <img src={logo3} alt="Cargando" />
        </div>
        <div className="loader-texto">CARGANDO...</div>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  return (
    <Layout
      titulo="INICIO"
      sidebar={<MenuDinamico activeRoute="GestionProyectos" />}
    >
      <div className="tdu-contenido">
        <div className="tdu-seccion-bienvenida">
          <div className="tdu-bienvenida-content">
            <h1>¡HOLA, {usuario?.nombre || "Usuario"}!</h1>
            <p>Resumen de proyectos y tareas</p>
          </div>
          <div className="tdu-bienvenido-stats">
            <div className="tdu-stat-item">
              <FaChartLine className="tdu-stat-icono" />
              <div className="tdu-stat-content">
                 <span className="tdu-stat-numero">{filteredProyectos.length}</span>
                  <span className="tdu-stat-label">Proyectos en los que participas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tdj-metrica-grid">

  <MetricCard
    icon={<FaCheckCircle size={28} />}
    number={tareasCompletadas.length}
    label="Tareas Completadas"
    subtext={`${porcentajeCompletitud}% del total`}
    className="tdu-metrica-completadas"
  />

  <MetricCard
    icon={<FaHourglassHalf size={28} />}
    number={tareasPendientes.length}
    label="Pendientes"
    subtext="Por iniciar"
    className="tdu-metrica-pendientes"
  />

  <MetricCard
    icon={<FaTasks size={28} />}
    number={tareasEnProceso.length}
    label="En Progreso"
    subtext="En ejecución"
    className="tdu-metrica-en-progreso"
  />
  <MetricCard
  icon={<FaLayerGroup size={28} />}
  number={totalTareas}
  label="Total de Tareas"
  subtext="Todas las actividades"
  className="tdu-metrica-total"
/>
</div>

<div className="tdu-progreso-general">
  <div className="tdu-progreso-header">
    <h3>Progreso General</h3>
    <span>{porcentajeCompletitud}% completado</span>
  </div>
  <div className="tdu-progreso-barra-container">
    <div 
      className="tdu-progreso-barra-fill" 
      style={{ width: `${porcentajeCompletitud}%` }}
    ></div>
  </div>
  <div className="tdu-progreso-stats">
    <div className="tdu-progreso-stat">
      <span className="tdu-conteo completada"></span>
      <span>Completadas: {tareasCompletadas.length}</span>
    </div>
    <div className="tdu-progreso-stat">
      <span className="tdu-conteo progreso"></span>
      <span>En progreso: {tareasEnProceso.length}</span>
    </div>
    <div className="tdu-progreso-stat">
      <span className="tdu-conteo pendiente"></span>
      <span>Pendientes: {tareasPendientes.length}</span>
    </div>
  </div>
</div>
 

        <div className="tdj-dashboard-content">
          {proyectos.length > 0 && (
  <div className="barra-busqueda-global-container mb-4">
    <div className="barra-busqueda-global-wrapper">
      <FaSearch className="barra-busqueda-global-icon" />
      <input
        type="text"
        placeholder="Buscar proyectos..."
        className="barra-busqueda-global-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  </div>
)}


          <div className="tdj-seccion-proyectos">
            <div className="tdj-seccion-header">
              <h2>Proyectos</h2>
              <div className="tdj-header-accion">
                <span className="tdj-proyecto-conteo">{filteredProyectos.length} proyectos</span>
              </div>
            </div>

           {filteredProyectos.length === 0 ? (
  <div className="tdj-estado-vacio">
    <div className="tdj-sin-icono"><FaProjectDiagram size={40} /></div>

    {proyectos.length === 0 && searchTerm === "" ? (
      <>
        <h3>No tienes proyectos asignados</h3>
        <p>Cuando tengas proyectos, aparecerán aquí</p>
      </>
    ) : (
      <>
        <h3>No hay proyectos que coincidan</h3>
        <p>Intenta buscar con otros términos</p>
      </>
    )}
  </div>
) : (

              <div className="tdj-proyecto-grid">
                {filteredProyectos.map((proyecto) => {
                  const progreso =
                    proyecto.total_tareas > 0
                      ? Math.round((proyecto.tareas_completadas / proyecto.total_tareas) * 100)
                      : 0;

                  const statusClass =
                    progreso === 100 ? "completado" :
                    progreso >= 50 ? "progreso" : "pendiente";

                  return (
                    <div
                      key={proyecto.id_proyecto}
                      className={`tdj-proyecto-card-encabezado ${statusClass}`}
                    >
                      <div className="tdj-project-header">
                        <div className="tdj-proyecto-titulo-seccion">
                          <h3 className="tdj-proyecto-titulo">{proyecto.p_nombre}</h3>
                          {proyecto.descripcion && (
                            <p className="tdj-proyecto-descripcion">
                              {proyecto.descripcion.length > 120
                                ? proyecto.descripcion.slice(0, 120) + "..."
                                : proyecto.descripcion}
                            </p>
                          )}
                        </div>
                        <div className="tdj-proyecto-meta">
                          <span className="tdj-total-tareas">{proyecto.total_tareas} tareas</span>
                          {proyecto.prioridad === 'alta' && (
                            <div className="tdj-prioridad-badge alta">
                              <FaExclamationTriangle size={10} />
                              URGENTE
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="tdj-proyecto-body">
                        <div className="tdj-seccion-graficos">
                          <TaskDonutChart
                            completadas={proyecto.tareas_completadas}
                            pendientes={proyecto.tareas_pendientes}
                            enProceso={proyecto.tareas_en_progreso}
                            total={proyecto.total_tareas}
                          />
                        </div>

                        <div className="tdj-detalles-metricas">
                          <div className="tdj-metrica-item">
                            <div className="tdj-metrica-dot tdj-completada"></div>
                            <span>Completadas</span>
                            <strong>{proyecto.tareas_completadas}</strong>
                          </div>
                          <div className="tdj-metrica-item">
                            <div className="tdj-metrica-dot tdj-progreso"></div>
                            <span>En Progreso</span>
                            <strong>{proyecto.tareas_en_progreso}</strong>
                          </div>
                          <div className="tdj-metrica-item">
                            <div className="tdj-metrica-dot tdj-pendiente"></div>
                            <span>Pendientes</span>
                            <strong>{proyecto.tareas_pendientes}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="tdj-proyecto-info">
                        <div className="tdj-dias">
                          <div className="tdj-dias-item">
                            <FaCalendarAlt size={12} />
                            <span>Inicio:</span>
                            <strong>{proyecto.pf_inicio || "—"}</strong>
                          </div>
                          <div className="tdj-dias-item">
                            <FaCalendarAlt size={12} />
                            <span>Fin:</span>
                            <strong>{proyecto.pf_fin || "—"}</strong>
                          </div>
                        </div>

                        {proyecto.dias_restantes !== null && (
                          <div className="tdj-tiempo-restante">
                            <span className="tdj-tiempo-label">
                              {proyecto.dias_restantes === 0
                                ? "Último día"
                                : `${proyecto.dias_restantes} días restantes`
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="tdj-proyecto-footer">
                        <button
                          className="tdj-btn-primary"
                          onClick={() => irAProyecto(proyecto.id_proyecto, proyecto.p_nombre)}
                        >
                          <FaTasks className="tdj-btn-icon" />
                          Gestionar Proyecto
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
</div>
    </Layout>
  );
}

export default GestionProyectos;
