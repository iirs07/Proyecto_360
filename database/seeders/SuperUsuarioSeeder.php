<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class SuperUsuarioSeeder extends Seeder
{
    public function run(): void
    {
        // SUPERUSUARIO — SIEMPRE SERÁ ID 1 en c_usuario
        $superId = DB::table('c_usuario')->insertGetId([
            'id_departamento' => 1,
            'u_nombre' => 'Itzel',
            'a_paterno' => 'Ramos',
            'a_materno' => 'Santiago',
            'telefono' => '9222094573',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ], 'id_usuario');  // <- Importante: especificar la columna PK

        // Insertar en tabla 'usuario' usando id_usuario_login
        DB::table('usuario')->insert([
            'id_usuario_login' => $superId,  // <- CORRECTO
            'correo' => 'ramossantiagoitzelivonne@gmail.com',
            'contrasena' => bcrypt('12345678'),
            'rol' => 'Administrador',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
    }
}
