import React, { useState, useRef } from 'react'; 
import { useNavigate, useParams } from 'react-router-dom';
import '../css/Login.css';
import logo1 from '../imagenes/logo1.png';
import logo2 from '../imagenes/logo4.png';
import logo3 from '../imagenes/logo3.png';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

// USO DE .ENV
const API_URL = import.meta.env.VITE_API_URL;

function RegistroPaso1() {
  const [username, setUsername] = useState('');
  const [domain, setDomain] = useState('gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorUsername, setErrorUsername] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');

  const navigate = useNavigate();
  const { token } = useParams();

  const domains = ['gmail.com', 'outlook.com', 'hotmail.com', 'minatitlan.gob.mx'];

  const passwordInputRef = useRef(null);
  const nextButtonRef = useRef(null);

  const handleSiguiente = async () => {
    let hasError = false;
    setErrorUsername('');
    setErrorPassword('');
    setErrorGeneral('');

    if (!username) {
      setErrorUsername('Ingresa usuario');
      hasError = true;
      setTimeout(() => setErrorUsername(''), 3000);
    } else if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      setErrorUsername('Usuario no válido');
      hasError = true;
      setTimeout(() => setErrorUsername(''), 3000);
    }

    if (!password) {
      setErrorPassword('Ingresa contraseña');
      hasError = true;
      setTimeout(() => setErrorPassword(''), 3000);
    } else if (password.length < 8) {
      setErrorPassword('Mínimo 8 caracteres');
      hasError = true;
      setTimeout(() => setErrorPassword(''), 3000);
    }

    if (hasError) return;

    const correo = `${username}@${domain}`;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/RegistroPaso1/invitado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ correo, token_invitacion: token }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.warn('Respuesta no es JSON:', text);
      }

      if (!res.ok) {
        setErrorGeneral(data?.message || 'Error del servidor');
        setTimeout(() => setErrorGeneral(''), 3000);
        setLoading(false);
        return;
      }

      if (!data.ok) {
        setErrorGeneral(data.message || 'Error desconocido');
        setTimeout(() => setErrorGeneral(''), 3000);
        setLoading(false);
        return;
      }
      navigate('/RegistroPaso2', { state: { correo, password, token } });
    } catch (error) {
      console.error(error);
      setErrorGeneral('Error de conexión con el servidor');
      setTimeout(() => setErrorGeneral(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event, actionRef) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (actionRef && actionRef.current) {
        if (actionRef.current instanceof HTMLInputElement) {
          actionRef.current.focus();
        } else {
          handleSiguiente();
        }
      } else {
        handleSiguiente();
      }
    }
  };

  return (
    <div className="login-body">
      <div className="login-container">
        <div className="login-logos">
          <img src={logo3} alt="Logo3" className="login-logo3" />
          <img src={logo1} alt="Logo1" className="login-logo1" />
          <img src={logo2} alt="Logo2" className="login-logo2" />
        </div>

        <h1 className="login-title">REGISTRARSE</h1>

        <div className="login-campo">
          <label htmlFor="usuario">Correo:</label>
          <div className="login-input-contenedor correo-linea">
            <input
              type="text"
              id="usuario"
              placeholder="Ingresa tu usuario"
              className="login-input usuario-input"
              value={username}
              onChange={(e) => {
                const valorFiltrado = e.target.value.replace(/[^a-zA-Z0-9._]/g, '');
                setUsername(valorFiltrado);
              }}
              onKeyDown={(e) => handleKeyDown(e, passwordInputRef)}
            />
            <span className="login-at">@</span>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="login-select dominio-select"
              onKeyDown={(e) => handleKeyDown(e, passwordInputRef)}
            >
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          {errorUsername && <div className="login-error-msg">{errorUsername}</div>}
        </div>

        <div className="login-campo">
          <label htmlFor="contrasena">Contraseña:</label>
          <div className="login-input-contenedor">
            <input
              type={showPassword ? 'text' : 'password'}
              id="contrasena"
              placeholder="Ingresa tu contraseña"
              className="login-input"
              value={password}
              onChange={(e) => {
                const valorSinEspacios = e.target.value.replace(/\s/g, '');
                setPassword(valorSinEspacios);
              }}
              ref={passwordInputRef}
              onKeyDown={(e) => handleKeyDown(e)} 
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

        {errorGeneral && <div className="login-error-general">{errorGeneral}</div>}

        <button
          type="button"
          className="login-button"
          onClick={handleSiguiente}
          disabled={loading}
          ref={nextButtonRef}
        >
          {loading ? <span className="spinner"></span> : 'SIGUIENTE'}
        </button>
      </div>
    </div>
  );
}

export default RegistroPaso1;
