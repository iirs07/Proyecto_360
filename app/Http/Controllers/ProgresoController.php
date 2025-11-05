<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgresoController extends Controller
{
    public function obtenerProgresosPorDepartamento($depId)
    {
        // Obtener los proyectos del departamento
        $proyectos = DB::table('proyectos')
            ->where('id_departamento', $depId)
            ->get();

        // Calcular progreso de cada proyecto
        $progresos = DB::table('tareas')
            ->select(
                'id_proyecto',
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN t_estatus = 'Completada' THEN 1 ELSE 0 END) as completadas")
            )
            ->whereIn('id_proyecto', $proyectos->pluck('id_proyecto'))
            ->groupBy('id_proyecto')
            ->get();

        // Mapear resultados y agregar responsable
             $resultado = $proyectos->map(function($p) use ($progresos, $depId) {
            $prog = $progresos->firstWhere('id_proyecto', $p->id_proyecto);
            $total = $prog->total ?? 0;
            $completadas = $prog->completadas ?? 0;
            $porcentaje = $total > 0 ? round(($completadas / $total) * 100) : 0;

            // Obtener responsable: primer usuario con rol 'Jefe' del departamento
            $responsable = DB::table('usuario as u')
                ->join('c_usuario as cu', 'u.id_usuario', '=', 'cu.id_usuario')
                ->where('u.rol', 'Jefe')
                ->where('cu.id_departamento', $depId)
                ->select('cu.u_nombre', 'cu.a_paterno', 'cu.a_materno')
                ->first();

            $nombreResponsable = $responsable
                ? $responsable->u_nombre . ' ' . $responsable->a_paterno . ' ' . $responsable->a_materno
                : '';

            return [
                'id_proyecto' => $p->id_proyecto,
                'p_nombre' => $p->p_nombre,
                'pf_inicio' => $p->pf_inicio,
                'pf_fin' => $p->pf_fin,
                'p_estatus' => $p->p_estatus,
                'descripcion' => $p->descripcion,  // soporta acentos
                'total_tareas' => $total,
                'tareas_completadas' => $completadas,
                'porcentaje' => $porcentaje,
                'responsable' => $nombreResponsable,
            ];
        });

        // Devolver JSON con acentos correctamente
        return response()->json($resultado, 200, [], JSON_UNESCAPED_UNICODE);
    }
}
