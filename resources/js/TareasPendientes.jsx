import React, { useState, useEffect } from "react";
import '../css/global.css';
import "../css/TareasPendientes.css";
import logo3 from "../imagenes/logo3.png";
import { FaExclamationCircle, FaSearch } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";

function TareasPendientes() {
  const [busqueda, setBusqueda] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { volverSegunRol } = useRolNavigation();

  useEffect(() => {
    const fetchTareasPendientes = async () => {
      try {
        const usuario = JSON.parse(sessionStorage.getItem("usuario"));
        const token = sessionStorage.getItem("jwt_token");

        if (!usuario?.id_usuario || !token) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `http://127.0.0.1:8000/api/tareasPendientes/departamento?usuario=${usuario.id_usuario}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (res.status === 401) {
          lsessionStorage.removeItem("jwt_token");
          sessionStorage.removeItem("usuario");
          navigate("/Login", { replace: true });
          return;
        }

        const data = await res.json();
        if (data.success) {
          setProyectos(data.proyectos || []);
        } else {
          console.error("Error al cargar proyectos y tareas:", data.mensaje);
        }
      } catch (error) {
        console.error("Error al cargar proyectos y tareas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTareasPendientes();
  }, []);

  // Filtrado de proyectos según búsqueda
  const proyectosFiltrados = proyectos
    .map(({ proyecto, tareas }) => {
      if (!proyecto || !tareas) return { proyecto: null, tareas: [] };

      if (!busqueda) return { proyecto, tareas };

      const proyectoCoincide = proyecto.p_nombre
        ?.toLowerCase()
        .includes(busqueda.toLowerCase());

      const tareasFiltradas = proyectoCoincide
        ? tareas
        : tareas.filter((t) =>
            t.t_nombre?.toLowerCase().includes(busqueda.toLowerCase())
          );

      return { proyecto, tareas: tareasFiltradas };
    })
    .filter(({ proyecto, tareas }) => proyecto && tareas.length > 0);

  return (
    <Layout
      titulo="TAREAS PENDIENTES"
      sidebar={<MenuDinamico activeRoute="enproceso" />}
    >
      <div className="container my-4">
        {/* Loader */}
        {loading && (
          <div className="loader-container">
            <div className="loader-logo">
              <img src={logo3} alt="Cargando" />
            </div>
            <div className="loader-texto">CARGANDO TAREAS PENDIENTES...</div>
            <div className="loader-spinner"></div>
          </div>
        )}

        {/* EmptyState si no hay proyectos */}
        {!loading && proyectos.length === 0 && (
          <EmptyState
            titulo="TAREAS PENDIENTES"
            mensaje="No hay tareas pendientes."
            botonTexto="Volver al Tablero"
            onVolver={volverSegunRol}
            icono={logo3}
          />
        )}

        {/* Barra de búsqueda */}
        {!loading && proyectos.length > 0 && (
          <div className="barra-busqueda-global-container mb-4">
            <div className="barra-busqueda-global-wrapper">
              <FaSearch className="barra-busqueda-global-icon" />
              <input
                type="text"
                placeholder="Buscar..."
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
                {proyectosFiltrados.length} resultado(s) para "{busqueda}"
              </div>
            )}
          </div>
        )}

        {/* Renderizado de proyectos y tareas */}
        {!loading && proyectosFiltrados.length > 0 && (
          <div className="tareaspendientesj-contenedor-buscador-y-tarjetas">
            {proyectosFiltrados.map(({ proyecto, tareas }) => (
              <div
                key={proyecto.id_proyecto}
                className="tareaspendientesj-proyectos-card"
              >
                <h3 className="tareaspendientesj-nombre-proyecto">
                  {proyecto.p_nombre}
                </h3>

                <ul>
                  {tareas.map((tarea) => {
                    // FECHA ACTUAL
                    const hoy = new Date();

                    // FECHA DE FIN DE LA TAREA
                    const fechaFin = new Date(
                      tarea.tf_fin || tarea.fechaVencimiento
                    );

                    // ¿ESTÁ VENCIDA?
                    const vencida = fechaFin < hoy;

                    return (
                      <li
                        key={tarea.id_tarea}
                        className={`tareaspendientesj-item-tarea-pendiente ${
                          vencida ? "vencida" : ""
                        }`}
                      >
                        <div className="tareaspendientesj-info-tarea-TP">
                          <div className="tareaspendientesj-tarea-header">
                            <FaExclamationCircle
  className={`tareaspendientesj-icono-pendiente ${
    vencida ? "vencida" : ""
  }`}
/>

                            <label className="tareaspendientesj-tarea-nombre-TP">
                              {tarea.t_nombre}
                            </label>
                          </div>

                          <div className="tareaspendientesj-tarea-footer">
                            <span
  className={`tareaspendientesj-tarea-estatus-Pendiente ${
    vencida ? "vencida" : ""
  }`}
>
  {tarea.t_estatus}
</span>


                            <span className="tareaspendientesj-tarea-fecha-TP">
                              Finaliza:{" "}
                              {tarea.tf_fin || tarea.fechaVencimiento}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default TareasPendientes;












