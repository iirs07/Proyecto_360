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
        \App\Console\Commands\MoverDatosTrimestrales::class,
        \App\Console\Commands\CleanExpiredTokens::class,
        \App\Console\Commands\CleanExpiredInvitaciones::class,
        \App\Console\Commands\TestSchedule::class,
    ];

    /**
     * Define el cronograma de comandos
     */
    protected function schedule(Schedule $schedule)
    {
        \Log::info('Schedule loaded'); // Para verificar que el scheduler se carga

        // mover datos trimestrales, se asegura que no se solape
        $schedule->command('datos:mover-trimestral')->quarterly()->withoutOverlapping();

        // pueden ejecutarse cada minuto
        $schedule->command('tokens:clean')->everyMinute();
        $schedule->command('invitaciones:clean')->everyMinute();

       
        $schedule->command('test:schedule')->everyMinute();
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
