import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/ProyectosM.css";
import { FaCalendarAlt, FaTasks, FaExclamationTriangle, FaSearch, FaEdit } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import SelectDinamico from "../components/SelectDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";

function ProyectosListaModificar() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("alfabetico");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { volverSegunRol } = useRolNavigation();

  useEffect(() => {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    const idUsuario = usuario?.id_usuario;
    const token = sessionStorage.getItem("jwt_token");

    if (!idUsuario || !token) {
      setLoading(false);
      return;
    }

    fetch(
      `http://127.0.0.1:8000/api/proyectos/lista/modificar?usuario=${idUsuario}`,
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
    { value: "alfabetico", label: "Nombre (A-Z)" },
    { value: "alfabetico_desc", label: "Nombre (Z-A)" },
    { value: "fecha_proxima", label: "Fecha más próxima" },
    { value: "fecha_lejana", label: "Fecha más lejana" },
  ];

  const hayProyectos = proyectos.length > 0;
  const mostrarSelect = hayProyectos && proyectosFiltrados.length > 0;

  return (
    <Layout titulo="MODIFICAR PROYECTOS" sidebar={<MenuDinamico activeRoute="Nuevo proyecto" />}>
      <div className="container my-4">
        {/* Barra de búsqueda y select */}
        {hayProyectos && (
          <>
            <div className="barra-busqueda-global-container mb-4">
              <div className="barra-busqueda-global-wrapper">
                <FaSearch className="barra-busqueda-global-icon" />
                <input
                  type="text"
                  placeholder="Buscar proyectos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="barra-busqueda-global-input"
                />
                {busqueda && (
                  <button className="buscador-clear-global" onClick={() => setBusqueda("")}>
                    <FiX />
                  </button>
                )}
              </div>
              {busqueda && (
      <div className="buscador-resultados-global">
        {proyectosFiltrados.length} resultado(s) para "{busqueda}"
      </div>
    )}
              {mostrarSelect && (
  <div style={{ marginTop: '10px' }}>
    <SelectDinamico
      opciones={opciones.map((o) => o.label)}
      valor={opciones.find((o) => o.value === filtro)?.label}
      setValor={(labelSeleccionado) => {
        const opcion = opciones.find((o) => o.label === labelSeleccionado);
        if (opcion) setFiltro(opcion.value);
      }}
      placeholder="Selecciona un filtro"
    />
  </div>
)}

            </div>
          </>
        )}

        <div className="modificar-proyectos-lista">
    {loading ? (
        // LOADER
        <div className="loader-container">
            <div className="loader-logo">
                <img src={logo3} alt="Cargando" />
            </div>
            <div className="loader-texto">CARGANDO PROYECTOS...</div>
            <div className="loader-spinner"></div>
        </div>
    ) : !hayProyectos ? (
        //  BACKEND NO DEVOLVIÓ NADA
        <EmptyState
            titulo="MODIFICAR PROYECTOS"
            mensaje="No hay proyectos disponibles."
            botonTexto="Volver al Tablero"
            onVolver={volverSegunRol}
            icono={logo3}
        />
    ) : proyectosFiltrados.length === 0 ? (
        // BACKEND SÍ DEVOLVIÓ PROYECTOS
        // PERO LA BÚSQUEDA NO ENCONTRÓ NADA
        null
    ) : (
        // ✔️ MOSTRAR TARJETAS FILTRADAS
        proyectosFiltrados.map((p) => {
            const fechaFin = new Date(p.pf_fin);
            const hoy = new Date();
            fechaFin.setHours(0, 0, 0, 0);
            hoy.setHours(0, 0, 0, 0);

            const estaVencido = fechaFin < hoy;

            return (
                <div key={p.id_proyecto} className="modificar-proyectos-card">
                    <h5 className="modificar-proyectos-nombre">{p.p_nombre}</h5>

                    <div className="modificar-proyectos-info">
                        <div className="modificar-proyectos-info-item">
                            <FaCalendarAlt className="modificar-proyectos-info-icon" />
                            <span>
                                <strong>Fecha fin:</strong>{" "}
                                {fechaFin.toLocaleDateString()}
                            </span>
                        </div>

                        <div className="modificar-proyectos-info-item">
                            <FaTasks className="modificar-proyectos-info-icon" />
                            <span>
                                <strong>Tareas:</strong> {p.total_tareas || 0}
                            </span>
                        </div>

                        {estaVencido && (
                            <div className="modificar-proyectos-alerta">
                                <FaExclamationTriangle /> <strong>¡Vencido!</strong>
                            </div>
                        )}
                    </div>

                    <div className="modificar-proyectos-botones">
                        <button
                            className="modificar-proyectos-btn"
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



