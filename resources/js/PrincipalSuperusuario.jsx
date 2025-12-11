import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/Principal.css";
import { useNavigate } from "react-router-dom";
import { 
  FaHome, FaUsers, FaBuilding, FaWallet, FaTree, 
  FaCog, FaGavel, FaHandsHelping, FaWater, FaFileAlt,
  FaChevronDown, FaChevronUp, FaUser
} from "react-icons/fa";
import { slugify } from "./utils/slugify";

// -------------------- FUNCIONES AUXILIARES DE SESIÓN --------------------
// Reemplazamos localStorage por sessionStorage para la lectura y escritura
const getSessionItem = (key) => sessionStorage.getItem(key);
const setSessionItem = (key, value) => sessionStorage.setItem(key, value);
const removeSessionItem = (key) => sessionStorage.removeItem(key);

export default function PrincipalSuperusuario() {
  const [areas, setAreas] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const navigate = useNavigate();
  
  // Lectura del token de autenticación (Cambiado de localStorage a sessionStorage)
  const token = getSessionItem("jwt_token"); 
  
  // OBTENER URL DESDE .env
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    // OBTENER DATOS CON LOS NOMBRES CORRECTOS DE sessionStorage
    const storedUsuario = getSessionItem("usuario");
    
    if (storedUsuario) {
      try {
        const usuarioData = JSON.parse(storedUsuario);
        // Construir el nombre completo
        const fullName = `${usuarioData.nombre} ${usuarioData.a_paterno} ${usuarioData.a_materno || ''}`.trim();
        setUserName(fullName);
        
        console.log("✅ Usuario encontrado:", fullName);
      } catch (error) {
        console.error("Error al parsear datos de usuario:", error);
        setUserName("Usuario del Sistema");
      }
    } else {
      // Si no hay datos, usar el rol para determinar el nombre
      const userRole = getSessionItem("rol"); // Leer rol de sessionStorage
      const roleNames = {
        'Administrador': 'Administrador del Sistema',
        'Superusuario': 'Superusuario Municipal', 
      };
      setUserName(roleNames[userRole] || 'Usuario del Sistema');
    }

    // Obtener departamentos
    const fetchDepartamentos = async () => {
      try {
        // USAR API_URL DESDE .env
        const res = await fetch(`${API_URL}/api/departamentos`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.status === 401) {
          // Limpieza total usando sessionStorage
          removeSessionItem("jwt_token");
          removeSessionItem("rol");
          removeSessionItem("usuario");
          navigate("/", { replace: true });
          return;
        }

        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();

        const mappedAreas = data.map(area => ({
          ...area,
          icon: getAreaIcon(area.id),
          departamentos: area.departamentos || []
        }));

        setAreas(mappedAreas);
      } catch (err) {
        console.error("Error al obtener departamentos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartamentos();
  }, [navigate, token, API_URL]); 

  const handleSelect = (depId, depNombre) => {
    const departamentoSlug = slugify(depNombre);
    // Persistencia del departamento en sessionStorage
    setSessionItem("last_depId", depId);
    setSessionItem("last_depNombre", depNombre);
    setSessionItem("last_depSlug", departamentoSlug);
    
    navigate(`/proyectosenproceso/${departamentoSlug}`, { 
      state: { nombre: depNombre, depId } 
    });
    setOpenDropdown(null);
  };

  const getAreaIcon = (id) => {
    const iconMap = {
      1: <FaHome />,
      2: <FaUsers />,
      3: <FaBuilding />,
      4: <FaWallet />,
      5: <FaTree />,
      6: <FaCog />,
      7: <FaGavel />,
      8: <FaHandsHelping />,
      9: <FaBuilding />,
      10: <FaWater />
    };
    return iconMap[id] || <FaFileAlt />;
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-logo">
          <img src={logo3} alt="Cargando" />
        </div>
        {/* TEXTO DEL LOADER EN MAYÚSCULAS */}
        <div className="loader-texto">CARGANDO DEPARTAMENTOS...</div>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  return (
    <Layout 
      titulo="Sistema de gestión de departamentos" 
      sidebar={<MenuDinamico tipo="principal" />}
    >
      <div className="departamentos-app">
        {/* CONTENEDOR DEL SALUDO Y NOMBRE DEL USUARIO */}
        <div className="user-header-container">
          <div className="user-greeting">
            <FaUser className="user-icon" />
            <h1>¡HOLA!</h1>
            {/* Nombre del usuario en MAYÚSCULAS */}
            <div className="user-name">{userName.toUpperCase()}</div>
          </div>
        </div>
        
        <div className="areas-hero">
          <p className="areas-subtitle">
            SELECCIONA UN DEPARTAMENTO PARA GESTIONAR SUS PROYECTOS
          </p>
        </div>
        
        <div className="areas-grid-container">
          <div className="areas-grid-departamentos">
            {areas.map((area, index) => (
              <div 
                key={area.id} 
                className={`area-card ${openDropdown === area.id ? 'active' : ''} ${
                  index % 2 === 0 ? 'card-left' : 'card-right'
                }`}
              >
                <button
                  className="area-card-btn"
                  onClick={() => setOpenDropdown(openDropdown === area.id ? null : area.id)}
                >
                  <div className="area-card-header">
                    <div className="area-icon-container">
                      {area.icon}
                    </div>
                    <div className="area-text-content">
                      {/* Nombre del área en MAYÚSCULAS */}
                      <h3 className="area-name">{area.nombre.toUpperCase()}</h3>
                      <span className="area-department-count">
                        {area.departamentos.length} {area.departamentos.length === 1 ? 'DEPTO' : 'DEPTOS'}
                      </span>
                    </div>
                  </div>
                  <div className="area-chevron">
                    {openDropdown === area.id ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </button>
                
                {openDropdown === area.id && area.departamentos.length > 0 && (
                  <div className="departments-dropdown">
                    <div className="departments-grid">
                      {area.departamentos.map((dep) => (
                        <div
                          key={dep.id_departamento}
                          className="department-item"
                          onClick={() => handleSelect(dep.id_departamento, dep.d_nombre)}
                        >
                          {/* Nombre del departamento en MAYÚSCULAS */}
                          <span className="department-name">{dep.d_nombre.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}