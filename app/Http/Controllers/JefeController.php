<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Evidencia;
use App\Models\Tarea;
use App\Models\Proyecto;
use App\Models\Usuario;
use App\Models\CUsuario;
use Carbon\Carbon;
use Mpdf\Mpdf;

use App\Notifications\TareaAsignada;

use DB;

class JefeController extends Controller
{
    //METODO QUE DEVUELVE LOS PROYECTOS Y NUMERO DE TAREAS DE UN USUARIO ESPECIFICO- SE USA EN LA INTERFAZ DE USUARIO.JSX
public function ProyectosDeUsuario(Request $request)
{
    try {
        $idUsuario = $request->query('usuario');

        if (empty($idUsuario) || !is_numeric($idUsuario)) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se recibió un ID de usuario válido.'
            ], 400);
        }

        $proyectos = Proyecto::whereHas('tareas', fn($q) =>
            $q->where('id_usuario', $idUsuario)
              ->whereIn('t_estatus', ['Pendiente', 'En proceso'])
        )
        ->with(['tareas' => fn($q) =>
            $q->where('id_usuario', $idUsuario)
              ->whereIn('t_estatus', ['Pendiente', 'En proceso'])
        ])
        ->orderBy('p_nombre')
        ->get()
        ->map(fn($proyecto) => [
            'id_proyecto' => $proyecto->id_proyecto,
            'p_nombre' => $proyecto->p_nombre,
            'pf_fin' => $proyecto->pf_fin,
            'p_estatus' => $proyecto->p_estatus,
            'total_tareas' => $proyecto->tareas->count(),
            'tareas' => $proyecto->tareas->map(fn($tarea) => [
                'id_tarea' => $tarea->id_tarea,
                't_nombre' => $tarea->t_nombre,
                't_estatus' => $tarea->t_estatus,
                'tf_inicio' => $tarea->tf_inicio,
                'tf_fin' => $tarea->tf_fin,
                'descripcion' => $tarea->descripcion,
            ]),
        ]);

        return response()->json([
            'success' => true,
            'proyectos' => $proyectos,
        ]);

    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
        ], 500);
    }
}


//METODO QUE DEVUELVE LAS TAREAS PENDIENTES DE UN USUARIO Y PROYECTO ESPECIFICO, SE UTILIZA EN LA INTERFAZ DE TAREA USUARIO.JSX
public function obtenerTareasPendientes($idProyecto, $idUsuario)
{
    $tareasConEvidencias = Tarea::withCount([
        'evidencias' => function($query) use ($idProyecto) {
            $query->where('id_proyecto', $idProyecto);
        }
    ])
    ->where('id_proyecto', $idProyecto)
    ->where('id_usuario', $idUsuario)
    ->whereIn(\DB::raw('LOWER(t_estatus)'), ['pendiente', 'en proceso'])
    ->get([
        'id_tarea',
        'id_proyecto',
        'id_usuario',
        't_nombre',
        't_estatus',
        'tf_inicio',
        'descripcion',
        'tf_fin'
    ]);

    return response()->json([
        'success' => true,
        'tareas' => $tareasConEvidencias
    ]);
}




