<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tarea;
use App\Models\Proyecto;
use App\Models\Usuario;
use App\Notifications\TareaAsignada;
use Illuminate\Support\Facades\Log;
use App\Models\Evidencia;
use DB;

class TareasDirectorController extends Controller
{
//VERTAREAS-VERTAREAUSUARIO
public function tareasActivasPorProyecto($idProyecto)
{
    $proyecto = Proyecto::find($idProyecto);

    if (!$proyecto) {
        return response()->json(['error' => 'Proyecto no encontrado'], 404);
    }
    $tareas = Tarea::where('id_proyecto', $idProyecto)
               ->with('usuario') 
               ->withCount('evidencias')
               ->get()
               ->map(function($tarea) use ($proyecto) {
                   $tarea->proyectoNombre = $proyecto->p_nombre; 
                   return $tarea;
               });
    return response()->json([
        'tareas' => $tareas
    ]);
}
    public function dashboardDepartamento(Request $request)
{
    $usuarioId = $request->query('usuario'); // obtenemos id_usuario enviado desde React

    if (!$usuarioId) {
        return response()->json(['error' => 'ID de usuario no especificado'], 400);
    }

    // Buscar el usuario y su departamento
    $usuario = \DB::table('c_usuario')->where('id_usuario', $usuarioId)->first();

    if (!$usuario) {
        return response()->json(['error' => 'Usuario no encontrado'], 404);
    }

    $departamentoId = $usuario->id_departamento;

    // 🔹 Obtener proyectos del departamento con más información
    $proyectos = \DB::table('proyectos')
        ->select(
            'id_proyecto',
            'p_nombre',
            'descripcion',
            'pf_inicio',
            'pf_fin',
            'id_departamento'
        )
        ->where('id_departamento', $departamentoId)
        ->get();

    $proyectosIds = $proyectos->pluck('id_proyecto');

    // 🔹 Obtener tareas de los proyectos
    $tareas = \DB::table('tareas')
        ->join('proyectos', 'tareas.id_proyecto', '=', 'proyectos.id_proyecto')
        ->select(
            'tareas.*',
            'proyectos.p_nombre as nombre_proyecto'
        )
        ->whereIn('tareas.id_proyecto', $proyectosIds)
        ->get();

    // 🔹 Conteos por estatus
    $conteos = [
        'completadas' => $tareas->where('t_estatus', 'finalizada')->count(),
        'pendientes' => $tareas->where('t_estatus', 'pendiente')->count(),
        'en_proceso' => $tareas->where('t_estatus', 'en proceso')->count(),
        'total' => $tareas->count(),
    ];

    // 🔹 Calcular tareas totales y completadas por proyecto
    $proyectos = $proyectos->map(function ($proyecto) use ($tareas) {
        $tareasProyecto = $tareas->where('id_proyecto', $proyecto->id_proyecto);
        $total = $tareasProyecto->count();
        $completadas = $tareasProyecto->where('t_estatus', 'finalizada')->count();

        $proyecto->total_tareas = $total;
        $proyecto->tareas_completadas = $completadas;
        $proyecto->porcentaje = $total > 0 ? round(($completadas / $total) * 100, 1) : 0;

        return $proyecto;
    });

    return response()->json([
        'proyectos' => $proyectos,
        'tareas' => $tareas,
        'conteos' => $conteos,
    ]);
}
public function obtenerTareasProyectosJefe(Request $request)
{
    try {
       $usuario = DB::table('c_usuario')
            ->where('id_usuario', $request->query('usuario'))
            ->first();

        if (!$usuario) {
            return response()->json(['success' => false, 'mensaje' => 'Usuario no encontrado'], 404);
        }

        $idDepartamento = $usuario->id_departamento;

        $proyectos = \App\Models\Proyecto::where('id_departamento', $idDepartamento)
            ->where('p_estatus', 'ILIKE', 'EN PROCESO')
            ->whereHas('tareas', function($q) {
                // Solo proyectos que tengan al menos una tarea EN PROCESO o FINALIZADA
                $q->whereIn(DB::raw('LOWER(t_estatus)'), ['en proceso', 'finalizada']);
            })
            ->with(['tareas' => function($q) {
                // Trae todas las tareas EN PROCESO o FINALIZADA con sus evidencias
                $q->whereIn(DB::raw('LOWER(t_estatus)'), ['en proceso', 'finalizada'])
                    ->with('evidencias');
            }])
            ->get()
            ->map(function($proyecto) {
                // 1. Total de tareas (independiente de estatus)
                $proyecto->total_tareas = \App\Models\Tarea::where('id_proyecto', $proyecto->id_proyecto)->count();

                // 2. Tareas completadas (Progreso validado por el jefe)
                $proyecto->tareas_completadas = \App\Models\Tarea::where('id_proyecto', $proyecto->id_proyecto)
                    ->where('t_estatus', 'ILIKE', 'Finalizada')
                    ->count();

                // 3. ¡NUEVA MÉTRICA! Tareas listas para revisión (Estatus 'En Proceso' Y tienen evidencia)
                $proyecto->tareas_a_revisar = \App\Models\Tarea::where('id_proyecto', $proyecto->id_proyecto)
                    ->where('t_estatus', 'ILIKE', 'En Proceso') // Tareas en estatus 'En Proceso'
                    ->whereHas('evidencias') // ¡Que además tengan evidencias subidas!
                    ->count();
                
                return $proyecto;
            });

        return response()->json([
            'success' => true,
            'proyectos' => $proyectos
        ]);

    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
}
}