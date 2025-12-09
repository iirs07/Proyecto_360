<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tarea;
use App\Models\HistorialModificacion;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Mpdf\Mpdf;

class ReporteDirectorController extends Controller
{
    public function generarPDF(Request $request)
    {
        $tipo = $request->query('tipos', 'vencidas'); 
        // Renombramos las variables para ser más claros:
        $fechaInicioFiltro = $request->query('fechaInicio'); 
        $fechaFinFiltro = $request->query('fechaFin');       
        
        date_default_timezone_set('America/Mexico_City');   
        $hoy = date('Y-m-d');
        $hora = date('h:i:s A');

        $idDepartamento = $request->query('id_departamento', null);
        $departamentoNombre = null;

        if ($idDepartamento) {
            $departamento = DB::table('c_departamento')
                              ->where('id_departamento', $idDepartamento)
                              ->first();
            $departamentoNombre = $departamento ? $departamento->d_nombre : '';
        }

        $usuario = [
            'nombre' => $request->query('nombre', ''),
            'a_paterno' => $request->query('a_paterno', ''),
            'a_materno' => $request->query('a_materno', ''),
            'departamento' => $departamentoNombre
        ];

        // 🔹 Determinar trimestre actual
        $hoyCarbon = Carbon::now();
        $mesActual = $hoyCarbon->month;
        $trimestreActual = ceil($mesActual / 3);
        $inicioTrimestreActual = Carbon::create($hoyCarbon->year, ($trimestreActual - 1) * 3 + 1, 1)->startOfDay();

        $tareas = collect();
        $movimientos = collect(); 
        $vistaPDF = 'pdf.ReportesDirector';

        // Variables de fecha que se pasan a la VISTA/PDF para mostrar el rango
        $inicio = null;
        $fin = null;
        
        // Variables de fecha que se usan para la CONSULTA a la DB
        $inicio_db = null;
        $fin_db = null;

        switch ($tipo) {
            case 'modificaciones':
                // Para historial, usamos el rango de filtro o HOY por defecto
                $inicio = $fechaInicioFiltro ? Carbon::parse($fechaInicioFiltro)->startOfDay() : Carbon::now()->startOfDay();
                $fin = $fechaFinFiltro ? Carbon::parse($fechaFinFiltro)->endOfDay() : Carbon::now()->endOfDay();
                $inicio_db = $inicio;
                $fin_db = $fin;

                $query = HistorialModificacion::join('proyectos', 'historial_modificaciones.id_proyecto', '=', 'proyectos.id_proyecto')
                    ->join('c_usuario', 'historial_modificaciones.id_usuario', '=', 'c_usuario.id_usuario')
                    ->leftJoin('tareas', 'historial_modificaciones.id_tarea', '=', 'tareas.id_tarea')
                    ->select(
                        'historial_modificaciones.*',
                        'proyectos.p_nombre as proyecto',
                        'c_usuario.u_nombre as usuario_nombre',
                        'c_usuario.a_paterno',
                        'c_usuario.a_materno',
                        'tareas.t_nombre as tarea'
                    )
                    ->whereBetween('historial_modificaciones.created_at', [$inicio_db, $fin_db]);

                if ($idDepartamento) {
                    $query->where('proyectos.id_departamento', $idDepartamento);
                }

                $movimientos = $query->orderBy('historial_modificaciones.created_at', 'DESC')->get();
                
                $nombreArchivo = 'Reporte_Historial_Modificaciones.pdf';
                $vistaPDF = 'pdf.ReporteModificaciones';
                break;

            case 'proximas':
                // 💡 CORRECCIÓN: Usamos el filtro para el título, y HOY para la consulta.
                
                // Rango para la VISTA (PDF Title): Usamos el rango del filtro o el default.
                $inicio = $fechaInicioFiltro ? Carbon::parse($fechaInicioFiltro)->toDateString() : $hoy;
                $fin = $fechaFinFiltro ? Carbon::parse($fechaFinFiltro)->toDateString() : date('Y-m-d', strtotime('+7 days'));
                
                // Rango para la CONSULTA (Database Query): Siempre debe comenzar desde HOY para "Próximas".
                $inicio_db = $hoy;
                $fin_db = $fin; // El fin es el fin del filtro

                // Lógica de Base de Datos para el trimestre actual (pgsql)
                if ($fin_db >= $inicioTrimestreActual->toDateString()) {
                     // El inicio principal es el máximo entre $hoy (inicio_db) y el inicio del trimestre
                     $inicioPrincipal = max($inicio_db, $inicioTrimestreActual->toDateString());
                     $tareas = $tareas->merge(
                        Tarea::on('pgsql')
                                 ->with('proyecto', 'usuario.departamento')
                                 ->whereBetween('tf_fin', [$inicioPrincipal, $fin_db])
                                 ->get()
                     );
                 }
                 
                 // Lógica de Base de Datos para el trimestre anterior (pgsql_second)
                 $inicio_for_second_db = $fechaInicioFiltro ? Carbon::parse($fechaInicioFiltro)->toDateString() : null;

                 if ($inicio_for_second_db && $inicio_for_second_db < $inicioTrimestreActual->toDateString()) {
                     $finHistorico = min($fin_db, $inicioTrimestreActual->copy()->subSecond()->toDateString());
                     
                     $tareas = $tareas->merge(
                        Tarea::on('pgsql_second')
                                 ->with('proyecto', 'usuario.departamento')
                                 // Buscamos tareas en el trimestre anterior cuya fecha de fin es >= $hoy (futuras).
                                 ->whereDate('tf_fin', '>=', $hoy)
                                 ->whereDate('tf_fin', '<=', $finHistorico)
                                 ->get()
                     );
                 }

                $nombreArchivo = 'Reporte_tareas_proximas_a_vencer.pdf';
                $vistaPDF = 'pdf.ReportesDirector';
                break;

            case 'completadas':
                // Lógica de obtención de tareas completadas...
                $inicio = $fechaInicioFiltro ? Carbon::parse($fechaInicioFiltro)->toDateString() : null;
                $fin = $fechaFinFiltro ? Carbon::parse($fechaFinFiltro)->toDateString() : null;
                $inicio_db = $inicio;
                $fin_db = $fin;

                 if ($fin_db && $fin_db >= $inicioTrimestreActual->toDateString()) {
                     $inicioPrincipal = $inicio_db && $inicio_db >= $inicioTrimestreActual->toDateString() ? $inicio_db : $inicioTrimestreActual->toDateString();
                     $tareas = $tareas->merge(
                        Tarea::on('pgsql')
                                 ->with('proyecto', 'usuario.departamento')
                                 ->where('t_estatus', 'Completado')
                                 ->whereBetween('tf_fin', [$inicioPrincipal, $fin_db])
                                 ->get()
                     );
                 }
                 if ($inicio_db && $inicio_db < $inicioTrimestreActual->toDateString()) {
                     $finHistorico = $fin_db && $fin_db < $inicioTrimestreActual->toDateString() ? $fin_db : $inicioTrimestreActual->copy()->subSecond()->toDateString();
                     $inicioHistorico = $inicio_db;
                     $tareas = $tareas->merge(
                        Tarea::on('pgsql_second')
                                 ->with('proyecto', 'usuario.departamento')
                                 ->where('t_estatus', 'Completado')
                                 ->whereBetween('tf_fin', [$inicioHistorico, $finHistorico])
                                 ->get()
                     );
                 }

                $nombreArchivo = 'Reporte_tareas_completadas.pdf';
                $vistaPDF = 'pdf.ReportesDirector';
                break;

            case 'vencidas':
            default:
                // TAREAS VENCIDAS: Rango siempre histórico. $fin nunca es futuro.
                $inicio = $fechaInicioFiltro ? Carbon::parse($fechaInicioFiltro)->toDateString() : null;
                $fin = $fechaFinFiltro ? Carbon::parse($fechaFinFiltro)->toDateString() : Carbon::now()->toDateString();
                $inicio_db = $inicio;
                $fin_db = $fin;

                if ($fin_db >= $inicioTrimestreActual->toDateString()) {
                    $inicioPrincipal = $inicio_db && $inicio_db >= $inicioTrimestreActual->toDateString() ? $inicio_db : $inicioTrimestreActual->toDateString();
                    $tareas = $tareas->merge(
                        Tarea::on('pgsql')
                                ->with('proyecto', 'usuario.departamento')
                                ->whereDate('tf_fin', '<=', $fin_db)
                                ->when($inicioPrincipal, fn($q) => $q->whereDate('tf_fin', '>=', $inicioPrincipal))
                                ->get()
                    );
                }
                if ($inicio_db && $inicio_db < $inicioTrimestreActual->toDateString()) {
                    $finHistorico = min($fin_db, $inicioTrimestreActual->copy()->subSecond()->toDateString());
                    $tareas = $tareas->merge(
                        Tarea::on('pgsql_second')
                                ->with('proyecto', 'usuario.departamento')
                                ->whereDate('tf_fin', '<=', $finHistorico)
                                ->whereDate('tf_fin', '>=', $inicio_db)
                                ->get()
                    );
                }

                $nombreArchivo = 'Reporte_tareas_vencidas.pdf';
                $vistaPDF = 'pdf.ReportesDirector';
                break;
        }

        // 🔹 Generación de PDF
        $mpdf = new Mpdf([
            'format' => 'Letter',
            'margin_top' => 20,
            'margin_bottom' => 50,
            'margin_left' => 20,
            'margin_right' => 20,
             'default_font' => 'dejavusans' 
        ]);

        $mpdf->showImageErrors = true;
        $mpdf->SetWatermarkImage(public_path('imagenes/logo2.png'), 0.1, [150, 200], 'C');
        $mpdf->showWatermarkImage = true;

        $cssPath = resource_path('css/PdfDirector.css');
        if (file_exists($cssPath)) {
            $css = file_get_contents($cssPath);
            $mpdf->WriteHTML($css, \Mpdf\HTMLParserMode::HEADER_CSS);
        }

        $html = view($vistaPDF, [
            'tareas' => $tareas,
            'movimientos' => $movimientos, 
            'hoy' => $hoy,
            'hora' => $hora,
            'usuario' => $usuario,
            'tipo' => $tipo,
            'inicio' => $inicio, // Ahora usa el rango del filtro/default para el título del PDF
            'fin' => $fin        // Ahora usa el rango del filtro/default para el título del PDF
        ])->render();

        $mpdf->SetHTMLFooter(
            '<div style="text-align:center; font-size:11px; color:#666;">
                 Sistema de Gestión de Proyectos - H. Ayuntamiento de Minatitlán
            </div>',
            'FIRST'
        );
        $mpdf->SetHTMLFooter(
            '<div style="text-align:center; font-size:11px; color:#666;">
                 Sistema de Gestión de Proyectos - H. Ayuntamiento de Minatitlán - Página {PAGENO} de {nbpg}
            </div>',
            'OTHER'
        );

        $mpdf->WriteHTML($html, \Mpdf\HTMLParserMode::HTML_BODY);
        $pdfContent = $mpdf->Output('', 'S');
        
        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="' . $nombreArchivo . '"')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }
}
