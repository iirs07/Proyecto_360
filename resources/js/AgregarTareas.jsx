import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import "../css/agregartareas.css";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import { FaExclamationTriangle, FaCalendarAlt } from "react-icons/fa";


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

const ErrorMensaje = ({ mensaje }) => {
  if (!mensaje) return null;
  return (
    <small className="error">
      <FaExclamationTriangle className="error-icon" />
      {mensaje}
    </small>
  );
};

function AgregarTareas() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id_usuario, id_proyecto, id_departamento_inicial } = location.state || {};

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
  const [loading, setLoading] = useState(false);
  const [idTareaRecienCreada, setIdTareaRecienCreada] = useState(null);

  
    const [minFecha, setMinFecha] = useState(null);
const [maxFecha, setMaxFecha] = useState(null);
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`
  });

  useEffect(() => {
  if (!id_proyecto) return;

  axios.get(`/api/proyectos/${id_proyecto}/fechasProyecto`)
    .then(res => {
      if (res.data.success) {
        const inicio = new Date(res.data.pf_inicio);
        const fin = new Date(res.data.pf_fin);
        const inicioMex = new Date(inicio);
        inicioMex.setHours(inicioMex.getHours() + 6);

        const finMex = new Date(fin);
        finMex.setHours(finMex.getHours() + 6);

        console.log("Fechas ajustadas a México:");
        console.log("Inicio:", inicioMex);
        console.log("Fin:", finMex);
        setMinFecha(inicioMex);
        setMaxFecha(finMex);
      }
    })
    .catch(err => console.error(err));
}, [id_proyecto]);

  const ajustarAltura = (ref) => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  };

  useEffect(() => {
    axios
      .get("/api/CatalogoDepartamentos", { headers: getAuthHeaders() })
      .then(res => {
        setDepartamentos(res.data);
        if (id_departamento_inicial) {
          setDepartamentoSeleccionado(parseInt(id_departamento_inicial));
        } else if (res.data.length > 0) {
          setDepartamentoSeleccionado(res.data[0].id_departamento);
        }
      })
      .catch(err => console.error(err));
  }, [id_departamento_inicial]);

  useEffect(() => {
    if (!departamentoSeleccionado) return;
    axios
      .get(`/api/departamentos/${departamentoSeleccionado}/usuarios`, { headers: getAuthHeaders() })
      .then(res => {
        setUsuarios(res.data);
        setUsuarioSeleccionado("");
      })
      .catch(err => {
        console.error(err);
        setUsuarios([]);
        setUsuarioSeleccionado("");
      });
  }, [departamentoSeleccionado]);

  const handleInputChange = campo => setErrores(prev => ({ ...prev, [campo]: null }));

  const handleGuardar = async () => {
    const nombre = nombreTareaRef.current.value.trim();
    const descripcion = descripcionTareaRef.current.value.trim();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

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

    try {
      setLoading(true);
      const res = await axios.post("/api/tareas", nuevaTarea, { headers: getAuthHeaders() });
      if (res.data.success) {
        setIdTareaRecienCreada(res.data.id);
        nombreTareaRef.current.value = "";
        descripcionTareaRef.current.value = "";
        setFechaInicio(null);
        setFechaFin(null);
        setUsuarioSeleccionado("");
        setErrores({});
        setTareaGuardada(true);
      } else {
        console.error("Error al guardar la tarea");
      }
    } catch (err) {
      console.error("Error al guardar la tarea", err);
    } finally {
      setLoading(false);
    }
  };
  const ErrorMensaje = ({ mensaje }) => {
  if (!mensaje) return null;
  return (
    <small className="error">
      <FaExclamationTriangle className="error-icon" />
      {mensaje}
    </small>
  );
};


  // Cancelar tarea
  const handleCancelar = () => {
    nombreTareaRef.current.value = "";
    descripcionTareaRef.current.value = "";
    setFechaInicio(null);
    setFechaFin(null);
    setUsuarioSeleccionado("");
    setErrores({});
    setTareaGuardada(false);
    setIdTareaRecienCreada(null);
  };

  return (
   <Layout
          titulo="NUEVA TAREA"
          sidebar={<MenuDinamico activeRoute="Nuevo proyecto" />}
        >
      <div className="contenedor-nuevo-proyecto">
        <div className="row justify-content-center">
         <div className="col-12 col-md-8 col-lg-6 contenedor-nuevo-proyecto">
            <h1 className="titulo-global">Agregar nueva tarea</h1>

            <div className="mb-3 d-flex flex-column">
              <label htmlFor="nombreTarea" className="form-label fw-bold">Nombre de la tarea</label>
              <textarea
                id="nombreTarea"
                ref={nombreTareaRef}
                className="form-control form-input"
                placeholder="Escribe el nombre de la tarea"
                rows={1}
                onInput={() => { ajustarAltura(nombreTareaRef); handleInputChange("nombre"); }}
              />
              <ErrorMensaje mensaje={errores.nombre} />
            </div>

            {/* Descripción */}
            <div className="mb-3 d-flex flex-column">
              <label htmlFor="descripcionTarea" className="form-label fw-bold">Descripción</label>
              <textarea
                id="descripcionTarea"
                ref={descripcionTareaRef}
                className="form-control form-input"
                placeholder="Escribe la descripción"
                rows={2}
                onInput={() => { ajustarAltura(descripcionTareaRef); handleInputChange("descripcion"); }}
              />
              <ErrorMensaje mensaje={errores.descripcion} />
            </div>

            {/* Departamento */}
            <div className="mb-3 d-flex flex-column">
              <label htmlFor="departamento" className="form-label fw-bold">Departamento</label>
              <select
                id="departamento"
                value={departamentoSeleccionado}
                onChange={(e) => setDepartamentoSeleccionado(parseInt(e.target.value))}
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
              <label htmlFor="usuario" className="form-label fw-bold">Usuario</label>
              <select
                id="usuario"
                value={usuarioSeleccionado}
                onChange={(e) => { setUsuarioSeleccionado(e.target.value); handleInputChange("usuario"); }}
                className="form-select"
              >
                <option value="">Seleccionar usuario</option>
                {usuarios.map(u => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {`${u.nombre} ${u.apaterno} ${u.amaterno}`.split(" ")
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
                <label className="form-label fw-bold mb-1">Fecha de inicio</label>
                <DatePicker
                  selected={fechaInicio}
                  onChange={date => { setFechaInicio(date); handleInputChange("inicio"); }}
                  dateFormat="dd/MM/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  locale="es"
                 minDate={minFecha}      // no puede ser antes del inicio del proyecto
  maxDate={fechaFin || maxFecha} // opcional: no más allá del fin del proyecto

                  customInput={<CalendarButton />}
                />
                 <ErrorMensaje mensaje={errores.inicio} />
        
              </div>
              <div className="col-12 col-md-6 mb-3 d-flex flex-column">
                <label className="form-label fw-bold mb-1">Fecha de fin</label>
                <DatePicker
                  selected={fechaFin}
                  onChange={date => { setFechaFin(date); handleInputChange("fin"); }}
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
  <button type="button" className="btn-form w-100 w-md-auto" onClick={handleCancelar} disabled={loading}>
    Cancelar
  </button>
  <button type="button" className="btn-form w-100 w-md-auto" onClick={handleGuardar} disabled={loading}>
    {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
    {loading ? "Guardando…" : "Guardar Tarea"}
  </button>
</div>
            {tareaGuardada && (
           <div className="mt-3 d-flex justify-content-center">
  <button
    type="button"
    className="btn-form"
    style={{ width: "100%", maxWidth: "300px" }}
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






