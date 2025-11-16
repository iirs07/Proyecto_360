<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitaciones', function (Blueprint $table) {
            // Clave primaria autoincremental
            $table->increments('id_invitacion');

            // Datos de la invitación
            $table->string('token', 64)->unique();
            $table->string('rol', 50);

            // Relaciones con departamentos y usuarios
            $table->unsignedInteger('id_departamento');
            $table->unsignedInteger('creado_por');

            $table->foreign('id_departamento')
                  ->references('id_departamento')
                  ->on('c_departamento')
                  ->onDelete('cascade');

            $table->foreign('creado_por')
                  ->references('id_usuario')
                  ->on('usuario')
                  ->onDelete('cascade');

            // Control de usuarios y estado de la invitación
            $table->integer('max_usuarios')->default(1);
            $table->integer('usuarios_registrados')->default(0);
            $table->boolean('usado')->default(false);

            // Fechas
            $table->timestamp('creado_en')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamp('expira_en')->nullable();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitaciones');
    }
};
