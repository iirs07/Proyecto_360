<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proyecto extends Model
{
    protected $table = 'proyectos';

    protected $primaryKey = 'id_proyecto'; // clave primaria real

    protected $fillable = [
        'id_departamento',
        'p_nombre',
        'descripcion',
        'pf_inicio',
        'pf_fin',
        'p_estatus'
    ];

    public $timestamps = true;

    // 🟢 RELACIÓN 1: Todas las tareas
    public function tareas()
    {
        return $this->hasMany(\App\Models\Tarea::class, 'id_proyecto', 'id_proyecto');
    }

    // 🟢 RELACIÓN 2: Tareas completadas (¡Nueva relación clave para withCount!)
    public function tareasCompletadas()
    {
        return $this->hasMany(\App\Models\Tarea::class, 'id_proyecto', 'id_proyecto')
                    ->where('t_estatus', 'Completada'); 
    }

    // 🟢 RELACIÓN 3: Departamento
    public function departamento()
    {
        return $this->belongsTo(\App\Models\Departamento::class, 'id_departamento', 'id_departamento');
    }
    
    // 🟢 RELACIÓN 4: Encargado directo
    public function encargado()
    {
        // Se relaciona con CUsuario usando la clave foránea 'id_encargado' 
        // en la tabla 'proyectos' y la clave local 'id_usuario' en 'c_usuario'.
        return $this->belongsTo(\App\Models\CUsuario::class, 'id_encargado', 'id_usuario');
    }
    
    /*
    ⚠️ NOTA: Este accessor (getAvancePorcentajeAttribute) hará consultas N+1 si lo llamas 
    en un bucle. Es más eficiente usar 'withCount' en el controlador. 
    Lo mantenemos por si se usa en otras partes del código que no cargan withCount.
    */
    public function getAvancePorcentajeAttribute()
    {
        $totalTareas = $this->tareas()->count();
        
        if ($totalTareas === 0) {
            return 0;
        }
        
        $tareasCompletadas = $this->tareas()->where('t_estatus', 'Completada')->count(); 
        
        return round(($tareasCompletadas / $totalTareas) * 100);
    }
}