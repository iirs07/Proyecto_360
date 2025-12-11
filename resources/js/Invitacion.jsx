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

// SOLO USUARIO - Los Jefes solo pueden agregar usuarios con rol "Usuario"
const ROLES_PERMITIDOS_PARA_JEFES = [
    { value: 'Usuario', name: 'Usuario' }
];

function Invitacion() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("jwt_token");
    const API_URL = import.meta.env.VITE_API_URL;

    const [userRole, setUserRole] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);
    const [userDepartamentoId, setUserDepartamentoId] = useState(null); 
    
    // ESTADO: ID del Jefe logueado
    const [creadoPorId, setCreadoPorId] = useState(null); 

    const [rol, setRol] = useState('Usuario'); 
    const [selectedRolText, setSelectedRolText] = useState("Usuario"); 
    const [isRolOpen, setIsRolOpen] = useState(false); 
    const [isAreaOpen, setIsAreaOpen] = useState(false); 

    const [areas, setAreas] = useState([]);
    const [idArea, setIdArea] = useState('');
    const [selectedAreaText, setSelectedAreaText] = useState("Cargando Área...");

    const [departamentosFiltrados, setDepartamentosFiltrados] = useState([]);
    const [idDepartamento, setIdDepartamento] = useState('');
    const [selectedDepText, setSelectedDepText] = useState("Selecciona un departamento");
    const [isDepOpen, setIsDepOpen] = useState(false); 

    const [cantidad, setCantidad] = useState(1);
    const [link, setLink] = useState('');
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');

    const [errorRol, setErrorRol] = useState(''); 
    const [errorArea, setErrorArea] = useState('');
    const [errorDepartamento, setErrorDepartamento] = useState(''); 
    const [errorCantidad, setErrorCantidad] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');
    const [copied, setCopied] = useState(false);

    // Mantenemos la lógica de camposHabilitados en localStorage por el momento.
    const [camposHabilitados, setCamposHabilitados] = useState(() => {
        const savedState = localStorage.getItem('camposHabilitados');
        return savedState !== null ? JSON.parse(savedState) : true;
    });

    // Funciones de utilidad
    const clearErrors = () => {
        setErrorRol('');
        setErrorArea('');
        setErrorDepartamento('');
        setErrorCantidad('');
    };
    
    const setTimedError = (setter, message, duration = 3000) => {
        setter(message);
        setTimeout(() => setter(''), duration);
    };

    const mostrarExito = (msg, duration = 3000) => {
        setMensajeExito(msg);
        setTimeout(() => setMensajeExito(''), duration);
    };

    useEffect(() => {
        localStorage.setItem('camposHabilitados', JSON.stringify(camposHabilitados));
    }, [camposHabilitados]);

    // OBTENER DATOS DEL USUARIO, ID Y VERIFICAR ROL
    useEffect(() => {
        if (!token) {
            navigate("/", { replace: true });
            return;
        }

        const storedRol = localStorage.getItem("rol");
        setUserRole(storedRol || '');

        if (storedRol !== 'Jefe') {
            setAccessDenied(true);
            mostrarExito("Acceso denegado. Solo los Jefes pueden generar invitaciones.", 5000);
            setTimeout(() => navigate("/", { replace: true }), 3000);
            return;
        }

        const storedUsuario = localStorage.getItem("usuario");
        if (storedUsuario) {
            try {
                const usuarioData = JSON.parse(storedUsuario);
                
                // *** CAPTURAR ID DEL USUARIO LOGUEADO (JEFE) ***
                setCreadoPorId(usuarioData.id_usuario || null); 

                setUserName(`${usuarioData.nombre} ${usuarioData.a_paterno}`.trim());
                setUserDepartamentoId(String(usuarioData.id_departamento || usuarioData.departamento_id));
            } catch (error) {
                setUserName("Generador de Invitaciones");
                setCreadoPorId(null);
            }
        } else {
             setCreadoPorId(null);
        }

        const savedLink = localStorage.getItem('generatedLink');
        if (savedLink) setLink(savedLink);
        
        const savedCantidad = localStorage.getItem('savedCantidad');
        if (savedCantidad) setCantidad(parseInt(savedCantidad));

        const savedIdDepartamento = localStorage.getItem('savedIdDepartamento');
        if (savedIdDepartamento) setIdDepartamento(savedIdDepartamento);
    }, [navigate, token]);

    // Guardar estados importantes en localStorage (MANTENIDO)
    useEffect(() => {
        if (link) localStorage.setItem('generatedLink', link);
        localStorage.setItem('savedRol', rol);
        localStorage.setItem('savedIdArea', idArea);
        localStorage.setItem('savedIdDepartamento', idDepartamento);
        localStorage.setItem('savedCantidad', cantidad.toString());
    }, [link, rol, idArea, idDepartamento, cantidad]);

    // --- Lógica de Carga y Filtrado de Departamentos por Área ---
    useEffect(() => {
        if (accessDenied || userDepartamentoId === null || userDepartamentoId === 'null') {
            if (userDepartamentoId !== null) setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
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
                    id_area: String(area.id || area.id_area || area.a_id || 0),
                    nombre: area.nombre || area.a_nombre || "Sin nombre",
                    // Aseguramos que los nombres del departamento vengan robustos
                    departamentos: (area.departamentos || []).map(d => ({
                        id_departamento: String(d.id_departamento || d.id),
                        nombre: d.nombre || d.d_nombre || "Sin Nombre",
                        d_nombre: d.d_nombre 
                    }))
                }));
                
                setAreas(areasData);
                
                let areaEncontrada = null;
                let departamentosDeArea = [];
                const userDeptIdString = String(userDepartamentoId);

                // 1. Encontrar el Área del Jefe usando su Departamento ID
                if (userDeptIdString && areasData.length > 0) {
                    for (const area of areasData) {
                        if (area.departamentos && area.departamentos.length > 0) {
                            const isJefeInThisArea = area.departamentos.some(d => 
                                String(d.id_departamento || d.id) === userDeptIdString
                            );
                            
                            if (isJefeInThisArea) {
                                areaEncontrada = area;
                                departamentosDeArea = area.departamentos;
                                setIdArea(area.id_area); // Guardar el ID del Área del Jefe
                                break;
                            }
                        }
                    }
                }
                
                // 2. Aplicar la lógica de negocio: Llenar todos los departamentos del área
                if (areaEncontrada) {
                    setIdArea(areaEncontrada.id_area);
                    setSelectedAreaText(areaEncontrada.nombre);
                    setDepartamentosFiltrados(departamentosDeArea); // <-- ESTO MUESTRA TODAS LAS OPCIONES
                    
                    // Restaurar selección o dejar vacío
                    const savedDeptId = localStorage.getItem('savedIdDepartamento');
                    const selectedDept = departamentosDeArea.find(d => String(d.id_departamento || d.id) === savedDeptId);

                    if (selectedDept) {
                        setIdDepartamento(String(selectedDept.id_departamento || selectedDept.id));
                        setSelectedDepText(selectedDept.nombre || selectedDept.d_nombre || "Departamento Asignado");
                    } else {
                        setIdDepartamento('');
                        setSelectedDepText("Selecciona un departamento");
                    }
                } else {
                    setSelectedAreaText("Área no asignada/encontrada");
                    setTimedError(setErrorArea, "Tu área no pudo ser determinada.", 5000);
                }
                
            } catch (err) {
                console.error("Error cargando datos:", err);
                mostrarExito("Error de conexión al cargar los datos.", 4000);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate, token, API_URL, userDepartamentoId, accessDenied]);

    // FUNCIÓN CORREGIDA PARA ABRIR DROPDOWN
    const handleToggleDropdown = (type) => {
        if (!camposHabilitados) return;

        // Cierra todos los demás
        setIsRolOpen(false);
        setIsAreaOpen(false);
        setIsDepOpen(false);

        if (type === 'departamento') {
            // Permite abrir/cerrar si el área está cargada y hay opciones disponibles
            if (idArea && departamentosFiltrados.length > 0) { 
                setIsDepOpen(!isDepOpen); // <-- Alterna el estado de apertura
            } else if (idArea) {
                mostrarExito("No se encontraron departamentos en tu área.", 3000);
            } else {
                mostrarExito("Espera a que se cargue tu área asignada.", 3000);
            }
        } else if (type === 'rol' || type === 'area') {
            // Estos campos son fijos y no deben abrir un dropdown.
            mostrarExito("Este campo está asignado y no es modificable.", 3000);
        }
    };


    // Manejar cambio en cantidad
    const handleCantidadChange = (e) => {
        if (!camposHabilitados) return;

        const value = e.target.value;
        
        if (value === '') {
            setCantidad(1);
            setErrorCantidad('');
            return;
        }
        
        const numValue = parseInt(value);
        
        if (isNaN(numValue) || numValue < 1) {
            setCantidad(1);
            setTimedError(setErrorCantidad, 'La cantidad debe ser al menos 1');
        } else if (numValue > 100) {
            setCantidad(100);
            setTimedError(setErrorCantidad, 'La cantidad máxima es 100');
        } else {
            setCantidad(numValue);
            setErrorCantidad('');
        }
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

        // Validaciones de Rol y Área Fijas
        if (!rol || rol !== 'Usuario') { setTimedError(setErrorRol, "El rol debe ser 'Usuario'."); hasError = true; }
        if (!idArea) { setTimedError(setErrorArea, "El área no está asignada."); hasError = true; }
        
        // Validar selección de Departamento
        if (!idDepartamento) {
            setTimedError(setErrorDepartamento, "Por favor, selecciona un departamento.");
            hasError = true;
        }
        
        // Verificar que el DEPARTAMENTO seleccionado realmente pertenezca a SU ÁREA (Frontend check)
        const isDeptInArea = departamentosFiltrados.some(d => String(d.id_departamento || d.id) === idDepartamento);

        if (idDepartamento && !isDeptInArea) {
             setTimedError(setErrorDepartamento, "El departamento seleccionado no pertenece a su área.");
             hasError = true;
        }
        
        if (cantidad < 1) {
            setTimedError(setErrorCantidad, "La cantidad mínima de registros es 1.");
            hasError = true;
        }
        
        // *** VALIDACIÓN DEL ID DEL JEFE ***
        if (!creadoPorId) {
             mostrarExito("Error: No se pudo identificar su ID de Jefe. Intente recargar la página.", 5000);
             hasError = true;
        }


        if (hasError) return;

        try {
            const headers = { "Content-Type": "application/json" };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_URL}/api/invitaciones/crear`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    rol: 'Usuario', // Forzamos rol Usuario para Jefes
                    id_departamento: idDepartamento, // Departamento SELECCIONADO del área
                    creado_por: creadoPorId, // *** CORREGIDO: USAMOS EL ID REAL DEL JEFE LOGUEADO ***
                    max_usos: cantidad
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
                mostrarExito("Invitación generada con éxito. Los nuevos usuarios tendrán rol 'Usuario'.");
            } else {
                mostrarExito(`Error: ${data.error || data.message || 'No se pudo generar el link'}`, 4000);
            }

        } catch (err) {
            console.error(err);
            mostrarExito("Error de conexión al generar la invitación.", 4000);
        }
    };

    const handleCopiar = () => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Función para limpiar formulario
    const handleLimpiar = () => {
        setRol('Usuario');
        setSelectedRolText("Usuario");
        
        // Intentar restablecer el área y departamento iniciales
        const initialArea = areas.find(a => String(a.id_area) === String(idArea));
        setSelectedAreaText(initialArea?.nombre || "Selecciona un área");
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
        
        localStorage.removeItem('generatedLink');
        localStorage.removeItem('savedCantidad');
        localStorage.removeItem('savedIdDepartamento');
        // Mantener área y rol fijos para la próxima generación sin recargar
    };

    // Función para seleccionar opción del dropdown
    const handleSelectOption = (type, value, text) => {
        if (!camposHabilitados) return;

        switch(type) {
            case 'rol':
                mostrarExito("El rol está asignado y no es modificable.", 3000);
                break;
            case 'area':
                mostrarExito("El área está asignada y no es modificable.", 3000);
                break;
            case 'departamento':
                const selectedDept = departamentosFiltrados.find(d => String(d.id_departamento || d.id) === String(value));
                if (selectedDept) {
                    setIdDepartamento(String(value));
                    setSelectedDepText(selectedDept.nombre || selectedDept.d_nombre || "Departamento Asignado");
                    setErrorDepartamento('');
                    setIsDepOpen(false);
                }
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

    // Mostrar mensaje de acceso denegado
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
                            Solo usuarios con rol <strong style={{color: '#861542'}}>"Jefe"</strong> 
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
            titulo="AGREGAR NUEVO USUARIO" 
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
                            Completa los siguientes campos para generar un link de invitación.
                            <br /><small style={{color: '#666', fontSize: '0.9rem'}}>
                            </small>
                        </p>
                    </div>
                )}
                
                <div className="geninv-grid-container">
                    <div className="geninv-grid-wrapper">
                        {/* SECCIÓN SUPERIOR: ROL Y CANTIDAD */}
                        <div className="geninv-grid-top">
                            {/* CARD DE ROL - SOLO "Usuario" */}
                            <div className={`geninv-card ${!camposHabilitados ? 'disabled' : ''}`}>
                                <button
                                    className="geninv-card-btn"
                                    onClick={() => handleToggleDropdown('rol')}
                                    disabled={true} // BLOQUEADO
                                    aria-expanded={false}
                                    aria-haspopup="listbox"
                                >
                                    <div className="geninv-card-header">
                                        <div className="geninv-icon-container">
                                            <FaUser />
                                        </div>
                                        <div className="geninv-text-content">
                                            <h3 className="geninv-name">Tipo de Usuario</h3>
                                            <span className="geninv-selected">
                                                {selectedRolText}
                                            </span>
                                            {!camposHabilitados && (
                                                <small style={{color: '#666', fontSize: '0.75rem', display: 'block', marginTop: '4px'}}>
                                                    Rol asignado (No modificable)
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                    {/* QUITAMOS LA FLECHA DE DROPDOWN */}
                                    <div className="geninv-chevron">
                                            <FaLock style={{ color: '#ccc' }} /> 
                                    </div>
                                </button>
                                {errorRol && (<div className="error-message"><FaExclamationTriangle /> {errorRol}</div>)}
                            </div>

                            {/* CARD DE CANTIDAD */}
                            <div className={`geninv-card input-card ${!camposHabilitados ? 'disabled' : ''}`}>
                                <div className="geninv-card-header">
                                    <div className="geninv-icon-container"><FaUsers /></div>
                                    <div className="geninv-text-content">
                                        <h3 className="geninv-name">Número de registros</h3>
                                        <div className="cantidad-input-wrapper">
                                            <input
                                                type="number" min="1" max="100" step="1" className="cantidad-input"
                                                value={cantidad} onChange={handleCantidadChange} disabled={!camposHabilitados}
                                                onBlur={() => { if (cantidad < 1) setCantidad(1); if (cantidad > 100) setCantidad(100); }}
                                                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') { e.preventDefault(); }}}
                                            />
                                            <div className="cantidad-info"><small>Mínimo: 1 | Máximo: 100 registros</small></div>
                                        </div>
                                    </div>
                                </div>
                                {errorCantidad && (<div className="error-message"><FaExclamationTriangle /> {errorCantidad}</div>)}
                            </div>
                        </div>

                        {/* SEPARADOR VISUAL */}
                        <div className="section-divider"></div>

                        {/* SECCIÓN INFERIOR: ÁREA Y DEPARTAMENTO */}
                        <div className="geninv-grid-bottom">
                            {/* CARD DE ÁREA - SOLO LECTURA (BLOQUEADO) */}
                            <div className={`geninv-card ${!camposHabilitados ? 'disabled' : ''}`}>
                                <button
                                    className="geninv-card-btn"
                                    onClick={() => handleToggleDropdown('area')}
                                    disabled={true} // Deshabilitado para Jefes
                                    aria-expanded={false}
                                    aria-haspopup="listbox"
                                >
                                    <div className="geninv-card-header">
                                        <div className="geninv-icon-container"><FaMapMarkerAlt /></div>
                                        <div className="geninv-text-content">
                                            <h3 className="geninv-name">Área asignada</h3>
                                            <span className="geninv-selected">{selectedAreaText}</span>
                                            <small style={{color: '#666', fontSize: '0.75rem', display: 'block', marginTop: '4px'}}>
                                            </small>
                                        </div>
                                    </div>
                                    <div className="geninv-chevron">
                                            <FaLock style={{ color: '#ccc' }} /> 
                                    </div>
                                </button>
                                {errorArea && (<div className="error-message"><FaExclamationTriangle /> {errorArea}</div>)}
                            </div>

                            {/* CARD DE DEPARTAMENTO - SELECCIONABLE */}
                            <div className={`geninv-card ${isDepOpen ? 'active' : ''} ${!camposHabilitados ? 'disabled' : ''}`}>
                                <button
                                    className="geninv-card-btn"
                                    onClick={() => handleToggleDropdown('departamento')}
                                    // HABILITA si los campos están activos Y si el área fue cargada
                                    disabled={!camposHabilitados || !idArea} 
                                    aria-expanded={isDepOpen}
                                    aria-haspopup="listbox"
                                >
                                    <div className="geninv-card-header">
                                        <div className="geninv-icon-container"><FaBuilding /></div>
                                        <div className="geninv-text-content">
                                            <h3 className="geninv-name">Departamento de Asignación</h3>
                                            <span className="geninv-selected">{selectedDepText}</span>
                                            <small style={{color: '#666', fontSize: '0.75rem', display: 'block', marginTop: '4px'}}>
                                            </small>
                                        </div>
                                    </div>
                                    {/* MANTENEMOS FLECHA para indicar que es seleccionable */}
                                    <div className="geninv-chevron">{isDepOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
                                </button>

                                {isDepOpen && (
                                    <div className="options-dropdown" role="listbox" style={{ zIndex: 99998 }}>
                                        <div className="options-grid">
                                            {departamentosFiltrados.map(d => (
                                                <div
                                                    key={String(d.id_departamento || d.id)}
                                                    className={`option-item ${String(d.id_departamento || d.id) === idDepartamento ? 'selected' : ''}`}
                                                    onClick={() => handleSelectOption('departamento', String(d.id_departamento || d.id), d.nombre || d.d_nombre)}
                                                    role="option"
                                                    aria-selected={String(d.id_departamento || d.id) === idDepartamento}
                                                >
                                                    <div className="option-content">
                                                        <span className="option-name">{d.nombre || d.d_nombre || `Depto ID: ${d.id_departamento || d.id}`}</span>
                                                    </div>
                                                    {String(d.id_departamento || d.id) === idDepartamento && <FaCheck className="option-check" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {errorDepartamento && (<div className="error-message"><FaExclamationTriangle /> {errorDepartamento}</div>)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overlay para cuando hay dropdowns abiertos */}
                {(isDepOpen) && camposHabilitados && (
                    <div 
                        className="dropdown-overlay-hack"
                        onClick={() => { setIsDepOpen(false); }}
                    />
                )}

                {/* BOTONES DE ACCIÓN */}
                <div className="action-buttons-container">
                    <div className="action-buttons">
                        <button 
                            className="btn-primary"
                            onClick={handleGenerar}
                            disabled={!camposHabilitados || !idDepartamento || cantidad < 1 || cantidad > 100 || !creadoPorId}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                            <FaPlus /> Generar Link de Invitación
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
                                {copied ? (<><FaCheck /> ¡Copiado!</>) : (<><FaCopy /> Copiar Link</>)}
                            </button>
                        </div>
                        
                        {/* INSTRUCCIONES ESPECÍFICAS PARA JEFES */}
                        <div className="instructions">
                            <h4><FaExclamationTriangle /> Instrucciones:</h4>
                            <ul>
                                <li><strong>Rol de los nuevos usuarios:</strong> Todos serán agregados con rol "Usuario"</li>
                                <li><strong>Departamento asignado:</strong> Agregados a tu departamento <strong>{selectedDepText}</strong></li>
                                <li>Comparte este link con las personas que deseas invitar</li>
                                <li>Cada persona debe completar su registro individualmente</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default Invitacion;