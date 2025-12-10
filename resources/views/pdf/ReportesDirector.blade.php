
<div class="rd-header">
   <table class="rd-logo-table">
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
    @if($tipo === 'vencidas')
        Reporte de Tareas Vencidas
    @elseif($tipo === 'proximas')
        Reporte de Tareas Próximas a Vencer
    @elseif($tipo === 'completadas')
        Reporte de Tareas Completadas
    @else
        Reporte de Tareas
    @endif

    @if(!empty($inicio) && !empty($fin))
        <br>
        <span style="font-size: 14px; color: #000; font-weight: bold;">
            del {{ \Carbon\Carbon::parse($inicio)->format('d/m/Y') }} 
            al {{ \Carbon\Carbon::parse($fin)->format('d/m/Y') }}
        </span>
    @elseif(!empty($fin))
        <br>
        <span style="font-size: 14px; color: #000; font-weight: bold;">
            hasta {{ \Carbon\Carbon::parse($fin)->format('d/m/Y') }}
        </span>
    @elseif(!empty($inicio))
        <br>
        <span style="font-size: 14px; color: #000; font-weight: bold;">
            desde {{ \Carbon\Carbon::parse($inicio)->format('d/m/Y') }}
        </span>
    @endif
</h2>


    @if($tareas->isEmpty())
       <div style="text-align: center; padding: 20px;">
            <p style="font-size: 16px; font-weight: bold; color: #000;">
                No se encontraron tareas que coincidan con los criterios de filtro seleccionados.
            </p>
        </div>
    @else
        <table>
            <thead>
                <tr>
                    <th>Proyecto</th>
                    <th>Tarea</th>
                    <th>Fecha Vencimiento</th>
                    <th>Usuario</th>
                    <th>Departamento</th> 
                </tr>
            </thead>
            <tbody>
                @foreach($tareas as $tarea)
                    <tr>
                        <td>{!! strtoupper($tarea->proyecto->p_nombre) !!}</td>
                        <td>{!! strtoupper($tarea->t_nombre) !!}</td>
                        <td>{!! $tarea->tf_fin !!}</td>
                        <td>
                            {!! $tarea->usuario ? strtoupper($tarea->usuario->u_nombre . ' ' . $tarea->usuario->a_paterno . ' ' . $tarea->usuario->a_materno) : 'Sin asignar' !!}
                        </td>
                        <td>
                            {!! $tarea->usuario ? strtoupper($tarea->usuario->departamento->d_nombre ?? 'Sin departamento') : '-' !!}
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif
    </div>



















