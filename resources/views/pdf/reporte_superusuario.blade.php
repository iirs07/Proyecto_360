<div class="header">
    <table class="logo-table">
        <tr>
            <td class="logo-cell left">
                <img src="{{ public_path('imagenes/logo1.png') }}" class="logo-img" alt="Logo Izquierda" />
            </td>
            <td class="logo-cell center">
                <img src="{{ public_path('imagenes/logo2.png') }}" class="logo-img" alt="Logo Centro" />
            </td>
            <td class="logo-cell right">
                <img src="{{ public_path('imagenes/logo3.png') }}" class="logo-img" alt="Logo Derecha" />
            </td>
        </tr>
    </table>

    <div class="header-center">
        <div class="titulo">H. Ayuntamiento de Minatitlán, Ver.</div>
        <div class="subtitulo">Sistema de Gestión de Proyectos</div>
        <div class="subtitulo reporte-fecha-hora">
            Fecha: {!! $hoy ?? date('d/m/Y') !!} | Hora: {!! $hora ?? date('H:i:s') !!} <br>
        </div>
        <div class="subtitulo">Presidencia Municipal: {{ $usuarioGenera ?? 'Desconocido' }}</div> 
    </div>

    <div class="divider"></div> 
</div>

@php
$meses = [
    1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril', 
    5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
    9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
];
@endphp

<h2 class="reporte-titulo">
    @if($filtros['fechaInicio'] && $filtros['fechaFin'])
        Reporte de proyectos del {{ date('d/m/Y', strtotime($filtros['fechaInicio'])) }} al {{ date('d/m/Y', strtotime($filtros['fechaFin'])) }}
    @elseif($filtros['anio'] && $filtros['mes'])
        @php $mesNumero = (int) substr($filtros['mes'], 0, 2); @endphp
        Reporte de proyectos del mes de {{ $meses[$mesNumero] }} del {{ $filtros['anio'] }}
    @elseif($filtros['anio'])
        Reporte de proyectos del año {{ $filtros['anio'] }}
    @else
        REPORTE DETALLADO DE PROYECTOS
    @endif
</h2>

<div class="tabla-proyectos-container">
    @if(empty($proyectosAgrupados))
        <p class="alerta-sin-datos">⚠️ No se encontraron proyectos con los filtros seleccionados.</p>
    @else
        @foreach($proyectosAgrupados as $area => $estados)
            <h3 class="area-nombre">Área: {{ $area }}</h3>

            @foreach($estados as $estado => $listaProyectos)
                <h4 class="estado-proyecto">Estatus: {{ $estado }}</h4>
                
                <table class="tabla-proyectos">
                    <thead>
                        <tr>
                            <th>Proyecto</th>
                            <th>Departamento</th>
                            <th>Responsable</th>
                            <th>Avance (%)</th>
                            <th>F. Inicio</th>
                            <th>F. Fin</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($listaProyectos as $proyecto)
                        <tr>
                            <td>{{ $proyecto->p_nombre }}</td>
                            <td>{{ $proyecto->departamento->d_nombre ?? 'N/A' }}</td>
                            <td>{{ $proyecto->responsable ?? 'Sin Asignar' }}</td>
                            <td>{{ $proyecto->avance_porcentaje ?? 0 }}%</td>
                            <td>{{ date('d/m/Y', strtotime($proyecto->pf_inicio)) }}</td>
                            <td>{{ date('d/m/Y', strtotime($proyecto->pf_fin)) }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            @endforeach
        @endforeach
    @endif
</div>