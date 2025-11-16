<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class CUsuarioSeeder extends Seeder
{
    public function run(): void
    {
        $departamentos = DB::table('c_departamento')->get();
        $faker = \Faker\Factory::create('es_MX'); // nombres mexicanos

        foreach ($departamentos as $dep) {

            // 1️⃣ Crear JEFE del departamento
            $jefeId = DB::table('c_usuario')->insertGetId([
                'id_departamento' => $dep->id_departamento,
                'u_nombre' => $faker->firstName(),
                'a_paterno' => $faker->lastName(),
                'a_materno' => $faker->lastName(),
                'telefono' => $faker->numerify('922#######'),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ], 'id_usuario'); // <- CORRECCIÓN

            // Login del jefe
            DB::table('usuario')->insert([
                'id_usuario_login' => $jefeId,
                'correo' => "jefe{$jefeId}@example.com",
                'contrasena' => bcrypt('12345678'),
                'rol' => 'Jefe',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            // 2️⃣ Crear 3 subordinados
            for ($i = 0; $i < 3; $i++) {

                $subId = DB::table('c_usuario')->insertGetId([
                    'id_departamento' => $dep->id_departamento,
                    'u_nombre' => $faker->firstName(),
                    'a_paterno' => $faker->lastName(),
                    'a_materno' => $faker->lastName(),
                    'telefono' => $faker->numerify('922#######'),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ], 'id_usuario'); // <- CORRECCIÓN

                DB::table('usuario')->insert([
                    'id_usuario_login' => $subId,
                    'correo' => "user{$subId}@example.com",
                    'contrasena' => bcrypt('12345678'),
                    'rol' => 'Usuario',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }
        }
    }
}
