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
    //METODO QUE DEVULVE LAS TAREAS COMPLETADAS A UN DIRECTOR
public function ObtenerTareasCompletadasDepartamento(Request $request)
{
    try {
        $usuario = DB::table('c_usuario')
            ->where('id_usuario', $request->query('usuario'))
            ->first();

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Usuario no encontrado'
            ], 404);
        }

        $idDepartamento = $usuario->id_departamento;

        // 2️⃣ Obtener todos los proyectos del departamento con tareas FINALIZADAS
        $proyectos = \App\Models\Proyecto::where('id_departamento', $idDepartamento)
            ->where('p_estatus', 'ILIKE', 'EN PROCESO') // puedes cambiarlo si deseas incluir también proyectos finalizados
            ->whereHas('tareas', function($q) {
                // Solo proyectos que tengan al menos una tarea FINALIZADA
                $q->whereRaw("UPPER(TRIM(t_estatus)) = 'FINALIZADA'");
            })
            ->with(['tareas' => function($q) {
                // Trae únicamente las tareas FINALIZADAS con sus evidencias
                $q->whereRaw("UPPER(TRIM(t_estatus)) = 'FINALIZADA'")
                  ->with('evidencias');
            }])
            ->get();

        // 3️⃣ Verificar si hay proyectos
        if ($proyectos->isEmpty()) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se encontraron proyectos con tareas finalizadas para este departamento'
            ], 404);
        }

        // 4️⃣ Respuesta final
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
//PROYECTOSVER, TODOS LOS PROYECTOS DE UN DEPARTAMENTO
public function proyectosDepartamento(Request $request)
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
        DB::raw("SUM(CASE WHEN t.t_estatus = 'Completado' THEN 1 ELSE 0 END) as tareas_completadas")
    )
    ->where('p.id_departamento', $idDepartamento)
    ->where('p.p_estatus', 'EN PROCESO')
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
//TAREAS PENDIENTES-INTERFAZ TAREAS PENDIENTES DEL DIRECTOR
public function tareasPendientesUsuario(Request $request)
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
            ->join('tareas as t', 'p.id_proyecto', '=', 't.id_proyecto')
            ->select(
                'p.*',
                DB::raw('COUNT(t.id_tarea) as total_tareas')
            )
            ->where('p.id_departamento', $idDepartamento)
            ->where('p.p_estatus', 'EN PROCESO')
            ->whereRaw("UPPER(TRIM(t.t_estatus)) = ?", ['PENDIENTE'])
            ->groupBy('p.id_proyecto')
            ->get();

        $proyectosConTareas = [];
        foreach ($proyectos as $proyecto) {
            $tareas = DB::table('tareas')
                ->where('id_proyecto', $proyecto->id_proyecto)
                ->whereRaw("UPPER(TRIM(t_estatus)) = ?", ['PENDIENTE'])
                ->get();

            $proyectosConTareas[] = [
                'proyecto' => $proyecto,
                'tareas' => $tareas
            ];
        }

        return response()->json([
            'success' => true,
            'proyectos' => $proyectosConTareas
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}

}