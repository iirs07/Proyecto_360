import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo1 from "../imagenes/logo1.png";
import logo2 from "../imagenes/logo4.png";
import logo3 from "../imagenes/logo3.png";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import "../css/Login.css";

function Login() {
  /* Estados */
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [domain, setDomain] = useState("gmail.com");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorUsername, setErrorUsername] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorGeneral, setErrorGeneral] = useState("");

  const navigate = useNavigate();
  const passwordInputRef = useRef(null);

  /* Dominios disponibles */
  const domains = [
    "gmail.com", "outlook.com", "hotmail.com", "minatitlan.gob.mx"
  ];

  /* URL del backend desde .env */
  const API_URL = import.meta.env.VITE_API_URL;

  /* Duración de mensajes de error */
  const clearErrorsWithDelay = () => {
    setTimeout(() => {
      setErrorUsername("");
      setErrorPassword("");
      setErrorGeneral("");
    }, 3000);
  };

  /* Login */
  const handleLogin = async () => {
    if (loading) return;

    // Reset de errores
    setErrorUsername("");
    setErrorPassword("");
    setErrorGeneral("");

    let hasError = false;

    /* Validación de usuario */
    if (!username) {
      setErrorUsername("Ingresa usuario");
      hasError = true;
    } else if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      setErrorUsername("Usuario no válido");
      hasError = true;
    }

    /* Validación de contraseña */
    if (!password) {
      setErrorPassword("Ingresa contraseña");
      hasError = true;
    } else if (password.length < 8) {
      setErrorPassword("Mínimo 8 caracteres");
      hasError = true;
    }

    if (hasError) {
      clearErrorsWithDelay();
      return;
    }

    const fullEmail = `${username}@${domain}`;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          correo: fullEmail,
          password
        }),
      });

      const text = await res.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {}

      if (!res.ok) {
        if (res.status === 404) {
          setErrorUsername(data.error || "Correo no registrado");
        } 
        else if (res.status === 401) {
          setErrorPassword(data.error || "Contraseña incorrecta");
        } 
        else {
          setErrorGeneral(data.error || "Error de conexión o servidor");
        }

        clearErrorsWithDelay();
        setLoading(false);
        return;
      }
/* SESSION STORAGE*/
      sessionStorage.setItem("jwt_token", data.token);
      sessionStorage.setItem("rol", data.usuario.rol);
      sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
      /* Guardar datos de sesión */
      localStorage.setItem("jwt_token", data.token);
      localStorage.setItem("rol", data.usuario.rol);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));


      setPassword("");

      /* Redirección según rol */
      const rol = data.usuario.rol;
      switch (rol) {
        case "Administrador":
          navigate("/GestionProyectos");
          break;
        case "Jefe":
          navigate("/GestionProyectos");
          break;
        case "Superusuario":
          navigate("/PrincipalSuperusuario");
          break;
        case "Usuario":
          navigate("/GestionProyectosUsuario");
          break;
        default:
          navigate("/");
      }

    } catch {
      setErrorGeneral("Error de conexión con el servidor");
      clearErrorsWithDelay();
    } finally {
      setLoading(false);
    }
  };

  /* Manejo de Enter */
  const handleKeyDown = (event, nextAction) => {
    if (event.key === "Enter") {
      event.preventDefault();

      if (typeof nextAction === "function") {
        nextAction();
      } else if (nextAction?.current) {
        nextAction.current.focus();
      }
    }
  };

  /* Render */
  return (
    <div className="login-body">      
      <div className="login-container">

        {/* Logos */}
        <div className="login-logos">
          <img src={logo3} alt="Logo Gobierno" className="login-logo3" />
          <img src={logo1} alt="Logo Ministerio" className="login-logo1" />
          <img src={logo2} alt="Logo Ayuntamiento" className="login-logo2" />
        </div>

        {/* Título */}
        <h1 className="login-title">INICIAR SESIÓN</h1>

        {/* Usuario / Correo */}
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
                const valorFiltrado = e.target.value.replace(/[^a-zA-Z0-9._]/g, "");
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
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {errorUsername && (
            <div className="login-error-msg">
              {errorUsername}
            </div>
          )}
        </div>

        {/* Contraseña */}
        <div className="login-campo">
          <label htmlFor="contrasena">Contraseña:</label>

          <div className="login-input-contenedor">
            <input
              type={showPassword ? "text" : "password"}
              id="contrasena"
              placeholder="Ingresa tu contraseña"
              className="login-input"
              value={password}
              onChange={(e) => {
                const valorSinEspacios = e.target.value.replace(/\s/g, "");
                setPassword(valorSinEspacios);
              }}
              ref={passwordInputRef}
              onKeyDown={(e) => handleKeyDown(e, handleLogin)}
            />

            {password.length > 0 && (
              <span
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword
                  ? <AiOutlineEyeInvisible size={20} />
                  : <AiOutlineEye size={20} />
                }
              </span>
            )}
          </div>

          {errorPassword && (
            <div className="login-error-msg">
              {errorPassword}
            </div>
          )}
        </div>

        {/* Error general */}
        {errorGeneral && (
          <div className="login-error-general">
            {errorGeneral}
          </div>
        )}

        {/* Olvidar contraseña */}
        <h2 className="login-campo">
          <Link to="/ChangePassword" className="login-olvidaste">
            ¿Olvidaste tu contraseña?
          </Link>
        </h2>

        {/* Botón */}
        <button
          type="button"
          className="login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? <span className="spinner"></span> : "INICIAR"}
        </button>

      </div>
    </div>
  );
}

export default Login;