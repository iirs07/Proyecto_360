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
        $tipo = $request->query('tipo', 'vencidas'); 
        $fechaInicio = $request->query('fechaInicio'); 
        $fechaFin = $request->query('fechaFin');    
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
        
        // CORRECCIÓN 1: Inicializar variables por defecto
        $movimientos = collect(); 
        $vistaPDF = 'pdf.ReportesDirector'; 

        switch ($tipo) {
            case 'modificaciones':
                $inicio = $fechaInicio ? Carbon::parse($fechaInicio)->startOfDay() : Carbon::now()->startOfDay();
                $fin = $fechaFin ? Carbon::parse($fechaFin)->endOfDay() : Carbon::now()->endOfDay();

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
                    ->whereBetween('historial_modificaciones.created_at', [$inicio, $fin]);

                // Filtrar por departamento si existe
                if ($idDepartamento) {
                    $query->where('proyectos.id_departamento', $idDepartamento);
                }

                $movimientos = $query->orderBy('historial_modificaciones.created_at', 'DESC')->get();
                
                $nombreArchivo = 'Reporte_Historial_Modificaciones.pdf';
                
                // CORRECCIÓN 2: Cambiar la vista a usar
                $vistaPDF = 'pdf.ReporteModificaciones'; 
                break;

            case 'proximas':
                $inicio = $fechaInicio ?? $hoy;
                $fin = $fechaFin ?? date('Y-m-d', strtotime('+7 days'));

                if ($fin >= $inicioTrimestreActual->toDateString()) {
                    $inicioPrincipal = max($inicio, $inicioTrimestreActual->toDateString());
                    $tareas = $tareas->merge(
                        Tarea::on('pgsql')
                                 ->with('proyecto', 'usuario.departamento')
                                 ->whereBetween('tf_fin', [$inicioPrincipal, $fin])
                                 ->get()
                    );
                }
                if ($inicio < $inicioTrimestreActual->toDateString()) {
                    $finHistorico = min($fin, $inicioTrimestreActual->copy()->subSecond()->toDateString());
                    $tareas = $tareas->merge(
                        Tarea::on('pgsql_second')
                                 ->with('proyecto', 'usuario.departamento')
                                 ->whereBetween('tf_fin', [$inicio, $finHistorico])
                                 ->get()
                    );
                }

                $nombreArchivo = 'Reporte_tareas_proximas_a_vencer.pdf';
                break;

            case 'completadas':
                $inicio = $fechaInicio ? Carbon::parse($fechaInicio)->toDateString() : null;
                $fin = $fechaFin ? Carbon::parse($fechaFin)->toDateString() : null;

                if ($fin && $fin >= $inicioTrimestreActual->toDateString()) {
                    $inicioPrincipal = $inicio && $inicio >= $inicioTrimestreActual->toDateString() ? $inicio : $inicioTrimestreActual->toDateString();
                    $tareas = $tareas->merge(
                        Tarea::on('pgsql')
                                 ->with('proyecto', 'usuario.departamento')
                                 ->where('t_estatus', 'Completado')
                                 ->whereBetween('tf_fin', [$inicioPrincipal, $fin])
                                 ->get()
                    );
                }
                if ($inicio && $inicio < $inicioTrimestreActual->toDateString()) {
                    $finHistorico = $fin && $fin < $inicioTrimestreActual->toDateString() ? $fin : $inicioTrimestreActual->copy()->subSecond()->toDateString();
                    $inicioHistorico = $inicio;
                    $tareas = $tareas->merge(
                        Tarea::on('pgsql_second')
                                 ->with('proyecto', 'usuario.departamento')
                                 ->where('t_estatus', 'Completado')
                                 ->whereBetween('tf_fin', [$inicioHistorico, $finHistorico])
                                 ->get()
                    );
                }

                $nombreArchivo = 'Reporte_tareas_completadas.pdf';
                break;

            case 'vencidas':
            default:
                $inicio = $fechaInicio ? Carbon::parse($fechaInicio)->toDateString() : null;
                $fin = $fechaFin ? Carbon::parse($fechaFin)->toDateString() : Carbon::now()->toDateString();

                if ($fin >= $inicioTrimestreActual->toDateString()) {
                    $inicioPrincipal = $inicio && $inicio >= $inicioTrimestreActual->toDateString() ? $inicio : $inicioTrimestreActual->toDateString();
                    $tareas = $tareas->merge(
                        Tarea::on('pgsql')
                                 ->with('proyecto', 'usuario.departamento')
                                 ->whereDate('tf_fin', '<=', $fin)
                                 ->when($inicioPrincipal, fn($q) => $q->whereDate('tf_fin', '>=', $inicioPrincipal))
                                 ->get()
                    );
                }
                if ($inicio && $inicio < $inicioTrimestreActual->toDateString()) {
                    $finHistorico = min($fin, $inicioTrimestreActual->copy()->subSecond()->toDateString());
                    $tareas = $tareas->merge(
                        Tarea::on('pgsql_second')
                                 ->with('proyecto', 'usuario.departamento')
                                 ->whereDate('tf_fin', '<=', $finHistorico)
                                 ->whereDate('tf_fin', '>=', $inicio)
                                 ->get()
                    );
                }

                $nombreArchivo = 'Reporte_tareas_vencidas.pdf';
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

        // CORRECCIÓN 3: Usar la variable $vistaPDF en lugar del string fijo
        $html = view($vistaPDF, [
            'tareas' => $tareas,
            'movimientos' => $movimientos, // CORRECCIÓN 4: Pasar los movimientos a la vista
            'hoy' => $hoy,
            'hora' => $hora,
            'usuario' => $usuario,
            'tipo' => $tipo,
            'inicio' => $inicio,
            'fin' => $fin
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


