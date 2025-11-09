<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tarea extends Model
{
    use HasFactory;

    protected $table = 'tareas';           // Nombre de la tabla
    protected $primaryKey = 'id_tarea';    // Llave primaria
    public $timestamps = false;            // No hay created_at / updated_at

    // Campos que se pueden asignar masivamente
    protected $fillable = [
        'id_usuario',
        'id_proyecto',
        't_nombre',
        'descripcion',
        'tf_inicio',
        'tf_fin',
        't_estatus'
    ];

    // Valor por defecto para estatus
    protected $attributes = [
        't_estatus' => 'Pendiente',
    ];

    // Relación con CUsuario (responsable)
    public function usuario()
    {
        return $this->belongsTo(\App\Models\CUsuario::class, 'id_usuario', 'id_usuario');
    }

    // Relación con Evidencias
    public function evidencias()
    {
        return $this->hasMany(\App\Models\Evidencia::class, 'id_tarea', 'id_tarea');
    }
}
