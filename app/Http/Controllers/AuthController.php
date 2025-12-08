<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Validación básica
        $request->validate([
            'correo' => 'required|email',
            'password' => 'required|min:6',
        ]);

        // 1. Verificar existencia y credenciales del usuario en tabla 'usuario'
        $user = Usuario::where('correo', $request->correo)->first();

        if (!$user) {
            return response()->json(['error' => 'Correo no registrado'], 404);
        }

        if (!Hash::check($request->password, $user->contrasena)) {
            return response()->json(['error' => 'Contraseña incorrecta'], 401);
        }

        // 2. Obtener datos detallados del usuario (Departamento y Área)
        // Usamos u.id_departamento como clave de unión y d.area_id como clave de área.
        $cUsuario = DB::table('c_usuario as u')
            ->join('c_departamento as d', 'u.id_departamento', '=', 'd.id_departamento')
            ->join('c_areas as a', 'd.area_id', '=', 'a.id') // Usando 'a.id' y 'd.area_id'
            ->where('u.id_usuario', $user->id_usuario_login)
            ->select(
                'u.id_usuario',
                'u.u_nombre AS nombre', // Alias para mapear fácilmente
                'u.a_paterno',
                'u.a_materno',
                'u.id_departamento',
                'd.d_nombre AS departamento',
                'a.id AS id_area',
                'a.nombre AS area'
            )
            ->first();

        if (!$cUsuario) {
            // Este error puede ocurrir si el usuario existe en 'usuario' pero falta en 'c_usuario' o no tiene asignación.
            return response()->json(['error' => 'Usuario no encontrado o sin asignación de departamento/área'], 404);
        }

        // 3. Crear token JWT
        $token = JWTAuth::fromUser($user);

        return response()->json([
            'token' => $token,
            'usuario' => [
                'id_usuario' => $cUsuario->id_usuario,
                'nombre' => $cUsuario->nombre, // Usando alias
                'a_paterno' => $cUsuario->a_paterno,
                'a_materno' => $cUsuario->a_materno ?? null,
                'correo' => $user->correo,
                'rol' => $user->rol, // Rol viene de la tabla 'usuario'
                'id_departamento' => $cUsuario->id_departamento,
                'departamento' => $cUsuario->departamento,
                'id_area' => $cUsuario->id_area,
                'area' => $cUsuario->area
            ],
        ]);
    }

    public function usuario()
    {
        try {
            $user = JWTAuth::parseToken()->authenticate(); // Autentica usando JWT

            // Obtener datos detallados del usuario (Departamento y Área)
            $cUsuario = DB::table('c_usuario as u')
                ->join('c_departamento as d', 'u.id_departamento', '=', 'd.id_departamento')
                ->join('c_areas as a', 'd.area_id', '=', 'a.id') // Usando 'a.id' y 'd.area_id'
                ->where('u.id_usuario', $user->id_usuario_login)
                ->select(
                    'u.id_usuario',
                    'u.u_nombre AS nombre',
                    'u.a_paterno',
                    'u.a_materno',
                    'u.id_departamento',
                    'd.d_nombre AS departamento',
                    'a.id AS id_area',
                    'a.nombre AS area'
                )
                ->first();

            if (!$cUsuario) {
                return response()->json(['error' => 'Usuario no encontrado o sin asignación de departamento/área'], 404);
            }

            return response()->json([
                'id_usuario' => $cUsuario->id_usuario,
                'nombre' => $cUsuario->nombre,
                'a_paterno' => $cUsuario->a_paterno,
                'a_materno' => $cUsuario->a_materno ?? null,
                'correo' => $user->correo,
                'rol' => $user->rol,
                'id_departamento' => $cUsuario->id_departamento,
                'departamento' => $cUsuario->departamento,
                'id_area' => $cUsuario->id_area,
                'area' => $cUsuario->area
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Token inválido o expirado'], 401);
        }
    }
}