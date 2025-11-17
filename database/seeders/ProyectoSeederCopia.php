<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Faker\Factory as Faker;

class ProyectoSeederCopia extends Seeder
{
    public function run(): void
    {
        // SEGURIDAD: Solo permitir ejecutar este seeder en la BD copia
        if (env('DB_DATABASE') !== 'Proyecto360_copia') {
            $this->command->error("⚠️ Este seeder solo puede ejecutarse en la BD Proyecto360_copia");
            return;
        }

        $faker = Faker::create('es_MX');

        // Tomar todos los departamentos existentes
        $departamentos = DB::table('c_departamento')->pluck('id_departamento')->toArray();

        if (empty($departamentos)) {
            $this->command->error("No existen departamentos para asignar proyectos.");
            return;
        }

        for ($i = 1; $i <= 20; $i++) {

            $departamento = $faker->randomElement($departamentos);

            // Fechas antes de octubre 2025
            $inicio = Carbon::parse(
                $faker->dateTimeBetween('2025-01-01', '2025-09-20')
            );

            $fin = Carbon::parse(
                $faker->dateTimeBetween('2025-02-01', '2025-09-30')
            );

            // Garantizar inicio < fin
            if ($inicio->greaterThan($fin)) {
                $inicio = $fin->copy()->subDays(rand(1, 20));
            }

            // Insertar proyecto
            $proyectoId = DB::table('proyectos')->insertGetId([
                'id_departamento' => $departamento,
                'p_nombre' => "Proyecto Finalizado Falso #$i",
                'pf_inicio' => $inicio,
                'pf_fin' => $fin,
                'p_estatus' => 'Finalizado',
                'descripcion' => $faker->sentence(15),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ], 'id_proyecto');

            // Insert en tabla pivote
            DB::table('proyectos_departamentos')->insert([
                'id_proyecto' => $proyectoId,
                'id_departamento' => $departamento,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            // Crear tareas
            $this->crearTareasFalsas($proyectoId, $departamento, $faker, $inicio, $fin);
        }

        $this->command->info("✔️ 20 proyectos finalizados falsos insertados correctamente.");
    }

    private function crearTareasFalsas($proyectoId, $departamentoId, $faker, $pf_inicio, $pf_fin)
    {
        $usuarios = DB::table('c_usuario')
            ->where('id_departamento', $departamentoId)
            ->pluck('id_usuario')
            ->toArray();

        if (empty($usuarios)) {
            return;
        }

        $cantidad = rand(3, 5);

        for ($i = 0; $i < $cantidad; $i++) {

            $usuarioAsignado = $faker->randomElement($usuarios);

            $tf_inicio = Carbon::parse($pf_inicio)->addDays(rand(0, 5));
            $tf_fin = Carbon::parse($pf_fin)->subDays(rand(0, 5));

            if ($tf_inicio->greaterThan($tf_fin)) {
                $tf_fin = $tf_inicio->copy()->addDays(rand(1, 4));
            }

            DB::table('tareas')->insert([
                'id_proyecto' => $proyectoId,
                'id_usuario' => $usuarioAsignado,
                't_nombre' => $faker->sentence(4),
                't_estatus' => 'Completada',
                'tf_inicio' => $tf_inicio,
                'tf_fin' => $tf_fin,
                'tf_completada' => $tf_fin->copy(),
                'descripcion' => $faker->sentence(12),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }
}
