import React, { useEffect, useState, useMemo, useCallback } from "react"; 
import { useNavigate } from "react-router-dom";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { useAuthGuard } from "../hooks/useAuthGuard";
import {
  FaPlus,
  FaCheckCircle,
  FaHourglassHalf,
  FaTasks,
  FaSearch,
  FaProjectDiagram,
  FaCalendarAlt,
  FaLayerGroup,
  FaExclamationTriangle,
  FaClipboardList,
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
          <span className="tdj-circular-porcentaje">N/A</span>
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
      className="tdj-grafica-circular"
      style={{
        background: gradient,
      }}
    >
      <div className="tdj-circular-center">
        <span className="tdj-circular-porcentaje">
          {Math.round(pctCompletadas)}%
        </span>
      </div>
    </div>
  );
};

const calcularDiasRestantes = (fechaFin) => {
  if (!fechaFin) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(
    fechaFin.includes("T") ? fechaFin : `${fechaFin}T00:00:00`
  );
  fin.setHours(0, 0, 0, 0);

  const diffTime = fin - hoy;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

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
   useAuthGuard();
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [tareasCompletadas, setTareasCompletadas] = useState([]);
  const [tareasPendientes, setTareasPendientes] = useState([]);
  const [tareasEnProceso, setTareasEnProceso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;
  const [departamento, setDepartamento] = useState(null);

  

  const agregarTarea = (idProyecto, nombreProyecto) => {
    navigate("/agregarTareas", {
      state: { id_proyecto: idProyecto, nombre_proyecto: nombreProyecto },
    });
  };

  const verTareas = (idProyecto, nombreProyecto) => {
    sessionStorage.setItem("id_proyecto", idProyecto);
    if (nombreProyecto)
      sessionStorage.setItem("nombre_proyecto", nombreProyecto);
    navigate("/ListaDeTareas", { state: { id_proyecto: idProyecto } });
  };

 useEffect(() => {
  const usuarioData = JSON.parse(sessionStorage.getItem("usuario"));
  setUsuario(usuarioData);
}, []);

  const obtenerDatos = useCallback(async () => {
    const token = sessionStorage.getItem("jwt_token");
const usuario = JSON.parse(sessionStorage.getItem("usuario"));

if (!token || !usuario?.id_usuario) {
  navigate("/Login", { replace: true });
  return;
}
    try {
      const res = await fetch(
        `${API_URL}/api/dashboard-departamento?usuario=${usuario.id_usuario}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      
  if (res.status === 401) {
    sessionStorage.clear();
    navigate("/Login", { replace: true });
    return;
  }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.departamento) {
  setDepartamento(data.departamento);
}

      if (data) {
        const completadas = (data.tareas || []).filter(
          (t) => (t.t_estatus || "").toLowerCase() === "completada"
        );
        const pendientes = (data.tareas || []).filter(
          (t) => (t.t_estatus || "").toLowerCase() === "pendiente"
        );
        const enProceso = (data.tareas || []).filter(
          (t) => (t.t_estatus || "").toLowerCase() === "en proceso"
        );

        setTareasCompletadas(completadas);
        setTareasPendientes(pendientes);
        setTareasEnProceso(enProceso);

        const proyectosConMetricas = (data.proyectos || []).map((proyecto) => {
          const tareasDelProyecto = (data.tareas || []).filter(
            (t) => t.id_proyecto === proyecto.id_proyecto
          );

          const proyectoFinalizado =
            (proyecto.p_estatus || "").toLowerCase() === "finalizado";

          const diasRestantes = calcularDiasRestantes(proyecto.pf_fin);

          return {
            ...proyecto,
            tareas_completadas: tareasDelProyecto.filter(
              (t) => (t.t_estatus || "").toLowerCase() === "completada"
            ).length,
            tareas_pendientes: tareasDelProyecto.filter(
              (t) => (t.t_estatus || "").toLowerCase() === "pendiente"
            ).length,
            tareas_en_progreso: tareasDelProyecto.filter(
              (t) => (t.t_estatus || "").toLowerCase() === "en proceso"
            ).length,
            total_tareas: tareasDelProyecto.length,
            prioridad: proyectoFinalizado
              ? "ninguna"
              : diasRestantes !== null && diasRestantes < 3
              ? "alta"
              : "normal",
          };
        });

        setProyectos(proyectosConMetricas);
      }
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]); 

  useAutoRefresh(obtenerDatos, 5000);

  useEffect(() => {
    obtenerDatos();
  }, [obtenerDatos]);


  const filteredProyectos = proyectos.filter((proyecto) =>
    (proyecto.p_nombre || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const estadisticas = useMemo(() => {
    let tareasCompletadasCount = 0;
    let tareasEnProcesoCount = 0;
    let tareasPendientesCount = 0;
    let totalTareasCount = 0;
    let proyectosVaciosCount = 0;

    proyectos.forEach((proyecto) => {
      tareasCompletadasCount += proyecto.tareas_completadas || 0;
      tareasEnProcesoCount += proyecto.tareas_en_progreso || 0;
      tareasPendientesCount += proyecto.tareas_pendientes || 0;
      totalTareasCount += proyecto.total_tareas || 0;

      if ((proyecto.total_tareas || 0) === 0) {
        proyectosVaciosCount++;
      }
    });

    const porcentajeCompletitud =
      totalTareasCount > 0
        ? Math.round((tareasCompletadasCount / totalTareasCount) * 100)
        : 0;

    return {
      tareasCompletadas: tareasCompletadasCount,
      tareasEnProceso: tareasEnProcesoCount,
      tareasPendientes: tareasPendientesCount,
      porcentajeCompletitud,
      totalTareas: totalTareasCount,
      proyectosVacios: proyectosVaciosCount,
    };
  }, [proyectos]);

  const BarraProgresoGeneral = () => {
    const total = estadisticas.totalTareas;
    const pctCompletadas =
      total > 0 ? (estadisticas.tareasCompletadas / total) * 100 : 0;
    const pctEnProceso =
      total > 0 ? (estadisticas.tareasEnProceso / total) * 100 : 0;
    const pctPendientes =
      total > 0 ? (estadisticas.tareasPendientes / total) * 100 : 0;

    return (
      <div className="tdu-progreso-general">
        <div className="tdu-progreso-header">
          <div>
            <h3>Progreso General</h3>
            {estadisticas.proyectosVacios > 0 && (
              <small
                style={{
                  color: "#888",
                  fontWeight: "normal",
                  fontSize: "0.85rem",
                }}
              >
                (Calculado sobre proyectos activos. Hay{" "}
                {estadisticas.proyectosVacios} por planificar)
              </small>
            )}
          </div>
          <span className="tdu-progreso-badge">
            {estadisticas.porcentajeCompletitud}% completado
          </span>
        </div>

        <div className="tdu-progreso-barra-container">
          {pctCompletadas > 0 && (
            <div
              className="tdu-progreso-segmento completada"
              style={{ width: `${pctCompletadas}%` }}
              title={`Completadas: ${estadisticas.tareasCompletadas}`}
            ></div>
          )}
          {pctEnProceso > 0 && (
            <div
              className="tdu-progreso-segmento progreso"
              style={{ width: `${pctEnProceso}%` }}
              title={`En Progreso: ${estadisticas.tareasEnProceso}`}
            ></div>
          )}
          {pctPendientes > 0 && (
            <div
              className="tdu-progreso-segmento pendiente"
              style={{ width: `${pctPendientes}%` }}
              title={`Pendientes: ${estadisticas.tareasPendientes}`}
            ></div>
          )}
        </div>

        <div className="tdu-progreso-stats">
          <div className="tdu-progreso-stat">
            <span className="tdu-dot-legend completada"></span>
            <div className="tdu-legend-text">
              <span className="tdu-legend-label">Completadas: </span>
              <span className="tdu-legend-num">
                {estadisticas.tareasCompletadas}
              </span>
            </div>
          </div>
          <div className="tdu-progreso-stat">
            <span className="tdu-dot-legend progreso"></span>
            <div className="tdu-legend-text">
              <span className="tdu-legend-label">En Progreso: </span>
              <span className="tdu-legend-num">
                {estadisticas.tareasEnProceso}
              </span>
            </div>
          </div>
          <div className="tdu-progreso-stat">
            <span className="tdu-dot-legend pendiente"></span>
            <div className="tdu-legend-text">
              <span className="tdu-legend-label">Pendientes: </span>
              <span className="tdu-legend-num">
                {estadisticas.tareasPendientes}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
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
            {departamento?.d_nombre && (
    <p className="tdj-departamento">
      Depto. <strong>{departamento.d_nombre}</strong>
    </p>
  )}
            <p>Resumen de proyectos y tareas</p>
          </div>
        </div>

        <div className="tdj-metrica-grid">
          <MetricCard
            icon={<FaProjectDiagram size={28} />}
            number={proyectos.length}
            label="Total Proyectos"
            subtext="Proyectos activos"
            className="tdu-metrica-total"
          />
          <MetricCard
            icon={<FaLayerGroup size={28} />}
            number={estadisticas.totalTareas}
            label="Total de Tareas"
            subtext="Volumen de trabajo"
            className="tdu-metrica-total"
          />
          <MetricCard
            icon={<FaCheckCircle size={28} />}
            number={estadisticas.tareasCompletadas}
            label="Tareas Completadas"
            subtext={`${estadisticas.porcentajeCompletitud}% del total`}
            className="tdu-metrica-completadas"
          />

          <MetricCard
            icon={<FaHourglassHalf size={28} />}
            number={estadisticas.tareasPendientes}
            label="Pendientes"
            subtext="Por iniciar"
            className="tdu-metrica-pendientes"
          />

          <MetricCard
            icon={<FaTasks size={28} />}
            number={estadisticas.tareasEnProceso}
            label="En Progreso"
            subtext="En ejecución"
            className="tdu-metrica-en-progreso"
          />

         {estadisticas.proyectosVacios > 0 && (
  <MetricCard
    icon={<FaClipboardList size={28} />}
    number={estadisticas.proyectosVacios}
    label="Por Planificar"
    subtext="Proyectos sin tareas"
    className="tdu-metrica-sin-definir"
  />
)}

        </div>

        <BarraProgresoGeneral />

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
                <span className="tdj-proyecto-conteo">
                  {filteredProyectos.length} proyectos
                </span>
              </div>
            </div>

            {filteredProyectos.length === 0 ? (
              <div className="tdj-estado-vacio">
                <div className="tdj-sin-icono">
                  <FaProjectDiagram size={40} />
                </div>
                <h3>No hay proyectos</h3>
              </div>
            ) : (
              <div className="tdj-proyecto-grid">
                {filteredProyectos.map((proyecto) => {
                  const estatus = (proyecto.p_estatus || "").toUpperCase();
                  const diasRestantes = calcularDiasRestantes(proyecto.pf_fin);

                  const progreso =
                    proyecto.total_tareas > 0
                      ? Math.round(
                          (proyecto.tareas_completadas /
                            proyecto.total_tareas) *
                            100
                        )
                      : 0;

                  const sinTareas = proyecto.total_tareas === 0;

                  const esVencido =
                    diasRestantes !== null &&
                    diasRestantes < 0 &&
                    progreso < 100;

                  let statusClass = "pendiente";

                  if (estatus === "FINALIZADO") {
                    statusClass = "completado";
                  } else if (estatus === "EN PROCESO") {
                    statusClass = "progreso";
                  } else if (estatus === "PENDIENTE") {
                    statusClass = "pendiente";
                  } else {
                    statusClass = "sin-definir";
                  }

                  let estadoTiempoClass = "";
                  if (progreso === 100) {
                    estadoTiempoClass = "finalizado";
                  } else if (esVencido) {
                    estadoTiempoClass = "vencido";
                  }

                  return (
                    <div
                      key={proyecto.id_proyecto}
                      className={`tdj-proyecto-card-encabezado ${statusClass}`}
                    >
                      <div className="tdj-project-header">
                        <div className="tdj-proyecto-titulo-seccion">
                          <h3 className="tdj-proyecto-titulo">
                            {proyecto.p_nombre}
                          </h3>
                          {proyecto.descripcion && (
                            <p className="tdj-proyecto-descripcion">
                              {proyecto.descripcion}
                            </p>
                          )}
                        </div>
                        <div className="tdj-proyecto-meta">
                          <span
                            className={`tdj-estatus-proyecto ${statusClass}`}
                          >
                            {proyecto.p_estatus || "En Proceso"}
                          </span>
                          <span className="tdj-total-tareas">
                            {sinTareas
                              ? "Sin tareas"
                              : `${proyecto.total_tareas} tareas`}
                          </span>

                          {sinTareas && (
                            <div className="tdj-prioridad-badge alerta-config">
                              <FaExclamationTriangle size={10} />
                              Requiere atención
                            </div>
                          )}

                          {!sinTareas && esVencido && (
                            <div
                              className="tdj-prioridad-badge"
                              style={{ background: "#dc3545", color: "white" }}
                            >
                              <FaExclamationTriangle
                                size={10}
                                style={{ marginRight: "4px" }}
                              />
                              VENCIDO
                            </div>
                          )}

                          {!sinTareas &&
                            !esVencido &&
                            proyecto.prioridad === "alta" &&
                            proyecto.p_estatus &&
                            proyecto.p_estatus.toLowerCase() !==
                              "finalizado" && (
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

                        {sinTareas ? (
                          <div
                            className="tdj-detalles-metricas"
                            style={{
                              justifyContent: "center",
                              opacity: 0.6,
                            }}
                          >
                            <em>
                              Este proyecto aún no tiene tareas asignadas. Haz
                              clic en "Agregar Tareas" para comenzar la
                              planificación.
                            </em>
                          </div>
                        ) : (
                          <div className="tdj-detalles-metricas">
                            <div className="tdj-metrica-item">
                              <div className="tdu-metrica-item">
                                <div className="tdu-metrica-dot tdu-completada"></div>
                                <span>Completadas</span>
                              </div>
                              <strong>{proyecto.tareas_completadas}</strong>
                            </div>

                            <div className="tdj-metrica-item">
                              <div className="tdu-metrica-dot tdu-progreso"></div>
                              <span>En Progreso</span>
                              <strong>{proyecto.tareas_en_progreso}</strong>
                            </div>

                            <div className="tdj-metrica-item">
                              <div className="tdu-metrica-dot tdu-pendiente"></div>
                              <span>Pendientes</span>
                              <strong>{proyecto.tareas_pendientes}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="tdj-proyecto-info">
                        <div className="tdj-dias">
                          <div className="tdj-dias-item">
                            <FaCalendarAlt size={12} color="#861542" />
                            <span>Inicio:</span>
                            <strong>{proyecto.pf_inicio || "—"}</strong>
                          </div>
                          <div className="tdj-dias-item">
                            <FaHourglassHalf size={12} color="#861542" />
                            <span>Fin:</span>
                            <strong>{proyecto.pf_fin || "—"}</strong>
                          </div>
                        </div>

                        {!sinTareas && diasRestantes !== null && (
                         
                            <span className={`tdj-tiempo-restante ${estadoTiempoClass}`}>
                              {(() => {
                                if (diasRestantes < 0)
                                  return `Venció hace ${Math.abs(
                                    diasRestantes
                                  )} días`;
                                if (diasRestantes === 0)
                                  return "Último día (Hoy)";
                                return `${diasRestantes} días restantes`;
                              })()}
                            </span>
                        )}
                      </div>

                      <div className="tdj-proyecto-footer">
                        <button
                          className="tdj-btn-primary"
                          onClick={() => {
                            if (sinTareas) {
                              agregarTarea(
                                proyecto.id_proyecto,
                                proyecto.p_nombre
                              );
                            } else {
                              verTareas(
                                proyecto.id_proyecto,
                                proyecto.p_nombre
                              );
                            }
                          }}
                        >
                          {sinTareas ? (
                            <FaPlus className="tdj-btn-icon" />
                          ) : (
                            <FaTasks className="tdj-btn-icon" />
                          )}
                          {sinTareas ? "Agregar Tareas" : "Ver tareas"}
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
