<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            // Clave primaria autoincremental
            $table->increments('id');

            // Datos del usuario
            $table->string('correo', 100);

            // Token único
            $table->string('token', 64)->unique();

            // Estado del token
            $table->boolean('usado')->default(false);

            // Timestamps
            $table->timestamp('creado_en')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamp('expira_en')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_reset_tokens');
    }
};
