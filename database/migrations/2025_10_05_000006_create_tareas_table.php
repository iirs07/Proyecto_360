<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tareas', function (Blueprint $table) {
            // Clave primaria autoincremental
            $table->increments('id_tarea');

            // Relación con proyecto
            $table->unsignedInteger('id_proyecto');
            $table->foreign('id_proyecto')
                  ->references('id_proyecto')
                  ->on('proyectos')
                  ->onDelete('cascade');

            // Relación con usuario
            $table->unsignedInteger('id_usuario');
            $table->foreign('id_usuario')
                  ->references('id_usuario')
                  ->on('c_usuario')
                  ->onDelete('cascade');

            // Datos de la tarea
            $table->text('t_nombre');
            $table->string('t_estatus', 50)->default('PENDIENTE');
            $table->date('tf_inicio')->nullable();
            $table->date('tf_completada')->nullable();
            $table->text('descripcion')->nullable();
            $table->date('tf_fin')->nullable();

            // Timestamps para control de creación y actualización
            $table->timestamp('created_at', 0)->nullable();
            $table->timestamp('updated_at', 0)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tareas');
    }
};
