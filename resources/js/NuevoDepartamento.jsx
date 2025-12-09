import React, { useState, useEffect } from 'react'
import Layout from "../components/Layout"
import MenuDinamico from "../components/MenuDinamico" 
import EmptyState from "../components/EmptyState" 
import { useRolNavigation } from "./utils/navigation" 
import { useNavigate } from "react-router-dom"
import logo3 from "../imagenes/logo3.png"

import '../css/NuevoDepartamento.css'
import '../css/global.css'

function NuevoDepartamento() {
    const { volverSegunRol } = useRolNavigation()
    const navigate = useNavigate()
    
    const API_URL = import.meta.env.VITE_API_URL

    const [modo, setModo] = useState('departamento')
    const [areas, setAreas] = useState([])
    const [loading, setLoading] = useState(true)
    const [formLoading, setFormLoading] = useState(false)
    
    const [errors, setErrors] = useState({
        d_nombre: '',
        area_id: '',
        nombre_area: ''
    })
    const [success, setSuccess] = useState({
        d_nombre: '',
        area_id: '',
        nombre_area: ''
    })

    const [selectOpen, setSelectOpen] = useState(false)
    
    const [formDepartamento, setFormDepartamento] = useState({
        d_nombre: '',
        area_id: ''
    })
    
    const [formArea, setFormArea] = useState({
        nombre: ''
    })

    const resetForms = () => {
        setFormDepartamento({ d_nombre: '', area_id: '' })
        setFormArea({ nombre: '' })
        setErrors({ d_nombre: '', area_id: '', nombre_area: '' })
        setSuccess({ d_nombre: '', area_id: '', nombre_area: '' })
        setSelectOpen(false)
    }
    
    const resetError = (field) => setErrors(prev => ({ ...prev, [field]: '' }))
    const resetSuccess = (field) => setSuccess(prev => ({ ...prev, [field]: '' }))

    const vaciarFormulario = () => {
        resetForms()
        if (modo === 'departamento') {
            setFormDepartamento({ d_nombre: '', area_id: '' })
        } else {
            setFormArea({ nombre: '' })
        }
    }

    useEffect(() => { cargarAreas() }, [navigate, API_URL])

    const cargarAreas = async () => {
        const token = localStorage.getItem("jwt_token")
        if (!token) { navigate("/", { replace: true }); return }
        try {
            setLoading(true)
            const response = await fetch(`${API_URL}/api/departamentos/areas`, { 
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } 
            }) 
            if (response.status === 401) {
                localStorage.removeItem("jwt_token")
                localStorage.removeItem("rol")
                localStorage.removeItem("usuario")
                navigate("/", { replace: true })
                return
            }
            const data = await response.json()
            if (!response.ok || !data.success) throw new Error(data.mensaje || 'Error al cargar áreas')
            setAreas(data.data || []) 
        } catch (error) {
            console.error('Error al cargar áreas:', error)
        } finally { setLoading(false) }
    }

    const handleChangeDepartamento = (e) => {
        const { name, value } = e.target
        setFormDepartamento(prev => ({ ...prev, [name]: value }))
        resetError(name)
        resetSuccess(name)
    }
    const handleChangeArea = (e) => {
        const { name, value } = e.target
        setFormArea(prev => ({ ...prev, [name]: value }))
        resetError('nombre_area')
        resetSuccess('nombre_area')
    }
    const handleSelectBlur = () => setTimeout(() => setSelectOpen(false), 200)

    const crearDepartamento = async (e) => {
        e.preventDefault()
        const token = localStorage.getItem("jwt_token")
        
        let hasErrors = false
        const newErrors = { d_nombre: '', area_id: '', nombre_area: '' }
        
        if (!formDepartamento.d_nombre.trim()) { 
            newErrors.d_nombre = 'El nombre del departamento es obligatorio'; 
            hasErrors = true 
        }
        if (!formDepartamento.area_id) { 
            newErrors.area_id = 'Debe seleccionar un área'; 
            hasErrors = true 
        }
        
        if (hasErrors) { 
            setErrors(newErrors); 
            return 
        }
        
        if (!token) { navigate("/", { replace: true }); return }

        setFormLoading(true)
        setErrors({ d_nombre: '', area_id: '', nombre_area: '' })
        setSuccess({ d_nombre: '', area_id: '', nombre_area: '' })

        try {
            const response = await fetch(`${API_URL}/api/departamentos/gestion`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Accept': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ ...formDepartamento, accion: 'crear' })
            })
            
            let data;
            try { data = await response.json() } catch { return }

            if (!response.ok || !data.success) {
                if (data.errors) {
                    const errorsObj = data.errors
                    const newErrors = { d_nombre: '', area_id: '', nombre_area: '' }
                    
                    if (errorsObj.d_nombre && errorsObj.d_nombre.length > 0) {
                        const errorMsg = errorsObj.d_nombre[0].toLowerCase()
                        newErrors.d_nombre = errorMsg.includes('already') || errorMsg.includes('taken') || errorMsg.includes('existe') ? 
                            'Ya existe un departamento con este nombre' : 'Error en el nombre del departamento'
                    }
                    
                    if (errorsObj.area_id && errorsObj.area_id.length > 0) {
                        newErrors.area_id = 'Debe seleccionar un área válida'
                    }
                    
                    setErrors(newErrors)
                }
                return
            }

            setSuccess({ d_nombre: '', area_id: '', nombre_area: 'Departamento creado con éxito' })
            resetForms()
            cargarAreas()
        } catch (error) {
            console.error('Error al crear departamento:', error)
        } finally {
            setFormLoading(false)
        }
    }

    const crearArea = async (e) => {
        e.preventDefault()
        const token = localStorage.getItem("jwt_token")
        
        if (!formArea.nombre.trim()) { 
            setErrors({ d_nombre: '', area_id: '', nombre_area: 'El nombre del área es obligatorio' })
            return 
        }
        
        if (!token) { navigate("/", { replace: true }); return }

        setFormLoading(true)
        setErrors({ d_nombre: '', area_id: '', nombre_area: '' })
        setSuccess({ d_nombre: '', area_id: '', nombre_area: '' })

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            const response = await fetch(`${API_URL}/api/departamentos/areas/crear`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Accept': 'application/json', 
                    'X-CSRF-TOKEN': csrfToken, 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(formArea)
            })
            
            let data;
            try { data = await response.json() } catch { return }

            if (!response.ok || !data.success) {
                if (data.errors && data.errors.nombre && data.errors.nombre.length > 0) {
                    const errorMsg = data.errors.nombre[0].toLowerCase()
                    setErrors({ 
                        d_nombre: '', 
                        area_id: '', 
                        nombre_area: errorMsg.includes('already') || errorMsg.includes('taken') || errorMsg.includes('existe') ? 
                            'Ya existe un área con este nombre' : 'Error en el nombre del área' 
                    })
                }
                return
            }

            setSuccess({ d_nombre: '', area_id: '', nombre_area: 'Área creada con éxito' })
            resetForms()
            cargarAreas()
            setModo('departamento')

            if (data.area?.id) {
                setFormDepartamento(prev => ({ ...prev, area_id: data.area.id.toString() }))
            }
        } catch (error) {
            console.error('Error al crear área:', error)
        } finally { 
            setFormLoading(false) 
        }
    }

    if (loading) {
        return (
          <div className="loader-container">
            <div className="loader-logo">
              <img src={logo3} alt="Cargando" />
            </div>
            <div className="loader-texto">CARGANDO . . .</div> 
            <div className="loader-spinner"></div>
          </div>
        );
    }

    return (
        <Layout titulo="GESTIÓN DE DEPARTAMENTOS Y ÁREAS" sidebar={<MenuDinamico activeRoute="gestion_estructura" />}>
            <div className="newdep-container newdep-layout">
                <div className="newdep-max-w newdep-py-12">

                    {/* Selector de modo */}
                    <div className="newdep-mode-selector newdep-mt-10">
                        <div className="newdep-flex">
                            <button 
                                onClick={()=>{setModo('departamento'); resetForms()}} 
                                className={`newdep-mode-tab newdep-flex-1 ${modo==='departamento'?'newdep-active':''}`}
                            >
                                Crear Departamento
                            </button>
                            <button 
                                onClick={()=>{setModo('area'); resetForms()}} 
                                className={`newdep-mode-tab newdep-flex-1 ${modo==='area'?'newdep-active':''}`}
                            >
                                Crear Nueva Área
                            </button>
                        </div>
                    </div>

                    {/* MODO DEPARTAMENTO */}
                    {modo === 'departamento' && (
                        <div className="newdep-form-card newdep-hover-lift">
                            <h2 className="newdep-form-title">Nuevo Departamento</h2>
                            {areas.length === 0 ? (
                                <EmptyState 
                                    titulo="ÁREAS FALTANTES" 
                                    mensaje="No hay áreas registradas, crea una primero para asignar este departamento" 
                                    botonTexto="Crear Nueva Área" 
                                    onVolver={()=>setModo('area')} 
                                    icono="🏢" 
                                />
                            ) : (
                                <form onSubmit={crearDepartamento} className="newdep-space-y-6">
                                    <div className="newdep-form-group">
                                        <label className="newdep-form-label" htmlFor="d_nombre">
                                            Nombre del Departamento
                                        </label>
                                        <input
                                            id="d_nombre"
                                            type="text"
                                            name="d_nombre"
                                            value={formDepartamento.d_nombre}
                                            onChange={handleChangeDepartamento}
                                            className={`newdep-form-input ${errors.d_nombre ? 'newdep-error-input' : ''} ${success.nombre_area ? 'newdep-success-input' : ''}`}
                                            placeholder="Ingresa nuevo departamento"
                                            disabled={formLoading}
                                        />
                                        {errors.d_nombre && <div className="newdep-error-message">{errors.d_nombre}</div>}
                                        {success.nombre_area && <div className="newdep-success-message">{success.nombre_area}</div>}
                                    </div>

                                    <div className="newdep-form-group">
                                        <label className="newdep-form-label">Área</label>
                                        <div className="newdep-dropdown-container" onBlur={handleSelectBlur} tabIndex={0}>
                                            <div 
                                                className={`newdep-dropdown-selected 
                                                    ${errors.area_id ? 'newdep-error-input' : ''} 
                                                    ${success.nombre_area ? 'newdep-success-input' : ''}
                                                    ${formDepartamento.area_id ? 'newdep-has-selection' : ''}
                                                `} 
                                                onClick={()=>setSelectOpen(!selectOpen)}
                                            >
                                                {formDepartamento.area_id ? 
                                                    areas.find(a=>a.id===parseInt(formDepartamento.area_id))?.nombre : 
                                                    "Seleccione un área"}
                                                <span className="newdep-dropdown-arrow">▼</span>
                                            </div>
                                            {selectOpen && (
                                                <div className="newdep-dropdown-options">
                                                    {areas.map(area => (
                                                        <div
                                                            key={area.id}
                                                            className="newdep-dropdown-option"
                                                            onClick={()=>{ 
                                                                setFormDepartamento(prev => ({ ...prev, area_id: area.id.toString() }))
                                                                setSelectOpen(false)
                                                                resetError("area_id")
                                                                resetSuccess("area_id")
                                                            }}
                                                        >
                                                            {area.nombre}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {errors.area_id && <div className="newdep-error-message">{errors.area_id}</div>}
                                        {success.nombre_area && <div className="newdep-success-message">{success.nombre_area}</div>}
                                    </div>

                                    <div className="newdep-flex newdep-justify-between newdep-items-center newdep-pt-6 newdep-border-t newdep-border-gray-200">
                                        <button 
                                            type="button" 
                                            onClick={vaciarFormulario}
                                            className="newdep-btn-secondary"
                                            disabled={formLoading}
                                        >
                                            Limpiar
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={formLoading} 
                                            className="newdep-btn-primary"
                                        >
                                            {formLoading ? (
                                                <>
                                                    <span className="newdep-spinner newdep-w-4 newdep-h-4 newdep-mr-2"></span>
                                                    Creando Departamento...
                                                </>
                                            ) : 'Crear Departamento'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* MODO ÁREA */}
                    {modo === 'area' && (
                        <div className="newdep-form-card newdep-hover-lift">
                            <h2 className="newdep-form-title">Nueva Área</h2>
                            <form onSubmit={crearArea} className="newdep-space-y-6">
                                <div className="newdep-form-group">
                                    <label className="newdep-form-label" htmlFor="area_nombre">
                                        Nombre del Área
                                    </label>
                                    <input 
                                        id="area_nombre" 
                                        type="text" 
                                        name="nombre" 
                                        value={formArea.nombre} 
                                        onChange={handleChangeArea} 
                                        className={`newdep-form-input ${errors.nombre_area ? 'newdep-error-input' : ''} ${success.nombre_area ? 'newdep-success-input' : ''}`} 
                                        placeholder="Ingresa nuevo área" 
                                        disabled={formLoading}
                                    />
                                    {errors.nombre_area && <div className="newdep-error-message">{errors.nombre_area}</div>}
                                    {success.nombre_area && <div className="newdep-success-message">{success.nombre_area}</div>}
                                    <p className="newdep-text-sm newdep-text-gray-500 newdep-mt-2">
                                        El nombre del área debe ser único.
                                    </p>
                                </div>

                                {/* BOTÓN A LA DERECHA */}
                                <div className="newdep-flex newdep-w-full newdep-justify-between newdep-pt-6 newdep-border-t newdep-border-gray-200">
                                    <button 
                                        type="button" 
                                        onClick={vaciarFormulario}
                                        className="newdep-btn-secondary"
                                        disabled={formLoading}
                                    >
                                        Limpiar
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={formLoading} 
                                        className="newdep-btn-primary newdep-ml-auto"
                                    >
                                        {formLoading ? (
                                            <> 
                                                <span className="newdep-spinner newdep-w-4 newdep-h-4 newdep-mr-2"></span>
                                                Creando Área...
                                            </>
                                        ) : 'Crear Área'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}

export default NuevoDepartamento