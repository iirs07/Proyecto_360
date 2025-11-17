<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Area;

class DepartamentoController extends Controller
{
    protected $table = 'c_departamento'; // nombre exacto de la tabla
    protected $primaryKey = 'id_area';  
    public function index()
    {
        // Traer todas las áreas con sus departamentos
        $areas = Area::with('departamentos')->get();

        return response()->json($areas, 200, [], JSON_UNESCAPED_UNICODE);
    }
     public function usuariosPorDepartamento(Departamento $departamento)
{
    return response()->json($departamento->usuarios);
}
}
