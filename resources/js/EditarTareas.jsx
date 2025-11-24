import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCalendarAlt } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import "../css/global.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import ErrorMensaje from "../components/ErrorMensaje";
import { useRolNavigation } from "./utils/navigation";
import logo3 from "../imagenes/logo3.png";

registerLocale("es", es);

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
const EstadoGuardado = ({ tipo }) => (
  <div className="mp-estado-guardado-wrapper mb-3">
    <div className={`mp-estado-guardado ${tipo === 'guardado' ? 'guardado' : 'no-guardado'}`}>
      <span className="indicador"></span>
      {tipo === 'guardado' ? 'Todos los cambios guardados' : 'Cambios sin guardar'}
    </div>
  </div>
);

function EditarTareas() {
  const location = useLocation();
  const navigate = useNavigate();
  const tareaState = location.state?.tarea || {};
  const tareaId = tareaState.id_tarea;
  const { volverSegunRol } = useRolNavigation();
  const [camposModificados, setCamposModificados] = useState({});
const [guardadoExitoso, setGuardadoExitoso] = useState(false);
const [mostrarEstado, setMostrarEstado] = useState(false);


  const nombreTareaRef = useRef(null);
  const descripcionTareaRef = useRef(null);

  const ajustarAltura = (ref) => {
  if (ref.current) {
    ref.current.style.height = "auto";
    ref.current.style.height = ref.current.scrollHeight + "px";
  }
};


const handleInputChange = (campo) => {
  setErrores((prev) => ({ ...prev, [campo]: "" }));
  setGuardadoExitoso(false); 
};


  const minFecha = new Date();
  minFecha.setHours(0, 0, 0, 0);
  const maxFecha = new Date();
  maxFecha.setFullYear(maxFecha.getFullYear() + 1);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [datosOriginales, setDatosOriginales] = useState(null);

  const token = localStorage.getItem("jwt_token");

  // ===== FETCH DEPARTAMENTOS =====
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const res = await axios.get("/api/departamentos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const departamentosMapeados = res.data.map((d) => ({
          id_departamento: d.id,
          d_nombre: d.nombre,
        }));
        setDepartamentos(departamentosMapeados);
      } catch (err) {
        if (err.response?.status === 401) navigate("/login");
      }
    };
    fetchDepartamentos();
  }, [token, navigate]);

