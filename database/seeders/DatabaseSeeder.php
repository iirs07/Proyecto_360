<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Llamar al seeder de áreas
        $this->call([
            CAreasSeeder::class,
            CDepartamentoSeeder::class,
            SuperUsuarioSeeder::class,
            CUsuarioSeeder::class,
            ProyectoSeeder::class,
        ]);
    }
}
