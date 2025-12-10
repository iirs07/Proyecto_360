<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Mpdf\Mpdf;
use App\Models\Proyecto;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ReporteController extends Controller
{
    public function generarPDF(Request $request)
    {
        $nombreArchivo = 'reporte_superusuario.pdf';
        ignore_user_abort(false);

        // 1. Parámetros de filtro
        $departamentosString = $request->query('departamentos');
        $tipoProyecto        = $request->query('tipoProyecto', 'Ambos');
        $fechaInicio         = $request->query('fechaInicio');
        $fechaFin            = $request->query('fechaFin');
        $anio                = $request->query('anio');
        $mes                 = $request->query('mes'); 

        if (empty($departamentosString)) {
            return response()->json(['message' => 'Debe seleccionar al menos un departamento.'], 400);
        }

        $depIds = explode(',', $departamentosString);
        $mesNumero = $mes ? (int) substr($mes, 0, 2) : null;

        // 2. Usuario que genera el reporte
        $usuarioGeneraNombre = 'Desconocido';
        if (Auth::check()) {
            $usuario = Auth::user();
            $cu = DB::table('c_usuario')->where('id_usuario', $usuario->id_usuario_login)->first();
            if ($cu) {
                $usuarioGeneraNombre = trim(($cu->u_nombre ?? '') . ' ' . ($cu->a_paterno ?? '') . ' ' . ($cu->a_materno ?? ''));
            }
        }

        // 3. Jefes de cada departamento
        $jefesPorDepartamento = DB::table('usuario as u')
            ->join('c_usuario as cu', 'u.id_usuario', '=', 'cu.id_usuario')
            ->where('u.rol', 'Jefe')
            ->whereIn('cu.id_departamento', $depIds)
            ->select('cu.id_departamento', DB::raw("CONCAT(cu.u_nombre, ' ', cu.a_paterno, ' ', cu.a_materno) as nombre"))
            ->pluck('nombre', 'cu.id_departamento');

        // 4. Construcción de fechas según filtro
        try {
            if ($anio && !$mes) {
                $fechaInicioObj = Carbon::create($anio, 1, 1)->startOfDay();
                $fechaFinObj    = Carbon::create($anio, 12, 31)->endOfDay();
            } elseif ($anio && $mesNumero) {
                $fechaInicioObj = Carbon::create($anio, $mesNumero, 1)->startOfDay();
                $fechaFinObj    = Carbon::create($anio, $mesNumero, 1)->endOfMonth()->endOfDay();
            } else {
                $fechaInicioObj = $fechaInicio ? Carbon::parse($fechaInicio)->startOfDay() : Carbon::now()->subMonths(3)->startOfDay();
                $fechaFinObj    = $fechaFin    ? Carbon::parse($fechaFin)->endOfDay()    : Carbon::now()->endOfDay();
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Formato de fecha incorrecto.'], 400);
        }

        $proyectos = collect();

        // 5. Determinar el trimestre actual de la BD principal
        $hoy = Carbon::now();
        $mesActual = $hoy->month;
        $trimestreActual = ceil($mesActual / 3);
        $inicioTrimestreActual = Carbon::create($hoy->year, ($trimestreActual - 1) * 3 + 1, 1)->startOfDay();
        $finTrimestreActual    = Carbon::create($hoy->year, $trimestreActual * 3, 1)->endOfMonth()->endOfDay();

        // 6. CONSULTA BD PRINCIPAL (Trimestre actual)
        if ($fechaFinObj >= $inicioTrimestreActual) {
            $inicio = max($fechaInicioObj, $inicioTrimestreActual);
            $fin    = $fechaFinObj;

            $query = Proyecto::on('pgsql')->whereIn('id_departamento', $depIds);

            if ($tipoProyecto !== 'Ambos') {
                $query->where('p_estatus', $tipoProyecto === 'Finalizados' ? 'Finalizado' : 'En proceso');
            }

            $query->whereBetween('pf_fin', [$inicio, $fin]);

            $proyectos = $proyectos->merge(
                $query->with(['departamento.area', 'encargado'])
                      ->withCount(['tareas', 'tareasCompletadas'])
                      ->get()
            );
        }

        // 7. CONSULTA BD HISTÓRICA (Trimestres anteriores)
        if ($fechaInicioObj < $inicioTrimestreActual) {
            $inicio = $fechaInicioObj;
            $fin    = min($fechaFinObj, $inicioTrimestreActual->copy()->subSecond());

            $query = Proyecto::on('pgsql_second')->whereIn('id_departamento', $depIds);

            if ($tipoProyecto !== 'Ambos') {
                $query->where('p_estatus', $tipoProyecto === 'Finalizados' ? 'Finalizado' : 'En proceso');
            }

            $query->whereBetween('pf_fin', [$inicio, $fin]);

            $proyectos = $proyectos->merge(
                $query->with(['departamento.area', 'encargado'])
                      ->withCount(['tareas', 'tareasCompletadas'])
                      ->get()
            );
        }

        if (connection_aborted()) {
            return response()->json(['message' => 'El usuario canceló la descarga.'], 499);
        }

        $conteoProyectos = $proyectos->count();

        if ($conteoProyectos === 0) {
            return response()->json([
                'message' => 'No se encontraron proyectos',
                'total' => 0
            ], 400);
        }

        // 8. Procesar resultados
        $proyectosAgrupados = [];

        foreach ($proyectos as $p) {
            $p->responsable = $p->encargado
                ? trim(($p->encargado->u_nombre ?? '') . ' ' . ($p->encargado->a_paterno ?? '') . ' ' . ($p->encargado->a_materno ?? ''))
                : ($jefesPorDepartamento[$p->id_departamento] ?? 'Sin Asignar');

            $p->avance_porcentaje = ($p->tareas_count > 0)
                ? round(($p->tareas_completadas_count / $p->tareas_count) * 100)
                : 0;

            $areaNombre = $p->departamento?->area?->nombre ?? 'Sin Área';
            $estado     = $p->p_estatus ?? 'Sin Estado';

            $proyectosAgrupados[$areaNombre][$estado][] = $p;
        }

        // Ordenar por pf_fin
        foreach ($proyectosAgrupados as $area => &$estados) {
            foreach ($estados as $estado => &$lista) {
                usort($lista, fn($a, $b) => strtotime($a->pf_fin) - strtotime($b->pf_fin));
            }
        }

        // 9. Preparar datos para la vista PDF
        $data = [
            'proyectosAgrupados' => $proyectosAgrupados,
            'filtros' => compact('tipoProyecto', 'fechaInicio', 'fechaFin', 'anio', 'mes'),
            'hoy'     => date('d/m/Y'),
            'hora'    => date('H:i:s'),
            'usuarioGenera' => $usuarioGeneraNombre,
            'totalProyectos' => $conteoProyectos
        ];

        $html = view('pdf.reporte_superusuario', $data)->render();

        if (empty(trim($html))) {
            return response()->json([
                'message' => 'No hay datos válidos para generar el PDF. (Total: ' . $conteoProyectos . ')',
                'total' => $conteoProyectos
            ], 400);
        }

        // 10. Generar PDF
        try {
            $mpdf = new Mpdf([
                'format' => 'Letter',
                'margin_top' => 20,
                'margin_bottom' => 50,
                'margin_left'  => 20,
                'margin_right' => 20
            ]);

            $mpdf->showImageErrors = true;
            $mpdf->SetWatermarkImage(public_path('imagenes/logo2.png'), 0.1, [150, 200], 'C');
            $mpdf->showWatermarkImage = true;

            $css = resource_path('views/pdf/pdf.css');
            if (file_exists($css)) {
                $mpdf->WriteHTML(file_get_contents($css), \Mpdf\HTMLParserMode::HEADER_CSS);
            }

            $mpdf->SetHTMLFooter('<div style="text-align:center;font-size:11px;color:#666;">Sistema de Gestión de Proyectos - H. Ayuntamiento de Minatitlán - Página {PAGENO} de {nbpg}</div>');
            $mpdf->WriteHTML($html, \Mpdf\HTMLParserMode::HTML_BODY);

            return response($mpdf->Output('', 'S'), 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="' . $nombreArchivo . '"');

        } catch (\Mpdf\MpdfException $e) {
            return response()->json([
                'message' => 'Error al generar el PDF.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
