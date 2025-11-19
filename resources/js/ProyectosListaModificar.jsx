import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/ProyectosM.css";
import { FaAngleDown, FaSearch, FaProjectDiagram } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import SelectDinamico from "../components/SelectDinamico";


function ProyectosListaModificar() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("alfabetico");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const idUsuario = usuario?.id_usuario;
    const token = localStorage.getItem("jwt_token");

    if (!idUsuario || !token) {
      console.error("❌ No se encontró id_usuario o token JWT");
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
          localStorage.removeItem("jwt_token");
          localStorage.removeItem("usuario");
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
    localStorage.setItem("id_proyecto", idProyecto);
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
    <Layout titulo="LISTA DE PROYECTOS" sidebar={<MenuDinamico activeRoute="Nuevo proyecto" />}>
      <div className="container my-4">
        <h1 className="titulo-global">Proyectos</h1>

        {/* Barra de búsqueda y select */}
        {hayProyectos && (
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
                  <button className="buscador-clear-global" onClick={() => setBusqueda("")}>
                    <FiX />
                  </button>
                )}
              </div>
            </div>

          {mostrarSelect && (
  <SelectDinamico
    opciones={opciones.map(o => o.label)} // pasamos solo los labels como opciones
    valor={opciones.find(o => o.value === filtro)?.label} // valor seleccionado
    setValor={(labelSeleccionado) => {
      const opcion = opciones.find(o => o.label === labelSeleccionado);
      if (opcion) setFiltro(opcion.value);
    }}
    placeholder="Selecciona un filtro"
  />
)}

          </>
        )}

        {/* Lista de proyectos / estados vacíos */}
        <div className="modificar-proyectos-lista">
          {loading ? (
            <div className="loader-container">
              <div className="loader-logo">
                <img src={logo3} alt="Cargando" />
              </div>
              <div className="loader-texto">CARGANDO...</div>
              <div className="loader-spinner"></div>
            </div>
          ) : proyectos.length === 0 ? (
            <div className="empty-state-global">
              <FaProjectDiagram className="empty-icon-global" size={48} />
              <h3 className="empty-title-global">No tienes proyectos activos</h3>
              <p className="empty-text-global">
                Cuando se te asignen proyectos, aparecerán aquí
              </p>
            </div>
          ) : proyectosFiltrados.length === 0 ? (
            <div className="empty-state-global">
              <FaProjectDiagram className="empty-icon-global" size={48} />
              <h3 className="empty-title-global">No se encontraron proyectos</h3>
              <p className="empty-text-global">Intenta con otros términos de búsqueda</p>
            </div>
          ) : (
            proyectosFiltrados.map((p) => (
              <div key={p.id_proyecto} className="modificar-proyectos-card">
                <h5 className="modificar-proyectos-nombre">{p.p_nombre}</h5>
                <div className="modificar-proyectos-fp">
                  <div>Fin: {p.pf_fin}</div>
                </div>
                <div className="modificar-proyectos-botones">
                  <button
                    className="modificar-proyectos-btn"
                    onClick={() => modificar(p.id_proyecto)}
                  >
                    Modificar proyecto
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

export default ProyectosListaModificar;


