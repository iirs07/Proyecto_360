<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Proyecto;
use App\Models\Tarea;
use App\Models\HistorialModificacion;
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

    //METODO QUE MUESTRA TODOS LOS PROYECTOS DE UN DEPARTAMENTO PARA MODIFICARLOS
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
        DB::raw("SUM(CASE WHEN t.t_estatus = 'Finalizado' THEN 1 ELSE 0 END) as tareas_completadas")
    )
    ->where('p.id_departamento', $idDepartamento)
    ->whereIn('p.p_estatus', ['Pendiente', 'En proceso', 'Finalizado'])
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

public function Proyectos(Request $request)
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

        // Obtener proyectos con el conteo de tareas y su estatus
        $proyectos = DB::table('proyectos as p')
            ->leftJoin('tareas as t', 'p.id_proyecto', '=', 't.id_proyecto')
            ->select('p.*', 'p.p_estatus', DB::raw('COUNT(t.id_tarea) as total_tareas'))
            ->where('p.id_departamento', $idDepartamento)
            ->whereIn('p.p_estatus', ['En proceso', 'Finalizado'])
            ->groupBy('p.id_proyecto', 'p.p_nombre', 'p.id_departamento', 'p.p_estatus') // agrupa por columnas de proyecto
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
public function CambiarStatusProyectoTerminado(Request $request, $id)
{
    // Validamos que venga el array de tareas (puede venir vacío, pero debe ser array)
    $request->validate([
        'usuario_id' => 'required',
        'tareas_ids' => 'array' 
    ]);

    DB::beginTransaction();

    try {
        // 1. BUSCAR O RESTAURAR PROYECTO
        // ------------------------------------------------------
        $proyecto = Proyecto::on('pgsql')->find($id);

        // Si no lo encuentra, intentar reabrir desde la base histórica
        if (!$proyecto) {
            $reabrir = $this->reabrirProyecto($id);

            if (!$reabrir->original['success']) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Proyecto no encontrado en ninguna base.'
                ], 404);
            }

            // Ahora el proyecto debería existir en la BD principal
            $proyecto = Proyecto::on('pgsql')->find($id);
        }

        // 2. REACTIVAR EL PROYECTO
        // ------------------------------------------------------
        $proyecto->p_estatus = "En proceso";
        $proyecto->save();

        // 3. REACTIVAR LAS TAREAS SELECCIONADAS (NUEVO BLOQUE)
        // ------------------------------------------------------
        // Obtenemos la lista de IDs que envió React: [101, 102, etc]
        $tareasIds = $request->input('tareas_ids', []); 
        $cantidadTareasReactivadas = 0;

        if (!empty($tareasIds)) {
            // Asumiendo que tu modelo se llama Tarea (ajusta si es Task o Tareas)
            // Actualizamos estatus solo de las que coincidan con la lista
            $cantidadTareasReactivadas = \App\Models\Tarea::whereIn('id_tarea', $tareasIds)
                ->update(['t_estatus' => 'En proceso']);
        }

        // 4. GUARDAR EN EL HISTORIAL
        // ------------------------------------------------------
        $usuarioId = $request->input('usuario_id'); 
        
        // Personalizamos el mensaje para saber cuántas tareas se abrieron
        $detalleMsg = 'El proyecto fue cambiado de estatus Finalizado a En Proceso.';
        if ($cantidadTareasReactivadas > 0) {
            $detalleMsg .= " Se reactivaron además $cantidadTareasReactivadas tareas específicas.";
        }

        HistorialModificacion::create([
            'id_proyecto' => $id,
            'id_tarea'    => null,
            'id_usuario'  => $usuarioId,
            'accion'      => 'REAPERTURA PROYECTO',
            'detalles'    => $detalleMsg
        ]);

        DB::commit();

        return response()->json([
            'success' => true,
            'mensaje' => 'Proyecto reactivado exitosamente',
            'proyecto' => $proyecto,
            'tareas_reactivadas' => $cantidadTareasReactivadas
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false, 
            'error' => 'Error al actualizar: ' . $e->getMessage()
        ], 500);
    }
}

