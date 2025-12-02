import React, { useState, useEffect } from "react";
import { FaExclamationCircle, FaCheckCircle, FaClock, FaTasks } from "react-icons/fa";
import "../css/global.css";
import "../css/ListaDeTareas.css"; 
import { useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";

function VertareasUsuario() {
  const [tareas, setTareas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const cargarTareas = async () => {
      let idProyecto = location.state?.id_proyecto || sessionStorage.getItem("id_proyecto");
      if (idProyecto) sessionStorage.setItem("id_proyecto", idProyecto);

      const token = sessionStorage.getItem("jwt_token");
      if (!idProyecto || !token) return;

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
        const data = await res.json();
        if (res.ok && data.tareas) setTareas(data.tareas);
        else setTareas([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargarTareas();
  }, [location.state]);

  const tareasFiltradas = tareas.filter((t) =>
      !busqueda ||
      t.t_nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const nombreProyecto = tareas[0]?.proyectoNombre || "Proyecto";

  // --- LÓGICA DE URGENCIA (SOLO PARA PENDIENTES) ---
  const obtenerUrgencia = (fechaFinString) => {
    if (!fechaFinString) return "tiempo"; 
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaFinString);
    fechaFin.setHours(0, 0, 0, 0);

    const diferencia = fechaFin - hoy;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

    if (dias < 0) return "vencida"; // Rojo
    if (dias === 0) return "hoy";   // Naranja
    if (dias <= 3) return "alerta"; // Amarillo
    return "tiempo";                // Verde/Blanco
  };

  // --- CLASES DINÁMICAS ---
  const getContainerClass = (estatus, fechaFin) => {
    const est = estatus?.toLowerCase().trim();
    if (est === "completada" || est === "finalizado") return "lt-item-finalizado";
    if (est === "en proceso") return "lt-item-proceso";
    if (est === "pendiente") return `lt-item-pendiente ${obtenerUrgencia(fechaFin)}`;
    return "";
  };

  const getBadgeClass = (estatus, fechaFin) => {
    const est = estatus?.toLowerCase().trim();
    if (est === "completada" || est === "finalizado") return "lt-badge-finalizado";
    if (est === "en proceso") return "lt-badge-proceso";
    if (est === "pendiente") return `lt-badge-pendiente ${obtenerUrgencia(fechaFin)}`;
    return "";
  };

  const getIcon = (estatus, fechaFin) => {
    const est = estatus?.toLowerCase().trim();
    if (est === "completada" || est === "finalizado") return <FaCheckCircle className="lt-icono-estado lt-icono-finalizado" />;
    if (est === "en proceso") return <FaClock className="lt-icono-estado lt-icono-proceso" />;
    
    // Pendiente con color dinámico
    const urgencia = obtenerUrgencia(fechaFin);
    return <FaExclamationCircle className={`lt-icono-estado icono-pendiente ${urgencia}`} />;
  };

  return (
    <Layout titulo="TAREAS DE UN PROYECTO" sidebar={<MenuDinamico activeRoute="Vertareas" />}>
      <div className="contenedor-global">
        {loading ? (
          <div className="loader-container"><div className="loader-spinner"></div></div>
        ) : (
          <div className="lt-card-principal">
            <h3 className="lt-titulo-proyecto">{nombreProyecto}</h3>
            
          <div className="lt-contador-tareas">
  <FaTasks /> {tareasFiltradas.length} tareas registradas
</div>


            <ul className="lt-lista-tareas-grid">
              {tareasFiltradas.map((tarea) => (
                <li key={tarea.id_tarea} className={`lt-tarea-card ${getContainerClass(tarea.t_estatus, tarea.tf_fin)}`}>
                  
                  {/* Izquierda: Icono y Nombre */}
                  <div className="lt-tarea-contenido-izq">
                    <div className="lt-icono-wrapper">
                      {getIcon(tarea.t_estatus, tarea.tf_fin)}
                    </div>
                    <span className="lt-tarea-nombre">{tarea.t_nombre}</span>
                  </div>

                  {/* Derecha: Badge y Fecha */}
                  <div className="lt-tarea-contenido-der">
                    <span className={`lt-tarea-badge ${getBadgeClass(tarea.t_estatus, tarea.tf_fin)}`}>
                      {tarea.t_estatus}
                    </span>
                    <span className="lt-tarea-fecha">
                      {tarea.tf_fin ? `Vence: ${tarea.tf_fin}` : 'Sin fecha'}
                    </span>
                  </div>

                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default VertareasUsuario;












