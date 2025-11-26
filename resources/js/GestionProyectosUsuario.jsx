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

// === Componente del gráfico circular de tareas (Actualizado estilo Gradiente) ===
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
  
  // Gradiente cónico para igualar el estilo de GestionProyectos
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
      style={{ background: gradient }}
    >
      <div className="tdj-circular-center">
        <span className="tdj-circular-porcentaje">{Math.round(pctCompletadas)}%</span>
      </div>
    </div>
  );
};

// === Componente de tarjeta de métricas (Dashboard superior) ===
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
  const fin = new Date(fechaFin);
  const diffTime = fin - hoy;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
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

        {/* === LISTA DE PROYECTOS (ESTILO TARJETAS ACTUALIZADO) === */}
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
            <div className="tdj-proyecto-grid">
              {filteredProyectos.map((proyecto) => {
                // Lógica para color de borde
                const progreso = proyecto.total_tareas > 0
                  ? Math.round((proyecto.tareas_completadas / proyecto.total_tareas) * 100)
                  : 0;

                let statusClass = "pendiente";
                if (progreso === 100) statusClass = "completado";
                else if (progreso >= 50) statusClass = "progreso";

                // Cálculo de días restantes
                const diasRestantes = calcularDiasRestantes(proyecto.pf_fin);

                return (
                  <div
                    key={proyecto.id_proyecto}
                    className={`tdj-proyecto-card-encabezado ${statusClass}`}
                  >
                    {/* 1. Encabezado de la Tarjeta */}
                    <div className="tdj-project-header">
                      <div className="tdj-proyecto-titulo-seccion">
                        <h3 className="tdj-proyecto-titulo">{proyecto.p_nombre}</h3>
                        {proyecto.descripcion_proyecto && (
                          <p className="tdj-proyecto-descripcion">
                            {proyecto.descripcion_proyecto.length > 120
                              ? proyecto.descripcion_proyecto.slice(0, 120) + "..."
                              : proyecto.descripcion_proyecto}
                          </p>
                        )}
                      </div>
                      <div className="tdj-proyecto-meta">
                        <span className="tdj-total-tareas">{proyecto.total_tareas} tareas</span>
                        {diasRestantes !== null && diasRestantes < 7 && (
                          <div className="tdj-prioridad-badge alta">
                            <FaExclamationTriangle size={10} style={{marginRight: '4px'}}/>
                            URGENTE
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. Cuerpo: Gráfica y Métricas */}
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

                    {/* 3. Info: Fechas y Días Restantes */}
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

                      {diasRestantes !== null && (
                        <div className="tdj-tiempo-restante">
                          <span className="tdj-tiempo-label">
                            {diasRestantes === 0
                              ? "Último día"
                              : `${diasRestantes} días restantes`
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 4. Footer: Botón */}
                    <div className="tdj-proyecto-footer">
                      <button
                        className="tdj-btn-primary"
                        onClick={() => irATareas(proyecto.id_proyecto, proyecto.p_nombre)}
                      >
                        <FaTasks className="tdj-btn-icon" />
                        Ver Tareas
                      </button>
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



