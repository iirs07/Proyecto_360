<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('historial_modificaciones', function (Blueprint $table) {
            $table->id('id_historial');
            $table->integer('id_proyecto'); 
            $table->integer('id_tarea')->nullable(); 
            $table->integer('id_usuario'); 

            $table->string('accion'); 
            $table->text('detalles')->nullable(); 
            $table->timestamps();

            $table->foreign('id_proyecto')->references('id_proyecto')->on('proyectos')->onDelete('cascade');
            $table->foreign('id_tarea')->references('id_tarea')->on('tareas')->onDelete('cascade');
            $table->foreign('id_usuario')->references('id_usuario')->on('c_usuario');
        });
    }

    public function down()
    {
        Schema::dropIfExists('historial_modificaciones');
    }
};
