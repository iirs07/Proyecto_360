import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // 🔑 Verifica si el token existe en el almacenamiento local.
  // Esto es lo que evita que un usuario escriba la URL sin haber iniciado sesión
  // y lo que permite que el acceso funcione en otra pestaña del mismo navegador.
  const token = sessionStorage.getItem("jwt_token") 
             || localStorage.getItem("jwt_token");



  // Si el token NO existe, redirige al usuario a la página de inicio de sesión o a la principal.
  if (!token) {
    return <Navigate to="/" replace />; // O a "/login" si tienes una ruta de login dedicada
  }

  // Si el token SÍ existe, permite el acceso al componente anidado (la ruta protegida).
  // La validación real del token (si es válido o expirado) se hará en la llamada a la API
  // dentro del componente anidado (como ya lo tienes en tu fetchProyectos).
  return <Outlet />;
};

export default ProtectedRoute;