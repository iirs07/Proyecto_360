<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TestSchedule extends Command
{
    protected $description = 'Test schedule command';
    // App\Console\Commands\TestSchedule.php
protected $signature = 'test:schedule'; // <- esto es lo que Laravel espera


    public function handle()
    {
        \Log::info('TestSchedule ejecutado correctamente');
    }
}
