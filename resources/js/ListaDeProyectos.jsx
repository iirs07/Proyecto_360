import React, { useState, useEffect, useMemo, useCallback } from 'react'; 
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
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useAutoRefresh } from "../hooks/useAutoRefresh"; 

function ListaDeProyectos() {
  useAuthGuard();
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
  
  // 1. "Hoy" a las 00:00:00 
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  // 2. "Fecha de vencimiento" a las 00:00:00
  // Usamos 00:00 para que la resta sea de días exactos (24h completas)
  const fin = new Date(fechaFin + "T00:00:00");
  
  // 3. Calculamos la diferencia en milisegundos y la pasamos a días
  const diffTime = fin - hoy;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    // Si es -1, significa que venció ayer.
    const diasRetraso = Math.abs(diffDays);
    return { 
      dias: diasRetraso, 
      texto: `${diasRetraso} ${diasRetraso === 1 ? 'día' : 'días'} de retraso`,
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
    vencidas: tareas?.filter(t => {
      if (!t.tf_fin) return false;
      const fechaVencimiento = new Date(t.tf_fin + "T23:59:59");
      return fechaVencimiento < hoy;
    }).length || 0,
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

  const cargarProyectos = useCallback(async (isBackground = false) => {
    const token = sessionStorage.getItem("jwt_token");
    const usuario = JSON.parse(sessionStorage.getItem("usuario") || "{}");
    const idUsuario = usuario.id_usuario;

    if (!token) {
      navigate("/Login", { replace: true });
      return;
    }

    if (!idUsuario) {
      if (!isBackground) setLoading(false);
      return;
    }

    try {
     
      if (!isBackground) {
        setLoading(true);
      }

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
          // Dentro de cargarProyectos, en el .map:
     tieneVencidos: p.tareas?.some(t => {
      if (!t.tf_fin) return false;
     // Forzamos que venza al final del día indicado
      return new Date(t.tf_fin + "T23:59:59") < new Date();
}),
        }))
        .sort((a,b) => new Date(a.pf_fin) - new Date(b.pf_fin));

      setProyectos(proyectosConTareas);
    } catch (error) {
      console.error("Error:", error);
    } finally {
     
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, [API_URL, navigate]); 

  // 4. Carga Inicial 
  useEffect(() => {
    cargarProyectos(false); 
  }, [cargarProyectos]);

  // 5. Auto Refresco cada 5 segundos (silencioso)
  useAutoRefresh(() => {
    cargarProyectos(true);
  }, 5000);

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
             <div className="ldp-date-value">{proyecto.pf_fin}</div>
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
    titulo="Mis proyectos"
    subtitle={proyectos.length > 0 ? "Visualiza y gestiona todos tus proyectos en un solo lugar" : ""}
    sidebar={<MenuDinamico activeRoute="proyectos-en-los-que-participas" />}
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
          titulo="Aún no eres parte de ningún proyecto"
          mensaje="Cuando se asignen proyectos, aparecerán aquí."
          botonTexto="Volver al Tablero"
          onVolver={volverSegunRol}
          icono={logo3}
        />
      ) : (
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
                      <button
                        className="ldp-search-clear"
                        onClick={() => setSearchTerm("")}
                      >
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
                      <button 
                        className={`ldp-sort-option ${sortBy === 'fecha' ? 'active' : ''}`}
                        onClick={() => { setSortBy('fecha'); setShowSortOptions(false); }}
                      >
                        <FiCalendar /> Fecha de vencimiento
                      </button>
                      <button 
                        className={`ldp-sort-option ${sortBy === 'nombre' ? 'active' : ''}`}
                        onClick={() => { setSortBy('nombre'); setShowSortOptions(false); }}
                      >
                        <FiFilter /> Nombre
                      </button>
                      <button 
                        className={`ldp-sort-option ${sortBy === 'tareas' ? 'active' : ''}`}
                        onClick={() => { setSortBy('tareas'); setShowSortOptions(false); }}
                      >
                        <FaTasks /> Cantidad de tareas
                      </button>
                      <button 
                        className={`ldp-sort-option ${sortBy === 'prioridad' ? 'active' : ''}`}
                        onClick={() => { setSortBy('prioridad'); setShowSortOptions(false); }}
                      >
                        <FaExclamationTriangle /> Prioridad
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {searchTerm && (
            <div className="ldp-search-results">
              <span className="ldp-results-count">
                {filteredAndSortedProyectos.length} {filteredAndSortedProyectos.length === 1 ? 'resultado' : 'resultados'} para "{searchTerm}"
              </span>
            </div>
          )}

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



















