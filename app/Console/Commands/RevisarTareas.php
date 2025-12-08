<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tarea;
use App\Notifications\TareaVencida;
use Carbon\Carbon;

class RevisarTareas extends Command
{
    protected $signature = 'tareas:revisar';
    protected $description = 'Revisar tareas vencidas y enviar recordatorios diarios';

    public function handle()
    {
        // Usamos now() en lugar de yesterday() para ser precisos.
        // yesterday() es medianoche (00:00), si una tarea venció ayer a las 3 PM,
        // tu código original NO la detectaría hasta pasados 2 días.
        $ahora = Carbon::now();

        $tareasVencidas = Tarea::with('usuarioLogin') // Optimización de rendimiento
            ->where('tf_fin', '<', $ahora)
            ->where('t_estatus', 'Pendiente') // Sigue pendiente aunque ya venció
            ->get();

        $contador = 0;

        foreach ($tareasVencidas as $tarea) {
            $usuario = $tarea->usuarioLogin;

            if ($usuario && $usuario->correo) {
                // Aquí NO cambiamos el estatus a 'vencida' ni usamos un booleano 'notificada'.
                // Al dejarla 'pendiente', mañana el comando la volverá a encontrar y enviará otro correo.
                
                try {
                    $usuario->notify(new TareaVencida($tarea));
                    $this->info("Recordatorio enviado a: {$usuario->correo} (Tarea ID: {$tarea->id_tarea})");
                    $contador++;
                } catch (\Exception $e) {
                    $this->error("Error enviando a {$usuario->correo}: " . $e->getMessage());
                }
            }
        }

        $this->info("Proceso terminado. Se enviaron {$contador} recordatorios.");
    }
}
