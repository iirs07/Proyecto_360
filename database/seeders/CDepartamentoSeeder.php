<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class CDepartamentoSeeder extends Seeder
{
    public function run(): void
    {
        $departamentos = [
            // Área 1
            ['d_nombre' => 'Presidencia Municipal', 'area_id' => 1],
            ['d_nombre' => 'Síndico', 'area_id' => 1],
            ['d_nombre' => 'Secretario particular', 'area_id' => 1],
            ['d_nombre' => 'Coordinador de asesores', 'area_id' => 1],
            ['d_nombre' => 'Dirección de gobernación', 'area_id' => 1],
            ['d_nombre' => 'Secretario técnico', 'area_id' => 1],
            ['d_nombre' => 'Dirección general del sistema municipal para el desarrollo integral de la familia', 'area_id' => 1],
            ['d_nombre' => 'Titular del órgano interno de control', 'area_id' => 1],
            ['d_nombre' => 'Titular de la unidad de substanciación y resolución', 'area_id' => 1],
            ['d_nombre' => 'Titular de la unidad de quejas, denuncias e investigación', 'area_id' => 1],
            ['d_nombre' => 'Titular de la dirección transparencia y acceso a la información pública', 'area_id' => 1],
            ['d_nombre' => 'Dirección general del Instituto Municipal de las Mujeres', 'area_id' => 1],
            ['d_nombre' => 'Dirección de planeación', 'area_id' => 1],
            ['d_nombre' => 'Comisario de Seguridad Pública', 'area_id' => 1],
            ['d_nombre' => 'Dirección de participación ciudadana', 'area_id' => 1],
            ['d_nombre' => 'Dirección de comunicación y vinculación', 'area_id' => 1],

            // Área 2 - Regidurías
            ['d_nombre' => 'Regiduría 1', 'area_id' => 2],
            ['d_nombre' => 'Regiduría 2', 'area_id' => 2],
            ['d_nombre' => 'Regiduría 3', 'area_id' => 2],
            ['d_nombre' => 'Regiduría 4', 'area_id' => 2],
            ['d_nombre' => 'Regiduría 5', 'area_id' => 2],
            ['d_nombre' => 'Regiduría 6', 'area_id' => 2],
            ['d_nombre' => 'Regiduría 7', 'area_id' => 2],
            ['d_nombre' => 'Regiduría 8', 'area_id' => 2],
            ['d_nombre' => 'Regiduría 9', 'area_id' => 2],
            ['d_nombre' => 'Regiduría 10', 'area_id' => 2],
            ['d_nombre' => 'Regiduría 11', 'area_id' => 2],
            ['d_nombre' => 'Regiduría 12', 'area_id' => 2],

            // Área 3 - Secretaría General
            ['d_nombre' => 'Secretaría General', 'area_id' => 3],
            ['d_nombre' => 'Jefe de departamento de ediciones y publicaciones', 'area_id' => 3],
            ['d_nombre' => 'Cronista del ayuntamiento', 'area_id' => 3],
            ['d_nombre' => 'Jefe de departamento de concentración', 'area_id' => 3],
            ['d_nombre' => 'Jefe de departamento de oficialía de partes común', 'area_id' => 3],
            ['d_nombre' => 'Oficial del registro civil', 'area_id' => 3],

            // Área 4 - Tesorería
            ['d_nombre' => 'Tesorería', 'area_id' => 4],
            ['d_nombre' => 'Dirección de egresos', 'area_id' => 4],
            ['d_nombre' => 'Dirección de ingresos y cobranza', 'area_id' => 4],
            ['d_nombre' => 'Dirección de presupuesto y contabilidad', 'area_id' => 4],
            ['d_nombre' => 'Dirección de catastro', 'area_id' => 4],
            ['d_nombre' => 'Jefe de departamento del ramo 33', 'area_id' => 4],
            ['d_nombre' => 'Coordinación de sistemas de información financiera', 'area_id' => 4],

            // Área 5 - Dirección general de ordenamiento territorial y sustentabilidad
            ['d_nombre' => 'Dirección general de ordenamiento territorial y sustentabilidad', 'area_id' => 5],
            ['d_nombre' => 'Dirección de desarrollo urbano', 'area_id' => 5],
            ['d_nombre' => 'Dirección de infraestructura y obras públicas', 'area_id' => 5],
            ['d_nombre' => 'Dirección de ramo 33', 'area_id' => 5],
            ['d_nombre' => 'Dirección de medio ambiente y sustentabilidad', 'area_id' => 5],

            // Área 6 - Dirección general de administración y servicios generales
            ['d_nombre' => 'Dirección general de administración y servicios generales', 'area_id' => 6],
            ['d_nombre' => 'Dirección de adquisiciones, arrendamientos y servicios', 'area_id' => 6],
            ['d_nombre' => 'Dirección de tecnologías de la información', 'area_id' => 6],
            ['d_nombre' => 'Dirección de servicios generales y mantenimiento', 'area_id' => 6],
            ['d_nombre' => 'Dirección de recursos humanos', 'area_id' => 6],
            ['d_nombre' => 'Dirección de patrimonio', 'area_id' => 6],
            ['d_nombre' => 'Dirección de almacén general', 'area_id' => 6],

            // Área 7 - Dirección general jurídica y normatividad
            ['d_nombre' => 'Dirección general jurídica y normatividad', 'area_id' => 7],
            ['d_nombre' => 'Dirección de lo contencioso', 'area_id' => 7],
            ['d_nombre' => 'Dirección de normatividad', 'area_id' => 7],
            ['d_nombre' => 'Dirección de lo consultivo y contratos', 'area_id' => 7],
            ['d_nombre' => 'Dirección de asuntos laborales', 'area_id' => 7],

            // Área 8 - Dirección general de inclusión social y desarrollo económico
            ['d_nombre' => 'Dirección general de inclusión social y desarrollo económico', 'area_id' => 8],
            ['d_nombre' => 'Jefe de departamento de salud', 'area_id' => 8],
            ['d_nombre' => 'Jefe de departamento de educación', 'area_id' => 8],
            ['d_nombre' => 'Jefe de departamento de deporte', 'area_id' => 8],
            ['d_nombre' => 'Jefe de departamento de cultura', 'area_id' => 8],
            ['d_nombre' => 'Jefe de departamento de la juventud', 'area_id' => 8],
            ['d_nombre' => 'Jefe de departamento de equidad de género', 'area_id' => 8],
            ['d_nombre' => 'Jefe de departamento de diversidad sexual', 'area_id' => 8],
            ['d_nombre' => 'Dirección de comercio', 'area_id' => 8],
            ['d_nombre' => 'Jefe de departamento de fomento agropecuario, pesca y ganadería', 'area_id' => 8],
            ['d_nombre' => 'Jefe de departamento de turismo', 'area_id' => 8],

            // Área 9 - Dirección general de servicios públicos municipales
            ['d_nombre' => 'Dirección general de servicios públicos municipales', 'area_id' => 9],
            ['d_nombre' => 'Dirección de limpia pública', 'area_id' => 9],
            ['d_nombre' => 'Jefe de departamento de alumbrado público', 'area_id' => 9],
            ['d_nombre' => 'Jefe de departamento de parques y jardines', 'area_id' => 9],
            ['d_nombre' => 'Dirección de protección civil', 'area_id' => 9],
            ['d_nombre' => 'Jefe de departamento de panteones públicos', 'area_id' => 9],
            ['d_nombre' => 'Jefe de departamento de rastro municipal', 'area_id' => 9],
            ['d_nombre' => 'Jefe de departamento de tránsito y vialidad', 'area_id' => 9],

            // Área 10 - Dirección general de agua potable y alcantarillado
            ['d_nombre' => 'Dirección general de agua potable y alcantarillado', 'area_id' => 10],
            ['d_nombre' => 'Jefe de departamento técnico de agua potable y alcantarillado', 'area_id' => 10],
            ['d_nombre' => 'Jefe de departamento de comercio de agua potable y alcantarillado', 'area_id' => 10],
            ['d_nombre' => 'Jefe de departamento administrativo de agua potable y alcantarillado', 'area_id' => 10],
        ];

        foreach ($departamentos as $dep) {
            DB::table('c_departamento')->insert([
                'd_nombre' => $dep['d_nombre'],
                'area_id' => $dep['area_id'],
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }
}