useEffect(() => {
  const fetchTarea = async () => {
    if (!tareaId) {
      setLoadingInicial(false);
      return;
    }

    try {
      const res = await axios.get(`/api/tareas/${tareaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const t = res.data.tarea;

        setNombre(t.t_nombre);
        setDescripcion(t.t_descripcion || t.descripcion || "");
        setFechaInicio(t.tf_inicio ? new Date(t.tf_inicio) : null);
        setFechaFin(t.tf_fin ? new Date(t.tf_fin) : null);
        setDatosOriginales({
          nombre: t.t_nombre,
          descripcion: t.t_descripcion || t.descripcion || "",
          fechaInicio: t.tf_inicio ? new Date(t.tf_inicio).getTime() : null,
          fechaFin: t.tf_fin ? new Date(t.tf_fin).getTime() : null,
          usuario: t.usuario?.id_usuario || ""
        });

        if (t.usuario) {
          const depId = t.usuario.id_departamento || t.usuario.departamento?.id || "";
          setDepartamentoSeleccionado(depId);
          setUsuarioSeleccionado(t.usuario.id_usuario);

          setDepartamentos(prev => {
            if (!prev.find(d => d.id_departamento === depId)) {
              return [...prev, { id_departamento: depId, d_nombre: t.usuario.departamento?.nombre || "" }];
            }
            return prev;
          });

          setUsuarios(prev => {
            if (!prev.find(u => u.id_usuario === t.usuario.id_usuario)) {
              return [...prev, {
                id_usuario: t.usuario.id_usuario,
                u_nombre: t.usuario.u_nombre || t.usuario.nombre,
                a_paterno: t.usuario.a_paterno || t.usuario.apaterno,
                a_materno: t.usuario.a_materno || t.usuario.amaterno
              }];
            }
            return prev;
          });
        }
      }
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoadingInicial(false);
    }
  };

  fetchTarea();
}, [tareaId, token, navigate]);

 // ===== FETCH USUARIOS SEGÚN DEPARTAMENTO=====
useEffect(() => {
  if (!departamentoSeleccionado) return;

  const fetchUsuarios = async () => {
    try {
      const res = await axios.get(`/api/departamentos/${departamentoSeleccionado}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const usuariosMapeados = res.data.map(u => ({
        id_usuario: u.id_usuario,
        u_nombre: u.nombre,
        a_paterno: u.apaterno,
        a_materno: u.amaterno
      }));

      setUsuarios(usuariosMapeados);

      if (!usuariosMapeados.some(u => u.id_usuario === usuarioSeleccionado)) {
        setUsuarioSeleccionado("");
      }

    } catch (err) {
      setUsuarios([]);
      setUsuarioSeleccionado("");
      if (err.response?.status === 401) navigate("/login");
    }
  };

  fetchUsuarios();
}, [departamentoSeleccionado, token, navigate]);


useEffect(() => {
  if (!datosOriginales) return;

  const cambios = {};
  if (nombre !== datosOriginales.nombre) cambios.nombre = true;
  if (descripcion !== datosOriginales.descripcion) cambios.descripcion = true;
  if (fechaInicio?.getTime() !== datosOriginales.fechaInicio) cambios.fechaInicio = true;
  if (fechaFin?.getTime() !== datosOriginales.fechaFin) cambios.fechaFin = true;
  if (usuarioSeleccionado !== datosOriginales.usuario) cambios.usuario = true;

  setCamposModificados(cambios);
  setMostrarEstado(Object.keys(cambios).length > 0 || guardadoExitoso);
}, [nombre, descripcion, fechaInicio, fechaFin, usuarioSeleccionado, guardadoExitoso, datosOriginales]);

useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (Object.keys(camposModificados).length > 0) {
      e.preventDefault();
      e.returnValue = "";
    }
  };
  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [camposModificados]);

const handleModificar = async () => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const nuevosErrores = {};
  if (!nombre) nuevosErrores.nombre = "El nombre es obligatorio.";
  if (!descripcion) nuevosErrores.descripcion = "La descripción es obligatoria.";
  if (!fechaInicio) nuevosErrores.inicio = "Selecciona la fecha de inicio.";
  else if (fechaInicio < hoy) nuevosErrores.inicio = "La fecha de inicio no puede ser anterior a hoy.";
  if (!fechaFin) nuevosErrores.fin = "Selecciona la fecha de fin.";
  else if (fechaFin < fechaInicio) nuevosErrores.fin = "La fecha de fin no puede ser anterior a la fecha de inicio.";
  if (!usuarioSeleccionado) nuevosErrores.usuario = "Selecciona un usuario.";

  setErrores(nuevosErrores);
  if (Object.keys(nuevosErrores).length > 0) return;

  try {
    setLoading(true);
    const tareaActualizada = {
      t_nombre: nombre,
      t_descripcion: descripcion,
      tf_inicio: fechaInicio.toISOString().split("T")[0],
      tf_fin: fechaFin.toISOString().split("T")[0],
      id_usuario: parseInt(usuarioSeleccionado),
      id_departamento: parseInt(departamentoSeleccionado),
    };

    const res = await axios.put(`/api/tareas/${tareaId}`, tareaActualizada, {
      headers: { Authorization: `Bearer ${token}` },
    });

   if (res.data.success) {
  
  const nuevosDatosOriginales = {
    nombre: nombre, 
    descripcion: descripcion,
    fechaInicio: fechaInicio ? fechaInicio.getTime() : null,
    fechaFin: fechaFin ? fechaFin.getTime() : null,
    usuario: parseInt(usuarioSeleccionado),
    departamento: parseInt(departamentoSeleccionado)
  };
  
  setDatosOriginales(nuevosDatosOriginales);
  setCamposModificados({});
  setGuardadoExitoso(true);
  setMostrarEstado(true);

  setTimeout(() => {
    setGuardadoExitoso(false);
    setMostrarEstado(false);
  }, 2000);
}

  } catch (err) {
    if (err.response?.status === 401) navigate("/login");
  } finally {
    setLoading(false);
  }
};


  const handleCancelar = () => navigate(-1);
