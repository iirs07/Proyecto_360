import React, { useState, useEffect, useCallback } from 'react'
import Layout from "../components/Layout"
import MenuDinamico from "../components/MenuDinamico"
import EmptyState from "../components/EmptyState"
import { useRolNavigation } from "./utils/navigation"
import { useNavigate } from "react-router-dom"
import { 
    FaBuilding, 
    FaFolder, 
    FaSearch, 
    FaEdit, 
    FaArrowLeft,
    FaChevronRight,
    FaSpinner,
    FaSave,
    FaDatabase,
    FaSitemap,
    FaCity
} from "react-icons/fa"
import logo3 from "../imagenes/logo3.png"
import '../css/ModificarDepartamento.css'
import '../css/global.css'

function ModificarDepartamento() {

    /* ---------------------------------------------
        TUS ESTADOS
    ----------------------------------------------*/
    const { volverSegunRol } = useRolNavigation()
    const navigate = useNavigate()
    const API_URL = import.meta.env.VITE_API_URL

    const [modo, setModo] = useState('seleccionar')
    const [estructura, setEstructura] = useState([])
    const [loading, setLoading] = useState(true)
    const [formLoading, setFormLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [selectedEntity, setSelectedEntity] = useState(null)
    const [nuevoNombre, setNuevoNombre] = useState('')
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [openArea, setOpenArea] = useState(null)


    /* ---------------------------------------------
        FUNCIONES DE UTILIDAD
    ----------------------------------------------*/
    const resetMessages = () => {
        setMessage({ type: '', text: '' })
        setError('')
    }

    const resetSelection = () => {
        setSelectedEntity(null)
        setNuevoNombre('')
        setSearchTerm('')
        setModo(openArea ? 'departamentos' : 'seleccionar')
        resetMessages()
    }

    const navigateToAreaDepartments = (area) => {
        setOpenArea(area)
        setModo('departamentos')
        setSearchTerm('')
        resetMessages()
    }

    const navigateToMainSelection = () => {
        setOpenArea(null)
        setModo('seleccionar')
        setSearchTerm('')
        resetMessages()
    }

    const handleErrorResponse = (data, context) => {
        let defaultError = `Error al modificar el ${context}.`
        let finalError = defaultError

        if (data.errors) {
            const key = context === 'área' ? 'nombre' : 'd_nombre'
            if (data.errors[key] && data.errors[key].length > 0) {
                let errorMessage = data.errors[key][0].toLowerCase()
                
                // Traducir mensajes del inglés al español
                if (errorMessage.includes('already') || errorMessage.includes('taken')) {
                    finalError = `El nombre del ${context} ya está en uso.`
                } else if (errorMessage.includes('required')) {
                    finalError = `El nombre del ${context} es obligatorio.`
                } else if (errorMessage.includes('greater than')) {
                    finalError = `El nombre del ${context} no puede tener más de 255 caracteres.`
                } else {
                    finalError = data.errors[key][0]
                }
            }
        } else if (data.mensaje) {
            finalError = data.mensaje
        }
        
        setError(' ' + finalError)
    }


    /* ---------------------------------------------
        CARGA DE DATOS
    ----------------------------------------------*/
    const cargarEstructura = useCallback(async (shouldSetLoading = true) => {
        const token = localStorage.getItem("jwt_token")
        if (!token) {
            navigate("/", { replace: true })
            return
        }

        try {
            if (shouldSetLoading) setLoading(true)
            resetMessages()

            const response = await fetch(`${API_URL}/api/departamentos/areas-con-departamentos`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            })

            if (response.status === 401) {
                localStorage.removeItem("jwt_token")
                localStorage.removeItem("rol")
                localStorage.removeItem("usuario")
                navigate("/", { replace: true })
                return
            }

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.mensaje || 'Error al cargar estructura')
            }

            setEstructura(data.data || [])

            if (openArea) {
                const updatedArea = (data.data || []).find(a => a.id === openArea.id)
                if (updatedArea) {
                    setOpenArea(updatedArea)
                } else {
                    navigateToMainSelection()
                }
            }

        } catch (error) {
            console.error('Error al cargar estructura:', error)
            setMessage({
                type: 'error',
                text: 'No se pudo cargar la estructura de áreas y departamentos.'
            })
        } finally {
            if (shouldSetLoading) setLoading(false)
        }
    }, [navigate, API_URL, openArea])

    useEffect(() => {
        cargarEstructura()
    }, [navigate])


    /* ---------------------------------------------
        SELECCIONAR ENTIDAD
    ----------------------------------------------*/
    const handleSelectEntity = (entity, type) => {
        let entityWithAreaId = { ...entity, type }

        if (type === 'departamento') {
            if (entity.area_id) entityWithAreaId.area_id = entity.area_id
            else if (openArea) entityWithAreaId.area_id = openArea.id
            else if (entity.id_area) entityWithAreaId.area_id = entity.id_area
        }

        setSelectedEntity(entityWithAreaId)
        setNuevoNombre(entity.nombre || entity.d_nombre || '')
        setModo(type === 'area' ? 'modificar_area' : 'modificar_departamento')
        resetMessages()
    }


    /* ---------------------------------------------
        SUBMIT FORM
    ----------------------------------------------*/
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!nuevoNombre.trim()) {
            setError('El nuevo nombre no puede estar vacío.')
            return
        }

        const currentName = selectedEntity.type === 'area'
            ? selectedEntity.nombre
            : selectedEntity.d_nombre

        if (currentName === nuevoNombre) {
            setError('El nuevo nombre es igual al actual.')
            return
        }

        const token = localStorage.getItem("jwt_token")
        if (!token) {
            navigate("/", { replace: true })
            return
        }

        setFormLoading(true)
        resetMessages()

        const isArea = selectedEntity.type === 'area'
        const url = isArea
            ? `${API_URL}/api/departamentos/areas/crear`
            : `${API_URL}/api/departamentos/gestion`

        const entityId = selectedEntity.id_departamento || selectedEntity.id

        let areaIdForDepartamento = selectedEntity.area_id
        if (!areaIdForDepartamento && openArea) areaIdForDepartamento = openArea.id
        if (!areaIdForDepartamento) areaIdForDepartamento = 1

        const body = isArea
            ? { id: entityId, nombre: nuevoNombre, accion: 'actualizar' }
            : { id: entityId, d_nombre: nuevoNombre, area_id: areaIdForDepartamento, accion: 'actualizar' }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            })

            let data
            try {
                data = await response.json()
            } catch {
                throw new Error('Error de respuesta del servidor')
            }

            if (!response.ok || !data.success) {
                handleErrorResponse(data, isArea ? 'área' : 'departamento')
                return
            }

            setMessage({
                type: 'success',
                text: `${isArea ? 'Área' : 'Departamento'} modificado con éxito.`
            })

            await new Promise(resolve => setTimeout(resolve, 1500))

            await cargarEstructura(false)
            resetSelection()

        } catch (fetchError) {
            console.error('Error en fetch:', fetchError)
            setError('Error al conectar con el servidor.')
        } finally {
            setFormLoading(false)
        }
    }


    /* ---------------------------------------------
        FILTRADOS
    ----------------------------------------------*/
    const filteredAreas = estructura.filter(area =>
        area.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredDepartments = openArea
        ? (openArea.departamentos || []).filter(dep =>
            dep.d_nombre.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : []


    /* ---------------------------------------------
        RENDERS (LISTAS, FORMULARIOS, ETC.)
    ----------------------------------------------*/

    const renderLoadingState = () => (
        <div className="loader-container">
            <div className="loader-logo">
                <img src={logo3} alt="Cargando" />
            </div>
            <div className="loader-texto">CARGANDO. . .</div>
            <div className="loader-spinner"></div>
        </div>
    )


    /* ---------------------------------------------
        FORMULARIO DE MODIFICACIÓN
    ----------------------------------------------*/
    const renderModificationForm = () => {
        if (!selectedEntity) return null

        const isArea = selectedEntity.type === 'area'
        const entityName = isArea ? 'Área' : 'Departamento'
        const currentName = isArea ? selectedEntity.nombre : selectedEntity.d_nombre
        const EntityIcon = isArea ? FaFolder : FaBuilding

        return (
            <div className="modep-form-card modep-hover-lift">

                <div className="modep-form-header">
                    <h2 className="modep-form-title">
                        <FaEdit className="modep-title-icon" />
                        Modificar {entityName}
                    </h2>

                    <p className="modep-current-name">
                        <EntityIcon className="modep-current-icon" />
                        Actual: <span className="modep-current-value">{currentName}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="modep-form">

                    {error && (
                        <div className="modep-message modep-message-error">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="modep-form-group">
                        <label className="modep-form-label">
                            Nuevo Nombre del {entityName}
                        </label>

                        <input
                            type="text"
                            value={nuevoNombre}
                            onChange={(e) => {
                                setNuevoNombre(e.target.value)
                                setError('')
                            }}
                            className="modep-form-input"
                            disabled={formLoading}
                        />

                        <small className="modep-form-hints">
                            {isArea
                                ? 'El nombre del área debe ser único.'
                                : 'El nombre del departamento debe ser único dentro del sistema.'}
                        </small>

                        {currentName === nuevoNombre && (
                            <p className="modep-warning">El nombre es igual al actual</p>
                        )}
                    </div>

                    <div className="modep-form-actions">

                        <button
                            type="button"
                            onClick={resetSelection}
                            className="modep-btn-secondary modep-btn-with-icon"
                            disabled={formLoading}
                        >
                            <FaArrowLeft />
                            <span>Cancelar y Volver</span>
                        </button>

                        <button
                            type="submit"
                            disabled={formLoading || currentName === nuevoNombre}
                            className="modep-btn-primary modep-btn-with-icon modep-btn-save"
                        >
                            {formLoading ? (
                                <>
                                    <FaSpinner className="modep-spinner-icon" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <FaSave />
                                    <span>Guardar Cambios</span>
                                </>
                            )}
                        </button>

                    </div>
                </form>
            </div>
        )
    }


    /* ---------------------------------------------
        LISTA DE DEPARTAMENTOS
    ----------------------------------------------*/
    const renderDepartmentList = () => {
        if (!openArea) return null

        return (
            <div className="modep-form-card modep-hover-lift">

                <div className="modep-card-header">
                    <h2 className="modep-form-title">
                        <FaFolder className="modep-title-icon" />
                        Área: {openArea.nombre}
                    </h2>

                    <button
                        onClick={() => handleSelectEntity(openArea, 'area')}
                        className="modep-btn-secondary modep-btn-with-icon"
                    >
                        <FaEdit />
                        <span>Modificar Área</span>
                    </button>
                </div>

                {/* BUSCADOR */}
                <div className="modep-form-group modep-search-group">
                    <div className="modep-input-with-icon">
                        <FaSearch className="modep-input-icon" />
                        <input
                            type="text"
                            placeholder={`Buscar departamento...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="modep-form-input"
                        />
                    </div>
                </div>

                {filteredDepartments.length === 0 ? (
                    <div className="modep-empty-state">
                        <FaCity className="modep-empty-icon" />
                        <h3 className="modep-empty-title">
                            {searchTerm ? "SIN COINCIDENCIAS" : "SIN DEPARTAMENTOS"}
                        </h3>
                    </div>
                ) : (
                    <div className="modep-list-container">

                        <div className="modep-list-header">
                            <FaDatabase />
                            <span>Total: {filteredDepartments.length}</span>
                        </div>

                        <div className="modep-list-content">

                            {filteredDepartments.map(dep => (
                                <div key={dep.id} className="modep-list-item">

                                    <div className="modep-item-content">
                                        <FaBuilding className="modep-item-icon" />
                                        <span>{dep.d_nombre}</span>
                                    </div>

                                    <button
                                        onClick={() => handleSelectEntity(dep, 'departamento')}
                                        className="modep-btn-primary modep-btn-sm"
                                    >
                                        <FaEdit />
                                        <span>Modificar</span>
                                    </button>

                                </div>
                            ))}

                        </div>
                    </div>
                )}

                <div className="modep-footer-actions">
                    <button
                        onClick={navigateToMainSelection}
                        className="modep-btn-secondary modep-btn-with-icon"
                    >
                        <FaArrowLeft />
                        <span>Volver a Áreas</span>
                    </button>
                </div>
            </div>
        )
    }


    /* ---------------------------------------------
        LISTA DE ÁREAS
    ----------------------------------------------*/
    const renderSelectionMode = () => (
        <div className="modep-form-card modep-hover-lift">

            <h2 className="modep-form-title">
                Seleccionar Área
            </h2>

            {/* BUSCADOR */}
            <div className="modep-form-group modep-search-group">
                <div className="modep-input-with-icon">
                    <FaSearch className="modep-input-icon" />
                    <input
                        type="text"
                        placeholder="Buscar área..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="modep-form-input"
                        disabled={loading || estructura.length === 0}
                    />
                </div>
            </div>

            {/* --- LISTA / VACÍO --- */}
            {estructura.length === 0 ? (
                <div className="modep-empty-state">
                    <FaDatabase className="modep-empty-icon" />
                    <h3 className="modep-empty-title">SIN REGISTROS</h3>
                    <p className="modep-empty-message">No hay áreas registradas.</p>
                </div>
            ) : filteredAreas.length === 0 ? (
                <div className="modep-empty-state">
                    <FaSearch className="modep-empty-icon" />
                    <h3 className="modep-empty-title">SIN COINCIDENCIAS</h3>
                    <p className="modep-empty-message">
                        {`No se encontraron áreas para "${searchTerm}"`}
                    </p>
                </div>
            ) : (
                <div className="modep-list-container">
                    {filteredAreas.map(area => (
                        <div key={area.id} className="modep-area-card">
                            <div className="modep-area-content">

                                <div className="modep-area-header">
                                    <FaFolder className="modep-area-icon" />
                                    <span className="modep-area-title">{area.nombre}</span>
                                </div>

                                <div className="modep-area-subtitle">
                                    {area.departamentos?.length || 0} departamento
                                </div>

                            </div>

                            <button
                                onClick={() => navigateToAreaDepartments(area)}
                                className="modep-btn-primary modep-btn-with-icon"
                            >
                                <span>Ver Departamentos</span>
                                <FaChevronRight />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )


    /* ---------------------------------------------
        RETURN FINAL COMPLETO
    ----------------------------------------------*/
    if (loading) {
        return (
            <Layout
                titulo="MODIFICAR DEPARTAMENTO/ÁREA"
                sidebar={<MenuDinamico activeRoute="gestion_estructura" />}
            >
                {renderLoadingState()}
            </Layout>
        )
    }

    let content

    if (modo === 'seleccionar') {
        content = renderSelectionMode()
    } 
    else if (modo === 'departamentos') {
        content = renderDepartmentList()
    } 
    else if (modo === 'modificar_area' || modo === 'modificar_departamento') {
        content = renderModificationForm()
    }

    return (
        <Layout
            titulo="MODIFICAR DEPARTAMENTO / ÁREA"
            sidebar={<MenuDinamico activeRoute="gestion_estructura" />}
        >
            <div className="modep-container">
                {content}
            </div>
        </Layout>
    )
}

export default ModificarDepartamento