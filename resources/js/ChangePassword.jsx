import React, { useState, useRef } from 'react'; // 👈 Importamos useRef
import { useNavigate } from 'react-router-dom';
import '../css/Login.css';
import logo1 from '../imagenes/logo1.png';
import logo2 from '../imagenes/logo4.png';
import logo3 from '../imagenes/logo3.png';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

export default function ChangePassword() {
  const [username, setUsername] = useState('');
  const [domain, setDomain] = useState('gmail.com');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorUsername, setErrorUsername] = useState('');
  const [errorCodigo, setErrorCodigo] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);

  const navigate = useNavigate();
  const domains = ['gmail.com', 'outlook.com', 'hotmail.com', 'minatitlan.gob.mx'];

  // 1. Crear referencias
  const userInputRef = useRef(null);
  const codigoRef = useRef(null);
  const passwordRef = useRef(null);

  const fullEmail = `${username}@${domain}`;

  // 2. Manejador de Enter
  const handleKeyDown = (event, nextAction) => {
    if (event.key === 'Enter') {
      event.preventDefault(); 
      
      if (typeof nextAction === 'function') {
        // Si es una función (ej: enviarCodigo o cambiarContrasena), la ejecutamos
        nextAction();
      } else if (nextAction && nextAction.current) {
        // Si es una referencia, movemos el foco
        nextAction.current.focus();
      }
    }
  };

  // Paso 1: enviar código
  const enviarCodigo = async () => {
    setErrorUsername('');
    if (!username) { 
      setErrorUsername('❌ Ingresa tu usuario'); 
      return; 
    }

    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/password-reset/send-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: fullEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setCodigoEnviado(true);
        setErrorUsername('');
        // Después de enviar código, enfocamos el campo de código
        setTimeout(() => codigoRef.current?.focus(), 100); 
      } else {
        setErrorUsername(data.message || '❌ Error al enviar código');
      }
    } catch (error) {
      console.error(error);
      setErrorUsername('❌ Error de conexión con el servidor');
    } finally { setLoading(false); }
  };

  // Paso 2: cambiar contraseña
  const cambiarContrasena = async () => {
    setErrorCodigo('');
    setErrorPassword('');
    let hasError = false;

    if (!codigo) { setErrorCodigo('❌ Ingresa el código'); hasError = true; }
    if (!password) { setErrorPassword('❌ Ingresa tu nueva contraseña'); hasError = true; }
    else if (password.length < 8) { setErrorPassword('❌ La contraseña debe tener al menos 8 caracteres'); hasError = true; }

    if (hasError) return;

    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: fullEmail, token: codigo, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setTimeout(() => navigate('/'), 1000);
      } else {
        setErrorCodigo(data.message || '❌ Error al cambiar contraseña');
      }
    } catch (error) {
      console.error(error);
      setErrorCodigo('❌ Error de conexión con el servidor');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-body">
      <div className="login-container">
        <div className="login-logos">
          <img src={logo3} alt="Logo3" className="login-logo3" />
          <img src={logo1} alt="Logo1" className="login-logo1" />
          <img src={logo2} alt="Logo2" className="login-logo2" />
        </div>

        <h1 className="login-title">CAMBIAR CONTRASEÑA</h1>

        {/* Usuario (Fase 1: Enviar Código) */}
        <div className="login-campo">
          <label>Correo:</label>
          <div className="login-input-contenedor correo-linea">
            <input
              type="text"
              placeholder="Usuario"
              className="login-input usuario-input"
              value={username}
              onChange={(e) => {
               // solo letras (mayúsculas y minúsculas), números, puntos o guion bajo
              const valorFiltrado = e.target.value.replace(/[^a-zA-Z0-9._]/g, '');
              setUsername(valorFiltrado);
              }}
              ref={userInputRef} // 3. Asignar referencia
              onKeyDown={(e) => handleKeyDown(e, enviarCodigo)} // 4. Enter ejecuta enviarCodigo
              disabled={codigoEnviado} // Deshabilitar si ya se envió el código
            />
            <span className="login-at">@</span>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="login-select dominio-select"
              onKeyDown={(e) => handleKeyDown(e, enviarCodigo)} // 4. Enter ejecuta enviarCodigo
              disabled={codigoEnviado}
            >
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {errorUsername && <div className="login-error-msg">{errorUsername}</div>}

          {!codigoEnviado && (
            <button
              className="login-button"
              onClick={enviarCodigo}
              disabled={loading}
              style={{ marginTop: '10px' }}
            >
              {loading ? <span className="spinner"></span> : 'ENVIAR CÓDIGO'}
            </button>
          )}
        </div>

        {/* Fase 2: Aplicar Código y Nueva Contraseña */}
        {codigoEnviado && (
          <>
            {/* Código recibido -> Siguiente: Nueva contraseña */}
            <div className="login-campo">
              <label>Código recibido:</label>
              <input
                type="text"
                className="login-input"
                placeholder="Ingresa tu código"
                value={codigo}
                onChange={(e) => {
                  const valor = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
                  setCodigo(valor);
                }}
                maxLength={8}
                ref={codigoRef} // 3. Asignar referencia
                onKeyDown={(e) => handleKeyDown(e, passwordRef)} // 4. Mover a Nueva Contraseña
              />
              {errorCodigo && <div className="login-error-msg">{errorCodigo}</div>}
            </div>

            {/* Nueva Contraseña -> Siguiente: Cambiar Contraseña (Enviar) */}
            <div className="login-campo">
              <label>Nueva contraseña:</label>
              <div className="login-input-contenedor">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Ingresa tu nueva contraseña"
                  value={password}
                  onChange={(e) => {
                    const valorSinEspacios = e.target.value.replace(/\s/g, ''); // elimina todos los espacios
                    setPassword(valorSinEspacios);
                  }}
                  ref={passwordRef} // 3. Asignar referencia
                  onKeyDown={(e) => handleKeyDown(e, cambiarContrasena)} // 4. Enter ejecuta cambiarContrasena
                />
                {password.length > 0 && (
                  <span
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </span>
                )}
              </div>
              {errorPassword && <div className="login-error-msg">{errorPassword}</div>}
            </div>

            <div className="login-campo" style={{ marginTop: '20px' }}>
              <button
                className="login-button"
                onClick={cambiarContrasena}
                disabled={loading}
              >
                {loading ? <span className="spinner"></span> : 'CAMBIAR CONTRASEÑA'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}