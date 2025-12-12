import React, { useState, useEffect, useRef } from "react";
import { FaTimesCircle, FaCheckSquare, FaRegSquare, FaCalendarAlt, FaCalendarDay, FaCalendarWeek, FaHourglassHalf, FaClipboardCheck } from "react-icons/fa"; 
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
    
    // ⬇️ AJUSTADO: Estado usa los valores 'Ambos', 'Finalizado', 'En proceso'
    const [tipoProyecto, setTipoProyecto] = useState("Ambos"); 

    const [periodo, setPeriodo] = useState("Rango");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [anio, setAnio] = useState("");
    const [mes, setMes] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState(''); 

    // 🟢 REFERENCIAS CLAVE
    const progressIntervalRef = useRef(null);
    const abortControllerRef = useRef(null); 

    const navigate = useNavigate();
    // ✅ Uso de sessionStorage para el token de sesión
    const token = sessionStorage.getItem('jwt_token'); 

    // 🟢 VARIABLE DE ENTORNO PARA LA URL BASE DE LA API
    const API_URL = import.meta.env.VITE_API_URL;

    const listaMeses = [
        { value: "01", label: "Enero" }, { value: "02", label: "Febrero" },
        { value: "03", label: "Marzo" }, { value: "04", label: "Abril" },
        { value: "05", label: "Mayo" }, { value: "06", label: "Junio" },
        { value: "07", label: "Julio" }, { value: "08", label: "Agusto" },
        { value: "09", label: "Septiembre" }, { value: "10", label: "Octubre" },
        { value: "11", label: "Noviembre" }, { value: "12", label: "Diciembre" },
    ];

    const listaAnios = [];
    const anioActual = new Date().getFullYear();
    for (let i = anioActual - 5; i <= anioActual + 1; i++) listaAnios.push(i);


    // 🟢 FUNCIÓN DE LOGOUT
    const handleLogout = () => {
        sessionStorage.removeItem("jwt_token");
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
                const response = await fetch(`${API_URL}/api/departamentos`, {
                    headers: {
                        'Authorization': `Bearer ${token}` // ✅ Usando token de sessionStorage
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
    }, [token, navigate, API_URL]);
    // === FIN CARGA DE DATOS ===


    // === LÓGICA DE SELECCIONAR TODO ===
    const isAllSelected = seleccionados.length > 0 && areas.every(area => 
        area.departamentos.every(dep => seleccionados.includes(dep.id_departamento))
    );

    const toggleSelectAll = () => {
        setErrorMessage('');
        if (isAllSelected) {
            setSeleccionados([]);
        } else {
            const allDepIds = areas.flatMap(area => 
                area.departamentos.map(dep => dep.id_departamento)
            );
            setSeleccionados(allDepIds);
        }
    };
    // ===================================

    // === FUNCIONES DE MANEJO DE ESTADOS ===
    const toggleDepartamento = (depId) => {
        setErrorMessage('');
        setSeleccionados((prev) =>
            prev.includes(depId) ? prev.filter((d) => d !== depId) : [...prev, depId]
        );
    };

    const toggleArea = (area) => {
        setErrorMessage(''); 
        const depIds = area.departamentos.map((dep) => dep.id_departamento);
        const allSelected = depIds.every((id) => seleccionados.includes(id));
        setSeleccionados((prev) => allSelected ? prev.filter((id) => !depIds.includes(id)) : [...new Set([...prev, ...depIds])]);
    };

    const toggleAbrirArea = (areaId) => {
        setAreasAbiertas((prev) => ({ ...prev, [areaId]: !prev[areaId] }));
    };

    const handlePeriodoChange = (t) => {
        setErrorMessage('');
        setPeriodo(t);
        // Limpiamos campos irrelevantes para el nuevo tipo de periodo
        if (t === "Año") {
            setMes(""); setFechaInicio(""); setFechaFin("");
        } else if (t === "Mes") {
            setFechaInicio(""); setFechaFin("");
        } else if (t === "Rango") {
            setAnio(""); setMes("");
        }
    };

    const handleProyectoStateChange = (e) => {
        setErrorMessage('');
        setTipoProyecto(e.target.value);
    };

    // 🟢 FUNCIÓN para simular el progreso
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
    
    // 🟢 FUNCIÓN para cancelar la generación
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
        setErrorMessage('');
        console.log("Generación de reporte cancelada por el usuario.");
    };


    // ⬇️ FUNCIÓN handleGenerarReporte (Optimizado) ⬇️
    const handleGenerarReporte = async () => {
        setErrorMessage('');

        const tipoProj = tipoProyecto; 

        // 1. Validación de Departamento
        if (seleccionados.length === 0) {
            setErrorMessage("⚠ Error: Selecciona al menos un departamento para generar el reporte.");
            return;
        }
        
        let urlFiltros = `?tipoProyecto=${tipoProj}&departamentos=${seleccionados.join(",")}`;
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
                // ✅ Validación de rango de fechas
                if (new Date(fechaInicio) > new Date(fechaFin)) {
                    setErrorMessage("⚠  Error: La fecha de inicio no puede ser posterior a la fecha de fin.");
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

        const REPORTE_URL = `${API_URL}/api/reporte${urlFiltros}`;

        try {
            setIsGenerating(true); 
            simulateProgress(); 

            // 🟢 CREACIÓN DE ABORTCONTROLLER
            const controller = new AbortController();
            abortControllerRef.current = controller; 
            const signal = controller.signal;

            // 🟢 LLAMADA FETCH
            const response = await fetch(REPORTE_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                signal: signal 
            }); 
            
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
                    // Intenta parsear JSON para errores detallados del backend
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
            // 🛑 MANEJO DE ABORTERROR (Cancelación)
            if (error.name === 'AbortError') {
                // Cancelación intencional.
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
                        
                        {/* === COLUMNA 1: DEPARTAMENTOS === */}
                        <div className="form-section area-selection-panel">
                            <label className="titulo-seccion"><strong>1. Seleccionar Áreas / Departamentos</strong></label>
                            
                            {/* ⬇️ BOTÓN DE SELECCIONAR TODO */}
                            <button
                                className={`btn-seleccionar-todo ${isAllSelected ? 'active' : ''}`}
                                onClick={toggleSelectAll}
                            >
                                {isAllSelected ? <FaCheckSquare /> : <FaRegSquare />}
                                {isAllSelected ? ' Deseleccionar Todos' : ' Seleccionar Todos'}
                            </button>
                            
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

                        {/* === COLUMNA 2: COMBINADA (Periodo y Estado apilados) === */}
                        <div className="combined-filters-column">
                            
                            {/* SECCIÓN 2: PERÍODO (CALENDARIO) */}
                            <div className="form-section periodo-section">
                                <label className="titulo-seccion"><strong>2. Seleccionar Periodo (Calendario)</strong></label>
                                <div className="periodo-tipo-tabs">
                                    {[{t: "Rango", icon: <FaCalendarWeek />, label: "Rango de fechas"}, 
                                      {t: "Mes", icon: <FaCalendarDay />, label: "Mes"}, 
                                      {t: "Año", icon: <FaCalendarAlt />, label: "Año"}
                                    ].map(({ t, icon, label }) => (
                                        <button 
                                            key={t} 
                                            className={`periodo-tab ${periodo === t ? "active" : ""}`} 
                                            onClick={() => handlePeriodoChange(t)} 
                                        >
                                            {icon} {label}
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
                                                onChange={(e) => {setAnio(e.target.value); setErrorMessage('');}}
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
                                                    onChange={(e) => {setAnio(e.target.value); setMes(""); setErrorMessage('');}}
                                                >
                                                    <option value="">-- Año --</option>
                                                    {listaAnios.map((a) => (<option key={a} value={a}>{a}</option>))}
                                                </select>
                                                <select 
                                                    id="select-mes" 
                                                    value={mes} 
                                                    onChange={(e) => {setMes(e.target.value); setErrorMessage('');}}
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
                                                onChange={(e) => {setFechaInicio(e.target.value); setErrorMessage('');}} 
                                            />
                                            <label>Fin:</label>
                                            <input 
                                                type="date" 
                                                value={fechaFin} 
                                                onChange={(e) => {setFechaFin(e.target.value); setErrorMessage('');}} 
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* SECCIÓN 3: ESTADO DEL PROYECTO */}
                            <div className="form-section tipo-proyecto-section">
                                <label className="titulo-seccion"><strong>3. Estado del Proyecto</strong></label>
                                
                                <div className="toggle-buttons-group radio-group">
                                    {/* Opción Ambos */}
                                    <label className={`radio-label ${tipoProyecto === 'Ambos' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="tipoProyecto"
                                            value="Ambos"
                                            checked={tipoProyecto === 'Ambos'}
                                            onChange={handleProyectoStateChange}
                                            className="hidden-radio"
                                        />
                                        <span className="radio-content"><FaCheckSquare /> Ambos</span>
                                    </label>

                                    {/* Opción Finalizado (CORREGIDO VALUE) */}
                                    <label className={`radio-label ${tipoProyecto === 'Finalizado' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="tipoProyecto"
                                            value="Finalizado" // ✅ Valor estandarizado
                                            checked={tipoProyecto === 'Finalizado'}
                                            onChange={handleProyectoStateChange}
                                            className="hidden-radio"
                                        />
                                        <span className="radio-content"><FaClipboardCheck /> Finalizado</span> 
                                    </label>

                                    {/* Opción En proceso (CORREGIDO VALUE) */}
                                    <label className={`radio-label ${tipoProyecto === 'En proceso' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="tipoProyecto"
                                            value="En proceso" // ✅ Valor estandarizado
                                            checked={tipoProyecto === 'En proceso'}
                                            onChange={handleProyectoStateChange}
                                            className="hidden-radio"
                                        />
                                        <span className="radio-content"><FaHourglassHalf /> En proceso</span>
                                    </label>
                                </div>
                            </div>
                            
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
                                        className="progress-ba" 
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
                                    // Deshabilitado si no hay departamentos o si hay un mensaje de error
                                    disabled={seleccionados.length === 0 || !!errorMessage} 
                                >
                                    Generar Reporte
                                </button>
                                {/* MOSTRAR MENSAJE DE ERROR/ADVERTENCIA FIJO */}
                                {(seleccionados.length === 0 || errorMessage) && (
                                    <p className="alerta-seleccion">
                                        {errorMessage || "Selecciona al menos un departamento para habilitar el reporte."}
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