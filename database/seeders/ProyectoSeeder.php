<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Faker\Factory as Faker;

class ProyectoSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('es_MX');

        // Obtener todos los JEFES correctamente usando id_usuario_login
        $jefes = DB::table('usuario')
            ->join('c_usuario', 'usuario.id_usuario_login', '=', 'c_usuario.id_usuario')
            ->select(
                'usuario.id_usuario_login as id_usuario_cu',
                'c_usuario.id_departamento'
            )
            ->where('usuario.rol', 'Jefe')
            ->get();

        foreach ($jefes as $jefe) {

            // ----------------------------
            // 1️⃣ Proyecto EN PROCESO
            // ----------------------------
            $inicioProceso = Carbon::now()->subDays(rand(5, 15));
            $finProceso = Carbon::now()->addDays(rand(5, 15)); // Fecha de fin futura

            $proyectoProcesoId = DB::table('proyectos')->insertGetId([
                'id_departamento' => $jefe->id_departamento,
                'p_nombre' => "Proyecto en proceso - Dpto {$jefe->id_departamento}",
                'pf_inicio' => $inicioProceso,
                'pf_fin' => $finProceso,
                'p_estatus' => 'En proceso',
                'descripcion' => $faker->sentence(15),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ], 'id_proyecto');

            DB::table('proyectos_departamentos')->insert([
                'id_proyecto' => $proyectoProcesoId,
                'id_departamento' => $jefe->id_departamento,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            $this->crearTareas($proyectoProcesoId, $jefe->id_departamento, $faker, 'En proceso', $inicioProceso, $finProceso);

            // ----------------------------
            // 2️⃣ Proyecto FINALIZADO
            // ----------------------------

            // Definir rangos posibles de fechas para proyectos finalizados
            $rangos = [
                ['2025-05-01', '2025-05-31'],
                ['2025-10-01', '2025-10-31'],
                ['2025-11-01', '2025-11-30'],
                ['2025-12-01', '2025-12-31'],
                ['2026-01-01', '2026-01-31'],
                ['2026-02-01', '2026-02-28'],
            ];

            // Elegir un rango aleatorio
            $rangoElegido = $faker->randomElement($rangos);

            // Generar fecha de inicio dentro del rango elegido
            $inicioFinalizado = Carbon::parse($faker->dateTimeBetween($rangoElegido[0], $rangoElegido[1]));

            // Generar fecha de fin 5-30 días después del inicio
            $finFinalizado = Carbon::parse($faker->dateTimeBetween(
                $inicioFinalizado->copy()->addDays(5),
                $inicioFinalizado->copy()->addDays(30)
            ));

            $proyectoFinalizadoId = DB::table('proyectos')->insertGetId([
                'id_departamento' => $jefe->id_departamento,
                'p_nombre' => "Proyecto finalizado - Dpto {$jefe->id_departamento}",
                'pf_inicio' => $inicioFinalizado,
                'pf_fin' => $finFinalizado,
                'p_estatus' => 'Finalizado',
                'descripcion' => $faker->sentence(15),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ], 'id_proyecto');

            DB::table('proyectos_departamentos')->insert([
                'id_proyecto' => $proyectoFinalizadoId,
                'id_departamento' => $jefe->id_departamento,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            $this->crearTareas($proyectoFinalizadoId, $jefe->id_departamento, $faker, 'Finalizado', $inicioFinalizado, $finFinalizado);
        }
    }

    // ===========================
    // 🔧 FUNCIÓN para crear tareas
    // ===========================
    private function crearTareas($proyectoId, $departamentoId, $faker, $proyectoEstatus = 'En proceso', $pf_inicio = null, $pf_fin = null)
    {
        $usuarios = DB::table('c_usuario')
            ->where('id_departamento', $departamentoId)
            ->pluck('id_usuario')
            ->toArray();

        $cantidad = rand(3, 5);

        for ($i = 0; $i < $cantidad; $i++) {
            $usuarioAsignado = $faker->randomElement($usuarios);

            if ($proyectoEstatus === 'Finalizado') {
                // Tareas completadas dentro del rango del proyecto
                $tf_inicio = Carbon::parse($pf_inicio)->addDays(rand(0, 3));
                $tf_fin = Carbon::parse($pf_fin)->subDays(rand(0, 2));
                $t_estatus = 'Completada';
                $tf_completada = $tf_fin;
            } else {
                // Proyecto en proceso: tareas dentro del rango de inicio-fin
                $tf_inicio = Carbon::parse($pf_inicio)->addDays(rand(0, 3));
                $tf_fin = Carbon::parse($pf_fin)->subDays(rand(0, 2));
                $t_estatus = $faker->randomElement(['Pendiente', 'Completada']);
                $tf_completada = $t_estatus === 'Completada' ? Carbon::now() : null;
            }

            DB::table('tareas')->insert([
                'id_proyecto' => $proyectoId,
                'id_usuario' => $usuarioAsignado,
                't_nombre' => $faker->sentence(4),
                't_estatus' => $t_estatus,
                'tf_inicio' => $tf_inicio,
                'tf_fin' => $tf_fin,
                'tf_completada' => $tf_completada,
                'descripcion' => $faker->sentence(12),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }
}
