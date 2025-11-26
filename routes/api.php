<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\InvitacionController;
use App\Http\Controllers\RegistroPaso1Controller;
use App\Http\Controllers\RegistroPaso2Controller;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\DepartamentoController;
use App\Http\Controllers\ProyectoController;
use App\Http\Controllers\ProgresoController;
use App\Http\Controllers\TareasController;
use App\Http\Controllers\TareaController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\JefeController;
use App\Http\Controllers\NuevoProyectoController;
use App\Http\Controllers\DirectorController;
use App\Http\Controllers\TareasDirectorController;
use App\Http\Controllers\DepartamentoDirectorController;

/* 1. Rutas Públicas (Contenido sin necesidad de autenticación) */
// Invitaciones y Registro
Route::post('/login', [AuthController::class, 'login']);
Route::post('/invitaciones/crear', [InvitacionController::class, 'crear']);
Route::post('/RegistroPaso1/invitado', [RegistroPaso1Controller::class, 'validarInvitacion']);
Route::post('/RegistroPaso2/invitado', [RegistroPaso2Controller::class, 'paso2']);
Route::post('/password-reset/send-token', [PasswordResetController::class, 'sendToken']); 
Route::post('/password-reset', [PasswordResetController::class, 'reset']); 



Route::get('/departamentos', [DepartamentoController::class, 'index']);
Route::get('/login', function () { return response()->json(['error' => 'No autenticado'], 401); })->name('login');

/* 2. Rutas Protegidas por JWT (Requieren un token de acceso) */
Route::middleware(['jwt.auth'])->group(function () {
    // PROYECTOS
    Route::get('/proyectos', [ProyectoController::class, 'index']); 
    Route::get('/departamentos/{depId}/progresos', [ProgresoController::class, 'obtenerProgresosPorDepartamento']);
    // TAREAS
    Route::get('/proyectos/{idProyecto}/tareas', [TareasController::class, 'obtenerPorProyecto']);
    Route::get('/reporte', [ReporteController::class, 'generarPDF']);

    //JEFE
    Route::get('/proyectos/jefe', [JefeController::class, 'ProyectosDeUsuario']);
    Route::get('tareas/{idProyecto}/usuario/{idUsuario}', [JefeController::class, 'obtenerTareasPendientes']);
    Route::post('/evidencias', [JefeController::class, 'subirEvidencia']);
    Route::get('/usuario/tareas', [JefeController::class, 'tareasPorUsuario']);
    Route::get('generar-pdf-completadas-jefe', [JefeController::class, 'generarReporteCompletadas']);
    
    //DIRECTOR
    Route::get('/dashboard-departamento', [TareasDirectorController::class, 'dashboardDepartamento']);
    Route::post('/GuardarNuevoProyecto', [NuevoProyectoController::class, 'GuardarNuevoProyecto']);
    Route::get('/GuardarNuevoProyecto', [NuevoProyectoController::class, 'index']); 
    Route::get('/proyectos/{id}/fechasProyecto', [NuevoProyectoController::class, 'fechasProyecto']);
    Route::get('/departamentos/{id}/usuarios', [DepartamentoDirectorController::class, 'usuariosPorDepartamento']);

    Route::get('/CatalogoDepartamentos', [DepartamentoDirectorController::class, 'CatalogoDepartamentos']);
    Route::get('/proyectos/usuario', [DirectorController::class, 'MostrarProyectos']);
    Route::get('/proyectos/{idProyecto}/tareas-activas', [TareasDirectorController::class, 'tareasActivasPorProyecto']);
    Route::get('/proyectos/lista/modificar', [NuevoProyectoController::class, 'ListaProyectosModificar']);
    Route::get('/proyecto/{idProyecto}', [NuevoProyectoController::class, 'show']);
    Route::put('/modificar/proyecto/{idProyecto}', [NuevoProyectoController::class, 'update']);
    Route::get('/proyectos/sin-tareas', [NuevoProyectoController::class, 'ProyectosSinTareas']);
    Route::delete('/proyectos/{idProyecto}/eliminar', [NuevoProyectoController::class, 'EliminarProyecto']);
    Route::put('/proyectos/{id}/completar', [NuevoProyectoController::class, 'completar']);
    Route::put('/proyectos/{id}/finalizar', [NuevoProyectoController::class, 'CambiarStatusProyecto']);
    Route::put('/proyectos/{id}/cambiar-status', [NuevoProyectoController::class, 'CambiarStatusProyectoTerminado']);
    Route::get('/proyectos/completados', [TareasDirectorController::class, 'obtenerProyectosCompletados']);
    Route::post('/AgregarTareas', [NuevoProyectoController::class, 'AgregarTareas']);
    Route::put('/tareas/{id}/completar', [TareasDirectorController::class, 'completarTarea']);
    Route::get('tareas-proyectos-jefe', [TareasDirectorController::class, 'obtenerTareasProyectosJefe']);
    Route::get('tareasCompletadas/jefe', [TareasDirectorController::class, 'tareasCompletadasDepartamento']);
    Route::get('tareasPendientes/departamento', [TareasDirectorController::class, 'tareasPendientesUsuario']);
    Route::put('/tareas/{id}/cambiar-estatus-enproceso', [TareasDirectorController::class, 'cambiarStatusTareaEnProceso']);
    Route::get('/tareasPorDepartamento', [TareasDirectorController::class, 'tareasPorDepartamento']);
    Route::get('/EliminarTareasPorDepartamento', [TareasDirectorController::class, 'tareasPorDepartamento']);
    Route::delete('EliminarTarea/{idTarea}', [TareasDirectorController::class, 'eliminarTarea']);
    Route::get('/tareas/{idTarea}', [TareasDirectorController::class, 'show']);
    Route::put('/tareas/{id}', [TareasDirectorController::class, 'update']);
    Route::delete('/usuarios/{id_usuario}', [DepartamentoDirectorController::class, 'eliminarUsuario']);
    Route::get('/usuarios/departamento/{id_usuario}', [DepartamentoDirectorController::class, 'usuariosDeDepartamento']);


});
