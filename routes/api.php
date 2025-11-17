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

});
