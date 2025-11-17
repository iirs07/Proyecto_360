<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\JefeController;
Route::get('/generar-pdf-completadas-jefe', [JefeController::class, 'generarReporteCompletadas']);
// Todas las rutas que no sean api van a React
Route::get('/{any}', function () {
    return view('app'); 
})->where('any', '^(?!api).*$');
