import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/agregartareas.css";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import ErrorMensaje from "../components/ErrorMensaje";
import { FaCalendarAlt } from "react-icons/fa";
import logo3 from "../imagenes/logo3.png";


const CalendarButton = React.forwardRef(({ value, onClick }, ref) => (
  <button
    type="button"
    className="btn-calendario w-100 d-flex align-items-center gap-2"
    onClick={onClick}
    ref={ref}
  >
    <FaCalendarAlt className={!value ? "text" : ""} />
    <span className={!value ? "text" : ""}>{value || "Seleccionar fecha"}</span>
  </button>
));

function AgregarTareas() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id_proyecto, id_departamento_inicial } = location.state || {};

  const nombreTareaRef = useRef(null);
  const descripcionTareaRef = useRef(null);

  const [departamentos, setDepartamentos] = useState([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(id_departamento_inicial || "");
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");

  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [errores, setErrores] = useState({});
  const [tareaGuardada, setTareaGuardada] = useState(false);

  const [loadingInicial, setLoadingInicial] = useState(false);
  const [loadingTarea, setLoadingTarea] = useState(false);

  const [idTareaRecienCreada, setIdTareaRecienCreada] = useState(null);
  const [minFecha, setMinFecha] = useState(null);
  const [maxFecha, setMaxFecha] = useState(null);
  const [camposModificados, setCamposModificados] = useState({});


  const ajustarAltura = (ref) => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  };

  const getHeaders = () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("usuario");
      navigate("/Login", { replace: true });
      return null;
    }
    return { Authorization: `Bearer ${token}`, Accept: "application/json" };
  };


  // ============================================================
  //  CARGA INICIAL: fechas + departamentos + usuarios
  // ============================================================
  useEffect(() => {
    const cargarTodo = async () => {
      const headers = getHeaders();
      if (!headers) return;

      try {
        setLoadingInicial(true);

        const [fechasRes, depRes] = await Promise.all([
          fetch(`/api/proyectos/${id_proyecto}/fechasProyecto`, { headers }),
          fetch("/api/CatalogoDepartamentos", { headers })
        ]);

        if (fechasRes.status === 401 || depRes.status === 401) {
          localStorage.removeItem("jwt_token");
          navigate("/Login", { replace: true });
          return;
        }

        const fechas = await fechasRes.json();
        const deps = await depRes.json();

        // Fechas del proyecto
        if (fechas.success) {
          const inicio = new Date(fechas.pf_inicio);
          const fin = new Date(fechas.pf_fin);

          const inicioMex = new Date(inicio);
          inicioMex.setHours(inicioMex.getHours() + 6);

          const finMex = new Date(fin);
          finMex.setHours(finMex.getHours() + 6);

          setMinFecha(inicioMex);
          setMaxFecha(finMex);
        }

        // Departamentos
        setDepartamentos(deps);

        let depFinal;

        if (id_departamento_inicial) {
          depFinal = parseInt(id_departamento_inicial);
        } else if (deps.length > 0) {
          depFinal = deps[0].id_departamento;
        } else {
          depFinal = "";
        }

        setDepartamentoSeleccionado(depFinal);

        // Usuarios iniciales del primer departamento
        if (depFinal) {
          const usuariosRes = await fetch(`/api/departamentos/${depFinal}/usuarios`, { headers });

          if (usuariosRes.status === 401) {
            localStorage.removeItem("jwt_token");
            navigate("/Login", { replace: true });
            return;
          }

          const usuariosData = await usuariosRes.json();
          setUsuarios(usuariosData);
        }

        setLoadingInicial(false);
      } catch (err) {
        console.error(err);
        setLoadingInicial(false);
      }
    };

    cargarTodo();
  }, []);


  // ============================================================
  //  CARGA SOLO USUARIOS CUANDO CAMBIA EL DEPARTAMENTO
  // ============================================================
  useEffect(() => {
    if (!departamentoSeleccionado) return;

    const fetchUsuarios = async () => {
      const headers = getHeaders();
      if (!headers) return;

      try {
        const res = await fetch(`/api/departamentos/${departamentoSeleccionado}/usuarios`, { headers });

        if (res.status === 401) {
          localStorage.removeItem("jwt_token");
          navigate("/Login", { replace: true });
          return;
        }

        const data = await res.json();
        setUsuarios(data);
        setUsuarioSeleccionado("");
      } catch (err) {
        console.error(err);
        setUsuarios([]);
        setUsuarioSeleccionado("");
      }
    };

    fetchUsuarios();
  }, [departamentoSeleccionado]);



  // ============================================================
  //  GUARDAR NUEVA TAREA
  // ============================================================
  const handleGuardar = async () => {
    const nombre = nombreTareaRef.current.value.trim();
    const descripcion = descripcionTareaRef.current.value.trim();
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

    const nuevosErrores = {};
    if (!nombre) nuevosErrores.nombre = "El nombre de la tarea es obligatorio.";
    if (!descripcion) nuevosErrores.descripcion = "La descripción es obligatoria.";
    if (!fechaInicio) nuevosErrores.inicio = "Selecciona la fecha de inicio.";
    else if (fechaInicio < hoy) nuevosErrores.inicio = "La fecha de inicio no puede ser anterior a hoy.";
    if (!fechaFin) nuevosErrores.fin = "Selecciona la fecha de fin.";
    else if (fechaInicio && fechaFin < fechaInicio) nuevosErrores.fin = "La fecha de fin no puede ser anterior a la fecha de inicio.";
    if (!usuarioSeleccionado) nuevosErrores.usuario = "Selecciona un usuario.";

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const nuevaTarea = {
      id_usuario: parseInt(usuarioSeleccionado),
      id_proyecto,
      t_nombre: nombre,
      descripcion,
      tf_inicio: fechaInicio.toISOString().split("T")[0],
      tf_fin: fechaFin.toISOString().split("T")[0],
      id_departamento: parseInt(departamentoSeleccionado),
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("jwt_token")}`
    };

    try {
      setLoadingTarea(true);
      const res = await fetch("http://127.0.0.1:8000/api/AgregarTareas", {
        method: "POST",
        headers,
        body: JSON.stringify(nuevaTarea),
      });

      if (res.status === 401) {
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("usuario");
        navigate("/Login", { replace: true });
        return;
      }

      const data = await res.json();

      if (data.success) {
        setTareaGuardada(true);
        setIdTareaRecienCreada(data.tarea.id_tarea);
        limpiarCampos(true);
      } else {
        console.error("Error al crear tarea:", data.message);
      }
    } catch (err) {
      console.error("Error al guardar tarea:", err);
    } finally {
      setLoadingTarea(false);
    }
  };


  const limpiarCampos = (mantener) => {
    if (nombreTareaRef.current) nombreTareaRef.current.value = "";
    if (descripcionTareaRef.current) descripcionTareaRef.current.value = "";

    ajustarAltura(nombreTareaRef);
    ajustarAltura(descripcionTareaRef);

    setFechaInicio(null);
    setFechaFin(null);
    setUsuarioSeleccionado("");
    setErrores({});
    if (!mantener) setTareaGuardada(false);
    setIdTareaRecienCreada(null);
  };

  const handleCancelar = () => limpiarCampos();

  const handleInputChange = (campo) => {
  setErrores(prev => ({ ...prev, [campo]: null }));
  setCamposModificados(prev => ({ ...prev, [campo]: true }));
};

useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (Object.keys(camposModificados).length > 0) {
      e.preventDefault();
      e.returnValue = ""; 
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [camposModificados]);



  if (loadingInicial) {
    return (
      <div className="loader-container">
        <div className="loader-logo"><img src={logo3} alt="Cargando" /></div>
        <div className="loader-texto">CARGANDO...</div>
        <div className="loader-spinner"></div>
      </div>
    );
  }


  return (
    <Layout titulo="NUEVA TAREA" sidebar={<MenuDinamico activeRoute="Nueva tarea" />}>
      <div className="agregartareas-contenedor">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 agregartareas-contenedor">
            <h1 className="titulo-global">Agregar nueva tarea</h1>

            {/* Nombre */}
            <div className="mb-3 d-flex flex-column">
              <label htmlFor="nombreTarea" className="agregartareas-label fw-bold">Nombre de la tarea</label>
              <textarea
                id="nombreTarea"
                ref={nombreTareaRef}
                className="form-control agregartareas-input"
                placeholder="Escribe el nombre de la tarea"
                rows={1}
                onInput={() => {
                  ajustarAltura(nombreTareaRef);
                  handleInputChange("nombre");
                }}
              />
              <ErrorMensaje mensaje={errores.nombre} />
            </div>

            {/* Descripción */}
<div className="mb-3 d-flex flex-column">
  <label htmlFor="descripcionTarea" className="agregartareas-label fw-bold">
    Descripción
  </label>
  <textarea
    id="descripcionTarea"
    ref={descripcionTareaRef}
    className="form-control agregartareas-input"
    placeholder="Escribe la descripción"
    rows={2}
    style={{ overflow: "hidden" }}
    onInput={() => {
      ajustarAltura(descripcionTareaRef);
      handleInputChange("descripcion");
    }}
  />
  <ErrorMensaje mensaje={errores.descripcion} />
</div>


            {/* Departamento */}
            <div className="mb-3 d-flex flex-column">
              <label htmlFor="departamento" className="agregartareas-label fw-bold">Departamento</label>
              <select
                id="departamento"
                value={departamentoSeleccionado}
                onChange={(e) => {
  setDepartamentoSeleccionado(parseInt(e.target.value));
  handleInputChange("departamento");
}}

                className="form-select"
              >
                {departamentos.map(d => (
                  <option key={d.id_departamento} value={d.id_departamento}>
                    {d.d_nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Usuario */}
            <div className="mb-3 d-flex flex-column">
              <label htmlFor="usuario" className="agregartareas-label fw-bold">Usuario</label>
              <select
                id="usuario"
                value={usuarioSeleccionado}
                onChange={(e) => {
                  setUsuarioSeleccionado(e.target.value);
                  handleInputChange("usuario");
                }}
                className="form-select"
              >
                <option value="">Seleccionar usuario</option>
                {usuarios.map(u => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {`${u.nombre} ${u.apaterno} ${u.amaterno}`
                      .split(" ")
                      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
                      .join(" ")}
                  </option>
                ))}
              </select>
              <ErrorMensaje mensaje={errores.usuario} />
            </div>

            {/* Fechas */}
            <div className="row mb-3">
              <div className="col-12 col-md-6 mb-3 d-flex flex-column">
                <label className="agregartareas-label fw-bold mb-1">Fecha de inicio</label>
                <DatePicker
                  selected={fechaInicio}
                  onChange={date => {
                    setFechaInicio(date);
                    handleInputChange("inicio");
                  }}
                  dateFormat="dd/MM/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  locale="es"
                  minDate={minFecha}
                  maxDate={fechaFin || maxFecha}
                  customInput={<CalendarButton />}
                />
                <ErrorMensaje mensaje={errores.inicio} />
              </div>

              <div className="col-12 col-md-6 mb-3 d-flex flex-column">
                <label className="agregartareas-label fw-bold mb-1">Fecha de fin</label>
                <DatePicker
                  selected={fechaFin}
                  onChange={date => {
                    setFechaFin(date);
                    handleInputChange("fin");
                  }}
                  dateFormat="dd/MM/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  locale="es"
                  minDate={fechaInicio || minFecha}
                  maxDate={maxFecha}
                  customInput={<CalendarButton />}
                />
                <ErrorMensaje mensaje={errores.fin} />
              </div>
            </div>

            <div className="d-flex flex-column flex-md-row gap-2 justify-content-center">
              <button
                type="button"
                className="btn-agregartareas cancelar w-100 w-md-auto"
                onClick={handleCancelar}
                disabled={loadingTarea}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-agregartareas guardar w-100 w-md-auto"
                onClick={handleGuardar}
                disabled={loadingTarea}
              >
                {loadingTarea && (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                )}
                {loadingTarea ? "Guardando…" : "Guardar Tarea"}
              </button>
            </div>

            {tareaGuardada && !loadingTarea && (
              <div className="mt-3 d-flex justify-content-center">
                <button
                  type="button"
                  className="agregartareas-btn-vt"
                  onClick={() => navigate("/Vertareasusuario", { state: { id_proyecto } })}
                >
                  <span style={{ fontSize: "1.5rem", marginRight: "8px", lineHeight: "0.8" }}>←</span>
                  Ver Tareas
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AgregarTareas;








