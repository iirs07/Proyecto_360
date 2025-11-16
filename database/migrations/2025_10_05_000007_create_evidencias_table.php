<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evidencias', function (Blueprint $table) {
            // Clave primaria autoincremental
            $table->increments('id_evidencia');

            // Relaciones
            $table->unsignedInteger('id_proyecto');
            $table->foreign('id_proyecto')
                  ->references('id_proyecto')
                  ->on('proyectos')
                  ->onDelete('cascade');

            $table->unsignedInteger('id_tarea');
            $table->foreign('id_tarea')
                  ->references('id_tarea')
                  ->on('tareas')
                  ->onDelete('cascade');

            $table->unsignedInteger('id_departamento');
            $table->foreign('id_departamento')
                  ->references('id_departamento')
                  ->on('c_departamento')
                  ->onDelete('cascade');

            $table->unsignedInteger('id_usuario');
            $table->foreign('id_usuario')
                  ->references('id_usuario')
                  ->on('c_usuario')
                  ->onDelete('cascade');

            // Datos de la evidencia
            $table->string('ruta_archivo', 255);
            $table->date('fecha')->default(DB::raw('CURRENT_DATE'));

            // Timestamps para control de creación y actualización
            $table->timestamp('created_at', 0)->nullable();
            $table->timestamp('updated_at', 0)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evidencias');
    }
};
