<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Comandos de Artisan registrados en el proyecto
     */
    protected $commands = [
        // Registrar tu comando aquí
        \App\Console\Commands\MoverDatosTrimestrales::class,
    ];

    /**
     * Define el cronograma de comandos
     */
    protected function schedule(Schedule $schedule)
    {
        // Programar tu comando trimestralmente
        $schedule->command('datos:mover-trimestral')->quarterly();

        // Otros comandos de limpieza si quieres
        $schedule->command('tokens:clean')->everyMinute();
        $schedule->command('invitaciones:clean')->everyMinute();
    }

    /**
     * Cargar comandos desde Commands y rutas de consola
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
