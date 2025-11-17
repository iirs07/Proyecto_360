import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import '../css/global.css';
import "../css/AgregarT.css";
import { FaAngleDown, FaBars } from "react-icons/fa";
import { FiSearch, FiX } from "react-icons/fi";
import MenuDinamico from "../components/MenuDinamico";

function ProyectosM() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("alfabetico");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
        const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const idUsuario = usuario?.id_usuario;
    if (!idUsuario) return;

    fetch(`http://127.0.0.1:8000/api/proyectos/usuario?usuario=${idUsuario}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProyectos(data.proyectos || []);
        } else {
          console.error("Error al cargar proyectos:", data.mensaje);
        }
      })
      .catch((err) => console.error("Error al cargar proyectos:", err))
      .finally(() => setLoading(false));
  }, []);

  const modificar = (idProyecto) => {
    localStorage.setItem("id_proyecto", idProyecto);
    navigate("/AgregarTareas", { state: { idProyecto } });
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
    { value: "alfabetico", label: "Nombre (A-Z)" },
    { value: "alfabetico_desc", label: "Nombre (Z-A)" },
    { value: "fecha_proxima", label: "Fecha más próxima" },
    { value: "fecha_lejana", label: "Fecha más lejana" },
  ];

  const mostrarSelect = busqueda.length === 0 || proyectosFiltrados.length > 0;

  return (
  <div className="main-layout">
               {/* ===== MENU LATERAL ===== */}
               <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
                 <MenuDinamico 
                   collapsed={sidebarCollapsed}
                   departamentoId={localStorage.getItem('last_depId')} 
                   departamentoNombre={localStorage.getItem('last_depNombre')} 
                   departamentoSlug={localStorage.getItem('last_depSlug')} 
                   activeRoute="agregar-tareas"
                 />
               </div>
         
               {/* ===== CONTENIDO PRINCIPAL ===== */}
               <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
                 {/* Fondo semitransparente */}
                 <div className="logo-fondo">
                   <img src={logo3} alt="Fondo" />
                 </div>
         
                 {/* ===== BARRA SUPERIOR ===== */}
                 <div className="header-global">
                   <div className="header-left" onClick={toggleSidebar}>
                     <FaBars className="icono-hamburguesa-global" />
                   </div>
                   <div className="barra-center">
                     <span className="titulo-barra-global">
                       AGREGAR TAREAS
                     </span>
                   </div>
                 </div>
      <h1 className="form-titulo">Proyectos</h1>

      <div className="buscador-verproyectos-contenedor">
        <div className="buscador-verproyectos-inner">
          <FiSearch className="buscador-verproyectos-icono" />
          <input
            type="text"
            placeholder="Buscar proyectos por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="buscador-verproyectos-input"
          />
          {busqueda && (
            <button
              className="buscador-verproyectos-clear"
              onClick={() => setBusqueda("")}
            >
              <FiX />
            </button>
          )}
        </div>
      </div>

      {busqueda && (
        <div className="buscador-verproyectos-resultados-info">
          {
            proyectos.filter((p) =>
              p.p_nombre.toLowerCase().includes(busqueda.toLowerCase())
            ).length
          }{" "}
          resultado(s) para "{busqueda}"
        </div>
      )}
      {mostrarSelect && (
        <div className="agregar-tareas-custom-select-container-inline">
          <div
            className="agregar-tareas-custom-select"
            onClick={() => setOpen(!open)}
          >
            {opciones.find((o) => o.value === filtro)?.label}
            <FaAngleDown className={`dropdown-icon ${open ? "open" : ""}`} />
          </div>

          {open && (
            <div
              className={`agregar-tareas-custom-options-inline ${
                open ? "open" : ""
              }`}
            >
              {opciones.map((o) => (
                <div
                  key={o.value}
                  onClick={() => {
                    setFiltro(o.value);
                    setOpen(false);
                  }}
                >
                  {o.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="agregar-tareas-lista">
        {loading ? (
          <div className="loader-container">
            <div className="loader-logo">
              <img src={logo3} alt="Cargando" />
            </div>
            <div className="loader-texto">CARGANDO...</div>
            <div className="loader-spinner"></div>
          </div>
        ) : proyectos.length === 0 ? (
          <p className="agregar-tareas-titulo">No hay proyectos disponibles</p>
        ) : proyectosFiltrados.length > 0 ? (
          proyectosFiltrados.map((p) => (
            <div key={p.id_proyecto} className="modificar-proyectos-card">
              <h5 className="agregar-tareas-nombre">{p.p_nombre}</h5>
              <div className="proyectos-info">
                <div>Fin: {p.pf_fin}</div>
              </div>
              <div className="agregar-tareas-botones">
                <button
                  className="agregar-tareas-btn"
                  onClick={() => modificar(p.id_proyecto)}
                >
                  Agregar Tarea
                </button>
              </div>
            </div>
          ))
        ) : null}
      </div>
    </div>
     </div>
  );
}

export default ProyectosM;