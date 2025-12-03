<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tarea;
use App\Models\Proyecto;
use App\Models\Usuario;
use App\Models\HistorialModificacion;
use App\Notifications\TareaAsignada;
use Illuminate\Support\Facades\Log;
use App\Models\Evidencia;
use Carbon\Carbon;

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
        'completadas' => $tareas->where('t_estatus', 'completada')->count(),
        'pendientes' => $tareas->where('t_estatus', 'pendiente')->count(),
        'en_proceso' => $tareas->where('t_estatus', 'en proceso')->count(),
        'total' => $tareas->count(),
    ];

    // 🔹 Calcular tareas totales y completadas por proyecto
    $proyectos = $proyectos->map(function ($proyecto) use ($tareas) {
        $tareasProyecto = $tareas->where('id_proyecto', $proyecto->id_proyecto);
        $total = $tareasProyecto->count();
        $completadas = $tareasProyecto->where('t_estatus', 'completada')->count();

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
        // 1. Obtener usuario
        $usuario = DB::table('c_usuario')
            ->where('id_usuario', $request->query('usuario'))
            ->first();

        if (!$usuario) {
            return response()->json(['success' => false, 'mensaje' => 'Usuario no encontrado'], 404);
        }

        $idDepartamento = $usuario->id_departamento;

        // 2. Calcular fechas del trimestre
        $hoy = Carbon::now();
        $mesActual = $hoy->month;
        $trimestreActual = ceil($mesActual / 3);
        $inicioTrimestreActual = Carbon::create($hoy->year, ($trimestreActual - 1) * 3 + 1, 1)->startOfDay();
        
        $estadosProyecto = ['En proceso']; 

        // Filtro para cargar SOLO las tareas que nos interesan ver en el detalle (En proceso/Completada)
        $filtroTareasVisibles = function($q) {
            $q->whereIn('t_estatus', ['En proceso', 'Completada']);
        };

        $proyectos = collect();

        // 3. Consulta BD principal (trimestre actual)
        $proyectos = $proyectos->merge(
            \App\Models\Proyecto::on('pgsql')
                ->where('id_departamento', $idDepartamento)
                ->whereIn('p_estatus', $estadosProyecto)
                
                // Mantiene el filtro de proyectos (solo trae proyectos que tengan algo de actividad)
                ->whereHas('tareas', $filtroTareasVisibles) 
                
                // CORRECCIÓN CLAVE: Cuenta TODAS las tareas (sin filtros) en la BD
                ->withCount('tareas') 
                
                // Carga la relación filtrada (solo trae los datos de las activas/completadas)
                ->with(['tareas' => function($q) use ($filtroTareasVisibles) {
                    $filtroTareasVisibles($q);
                    $q->with('evidencias');
                }])
                ->where('pf_fin', '>=', $inicioTrimestreActual)
                ->get()
        );

        // 4. Consulta BD histórica (trimestres pasados)
        $proyectos = $proyectos->merge(
            \App\Models\Proyecto::on('pgsql_second')
                ->where('id_departamento', $idDepartamento)
                ->whereIn('p_estatus', $estadosProyecto)
                ->whereHas('tareas', $filtroTareasVisibles)
                
                // CORRECCIÓN CLAVE: Cuenta TODAS las tareas en la histórica
                ->withCount('tareas')
                
                ->with(['tareas' => function($q) use ($filtroTareasVisibles) {
                    $filtroTareasVisibles($q);
                    $q->with('evidencias');
                }])
                ->where('pf_fin', '<', $inicioTrimestreActual)
                ->get()
        );

        // 5. Calcular métricas finales
        $proyectos = $proyectos->map(function($proyecto) {

            // AQUÍ LA CORRECCIÓN: Usamos el conteo total de la BD
            // 'tareas_count' es creado automáticamente por withCount('tareas')
            $proyecto->total_tareas = $proyecto->tareas_count;

            // Calculamos completadas usando la colección cargada (que ya está filtrada)
            $proyecto->tareas_completadas = $proyecto->tareas
                ->filter(function($t) {
                    return $t->t_estatus === 'Completada';
                })->count();

            // Calculamos 'a revisar' usando la colección cargada
            $proyecto->tareas_a_revisar = $proyecto->tareas
                ->filter(function($t) {
                    return $t->t_estatus === 'En proceso'
                           && $t->evidencias->isNotEmpty();
                })->count();

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

    $tarea->t_estatus = "Completada";
    $tarea->save();

    return response()->json([
        'success' => true,
        'mensaje' => 'Tarea marcada como completada',
        'tarea' => $tarea
    ]);
}
public function cambiarStatusTareaEnProceso(Request $request, $idTarea)
{
    DB::beginTransaction(); 

    try {
        $tarea = Tarea::find($idTarea);

        if (!$tarea) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Tarea no encontrada'
            ], 404);
        }

        // 1. Modificar el estatus de la tarea
        $tarea->t_estatus = "En proceso";
        $tarea->save();

        // 2. Guardar en el Historial
        // IMPORTANTE: Obtenemos el id_usuario del Request
        $usuarioId = $request->input('usuario_id');

        HistorialModificacion::create([
            'id_proyecto' => $tarea->id_proyecto, 
            'id_tarea'    => $idTarea,            
            'id_usuario'  => $usuarioId,
            'accion'      => 'REACTIVACION TAREA',
            'detalles'    => "Fue modificado el estatus de la tarea de Completada e En proceso."
        ]);

        DB::commit(); // Confirmar cambios

        return response()->json([
            'success' => true,
            'mensaje' => 'Tarea marcada como en proceso y registrada en historial',
            'tarea' => $tarea
        ]);

    } catch (\Exception $e) {
        DB::rollBack(); // Deshacer si hay error
        
        return response()->json([
            'success' => false,
            'mensaje' => 'Ocurrió un error al actualizar la tarea: ' . $e->getMessage()
        ], 500);
    }
}
public function completarTarea($id)
    {
        try {
            
            // Buscar la tarea
            $tarea = Tarea::find($id);
            
            if (!$tarea) {
                \Log::warning('Tarea no encontrada:', ['id' => $id]);
                return response()->json(['success' => false, 'mensaje' => 'Tarea no encontrada'], 404);
            }

            \Log::info('Tarea encontrada:', ['tarea' => $tarea]);
            $tarea->update([
                't_estatus' => 'Completada',
                'tf_completada' => now()
            ]);

            \Log::info('Tarea actualizada exitosamente');

            return response()->json([
                'success' => true,
                'mensaje' => 'Tarea marcada como completada',
                'tarea' => $tarea
            ]);

        } catch (\Exception $e) {
             [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ];
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
   public function obtenerProyectosCompletados(Request $request)
{
    try {
        $usuarioId = $request->query('usuario_id'); 
        
        // 1. Recibir los nuevos filtros
        $anio = $request->query('anio');
        $mes = $request->query('mes');

        $usuario = DB::table('c_usuario')->where('id_usuario', $usuarioId)->first();

        if (!$usuario) {
            return response()->json(['success' => false, 'mensaje' => 'Usuario no encontrado'], 404);
        }

        $idDepartamento = $usuario->id_departamento;

        // 2. Pasamos $anio y $mes al "use" para poder usarlos dentro
        $construirConsulta = function($query) use ($idDepartamento, $anio, $mes) {
            $query->where('id_departamento', $idDepartamento)
                ->whereIn('p_estatus', ['Finalizado']);

            // 3. APLICAR FILTROS DE FECHA SI EXISTEN
            if ($anio) {
                $query->whereYear('pf_fin', $anio);
            }
            
            if ($mes) {
                $query->whereMonth('pf_fin', $mes);
            }
                
            // El resto de la consulta sigue igual...
            return $query->whereHas('tareas')
                ->whereDoesntHave('tareas', function($q) {
                    $q->where('t_estatus', 'NOT ILIKE', 'Completada');
                })
                ->with(['tareas' => function($q) {
                    $q->where('t_estatus', 'ILIKE', 'Completada')
                      ->with('evidencias');
                }])
                ->withCount(['tareas as total_tareas'])
                ->withCount(['tareas as tareas_completadas' => function($q) {
                    $q->where('t_estatus', 'ILIKE', 'Completada');
                }]);
        };

        // Consultar ambas BDs con los filtros aplicados
        $proyectosPrincipal = $construirConsulta(\App\Models\Proyecto::on('pgsql'))->get();
        $proyectosHistorico = $construirConsulta(\App\Models\Proyecto::on('pgsql_second'))->get();

        $proyectos = $proyectosPrincipal->merge($proyectosHistorico);

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
        ->whereRaw("UPPER(TRIM(t.t_estatus)) = ?", ['COMPLETADA'])
        ->select('t.*', 'p.p_nombre', 'p.pf_inicio', 'p.pf_fin', 'p.p_estatus')
        ->get();

    if ($tareas->isEmpty()) {
        return response()->json([
            'success' => false,
            'mensaje' => 'No hay tareas completadas para este departamento'
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