//METODO QUE DEVELVE EL NUMERO DE TAREAS Y DATOS DEL PROYECTO PARA MOSTRARSE EN LA INTERFAZ DE GESTIONPROYECTOSUSUARIO
public function tareasPorUsuario(Request $request)
{
    $usuarioId = $request->query('usuario');

    if (!$usuarioId) {
        return response()->json(['error' => 'Usuario no especificado'], 400);
    }
    $proyectos = \DB::table('tareas')
        ->join('proyectos', 'tareas.id_proyecto', '=', 'proyectos.id_proyecto')
        ->where('tareas.id_usuario', $usuarioId)
        ->select(
            'proyectos.id_proyecto',
            'proyectos.p_nombre',
            'proyectos.descripcion as descripcion_proyecto',
            'proyectos.pf_inicio',
            'proyectos.pf_fin',
            \DB::raw("COUNT(CASE WHEN LOWER(TRIM(tareas.t_estatus)) = 'finalizada' THEN 1 END) as tareas_completadas"),
            \DB::raw("COUNT(CASE WHEN LOWER(TRIM(tareas.t_estatus)) = 'pendiente' THEN 1 END) as tareas_pendientes"),
            \DB::raw("COUNT(CASE WHEN LOWER(TRIM(tareas.t_estatus)) = 'en proceso' THEN 1 END) as tareas_en_progreso"),
            \DB::raw("COUNT(tareas.id_tarea) as total_tareas")
        )
        ->groupBy(
            'proyectos.id_proyecto',
            'proyectos.p_nombre',
            'proyectos.descripcion',
            'proyectos.pf_inicio',
            'proyectos.pf_fin'
        )
        ->get();
    $conteos = [
        'completadas' => $proyectos->sum('tareas_completadas'),
        'pendientes' => $proyectos->sum('tareas_pendientes'),
        'en_progreso' => $proyectos->sum('tareas_en_progreso'),
        'total' => $proyectos->sum('total_tareas'),
    ];

    return response()->json([
        'proyectos' => $proyectos,
        'conteos' => $conteos
    ]);
}

 //METODO PARA INSERTAR EVIDENCIAS SE UTLIZA EN LA INTERFAZ DE TAREA USUARIO
   public function subirEvidencia(Request $request)
{
    \Log::info('Recibido request:', $request->all());

    if ($request->hasFile('archivo')) {
        \Log::info('Archivo recibido', ['nombre' => $request->file('archivo')->getClientOriginalName()]);
    } else {
        \Log::warning('No se recibió archivo');
    }

    try {
        $request->validate([
            'id_proyecto' => 'required|integer',
            'id_tarea' => 'required|integer',
            'id_departamento' => 'required|integer',
            'id_usuario' => 'required|integer',
            'ruta_archivo' => 'required|file|mimes:jpg,jpeg,png|max:5120'
        ]);

        // Guardar archivo
        $rutaArchivo = $request->file('ruta_archivo')->store('evidencias', 'public');

        // Crear evidencia
        $evidencia = Evidencia::create([
            'id_proyecto' => $request->id_proyecto,
            'id_tarea' => $request->id_tarea,
            'id_departamento' => $request->id_departamento,
            'id_usuario' => $request->id_usuario,
            'ruta_archivo' => $rutaArchivo,
            'fecha' => now(),
        ]);

        // Actualizar tarea y obtener conteo de evidencias
        $tarea = \App\Models\Tarea::find($request->id_tarea);
        $evidenciasCount = 0;
        if ($tarea) {
            $tarea->t_estatus = 'En proceso';
            $tarea->save();

            // Contar evidencias asociadas a esta tarea
            $evidenciasCount = $tarea->evidencias()->count();
        }

        // Devolver respuesta incluyendo el conteo actualizado
        return response()->json([
            'success' => true,
            'evidencia' => $evidencia,
            'evidencias_count' => $evidenciasCount,
            'message' => 'Evidencia subida y tarea actualizada'
        ]);

    } catch (\Exception $e) {
        \Log::error('Error al subir evidencia: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}
 //METODO PARA REPORTES DE TAREAS COMPLETADAS DE UN USUARIO
 public function generarReporteCompletadas(Request $request)
    {
        $idUsuario = $request->query('id_usuario');
        $inicio = $request->query('fechaInicio');
        $fin = $request->query('fechaFin');
        date_default_timezone_set('America/Mexico_City');   
        $hoy = Carbon::now()->format('d/m/Y');
        $hora = Carbon::now()->format('H:i:s');
        $usuarioData = CUsuario::with('departamento')->find($idUsuario);
        if (!$usuarioData) {
            return response()->json(['error' => 'Usuario no encontrado.'], 404);
        }

        $usuario = [
            'nombre' => $usuarioData->u_nombre ?? '',
            'a_paterno' => $usuarioData->a_paterno ?? '',
            'a_materno' => $usuarioData->a_materno ?? '',
            'departamento' => $usuarioData->departamento->d_nombre ?? 'N/A',
        ];
        $tareas = Tarea::where('id_usuario', $idUsuario)
            ->whereBetween('tf_completada', [$inicio, $fin])
            ->get();
        $tipo = 'completadas-jefe';
      $html = view('pdf.ReportesJefe', [
            'tareas' => $tareas,
            'usuario' => $usuario,
            'inicio' => $inicio,
            'fin' => $fin,
            'tipo' => $tipo,
            'hoy' => $hoy,
            'hora' => $hora
        ])->render();
        $mpdf = new Mpdf();
        $mpdf->showImageErrors = true;
        $mpdf->SetWatermarkImage(public_path('imagenes/logo2.png'), 0.1, [150, 200], 'C');
        $mpdf->showWatermarkImage = true;
        $cssPath = resource_path('css/PdfTareasCompletadas.css');
        if (file_exists($cssPath)) {
            $css = file_get_contents($cssPath);
            $mpdf->WriteHTML($css, \Mpdf\HTMLParserMode::HEADER_CSS);
        }
        $mpdf->WriteHTML($html, \Mpdf\HTMLParserMode::HTML_BODY);
        return $mpdf->Output('Reporte_de_tareas_completadas.pdf', 'I');
    }









public function ObtenerTareasEnProcesoJefe($idUsuario)
{
    try {
        $tareas = DB::table('tareas')
            ->join('proyectos', 'tareas.id_proyecto', '=', 'proyectos.id_proyecto') // Unimos las tareas con los proyectos
            ->where('tareas.id_usuario', $idUsuario) // Filtramos por el ID de usuario
            ->whereRaw("UPPER(TRIM(tareas.t_estatus)) = ?", ['EN PROCESO']) // Filtramos solo tareas con estatus "EN PROCESO"
            ->select('tareas.*', 'proyectos.p_nombre') // Seleccionamos las tareas y el nombre del proyecto
            ->get();

        if ($tareas->isEmpty()) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se encontraron tareas en proceso para este usuario'
            ], 404);
        }

        $tareasAgrupadas = $tareas->groupBy('id_proyecto');
        $proyectosConTareas = $tareasAgrupadas->map(function ($tareasPorProyecto, $idProyecto) {
            return [
                'proyecto_id' => $idProyecto,
                'p_nombre' => $tareasPorProyecto->first()->p_nombre, 
                'tareas' => $tareasPorProyecto
            ];
        })->values();

        return response()->json([
            'success' => true,
            'tareas' => $proyectosConTareas
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}
//SE UTILIZA EN LA INTERFAZ DE TAREAS COMPLETADAS
public function ObtenerTareasCompletadasUsuario($idUsuario)
{
    try {
        $tareas = DB::table('tareas')
            ->where('tareas.id_usuario', $idUsuario) // Filtramos por el ID de usuario
            ->whereRaw("UPPER(TRIM(tareas.t_estatus)) = ?", ['FINALIZADA']) // Filtramos solo tareas con estatus "FINALIZADO"
            ->select('tareas.*') 
            ->get();
        if ($tareas->isEmpty()) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se encontraron tareas completadas para este usuario'
            ], 404);
        }
        $tareasConProyectos = $tareas->map(function ($tarea) {
            $proyecto = DB::table('proyectos')
                ->where('id_proyecto', $tarea->id_proyecto)
                ->first();
            $tarea->p_nombre = $proyecto ? $proyecto->p_nombre : null;
            return $tarea;
        });
        return response()->json([
            'success' => true,
            'tareas' => $tareasConProyectos
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
    ->where('p.id_departamento', $idDepartamento)
    ->whereIn(DB::raw('LOWER(t.t_estatus)'), ['en proceso']) // solo tareas en proceso
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


}