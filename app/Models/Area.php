<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    protected $table = 'c_areas';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = ['nombre'];

    // 🔹 Relación: un área tiene muchos departamentos
    public function departamentos()
    {
        return $this->hasMany(Departamento::class, 'area_id', 'id');
    }
}

