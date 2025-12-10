import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import "../css/Gestionproyectos.css"; 

function Admin() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    // Cargar la información del usuario desde sessionStorage
    const user = JSON.parse(sessionStorage.getItem("usuario"));
    setUsuario(user || null);
  }, []);

  return (
    <Layout
      titulo="PANEL DE ADMINISTRACIÓN" 
      sidebar={<MenuDinamico activeRoute="InicioAdmin" />} 
    >
      <div className="tdu-contenido">
        
        {/* === Tarjeta de Bienvenida === */}
        <div className="tdu-seccion-bienvenida">
          <div className="tdu-bienvenida-content">
            <h1>¡HOLA, {usuario?.nombre || "Administrador"}!</h1>
            <p>Panel de Administrador</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Admin;