<?php
use Illuminate\Support\Facades\Route;

// Todas las rutas que no sean api van a React
Route::get('/{any}', function () {
    return view('app'); 
})->where('any', '^(?!api).*$');
