<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('c_areas', function (Blueprint $table) {
            // Clave primaria autoincremental
            $table->increments('id');

            // Nombre del área
            $table->string('nombre', 100);

            // Timestamps para control de creación y actualización
            $table->timestamp('created_at', 0)->nullable();
            $table->timestamp('updated_at', 0)->nullable();
        });
    }

    public function down(): void
    {
        // Elimina la tabla si existe
        Schema::dropIfExists('c_areas');
    }
};
