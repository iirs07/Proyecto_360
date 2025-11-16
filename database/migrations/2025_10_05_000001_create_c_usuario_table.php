<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('c_usuario', function (Blueprint $table) {
            // Clave primaria autoincremental
            $table->increments('id_usuario');

            // Relación con c_departamento
            $table->unsignedInteger('id_departamento');
            $table->foreign('id_departamento')
                  ->references('id_departamento')
                  ->on('c_departamento')
                  ->onDelete('cascade');

            // Datos del c_usuario
            $table->string('u_nombre', 50);
            $table->string('a_paterno', 50);
            $table->string('a_materno', 50)->nullable();
            $table->string('telefono', 20)->nullable();

            // Timestamps para control de creación y actualización
            $table->timestamp('created_at', 0)->nullable();
            $table->timestamp('updated_at', 0)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('c_usuario');
    }
};
