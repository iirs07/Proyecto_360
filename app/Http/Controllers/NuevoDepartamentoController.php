<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Area;
use App\Models\Departamento;

class NuevoDepartamentoController extends Controller
{
    /* ======================================================
       ===============  ÁREAS  ==============================
       ====================================================== */

    // Crear o Actualizar área
    public function crearArea(Request $request)
    {
        $accion = $request->accion ?? 'crear';

        switch ($accion) {
            case 'crear':
                $request->validate([
                    'nombre' => 'required|string|max:255|unique:c_areas,nombre'
                ]);

                $area = Area::create(['nombre' => $request->nombre]);

                return response()->json([
                    'success' => true,
                    'mensaje' => 'Área registrada correctamente',
                    'area' => $area
                ]);

            case 'actualizar':
                $request->validate([
                    'id' => 'required|integer|exists:c_areas,id',
                    'nombre' => 'required|string|max:255|unique:c_areas,nombre,' . $request->id
                ]);

                $area = Area::find($request->id);
                $area->nombre = $request->nombre;
                $area->save();

                return response()->json([
                    'success' => true,
                    'mensaje' => 'Área actualizada correctamente',
                    'area' => $area
                ]);

            default:
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Acción no válida'
                ], 400);
        }
    }

    // Listar todas las áreas
    public function listarAreas()
    {
        $areas = Area::all();
        
        return response()->json([
            'success' => true,
            'data' => $areas
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /* ======================================================
       ===============  DEPARTAMENTOS =======================
       ====================================================== */

    // UNA sola API para: crear, actualizar, eliminar departamentos
    public function departamentos(Request $request)
    {
        $accion = $request->accion;

        // Log para debug
        \Log::info('API departamentos - Acción: ' . $accion);
        \Log::info('Datos recibidos: ', $request->all());

        switch ($accion) {

            /* -------- CREAR -------- */
            case 'crear':
                $request->validate([
                    'd_nombre' => 'required|string|max:255|unique:c_departamento,d_nombre',
                    'area_id' => 'required|integer|exists:c_areas,id'
                ]);

                $departamento = Departamento::create([
                    'd_nombre' => $request->d_nombre,
                    'area_id' => $request->area_id
                ]);

                $departamento->load('area');

                return response()->json([
                    'success' => true,
                    'mensaje' => 'Departamento creado correctamente',
                    'departamento' => $departamento
                ], 201);

            /* -------- ACTUALIZAR -------- */
            case 'actualizar':
                \Log::info('=== ACTUALIZAR DEPARTAMENTO ===');
                \Log::info('ID recibido: ' . $request->id);
                \Log::info('Nuevo nombre: ' . $request->d_nombre);
                \Log::info('Area ID: ' . $request->area_id);
                
                // IMPORTANTE: La tabla usa 'id_departamento' como PK, pero React envía 'id'
                // Validar que el 'id' existe en la columna 'id_departamento'
                $request->validate([
                    'id' => 'required|integer|exists:c_departamento,id_departamento',
                    'd_nombre' => 'required|string|max:255|unique:c_departamento,d_nombre,' . $request->id . ',id_departamento',
                    'area_id' => 'required|integer|exists:c_areas,id'
                ]);

                \Log::info('Buscando departamento con id_departamento: ' . $request->id);
                
                // Buscar el departamento por id_departamento
                $departamento = Departamento::where('id_departamento', $request->id)->first();
                
                if (!$departamento) {
                    \Log::error('Departamento no encontrado con id_departamento: ' . $request->id);
                    return response()->json([
                        'success' => false,
                        'mensaje' => 'Departamento no encontrado'
                    ], 404);
                }

                \Log::info('Departamento encontrado:');
                \Log::info('- id_departamento: ' . $departamento->id_departamento);
                \Log::info('- Nombre actual: ' . $departamento->d_nombre);
                \Log::info('- Area ID actual: ' . $departamento->area_id);
                
                // Actualizar el departamento
                $departamento->d_nombre = $request->d_nombre;
                $departamento->area_id = $request->area_id;
                $saved = $departamento->save();
                
                \Log::info('Guardado exitoso: ' . ($saved ? 'SÍ' : 'NO'));
                \Log::info('Nuevos valores guardados:');
                \Log::info('- Nombre: ' . $departamento->d_nombre);
                \Log::info('- Area ID: ' . $departamento->area_id);

                // Recargar relaciones
                $departamento->load('area');

                return response()->json([
                    'success' => true,
                    'mensaje' => 'Departamento actualizado correctamente',
                    'departamento' => $departamento
                ]);

            /* -------- ELIMINAR -------- */
            case 'eliminar':
                $request->validate([
                    'id' => 'required|integer|exists:c_departamento,id_departamento'
                ]);

                $departamento = Departamento::where('id_departamento', $request->id)
                    ->withCount('usuarios')
                    ->first();
                
                if ($departamento->usuarios_count > 0) {
                    return response()->json([
                        'success' => false,
                        'mensaje' => 'No se puede eliminar el departamento porque tiene usuarios asociados'
                    ], 400);
                }

                $departamento->delete();

                return response()->json([
                    'success' => true,
                    'mensaje' => 'Departamento eliminado correctamente'
                ]);

            default:
                return response()->json([
                    'success' => false,
                    'error' => 'Acción no válida'
                ], 400);
        }
    }

    /* ======================================================
       ===============  VISUALIZAR LISTA ====================
       ====================================================== */

    public function listar()
    {
        $departamentos = Departamento::with('area')->get();
        
        return response()->json([
            'success' => true,
            'data' => $departamentos
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    // Listar áreas con sus departamentos
    public function listarAreasConDepartamentos()
    {
        $areas = Area::with('departamentos')->get();
        
        return response()->json([
            'success' => true,
            'data' => $areas
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}