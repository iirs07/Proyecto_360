import React, { useEffect, useState } from "react";

export default function ListaDepartamento() {
    const [departamentos, setDepartamentos] = useState([]);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        cargarDepartamentos();
    }, []);

    const cargarDepartamentos = () => {
        fetch("http://127.0.0.1:8000/api/departamentos/listar")
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
