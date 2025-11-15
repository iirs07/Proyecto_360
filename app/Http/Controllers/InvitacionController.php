<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Invitacion;

class InvitacionController extends Controller
{
    public function crear(Request $request)
{
    try {
        // Validación
        $request->validate([
            'rol' => 'required|string',
            'id_departamento' => 'required|exists:c_departamento,id_departamento',
            'creado_por' => 'required|exists:usuario,id_usuario',
            'max_usos' => 'required|integer|min:1',
        ]);

        // Buscar invitación activa con cupos disponibles
        $invitacion = Invitacion::where('rol', $request->rol)
            ->where('id_departamento', $request->id_departamento)
            ->where('expira_en', '>', now())
            ->whereColumn('usuarios_registrados', '<', 'max_usuarios')
            ->first();

        if (!$invitacion) {
            // Si no hay invitación disponible, crear una nueva
            $invitacion = Invitacion::create([
                'token' => Str::random(64),
                'rol' => $request->rol,
                'id_departamento' => $request->id_departamento,
                'creado_por' => $request->creado_por,
                'max_usuarios' => $request->max_usos,
                'usuarios_registrados' => 0,
                'expira_en' => now()->addDays(1),
            ]);
        }

        // Retornar el link del token existente o recién creado
        return response()->json([
            'ok' => true,
            'link' => url("/RegistroPaso1/{$invitacion->token}")
        ]);

    } catch (\Illuminate\Database\QueryException $e) {
        return response()->json([
            'ok' => false,
            'error' => $e->getMessage()
        ], 500);

    } catch (\Exception $e) {
        return response()->json([
            'ok' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}

}
