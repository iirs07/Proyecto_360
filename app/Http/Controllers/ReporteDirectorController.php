<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tarea;
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

        switch ($tipo) {
            case 'proximas':
                $inicio = $fechaInicio ?? $hoy;
                $fin = $fechaFin ?? date('Y-m-d', strtotime('+7 days'));
                $tareas = Tarea::with('proyecto', 'usuario.departamento')
                               ->whereBetween('tf_fin', [$inicio, $fin])
                               ->get();
                $nombreArchivo = 'Reporte_tareas_proximas_a_vencer.pdf';
                break;

            case 'completadas':
                // AGREGAR FILTRO POR FECHAS PARA TAREAS COMPLETADAS
                $inicio = $fechaInicio ? Carbon::parse($fechaInicio)->toDateString() : null;
                $fin = $fechaFin ? Carbon::parse($fechaFin)->toDateString() : null;

                $query = Tarea::with('proyecto', 'usuario.departamento')
                               ->where('t_estatus', 'Completado');

                // Filtrar por rango de fechas si se proporcionan
                if ($inicio && $fin) {
                    $query->whereBetween('tf_fin', [$inicio, $fin]);
                } elseif ($inicio) {
                    $query->whereDate('tf_fin', '>=', $inicio);
                } elseif ($fin) {
                    $query->whereDate('tf_fin', '<=', $fin);
                }

                $tareas = $query->get();
                $nombreArchivo = 'Reporte_tareas_completadas.pdf';
                break;

            case 'vencidas':
            default:
                $inicio = $fechaInicio ? Carbon::parse($fechaInicio)->toDateString() : null;
                $fin = $fechaFin ? Carbon::parse($fechaFin)->toDateString() : Carbon::now()->toDateString();

                $query = Tarea::with('proyecto', 'usuario.departamento');
                if ($inicio) {
                    $query->whereDate('tf_fin', '>=', $inicio)
                          ->whereDate('tf_fin', '<=', $fin);
                } else {
                    $query->whereDate('tf_fin', '<=', $fin);
                }

                $tareas = $query->get();
                $nombreArchivo = 'Reporte_tareas_vencidas.pdf';
                break;
        }
        $mpdf = new Mpdf([
            'format' => 'Letter',
            'margin_top' => 20,
            'margin_bottom' => 50,
            'margin_left' => 20,
            'margin_right' => 20
        ]);

        $mpdf->showImageErrors = true;
        $mpdf->SetWatermarkImage(public_path('imagenes/logo2.png'), 0.1, [150, 200], 'C');
        $mpdf->showWatermarkImage = true;
        $cssPath = resource_path('css/PdfDirector.css');
        if (file_exists($cssPath)) {
            $css = file_get_contents($cssPath);
            $mpdf->WriteHTML($css, \Mpdf\HTMLParserMode::HEADER_CSS);
        }
        $html = view('pdf.ReportesDirector', [
            'tareas' => $tareas,
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



