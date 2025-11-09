<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CleanExpiredInvitaciones extends Command
{
    /**
     * Nombre del comando para ejecutarlo desde la terminal.
     */
    protected $signature = 'invitaciones:clean';

    /**
     * Descripción del comando.
     */
    protected $description = 'Elimina las invitaciones expiradas o ya usadas de la tabla invitaciones';

    /**
     * Ejecuta la limpieza de invitaciones.
     */
    public function handle()
    {
        $now = Carbon::now();

        // Eliminar las invitaciones expiradas o totalmente usadas
        $count = DB::table('invitaciones')
            ->where(function ($query) use ($now) {
                $query->where('expira_en', '<', $now)
                      ->orWhere('usado', true)
                      ->orWhereColumn('usuarios_registrados', '>=', 'max_usuarios');
            })
            ->delete();

        // Mostrar el resultado
        $this->info("🧹 Se eliminaron {$count} invitaciones expiradas o usadas correctamente.");
    }
}
