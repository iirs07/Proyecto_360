import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute'; // Importa tu componente de protección
// Componentes Públicos
import Login from './Login';
import ChangePassword from './ChangePassword';
import RegistroPaso2 from './RegistroPaso2';
import GenerarInvitacion from './GenerarInvitacion';
import RegistroPaso1 from './RegistroPaso1';
// Componentes Protegidos
import Principal from './Principal';
import DepProProceso from "./DepProProceso";
import TareasProgreso from './TareasProgreso';
import DepProCompletados from './DepProCompletados';
import ReporteSuperUsuario from './ReporteSuperUsuario';

function App() {
  return (
    <Router>
      <Routes>
        
        {/* =======================================================
           1. RUTAS PÚBLICAS (Accesibles sin Token) 
        ======================================================= */}
        <Route path="/" element={<Login />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/ChangePassword" element={<ChangePassword />} />
        <Route path="/RegistroPaso2" element={<RegistroPaso2 />} />
        <Route path="/GenerarInvitacion" element={<GenerarInvitacion />} />
        <Route path="/RegistroPaso1/:token" element={<RegistroPaso1 />} />


        {/* =======================================================
           2. RUTAS PROTEGIDAS (Requieren Token)
           - Usamos ProtectedRoute como elemento padre.
           - El componente anidado se renderiza en <Outlet />.
        ======================================================= */}
        <Route element={<ProtectedRoute />}>
          
          {/* Dashboard y Reportes */}
          <Route path="/Principal" element={<Principal />} />
          <Route path="/ReporteSuperUsuario" element={<ReporteSuperUsuario />} />

          {/* Vistas de Proyectos y Tareas */}
          <Route path="/proyectosenproceso/:depNombreSlug" element={<DepProProceso />} />
          <Route path="/proyectoscompletados/:depNombreSlug" element={<DepProCompletados />} />
          <Route path="/proyecto/:depProyectoSlug" element={<TareasProgreso />} />

        </Route>

        {/* Opcional: Ruta para manejar URLs no encontradas (404) */}
        {/* <Route path="*" element={<h1>404 | Página no encontrada</h1>} /> */}

      </Routes>
    </Router>
  );
}

export default App;
