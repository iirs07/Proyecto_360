<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Proyecto;
use App\Models\Tarea;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB; 
use App\Notifications\TareaAsignada;


class DepartamentoDirectorController extends Controller
{
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
public function usuariosDeDepartamento($id_usuario)
{
    // Obtener el departamento del usuario
    $usuario = DB::table('c_usuario')->where('id_usuario', $id_usuario)->first();
    if (!$usuario) {
        return response()->json([], 404);
    }
    $usuarios = DB::table('c_usuario')
        ->join('usuario', function ($join) {
            $join->on('c_usuario.id_usuario', '=', 'usuario.id_usuario');
        })
        ->where('c_usuario.id_departamento', $usuario->id_departamento)
        ->where('usuario.rol', '=', 'Usuario') // solo usuarios
        ->select(
            'c_usuario.id_usuario',
            'c_usuario.u_nombre as nombre',
            'c_usuario.a_paterno as apaterno',
            'c_usuario.a_materno as amaterno',
            'usuario.rol'
        )
        ->get();

    return response()->json($usuarios);
}



public function eliminarUsuario($id_usuario)
{
    $usuario = DB::table('usuario')->where('id_usuario', $id_usuario)->first();
    if (!$usuario) {
        return response()->json(['mensaje' => 'Usuario no encontrado'], 404);
    }

    try {
        DB::transaction(function () use ($id_usuario) {
            DB::table('c_usuario')->where('id_usuario', $id_usuario)->delete();
            DB::table('usuario')->where('id_usuario', $id_usuario)->delete();
        });

        return response()->json(['mensaje' => 'Usuario eliminado correctamente']);
    } catch (\Exception $e) {
        return response()->json([
            'mensaje' => 'Error al eliminar usuario',
            'error' => $e->getMessage()
        ], 500);
    }
}




}