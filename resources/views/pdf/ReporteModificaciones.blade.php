<div class="rd-header">
    <table class="rd-logo-table" style="width: 100%; border: none;">
        <tr>
         <td class="rd-logo-cell left"><img src="{{ public_path('imagenes/logo1.png') }}" class="rd-logo-img" /></td>
         <td class="rd-logo-cell center"><img src="{{ public_path('imagenes/logo2.png') }}" class="rd-logo-img" /></td>
         <td class="rd-logo-cell right"><img src="{{ public_path('imagenes/logo3.png') }}" class="rd-logo-img" /></td>
      </tr>
    </table>

    <div class="rd-header-center">
        <div class="rd-titulo">H. Ayuntamiento de Minatitlán, Ver.</div>
        <div class="rd-subtitulo">Sistema de Gestión de Tareas</div>
        <div class="rd-subtitulo">
            Departamento: {{ ucwords(strtolower($usuario['departamento'] ?? '')) }}
        </div>
        <div class="rd-subtitulo">Fecha: {!! $hoy ?? '' !!} | Hora: {!! $hora ?? '' !!}</div>
        <div class="rd-subtitulo">
            Reporte generado por:
            {{ ucwords(strtolower($usuario['nombre'] ?? '')) }}
            {{ ucwords(strtolower($usuario['a_paterno'] ?? '')) }}
            {{ ucwords(strtolower($usuario['a_materno'] ?? '')) }}
        </div>
    </div>

    <div class="rd-divider"></div>
</div>

<div class="rd-contenido-principal">
   <h2>
    Reporte de Historial de Modificaciones
    <br>
    @if(!empty($inicio) && !empty($fin))
        <span style="font-size: 14px; color: #000; font-weight: bold;">
            del {{ \Carbon\Carbon::parse($inicio)->format('d/m/Y') }} 
            al {{ \Carbon\Carbon::parse($fin)->format('d/m/Y') }}
        </span>
    @endif
</h2>

@if($movimientos->isNotEmpty())
    <table>
        <thead>
            <tr>
                <th width="3%">Fecha</th>
                <th width="3%">Hora</th>
                <th width="16%">Modificó</th>
                <th width="18%">Proyecto</th>
                <th width="18%">Tarea</th>
                <th width="10%">Acción</th>
                <th width="22%">Detalles</th>
            </tr>
        </thead>
        <tbody>
            @foreach($movimientos as $mov)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($mov->created_at)->format('d/m/Y') }}</td>
                    <td>{{ \Carbon\Carbon::parse($mov->created_at)->format('h:i A') }}</td>
                    <td>{!! strtoupper($mov->usuario_nombre . ' ' . $mov->a_paterno . ' ' . ($mov->a_materno ?? '')) !!}</td>
                    <td style="text-align: left;">{!! strtoupper($mov->proyecto) !!}</td>
                    <td style="text-align: left;">
    @if($mov->tarea)
        {!! strtoupper($mov->tarea) !!}
    @elseif(str_contains(strtoupper($mov->accion), 'PROYECTO'))
        <span style="color: #666; font-size: 10px;">ACCIÓN DE NIVEL PROYECTO</span>
    @else
        <span>NO APLICA</span>
    @endif
</td>
                    <td>{!! strtoupper($mov->accion) !!}</td>
                    <td style="text-align: justify;">{!! strtoupper($mov->detalles) !!}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@else
    <div style="text-align: center; padding: 20px;">
        <p style="font-size: 16px; font-weight: bold; color: #000;">
        No se encontraron registros de modificaciones en este periodo.
    </div>
@endif
