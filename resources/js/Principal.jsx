import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/Principal.css";
import { useNavigate } from "react-router-dom";
import { FaHome, FaUsers, FaBuilding, FaWallet, FaTree, FaCog, FaGavel, FaHandsHelping, FaWater, FaFileAlt } from "react-icons/fa";
import { slugify } from "./utils/slugify";

export default function Principal() {
  const [areas, setAreas] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem("jwt_token"); 

  // Función para seleccionar un departamento
  const handleSelect = (depId, depNombre) => {
    const departamentoSlug = slugify(depNombre);
    localStorage.setItem("last_depId", depId);
    localStorage.setItem("last_depNombre", depNombre);
    localStorage.setItem("last_depSlug", departamentoSlug);
    navigate(`/proyectosenproceso/${departamentoSlug}`, { state: { nombre: depNombre, depId } });
    setOpenDropdown(null);
  };

  // Asignar íconos a cada área
  const getAreaIcon = (id) => {
    switch (id) {
      case 1: return <FaHome className="area-icono" />;
      case 2: return <FaUsers className="area-icono" />;
      case 3: return <FaBuilding className="area-icono" />;
      case 4: return <FaWallet className="area-icono" />;
      case 5: return <FaTree className="area-icono" />;
      case 6: return <FaCog className="area-icono" />;
      case 7: return <FaGavel className="area-icono" />;
      case 8: return <FaHandsHelping className="area-icono" />;
      case 9: return <FaBuilding className="area-icono" />;
      case 10: return <FaWater className="area-icono" />;
      default: return <FaFileAlt className="area-icono" />;
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/Login", { replace: true });
      return;
    }

    const fetchDepartamentos = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/departamentos", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("jwt_token");
          navigate("/Login", { replace: true });
          return;
        }

        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();

        const mappedAreas = data.map(area => ({
          ...area,
          icon: getAreaIcon(area.id),
        }));

        setAreas(mappedAreas);
      } catch (err) {
        console.error("Error al obtener departamentos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartamentos();
  }, [navigate, token]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-logo">
          <img src={logo3} alt="Cargando" />
        </div>
        <div className="loader-texto">CARGANDO DEPARTAMENTOS..</div>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  return (
    <Layout titulo="Gestión de Departamentos" sidebar={<MenuDinamico tipo="principal" />}>
      <div className="areas-grid-departamentos" style={{ paddingTop: "20px" }}>
        {areas.map((area) => (
          <div key={area.id} className="area-item-departamentos">
            <div
              className="dropdown-btn-departamentos"
              onClick={() => setOpenDropdown(openDropdown === area.id ? null : area.id)}
            >
              {area.icon}
              <span>{area.nombre}</span>
            </div>
            {openDropdown === area.id && (
              <div className="dropdown-options-departamentos">
                {area.departamentos.map((dep) => (
                  <div
                    key={dep.id_departamento}
                    className="option-item-departamentos"
                    onClick={() => handleSelect(dep.id_departamento, dep.d_nombre)}
                  >
                    {dep.d_nombre}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
