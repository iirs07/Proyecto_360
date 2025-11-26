<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistorialModificacion extends Model
{
    protected $table = 'historial_modificaciones';
    protected $primaryKey = 'id_historial';

    protected $fillable = [
        'id_proyecto',
        'id_tarea',
        'id_usuario',
        'accion',
        'detalles'
    ];
}
