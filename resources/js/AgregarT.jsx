import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import '../css/global.css';
import "../css/AgregarT.css";
import { FaAngleDown, FaSearch, FaCalendarAlt, FaTasks } from "react-icons/fa";
import { FiSearch, FiX } from "react-icons/fi";
import MenuDinamico from "../components/MenuDinamico";
import Layout from "../components/Layout";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";

function AgregarT() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("alfabetico");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const { volverSegunRol } = useRolNavigation();

  useEffect(() => {
  const fetchProyectosUsuario = async () => {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    const token = sessionStorage.getItem("jwt_token");
    const idUsuario = usuario?.id_usuario;

    if (!idUsuario) {
      setLoading(false);
      return;
    }

    if (!token) {
      console.error("Token no encontrado");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/proyectos/usuario?usuario=${idUsuario}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`, 
        },
      });

      const data = await res.json();

      if (data.success) {
        setProyectos(data.proyectos || []);
      } else {
        console.error("Error al cargar proyectos:", data.mensaje);
      }
    } catch (err) {
      console.error("Error al cargar proyectos:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchProyectosUsuario();
}, []);

const modificar = (idProyecto) => {
  navigate("/AgregarTareas", { state: { id_proyecto: idProyecto } }); 
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
          return Date.parse(a.pf_fin) - Date.parse(b.pf_fin);
        case "fecha_lejana":
          return Date.parse(b.pf_fin) - Date.parse(a.pf_fin);
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

  const mostrarSelect = proyectosFiltrados.length > 0;

  return (
    <Layout
      titulo="AGREGAR TAREAS"
      sidebar={<MenuDinamico activeRoute="modificar" />}
    >
      <div className="contenedor-global">
        {loading ? (
          <div className="loader-container">
            <div className="loader-logo">
              <img src={logo3} alt="Cargando" />
            </div>
            <div className="loader-texto">CARGANDO...</div>
            <div className="loader-spinner"></div>
          </div>
        ) : proyectos.length === 0 ? (
          <EmptyState
            titulo="AGREGAR TAREAS"
            mensaje="Actualmente no tienes proyectos a los cuales agregar tareas."
            botonTexto="Volver al Tablero"
            onVolver={volverSegunRol}
            icono={logo3}
          />
        ) : (
          <>
           
           <div className="barra-busqueda-global-container mb-4">
              <div className="barra-busqueda-global-wrapper">
                            <FaSearch className="barra-busqueda-global-icon" />
                            <input
                  type="text"
                  placeholder="Buscar proyectos por nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                   className="barra-busqueda-global-input"
                />
                {busqueda && (
                <button className="buscador-clear-global"
                    onClick={() => setBusqueda("")}
                  >
                    <FiX />
                  </button>
                )}
              </div>
              {busqueda && (
                <div className="buscador-verproyectos-resultados-info">
                  {proyectosFiltrados.length} resultado(s) para "{busqueda}"
                </div>
              )}
            </div>

            {/* Select de filtros */}
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
              {proyectosFiltrados.length > 0 ? (
                proyectosFiltrados.map((p) => (
                  <div key={p.id_proyecto} className="agregar-tareas-card">
                    <h5 className="agregar-tareas-nombre">{p.p_nombre}</h5>
                    <div className="agregar-tareas-info-item">
                                                               <FaCalendarAlt className="agregar-tareas-info-icon" />
                                                               <span>
                                                                 <strong>Finaliza:</strong> {p.pf_fin}
                                                               </span>
                                                             </div>
                    <div className="agregar-tareas-botones">
                      <button
                        className="agregar-tareas-btn"
                        onClick={() => modificar(p.id_proyecto)}
                      >
                         <FaTasks style={{ marginRight: "8px" }} />
                        Agregar Tarea
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                null
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default AgregarT;
