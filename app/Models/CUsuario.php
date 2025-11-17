<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable; 
use Illuminate\Notifications\Notifiable;

class CUsuario extends Model
{
    use Notifiable;
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
    public function departamento()
{
    return $this->belongsTo(Departamento::class, 'id_departamento', 'id_departamento');
}
}
