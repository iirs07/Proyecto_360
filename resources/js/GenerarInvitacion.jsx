import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import logo3 from "../imagenes/logo3.png";
import '../css/GenerarInvitacion.css';
import '../css/global.css';
import { 
    FaLink, FaUser, FaUsers, FaMapMarkerAlt, FaBuilding,
    FaCopy, FaCheck, FaTimes, FaExclamationTriangle,
    FaChevronDown, FaChevronUp, FaPlus, FaTrashAlt,
    FaLock, FaClipboardCheck
} from 'react-icons/fa';

// CONSTANTE PARA EL LÍMITE MÁXIMO
const MAX_USOS_INVITACION = 50;

const ROLES = [
    { value: 'Usuario', name: 'Usuario' },
    { value: 'Jefe', name: 'Jefe' },
    { value: 'Superusuario', name:'Superusuario' },
    { value: 'Administrador', name: 'Administrador' }
];

function GenerarInvitacion() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("jwt_token");

    // VERIFICAR ROL DEL USUARIO
    const [userRole, setUserRole] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);

    // ESTADO: ID del usuario generador (Administrador logueado)
    const [creadoPorId, setCreadoPorId] = useState(null);

    // Estados para Rol
    const [rol, setRol] = useState('');
    const [selectedRolText, setSelectedRolText] = useState("Selecciona un rol");
    const [isRolOpen, setIsRolOpen] = useState(false);

    // Estados para Área
    const [areas, setAreas] = useState([]);
    const [idArea, setIdArea] = useState('');
    const [selectedAreaText, setSelectedAreaText] = useState("Selecciona un área");
    const [isAreaOpen, setIsAreaOpen] = useState(false);

    // Estados para Departamento
    const [departamentosFiltrados, setDepartamentosFiltrados] = useState([]);
    const [idDepartamento, setIdDepartamento] = useState('');
    const [selectedDepText, setSelectedDepText] = useState("Selecciona un departamento");
    const [isDepOpen, setIsDepOpen] = useState(false);

    // Cantidad de usos (inicia en 1)
    const [cantidad, setCantidad] = useState(1);
    const [link, setLink] = useState('');
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    
    // ESTADOS DE ERROR
    const [errorRol, setErrorRol] = useState(''); 
    const [errorArea, setErrorArea] = useState('');
    const [errorDepartamento, setErrorDepartamento] = useState(''); 
    const [errorCantidad, setErrorCantidad] = useState('');
    
    // Estado para mensajes de éxito
    const [mensajeExito, setMensajeExito] = useState('');
    const [copied, setCopied] = useState(false);

    // Estado para controlar si los campos están habilitados
    const [camposHabilitados, setCamposHabilitados] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL;

    // OBTENER DATOS DEL USUARIO, SU ID Y VERIFICAR ROL
    useEffect(() => {
        if (!token) {
            navigate("/", { replace: true });
            return;
        }

        const storedRol = localStorage.getItem("rol");
        setUserRole(storedRol || '');

        // VERIFICAR SI EL USUARIO ES ADMINISTRADOR
        if (storedRol !== 'Administrador') {
            setAccessDenied(true);
            mostrarExito("Acceso denegado. Solo los usuarios con rol 'Administrador' pueden generar invitaciones.", 5000);
            setTimeout(() => {
                navigate("/", { replace: true });
            }, 3000);
            return;
        }

        const storedUsuario = localStorage.getItem("usuario");
        
        if (storedUsuario) {
            try {
                const usuarioData = JSON.parse(storedUsuario);
                
                // EXTRAER ID DEL USUARIO Y GUARDARLO
                setCreadoPorId(usuarioData.id_usuario || null);

                const fullName = `${usuarioData.nombre} ${usuarioData.a_paterno}`.trim();
                setUserName(fullName);
            } catch (error) {
                console.error("Error al parsear datos de usuario:", error);
                setCreadoPorId(null); 
                setUserName("Generador de Invitaciones");
            }
        } else {
            setUserName(storedRol || 'Usuario del Sistema');
            setCreadoPorId(null);
        }
    }, [navigate, token]);


    // Función para limpiar todos los errores
    const clearErrors = () => {
        setErrorRol('');
        setErrorArea('');
        setErrorDepartamento('');
        setErrorCantidad('');
    };
    
    // Función auxiliar para establecer errores con temporizador (SIN EMOJIS)
    const setTimedError = (setter, message, duration = 3000) => {
        setter(message);
        setTimeout(() => setter(''), duration);
    };

    // Función para mostrar mensajes de éxito (SIN EMOJIS)
    const mostrarExito = (msg, duration = 3000) => {
        setMensajeExito(msg);
        setTimeout(() => setMensajeExito(''), duration);
    };

    // Función para manejar el toggle de dropdowns
    const handleToggleDropdown = (type) => {
        if (!camposHabilitados) return;

        switch(type) {
            case 'rol':
                if (isRolOpen) {
                    setIsRolOpen(false);
                    return;
                }
                break;
            case 'area':
                if (isAreaOpen) {
                    setIsAreaOpen(false);
                    return;
                }
                break;
            case 'departamento':
                if (isDepOpen) {
                    setIsDepOpen(false);
                    return;
                }
                break;
        }
        
        setIsRolOpen(false);
        setIsAreaOpen(false);
        setIsDepOpen(false);
        
        setTimeout(() => {
            switch(type) {
                case 'rol':
                    setIsRolOpen(true);
                    break;
                case 'area':
                    setIsAreaOpen(true);
                    break;
                case 'departamento':
                    setIsDepOpen(true);
                    break;
            }
        }, 10);
    };

    // Cargar datos de áreas y departamentos
    useEffect(() => {
        if (accessDenied) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const headers = { Accept: "application/json" };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch(`${API_URL}/api/departamentos`, { headers });

                if (res.status === 401) {
                    sessionStorage.removeItem("jwt_token");
                    navigate("/Login");
                    return;
                }

                const data = await res.json();
                
                const areasData = data.map(area => ({
                    id_area: area.id || area.id_area || area.a_id || 0,
                    nombre: area.nombre || area.a_nombre || "Sin nombre",
                    departamentos: area.departamentos || []
                }));
                
                setAreas(areasData);
                
                if (idArea && areasData.length > 0) {
                    const areaSeleccionada = areasData.find(area => area.id_area === idArea);
                    if (areaSeleccionada) {
                        setSelectedAreaText(areaSeleccionada.nombre);
                    }
                }
                
            } catch (err) {
                console.error("Error cargando datos:", err);
                mostrarExito("Error de conexión al cargar los datos.", 4000);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate, token, API_URL, idArea, accessDenied]);

    // Cuando se selecciona un área, filtrar departamentos
    useEffect(() => {
        if (idArea && areas.length > 0) {
            const areaSeleccionada = areas.find(area => 
                area.id_area === idArea
            );
            
            if (areaSeleccionada && areaSeleccionada.departamentos) {
                setDepartamentosFiltrados(areaSeleccionada.departamentos);
                
                if (idDepartamento) {
                    const depSeleccionado = areaSeleccionada.departamentos.find(
                        dep => dep.id_departamento === idDepartamento
                    );
                    if (depSeleccionado) {
                        setSelectedDepText(depSeleccionado.d_nombre || depSeleccionado.nombre);
                    }
                } else {
                    setSelectedDepText("Selecciona un departamento");
                }
            } else {
                setDepartamentosFiltrados([]);
            }
        } else {
            setDepartamentosFiltrados([]);
        }
    }, [idArea, areas, idDepartamento]);

    // 1. Manejar cambio en cantidad (Permite temporalmente '' o 0 para la edición móvil/teclado)
    const handleCantidadChange = (e) => {
        if (!camposHabilitados) return;

        const value = e.target.value;
        
        // Permitir cadena vacía o valores que no son números válidos (se validan al hacer submit/onBlur)
        setCantidad(value);
        setErrorCantidad('');
    };

    // 2. Función para forzar el valor al mínimo (1) o al máximo (50) si se pierde el foco
    const handleBlurCantidad = () => {
        if (!camposHabilitados) return;

        let finalValue = parseInt(cantidad);
        
        if (isNaN(finalValue) || finalValue < 1) {
            setCantidad(1);
        } else if (finalValue > MAX_USOS_INVITACION) { // APLICAR EL NUEVO MÁXIMO
            setCantidad(MAX_USOS_INVITACION);
        } else {
            setCantidad(finalValue);
        }
        setErrorCantidad('');
    };

    const handleGenerar = async () => {
        clearErrors();
        setMensajeExito('');
        setLink('');
        setCopied(false);
        
        setIsRolOpen(false);
        setIsAreaOpen(false);
        setIsDepOpen(false);

        let hasError = false;

        // Validaciones del formulario
        if (!rol) {
            setTimedError(setErrorRol, "Por favor, selecciona un tipo de usuario (rol).");
            hasError = true;
        }
        if (!idArea) {
            setTimedError(setErrorArea, "Por favor, selecciona un área.");
            hasError = true;
        }
        if (!idDepartamento) {
            setTimedError(setErrorDepartamento, "Por favor, selecciona un departamento.");
            hasError = true;
        }
        
        // VALIDACIÓN CLAVE: Asegurar que la cantidad sea numérica y entre 1 y MAX_USOS_INVITACION
        const finalCantidad = parseInt(cantidad);

        if (isNaN(finalCantidad) || finalCantidad < 1) {
            setTimedError(setErrorCantidad, "La cantidad mínima de registros es 1. Por favor, ingresa un número válido.");
            hasError = true;
        } else if (finalCantidad > MAX_USOS_INVITACION) { // APLICAR EL NUEVO MÁXIMO
             setTimedError(setErrorCantidad, `La cantidad máxima de registros es ${MAX_USOS_INVITACION}.`);
            hasError = true;
        }
        
        if (!creadoPorId) {
             mostrarExito("Error: No se pudo identificar al usuario administrador. Intenta recargar la página.", 5000);
             hasError = true;
        }

        if (hasError) return;
        // FIN DE VALIDACIONES. Si no hay errores, procedemos.

        try {
            const headers = { "Content-Type": "application/json" };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_URL}/api/invitaciones/crear`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    rol,
                    id_departamento: idDepartamento,
                    creado_por: creadoPorId, // ID del administrador logueado
                    max_usos: finalCantidad // Usamos la cantidad validada
                })
            });

            if (res.status === 401) {
                sessionStorage.removeItem("jwt_token");
                navigate("/Login");
                return;
            }

            const data = await res.json();

            if (data.ok) {
                setLink(data.link);
                setCamposHabilitados(false);
                mostrarExito("Invitación generada con éxito.");
            } else {
                mostrarExito(`Error: ${data.message || 'No se pudo generar el link'}`, 4000);
            }

        } catch (err) {
            console.error(err);
            mostrarExito("Error de conexión al generar la invitación.", 4000);
        }
    };
    // ... (El resto de funciones se mantiene)

    const handleCopiar = () => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        setCopied(true);
        mostrarExito("Link copiado al portapapeles.", 2000);
        setTimeout(() => setCopied(false), 2000);
    };

    // Función para limpiar formulario
    const handleLimpiar = () => {
        setRol('');
        setSelectedRolText("Selecciona un rol");
        setIdArea('');
        setSelectedAreaText("Selecciona un área");
        setIdDepartamento('');
        setSelectedDepText("Selecciona un departamento");
        setCantidad(1);
        setLink('');
        
        setIsRolOpen(false);
        setIsAreaOpen(false);
        setIsDepOpen(false);
        
        clearErrors();
        setMensajeExito('');
        setCopied(false);
        setCamposHabilitados(true);
    };

    // Función para seleccionar opción del dropdown
    const handleSelectOption = (type, value, text) => {
        if (!camposHabilitados) return;

        switch(type) {
            case 'rol':
                setRol(value);
                setSelectedRolText(text);
                setErrorRol('');
                setTimeout(() => setIsRolOpen(false), 50);
                break;
            case 'area':
                // Si el área cambia, resetear el departamento
                if (value !== idArea) {
                    setIdDepartamento('');
                    setSelectedDepText("Selecciona un departamento");
                    setErrorDepartamento('');
                }
                setIdArea(value);
                setSelectedAreaText(text);
                setErrorArea('');
                setTimeout(() => setIsAreaOpen(false), 50);
                break;
            case 'departamento':
                setIdDepartamento(value);
                setSelectedDepText(text);
                setErrorDepartamento('');
                setTimeout(() => setIsDepOpen(false), 50);
                break;
        }
    };

    // Función para cerrar dropdown si se hace click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.geninv-card') && 
                !event.target.closest('.options-dropdown')) {
                setIsRolOpen(false);
                setIsAreaOpen(false);
                setIsDepOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Mostrar mensaje de acceso denegado (el resto del render se mantiene igual)

    if (accessDenied) {
        return (
            <Layout titulo="ACCESO DENEGADO" sidebar={<MenuDinamico tipo="generar" />}>
                <div className="access-denied-container" style={{
                    minHeight: '70vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div className="access-denied-content" style={{
                        textAlign: 'center',
                        maxWidth: '500px',
                        background: 'white',
                        padding: '40px 30px',
                        borderRadius: '15px',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                        border: '1px solid #f0f0f0'
                    }}>
                        <div className="access-denied-icon" style={{
                            marginBottom: '25px',
                            color: '#dc3545'
                        }}>
                            <FaLock size={60} />
                        </div>
                        <h2 style={{
                            color: '#861542',
                            marginBottom: '15px',
                            fontSize: '1.8rem'
                        }}>Acceso Restringido</h2>
                        <p className="access-denied-message" style={{
                            color: '#666',
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            marginBottom: '20px'
                        }}>
                            Solo usuarios con rol <strong style={{color: '#861542'}}>"Administrador"</strong> 
                            <br />pueden acceder a esta funcionalidad.
                        </p>
                        <p className="access-denied-redirect" style={{
                            color: '#999',
                            fontSize: '0.9rem',
                            fontStyle: 'italic'
                        }}>
                            Serás redirigido automáticamente...
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (loading) {
        return (
            <Layout titulo="GENERAR INVITACIÓN" sidebar={<MenuDinamico tipo="generar" />}>
                <div className="loader-container">
                    <div className="loader-logo">
                        <img src={logo3} alt="Cargando" />
                    </div>
                    <div className="loader-texto">CARGANDO DATOS..</div>
                    <div className="loader-spinner"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout 
            titulo="REGISTRAR NUEVO USUARIO" 
            sidebar={<MenuDinamico tipo="generar" />}
        >
            <div className="geninv-app">
                {/* MENSAJE INFORMATIVO CUANDO LOS CAMPOS ESTÁN DESHABILITADOS */}
                {link && !camposHabilitados && (
                    <div className="success-message info" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '15px 20px',
                        margin: '15px auto',
                        maxWidth: '700px',
                        gap: '10px',
                        lineHeight: '1.5',
                        backgroundColor: '#f8f9fa',
                        borderLeft: '4px solid #007bff',
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                    }}>
                        <FaClipboardCheck style={{ 
                            fontSize: '1.2rem', 
                            flexShrink: 0,
                            color: '#007bff'
                        }} />
                        <span style={{ 
                            flex: 1,
                            color: '#004085'
                        }}>
                        <strong>Invitación generada con éxito</strong>
                            <br />Los campos están bloqueados. Para generar un nuevo link, 
                            <br />selecciona <strong>"Limpiar Formulario"</strong>.
                        </span>
                    </div>
                )}
                
                {/* TEXTO HERO - SOLO SE MUESTRA CUANDO LOS CAMPOS ESTÁN HABILITADOS */}
                {camposHabilitados && (
                    <div className="geninv-hero">
                        <p className="geninv-subtitle">
                            Completa los siguientes campos para generar un link de invitación
                        </p>
                    </div>
                )}
                
                <div className="geninv-grid-container">
                    <div className="geninv-grid-wrapper">
                        {/* SECCIÓN SUPERIOR: ROL Y CANTIDAD */}
                        <div className="geninv-grid-top">
                            {/* CARD DE ROL */}
                            <div className={`geninv-card ${isRolOpen ? 'active' : ''} ${!camposHabilitados ? 'disabled' : ''}`}>
                                <button
                                    className="geninv-card-btn"
                                    onClick={() => handleToggleDropdown('rol')}
                                    disabled={!camposHabilitados}
                                    aria-expanded={isRolOpen}
                                    aria-haspopup="listbox"
                                >
                                    <div className="geninv-card-header">
                                        <div className="geninv-icon-container">
                                            <FaUser />
                                        </div>
                                        <div className="geninv-text-content">
                                            <h3 className="geninv-name">Tipo de Usuario (Rol)</h3>
                                            <span className="geninv-selected">
                                                {selectedRolText}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="geninv-chevron">
                                        {isRolOpen ? <FaChevronUp /> : <FaChevronDown />}
                                    </div>
                                </button>
                                
                                {isRolOpen && (
                                    <div className="options-dropdown" role="listbox" style={{ zIndex: 99999 }}>
                                        <div className="options-grid">
                                            {ROLES.map(r => (
                                                <div
                                                    key={r.value}
                                                    className={`option-item ${r.value === rol ? 'selected' : ''}`}
                                                    onClick={() => handleSelectOption('rol', r.value, r.name)}
                                                    role="option"
                                                    aria-selected={r.value === rol}
                                                >
                                                    <div className="option-content">
                                                        <span className="option-name">{r.name}</span>
                                                    </div>
                                                    {r.value === rol && <FaCheck className="option-check" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {errorRol && (
                                    <div className="error-message">
                                        <FaExclamationTriangle /> {errorRol}
                                    </div>
                                )}
                            </div>

                            {/* CARD DE CANTIDAD */}
                            <div className={`geninv-card input-card ${!camposHabilitados ? 'disabled' : ''}`}>
                                <div className="geninv-card-header">
                                    <div className="geninv-icon-container">
                                        <FaUsers />
                                    </div>
                                    <div className="geninv-text-content">
                                        <h3 className="geninv-name">Número de registros</h3>
                                        <div className="cantidad-input-wrapper">
                                            <input
                                                type="number"
                                                min="1"
                                                max={MAX_USOS_INVITACION} // Límite de 50
                                                step="1"
                                                className="cantidad-input"
                                                value={cantidad}
                                                onChange={handleCantidadChange}
                                                disabled={!camposHabilitados}
                                                onBlur={handleBlurCantidad}
                                                onKeyDown={(e) => {
                                                    // Bloquea caracteres no deseados en móviles
                                                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            <div className="cantidad-info">
                                                {/* Mensaje de info actualizado */}
                                                <small>Mínimo: 1 | Máximo: {MAX_USOS_INVITACION} registros</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {errorCantidad && (
                                    <div className="error-message">
                                        <FaExclamationTriangle /> {errorCantidad}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SEPARADOR VISUAL */}
                        <div className="section-divider"></div>

                        {/* SECCIÓN INFERIOR: ÁREA Y DEPARTAMENTO */}
                        <div className="geninv-grid-bottom">
                            {/* CARD DE ÁREA */}
                            <div className={`geninv-card ${isAreaOpen ? 'active' : ''} ${!camposHabilitados ? 'disabled' : ''}`}>
                                <button
                                    className="geninv-card-btn"
                                    onClick={() => handleToggleDropdown('area')}
                                    disabled={!camposHabilitados}
                                    aria-expanded={isAreaOpen}
                                    aria-haspopup="listbox"
                                >
                                    <div className="geninv-card-header">
                                        <div className="geninv-icon-container">
                                            <FaMapMarkerAlt />
                                        </div>
                                        <div className="geninv-text-content">
                                            <h3 className="geninv-name">Área</h3>
                                            <span className="geninv-selected">
                                                {selectedAreaText}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="geninv-chevron">
                                        {isAreaOpen ? <FaChevronUp /> : <FaChevronDown />}
                                    </div>
                                </button>
                                
                                {isAreaOpen && (
                                    <div className="options-dropdown" role="listbox" style={{ zIndex: 99999 }}>
                                        <div className="options-grid">
                                            {areas.map(area => (
                                                <div
                                                    key={area.id_area}
                                                    className={`option-item ${idArea === area.id_area ? 'selected' : ''}`}
                                                    onClick={() => handleSelectOption('area', area.id_area, area.nombre)}
                                                    role="option"
                                                    aria-selected={idArea === area.id_area}
                                                >
                                                    <div className="option-content">
                                                        <span className="option-name">{area.nombre}</span>
                                                    </div>
                                                    {idArea === area.id_area && <FaCheck className="option-check" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {errorArea && (
                                    <div className="error-message">
                                        <FaExclamationTriangle /> {errorArea}
                                    </div>
                                )}
                            </div>

                            {/* CARD DE DEPARTAMENTO (solo si hay área seleccionada) */}
                            {idArea && (
                                <div className={`geninv-card ${isDepOpen ? 'active' : ''} ${!camposHabilitados ? 'disabled' : ''}`}>
                                    <button
                                        className="geninv-card-btn"
                                        onClick={() => handleToggleDropdown('departamento')}
                                        disabled={!camposHabilitados}
                                        aria-expanded={isDepOpen}
                                        aria-haspopup="listbox"
                                    >
                                        <div className="geninv-card-header">
                                            <div className="geninv-icon-container">
                                                <FaBuilding />
                                            </div>
                                            <div className="geninv-text-content">
                                                <h3 className="geninv-name">Departamento</h3>
                                                <span className="geninv-selected">
                                                    {selectedDepText}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="geninv-chevron">
                                            {isDepOpen ? <FaChevronUp /> : <FaChevronDown />}
                                        </div>
                                    </button>
                                    
                                    {isDepOpen && (
                                        <div className="options-dropdown" role="listbox" style={{ zIndex: 99999 }}>
                                            <div className="options-grid">
                                                {departamentosFiltrados.length > 0 ? (
                                                    departamentosFiltrados.map(dep => (
                                                        <div
                                                            key={dep.id_departamento}
                                                            className={`option-item ${idDepartamento === dep.id_departamento ? 'selected' : ''}`}
                                                            onClick={() => handleSelectOption('departamento', dep.id_departamento, dep.d_nombre || dep.nombre)}
                                                            role="option"
                                                            aria-selected={idDepartamento === dep.id_departamento}
                                                        >
                                                            <div className="option-content">
                                                                <span className="option-name">{dep.d_nombre || dep.nombre}</span>
                                                            </div>
                                                            {idDepartamento === dep.id_departamento && <FaCheck className="option-check" />}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="option-item disabled">
                                                        <FaTimes /> No hay departamentos disponibles
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {errorDepartamento && (
                                        <div className="error-message">
                                            <FaExclamationTriangle /> {errorDepartamento}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Overlay para cuando hay dropdowns abiertos */}
                {(isRolOpen || isAreaOpen || isDepOpen) && camposHabilitados && (
                    <div 
                        className="dropdown-overlay-hack"
                        onClick={() => {
                            setIsRolOpen(false);
                            setIsAreaOpen(false);
                            setIsDepOpen(false);
                        }}
                    />
                )}

                {/* BOTONES DE ACCIÓN */}
                <div className="action-buttons-container">
                    <div className="action-buttons">
                        <button 
                            className="btn-primary"
                            onClick={handleGenerar}
                            disabled={!camposHabilitados || !creadoPorId}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                            <FaLink /> Generar Link de Invitación
                        </button>
                        
                        <button 
                            className="btn-secondary"
                            onClick={handleLimpiar}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                            <FaTrashAlt /> Limpiar Formulario
                        </button>
                    </div>
                </div>

                {/* MENSAJE DE ÉXITO */}
                {mensajeExito && (
                    <div className={`success-message ${
                        mensajeExito.includes('Error') ? 'error' : 
                        mensajeExito.includes('Error de conexión') ? 'error' : 
                        'success'
                    }`}>
                        {mensajeExito}
                    </div>
                )}

                {/* LINK GENERADO */}
                {link && (
                    <div className="link-container">
                        <div className="link-header">
                            <h3><FaLink /> Link generado:</h3>
                        </div>
                        <div className="link-box">
                            <a href={link} target="_blank" rel="noopener noreferrer">
                                {link}
                            </a>
                            <button 
                                className={`copy-btn ${copied ? 'copied' : ''}`}
                                onClick={handleCopiar}
                            >
                                {copied ? (
                                    <>
                                        <FaCheck /> ¡Copiado!
                                    </>
                                ) : (
                                    <>
                                        <FaCopy /> Copiar Link
                                    </>
                                )}
                            </button>
                        </div>
                        
                        {/* INSTRUCCIONES */}
                        <div className="instructions">
                            <h4><FaExclamationTriangle /> Instrucciones:</h4>
                            <ul>
                                <li>Comparte este link con las personas que deseas invitar</li>
                                <li>Cada persona debe completar su registro individualmente</li>
                                <li>El link es válido solo para el departamento seleccionado</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default GenerarInvitacion;