useEffect(() => {
  ajustarAltura(nombreTareaRef);
  ajustarAltura(descripcionTareaRef);
}, [nombre, descripcion]);

  // ===== LOADER =====
  if (loadingInicial) {
    return (
      <div className="loader-container">
        <div className="loader-logo">
          <img src={logo3} alt="Cargando" />
        </div>
        <div className="loader-texto">CARGANDO...</div>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  return (
    <Layout titulo="MODIFICAR TAREAS" sidebar={<MenuDinamico activeRoute="Nuevo proyecto" />}>
      <div className="agregartareas-contenedor">
       {mostrarEstado && (
  <>
    {guardadoExitoso && <EstadoGuardado tipo="guardado" />}
    {!guardadoExitoso && Object.keys(camposModificados).length > 0 && <EstadoGuardado tipo="no-guardado" />}
  </>
)}


        {/* Nombre */}
        <div className="mb-3 d-flex flex-column">
          <label htmlFor="nombreTarea" className="agregartareas-label fw-bold">
            Nombre de la tarea
          </label>
          <textarea
            id="nombreTarea"
            ref={nombreTareaRef}
            className="form-control agregartareas-input"
            placeholder="Escribe el nombre de la tarea"
            rows={1}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
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
  value={descripcion}
  onChange={(e) => setDescripcion(e.target.value)}
  onInput={() => {
    ajustarAltura(descripcionTareaRef);
    handleInputChange("descripcion");
  }}
/>

          <ErrorMensaje mensaje={errores.descripcion} />
        </div>

        {/* Departamento */}
        <div className="mb-3 d-flex flex-column">
          <label htmlFor="departamento" className="agregartareas-label fw-bold">
            Departamento
          </label>
          <select
            id="departamento"
            value={departamentoSeleccionado}
            onChange={(e) => {
              setDepartamentoSeleccionado(parseInt(e.target.value));
              handleInputChange("departamento");
            }}
            className="form-select"
          >
            <option value="">Seleccionar departamento</option>
            {departamentos.map((d) => (
              <option key={d.id_departamento} value={d.id_departamento}>
                {d.d_nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Usuario */}
        <div className="mb-3 d-flex flex-column">
          <label htmlFor="usuario" className="agregartareas-label fw-bold">
            Usuario
          </label>
          <select
            id="usuario"
            value={usuarioSeleccionado}
            onChange={(e) => {
              setUsuarioSeleccionado(parseInt(e.target.value));
              handleInputChange("usuario");
            }}
            className="form-select"
          >
            <option value="">Seleccionar usuario</option>
            {usuarios.map((u) => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {`${u.u_nombre} ${u.a_paterno} ${u.a_materno}`
                  .split(" ")
                  .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
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
              onChange={(date) => {
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
              onChange={(date) => {
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

       

<div className="d-flex flex-column flex-md-row gap-4 justify-content-center">
  <button
    type="button"
    className="btn-agregartareas cancelar w-100 w-md-auto"
    onClick={handleCancelar}
  >
    Cancelar
  </button>
  <button
    type="button"
    className="btn-agregartareas guardar w-100 w-md-auto"
    onClick={handleModificar}
    disabled={loading}
  >
    {loading ? (
      <>
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Guardando…
      </>
    ) : "Guardar cambios"}
  </button>
</div>

      </div>
    </Layout>
  );
}

export default EditarTareas;




