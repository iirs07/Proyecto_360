import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import logo3 from "../imagenes/logo3.png";
import { FiX, FiCalendar, FiFilter } from "react-icons/fi";
import { FaTasks, FaCalendarAlt, FaExclamationTriangle, FaSearch, FaRegClock, FaCheckCircle } from 'react-icons/fa';
import { MdOutlineSort } from 'react-icons/md';
import '../css/global.css';
import '../css/ListaDeProyectos.css';
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";
import MenuDinamico from "../components/MenuDinamico";
import Layout from "../components/Layout";

function ListaDeProyectos() {
  const navigate = useNavigate(); 
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fecha');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const { volverSegunRol } = useRolNavigation();
  const API_URL = import.meta.env.VITE_API_URL;

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const f = new Date(fecha + "T00:00");
    return f.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
  };

  const getProjectStatus = (proyecto) => proyecto.p_estatus || "En proceso";

  const statusConfig = {
    "Finalizado": { 
      color: "#10b981", 
      bgColor: "#ecfdf5",
      icon: <FaCheckCircle />,
      textColor: "#047857"
    },
    "En proceso": { 
      color: "#f59e0b", 
      bgColor: "#fffbeb",
      icon: <FaRegClock />,
      textColor: "#92400e"
    },
    "En revisión": { 
      color: "#3b82f6", 
      bgColor: "#eff6ff",
      icon: <FaExclamationTriangle />,
      textColor: "#1e40af"
    }
  };

  const getDiasRestantes = (fechaFin) => {
    if (!fechaFin) return { dias: 0, texto: 'Sin fecha', tipo: 'neutral' };
    
    const hoy = new Date();
    const fin = new Date(fechaFin + "T00:00");
    const diffDays = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { 
        dias: Math.abs(diffDays), 
        texto: `${Math.abs(diffDays)} días de retraso`,
        tipo: 'danger'
      };
    } else if (diffDays === 0) {
      return { dias: 0, texto: 'Vence hoy', tipo: 'warning' };
    } else if (diffDays <= 3) {
      return { dias: diffDays, texto: `${diffDays} días restantes`, tipo: 'warning' };
    } else {
      return { dias: diffDays, texto: `${diffDays} días restantes`, tipo: 'success' };
    }
  };

  const contarTareas = (tareas) => {
    const hoy = new Date();
    return {
      total: tareas?.length || 0,
      vencidas: tareas?.filter(t => new Date(t.tf_fin) < hoy).length || 0,
    };
  };

  const irATareas = (idProyecto, nombreProyecto) => {
    navigate("/TareasAsignadas", { 
      state: { 
        id_proyecto: idProyecto, 
        nombre_proyecto: nombreProyecto 
      } 
    });
  };

  useEffect(() => {
    const cargarProyectos = async () => {
      const token = sessionStorage.getItem("jwt_token");
      const usuario = JSON.parse(sessionStorage.getItem("usuario") || "{}");
      const idUsuario = usuario.id_usuario;

      if (!token) {
        navigate("/Login", { replace: true });
        return;
      }

      if (!idUsuario) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${API_URL}/api/proyectos/jefe?usuario=${idUsuario}`, {
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

        if (!res.ok) throw new Error(`Error ${res.status}`);

        const data = await res.json();

        const proyectosConTareas = (data.proyectos || [])
          .map(p => ({
            ...p,
            tieneVencidos: p.tareas?.some(t => new Date(t.tf_fin) < new Date()),
            diasInfo: getDiasRestantes(p.pf_fin)
          }))
          .sort((a,b) => new Date(a.pf_fin) - new Date(b.pf_fin));

        setProyectos(proyectosConTareas);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarProyectos();
  }, [navigate]);

  const filteredAndSortedProyectos = useMemo(() => {
    let filtered = proyectos.filter(p =>
      p.p_nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'nombre':
          return a.p_nombre.localeCompare(b.p_nombre);
        case 'tareas':
          return (b.tareas?.length || 0) - (a.tareas?.length || 0);
        case 'prioridad':
          return (a.diasInfo?.dias || 0) - (b.diasInfo?.dias || 0);
        default:
          return new Date(a.pf_fin) - new Date(b.pf_fin);
      }
    });
  }, [proyectos, searchTerm, sortBy]);

  const renderProyectoCard = (proyecto) => {
    const status = getProjectStatus(proyecto);
    const statusInfo = statusConfig[status] || statusConfig["En proceso"];
    const tareasInfo = contarTareas(proyecto.tareas);
    const diasInfo = proyecto.diasInfo || getDiasRestantes(proyecto.pf_fin);
    const completionPercentage = proyecto.tareas?.length > 0 
      ? Math.round((proyecto.tareas.filter(t => t.t_estatus === 'Finalizado').length / proyecto.tareas.length) * 100)
      : 0;

    return (
      <div className="ldp-proyecto-card" key={proyecto.id_proyecto}>
        <div className="ldp-card-header">
          <div className="ldp-title-section">
            <div className="ldp-project-icon">
            </div>
            <div className="ldp-title-wrapper">
              <h3 className="ldp-project-title">{proyecto.p_nombre}</h3>
            </div>
          </div>
          
          <div className="ldp-status-section">
            <span 
              className="ldp-status-tag" 
              style={{ 
                backgroundColor: statusInfo.bgColor,
                color: statusInfo.textColor,
                borderColor: statusInfo.color
              }}
            >
              <span className="ldp-status-icon">{statusInfo.icon}</span>
              {status}
            </span>
          </div>
        </div>

        <div className="ldp-card-body">
         

          <div className="ldp-stats-grid">
            <div className="ldp-stat-card">
              <div className="ldp-stat-icon-wrapper">
                <FaTasks style={{ color: statusInfo.color }} />
              </div>
              <div className="ldp-stat-content">
                <div className="ldp-stat-number">{tareasInfo.total}</div>
                <div className="ldp-stat-label">Total Tareas</div>
              </div>
            </div>

           

            <div className="ldp-stat-card">
              <div className="ldp-stat-icon-wrapper">
                <FaExclamationTriangle style={{ color: '#ef4444' }} />
              </div>
              <div className="ldp-stat-content">
                <div className="ldp-stat-number">{tareasInfo.vencidas}</div>
                <div className="ldp-stat-label">Vencidas</div>
              </div>
            </div>
          </div>
        </div>

        <div className="ldp-card-footer">
          <div className="ldp-date-info">
            <div className="ldp-date-icon">
              <FiCalendar />
            </div>
            <div className="ldp-date-content">
              <div className="ldp-date-label">Fecha de vencimiento</div>
              <div className="ldp-date-value">{formatFecha(proyecto.pf_fin)}</div>
            </div>
          </div>

          <div className={`ldp-days-info ldp-days-${diasInfo.tipo}`}>
            <div className="ldp-days-icon">
              <FaRegClock />
            </div>
            <div className="ldp-days-text">{diasInfo.texto}</div>
          </div>

          <button 
            className="ldp-action-button"
            onClick={() => irATareas(proyecto.id_proyecto, proyecto.p_nombre)}
            style={{ backgroundColor: statusInfo.color }}
          >
            <FaTasks className="ldp-btn-icon" />
            Completar Tareas
          </button>
        </div>
      </div>
    );
  };
return (
  <Layout
    titulo={proyectos.length === 0 ? "" : "Proyectos Activos"}
    subtitle={proyectos.length === 0 ? "" : "Visualiza y gestiona todos tus proyectos en un solo lugar"}
    sidebar={proyectos.length === 0 ? null : <MenuDinamico activeRoute="proyectos-en-los-que-participas" />}
  >
    <div className="ldp-container">

      {loading ? (
        <div className="loader-container">
          <div className="loader-logo"><img src={logo3} alt="Cargando" /></div>
          <div className="loader-texto">CARGANDO PROYECTOS...</div>
          <div className="loader-spinner"></div>
        </div>
      ) : proyectos.length === 0 ? (
        
        <EmptyState
          titulo="No hay proyectos activos"
          mensaje="Cuando se asignen proyectos, aparecerán aquí."
          botonTexto="Volver al Tablero"
          onVolver={volverSegunRol}
          icono={logo3}
        />

      ) : (
        
        // Se muestra TODO el diseño solo cuando SÍ hay proyectos
        <>
          <div className="ldp-header">
            <div className="ldp-header-content">
              <div className="ldp-header-title">
                <h1>Mis Proyectos</h1>
                <p className="ldp-subtitle">
                  {proyectos.length} {proyectos.length === 1 ? 'proyecto activo' : 'proyectos activos'}
                </p>
              </div>

              <div className="ldp-header-controls">
                <div className="ldp-search-container">
                  <div className="ldp-search-wrapper">
                    <FaSearch className="ldp-search-icon" />
                    <input
                      type="text"
                      placeholder="Buscar proyectos por nombre..."
                      className="ldp-search-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button className="ldp-search-clear" onClick={() => setSearchTerm("")}>
                        <FiX />
                      </button>
                    )}
                  </div>
                </div>

                <div className="ldp-sort-container">
                  <button 
                    className="ldp-sort-button"
                    onClick={() => setShowSortOptions(!showSortOptions)}
                  >
                    <MdOutlineSort />
                    Ordenar por
                  </button>
                  
                  {showSortOptions && (
                    <div className="ldp-sort-dropdown">
                      <button className={`ldp-sort-option ${sortBy === 'fecha' ? 'active' : ''}`}
                        onClick={() => { setSortBy('fecha'); setShowSortOptions(false); }}>
                        <FiCalendar /> Fecha de vencimiento
                      </button>
                      <button className={`ldp-sort-option ${sortBy === 'nombre' ? 'active' : ''}`}
                        onClick={() => { setSortBy('nombre'); setShowSortOptions(false); }}>
                        <FiFilter /> Nombre
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="container">
            <div className="row g-4">
              {filteredAndSortedProyectos.map(p => (
                <div key={p.id_proyecto} className="col-12">
                  {renderProyectoCard(p)}
                </div>
              ))}
            </div>
          </div>

        </>
      )}
    </div>
  </Layout>
);

}

export default ListaDeProyectos;




















