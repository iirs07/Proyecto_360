<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    // Paso 1: enviar token al correo
    public function sendToken(Request $request)
    {
        $request->validate([
            'correo' => 'required|email',
        ]);

        // Verificar si el usuario existe
        $usuario = DB::table('usuario')->where('correo', $request->correo)->first();
        if (!$usuario) {
            return response()->json([
                'ok' => false,
                'message' => '❌ Este correo no está registrado'
            ], 404);
        }

        // Eliminar tokens antiguos no usados
        DB::table('password_reset_tokens')
            ->where('correo', $request->correo)
            ->where('usado', false)
            ->delete();

        // Generar nuevo token
        $token = Str::upper(Str::random(8)); 
        $expira_en = Carbon::now()->addMinutes(20);

        // Guardar en base de datos
        DB::table('password_reset_tokens')->insert([
            'correo' => $request->correo,
            'token' => $token,
            'usado' => false,
            'creado_en' => Carbon::now(),
            'expira_en' => $expira_en
        ]);

        // Enviar correo con diseño HTML
        try {
            Mail::send('emails.tokenReset', ['token' => $token], function($message) use ($request) {
                $message->to($request->correo)
                        ->subject('Recuperación de contraseña');
            });
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'message' => '❌ Error al enviar correo: ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'ok' => true,
            'message' => '✅ Código enviado al correo correctamente'
        ]);
    }

    // Paso 2: validar token y cambiar contraseña
    public function reset(Request $request)
    {
        $request->validate([
            'correo' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8',
        ]);

        // Verificar token válido y no usado
        $tokenData = DB::table('password_reset_tokens')
            ->where('correo', $request->correo)
            ->where('token', $request->token)
            ->where('usado', false)
            ->where('expira_en', '>', Carbon::now())
            ->first();

        if (!$tokenData) {
            return response()->json([
                'ok' => false,
                'message' => '❌ Correo o código inválido o expirado.'
            ], 400);
        }

        // Actualizar contraseña
        DB::table('usuario')
            ->where('correo', $request->correo)
            ->update(['contrasena' => Hash::make($request->password)]);

        // Marcar token como usado
        DB::table('password_reset_tokens')
            ->where('correo', $request->correo)
            ->where('token', $request->token)
            ->update(['usado' => true]);

        return response()->json([
            'ok' => true,
            'message' => '✅ Contraseña cambiada correctamente.'
        ]);
    }
}
