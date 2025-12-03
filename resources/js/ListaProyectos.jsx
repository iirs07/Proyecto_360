import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/VerProyecto.css";
import { FaCalendarAlt, FaTasks, FaExclamationTriangle, FaSearch } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import SelectDinamico from "../components/SelectDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";

function ListaProyectos() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("alfabetico");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { volverSegunRol } = useRolNavigation();

  const opciones = [
    { value: "alfabetico", label: "Nombre (A-Z)" },
    { value: "alfabetico_desc", label: "Nombre (Z-A)" },
    { value: "fecha_proxima", label: "Fecha más próxima" },
    { value: "fecha_lejana", label: "Fecha más lejana" },
  ];

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
const mostrarSelect = proyectos.length > 0 && proyectosFiltrados.length > 0;
  const agregarTarea = (idProyecto) => {
    navigate("/agregarTareas", { state: { id_proyecto: idProyecto } });
  };

  const verTareas = (idProyecto) => {
    sessionStorage.setItem("id_proyecto", idProyecto);
    navigate("/ListaDeTareas", { state: { id_proyecto: idProyecto } });
  };

  useEffect(() => {
    const cargarProyectos = async () => {
      const usuario = JSON.parse(sessionStorage.getItem("usuario"));
      const token = sessionStorage.getItem("jwt_token");
      const idUsuario = usuario?.id_usuario;
      if (!idUsuario) return alert("Usuario no encontrado.");
      if (!token) return alert("No hay token de autenticación, inicia sesión.");

      try {
        setLoading(true);
        const res = await fetch(
          `http://127.0.0.1:8000/api/proyectos/usuario?usuario=${idUsuario}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json().catch(async () => ({ error: await res.text() }));
        if (res.ok && data.success) {
          setProyectos(data.proyectos || []);
        } else {
          console.error("Error al cargar proyectos:", data.mensaje || data);
          setProyectos([]);
        }
      } catch (err) {
        console.error("Error al cargar proyectos:", err);
        alert("Ocurrió un error al cargar los proyectos.");
      } finally {
        setLoading(false);
      }
    };

    cargarProyectos();
  }, []);

  

  return (
    <Layout titulo="PROYECTOS" 
    sidebar={<MenuDinamico activeRoute="ver" />}>
      <div className="container my-4">
        <div className="row justify-content-center">

          {proyectos.length > 0 && (
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
                  <button
                    className="buscador-clear-global"
                    onClick={() => setBusqueda("")}
                  >
                    <FiX />
                  </button>
                )}
              </div>

              {/* Resultados de búsqueda */}
              {busqueda && (
                <div className="buscador-verproyectos-resultados-info">
                  {proyectos.filter((p) =>
                    p.p_nombre.toLowerCase().includes(busqueda.toLowerCase())
                  ).length} resultado(s) para "{busqueda}"
                </div>
              )}

              {/* Select debajo de barra y resultados */}
              {mostrarSelect && (
                <div style={{ marginTop: '10px' }}>
                  <SelectDinamico
                    opciones={opciones.map((o) => o.label)}
                    valor={opciones.find((o) => o.value === filtro)?.label}
                    setValor={(nuevoValor) => {
                      const opcion = opciones.find((o) => o.label === nuevoValor);
                      setFiltro(opcion.value);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Lista de proyectos */}
          <div className="verproyectos-lista-proyectos">
            {loading ? (
              <div className="loader-container">
                <div className="loader-logo">
                  <img src={logo3} alt="Cargando proyectos" />
                </div>
                <div className="loader-texto">CARGANDO PROYECTOS...</div>
                <div className="loader-spinner"></div>
              </div>
            ) : proyectosFiltrados.length > 0 ? (
              proyectosFiltrados.map((p) => {
                const fechaFin = new Date(p.pf_fin);
                const hoy = new Date();
                fechaFin.setHours(0, 0, 0, 0);
                hoy.setHours(0, 0, 0, 0);

                const diasRestantes = Math.floor((fechaFin - hoy) / (1000 * 60 * 60 * 24));
                const esProximo = diasRestantes >= 0;
                const estaVencido = diasRestantes < 0;

                return (
                  <div key={p.id_proyecto} className="verproyectos-card">
                    <h5 className="verproyecto-nombre">{p.p_nombre}</h5>

                    <div className="verproyectos-info">
                      <div className="verproyectos-info-item">
                        <FaCalendarAlt className="verproyectos-info-icon" />
                        <span>
                          <strong>Fecha fin:</strong> {fechaFin.toLocaleDateString()}
                        </span>
                      </div>

                      <div className="verproyectos-info-item">
                        <FaTasks className="verproyectos-info-icon" />
                        <span>
                          <strong>Tareas:</strong> {p.total_tareas || 0}
                        </span>
                      </div>

                      {estaVencido && (
                        <div className="verproyectos-info-item verproyectos-alerta">
                          <FaExclamationTriangle />
                          <span><strong>¡Vencido!</strong></span>
                        </div>
                      )}

                      {esProximo && !estaVencido && (
                        <div className="verproyectos-info-item verproyectos-advertencia">
                          <FaExclamationTriangle />
                          <span>
                            <strong>
                              {diasRestantes === 0
                                ? "Vence hoy"
                                : `Vence en ${diasRestantes} día${diasRestantes > 1 ? "s" : ""}`}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="verproyectos-botones">
                      {p.total_tareas === 0 ? (
                        <button
                          className="verproyectos-btn proyectos-btn-primary"
                          onClick={() => agregarTarea(p.id_proyecto)}
                        >
                          <FaTasks style={{ marginRight: "8px" }} />
                          Agregar primera tarea
                        </button>
                      ) : (
                        <button
                          className="verproyectos-btn proyectos-btn-secondary"
                          onClick={() => verTareas(p.id_proyecto)}
                        >
                          <FaTasks style={{ marginRight: "8px" }} />
                          Ver tareas
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : busqueda.length === 0 ? (
             <EmptyState
                 titulo="PROYECTOS"
                 mensaje="No hay proyectos disponibles."
                 botonTexto="Volver al Tablero"
                 onVolver={volverSegunRol} 
                 icono={logo3}
               />
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ListaProyectos;













