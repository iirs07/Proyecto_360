import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute'; 
// Componentes Públicos
import Login from './Login';
import ChangePassword from './ChangePassword';
import RegistroPaso2 from './RegistroPaso2';
import GenerarInvitacion from './GenerarInvitacion';
import RegistroPaso1 from './RegistroPaso1';
// Componentes Protegidos
import PrincipalSuperusuario from './PrincipalSuperusuario';
import DepProProceso from "./DepProProceso";
import TareasProgreso from './TareasProgreso';
import DepProCompletados from './DepProCompletados';
import ReporteSuperUsuario from './ReporteSuperUsuario';
{/*JEFE*/}
import GestionProyectosUsuario from "./GestionProyectosUsuario";
import ListaDeProyectos from './ListaDeProyectos';
import TareasAsignadas from './TareasAsignadas';
import ReportesTareasCompletadas from "./ReportesTareasCompletadas";
{/*DIRECTOR*/}
import GestionProyectos from "./GestionProyectos";
import NuevoProyecto from './NuevoProyecto';
import AgregarTareas from './AgregarTareas';
import ListaProyectos from "./ListaProyectos";
import ListaDeTareas from './ListaDeTareas';
import ModificarProyecto from './ModificarProyecto';
import ProyectosPorModificar from './ProyectosPorModificar';
import DesbloquearProyectos from "./DesbloquearProyectos";
import EliminarProyectos from "./EliminarProyectos";
import TareasenProceso from "./TareasenProceso";
import TareasPendientes from "./TareasPendientes";
import VerTareasPendientes from "./VerTareasPendientes";
import TareasCompletadasDepartamento from "./TareasCompletadasDepartamento";
import AgregarT from "./AgregarT";
import ModificarTareas from "./ModificarTareas";
import EliminarTareas from "./EliminarTareas";
import EditarTareas from "./EditarTareas";
import Reporte from "./Reporte";

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
          <Route path="/PrincipalSuperusuario" element={<PrincipalSuperusuario />} />
          <Route path="/ReporteSuperUsuario" element={<ReporteSuperUsuario />} />

          {/* Vistas de Proyectos y Tareas */}
          <Route path="/proyectosenproceso/:depNombreSlug" element={<DepProProceso />} />
          <Route path="/proyectoscompletados/:depNombreSlug" element={<DepProCompletados />} />
          <Route path="/proyecto/:depProyectoSlug" element={<TareasProgreso />} />

         {/* INTERFACES PARA EL ROL DE UN JEFE*/}
          <Route path="/GestionProyectosUsuario" element={<GestionProyectosUsuario />} />
          <Route path="/ListaDeProyectos" element={<ListaDeProyectos />} />
          <Route path="/TareasAsignadas" element={<TareasAsignadas />} />
          <Route path="/ReportesTareasCompletadas" element={<ReportesTareasCompletadas />} />
          {/*DIRECTOR*/}
           <Route path="/GestionProyectos" element={<GestionProyectos />} />
           <Route path="/NuevoProyecto" element={<NuevoProyecto />} />
           <Route path="/AgregarTareas" element={<AgregarTareas />} />
           <Route path="/ListaProyectos" element={<ListaProyectos />} />
           <Route path="/ListaDeTareas" element={<ListaDeTareas />} />
           <Route path="/ModificarProyecto" element={<ModificarProyecto />} />
           <Route path="/ProyectosPorModificar" element={<ProyectosPorModificar />} />
           <Route path="/DesbloquearProyectos" element={<DesbloquearProyectos />} />
           <Route path="/EliminarProyectos" element={<EliminarProyectos />} />
           <Route path="/TareasenProceso" element={<TareasenProceso />} />
           <Route path="/TareasPendientes" element={<TareasPendientes />} />
           <Route path="/VerTareasPendientes" element={<VerTareasPendientes />} />
           <Route path="/TareasCompletadasDepartamento" element={<TareasCompletadasDepartamento />} />
           <Route path="/AgregarT" element={<AgregarT />} />
           <Route path="/ModificarTareas" element={<ModificarTareas />} />
           <Route path="/EliminarTareas" element={<EliminarTareas />} />
           <Route path="/EditarTareas" element={<EditarTareas />} />
           <Route path="/Reporte" element={<Reporte />} />

        </Route>

        {/* Opcional: Ruta para manejar URLs no encontradas (404) */}
        {/* <Route path="*" element={<h1>404 | Página no encontrada</h1>} /> */}

      </Routes>
    </Router>
  );
}

export default App;
