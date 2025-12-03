import { useNavigate } from "react-router-dom";

export const useRolNavigation = () => {
  const navigate = useNavigate();

  const volverSegunRol = () => {
    const rol = sessionStorage.getItem("rol");
    switch (rol) {
      case "Jefe":
        navigate("/GestionProyectos");
        break;
      case "Usuario":
        navigate("/GestionProyectosUsuario");
        break;
      default:
        navigate("/");
    }
  };

  return { volverSegunRol };
};
