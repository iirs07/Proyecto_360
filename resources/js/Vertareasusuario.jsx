import React, { useState, useEffect } from "react";
import { FaExclamationCircle, FaCheckCircle, FaClock, FaTasks, FaBars  } from "react-icons/fa";
import "../css/global.css";
import "../css/vertareausuario.css";
import logo3 from "../imagenes/logo3.png";
import { useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";


function VertareasUsuario() {
  const [tareas, setTareas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true); 
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

 const location = useLocation();

useEffect(() => {
  const cargarTareas = async () => {
    let idProyecto = location.state?.id_proyecto;
    if (!idProyecto) {
      idProyecto = sessionStorage.getItem("id_proyecto");
    } else {
      sessionStorage.setItem("id_proyecto", idProyecto);
    }

    const token = localStorage.getItem("jwt_token");

    if (!idProyecto) return alert("No se encontró el proyecto.");
    if (!token) return alert("No hay token de autenticación.");

    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/proyectos/${idProyecto}/tareas-activas`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(async () => ({ error: await res.text() }));

      if (res.ok && data.tareas) {
        setTareas(data.tareas);
      } else {
        console.error("Error al cargar tareas:", data);
        setTareas([]);
      }
    } catch (err) {
      console.error("Error al cargar tareas:", err);
      alert("Ocurrió un error al cargar las tareas.");
    } finally {
      setLoading(false);
    }
  };

  cargarTareas();
}, [location.state]);


  const tareasFiltradas = tareas.filter(
    (t) =>
      !busqueda ||
      t.t_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.proyectoNombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const nombreProyecto = tareas[0]?.proyectoNombre || "Proyecto sin nombre";

  const getStatusIcon = (estatus) => {
    switch (estatus?.trim().toLowerCase()) {
      case "en proceso":
        return <FaClock className="icono-estado en-proceso" />;
      case "finalizado":
        return <FaCheckCircle className="icono-estado finalizada" />;
      case "pendiente":
      default:
        return <FaExclamationCircle className="icono-estado pendiente" />;
    }
  };

  const getEstatusClass = (estatus) => {
    if (!estatus) return "";
    const est = estatus.trim().toLowerCase();
    switch (est) {
      case "pendiente":
        return "vertarea-estatus-Pendiente";
      case "finalizado":
        return "tarea-estatus-Finalizado";
      case "en proceso":
        return "tarea-estatus-proceso";
      default:
        return "";
    }
  };

  const getItemClass = (estatus) => {
    const est = estatus?.toLowerCase();
    if (est === "finalizado") return "vertarea-item-tarea-finalizado";
    if (est === "pendiente") return "vertarea-item-tarea-pendiente";
    return "vertarea-item-tarea-proceso";
  };

  return (
     <Layout
        titulo="TAREAS DE UN PROYECTO"
        sidebar={<MenuDinamico activeRoute="Vertareas" />}
      >
      <div className="container my-4">
        {loading ? (
          <div className="loader-container">
            <div className="loader-logo">
              <img src={logo3} alt="Cargando" />
            </div>
            <div className="loader-texto">CARGANDO...</div>
            <div className="loader-spinner"></div>
          </div>
        ) : (
          <div className="ver-tarea-proyectos-card">
            <h3 className="vertarea-nombre-proyecto">{nombreProyecto}</h3>
            
            {tareasFiltradas.length > 0 && !busqueda && (
              <div className="vertarea-contador">
                <FaTasks />
                {tareasFiltradas.length} tarea{tareasFiltradas.length !== 1 ? 's' : ''} en total
              </div>
            )}

            {tareasFiltradas.length > 0 && (
              <ul className="vertarea-lista-tareas-TP">
                {tareasFiltradas.map((tarea) => (
                  <li key={tarea.id_tarea} className={getItemClass(tarea.t_estatus)}>
                    <div className="vertarea-info-tarea-TP">
                      <div className="vertarea-header">
                        {getStatusIcon(tarea.t_estatus)}
                        <label className="tarea-nombre-TP">{tarea.t_nombre}</label>
                      </div>
                      <div className="vertarea-footer">
                        <span className={`tarea-estatus-TP ${getEstatusClass(tarea.t_estatus)}`}>
                          {tarea.t_estatus}
                        </span>
                        <span className="vertarea-fecha-TP">
                          {tarea.tf_fin ? `Vence: ${tarea.tf_fin}` : 'Sin fecha límite'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

          </div>
        )}
      </div>
     </Layout>
  );
}

export default VertareasUsuario;













