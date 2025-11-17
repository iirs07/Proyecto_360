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

            // ==================================================
            // 1️⃣ PROYECTO EN PROCESO (Oct → Dic 2025, fin futuro)
            // ==================================================

            $inicioProceso = Carbon::parse(
                $faker->dateTimeBetween('2025-10-01', '2025-12-15')
            );

            // Fechas de fin garantizadas futuras
            $finProcesoOpciones = [
                '2025-12-30',
                '2026-01-15',
                '2026-02-10',
                '2026-03-05',
                '2026-04-01',
                '2027-01-10'
            ];

            // 🔧 AQUÍ ESTABA EL ERROR → variable mal escrita
            $finProceso = Carbon::parse($faker->randomElement($finProcesoOpciones));

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

            $this->crearTareas(
                $proyectoProcesoId,
                $jefe->id_departamento,
                $faker,
                'En proceso',
                $inicioProceso,
                $finProceso
            );

            // ==================================================
            // 2️⃣ PROYECTO FINALIZADO (FIN entre 1 OCT y 16 NOV 2025)
            // ==================================================

            $inicioFinalizado = Carbon::parse(
                $faker->dateTimeBetween('2025-06-01', '2025-10-20')
            );

            // FIN debe estar SIEMPRE entre 1 OCT y 16 NOV 2025
            $finFinalizado = Carbon::parse(
                $faker->dateTimeBetween(
                    '2025-10-01',
                    '2025-11-16'
                )
            );

            // Garantizar que inicio < fin
            if ($inicioFinalizado->greaterThan($finFinalizado)) {
                $inicioFinalizado = $finFinalizado->copy()->subDays(rand(5, 20));
            }

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

            $this->crearTareas(
                $proyectoFinalizadoId,
                $jefe->id_departamento,
                $faker,
                'Finalizado',
                $inicioFinalizado,
                $finFinalizado
            );
        }
    }

    // ==========================================
    // 🔧 FUNCIÓN DEFINITIVA PARA CREAR TAREAS
    // ==========================================
    private function crearTareas(
        $proyectoId,
        $departamentoId,
        $faker,
        $proyectoEstatus = 'En proceso',
        $pf_inicio = null,
        $pf_fin = null
    ) {
        $usuarios = DB::table('c_usuario')
            ->where('id_departamento', $departamentoId)
            ->pluck('id_usuario')
            ->toArray();

        $cantidad = rand(3, 5);

        for ($i = 0; $i < $cantidad; $i++) {

            $usuarioAsignado = $faker->randomElement($usuarios);

            $inicio = Carbon::parse($pf_inicio);
            $fin = Carbon::parse($pf_fin);

            $tf_inicio = $inicio->copy()->addDays(rand(0, 5));
            $tf_fin = $fin->copy()->subDays(rand(0, 5));

            if ($tf_inicio->greaterThan($tf_fin)) {
                $tf_fin = $tf_inicio->copy()->addDays(rand(1, 3));
            }

            if ($proyectoEstatus === 'Finalizado') {

                $t_estatus = 'Completada';
                $tf_completada = $tf_fin->copy();

            } else {

                $t_estatus = $faker->randomElement(['Pendiente', 'Completada']);
                $tf_completada = $t_estatus === 'Completada'
                    ? $tf_inicio->copy()->addDays(rand(1, 3))
                    : null;
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
