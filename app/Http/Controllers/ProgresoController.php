<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Proyecto;
use App\Models\Tarea;
use App\Models\CUsuario;

class ProgresoController extends Controller
{
    public function obtenerProgresosPorDepartamento($depId)
    {
        // 🔹 Obtener proyectos del departamento
        $proyectos = Proyecto::where('id_departamento', $depId)
            ->select('id_proyecto', 'p_nombre', 'pf_inicio', 'pf_fin', 'p_estatus', 'descripcion')
            ->get();

        if ($proyectos->isEmpty()) {
            return response()->json([], 200);
        }

        // 🔹 Obtener progreso de tareas por proyecto (solo UNA consulta)
        $progresos = Tarea::select(
                'id_proyecto',
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN t_estatus = 'Completada' THEN 1 ELSE 0 END) as completadas")
            )
            ->whereIn('id_proyecto', $proyectos->pluck('id_proyecto'))
            ->groupBy('id_proyecto')
            ->get()
            ->keyBy('id_proyecto');

        // 🔹 Obtener responsable (1 sola consulta)
        $responsable = DB::table('usuario as u')
            ->join('c_usuario as cu', 'u.id_usuario', '=', 'cu.id_usuario')
            ->where('u.rol', 'Jefe')
            ->where('cu.id_departamento', $depId)
            ->select('cu.u_nombre', 'cu.a_paterno', 'cu.a_materno')
            ->first();

        $nombreResponsable = $responsable
            ? trim("{$responsable->u_nombre} {$responsable->a_paterno} {$responsable->a_materno}")
            : 'Sin responsable';

        // 🔹 Mapear resultados con cálculos
        $resultado = $proyectos->map(function ($p) use ($progresos, $nombreResponsable) {
            $prog = $progresos->get($p->id_proyecto);
            $total = $prog->total ?? 0;
            $completadas = $prog->completadas ?? 0;
            $porcentaje = $total > 0 ? round(($completadas / $total) * 100) : 0;

            return [
                'id_proyecto'       => $p->id_proyecto,
                'p_nombre'          => $p->p_nombre,
                'pf_inicio'         => $p->pf_inicio,
                'pf_fin'            => $p->pf_fin,
                'p_estatus'         => $p->p_estatus,
                'descripcion'       => $p->descripcion,
                'total_tareas'      => $total,
                'tareas_completadas'=> $completadas,
                'porcentaje'        => $porcentaje,
                'responsable'       => $nombreResponsable,
            ];
        });

        return response()->json($resultado, 200, [], JSON_UNESCAPED_UNICODE);
    }
}
