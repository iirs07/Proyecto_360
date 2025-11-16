<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class CAreasSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            'Presidencia municipal',
            'Regidurías',
            'Secretaría General',
            'Tesorería',
            'Dirección general de ordenamiento territorial y sustentabilidad',
            'Dirección general de administración y servicios generales',
            'Dirección general jurídica y normatividad',
            'Dirección general de inclusión social y desarrollo económico',
            'Dirección general de servicios públicos municipales',
            'Dirección general de agua potable y alcantarillado',
        ];

        foreach ($areas as $nombre) {
            DB::table('c_areas')->insert([
                'nombre' => $nombre,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }
}
