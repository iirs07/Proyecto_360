import React, { useState, useEffect } from "react";
import '../css/global.css';
import "../css/TareasCJ.css"; 
import logo3 from "../imagenes/logo3.png";
import { FiX } from "react-icons/fi";
import { FaBars,FaSearch, FaCheckCircle, FaInfoCircle } from "react-icons/fa";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";


function TareasCompletadasDepartamento() {
  const [busqueda, setBusqueda] = useState("");
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensajeAPI, setMensajeAPI] = useState("");
  const { volverSegunRol } = useRolNavigation();

  useEffect(() => {
  const fetchTareasCompletadas = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      const token = localStorage.getItem("jwt_token");

      if (!usuario?.id_usuario) {
        setMensajeAPI("Usuario no logeado");
        setLoading(false);
        return;
      }

      if (!token) {
        setMensajeAPI("Token no encontrado");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `http://127.0.0.1:8000/api/tareasCompletadas/jefe?usuario=${usuario.id_usuario}`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`, 
          },
        }
      );

      const data = await res.json();

      if (data.success && data.proyectos.length > 0) {
        const tareasPlanas = data.proyectos.flatMap(p => 
  p.tareas.map(t => ({ ...t, p_nombre: p.proyecto?.p_nombre || '', t_nombre: t.t_nombre || '' }))
);


        setTareas(tareasPlanas);
        setMensajeAPI("");
      } else {
        setTareas([]);
        setMensajeAPI(data.mensaje || "No hay tareas completadas para este usuario");
      }
    } catch (error) {
      setMensajeAPI("Error al cargar tareas");
      setTareas([]);
      console.error("Error al cargar tareas:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchTareasCompletadas();
}, []);



  // --- CAMBIO 1: Filtro más seguro ---
  // Guardamos el término de búsqueda en minúsculas una sola vez
  const terminoBusqueda = busqueda.toLowerCase();
  
  const tareasFiltradas = tareas.filter(
    (tarea) => {
      const nombreTarea = String(tarea.t_nombre || '').toLowerCase();
      const nombreProyecto = String(tarea.p_nombre || '').toLowerCase();
      
      return nombreTarea.includes(terminoBusqueda) || nombreProyecto.includes(terminoBusqueda);
    }
  );

  // Agrupamiento de tareas por proyecto
  const proyectosAgrupados = tareasFiltradas.reduce((proyectos, tarea) => {
    const proyectoExistente = proyectos.find((p) => p.p_nombre === tarea.p_nombre);
    if (proyectoExistente) {
      proyectoExistente.tareas.push(tarea);
    } else {
      proyectos.push({ p_nombre: tarea.p_nombre, tareas: [tarea] });
    }
    return proyectos;
  }, []);

  return (
    <Layout
          titulo="TAREAS COMPLETADAS"
          sidebar={<MenuDinamico activeRoute="enproceso" />}
        >

          <div className="container my-4">
            {proyectosAgrupados.length > 0 && ( 
  <div className="barra-busqueda-global-container mb-4">
  <div className="barra-busqueda-global-wrapper">
    <FaSearch className="barra-busqueda-global-icon" />
    <input
      type="text"
      placeholder="Buscar tareas ..."
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


  {busqueda && (
    <div className="buscador-resultados-global">
      {tareasFiltradas.length} resultado(s) para "{busqueda}"
    </div>
  )}
</div>
            )}
            <div className="tcj-proyectos-filtros">
              
              {/* --- CAMBIO 2: Lógica de renderizado corregida --- */}
              <div className="tcj-container">
                {loading ? (
                  // ESTADO 1: Cargando
                  <div className="loader-container">
                    <div className="loader-logo">
                      <img src={logo3} alt="Cargando" />
                    </div>
                    <div className="loader-texto">CARGANDO TAREAS COMPLETADAS...</div>
                    <div className="loader-spinner"></div>
                  </div>
                ) : tareas.length === 0 ? (
                  <EmptyState
    titulo="TAREAS COMPLETADAS"
    mensaje="No hay tareas completadas."
    botonTexto="Volver al Tablero"
    onVolver={volverSegunRol} 
    icono={logo3}
  />
                )  : (
                  proyectosAgrupados.map(({ p_nombre, tareas: tareasDelProyecto }) => (
                    <div key={p_nombre} className="tcj-card">
                      <h3 className="tcj-proj-name">{p_nombre}</h3>
                      <ul className="tcj-task-list">
                        {tareasDelProyecto.map((tarea) => (
                          <li key={tarea.id_tarea} className="tcj-task-item">
                            <div className="tcj-task-info">
                              <div className="tcj-task-header">
                                <FaCheckCircle className="tcj-icon" />
                                <label className="tcj-task-name"> {tarea.t_nombre}</label>
                              </div>
                              <div className="tcj-task-footer">
                                <span className="tcj-task-status">{tarea.t_estatus}</span>
                                <span className="tcj-task-date">
                                  Vence: {tarea.tf_fin || tarea.fechaVencimiento}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
    </Layout>
  );
}

export default TareasCompletadasDepartamento;






