<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Evidencia;
use App\Models\Tarea;
use App\Models\HistorialModificacion;
use App\Models\Proyecto;
use App\Models\Usuario;
use App\Models\CUsuario;
use Carbon\Carbon;
use Mpdf\Mpdf;

class ReporteJefeController extends Controller
{
    //METODO PARA REPORTES DE TAREAS COMPLETADAS DE UN USUARIO
public function generarReporteCompletadas(Request $request)
{
    $idUsuario = $request->query('id_usuario');
    $fechaInicio = $request->query('fechaInicio');
    $fechaFin    = $request->query('fechaFin');

    // Validación básica de fechas
    if (!$fechaInicio || !$fechaFin) {
        return response()->json(['message' => 'Debes seleccionar un rango de fechas.'], 400);
    }
    if (Carbon::parse($fechaInicio)->gt(Carbon::parse($fechaFin))) {
        return response()->json(['message' => 'La fecha de inicio no puede ser mayor que la fecha fin.'], 400);
    }

    ignore_user_abort(false);
    set_time_limit(0);

    date_default_timezone_set('America/Mexico_City');   
    $hoy = Carbon::now()->format('d/m/Y');
    $hora = Carbon::now()->format('H:i:s');

    // Usuario
    $usuarioData = CUsuario::with('departamento')->find($idUsuario);
    if (!$usuarioData) {
        return response()->json(['error' => 'Usuario no encontrado.'], 404);
    }
    $usuario = [
        'nombre'      => $usuarioData->u_nombre ?? '',
        'a_paterno'   => $usuarioData->a_paterno ?? '',
        'a_materno'   => $usuarioData->a_materno ?? '',
        'departamento'=> $usuarioData->departamento->d_nombre ?? 'N/A',
    ];

    $tareas = collect();

    // Fechas de corte para separar Histórico vs Actual
    $hoyCarbon = Carbon::now();
    $mesActual = $hoyCarbon->month;
    $trimestreActual = ceil($mesActual / 3);
    $inicioTrimestreActual = Carbon::create($hoyCarbon->year, ($trimestreActual - 1) * 3 + 1, 1)->startOfDay();

    // ---------------------------------------------------------
    // 1. CONSULTA A LA BD HISTÓRICA (pgsql_second)
    // ---------------------------------------------------------
    // Solo entramos si la fecha de inicio es anterior al trimestre actual
    if (Carbon::parse($fechaInicio) < $inicioTrimestreActual) {
        $inicio = Carbon::parse($fechaInicio);
        // El fin será lo que ocurra primero: la fecha fin del usuario o un segundo antes de que empiece el trimestre actual
        $fin    = min(Carbon::parse($fechaFin), $inicioTrimestreActual->copy()->subSecond());

        $queryHistorica = Tarea::on('pgsql_second')
            ->where('id_usuario', $idUsuario)
            ->where('t_estatus', 'Completada')
            ->where(function($q) use ($inicio, $fin) {
                $q->whereBetween('tf_completada', [$inicio, $fin])
                  ->orWhereNull('tf_completada'); 
            });

        $tareas = $tareas->merge($queryHistorica->get());
    }

    // ---------------------------------------------------------
    // 2. CONSULTA A LA BD ACTUAL (pgsql / default)
    // ---------------------------------------------------------
    // Esta es la parte que te faltaba. Si la fecha fin es igual o mayor al inicio del trimestre, buscamos en la BD actual.
    if (Carbon::parse($fechaFin) >= $inicioTrimestreActual) {
        // El inicio será: o el inicio del trimestre, o la fecha que pidió el usuario (la que sea mayor)
        $inicioActual = max(Carbon::parse($fechaInicio), $inicioTrimestreActual);
        $finActual    = Carbon::parse($fechaFin);

        $queryActual = Tarea::on('pgsql') // Conexión por defecto
            ->where('id_usuario', $idUsuario)
            ->where('t_estatus', 'Completada')
            ->whereBetween('tf_completada', [$inicioActual, $finActual]);

        $tareas = $tareas->merge($queryActual->get());
    }

    // Revisar si el usuario cerró la conexión
    if (connection_aborted()) { return; }

    $tipo = 'completadas-jefe';

    // Generar HTML para PDF
    $html = view('pdf.ReportesJefe', [
        'tareas' => $tareas,
        'usuario' => $usuario,
        'inicio' => $fechaInicio,
        'fin' => $fechaFin,
        'tipo' => $tipo,
        'hoy' => $hoy,
        'hora' => $hora
    ])->render();

    if (connection_aborted()) { return; }

    // Generar PDF
    $mpdf = new \Mpdf\Mpdf();
    $mpdf->showImageErrors = true;
    // Asegúrate que esta ruta sea correcta en tu servidor
    if(file_exists(public_path('imagenes/logo2.png'))){
        $mpdf->SetWatermarkImage(public_path('imagenes/logo2.png'), 0.1, [150, 200], 'C');
        $mpdf->showWatermarkImage = true;
    }

    $cssPath = resource_path('css/PdfTareasCompletadas.css');
    if (file_exists($cssPath)) {
        $css = file_get_contents($cssPath);
        $mpdf->WriteHTML($css, \Mpdf\HTMLParserMode::HEADER_CSS);
    }

    $mpdf->WriteHTML($html, \Mpdf\HTMLParserMode::HTML_BODY);

    return $mpdf->Output('Reporte_de_tareas_completadas.pdf', 'I');
}


}