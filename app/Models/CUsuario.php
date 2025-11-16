<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CUsuario extends Model
{
    protected $table = 'c_usuario';
    protected $primaryKey = 'id_usuario';
    public $timestamps = true;

    protected $fillable = [
        'id_departamento',
        'u_nombre',
        'a_paterno',
        'a_materno',
        'telefono',
    ];

    // 🔹 Relación inversa: un usuario puede tener muchas tareas
    public function tareas()
    {
        return $this->hasMany(\App\Models\Tarea::class, 'id_usuario', 'id_usuario');
    }
}
