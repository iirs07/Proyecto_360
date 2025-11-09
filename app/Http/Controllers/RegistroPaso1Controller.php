<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Invitacion;
use App\Models\Usuario;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RegistroPaso1Controller extends Controller
{
    public function validarInvitacion(Request $request)
    {
        // ✅ Validar datos de entrada
        $request->validate([
            'correo' => 'required|email',
            'token_invitacion' => 'required|string|exists:invitaciones,token',
        ]);

        $correo = $request->correo;
        $tokenInvitacion = $request->token_invitacion;

        // 1️⃣ Verificar si el correo ya está registrado
        $usuarioExistente = Usuario::where('correo', $correo)->first();
        if ($usuarioExistente) {
            return response()->json([
                'ok' => false,
                'message' => '❌ Este correo ya está registrado'
            ], 400);
        }

        // 2️⃣ Verificar la invitación
        $invitacion = Invitacion::where('token', $tokenInvitacion)->first();
        if (!$invitacion || $invitacion->usado) {
            return response()->json([
                'ok' => false,
                'message' => '❌ Invitación inválida o ya usada'
            ], 404);
        }

        if ($invitacion->usuarios_registrados >= $invitacion->max_usuarios) {
            return response()->json([
                'ok' => false,
                'message' => '❌ Se alcanzó el límite de registros'
            ], 400);
        }

        // 3️⃣ Generar token de verificación (8 caracteres alfanuméricos)
        $tokenVerificacion = Str::upper(Str::random(8));

        // 4️⃣ Enviar correo al usuario
        try {
            Mail::send('emails.verificacion', ['token' => $tokenVerificacion], function ($message) use ($correo) {
                $message->to($correo)
                        ->subject('Verificación de correo');
            });
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'message' => '❌ Error al enviar correo: ' . $e->getMessage()
            ], 500);
        }

        // 5️⃣ Guardar token en DB
        DB::table('password_reset_tokens')->insert([
            'correo' => $correo,
            'token' => $tokenVerificacion,
            'usado' => false,
            'expira_en' => Carbon::now()->addMinutes(30),
            'creado_en' => Carbon::now(),
        ]);

        // 6️⃣ Limpiar tokens usados o expirados
        DB::table('password_reset_tokens')
            ->where('usado', true)
            ->orWhere('expira_en', '<', Carbon::now())
            ->delete();

        // 7️⃣ Responder correctamente
        return response()->json([
            'ok' => true,
            'message' => '✅ Token de verificación enviado al correo'
        ]);
    }
}
