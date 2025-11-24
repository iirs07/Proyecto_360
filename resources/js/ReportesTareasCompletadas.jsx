import React, { useState, forwardRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaFilePdf, FaBars } from "react-icons/fa";
import ErrorMensaje from "../components/ErrorMensaje";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/formulario.css';
import '../css/ReportesTareasCompletadas.css'; 
import "../css/global.css";
import '../css/calendario.css';
import PdfViewer from "./PdfViewer";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";

const CalendarButton = forwardRef(({ value, onClick }, ref) => (
  <button
    type="button"
    className="btn-calendario w-100 d-flex align-items-center gap-2" 
    onClick={onClick}
    ref={ref}
  >
    <FaCalendarAlt /> 
    <span className={!value ? "text-muted" : ""}>
      {value || "Seleccionar fecha"}
    </span>
  </button>
));
function ReportesTareasCompletadas() {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [errores, setErrores] = useState({});
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("usuario");
    navigate("/Login", { replace: true });
  };

  const validarFechas = () => {
    const nuevosErrores = {};
    if (!fechaInicio) nuevosErrores.fechaInicio = "Selecciona la fecha de inicio.";
    if (!fechaFin) nuevosErrores.fechaFin = "Selecciona la fecha de fin.";
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const generarPDF = async () => {
    if (!validarFechas()) return;

    setCargando(true);
    setProgreso(0);

    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      console.warn("No autenticado. Redirigiendo al login...");
      navigate("/Login", { replace: true });
      return;
    }

    if (!usuario || !usuario.id_usuario) {
      console.log("No se pudo obtener la información de usuario necesaria.");
      setCargando(false);
      return;
    }

    let url = `/generar-pdf-completadas-jefe?id_usuario=${usuario.id_usuario}&tipo=completadas`;
    if (fechaInicio) url += `&fechaInicio=${fechaInicio.toISOString().split("T")[0]}`;
    if (fechaFin) url += `&fechaFin=${fechaFin.toISOString().split("T")[0]}`;

    const intervalo = setInterval(() => {
      setProgreso(prev => (prev >= 90 ? prev : prev + 10));
    }, 200);

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf",
        },
      });
      if (response.status === 401) {
        console.warn("Token inválido o expirado (401). Redirigiendo a login...");
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("usuario");
        navigate("/Login", { replace: true });
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Error al generar PDF: ${response.status} - ${errorText}`);
        clearInterval(intervalo);
        setCargando(false);
        return;
      }

      const contentType = response.headers.get("Content-Type");
      const blob = await response.blob();
      if (!contentType || !contentType.includes("application/pdf")) {
        const blobText = await blob.text();
        console.log("No se recibió un PDF válido. Contenido del servidor:", blobText);
        clearInterval(intervalo);
        setCargando(false);
        return;
      }

      clearInterval(intervalo);
      setProgreso(100);

      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const nuevaUrl = URL.createObjectURL(blob);
      setPdfUrl(nuevaUrl);
      setMostrarVisor(true);

      setFechaInicio(null);
      setFechaFin(null);
      setTimeout(() => setProgreso(0), 500);

    } catch (error) {
      console.error("Error inesperado al generar el PDF:", error);
    } finally {
      clearInterval(intervalo);
      setCargando(false);
    }
  };

  const cerrarVisor = () => {
    setMostrarVisor(false);
    setTimeout(() => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }, 1000);
  };
  useEffect(() => {
    const forceDatePickerZIndex = () => {
      // Buscar todos los poppers del DatePicker
      const poppers = document.querySelectorAll('.react-datepicker-popper');
      poppers.forEach(popper => {
        // Sobreescribir el estilo en línea
        popper.style.zIndex = '9999';
      });
    };

    // Ejecutar inmediatamente
    forceDatePickerZIndex();
    const observer = new MutationObserver(forceDatePickerZIndex);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);


  return (
    <Layout 
      titulo="GENERAR REPORTES"
      sidebar={
        <MenuDinamico 
          tipo="principal" 
          activeRoute="reportes_tareas_completadas" 
          onLogout={handleLogout}
        />
      }
    >
      <div className="reportes-tc container my-4">
        <h1 className="titulo-global">Reporte de Tareas Completadas</h1>

        <div className="reportes-tc mt-4 mx-auto p-3">
          <div className="fecha-selectores-container tareas-completadas d-flex justify-content-center gap-3 mb-3">
            <div className="reportes-tc-fecha-item">
              <label className="reportes-tc-form-label fw-bold">Fecha de inicio:</label>
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

            <div className="reportes-tc-fecha-item">
              <label className="reportes-tc-form-label fw-bold">Fecha de fin:</label>
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

          <div className="d-flex flex-column align-items-center gap-2">
            {cargando && (
  <div className="reportes-tc-progress-contenedor mt-4">
    <div className="d-flex justify-content-between mb-2">
      <small className="reportes-tc-text">Generando PDF...</small>
      <small className="reportes-tc-text fw-bold">{progreso}%</small>
    </div>
    <div className="reportes-tc-progress">
      <div
        className="reportes-tc-progress-bar"
        role="progressbar"
        style={{ width: `${progreso}%` }}
        aria-valuenow={progreso}
        aria-valuemin="0"
        aria-valuemax="100"
      ></div>
    </div>
  </div>
)}

          </div>

          <div className="reportes-tc-boton-wrapper w-100 d-flex justify-content-center">
  <button 
    type="button"
    className="reportes-tc-boton-form"
    onClick={generarPDF}
    disabled={cargando}
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


        {mostrarVisor && pdfUrl && (
          <PdfViewer
            pdfUrl={pdfUrl}
            fileName={`Reporte_de_tareas_completadas.pdf`}
            onClose={cerrarVisor}
          />
        )}
      </div>
            </div>
    </Layout>
  );
}

export default ReportesTareasCompletadas;


