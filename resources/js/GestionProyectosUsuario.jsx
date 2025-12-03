import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaProjectDiagram,
  FaCheckCircle,
  FaHourglassHalf,
  FaTasks,
  FaSearch,
  FaCalendarAlt,
  FaChartLine,
  FaLayerGroup,
  FaExclamationTriangle
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
  
  const gradient = `
    conic-gradient(
      #28a745 0% ${pctCompletadas}%,
      #ffc107 ${pctCompletadas}% ${pctCompletadas + pctEnProceso}%,
      #dc3545 ${pctCompletadas + pctEnProceso}% 100%
    )
  `;

  return (
    <div
      className="tdu-grafica-circular"
      style={{ background: gradient }}
    >
      <div className="tdu-circular-center">
        <span className="tdu-circular-porcentaje">{Math.round(pctCompletadas)}%</span>
      </div>
    </div>
  );
};

// === Componente de tarjeta de métricas ===
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

// Función auxiliar para calcular días
const calcularDiasRestantes = (fechaFin) => {
  if (!fechaFin) return null;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); 
  const fin = new Date(fechaFin.includes("T") ? fechaFin : `${fechaFin}T00:00:00`);
  fin.setHours(0, 0, 0, 0);

  const diffTime = fin - hoy;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays; 
};

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
  const [searchTerm, setSearchTerm] = useState("");
  const [usuario, setUsuario] = useState(null);

  // === Obtener proyectos y conteos del usuario ===
  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("usuario"));
    if (!userData?.id_usuario) return;
    
    setUsuario(userData);

    const obtenerDatos = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("jwt_token");

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
          sessionStorage.removeItem("jwt_token");
          sessionStorage.removeItem("usuario");
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
    (proyecto.p_nombre || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // === Porcentaje global de completitud ===
  const porcentajeCompletitud =
    conteos.total > 0 ? Math.round((conteos.completadas / conteos.total) * 100) : 0;
  const pctCompletadas = conteos.total > 0 ? (conteos.completadas / conteos.total) * 100 : 0;
  const pctEnProceso = conteos.total > 0 ? (conteos.en_progreso / conteos.total) * 100 : 0; 
  const pctPendientes = conteos.total > 0 ? (conteos.pendientes / conteos.total) * 100 : 0;

  // === Navegar a la vista de tareas ===
  const irATareas = (idProyecto, nombreProyecto) => {
    sessionStorage.setItem("id_proyecto", idProyecto);
    sessionStorage.setItem("nombre_proyecto", nombreProyecto);
    navigate("/tareasusuario");
  };

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
        
        {/* === HEADER BIENVENIDA === */}
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

        {/* === MÉTRICAS SUPERIORES === */}
        <div className="tdu-metrica-grid">
          <MetricCard
            icon={<FaLayerGroup size={24} />}
            number={conteos.total}
            label="Total de tareas"
            subtext="Todas las actividades"
            color="#fff"
            className="tdu-metrica-total"
          />
          <MetricCard
            icon={<FaCheckCircle size={24} />}
            number={conteos.completadas}
            label="Tareas finalizadas"
            subtext={`${porcentajeCompletitud}% del total`}
            color="#fff"
            className="tdu-metrica-completadas"
          />
          <MetricCard
            icon={<FaHourglassHalf size={24} />}
            number={conteos.pendientes}
            label="Tareas pendientes"
            subtext="Por iniciar"
            color="#fff"
            className="tdu-metrica-pendientes"
          />
          <MetricCard
            icon={<FaTasks size={24} />}
            number={conteos.en_progreso}
            label="Tareas en proceso"
            subtext="En ejecución"
            color="#fff"
            className="tdu-metrica-en-progreso"
          />
        </div>

        {/* === BARRA DE PROGRESO GLOBAL === */}
        <div className="tdu-progreso-general">
          <div className="tdu-progreso-header">
            <h3>Progreso General</h3>
            <span>{porcentajeCompletitud}% completado</span>
          </div>
          <div className="tdu-progreso-barra-container">
            {pctCompletadas > 0 && (
              <div 
                className="tdu-progreso-segmento completada" 
                style={{ width: `${pctCompletadas}%` }}
                title={`Completadas: ${conteos.completadas}`}
              ></div>
            )}
            {pctEnProceso > 0 && (
              <div 
                className="tdu-progreso-segmento progreso" 
                style={{ width: `${pctEnProceso}%` }}
                title={`En Progreso: ${conteos.en_progreso}`}
              ></div>
            )}
            {pctPendientes > 0 && (
              <div 
                className="tdu-progreso-segmento pendiente" 
                style={{ width: `${pctPendientes}%` }}
                title={`Pendientes: ${conteos.pendientes}`}
              ></div>
            )}
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

        {/* === BUSCADOR GLOBAL === */}
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

        {/* === LISTA DE PROYECTOS === */}
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
            <div className="tdu-proyecto-grid">
              {filteredProyectos.map((proyecto) => {
                
                // 1. Cálculos de progreso y fechas
                const progreso = proyecto.total_tareas > 0
                  ? Math.round((proyecto.tareas_completadas / proyecto.total_tareas) * 100)
                  : 0;
                
                let statusClass = "pendiente";
                if (progreso === 100) statusClass = "completado";
                else if (progreso >= 50) statusClass = "progreso";

                const diasRestantes = calcularDiasRestantes(proyecto.pf_fin);
                const esVencido = diasRestantes < 0 && progreso < 100;

                // 2. Determinar la clase adicional para la etiqueta de tiempo
                let estadoTiempoClass = "";
                if (progreso === 100) {
                    estadoTiempoClass = "finalizado";
                } else if (diasRestantes < 0) {
                    estadoTiempoClass = "vencido";
                }

                return (
                  <div
                    key={proyecto.id_proyecto}
                    className={`tdu-proyecto-card-encabezado ${statusClass}`}
                  >
                    <div className="tdu-project-header">
                      <div className="tdu-proyecto-titulo-seccion">
                        <h3 className="tdu-proyecto-titulo">{proyecto.p_nombre}</h3>
                        {proyecto.descripcion_proyecto && (
                          <p className="tdu-proyecto-descripcion">
                            {proyecto.descripcion_proyecto}
                          </p>
                        )}
                      </div>
                      
                      <div className="tdu-proyecto-meta">
                        <span className="tdu-total-tareas">
                        {proyecto.total_tareas} {proyecto.total_tareas === 1 ? 'tarea' : 'tareas'}
                        </span>
                        {esVencido && (
                          <div className="tdu-prioridad-badge">
                            <FaExclamationTriangle size={10} style={{ marginRight: '4px' }} />
                            VENCIDO
                          </div>
                        )}
                        {!esVencido && diasRestantes !== null && diasRestantes >= 0 && diasRestantes < 7 && (
                          <div className="tdu-prioridad-badge alta">
                            <FaExclamationTriangle size={10} style={{ marginRight: '4px' }} />
                            URGENTE
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="tdu-proyecto-body">
                      <div className="tdu-seccion-graficos">
                        <TaskDonutChart
                          completadas={proyecto.tareas_completadas}
                          pendientes={proyecto.tareas_pendientes}
                          enProceso={proyecto.tareas_en_progreso}
                          total={proyecto.total_tareas}
                        />
                      </div>

                      <div className="tdu-detalles-metricas">
                        <div className="tdu-metrica-item">
                          <div className="tdu-metrica-dot tdu-completada"></div>
                          <span>Completadas</span>
                          <strong>{proyecto.tareas_completadas}</strong>
                        </div>
                        <div className="tdu-metrica-item">
                          <div className="tdu-metrica-dot tdu-progreso"></div>
                          <span>En Progreso</span>
                          <strong>{proyecto.tareas_en_progreso}</strong>
                        </div>
                        <div className="tdu-metrica-item">
                          <div className="tdu-metrica-dot tdu-pendiente"></div>
                          <span>Pendientes</span>
                          <strong>{proyecto.tareas_pendientes}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="tdu-proyecto-info">
                      <div className="tdu-dias">
                        <div className="tdu-dias-item">
                          <FaCalendarAlt size={12} />
                          <span>Inicio:</span>
                          <strong>{proyecto.pf_inicio || "—"}</strong>
                        </div>
                        <div className="tdu-dias-item">
                          <FaCalendarAlt size={12} />
                          <span>Fin:</span>
                          <strong>{proyecto.pf_fin || "—"}</strong>
                        </div>
                      </div>

                      {diasRestantes !== null && (
                        <div className="tdu-tiempo-restante">
               
                          <span className={`tdu-tiempo-label ${estadoTiempoClass}`}>
                            {(() => {
                              if (progreso === 100) return "Proyecto Finalizado";
                              if (diasRestantes < 0) return `Venció hace ${Math.abs(diasRestantes)} días`;
                              if (diasRestantes === 0) return "Último día (Hoy)";
                              return `${diasRestantes} días restantes`;
                            })()}
                          </span>
                        </div>
                      )}
                    </div>

                   
                    <div className="tdu-proyecto-footer">
                      {progreso < 100 && (
                        <button
                          className="tdu-btn-primary"
                          onClick={() => irATareas(proyecto.id_proyecto, proyecto.p_nombre)}
                        >
                          <FaTasks className="tdu-btn-icon" />
                          Ver Tareas
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default GestionProyectosUsuario;


