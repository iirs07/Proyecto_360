import React, { useState, useEffect, useRef } from "react";
import { FaTimesCircle } from "react-icons/fa"; 
import { useNavigate } from "react-router-dom";
import "../css/global.css";
import "../css/ReporteSuperUsuario.css";
import logo3 from "../imagenes/logo3.png";
import PdfViewer from "./PdfViewer";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";

export default function ReporteSuperUsuario() {
    // ⬅️ ESTADOS
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [areas, setAreas] = useState([]);
    const [seleccionados, setSeleccionados] = useState([]);
    const [areasAbiertas, setAreasAbiertas] = useState({});
    const [tipoProyecto, setTipoProyecto] = useState("Ambos");
    const [periodo, setPeriodo] = useState("Rango");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [anio, setAnio] = useState("");
    const [mes, setMes] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState(''); // Estado de error para mensaje en interfaz

    // 🟢 REFERENCIAS CLAVE
    const progressIntervalRef = useRef(null);
    const abortControllerRef = useRef(null); 

    const navigate = useNavigate();
    const token = localStorage.getItem('jwt_token');

    const listaMeses = [
        { value: "01", label: "Enero" }, { value: "02", label: "Febrero" },
        { value: "03", label: "Marzo" }, { value: "04", label: "Abril" },
        { value: "05", label: "Mayo" }, { value: "06", label: "Junio" },
        { value: "07", label: "Julio" }, { value: "08", label: "Agosto" },
        { value: "09", label: "Septiembre" }, { value: "10", label: "Octubre" },
        { value: "11", label: "Noviembre" }, { value: "12", label: "Diciembre" },
    ];

    const listaAnios = [];
    const anioActual = new Date().getFullYear();
    for (let i = anioActual - 5; i <= anioActual + 1; i++) listaAnios.push(i);


    // 🟢 FUNCIÓN DE LOGOUT
    const handleLogout = () => {
        localStorage.removeItem("jwt_token");
        navigate("/login", { replace: true });
    };


    // === CARGA DE DATOS (fetchAreas con AUTH) ===
    useEffect(() => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        const fetchAreas = async () => {
            try {
                // Autenticación con Bearer Token
                const response = await fetch("http://127.0.0.1:8000/api/departamentos", {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.status === 401) {
                    handleLogout(); 
                    return;
                }

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const data = await response.json();
                
                const areasAdaptadas = data.map(area => ({
                    id: area.id,
                    nombre: area.nombre,
                    departamentos: area.departamentos
                        ? area.departamentos.map(dep => ({
                            id_departamento: dep.id_departamento,
                            d_nombre: dep.d_nombre,
                        }))
                        : [],
                }));

                setAreas(areasAdaptadas);
            } catch (error) {
                console.error("Error al obtener las áreas:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAreas();
    }, [token, navigate]);
    // === FIN CARGA DE DATOS ===


    // === FUNCIONES DE MANEJO DE ESTADOS (CORREGIDAS para limpiar el error) ===
    const toggleDepartamento = (depId) => {
        setErrorMessage(''); // Limpiar error al interactuar
        setSeleccionados((prev) =>
            prev.includes(depId)
                ? prev.filter((d) => d !== depId)
                : [...prev, depId]
        );
    };

    const toggleArea = (area) => {
        setErrorMessage(''); // Limpiar error al interactuar
        const depIds = area.departamentos.map((dep) => dep.id_departamento);
        const allSelected = depIds.every((id) => seleccionados.includes(id));
        setSeleccionados((prev) => allSelected ? prev.filter((id) => !depIds.includes(id)) : [...new Set([...prev, ...depIds])]);
    };

    const toggleAbrirArea = (areaId) => {
        setAreasAbiertas((prev) => ({ ...prev, [areaId]: !prev[areaId] }));
    };

    const handlePeriodoChange = (t) => {
        setErrorMessage(''); // Limpiar error al cambiar periodo
        setPeriodo(t);
        if (t === "Año") {
            setMes(""); setFechaInicio(""); setFechaFin("");
        } else if (t === "Mes") {
            setFechaInicio(""); setFechaFin("");
        } else if (t === "Rango") {
            setAnio(""); setMes("");
        }
    };


    // 🟢 FUNCIÓN para simular el progreso (0% al 99%)
    const simulateProgress = () => {
        setGenerationProgress(0); 
        let progress = 0;
        
        const interval = setInterval(() => {
            if (progress >= 99) { 
                clearInterval(progressIntervalRef.current);
                return;
            }
            const increment = Math.floor(Math.random() * 5) + 3; 
            progress += increment;
            const nextProgress = progress < 99 ? progress : 99;
            setGenerationProgress(nextProgress);
        }, 150);
        
        progressIntervalRef.current = interval; 
    };
    
    // 🟢 FUNCIÓN para cancelar la generación (Ahora cancela el fetch)
    const handleCancelGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort(); 
            abortControllerRef.current = null; 
        }

        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        setIsGenerating(false);
        setGenerationProgress(0);
        console.log("Generación de reporte cancelada por el usuario.");
    };


    // ⬇️ FUNCIÓN handleGenerarReporte (con AbortController y Validación Completa) ⬇️
    const handleGenerarReporte = async () => {
        setErrorMessage(''); // Limpiar error al iniciar nuevo intento

        // 1. Validación de Selección
        if (seleccionados.length === 0) {
            setErrorMessage("⚠ Error: Selecciona al menos un departamento para generar el reporte.");
            return;
        }
        
        let urlFiltros = `?tipoProyecto=${tipoProyecto}&departamentos=${seleccionados.join(",")}`;
        let alertaPeriodo = "";

        // 2. Lógica de validación COMPLETA de periodos
        if (periodo === "Año") {
            if (!anio) {
                alertaPeriodo = 'Año'; 
            } else {
                urlFiltros += `&anio=${anio}`; 
            }
        } else if (periodo === "Mes") {
            if (!anio || !mes) {
                alertaPeriodo = 'Mes y Año'; 
            } else {
                urlFiltros += `&anio=${anio}&mes=${mes}`; 
            }
        } else if (periodo === "Rango") {
            if (!fechaInicio || !fechaFin) {
                alertaPeriodo = 'Rango de fechas (Inicio y Fin)'; 
            } else {
                if (new Date(fechaInicio) > new Date(fechaFin)) {
                    setErrorMessage("⚠  Error: La fecha de inicio no puede ser posterior a la fecha de fin.");
                    return;
                }
                urlFiltros += `&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`; 
            }
        } 

        if (alertaPeriodo) {
            setErrorMessage(`⚠ Error: Debes seleccionar un valor para el periodo de tipo "${alertaPeriodo}".`);
            return;
        }
        // --- Fin validación ---

        const API_URL = `http://127.0.0.1:8000/api/reporte${urlFiltros}`;

        try {
            setIsGenerating(true); 
            simulateProgress(); 

            // 🟢 CREACIÓN DE ABORTCONTROLLER
            const controller = new AbortController();
            abortControllerRef.current = controller; 
            const signal = controller.signal;

            // 🟢 LLAMADA FETCH
            const response = await fetch(API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                signal: signal 
            }); 
            
            // 🟢 Limpiar referencias al finalizar la solicitud (EXITOSA)
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            abortControllerRef.current = null; 

            if (response.status === 401) {
                handleLogout();
                return;
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessageText = `(${response.status}) Error desconocido.`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessageText = errorJson.message || errorMessageText;
                } catch(e) { /* Si no es JSON, usa el error desconocido */ }
                throw new Error(errorMessageText); 
            }
            
            // PROCESAMIENTO FINAL
            const blob = await response.blob(); 
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            
            setGenerationProgress(100); 
            
            setTimeout(() => {
                setShowPdfViewer(true);
                setIsGenerating(false); 
                setGenerationProgress(0); 
            }, 500);

        } catch (error) {
            // 🛑 MANEJO DE ABORTERROR
            if (error.name === 'AbortError') {
                // Cancelación intencional, no mostrar error.
            } else {
                handleCancelGeneration();
                setErrorMessage(`❌ Ocurrió un error en la generación: ${error.message}`); 
            }
        }
    };


    // ⬅️ FUNCIÓN PARA CERRAR EL VISOR Y LIBERAR MEMORIA
    const handleClosePdfViewer = () => {
        if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
        setShowPdfViewer(false);
    };

    // === PANTALLA DE CARGA ===
    if (isLoading) {
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
    
    // === CONTENIDO PRINCIPAL ===
    return (
        <Layout 
            titulo="GENERAR REPORTES DE PROYECTOS EN LOS ÁREAS / DEPARTAMENTOS"
            sidebar={
                <MenuDinamico 
                    tipo="principal" 
                    activeRoute="reportes" 
                    onLogout={handleLogout}
                />
            }
        >
            <div className="reporte-container">
                <div className="main-form-container">
                    
                    <div className="filtros-grid">
                        {/* === 1. Áreas === */}
                         <div className="form-section area-selection-panel">
                            <label className="titulo-seccion"><strong>1. Seleccionar Áreas / Departamentos</strong></label>
                            <div className="areas-list-scroll">
                                {areas.map((area) => (
                                    <div key={area.id} className="area-item-contenedor">
                                        <div className="area-header">
                                            <input
                                                type="checkbox"
                                                checked={area.departamentos.every((dep) => seleccionados.includes(dep.id_departamento))}
                                                onChange={() => toggleArea(area)}
                                            />
                                            <span
                                                className="area-nombre"
                                                onClick={() => toggleAbrirArea(area.id)}
                                            >
                                                {area.nombre}
                                            </span>
                                            <span
                                                className="flecha-area"
                                                onClick={() => toggleAbrirArea(area.id)}
                                            >
                                                {areasAbiertas[area.id] ? "▼" : "▶"}
                                            </span>
                                        </div>

                                        {areasAbiertas[area.id] && (
                                            <div className="area-departamentos-submenu">
                                                {area.departamentos.map((dep) => (
                                                    <label key={dep.id_departamento} className="departamento-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={seleccionados.includes(dep.id_departamento)}
                                                            onChange={() => toggleDepartamento(dep.id_departamento)}
                                                        />
                                                        <span className="departamento-texto">{dep.d_nombre}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* === 2. Período === */}
                        <div className="form-section periodo-section">
                            <label className="titulo-seccion"><strong>2. Seleccionar Periodo</strong></label>
                            <div className="periodo-tipo-tabs">
                                {["Año", "Mes", "Rango"].map((t) => (
                                    <button key={t} className={`periodo-tab ${periodo === t ? "active" : ""}`} onClick={() => handlePeriodoChange(t)} >
                                        {t === "Rango" ? "Rango de fechas" : t}
                                    </button>
                                ))}
                            </div>

                            <div className="periodo-inputs">
                                {periodo === "Año" && (
                                    <div className="input-group-field">
                                        <label htmlFor="select-anio">Año:</label>
                                        <select 
                                            id="select-anio" 
                                            value={anio} 
                                            onChange={(e) => {setAnio(e.target.value); setErrorMessage('');}} // 🟢 Limpieza de error
                                            className="input-anio"
                                        >
                                            <option value="">-- Seleccionar año --</option>
                                            {listaAnios.map((a) => (<option key={a} value={a}>{a}</option>))}
                                        </select>
                                    </div>
                                )}
                                {periodo === "Mes" && (
                                    <div className="input-group-field">
                                        <label htmlFor="select-mes">Mes:</label>
                                        <div className="mes-inputs">
                                            <select 
                                                id="select-mes-year" 
                                                value={anio} 
                                                onChange={(e) => {setAnio(e.target.value); setMes(""); setErrorMessage('');}} // 🟢 Limpieza de error
                                            >
                                                <option value="">-- Año --</option>
                                                {listaAnios.map((a) => (<option key={a} value={a}>{a}</option>))}
                                            </select>
                                            <select 
                                                id="select-mes" 
                                                value={mes} 
                                                onChange={(e) => {setMes(e.target.value); setErrorMessage('');}} // 🟢 Limpieza de error
                                                disabled={!anio}
                                            >
                                                <option value="">-- Mes --</option>
                                                {listaMeses.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                                {periodo === "Rango" && (
                                    <div className="rango-fechas-inputs">
                                        <label>Inicio:</label>
                                        <input 
                                            type="date" 
                                            value={fechaInicio} 
                                            onChange={(e) => {setFechaInicio(e.target.value); setErrorMessage('');}} // 🟢 Limpieza de error
                                        />
                                        <label>Fin:</label>
                                        <input 
                                            type="date" 
                                            value={fechaFin} 
                                            onChange={(e) => {setFechaFin(e.target.value); setErrorMessage('');}} // 🟢 Limpieza de error
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* === 3. Tipo de Proyecto === */}
                        <div className="form-section tipo-proyecto-section">
                            <label className="titulo-seccion"><strong>3. Estado del Proyecto</strong></label>
                           <select 
    value={tipoProyecto} 
    onChange={(e) => {setTipoProyecto(e.target.value); setErrorMessage('');}}
    className="input-estado"
>
    <option value="Finalizados">Finalizados</option>
    <option value="En proceso">En proceso</option>
    <option value="Ambos">Ambos</option>
</select>

                        </div>
                    </div>

                    {/* Botón y barra de progreso */}
                    <div className="boton-generar-section">
                        {isGenerating ? (
                            // BARRA DE PROGRESO Y BOTÓN DE CANCELAR
                            <div className="progress-container">
                                <div className="progress-bar-label">
                                    Generando Reporte: {generationProgress}%
                                </div>
                                <div className="progress-bar-wrapper">
                                    <div 
                                        className="progress-bar" 
                                        style={{ width: `${generationProgress}%` }}
                                    ></div>
                                </div>
                                <button 
                                    className="btn-cancelar" 
                                    onClick={handleCancelGeneration} 
                                >
                                    <FaTimesCircle className="icon-cancelar" />
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                            // BOTÓN DE GENERAR (visible cuando no se está generando)
                            <>
                                <button
                                    className="btn-generar"
                                    onClick={handleGenerarReporte}
                                    // El botón se habilita si hay seleccionados Y no hay un errorMessage activo.
                                    disabled={seleccionados.length === 0 || !!errorMessage} 
                                >
                                    Generar Reporte
                                </button>
                                {/* 🟢 MOSTRAR MENSAJE DE ERROR/ADVERTENCIA FIJO */}
                                {(seleccionados.length === 0 || errorMessage) && (
                                    <p className="alerta-seleccion">
                                        {/* Muestra el error específico O la advertencia inicial */}
                                        {errorMessage || "⚠ Selecciona al menos un departamento para habilitar el reporte."}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {/* VISOR DE PDF */}
            {showPdfViewer && pdfUrl && (
                <PdfViewer 
                    pdfUrl={pdfUrl} 
                    fileName={`Reporte_Proyectos_${new Date().toISOString().slice(0, 10)}.pdf`}
                    onClose={handleClosePdfViewer} 
                />
            )}
        </Layout>
    );
}