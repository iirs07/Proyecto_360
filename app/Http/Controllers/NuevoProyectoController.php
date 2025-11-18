<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Proyecto;
use App\Models\Tarea;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB; 
use App\Notifications\TareaAsignada;


class NuevoProyectoController extends Controller
{
    //CREAR PROYECTOS-NUEVOPROYECTO-NuevoProyecto.jsx
    public function GuardarNuevoProyecto(Request $request)
    {
        try {
            $proyecto = Proyecto::create($request->all());
            return response()->json([
                'success' => true,
                'proyecto' => $proyecto
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    //MOSTRAR PROYECTOS CON EL ESTATUS ENVIADO COMO PARAMETRO
    public function index()
{
    try {
        $proyectos = Proyecto::withCount(['tareas' => function($q) {
            $q->whereIn('t_estatus', ['Pendiente', 'En proceso']);
        }])->get();

        return response()->json([
            'success' => true,
            'proyectos' => $proyectos
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}
//OBTENER FECHAS PARA MOSTRAR RANGOS DISPONIBLES EN EL CALENDARIO
public function fechasProyecto($id_proyecto)
    {
        $proyecto = Proyecto::find($id_proyecto);
        if (!$proyecto) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Proyecto no encontrado'
            ], 404);
        }
        return response()->json([
            'success' => true,
            'pf_inicio' => $proyecto->pf_inicio,
            'pf_fin' => $proyecto->pf_fin
        ]);
    }
     //METODO PARA OBTENER LOS DEPARTAMENTOS
    public function CatalogoDepartamentos()
    {
        $departamentos = DB::table('c_departamento')->get();
        return response()->json($departamentos);
    }
    public function usuariosPorDepartamento($id_departamento)
{
    $usuarios = \DB::table('c_usuario')
        ->join('usuario', 'c_usuario.id_usuario', '=', 'usuario.id_usuario')
        ->where('c_usuario.id_departamento', $id_departamento)
        ->where('usuario.rol', 'Usuario')
        ->select(
    'usuario.id_usuario', 
    'c_usuario.u_nombre as nombre',
    'c_usuario.a_paterno as apaterno',
    'c_usuario.a_materno as amaterno',
    'usuario.rol'
)
        ->get();

    return response()->json($usuarios);
}
 // Crear tarea
   public function AgregarTareas(Request $request)
    {
        try {
            $tarea = Tarea::create([
                'id_proyecto' => $request->id_proyecto,
                'id_usuario'  => $request->id_usuario,
                't_nombre'    => $request->t_nombre,
                'descripcion' => $request->descripcion,
                'tf_inicio'   => $request->tf_inicio,
                'tf_fin'      => $request->tf_fin,
                't_estatus'   => 'Pendiente',
            ]);
            
            $usuario = Usuario::find($request->id_usuario);
            if ($usuario && $usuario->correo) {
                try {
                    $usuario->notify(new TareaAsignada($tarea));
                } catch (\Exception $e) {
                  
                }
            } else {
                
            }

            return response()->json([
                'success' => true,
                'message' => 'Tarea creada correctamente',
                'tarea'   => $tarea
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    //METODO QUE MUESTRA TODOS LOS PROYECTOS DE UN DEPARTAMENTO
public function ListaProyectosModificar(Request $request)
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

       $proyectos = DB::table('proyectos as p')
    ->leftJoin('tareas as t', 'p.id_proyecto', '=', 't.id_proyecto')
    ->select(
        'p.*',
        DB::raw('COUNT(t.id_tarea) as total_tareas'),
        DB::raw("SUM(CASE WHEN t.t_estatus = 'En proceso' THEN 1 ELSE 0 END) as tareas_en_proceso"),
        DB::raw("SUM(CASE WHEN t.t_estatus = 'Completado' THEN 1 ELSE 0 END) as tareas_completadas")
    )
    ->where('p.id_departamento', $idDepartamento)
    ->where('p.p_estatus', 'EN PROCESO')
    ->groupBy('p.id_proyecto')
    ->get();
        return response()->json([
            'success' => true,
            'proyectos' => $proyectos
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}
// OBTENER UN PROYECTO PARA MODIFICAR CON ID
public function show($idProyecto)
{
    try {
        $proyecto = Proyecto::find($idProyecto);

        if (!$proyecto) {
            return response()->json([
                'success' => false,
                'message' => 'Proyecto no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'proyecto' => $proyecto
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}
// MODIFICAR PROYECTO
public function update(Request $request, $idProyecto)
{
    try {
        $proyecto = Proyecto::find($idProyecto);

        if (!$proyecto) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Proyecto no encontrado'
            ], 404);
        }

        // FECHA INICIO
        $pf_inicio = $request->input('pf_inicio');
        if (!empty($pf_inicio)) {
            $pf_inicio = \Carbon\Carbon::parse($pf_inicio)->startOfDay();
        } else {
            $pf_inicio = $proyecto->pf_inicio;  // si viene vacío, no cambiar
        }

        // FECHA FIN
        $pf_fin = $request->input('pf_fin');
        if (!empty($pf_fin)) {
            $pf_fin = \Carbon\Carbon::parse($pf_fin)->endOfDay();
        } else {
            $pf_fin = $proyecto->pf_fin;
        }

        // ASIGNAR CAMPOS
        $proyecto->p_nombre = $request->input('p_nombre', $proyecto->p_nombre);
        $proyecto->descripcion = $request->input('descripcion', $proyecto->descripcion);
        $proyecto->pf_inicio = $pf_inicio;
        $proyecto->pf_fin = $pf_fin;

        $proyecto->save();

        return response()->json([
            'success' => true,
            'proyecto' => $proyecto
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}

public function ProyectosSinTareas(Request $request)
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

            // Obtener proyectos sin tareas
            $proyectosSinTareas = DB::table('proyectos as p')
                ->leftJoin('tareas as t', 'p.id_proyecto', '=', 't.id_proyecto')
                ->select('p.*')
                ->where('p.id_departamento', $idDepartamento)
                ->where('p.p_estatus', 'EN PROCESO')
                ->groupBy('p.id_proyecto')
                ->havingRaw('COUNT(t.id_tarea) = 0')
                ->get();

            return response()->json([
                'success' => true,
                'proyectos' => $proyectosSinTareas
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function EliminarProyecto($idProyecto)
{
    try {
        $proyecto = Proyecto::find($idProyecto);

        if (!$proyecto) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Proyecto no encontrado'
            ], 404);
        }

        // Eliminar el proyecto
        $proyecto->delete();

        return response()->json([
            'success' => true,
            'mensaje' => 'Proyecto eliminado correctamente'
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}
 // Cambiar estatus de un proyecto a Finalizado
    public function CambiarStatusProyecto($id)
    {
        $proyecto = Proyecto::find($id);

        if (!$proyecto) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Proyecto no encontrado'
            ], 404);
        }

        $proyecto->p_estatus = "Finalizado";
        $proyecto->save();

        return response()->json([
            'success' => true,
            'mensaje' => 'Proyecto marcado como finalizado',
            'proyecto' => $proyecto
        ]);
    }
    //CAMBIAR ESTATUS DE PROYECTO
public function completar($idProyecto)
{
    try {
        $proyecto = Proyecto::find($idProyecto);

        if (!$proyecto) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Proyecto no encontrado'
            ], 404);
        }

        $proyecto->p_estatus = 'Completado';
        $proyecto->save();

        return response()->json([
            'success' => true,
            'proyecto' => $proyecto
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}

}