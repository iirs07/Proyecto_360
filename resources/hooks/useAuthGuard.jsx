import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const useAuthGuard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("jwt_token");
    if (!token) {
      navigate("/Login", { replace: true });
    }
  }, [navigate]);
};
