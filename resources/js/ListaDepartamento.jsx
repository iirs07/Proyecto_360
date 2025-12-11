import React, { useEffect, useState } from "react";

export default function ListaDepartamento() {
    const [departamentos, setDepartamentos] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        cargarDepartamentos();
    }, []);

    const cargarDepartamentos = () => {
        fetch(`${API_URL}/api/departamentos/listar`)
            .then(res => res.json())
            .then(data => setDepartamentos(data))
            .catch(() => setMensaje("Error al cargar departamentos"));
    };

    return (
        <div className="contenedor-ver-departamentos">
            <h2>Lista de Departamentos</h2>
            {mensaje && <p className="mensaje">{mensaje}</p>}

            <ul>
                {departamentos.map((d) => (
                    <li key={d.id_departamento}>
                        <strong>{d.d_nombre}</strong> — Área: {d.area?.nombre || "Sin asignar"}
                    </li>
                ))}
            </ul>
        </div>
    );
}
