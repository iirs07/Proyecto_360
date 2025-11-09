<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CleanExpiredTokens extends Command
{
    /**
     * Nombre del comando en artisan.
     */
    protected $signature = 'tokens:clean';

    /**
     * Descripción del comando.
     */
    protected $description = 'Elimina automáticamente los tokens expirados o ya usados de la tabla password_reset_tokens';

    /**
     * Ejecuta la limpieza de tokens.
     */
    public function handle()
    {
        // Obtener fecha y hora actual según la zona configurada en Laravel
        $now = Carbon::now();

        // Eliminar tokens expirados o ya usados
        $count = DB::table('password_reset_tokens')
            ->where('expira_en', '<', $now)
            ->orWhere('usado', true)
            ->delete();

        // Mensaje de consola
        $this->info("🧹 Se eliminaron {$count} tokens expirados o usados correctamente.");
    }
}
