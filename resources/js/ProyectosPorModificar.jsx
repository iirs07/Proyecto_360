import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/ProyectosM.css";
import { FaCalendarAlt, FaTasks, FaExclamationTriangle, FaSearch, FaEdit, FaInfoCircle,FaHourglassHalf, FaFilter } from "react-icons/fa";

import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import SelectDinamico from "../components/SelectDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";
import { getPStatusTagStyle, getBorderClase } from "../components/estatusUtils";

function ProyectosListaModificar() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("alfabetico");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { volverSegunRol } = useRolNavigation();
const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    const idUsuario = usuario?.id_usuario;
    const token = sessionStorage.getItem("jwt_token");

    if (!idUsuario || !token) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/proyectos/general?usuario=${idUsuario}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => {
        if (res.status === 401) {
          sessionStorage.removeItem("jwt_token");
          sessionStorage.removeItem("usuario");
          navigate("/Login", { replace: true });
          return { success: false, mensaje: "No autorizado" };
        }
        return res.text().then((text) => {
          if (!text || text.trim() === "") return { success: false, mensaje: "Response vacía" };
          try {
            return JSON.parse(text);
          } catch (error) {
            console.error("Error parseando JSON:", error);
            return { success: false, mensaje: "Error parseando JSON" };
          }
        });
      })
      .then((data) => {
        if (data?.success) setProyectos(data.proyectos || []);
        else {
          console.error("Error en la respuesta:", data?.mensaje);
          setProyectos([]);
        }
      })
      .catch((err) => {
        console.error("Error en la petición:", err);
        setProyectos([]);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const modificar = (idProyecto) => {
    sessionStorage.setItem("id_proyecto", idProyecto);
    navigate("/modificarProyecto", { state: { idProyecto } });
  };

  const proyectosFiltrados = proyectos
    .filter((p) => p.p_nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      switch (filtro) {
        case "alfabetico":
          return a.p_nombre.localeCompare(b.p_nombre);
        case "alfabetico_desc":
          return b.p_nombre.localeCompare(a.p_nombre);
        case "fecha_proxima":
          return new Date(a.pf_fin) - new Date(b.pf_fin);
        case "fecha_lejana":
          return new Date(b.pf_fin) - new Date(a.pf_fin);
        default:
          return 0;
      }
    });

  const opciones = [
    { value: "alfabetico", label: "Orden alfabético (A-Z)" },
    { value: "alfabetico_desc", label: "Orden alfabético (Z-A)" },
    { value: "fecha_proxima", label: "Fecha más próxima" },
    { value: "fecha_lejana", label: "Fecha más lejana" },
  ];

  const hayProyectos = proyectos.length > 0;
  const mostrarSelect = hayProyectos && proyectosFiltrados.length > 0;

  return (
    <Layout titulo="MODIFICAR PROYECTOS" sidebar={<MenuDinamico activeRoute="Nuevo proyecto" />}>
      <div className="container my-4">


{proyectos.length > 0 && (
  
        
<div className="pm-filtros-container">
            <div className="pm-search-filter-wrapper">
              
              <div className="pm-search-box">
                <FaSearch className="pm-search-icon" />
                <input
                  type="text"
                  placeholder="Buscar proyectos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pm-search-input"
                />
                {busqueda && (
                  <button
                    className="pm-search-clear-btn"
                    onClick={() => setBusqueda("")}
                  >
                    <FiX />
                  </button>
                )}
              </div>
              {mostrarSelect && (
                <div className="pm-filter-box">
                  <FaFilter className="pm-filter-icon" />
                  <SelectDinamico
                    opciones={opciones.map((o) => o.label)}
                    valor={opciones.find((o) => o.value === filtro)?.label}
                    setValor={(labelSeleccionado) => {
                      const opcion = opciones.find((o) => o.label === labelSeleccionado);
                      if (opcion) setFiltro(opcion.value);
                    }}
                  />
                </div>
              )}
            </div>

            {busqueda && (
              <div className="pm-search-results-info">
                <span className="pm-results-count">
                  {proyectos.filter((p) =>
                    p.p_nombre.toLowerCase().includes(busqueda.toLowerCase())
                  ).length}
                </span> 
                resultado(s) para "{busqueda}"
              </div>
            )}
          </div>
        )}
           
                   
              
       

        <div className="pm-lista">
    {loading ? (
        <div className="loader-container">
            <div className="loader-logo">
                <img src={logo3} alt="Cargando" />
            </div>
            <div className="loader-texto">CARGANDO PROYECTOS...</div>
            <div className="loader-spinner"></div>
        </div>
    ) : !hayProyectos ? (
        <EmptyState
            titulo="MODIFICAR PROYECTOS"
            mensaje="No hay proyectos disponibles."
            botonTexto="Volver al Tablero"
            onVolver={volverSegunRol}
            icono={logo3}
        />
    ) : proyectosFiltrados.length === 0 ? (
   
        null
    ) : (
        proyectosFiltrados.map((p) => {
                const fechaFin = new Date(p.pf_fin);
                const hoy = new Date();
                fechaFin.setHours(0, 0, 0, 0);
                hoy.setHours(0, 0, 0, 0);

                const diasRestantes = Math.floor((fechaFin - hoy) / (1000 * 60 * 60 * 24));
                const esProximo = diasRestantes >= 0;
                const estaVencido = diasRestantes < 0;

         

            return (
              <div 
                  key={p.id_proyecto} 
                  className={`pm-proyecto-card ${getBorderClase(p.p_estatus)}`}
                >
<div className="pm-card-header">
                    <h5 className="pm-nombre">{p.p_nombre}</h5>

                    <div className="pm-status-badge">
                      <span style={getPStatusTagStyle(p.p_estatus)}>
                        {p.p_estatus || "Sin estatus"}
                      </span>
                    
  </div>
  </div>
<div className="pm-info-grid">

                  
<div className="pm-info-item">
  <FaCalendarAlt className="pm-info-icon" />
  <div className="pm-info-content">
    <div className="pm-info-label">Fecha límite</div>
   <div className="pm-info-value">{p.pf_fin}</div>
  </div>
</div>

{/* DÍAS RESTANTES */}
<div className="pm-info-item">
  <FaHourglassHalf className="pm-info-icon" />
  <div className="pm-info-content">
    <div className="pm-info-label">Días restantes</div>
    <div className="pm-info-value">
      {estaVencido
        ? "Proyecto vencido"
        : diasRestantes === 0
          ? "Hoy"
          : `${diasRestantes} día${diasRestantes > 1 ? "s" : ""}`}
    </div>
    </div>
</div>


                    {/* TAREAS */}
                    <div className="pm-info-item">
                      <FaTasks className="pm-info-icon" />
                      <div className="pm-info-content">
                        <div className="pm-info-label">Tareas totales</div>
                        <div className="pm-info-value">{p.total_tareas || 0}</div>
                      </div>
                    </div>

                    </div>

                    <div className="pm-botones">
                        <button
                            className="pm-btn"
                            onClick={() => modificar(p.id_proyecto)}
                        >
                            <FaEdit style={{ marginRight: "8px" }} />
                            Modificar proyecto
                        </button>
                    </div>
                </div>
            );
        })
    )}
</div>
</div>

    </Layout>
  );
}

export default ProyectosListaModificar;



