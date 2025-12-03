import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import '../css/GenerarInvitacion.css';

const ROLES = [
    { value: 'Usuario', name: 'Usuario' },
    { value: 'Jefe', name: 'Jefe' },
    { value: 'Superusuario', name: 'Superusuario' }
];

function GenerarInvitacion() {

    const navigate = useNavigate();
    const token = localStorage.getItem("jwt_token");

    const [rol, setRol] = useState('');
    const [selectedRolText, setSelectedRolText] = useState("Selecciona un rol");
    const [isRolOpen, setIsRolOpen] = useState(false);

    const [departamentos, setDepartamentos] = useState([]);
    const [idDepartamento, setIdDepartamento] = useState('');
    const [selectedDepText, setSelectedDepText] = useState("Selecciona un departamento");
    const [isDepOpen, setIsDepOpen] = useState(false);

    const [cantidad, setCantidad] = useState(1);
    const [link, setLink] = useState('');
    
    // ESTADOS DE ERROR LOCALIZADOS
    const [errorRol, setErrorRol] = useState(''); 
    const [errorDepartamento, setErrorDepartamento] = useState(''); 
    const [errorCantidad, setErrorCantidad] = useState('');
    
    // Estado para mensajes de éxito (general)
    const [mensajeExito, setMensajeExito] = useState('');

    const rolRef = useRef(null);
    const depRef = useRef(null);
    
    // Función para limpiar todos los errores
    const clearErrors = () => {
        setErrorRol('');
        setErrorDepartamento('');
        setErrorCantidad('');
    };
    
    // Función auxiliar para establecer errores con temporizador (6 segundos)
    const setTimedError = (setter, message, duration = 2000) => {
        setter(message);
        setTimeout(() => setter(''), duration);
    };

    // Función para mostrar mensajes de éxito (como antes, global)
    const mostrarExito = (msg, duration = 1000) => {
        setMensajeExito(msg);
        setTimeout(() => setMensajeExito(''), duration);
    };

    useEffect(() => {
        function handleClickOutside(e) {
            if (rolRef.current && !rolRef.current.contains(e.target)) setIsRolOpen(false);
            if (depRef.current && !depRef.current.contains(e.target)) setIsDepOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { Accept: "application/json" };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch("http://127.0.0.1:8000/api/departamentos", { headers });

                if (res.status === 401) {
                    localStorage.removeItem("jwt_token");
                    navigate("/Login");
                    return;
                }

                const data = await res.json();
                const allDeps = data.flatMap(a => a.departamentos);
                setDepartamentos(allDeps);

            } catch (err) {
                console.error("Error cargando departamentos:", err);
                // Error de conexión: Usar una alerta nativa o un sistema de alerta global
            }
        };
        fetchData();
    }, [navigate, token]);

    const handleGenerar = async () => {
        clearErrors(); // Limpiar errores previos localizados
        setMensajeExito(''); // Limpiar mensaje de éxito

        let hasError = false;

        if (!rol) {
            setTimedError(setErrorRol, "Por favor, selecciona un tipo de usuario (rol).");
            hasError = true;
        }
        if (!idDepartamento) {
            setTimedError(setErrorDepartamento, "Por favor, selecciona un departamento.");
            hasError = true;
        }
        if (cantidad < 1) {
             setTimedError(setErrorCantidad, "La cantidad mínima de registros es 1.");
             hasError = true;
        }

        if (hasError) return; // Detener si hay errores de validación

        try {
            const headers = { "Content-Type": "application/json" };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch("http://127.0.0.1:8000/api/invitaciones/crear", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    rol,
                    id_departamento: idDepartamento,
                    creado_por: 6, 
                    max_usos: cantidad
                })
            });

            if (res.status === 401) {
                localStorage.removeItem("jwt_token");
                navigate("/Login");
                return;
            }

            const data = await res.json();

            if (data.ok) {
                setLink(data.link);
                mostrarExito("✅ Invitación generada con éxito.");
            } else {
                // Usar una alerta nativa para errores de API no esperados
                alert("Error de API: " + (data.message || JSON.stringify(data)));
            }

        } catch (err) {
            console.error(err);
            alert("Error de conexión al intentar generar la invitación.");
        }
    };

    const handleCopiar = () => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        mostrarExito("📋 Link copiado al portapapeles.", 1000); 
    };

    return (
        <Layout titulo="Generar Invitación" sidebar={<MenuDinamico tipo="generar" />}>
            <div className="geninv-wrapper">

                <div className="geninv-card">
                    <h2>Generar Invitación</h2>
                    
                    {/* SELECT DE ROL */}
                    <label>Rol:</label>
                    <div className="gi-select" ref={rolRef}>
                        <button
                            className={`gi-select-btn ${rol === '' ? "gi-placeholder" : ""}`}
                            onClick={() => setIsRolOpen(!isRolOpen)}
                        >
                            {selectedRolText}
                            <span className="gi-arrow">▼</span>
                        </button>

                        {isRolOpen && (
                            <div className="gi-options">
                                <div className="gi-options-scroll">
                                    {ROLES.map(r => (
                                        <div
                                            key={r.value}
                                            className={`gi-option ${r.value === rol ? "gi-option-active" : ""}`}
                                            onClick={() => {
                                                setRol(r.value);
                                                setSelectedRolText(r.name);
                                                setIsRolOpen(false);
                                                setErrorRol(''); // Limpiar error al seleccionar
                                            }}
                                        >
                                            {r.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* MENSAJE DE ERROR PARA ROL (con temporizador) */}
                    {errorRol && <div className="gi-field-error gi-alert-error">{errorRol}</div>}


                    {/* SELECT DE DEPARTAMENTO */}
                    <label>Departamento:</label>
                    <div className="gi-select" ref={depRef}>
                        <button
                            className={`gi-select-btn ${idDepartamento === '' ? "gi-placeholder" : ""}`}
                            onClick={() => setIsDepOpen(!isDepOpen)}
                        >
                            {selectedDepText}
                            <span className="gi-arrow">▼</span>
                        </button>

                        {isDepOpen && (
                            <div className="gi-options">
                                <div className="gi-options-scroll">
                                    {departamentos.map(dep => (
                                        <div
                                            key={dep.id_departamento}
                                            className={`gi-option ${idDepartamento === dep.id_departamento ? "gi-option-active" : ""}`}
                                            onClick={() => {
                                                setIdDepartamento(dep.id_departamento);
                                                setSelectedDepText(dep.d_nombre);
                                                setIsDepOpen(false);
                                                setErrorDepartamento(''); // Limpiar error al seleccionar
                                            }}
                                        >
                                            {dep.d_nombre}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* MENSAJE DE ERROR PARA DEPARTAMENTO (con temporizador) */}
                    {errorDepartamento && <div className="gi-field-error gi-alert-error">{errorDepartamento}</div>}

                    {/* CANTIDAD */}
                    <label>Cantidad máxima de registros:</label>
                    <input
                        type="number"
                        min="1"
                        className="gi-input"
                        value={cantidad}
                        onChange={e => {
                            setCantidad(parseInt(e.target.value) || 1);
                            setErrorCantidad(''); // Limpiar error al cambiar
                        }}
                    />
                    {/* MENSAJE DE ERROR PARA CANTIDAD (con temporizador) */}
                    {errorCantidad && <div className="gi-field-error gi-alert-error">{errorCantidad}</div>}

                    {/* Botón Generar */}
                    <div className="gi-buttons-row">
                        <button className="gi-btn" onClick={handleGenerar}>Generar Link</button>
                    </div>

                    {/* Alerta de Éxito (MOVIDO AQUÍ) */}
                    {mensajeExito && (
                        <div className={`gi-alert gi-alert-success`}>
                            {mensajeExito}
                        </div>
                    )}

                    {/* Link y Botón Copiar */}
                    {link && (
                        <div className="gi-link-box">
                            <p>Link generado:</p>
                            <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                            <button className="gi-btn gi-btn-copy" onClick={handleCopiar}>Copiar Link</button>
                        </div>
                    )}

                </div>
            </div>
        </Layout>
    );
}

export default GenerarInvitacion;