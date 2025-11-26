<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReporteJefeController;
use App\Http\Controllers\ReporteDirectorController;
Route::get('/generar-pdf-completadas-jefe', [ReporteJefeController::class, 'generarReporteCompletadas']);
Route::get('/generar-pdf', [ReporteDirectorController::class, 'generarPDF']);
// Todas las rutas que no sean api van a React
Route::get('/{any}', function () {
    return view('app'); 
})->where('any', '^(?!api).*$');
