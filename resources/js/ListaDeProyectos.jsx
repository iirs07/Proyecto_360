import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import logo3 from "../imagenes/logo3.png";
import { FiX } from "react-icons/fi";
import '../css/global.css';
import '../css/ListaDeProyectos.css';
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";
import MenuDinamico from "../components/MenuDinamico";
import Layout from "../components/Layout";
import { FaTasks, FaCalendarAlt, FaExclamationTriangle, FaSearch, FaRegFolder } from 'react-icons/fa';

function ListaDeProyectos() {
  const navigate = useNavigate(); 
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fecha');
    const { volverSegunRol } = useRolNavigation();

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const f = new Date(fecha + "T00:00");
    return f.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getUrgencyInfo = (fecha) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fin = new Date(fecha + "T00:00");
    fin.setHours(0,0,0,0);

    const diffDays = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: '#dc3545', label: 'Vencido', days: diffDays };
    return { color: '#e0a905ff', label: 'Próximo', days: diffDays };
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
        const res = await fetch(`http://127.0.0.1:8000/api/proyectos/jefe?usuario=${idUsuario}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

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
            tieneVencidos: p.tareas?.some(t => new Date(t.tf_fin) < new Date())
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
        default:
          return new Date(a.pf_fin) - new Date(b.pf_fin);
      }
    });
  }, [proyectos, searchTerm, sortBy]);

  const renderProyectoCard = (proyecto) => {
    const urgencia = getUrgencyInfo(proyecto.pf_fin);
    const tareasInfo = contarTareas(proyecto.tareas);

    return (
      <div className="ldp-proyecto-card-container" key={proyecto.id_proyecto}>
        <div className="ldp-proyecto-card-usuario">
          <div className="ldp-proyecto-header">
            <div className="ldp-proyecto-icon-title">
              <h3 className="ldp-proyecto-nombre">{proyecto.p_nombre}</h3>
            </div>

            <div className="ldp-header-badges">
              <span className="ldp-urgency-badge" style={{ backgroundColor: urgencia.color }}>
                {urgencia.label}
              </span>
              <FaExclamationTriangle 
                className="ldp-warning-icon"
                style={{ color: urgencia.color }}
                title={`${tareasInfo.vencidas} tareas vencidas`}
              />
            </div>
          </div>

          <div className="ldp-proyecto-stats">
            <div className="ldp-stats-grid">
              <div className="ldp-stat-item">
                <FaTasks className="ldp-stat-icon" />
                <div>
                  <span className="ldp-stat-value">{tareasInfo.total}</span>
                  <span className="ldp-stat-label">Total Tareas</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ldp-proyecto-footer">
            <div className="ldp-fecha-info">
              <FaCalendarAlt className="ldp-calendar-icon" />
              <div>
                <span className="ldp-fecha-text" style={{ color: urgencia.color }}>
                  Vence: {formatFecha(proyecto.pf_fin)}
                </span>
                <span className="ldp-dias-restantes" style={{ color: urgencia.color }}>
                  {urgencia.days < 0
                    ? `${Math.abs(urgencia.days)} días de retraso`
                    : urgencia.days === 0
                      ? 'Vence hoy'
                      : urgencia.days === 1
                        ? '1 día restante'
                        : `${urgencia.days} días restantes`
                  }
                </span>
              </div>
            </div>

            <button 
              className="ldp-btn-ver-tareas"
              onClick={() => irATareas(proyecto.id_proyecto, proyecto.p_nombre)}
            >
              <FaTasks className="ldp-btn-icon" />
              Ver Tareas
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout
      titulo="TAREAS ASIGNADAS"
      sidebar={<MenuDinamico activeRoute="gestion-proyectosusuario" />}
    >
      <div className="ldp-container">

        {/* BUSCADOR */}
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
           
             {searchTerm && (
                    <button
  className="buscador-clear-global"
  onClick={() => setSearchTerm("")}
>
  <FiX />
</button>

                  )}
                   </div>

            {searchTerm && (
              <div className="buscador-resultados-global">
                {filteredAndSortedProyectos.length} resultado(s) para "{searchTerm}"
              </div>
            )}
          </div>
        )}

       <div className="ldp-content">
  {loading ? (
    <div className="loader-container">
      <div className="loader-logo"><img src={logo3} alt="Cargando proyectos" /></div>
      <div className="loader-texto">CARGANDO...</div>
      <div className="loader-spinner"></div>
    </div>
  ) : proyectos.length === 0 ? (
    <EmptyState
      titulo="TAREAS PENDIENTES POR REVISAR"
      mensaje="No hay tareas por revisar."
      botonTexto="Volver al Tablero"
      onVolver={volverSegunRol}
      icono={logo3}
    />
  ) : (
    <>
      {filteredAndSortedProyectos.length > 0 ? (
        <div className="ldp-proyectos-list">
          {filteredAndSortedProyectos.map(renderProyectoCard)}

          <div className="ldp-summary">
            <span>
              Mostrando {filteredAndSortedProyectos.length} de {proyectos.length} proyectos
            </span>
          </div>
        </div>
      ) : null }
    </>
  )}
</div>


      </div>
    </Layout>
  );
}

export default ListaDeProyectos;



















