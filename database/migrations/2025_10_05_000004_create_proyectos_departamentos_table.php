<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proyectos_departamentos', function (Blueprint $table) {
            // Clave primaria autoincremental
            $table->increments('id_proyectos_departamentos');

            // Relación con proyecto
            $table->unsignedInteger('id_proyecto');
            $table->foreign('id_proyecto')
                  ->references('id_proyecto')
                  ->on('proyectos')
                  ->onDelete('cascade');

            // Relación con departamento
            $table->unsignedInteger('id_departamento');
            $table->foreign('id_departamento')
                  ->references('id_departamento')
                  ->on('c_departamento')
                  ->onDelete('cascade');

            // Llave primaria compuesta
            $table->primary(['id_proyecto', 'id_departamento', 'id_proyectos_departamentos']);

            // Timestamps para control de creación y actualización
            $table->timestamp('created_at', 0)->nullable();
            $table->timestamp('updated_at', 0)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proyectos_departamentos');
    }
};
