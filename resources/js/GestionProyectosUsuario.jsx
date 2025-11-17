import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaProjectDiagram,
  FaCheckCircle,
  FaHourglassHalf,
  FaTasks,
  FaSearch,
  FaCalendarAlt,
  FaArrowRight,
  FaChartLine,
  FaLayerGroup
} from "react-icons/fa";
import "../css/formulario.css";
import "../css/Gestionproyectosusuario.css";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import logo3 from "../imagenes/logo3.png";

// === Componente del gráfico circular de tareas ===
const TaskDonutChart = ({ completadas, pendientes, enProceso, total }) => {
  if (total === 0) {
    return (
      <div className="tdu-grafica-circular tdu-sin-tareas">
        <div className="tdu-circular-center">
          <span className="tdu-circular-porcentaje">0%</span>
        </div>
      </div>
    );
  }

  const pctCompletadas = (completadas / total) * 100;
  const pctEnProceso = (enProceso / total) * 100;
  const pctPendientes = (pendientes / total) * 100;



  return (
   <div
  className="tdu-grafica-circular"
  style={{
    "--pct-completadas": `${pctCompletadas}%`,
    "--pct-en-proceso": `${pctEnProceso}%`
  }}
>
      <div className="tdu-circular-center">
       <span className="tdu-circular-porcentaje">{Math.round(pctCompletadas)}%</span>
        <div className="tdu-circular-label">Completado</div>
      </div>
    </div>
  );
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


function GestionProyectosUsuario() {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [conteos, setConteos] = useState({
    completadas: 0,
    pendientes: 0,
    en_progreso: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [usuario, setUsuario] = useState(null);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  // === Obtener proyectos y conteos del usuario ===
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("usuario"));
    if (!userData?.id_usuario) return;
    
    setUsuario(userData);

    const obtenerDatos = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("jwt_token");

        const res = await fetch(
          `http://127.0.0.1:8000/api/usuario/tareas?usuario=${userData.id_usuario}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
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
        const proyectosAPI = data.proyectos || [];
        const conteosAPI = data.conteos || {};

        setProyectos(proyectosAPI);
        setConteos(conteosAPI);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerDatos();
  }, [navigate]);

  // === Filtro por búsqueda ===
  const filteredProyectos = proyectos.filter((proyecto) =>
    proyecto.p_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // === Porcentaje global de completitud ===
  const porcentajeCompletitud =
    conteos.total > 0 ? Math.round((conteos.completadas / conteos.total) * 100) : 0;

  // === Navegar a la vista de tareas ===
  const irATareas = (idProyecto, nombreProyecto) => {
    localStorage.setItem("id_proyecto", idProyecto);
    localStorage.setItem("nombre_proyecto", nombreProyecto);
    navigate("/tareasusuario");
  };

  // === Pantalla de carga ===
  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-logo"><img src={logo3} alt="Cargando" /></div>
        <div className="loader-texto">CARGANDO...</div>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  return (
           <Layout
    titulo="INICIO"
    sidebar={<MenuDinamico activeRoute="gestion-proyectosusuario" />}
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
                  <span className="tdu-stat-numero">{proyectos.length}</span>
                  <span className="tdu-stat-label">Proyectos en los que participas</span>
                </div>
              </div>
            </div>
          </div>
          <div className="tdu-metrica-grid">
            <MetricCard
  icon={<FaCheckCircle size={24} />}
  number={conteos.completadas}
  label="Tareas Completadas"
  subtext={`${porcentajeCompletitud}% del total`}
  color="#fff"
  className="tdu-metrica-completadas"
/>

<MetricCard
  icon={<FaHourglassHalf size={24} />}
  number={conteos.pendientes}
  label="Pendientes"
  subtext="Por iniciar"
  color="#fff"
  className="tdu-metrica-pendientes"
/>

<MetricCard
  icon={<FaTasks size={24} />}
  number={conteos.en_progreso}
  label="En Progreso"
  subtext="En ejecución"
  color="#fff"
  className="tdu-metrica-en-progreso"
/>

<MetricCard
  icon={<FaLayerGroup size={24} />}
  number={conteos.total}
  label="Total de Tareas"
  subtext="Todas las actividades"
  color="#fff"
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
                <span>Completadas: {conteos.completadas}</span>
              </div>
              <div className="tdu-progreso-stat">
                <span className="tdu-conteo progreso"></span>
                <span>En progreso: {conteos.en_progreso}</span>
              </div>
              <div className="tdu-progreso-stat">
                <span className="tdu-conteo pendiente"></span>
                <span>Pendientes: {conteos.pendientes}</span>
              </div>
            </div>
          </div>
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

          {/* === Lista de proyectos  === */}
          <div className="tdu-mis-proyectos">
            <div className="tdu-mis-proyectos-header">
              <div className="tdu-mis-proyectos-titulo">
                <FaProjectDiagram className="tdu-mis-proyectos-titulo-icon" />
                <h2>Mis Proyectos</h2>
              </div>
              <div className="tdu-header-actions">
                <span className="tdu-numero-proyectos">
                  {filteredProyectos.length} {filteredProyectos.length === 1 ? 'proyecto' : 'proyectos'}
                </span>
              </div>
            </div>

            {filteredProyectos.length === 0 ? (
              <div className="tdu-empty-state">
                <div className="tdu-empty-icon"><FaProjectDiagram size={48} /></div>
                <h3>{searchTerm ? "No se encontraron proyectos" : "No tienes proyectos activos"}</h3>
                <p>{searchTerm ? "Intenta con otros términos de búsqueda" : "Cuando se te asignen proyectos, aparecerán aquí"}</p>
              </div>
            ) : (
              <div className="tdu-proyectos-grid">
                {filteredProyectos.map((proyecto) => (
                  <div key={proyecto.id_proyecto} className="tdu-proyectos-card">
                    <div className="tdu-proyectos-header">
                      <div className="tdu-proyectos-title-section">
                        <h3 className="tdu-proyectos-title">{proyecto.p_nombre}</h3>
                        <div className="tdu-proyectos-dates">
                          <FaCalendarAlt className="tdu-date-icon" />
                          <span>{proyecto.pf_inicio} - {proyecto.pf_fin}</span>
                        </div>
                      </div>
                     <div className="tdu-proyectos-badge">
  <span>
    {proyecto.total_tareas} {proyecto.total_tareas === 1 ? 'tarea' : 'tareas'}
  </span>
</div>

                    </div>

                    <div className="tdu-proyectos-content">
                      <div className="tdu-grafica">
                        <TaskDonutChart
                          completadas={proyecto.tareas_completadas}
                          pendientes={proyecto.tareas_pendientes}
                          enProceso={proyecto.tareas_en_progreso}
                          total={proyecto.total_tareas}
                        />
                      </div>

                      <div className="tdu-resumen-proyecto">
                        <div className="tdu-tarea-indicador tdu-completada">
                          <span className="tdu-tarea-count">{proyecto.tareas_completadas}</span>
                          <span className="tdu-tarea-etiqueta">Completadas</span>
                        </div>
                        <div className="tdu-tarea-indicador tdu-progreso">
                          <span className="tdu-tarea-count">{proyecto.tareas_en_progreso}</span>
                          <span className="tdu-tarea-etiqueta">En Progreso</span>
                        </div>
                        <div className="tdu-tarea-indicador tdu-pendiente">
                          <span className="tdu-tarea-count">{proyecto.tareas_pendientes}</span>
                          <span className="tdu-tarea-etiqueta">Pendientes</span>
                        </div>
                      </div>
                    </div>

                    {/* Información del proyecto */}
                    {proyecto.descripcion_proyecto && (
                      <div className="tdu-proyecto-description">
                        <p>{proyecto.descripcion_proyecto}</p>
                      </div>
                    )}

                    <div className="tdu-proyecto-footer">
                      <button
                        className="tdu-btn-primary"
                        onClick={() => irATareas(proyecto.id_proyecto, proyecto.p_nombre)}
                      >
                        <span>Ver Tareas</span>
                        <FaArrowRight className="tdu-btn-icon" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
  );
}

export default GestionProyectosUsuario;




