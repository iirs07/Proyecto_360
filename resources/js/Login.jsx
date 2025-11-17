import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo1 from "../imagenes/logo1.png";
import logo2 from "../imagenes/logo4.png";
import logo3 from "../imagenes/logo3.png";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import "../css/Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [domain, setDomain] = useState("gmail.com");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorUsername, setErrorUsername] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorGeneral, setErrorGeneral] = useState("");

  const navigate = useNavigate();
  const domains = ["gmail.com", "outlook.com", "hotmail.com", "minatitlan.gob.mx"];

  // 1. Crear referencia para el input de la contraseña
  const passwordInputRef = useRef(null);

  const handleLogin = async () => {
    // Es buena práctica agregar un chequeo de 'loading' aquí para evitar clics dobles, aunque el botón esté deshabilitado.
    if (loading) return;
    
    let hasError = false;
    setErrorUsername("");
    setErrorPassword("");
    setErrorGeneral("");

    // Validación usuario
if (!username) {
  setErrorUsername("❌ Ingresa usuario");
  hasError = true;
  setTimeout(() => setErrorUsername(""), 3000);
} else if (!/^[a-zA-Z0-9._]+$/.test(username)) {
  setErrorUsername("❌ Usuario no válido");
  hasError = true;
  setTimeout(() => setErrorUsername(""), 3000);
}


    // Validaciones contraseña
    if (!password) {
      setErrorPassword("❌ Ingresa contraseña");
      hasError = true;
      setTimeout(() => setErrorPassword(""), 3000);
    } else if (password.length < 8) {
      setErrorPassword("❌ Mínimo 8 caracteres");
      hasError = true;
      setTimeout(() => setErrorPassword(""), 3000);
    }

    if (hasError) return;

    const fullEmail = `${username}@${domain}`;
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ correo: fullEmail, password }),
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}

      if (!res.ok) {
        if (res.status === 404) {
          setErrorUsername(data.error || "❌ Correo no registrado");
        } else if (res.status === 401) {
          setErrorPassword(data.error || "❌ Contraseña incorrecta");
        } else {
          setErrorGeneral(data.error || "❌ Error de conexión o servidor");
        }

        setTimeout(() => {
          setErrorUsername("");
          setErrorPassword("");
          setErrorGeneral("");
        }, 3000);

        setLoading(false);
        return;
      }

      // ✅ Guardar token y rol
      localStorage.setItem("jwt_token", data.token);
      localStorage.setItem("rol", data.usuario.rol);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      setPassword("");

      // ✅ Redirigir según el rol
      const rol = data.usuario.rol;

      switch (rol) {
        case "Administrador":
          navigate("/admin"); // Página para Administrador
          break;
        case "Jefe":
          navigate("/jefe"); // Página para Jefe
          break;
        case "Superusuario":
          navigate("/Principal"); // Página para Superusuario
          break;
        case "Usuario":
          navigate("/GestionProyectosUsuario"); // Página para Usuario normal
          break;
        default:
          navigate("/"); // Página por defecto
      }

    } catch (error) {
      console.error(error);
      setErrorGeneral("❌ Error de conexión con el servidor");
      setTimeout(() => setErrorGeneral(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // 2. Manejador para la tecla Enter
  const handleKeyDown = (event, nextAction) => {
    if (event.key === "Enter") {
      event.preventDefault(); 
      
      if (typeof nextAction === 'function') {
        // Si es una función (ej: handleLogin), la ejecuta
        nextAction();
      } else if (nextAction && nextAction.current) {
        // Si es una referencia, mueve el foco
        nextAction.current.focus();
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

        <h1 className="login-title">INICIAR SESIÓN</h1>

        {/* Usuario */}
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
              // 3. Enter salta a Contraseña
              onKeyDown={(e) => handleKeyDown(e, passwordInputRef)}
            />
            <span className="login-at">@</span>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="login-select dominio-select"
              // Enter salta a Contraseña
              onKeyDown={(e) => handleKeyDown(e, passwordInputRef)}
            >
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {errorUsername && <div className="login-error-msg">{errorUsername}</div>}
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
                const valorSinEspacios = e.target.value.replace(/\s/g, '');
                setPassword(valorSinEspacios);
              }}
              ref={passwordInputRef} // 4. Asignar referencia
              // 5. Enter ejecuta handleLogin
              onKeyDown={(e) => handleKeyDown(e, handleLogin)}
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

        <h2 className="login-campo">
          <Link to="/ChangePassword" className="login-olvidaste">
            ¿Olvidaste tu contraseña?
          </Link>
        </h2>

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