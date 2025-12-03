<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File; // <--- NO OLVIDES ESTO
use Carbon\Carbon;

class MoverDatosTrimestrales extends Command
{
    protected $signature = 'datos:mover-trimestral';
    protected $description = 'Mover proyectos finalizados, sus relaciones y eliminar evidencias físicas';

    public function handle()
    {
        $this->info('Iniciando proceso de mover proyectos finalizados del trimestre...');

        $fecha_inicio = Carbon::now()->firstOfQuarter()->startOfDay();
        $fecha_fin    = Carbon::now()->lastOfQuarter()->endOfDay();

        $dbPrincipal = DB::connection('pgsql');
        $dbCopia     = DB::connection('pgsql_second');

        // 1. Identificar Proyectos a mover
        $proyectos = $dbPrincipal->table('proyectos')
            ->where('p_estatus', 'Finalizado')
            ->whereBetween('pf_fin', [$fecha_inicio, $fecha_fin])
            ->get();

        if ($proyectos->isEmpty()) {
            $this->info('No hay proyectos finalizados en este trimestre.');
            return;
        }

        $proyectosIds = $proyectos->pluck('id_proyecto')->toArray();
        $this->info("Procesando " . count($proyectosIds) . " proyectos...");

        // 2. OBTENER LAS RUTAS DE LOS ARCHIVOS (Antes de tocar la BD)
        // Buscamos en la tabla 'evidencias' usando los IDs de los proyectos
        $listaEvidencias = $dbPrincipal->table('evidencias')
            ->whereIn('id_proyecto', $proyectosIds)
            ->get(); // Traemos toda la fila para poder copiarla a la BD secundaria

        // Extraemos solo las rutas para el borrado físico final
        // La ruta viene como "evidencias/foto.jpg"
        $rutasParaBorrar = $listaEvidencias->pluck('ruta_archivo')->toArray();

        // -------------------------------------------------------------
        // 3. TRANSACCIÓN (Copia y Limpieza de Base de Datos)
        // -------------------------------------------------------------
        DB::transaction(function () use ($dbPrincipal, $dbCopia, $fecha_inicio, $fecha_fin, $proyectos, $proyectosIds, $listaEvidencias) {

            // A) Sincronizar tablas maestras (Usuarios, Areas, etc.)
            // ... (Tu código existente de tablas maestras va aquí) ...
            $tablasMaestras = ['c_areas' => 'id', 'c_departamento' => 'id_departamento', 'c_usuario' => 'id_usuario', 'usuario' => 'id_usuario'];
            foreach ($tablasMaestras as $tabla => $pk) {
                $datos = $dbPrincipal->table($tabla)->get();
                foreach ($datos as $fila) {
                    $fila = (array) $fila;
                    $dbCopia->table($tabla)->updateOrInsert([$pk => $fila[$pk]], $fila);
                }
            }

            // B) COPIA DE DATOS (Tablas Hijas primero, Padre al final no importa en copia, pero sí el orden)
            
            // Copiar Proyectos
            foreach ($proyectos as $fila) {
                $dbCopia->table('proyectos')->updateOrInsert(['id_proyecto' => $fila->id_proyecto], (array)$fila);
            }

            // Copiar Departamentos
            $proyectosDept = $dbPrincipal->table('proyectos_departamentos')->whereIn('id_proyecto', $proyectosIds)->get();
            foreach ($proyectosDept as $fila) {
                $dbCopia->table('proyectos_departamentos')->updateOrInsert(['id_proyectos_departamentos' => $fila->id_proyectos_departamentos], (array)$fila);
            }

            // Copiar Tareas
            $tareas = $dbPrincipal->table('tareas')->whereIn('id_proyecto', $proyectosIds)->get();
            foreach ($tareas as $fila) {
                $dbCopia->table('tareas')->updateOrInsert(['id_tarea' => $fila->id_tarea], (array)$fila);
            }

            // Copiar Historial
            $historial = $dbPrincipal->table('historial_modificaciones')->whereIn('id_proyecto', $proyectosIds)->get();
            foreach ($historial as $fila) {
                // Ajusta 'id_historial' si tu PK es diferente
                $dbCopia->table('historial_modificaciones')->updateOrInsert(['id_historial' => $fila->id_historial], (array)$fila);
            }

            // Copiar Evidencias (NUEVO)
            // Guardamos el registro en la BD secundaria antes de borrarlo
            foreach ($listaEvidencias as $fila) {
                $dbCopia->table('evidencias')->updateOrInsert(['id_evidencia' => $fila->id_evidencia], (array)$fila);
            }

            // -------------------------------------------------------------
            // C) LIMPIEZA DE BD (Orden: Hijos -> Padre)
            // -------------------------------------------------------------
            
            // 1. Borrar Evidencias (BD)
            $dbPrincipal->table('evidencias')->whereIn('id_proyecto', $proyectosIds)->delete();

            // 2. Borrar Historial
            $dbPrincipal->table('historial_modificaciones')->whereIn('id_proyecto', $proyectosIds)->delete();
            
            // 3. Borrar Tareas
            $dbPrincipal->table('tareas')->whereIn('id_proyecto', $proyectosIds)->delete();
            
            // 4. Borrar Departamentos
            $dbPrincipal->table('proyectos_departamentos')->whereIn('id_proyecto', $proyectosIds)->delete();
            
            // 5. Borrar Proyectos (Padre)
            $dbPrincipal->table('proyectos')->whereIn('id_proyecto', $proyectosIds)->delete();

        });

        // -------------------------------------------------------------
        // 4. ELIMINACIÓN FÍSICA DE ARCHIVOS
        // Se ejecuta fuera de la transacción para asegurar que no borramos si la BD falla
        // -------------------------------------------------------------
        
        $this->info("Base de datos sincronizada. Eliminando " . count($rutasParaBorrar) . " archivos físicos...");
        
        $borrados = 0;

        foreach ($rutasParaBorrar as $rutaRelativa) {
            // $rutaRelativa viene de la BD como: "evidencias/foto.jpg"
            // public_path('storage') apunta a: C:\laragon\www\Proyecto_360\public\storage
            
            // Armamos la ruta completa
            $rutaCompleta = public_path('storage/' . $rutaRelativa);

            if (File::exists($rutaCompleta)) {
                if (File::delete($rutaCompleta)) {
                    $borrados++;
                }
            }
        }

        $this->info("Proceso finalizado con éxito.");
        $this->info("Proyectos archivados: " . count($proyectosIds));
        $this->info("Archivos eliminados del disco: " . $borrados);
    }
}