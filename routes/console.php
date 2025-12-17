<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Schedule::command('tareas:revisar')
    ->dailyAt('01:35')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/tareas-command.log'));

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


