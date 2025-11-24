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
public function CambiarStatusTareaFinalizada($idTarea)
{
    $tarea = Tarea::find($idTarea);

    if (!$tarea) {
        return response()->json([
            'success' => false,
            'mensaje' => 'Tarea no encontrada'
        ], 404);
    }

    $tarea->t_estatus = "Finalizada";
    $tarea->save();

    return response()->json([
        'success' => true,
        'mensaje' => 'Tarea marcada como finalizada',
        'tarea' => $tarea
    ]);
}
//METODO QUE PERMITE MODIFICAR EL ESTATUS DE UNA TAREA A FINALIZADAS
public function cambiarStatusTareaEnProceso($idTarea)
{

    $tarea = Tarea::find($idTarea);

    if (!$tarea) {
        return response()->json([
            'success' => false,
            'mensaje' => 'Tarea no encontrada'
        ], 404);
    }

    try {
        $tarea->t_estatus = "En proceso";
        $tarea->save();

        return response()->json([
            'success' => true,
            'mensaje' => 'Tarea marcada como en proceso',
            'tarea' => $tarea
        ]);
    } catch (\Exception $e) {
        

        return response()->json([
            'success' => false,
            'mensaje' => 'Ocurrió un error al actualizar la tarea'
        ], 500);
    }
}
public function completarTarea($id)
    {
        try {
            \Log::info('Solicitud recibida para completar tarea:', ['id' => $id]);
            
            // Buscar la tarea
            $tarea = Tarea::find($id);
            
            if (!$tarea) {
                \Log::warning('Tarea no encontrada:', ['id' => $id]);
                return response()->json(['success' => false, 'mensaje' => 'Tarea no encontrada'], 404);
            }

            \Log::info('Tarea encontrada:', ['tarea' => $tarea]);

            // Actualizar el estado
            $tarea->update([
                't_estatus' => 'Finalizada',
                'tf_completada' => now()
            ]);

            \Log::info('Tarea actualizada exitosamente');

            return response()->json([
                'success' => true,
                'mensaje' => 'Tarea marcada como Finalizada',
                'tarea' => $tarea
            ]);

        } catch (\Exception $e) {
            \Log::error('Error en completarTarea:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    public function obtenerProyectosCompletados(Request $request)
{
    try {
        $usuarioId = $request->query('usuario_id'); 
        $usuario = DB::table('c_usuario')->where('id_usuario', $usuarioId)->first();

        if (!$usuario) {
            return response()->json(['success' => false, 'mensaje' => 'Usuario no encontrado'], 404);
        }

        $idDepartamento = $usuario->id_departamento;

        $proyectos = \App\Models\Proyecto::where('id_departamento', $idDepartamento)
            // 🛑 GRUPO DE CONDICIONES para visibilidad del proyecto
            ->where(function ($query) {
                // 1. Condición: El proyecto está en estatus 'Finalizada' (estado archivado).
                $query->where('p_estatus', 'ILIKE', 'Finalizado')
                      
                      // 2. Condición: El proyecto está en estatus 'En proceso' (estado desbloqueado), 
                      //    PERO todavía tiene tareas que requieren la acción de 'Finalizada'.
                      ->orWhere(function ($q) {
                          // Usamos 'En proceso' con el espacio.
                          $q->where('p_estatus', 'ILIKE', 'En proceso')
                            ->whereHas('tareas', function($tq) {
                                // Mantenemos visible el proyecto si, aun estando en 'En proceso',
                                // tiene al menos una tarea que sigue 'Finalizada'.
                                $tq->where('t_estatus', 'ILIKE', 'Finalizada'); 
                            });
                      });
            })
            // 🛑 FIN DEL GRUPO DE CONDICIONES
            
            // whereHas: Nos aseguramos de cargar proyectos que tengan tareas en estado Finalizada O En proceso.
            ->whereHas('tareas', function($q) {
                // Usamos LOWER para asegurar que no haya problemas de mayúsculas/minúsculas al buscar las tareas.
                $q->whereIn(DB::raw('LOWER(t_estatus)'), ['finalizada', 'En proceso']); 
            })
            
            // with: Cargamos las tareas para el frontend
            ->with(['tareas' => function($q) {
                // Excluimos 'pendiente', solo cargamos 'Finalizada' y 'En proceso'.
                $q->where(DB::raw('LOWER(t_estatus)'), '!=', 'pendiente')
                  ->with('evidencias');
            }])

            ->get()
            ->map(function($proyecto) {
                // Mantenemos la lógica de contadores
                $proyecto->total_tareas = \App\Models\Tarea::where('id_proyecto', $proyecto->id_proyecto)->count();
                $proyecto->tareas_completadas = \App\Models\Tarea::where('id_proyecto', $proyecto->id_proyecto)
                    ->whereHas('evidencias') 
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
            ->where('p.p_estatus', 'En proceso')
           ->whereRaw("TRIM(t_estatus) = ?", ['Pendiente'])
            ->groupBy('p.id_proyecto')
            ->get();

        $proyectosConTareas = [];
        foreach ($proyectos as $proyecto) {
            $tareas = DB::table('tareas')
                ->where('id_proyecto', $proyecto->id_proyecto)
                ->whereRaw("TRIM(t_estatus) = ?", ['Pendiente'])
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
public function tareasCompletadasDepartamento(Request $request)
{
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
    $tareas = DB::table('tareas as t')
        ->join('proyectos as p', 't.id_proyecto', '=', 'p.id_proyecto')
        ->where('p.id_departamento', $idDepartamento)
        ->whereRaw("UPPER(TRIM(t.t_estatus)) = ?", ['FINALIZADA'])
        ->select('t.*', 'p.p_nombre', 'p.pf_inicio', 'p.pf_fin', 'p.p_estatus')
        ->get();

    if ($tareas->isEmpty()) {
        return response()->json([
            'success' => false,
            'mensaje' => 'No hay tareas finalizadas para este departamento'
        ]);
    }

    $proyectosConTareas = $tareas
        ->groupBy('id_proyecto')
        ->map(function ($tareasProyecto, $idProyecto) {
            $proyecto = $tareasProyecto->first();
            return [
                'proyecto' => [
                    'id_proyecto' => $idProyecto,
                    'p_nombre' => $proyecto->p_nombre,
                    'pf_inicio' => $proyecto->pf_inicio,
                    'pf_fin' => $proyecto->pf_fin,
                    'p_estatus' => $proyecto->p_estatus,
                    'total_tareas' => $tareasProyecto->count(),
                ],
                'tareas' => $tareasProyecto
            ];
        })
        ->values(); 

    return response()->json([
        'success' => true,
        'proyectos' => $proyectosConTareas
    ]);
}

public function EliminarTareasPorDepartamento(Request $request)
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

        $tareas = DB::table('tareas as t')
            ->join('proyectos as p', 't.id_proyecto', '=', 'p.id_proyecto')
            ->leftJoin('evidencias as e', function($join) {
                $join->on('t.id_tarea', '=', 'e.id_tarea')
                     ->on('t.id_proyecto', '=', 'e.id_proyecto');
            })
            ->where('p.id_departamento', $idDepartamento)
            ->where(function($query) {
                $query->where('t.t_estatus', 'En proceso') // Incluye todas en proceso
                      ->orWhere(function($q){
                          $q->where('t.t_estatus', 'Pendiente')
                            ->whereNull('e.id_evidencia'); // Pendientes sin evidencia
                      });
            })
            ->select(
                't.*',
                'p.p_nombre',
                'p.pf_inicio',
                'p.pf_fin',
                'p.p_estatus'
            )
            ->get();

        if ($tareas->isEmpty()) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No hay tareas para este departamento'
            ]);
        }

        $proyectosConTareas = $tareas
            ->groupBy('id_proyecto')
            ->map(function ($tareasProyecto, $idProyecto) {
                $proyecto = $tareasProyecto->first();
                return [
                    'proyecto' => [
                        'id_proyecto' => $idProyecto,
                        'p_nombre' => $proyecto->p_nombre,
                        'pf_inicio' => $proyecto->pf_inicio,
                        'pf_fin' => $proyecto->pf_fin,
                        'p_estatus' => $proyecto->p_estatus,
                        'total_tareas' => $tareasProyecto->count(),
                    ],
                    'tareas' => $tareasProyecto
                ];
            })
            ->values(); 

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

//TAREAS POR DEPARTAMENTO PARA MODIFICAR
public function tareasPorDepartamento(Request $request)
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
       $tareas = DB::table('tareas as t')
    ->join('proyectos as p', 't.id_proyecto', '=', 'p.id_proyecto')
    ->leftJoin('evidencias as e', function($join) {
        $join->on('t.id_tarea', '=', 'e.id_tarea')
             ->on('t.id_proyecto', '=', 'e.id_proyecto');
    })
    ->where('p.id_departamento', $idDepartamento)
    ->where(function($query) {
        $query->where('t.t_estatus', 'En proceso')
              ->orWhere(function($q){
                  $q->where('t.t_estatus', 'Pendiente')
                    ->whereNull('e.id_evidencia'); 
              });
    })
    ->select(
        't.*',
        'p.p_nombre',
        'p.pf_inicio',
        'p.pf_fin',
        'p.p_estatus'
    )
    ->get();

        if ($tareas->isEmpty()) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No hay tareas para este departamento'
            ]);
        }

        $proyectosConTareas = $tareas
            ->groupBy('id_proyecto')
            ->map(function ($tareasProyecto, $idProyecto) {
                $proyecto = $tareasProyecto->first();
                return [
                    'proyecto' => [
                        'id_proyecto' => $idProyecto,
                        'p_nombre' => $proyecto->p_nombre,
                        'pf_inicio' => $proyecto->pf_inicio,
                        'pf_fin' => $proyecto->pf_fin,
                        'p_estatus' => $proyecto->p_estatus,
                        'total_tareas' => $tareasProyecto->count(),
                    ],
                    'tareas' => $tareasProyecto
                ];
            })
            ->values(); 

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
// OBTENER UNA TAREA POR ID
public function show($idTarea)
{
    try {
        $tarea = Tarea::with(['usuario', 'usuario.departamento', 'proyecto'])->find($idTarea);

        if (!$tarea) {
            return response()->json([
                'success' => false,
                'message' => 'Tarea no encontrada'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'tarea' => $tarea
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}
// ELIMINAR UNA TAREA POR ID
public function eliminarTarea($idTarea)
{
    try {
        $tarea = Tarea::find($idTarea);

        if (!$tarea) {
            return response()->json([
                'success' => false,
                'message' => 'Tarea no encontrada'
            ], 404);
        }

        $tarea->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tarea eliminada correctamente'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}

public function update(Request $request, $idTarea)
{
    try {
        $tarea = Tarea::find($idTarea);

        if (!$tarea) {
            return response()->json([
                'success' => false,
                'message' => 'Tarea no encontrada'
            ], 404);
        }
        $tarea->t_nombre   = $request->t_nombre ?? $tarea->t_nombre;
        $tarea->descripcion = $request->descripcion ?? $tarea->descripcion;
        $tarea->tf_inicio  = $request->tf_inicio ?? $tarea->tf_inicio;
        $tarea->tf_fin     = $request->tf_fin ?? $tarea->tf_fin;
        $tarea->id_usuario = $request->id_usuario ?? $tarea->id_usuario;

        $tarea->save();

        return response()->json([
            'success' => true,
            'tarea' => $tarea
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}


}