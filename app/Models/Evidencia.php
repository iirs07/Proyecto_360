<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evidencia extends Model
{
    use HasFactory;

    protected $table = 'evidencias';
    protected $primaryKey = 'id_evidencia';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'id_proyecto',
        'id_tarea',
        'id_departamento',
        'id_usuario',
        'ruta_archivo',
        'fecha',
    ];

    // 🔹 Relaciones
    public function tarea()
    {
        return $this->belongsTo(Tarea::class, 'id_tarea', 'id_tarea');
    }

    public function proyecto()
    {
        return $this->belongsTo(Proyecto::class, 'id_proyecto', 'id_proyecto');
    }

    public function usuario()
    {
        return $this->belongsTo(CUsuario::class, 'id_usuario', 'id_usuario');
    }

    public function departamento()
    {
        return $this->belongsTo(Departamento::class, 'id_departamento', 'id_departamento');
    }

    // 🔹 Accessor para obtener la URL pública del archivo
    protected $appends = ['archivo_url'];

    public function getArchivoUrlAttribute()
    {
        return asset('storage/' . $this->ruta_archivo);
    }
}
