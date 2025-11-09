<?php
namespace App\Http\Controllers;

use App\Models\Tarea;
use Illuminate\Http\Request;

class TareasController extends Controller
{
    public function obtenerPorProyecto($idProyecto)
    {
        // 🔹 Carga tareas + usuario + evidencias en una sola consulta
        $tareas = Tarea::with(['usuario', 'evidencias'])
            ->where('id_proyecto', $idProyecto)
            ->get();

        // 🔹 Formateamos los datos
        $resultado = $tareas->map(function ($tarea) {
            $responsable = $tarea->usuario
                ? "{$tarea->usuario->u_nombre} {$tarea->usuario->a_paterno} {$tarea->usuario->a_materno}"
                : 'No definido';

            $evidencias = $tarea->evidencias->map(function ($e) {
                return [
                    'id'    => $e->id_evidencia,
                    'url'   => $e->archivo_url,
                    'fecha' => $e->fecha,
                ];
            });

            return [
                'id_tarea'    => $tarea->id_tarea,
                'id_proyecto' => $tarea->id_proyecto,
                'id_usuario'  => $tarea->id_usuario,
                't_nombre'    => $tarea->t_nombre,
                'descripcion' => $tarea->descripcion,
                'tf_inicio'   => $tarea->tf_inicio,
                'tf_fin'      => $tarea->tf_fin,
                't_estatus'   => $tarea->t_estatus,
                'responsable' => $responsable,
                'evidencias'  => $evidencias,
            ];
        });

        return response()->json($resultado);
    }
}
