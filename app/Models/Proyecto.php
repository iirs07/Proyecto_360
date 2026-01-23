<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proyecto extends Model
{
    protected $table = 'proyectos';
    protected $primaryKey = 'id_proyecto';
    protected $fillable = ['id_departamento', 'p_nombre', 'descripcion', 'pf_inicio', 'pf_fin', 'p_estatus'];
    public $timestamps = true;

    // 🟢 RELACIÓN 1: Todas las tareas (CORREGIDA)
    public function tareas()
    {
        $instance = new \App\Models\Tarea;
        // Heredar la conexión actual (sea pgsql o pgsql_second)
        $instance->setConnection($this->getConnectionName());
        
        return $this->hasMany($instance, 'id_proyecto', 'id_proyecto');
    }

    // 🟢 RELACIÓN 2: Tareas completadas (CORREGIDA)
    public function tareasCompletadas()
    {
        $instance = new \App\Models\Tarea;
        $instance->setConnection($this->getConnectionName());

        return $this->hasMany($instance, 'id_proyecto', 'id_proyecto')
                    ->where('t_estatus', 'Completada'); 
    }

    // 🟢 RELACIÓN 3: Departamento
    public function departamento()
    {
        $instance = new \App\Models\Departamento;
        $instance->setConnection($this->getConnectionName());
        return $this->belongsTo($instance, 'id_departamento', 'id_departamento');
    }
    
    // 🟢 RELACIÓN 4: Encargado directo
    public function encargado()
    {
        $instance = new \App\Models\CUsuario;
        $instance->setConnection($this->getConnectionName());
        return $this->belongsTo($instance, 'id_encargado', 'id_usuario');
    }
}