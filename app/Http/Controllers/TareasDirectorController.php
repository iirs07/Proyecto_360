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
public function ListaDeTareas($idProyecto)
{
    $proyecto = Proyecto::find($idProyecto);

    if (!$proyecto) {
        return response()->json(['error' => 'Proyecto no encontrado'], 404);
    }
    $tareas = Tarea::where('id_proyecto', $idProyecto)
            ->whereIn(\DB::raw('TRIM(t_estatus)'), ['Pendiente', 'En proceso', 'Completada'])
        ->with(['usuario' => function ($query) {
            $query->select('id_usuario', 'u_nombre', 'a_paterno', 'a_materno', 'id_departamento')
                  ->with(['departamento' => function($q){
                      $q->select('id_departamento', 'd_nombre');
                  }]);
        }])
        ->get()
        ->map(function ($tarea) use ($proyecto) {
            $tarea->proyectoNombre = $proyecto->p_nombre;

            if ($tarea->usuario) {
                $tarea->nombre_usuario_asignado = $tarea->usuario->u_nombre . ' ' . $tarea->usuario->a_paterno . ' ' . $tarea->usuario->a_materno;
                $tarea->nombre_departamento_usuario_asignado = $tarea->usuario->departamento->d_nombre ?? null;
            } else {
                $tarea->nombre_usuario_asignado = null;
                $tarea->nombre_departamento_usuario_asignado = null;
            }

            return $tarea;
        });

    return response()->json([
        'tareas' => $tareas
    ]);
}


    public function dashboardDepartamento(Request $request)
{
    $usuarioId = $request->query('usuario'); 

    if (!$usuarioId) {
        return response()->json(['error' => 'ID de usuario no especificado'], 400);
    }

    $usuario = \DB::table('c_usuario')->where('id_usuario', $usuarioId)->first();

    if (!$usuario) {
        return response()->json(['error' => 'Usuario no encontrado'], 404);
    }

    $departamentoId = $usuario->id_departamento;
    $proyectos = \DB::table('proyectos')
        ->select(
            'id_proyecto',
            'p_nombre',
            'descripcion',
            'pf_inicio',
            'pf_fin',
            'id_departamento',
            'p_estatus'
        )
        ->where('id_departamento', $departamentoId)
        ->get();
        $departamento = \DB::table('c_departamento')
    ->where('id_departamento', $departamentoId)
    ->first();

    $proyectosIds = $proyectos->pluck('id_proyecto');

    $tareas = \DB::table('tareas')
        ->join('proyectos', 'tareas.id_proyecto', '=', 'proyectos.id_proyecto')
        ->select(
            'tareas.*',
            'proyectos.p_nombre as nombre_proyecto'
        )
        ->whereIn('tareas.id_proyecto', $proyectosIds)
        ->get();
    $conteos = [
        'completadas' => $tareas->where('t_estatus', 'completada')->count(),
        'pendientes' => $tareas->where('t_estatus', 'pendiente')->count(),
        'en_proceso' => $tareas->where('t_estatus', 'en proceso')->count(),
        'total' => $tareas->count(),
    ];
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
        'departamento' => $departamento, 
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

        $hoy = Carbon::now();
        $mesActual = $hoy->month;
        $trimestreActual = ceil($mesActual / 3);
        $inicioTrimestreActual = Carbon::create($hoy->year, ($trimestreActual - 1) * 3 + 1, 1)->startOfDay();
        
        $estadosProyecto = ['En proceso']; 
        $filtroTareasVisibles = function($q) {
            $q->whereIn('t_estatus', ['En proceso', 'Completada']);
        };

        $proyectos = collect();
        $proyectos = $proyectos->merge(
            \App\Models\Proyecto::on('pgsql')
                ->where('id_departamento', $idDepartamento)
                ->whereIn('p_estatus', $estadosProyecto)
                
                ->whereHas('tareas', $filtroTareasVisibles) 
                
                ->withCount('tareas') 
                
                ->with(['tareas' => function($q) use ($filtroTareasVisibles) {
                    $filtroTareasVisibles($q);
                    $q->with('evidencias');
                }])
                ->where('pf_fin', '>=', $inicioTrimestreActual)
                ->get()
        );

        $proyectos = $proyectos->merge(
            \App\Models\Proyecto::on('pgsql_second')
                ->where('id_departamento', $idDepartamento)
                ->whereIn('p_estatus', $estadosProyecto)
                ->whereHas('tareas', $filtroTareasVisibles)
             
                ->withCount('tareas')
                
                ->with(['tareas' => function($q) use ($filtroTareasVisibles) {
                    $filtroTareasVisibles($q);
                    $q->with('evidencias');
                }])
                ->where('pf_fin', '<', $inicioTrimestreActual)
                ->get()
        );

        $proyectos = $proyectos->map(function($proyecto) {
            $proyecto->total_tareas = $proyecto->tareas_count;
            $proyecto->tareas_completadas = $proyecto->tareas
                ->filter(function($t) {
                    return $t->t_estatus === 'Completada';
                })->count();

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
        
        // 1. Recibir los nuevos filtros, incluyendo el término de BÚSQUEDA
        $anio = $request->query('anio');
        $mes = $request->query('mes');
        $busqueda = $request->query('busqueda'); // <--- NUEVO

        $usuario = DB::table('c_usuario')->where('id_usuario', $usuarioId)->first();
        // ... (manejo de error si no hay usuario) ...

        $idDepartamento = $usuario->id_departamento;

        // 2. Pasamos $busqueda a la closure
        $construirConsulta = function($query) use ($idDepartamento, $anio, $mes, $busqueda) { // <--- NUEVO
            $query->where('id_departamento', $idDepartamento)
                ->whereIn('p_estatus', ['Finalizado']);

            // 3. APLICAR FILTROS DE FECHA
            if ($anio) {
                $query->whereYear('pf_fin', $anio);
            }
            if ($mes) {
                $query->whereMonth('pf_fin', $mes);
            }
            
            // 4. APLICAR FILTRO DE BÚSQUEDA POR NOMBRE (Si existe)
            if ($busqueda) { // <--- NUEVO
                $query->where('p_nombre', 'ILIKE', '%' . $busqueda . '%'); 
                // Usamos ILIKE (PostgreSQL case-insensitive LIKE)
            }
            
            // El resto de la consulta sigue igual...
            return $query->whereHas('tareas')
                // ... (el resto de las condiciones de tareas)
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



public function obtenerProyectosCompletadosRecientes(Request $request)
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


        $construirConsultaRapida = function($query) use ($idDepartamento) {
            
            // Criterios Fijos para la Carga Rápida
            $query->where('id_departamento', $idDepartamento)
                ->whereIn('p_estatus', ['Finalizado']); // Solo nos basamos en el estatus del proyecto

            // Excluimos las condiciones whereHas / whereDoesntHave para aligerar la carga.
            // PERO, sí necesitamos el conteo y las tareas completadas:
            return $query->with(['tareas' => function($q) {
                 // Traemos solo las tareas que fueron marcadas como Completadas
                 $q->where('t_estatus', 'ILIKE', 'Completada')
                   ->with('evidencias');
             }])
             ->withCount(['tareas as total_tareas']) // Esto es importante
             ->withCount(['tareas as tareas_completadas' => function($q) {
                 $q->where('t_estatus', 'ILIKE', 'Completada');
             }]);
        };

        // CONSULTA SOLO LA BD PRINCIPAL ('pgsql')
        $proyectos = $construirConsultaRapida(\App\Models\Proyecto::on('pgsql'))->get();

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
            return response()->json(['success' => false, 'mensaje' => 'No se recibió el ID de usuario'], 400);
        }
        $usuario = DB::table('c_usuario as u')->select('u.*')->where('u.id_usuario', $idUsuario)->first();
        if (!$usuario) {
            return response()->json(['success' => false, 'mensaje' => 'Usuario no encontrado'], 404);
        }
        $idDepartamento = $usuario->id_departamento;
        
        $proyectos = DB::table('proyectos as p')
            ->join('tareas as t', 'p.id_proyecto', '=', 't.id_proyecto')
            ->join('c_departamento as d', 'p.id_departamento', '=', 'd.id_departamento') 
            ->select(
                'p.*',
                'd.d_nombre as nombre_del_departamento_del_proyecto',
                DB::raw('COUNT(t.id_tarea) as total_tareas')
            )
            ->where('p.id_departamento', $idDepartamento)
            ->where('p.p_estatus', 'En proceso')
           ->whereRaw("TRIM(t_estatus) = ?", ['Pendiente'])
            ->groupBy('p.id_proyecto', 'd.d_nombre')
            ->get();

        $proyectosConTareas = [];
        foreach ($proyectos as $proyecto) {
            
            $tareas = DB::table('tareas as t')
                ->join('c_usuario as u', 't.id_usuario', '=', 'u.id_usuario')
                ->join('c_departamento as ud', 'u.id_departamento', '=', 'ud.id_departamento')
                ->select(
                    't.*', 
                    DB::raw("u.u_nombre || ' ' || u.a_paterno || ' ' || u.a_materno as nombre_usuario_asignado"),
                
                    'ud.d_nombre as nombre_departamento_usuario_asignado' 
                )
                ->where('t.id_proyecto', $proyecto->id_proyecto)
                ->whereRaw("TRIM(t_estatus) = ?", ['Pendiente'])
                ->get();

            $proyectosConTareas[] = [
                'proyecto' => $proyecto,
                'tareas' => $tareas
            ];
        }

        // 4. Devolver la respuesta (sin cambios)
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

public function TareasCompletadasD(Request $request)
{
    try {
    
        $idUsuario = $request->query('usuario');
        if (!$idUsuario) {
            return response()->json(['success' => false, 'mensaje' => 'No se recibió el ID de usuario'], 400);
        }
        $usuario = DB::table('c_usuario as u')->select('u.*')->where('u.id_usuario', $idUsuario)->first();
        if (!$usuario) {
            return response()->json(['success' => false, 'mensaje' => 'Usuario no encontrado'], 404);
        }
        $idDepartamento = $usuario->id_departamento;

        $proyectos = DB::table('proyectos as p')
            ->join('tareas as t', 'p.id_proyecto', '=', 't.id_proyecto')
            ->join('c_departamento as d', 'p.id_departamento', '=', 'd.id_departamento') 
            ->select(
                'p.*',
                'd.d_nombre as nombre_del_departamento_del_proyecto',
                DB::raw('COUNT(t.id_tarea) as total_tareas')
            )
            ->where('p.id_departamento', $idDepartamento)
            ->where('p.p_estatus', 'Finalizado')
           ->whereRaw("TRIM(t_estatus) = ?", ['Completada'])
            ->groupBy('p.id_proyecto', 'd.d_nombre')
            ->get();

        $proyectosConTareas = [];
        foreach ($proyectos as $proyecto) {
            
            $tareas = DB::table('tareas as t')
                ->join('c_usuario as u', 't.id_usuario', '=', 'u.id_usuario')
                ->join('c_departamento as ud', 'u.id_departamento', '=', 'ud.id_departamento')
                ->select(
                    't.*', 
                    DB::raw("u.u_nombre || ' ' || u.a_paterno || ' ' || u.a_materno as nombre_usuario_asignado"),
               
                    'ud.d_nombre as nombre_departamento_usuario_asignado' 
                )
                ->where('t.id_proyecto', $proyecto->id_proyecto)
                ->whereRaw("TRIM(t_estatus) = ?", ['Completada'])

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

//TAREAS POR DEPARTAMENTO PARA AGREGAR
public function AgregarTareasDepartamento(Request $request)
{
    try {
        $idUsuario = $request->query('usuario');

        if (!$idUsuario) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se recibió el ID de usuario'
            ], 400);
        }

        $usuario = DB::table('c_usuario')
            ->where('id_usuario', $idUsuario)
            ->first();

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Usuario no encontrado'
            ], 404);
        }

        $idDepartamento = $usuario->id_departamento;

        // PROYECTOS DEL DEPARTAMENTO CON ESTATUS "En proceso"
        $proyectos = DB::table('proyectos')
            ->where('id_departamento', $idDepartamento)
            ->where('p_estatus', 'En proceso')
            ->select('id_proyecto', 'p_nombre', 'pf_inicio', 'pf_fin')
            ->get();

        if ($proyectos->isEmpty()) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No hay proyectos en proceso para este departamento'
            ]);
        }

        // FORMATO QUE ESPERA EL FRONT
        $proyectosFormateados = $proyectos->map(function ($p) {
            return [
                'proyecto' => [
                    'id_proyecto' => $p->id_proyecto,
                    'p_nombre'    => $p->p_nombre,
                    'pf_inicio'   => $p->pf_inicio,
                    'pf_fin'      => $p->pf_fin
                ],
                'tareas' => []
            ];
        });

        return response()->json([
            'success' => true,
            'proyectos' => $proyectosFormateados
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

public function updateTareas(Request $request, $idTarea)
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