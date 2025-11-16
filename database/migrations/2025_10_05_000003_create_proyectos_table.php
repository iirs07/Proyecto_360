<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proyectos', function (Blueprint $table) {
            // Clave primaria autoincremental
            $table->increments('id_proyecto');

            // Relación con departamento
            $table->unsignedInteger('id_departamento');
            $table->foreign('id_departamento')
                  ->references('id_departamento')
                  ->on('c_departamento')
                  ->onDelete('cascade');

            // Datos del proyecto
            $table->string('p_nombre', 100)->nullable();
            $table->date('pf_inicio')->nullable();
            $table->date('pf_fin')->nullable();
            $table->string('p_estatus', 50)->default('EN PROCESO');
            $table->text('descripcion')->nullable();

            // Timestamps para control de creación y actualización
            $table->timestamp('created_at', 0)->nullable();
            $table->timestamp('updated_at', 0)->nullable();
        });
    }

    public function down(): void
    {
        // Elimina la tabla si existe
        Schema::dropIfExists('proyectos');
    }
};
