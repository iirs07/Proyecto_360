<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Evidencia;
use App\Models\Tarea;
use App\Models\Proyecto;
use App\Models\Usuario;


use DB;

class DirectorController extends Controller
{
  
//ESTE METODO DEVUELVE TODOS LOS PROYECTOS DE UN DEPARTAMENTO
public function MostrarProyectos(Request $request)
{
    try {
        $idUsuario = $request->query('usuario');

        if (!$idUsuario) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se recibió el ID de usuario'
            ], 400);
        }

        $usuario = DB::table('c_usuario')->where('id_usuario', $idUsuario)->first();

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Usuario no encontrado'
            ], 404);
        }

        $idDepartamento = $usuario->id_departamento;

       $proyectos = DB::table('proyectos as p')
    ->leftJoin('tareas as t', 'p.id_proyecto', '=', 't.id_proyecto')
    ->select(
        'p.*',
        DB::raw('COUNT(t.id_tarea) as total_tareas'),
        DB::raw("SUM(CASE WHEN t.t_estatus = 'En proceso' THEN 1 ELSE 0 END) as tareas_en_proceso"),
        DB::raw("SUM(CASE WHEN t.t_estatus = 'Finalizado' THEN 1 ELSE 0 END) as tareas_completadas")

    )
    ->where('p.id_departamento', $idDepartamento)
   ->whereIn('p.p_estatus', ['En proceso', 'Finalizado'])
    ->groupBy('p.id_proyecto')
    ->get();
        return response()->json([
            'success' => true,
            'proyectos' => $proyectos
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}


}