public function reabrirProyecto($id)
{
    // Definimos las conexiones para que sea fácil de leer
    $dbPrincipal = DB::connection('pgsql');
    $dbArchivo   = DB::connection('pgsql_second');

    // Iniciamos transacción para que todo pase o nada pase
    $dbPrincipal->beginTransaction();
    $dbArchivo->beginTransaction();

    try {
        // 1. BUSCAR: Encontrar el proyecto en el "Congelador" (Archivo)
        $proyectoArchivado = $dbArchivo->table('proyectos')->where('id_proyecto', $id)->first();

        if (!$proyectoArchivado) {
            return response()->json(['success' => false, 'message' => 'El proyecto no está en el archivo.']);
        }

        // 2. RESTAURAR PROYECTO: Mover de Archivo -> Principal
        // Usamos (array) para convertir el objeto y forzar que se inserte con el MISMO ID
        $dbPrincipal->table('proyectos')->insert((array)$proyectoArchivado);

        // 3. RESTAURAR RELACIONES (Tareas, Deptos, Historial ANTERIOR)
        
        // A) Tareas
        $tareas = $dbArchivo->table('tareas')->where('id_proyecto', $id)->get();
        foreach ($tareas as $t) {
            $dbPrincipal->table('tareas')->insert((array)$t);
        }

        // B) Departamentos
        $deptos = $dbArchivo->table('proyectos_departamentos')->where('id_proyecto', $id)->get();
        foreach ($deptos as $d) {
            $dbPrincipal->table('proyectos_departamentos')->insert((array)$d);
        }

        // C) Historial Viejo (Traemos el historial viejo para que no se pierda)
        $historialViejo = $dbArchivo->table('historial_modificaciones')->where('id_proyecto', $id)->get();
        foreach ($historialViejo as $h) {
            $dbPrincipal->table('historial_modificaciones')->insert((array)$h);
        }

        // 4. ELIMINAR DEL ARCHIVO (Para no tener duplicados)
        // El orden de borrado importa: Hijos primero, Padre al final
        $dbArchivo->table('historial_modificaciones')->where('id_proyecto', $id)->delete();
        $dbArchivo->table('tareas')->where('id_proyecto', $id)->delete();
        $dbArchivo->table('proyectos_departamentos')->where('id_proyecto', $id)->delete();
        $dbArchivo->table('proyectos')->where('id_proyecto', $id)->delete();

        // ---------------------------------------------------------------
        // AHORA SÍ: El proyecto ID 6 ya existe en la tabla principal.
        // Ya podemos modificarlo y el historial NO fallará.
        // ---------------------------------------------------------------

        // 5. ACTUALIZAR ESTATUS Y CREAR NUEVO LOG
        $proyectoRestaurado = Proyecto::find($id); // Ya lo encuentra en la BD principal
        $proyectoRestaurado->p_estatus = 'En Proceso';
        // $proyectoRestaurado->pf_fin = null; // Opcional: limpiar fecha fin
        $proyectoRestaurado->save(); 

        // Aquí tu sistema intentará insertar en historial_modificaciones.
        // Como el proyecto ID 6 ya está en la tabla 'proyectos', ¡FUNCIONARÁ!
        
        // Si tienes una función manual para registrar historial:
        // $this->registrarHistorial($id, 'REAPERTURA', 'Proyecto recuperado del archivo histórico.');

        $dbPrincipal->commit();
        $dbArchivo->commit();

        return response()->json(['success' => true, 'message' => 'Proyecto restaurado correctamente.']);

    } catch (\Exception $e) {
        $dbPrincipal->rollBack();
        $dbArchivo->rollBack();
        
        return response()->json([
            'success' => false, 
            'error' => 'Error al restaurar: ' . $e->getMessage()
        ]);
    }
}

}