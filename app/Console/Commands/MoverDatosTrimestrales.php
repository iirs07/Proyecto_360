<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MoverDatosTrimestrales extends Command
{
    protected $signature = 'datos:mover-trimestral';
    protected $description = 'Mover proyectos finalizados del trimestre a Proyecto360_copia';

    public function handle()
    {
        $this->info('Iniciando proceso de mover proyectos finalizados del trimestre...');

        // Definir trimestre actual
        $fecha_inicio = Carbon::now()->firstOfQuarter()->startOfDay();
        $fecha_fin    = Carbon::now()->lastOfQuarter()->endOfDay();

        // Conexiones
        $dbPrincipal = DB::connection('pgsql');
        $dbCopia = DB::connection('pgsql_second');

        DB::transaction(function () use ($dbPrincipal, $dbCopia, $fecha_inicio, $fecha_fin) {

            // -------------------------------
            // 1️⃣ Sincronizar tablas maestras
            // -------------------------------
            $tablasMaestras = [
                'c_areas' => 'id',
                'c_departamento' => 'id_departamento',
                'c_usuario' => 'id_usuario',
                'usuario' => 'id_usuario'
            ];

            foreach ($tablasMaestras as $tabla => $pk) {
                $datos = $dbPrincipal->table($tabla)->get();
                foreach ($datos as $fila) {
                    $fila = (array) $fila;
                    $dbCopia->table($tabla)->updateOrInsert([$pk => $fila[$pk]], $fila);
                }
            }

            // -------------------------------
            // 2️⃣ Mover proyectos finalizados
            // -------------------------------
            $proyectos = $dbPrincipal->table('proyectos')
                ->where('p_estatus', 'Finalizado')
                ->whereBetween('pf_fin', [$fecha_inicio, $fecha_fin])
                ->get();

            if ($proyectos->isEmpty()) {
                $this->info('No hay proyectos finalizados en este trimestre.');
                return;
            }

            $proyectosIds = $proyectos->pluck('id_proyecto')->toArray();

            // a) Insertar proyectos en la copia
            foreach ($proyectos as $proyecto) {
                $dbCopia->table('proyectos')->insert((array)$proyecto);
            }

            // b) Insertar proyectos_departamentos relacionados
            $proyectosDept = $dbPrincipal->table('proyectos_departamentos')
                ->whereIn('id_proyecto', $proyectosIds)
                ->get();

            foreach ($proyectosDept as $fila) {
                $dbCopia->table('proyectos_departamentos')->insert((array)$fila);
            }

            // c) Insertar tareas relacionadas
            $tareas = $dbPrincipal->table('tareas')
                ->whereIn('id_proyecto', $proyectosIds)
                ->get();

            foreach ($tareas as $fila) {
                $dbCopia->table('tareas')->insert((array)$fila);
            }

            // -------------------------------
            // 3️⃣ Eliminar datos movidos de la base original
            // -------------------------------
            $dbPrincipal->table('tareas')->whereIn('id_proyecto', $proyectosIds)->delete();
            $dbPrincipal->table('proyectos_departamentos')->whereIn('id_proyecto', $proyectosIds)->delete();
            $dbPrincipal->table('proyectos')->whereIn('id_proyecto', $proyectosIds)->delete();
        });

        $this->info("Proyectos finalizados del trimestre {$fecha_inicio->toDateString()} a {$fecha_fin->toDateString()} movidos correctamente.");
    }
}
