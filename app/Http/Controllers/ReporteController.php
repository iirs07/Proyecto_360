<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Mpdf\Mpdf;
use App\Models\Proyecto;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth; // Necesario para obtener el usuario autenticado

class ReporteController extends Controller
{
    /**
     * Genera el reporte PDF filtrando proyectos por departamento, periodo y estatus.
     */
    public function generarPDF(Request $request)
    {
        $nombreArchivo = 'reporte_superusuario.pdf';

        // 🟢 PASO 1: Habilitar la detección de desconexión del cliente
        ignore_user_abort(false); 

        // 1️⃣ OBTENER FILTROS
        $departamentosString = $request->query('departamentos');
        $tipoProyecto = $request->query('tipoProyecto');
        $anio = $request->query('anio');
        $mes = $request->query('mes');
        $fechaInicio = $request->query('fechaInicio');
        $fechaFin = $request->query('fechaFin');

        if (empty($departamentosString)) {
            return response()->json(['message' => 'Falta seleccionar al menos un departamento.'], 400);
        }

        $depIds = explode(',', $departamentosString);
        
        // 🎯 NUEVO CÓDIGO: OBTENER NOMBRE DEL USUARIO GENERADOR
        $usuarioGeneraNombre = 'Desconocido';
        $usuarioLogin = Auth::user(); // Obtiene el modelo de la tabla 'usuario' (Auth)

        if ($usuarioLogin) {
            // Consulta la tabla c_usuario usando el ID de enlace (asumiendo id_usuario_login)
            $cUsuario = DB::table('c_usuario')
                            ->where('id_usuario', $usuarioLogin->id_usuario_login)
                            ->first();

            if ($cUsuario) {
                 // Concatena y limpia el nombre completo
                 $usuarioGeneraNombre = trim(
                     $cUsuario->u_nombre . ' ' . 
                     $cUsuario->a_paterno . ' ' . 
                     ($cUsuario->a_materno ?? '')
                 );
            }
        }
        // FIN: NUEVO CÓDIGO
        

        // 🟢 OPTIMIZACIÓN 1: Pre-cargar nombres de Jefes (evita N+1)
        $jefesPorDepartamento = DB::table('usuario as u')
            ->join('c_usuario as cu', 'u.id_usuario', '=', 'cu.id_usuario')
            ->where('u.rol', 'Jefe')
            ->whereIn('cu.id_departamento', $depIds)
            ->select('cu.id_departamento', DB::raw("CONCAT(cu.u_nombre, ' ', cu.a_paterno, ' ', cu.a_materno) as nombre_jefe"))
            ->pluck('nombre_jefe', 'id_departamento');

        // 2️⃣ CONSULTA BASE
        $query = Proyecto::query()->whereIn('id_departamento', $depIds);
        
        // Filtrar por estatus
        if ($tipoProyecto !== 'Ambos') {
            $estatusDB = ($tipoProyecto === 'Finalizados') ? 'Finalizado' : 'En proceso';
            $query->where('p_estatus', $estatusDB);
        }

        // Filtrar por fechas o año/mes
        if ($fechaInicio && $fechaFin) {
            $query->whereBetween('pf_inicio', [$fechaInicio, $fechaFin]);
        } elseif ($anio) {
            if ($mes) {
                $query->whereYear('pf_inicio', $anio)->whereMonth('pf_inicio', $mes);
            } else {
                $query->whereYear('pf_inicio', $anio);
            }
        }

        // 3️⃣ CARGAR RELACIONES Y CONTEOS OPTIMIZADOS
        $proyectos = $query->with([
                'departamento.area', 
                'encargado' => function ($query) {
                    $query->select('id_usuario', 'u_nombre', 'a_paterno', 'a_materno');
                }
            ])
            ->withCount(['tareas', 'tareasCompletadas']) 
            ->get();
            
        // 🟢 PUNTO CRÍTICO 1: Verificar si el cliente canceló después de la consulta pesada
        if (connection_aborted()) {
            return response()->json(['message' => 'Proceso cancelado por el cliente antes de generar el PDF.'], 499);
        }

        // 4️⃣ CALCULAR RESPONSABLE, AVANCE Y AGRUPAR
        $proyectosAgrupados = [];

        foreach ($proyectos as $p) {
            // Obtener responsable
            if ($p->encargado) {
                $nombreResponsable = $p->encargado->u_nombre . ' ' . $p->encargado->a_paterno . ' ' . $p->encargado->a_materno;
            } else {
                $nombreResponsable = $jefesPorDepartamento[$p->id_departamento] ?? 'Sin Asignar';
            }

            $p->responsable = $nombreResponsable;

            // Calcular porcentaje de avance (Usando los conteos de withCount)
            $total = $p->tareas_count; 
            $completadas = $p->tareas_completadas_count; 
            
            $p->avance_porcentaje = $total > 0 ? round(($completadas / $total) * 100) : 0;

            // Nombre del área y estado
            $areaNombre = $p->departamento->area->nombre ?? 'Sin Área';
            $estado = $p->p_estatus;

            // Agrupar
            $proyectosAgrupados[$areaNombre][$estado][] = $p;
        }

        // Ordenar por fecha de inicio ascendente (más antiguo primero)
        foreach ($proyectosAgrupados as $area => &$estados) {
            foreach ($estados as $estado => &$listaProyectos) {
                usort($listaProyectos, fn($a, $b) => strtotime($a->pf_inicio) - strtotime($b->pf_inicio));
            }
        }


        // 5️⃣ FECHA Y HORA
        date_default_timezone_set('America/Mexico_City');
        $hoy = date('d/m/Y');
        $hora = date('H:i:s');

        // 6️⃣ CONFIGURACIÓN MPDF
        $mpdf = new Mpdf([
            'format' => 'Letter',
            'margin_top' => 20,
            'margin_bottom' => 50,
            'margin_left' => 20,
            'margin_right' => 20,
        ]);

        $mpdf->showImageErrors = true;
        $mpdf->SetWatermarkImage(public_path('imagenes/logo2.png'), 0.1, [150, 200], 'C');
        $mpdf->showWatermarkImage = true;

        // 7️⃣ CSS
        $cssPath = resource_path('views/pdf/pdf.css');
        if (file_exists($cssPath)) {
            $css = file_get_contents($cssPath);
            $mpdf->WriteHTML($css, \Mpdf\HTMLParserMode::HEADER_CSS);
        }

        // 8️⃣ DATOS PARA LA VISTA
        $data = [
            'proyectosAgrupados' => $proyectosAgrupados,
            'filtros' => [
                'tipoProyecto' => $tipoProyecto,
                'fechaInicio' => $fechaInicio,
                'fechaFin' => $fechaFin,
                'anio' => $anio,
                'mes' => $mes,
            ],
            'hoy' => $hoy,
            'hora' => $hora,
            // 🎯 PASAMOS EL NOMBRE DEL USUARIO A LA VISTA
            'usuarioGenera' => $usuarioGeneraNombre, 
        ];

        // 🟢 PUNTO CRÍTICO 2: Verificar antes de renderizar el HTML final
        if (connection_aborted()) {
             return response()->json(['message' => 'Proceso cancelado durante la renderización de la vista.'], 499);
        }

        // Renderizar vista
        $html = view('pdf.reporte_superusuario', $data)->render();

        // 9️⃣ FOOTER
        $mpdf->SetHTMLFooter(
            '<div style="text-align:center; font-size:11px; color:#666;">
                Sistema de Gestión de Proyectos - H. Ayuntamiento de Minatitlán - Página {PAGENO} de {nbpg}
            </div>'
        );

        $mpdf->WriteHTML($html, \Mpdf\HTMLParserMode::HTML_BODY);

        // 10️⃣ RESPUESTA
        return response($mpdf->Output('', 'S'), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="'.$nombreArchivo.'"');
    }
}