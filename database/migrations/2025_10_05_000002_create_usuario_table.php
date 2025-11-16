<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuario', function (Blueprint $table) {
            // Clave primaria autoincremental
            $table->increments('id_usuario');

            // Relación con c_usuario
            $table->unsignedInteger('id_usuario_login');
            $table->foreign('id_usuario_login')
                  ->references('id_usuario')
                  ->on('c_usuario')
                  ->onDelete('cascade');

            // Datos del usuario
            $table->string('rol', 50);
            $table->string('correo', 100)->unique();
            $table->string('contrasena', 255);

            // Timestamps para control de creación y actualización
            $table->timestamp('created_at', 0)->nullable();
            $table->timestamp('updated_at', 0)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuario');
    }
};
