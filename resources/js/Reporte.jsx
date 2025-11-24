import { useState, useRef } from "react";
import React from "react";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaAngleDown,FaFilePdf,FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/global.css';
import logo3 from "../imagenes/logo3.png";
import '../css/reporte.css';
import PdfViewer from "./PdfViewer";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import SelectDinamico from "../components/SelectDinamico";
import ErrorMensaje from "../components/ErrorMensaje";

function Reporte() {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [errores, setErrores] = useState({});
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [tipoReporte, setTipoReporte] = useState("vencidas");
  const [selectAbierto, setSelectAbierto] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const selectRef = useRef(null);
   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
      const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  
  const opcionesReporte = [
    { value: "vencidas", label: "Tareas Vencidas" },
    { value: "proximas", label: "Próximas a Vencer" },
    { value: "completadas", label: "Tareas Completadas" }
  ];

  const CalendarButton = React.forwardRef(({ value, onClick }, ref) => (
    <button
      type="button"
      className="btn-calendario w-100 d-flex align-items-center gap-2"
      onClick={onClick}
      ref={ref}
    >
      <FaCalendarAlt className={!value ? "text" : ""} /> 
      <span className={!value ? "text" : ""}>
        {value || "Seleccionar fecha"}
      </span>
    </button>
  ));
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setSelectAbierto(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const validarFechas = () => {
    const nuevosErrores = {};
    if (tipoReporte === "vencidas") {
      if (!fechaInicio) nuevosErrores.fechaInicio = "Selecciona la fecha de inicio.";
      if (!fechaFin) nuevosErrores.fechaFin = "Selecciona la fecha de fin.";
    }
    if (tipoReporte === "proximas") {
      if (!fechaFin) nuevosErrores.fechaFin = "Selecciona la fecha hasta.";
    }
    if (tipoReporte === "completadas") {
      if (!fechaInicio) nuevosErrores.fechaInicio = "Selecciona la fecha de inicio.";
      if (!fechaFin) nuevosErrores.fechaFin = "Selecciona la fecha de fin.";
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const generarPDF = async () => {
  if (!validarFechas()) return;

  setCargando(true);
  setProgreso(0);

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  
  let url = `/generar-pdf?tipo=${tipoReporte}`;
  
  if (usuario) {
    url += `&nombre=${encodeURIComponent(usuario.nombre)}&a_paterno=${encodeURIComponent(usuario.a_paterno)}&a_materno=${encodeURIComponent(usuario.a_materno)}`;
    url += `&id_departamento=${usuario.id_departamento}`;
  }

  if (tipoReporte === "vencidas") {
    if (fechaInicio) url += `&fechaInicio=${fechaInicio.toISOString().split('T')[0]}`;
    if (fechaFin) url += `&fechaFin=${fechaFin.toISOString().split('T')[0]}`;
  }
  if (tipoReporte === "proximas" && fechaFin) {
    url += `&fechaFin=${fechaFin.toISOString().split('T')[0]}`;
  }
  if (tipoReporte === "completadas") {
    if (fechaInicio) url += `&fechaInicio=${fechaInicio.toISOString().split('T')[0]}`;
    if (fechaFin) url += `&fechaFin=${fechaFin.toISOString().split('T')[0]}`;
  }

  console.log("URL de solicitud:", url);

  const intervalo = setInterval(() => {
    setProgreso(prev => {
      if (prev >= 90) {
        clearInterval(intervalo);
        return prev;
      }
      return prev + 10;
    });
  }, 200);

  try {
    const response = await fetch(url);
    
    console.log("Respuesta del servidor:", response.status);
    console.log("Content-Type:", response.headers.get('Content-Type'));
    
    // Verificar si la respuesta es realmente un PDF
    const contentLength = response.headers.get('Content-Length');
    console.log("Content-Length:", contentLength);
    
    if (!response.ok) {
      // Intentar leer el error como texto
      const errorText = await response.text();
      console.error("Error del servidor:", errorText);
      throw new Error(`Error al generar el PDF: ${response.status} - ${errorText}`);
    }

    const blob = await response.blob();
    
    console.log("Tamaño del blob:", blob.size);
    console.log("Tipo del blob:", blob.type);
    if (blob.size < 1000) {
      const blobText = await blob.text();
      console.log("Contenido del blob (primeros 500 chars):", blobText.substring(0, 500));
      if (blobText.trim().startsWith('{') || blobText.includes('error')) {
        throw new Error(`Error del servidor: ${blobText}`);
      }
    }
    
    clearInterval(intervalo);
    setProgreso(100);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    
    const nuevaUrl = URL.createObjectURL(blob);
    console.log("URL generada:", nuevaUrl);
    
    setPdfUrl(nuevaUrl);
    setMostrarVisor(true);
    
    setFechaInicio(null);
    setFechaFin(null);
    
    setTimeout(() => setProgreso(0), 500);
    
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    alert(`Error al generar el PDF: ${error.message}`);
  } finally {
    clearInterval(intervalo);
    setCargando(false);
  }
};

  const cerrarVisor = () => {
    setMostrarVisor(false);
    setTimeout(() => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    }, 1000);
  };

  return (
    <Layout titulo="GENERAR REPORTES" sidebar={<MenuDinamico activeRoute="Nuevo proyecto" />}>
   <div className="reportes-d container my-4">
    <h1 className="titulo-global">Reporte</h1>
            <div className="reportes-d mt-4 mx-auto p-3">
        <div className="reportes-d-container">
          <div className="d-flex justify-content-center mb-4">
            <div className="position-relative" ref={selectRef}>
              <label className="reportes-d-form-label fw-bold">Tipo de reporte:</label>
              <SelectDinamico
      opciones={opcionesReporte.map(o => o.label)}
      valor={opcionesReporte.find(o => o.value === tipoReporte)?.label}
      setValor={(label) => {
        const opcionSeleccionada = opcionesReporte.find(o => o.label === label);
        if (opcionSeleccionada) {
          setTipoReporte(opcionSeleccionada.value);
          setFechaInicio(null);
          setFechaFin(null);
          setErrores({});
          setMostrarVisor(false);
        }
      }}
      placeholder="Selecciona tipo de reporte"
    />
          
            </div>
          </div>
          <div className={`fecha-selectores-container ${tipoReporte === 'proximas' ? 'tareas-proximas' : ''} ${tipoReporte === 'completadas' ? 'tareas-completadas' : ''}`}>
            {tipoReporte === 'vencidas' && (
              <div className="d-flex flex-md-row justify-content-center gap-3 mb-3">
                <div className="reportes-fecha-item">
                  <label className="reportes-d-form-label fw-bold">Fecha de inicio:</label>
                  <DatePicker
                    selected={fechaInicio}
                    onChange={(date) => {
                      setFechaInicio(date);
                      setErrores(prev => ({ ...prev, fechaInicio: undefined }));
                    }}
                    dateFormat="dd/MM/yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    locale={es}
                    maxDate={fechaFin || null}
                    customInput={<CalendarButton />}
                  />
                   <ErrorMensaje mensaje={errores.fechaInicio} />
                </div>
                <div className="reportes-fecha-item">
                   <label className="reportes-d-form-label fw-bold">Fecha de fin:</label>
                  <DatePicker
                    selected={fechaFin}
                    onChange={(date) => {
                      setFechaFin(date);
                      setErrores(prev => ({ ...prev, fechaFin: undefined }));
                    }}
                    dateFormat="dd/MM/yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    locale={es}
                    minDate={fechaInicio || null}
                    customInput={<CalendarButton />}
                  />
                  <ErrorMensaje mensaje={errores.fechaFin} />
                </div>
              </div>
            )}
{tipoReporte === 'proximas' && (
  <div className="d-flex justify-content-center mb-3">
    <div className="fecha-item">
      <label className="reportes-d-form-label fw-bold">Hasta qué fecha:</label>
      <DatePicker
        selected={fechaFin}
        onChange={(date) => {
          setFechaFin(date);
          setErrores(prev => ({ ...prev, fechaFin: undefined }));
        }}
        dateFormat="dd/MM/yyyy"
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        locale={es}
        minDate={new Date()}
        customInput={<CalendarButton />}
      />
      <ErrorMensaje mensaje={errores.fechaFin} />
    </div>
  </div>
)}
            {tipoReporte === 'completadas' && (
              <div className="d-flex flex-md-row justify-content-center gap-3 mb-3">
                <div className="fecha-item">
                  <label className="reportes-d-form-label fw-bold">Fecha inicio:</label>
                  <DatePicker
                    selected={fechaInicio}
                    onChange={(date) => {
                      setFechaInicio(date);
                      setErrores(prev => ({ ...prev, fechaInicio: undefined }));
                    }}
                    dateFormat="dd/MM/yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    locale={es}
                    maxDate={fechaFin || null}
                    customInput={<CalendarButton />}
                  />
                  <ErrorMensaje mensaje={errores.fechaInicio} />
                </div>
                <div className="fecha-item">
                  <label className="reportes-d-form-label fw-bold">Fecha fin:</label>
                  <DatePicker
                    selected={fechaFin}
                    onChange={(date) => {
                      setFechaFin(date);
                      setErrores(prev => ({ ...prev, fechaFin: undefined }));
                    }}
                    dateFormat="dd/MM/yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    locale={es}
                    minDate={fechaInicio || null}
                    customInput={<CalendarButton />}
                  />
                  <ErrorMensaje mensaje={errores.fechaFin} />
                </div>
              </div>
            )}
          </div>

          <div className="d-flex flex-column align-items-center gap-2">
            {cargando && (
  <div className="reportes-d-progress-contenedor mt-4">
    <div className="d-flex justify-content-between mb-2">
      <small className="reportes-d-text">Generando PDF...</small>
      <small className="reportes-d-text fw-bold">{progreso}%</small>
    </div>
    <div className="reportes-d-progress">
      <div
         className="reportes-d-progress-bar"
        role="progressbar"
        style={{ width: `${progreso}%` }}
        aria-valuenow={progreso}
        aria-valuemin="0"
        aria-valuemax="100"
      >
      </div>
    </div>
   </div>
    
         )}
       </div>
          </div>
            <div className="mt-3">
                  <button 
                    type="button"
                     className="reportes-d-boton-form"
                    onClick={generarPDF}
                    disabled={cargando}
                    onMouseEnter={() => setBotonHover(true)}
                    onMouseLeave={() => setBotonHover(false)}
                  >
                    {cargando ? (
                      <>
 <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generando PDF...
                      </>
                    ) : (
                      <>
                        <FaFilePdf className="me-2" />
                        Generar PDF
                      </>
                    )}
                  </button>
                </div>
        </div>
        {mostrarVisor && pdfUrl && (
          <PdfViewer
            pdfUrl={pdfUrl}
            fileName={`Reporte_de_tareas_${tipoReporte}.pdf`}
            onClose={cerrarVisor}
          />
        )}
    </div>
 </Layout>
  );
}

export default Reporte;

 





