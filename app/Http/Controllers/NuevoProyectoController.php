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
                    // Se eliminó Log::error
                }
            } else {
                // Se eliminó Log::warning
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

}