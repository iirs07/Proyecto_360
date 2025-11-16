<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('c_departamento', function (Blueprint $table) {
            // Clave primaria autoincremental
            $table->increments('id_departamento');

            // Relación con c_areas
            $table->unsignedInteger('area_id');
            $table->foreign('area_id')
                  ->references('id')
                  ->on('c_areas')
                  ->onDelete('cascade');

            // Datos del departamento
            $table->string('d_nombre', 100);

            // Timestamps para control de creación y actualización
            $table->timestamp('created_at', 0)->nullable();
            $table->timestamp('updated_at', 0)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('c_departamento');
    }
};
