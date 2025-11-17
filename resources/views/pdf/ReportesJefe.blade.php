<div class="rj-header">
   <table class="rj-logo-table">
      <tr>
         <td class="rj-logo-cell left"><img src="{{ public_path('imagenes/logo1.png') }}" class="rj-logo-img" /></td>
         <td class="rj-logo-cell center"><img src="{{ public_path('imagenes/logo2.png') }}" class="rj-logo-img" /></td>
         <td class="rj-logo-cell right"><img src="{{ public_path('imagenes/logo3.png') }}" class="rj-logo-img" /></td>
      </tr>
   </table>

   <div class="rj-header-center">
      <div class="rj-titulo">H. Ayuntamiento de Minatitlán, Ver.</div>
      <div class="rj-subtitulo">Sistema de Gestión de Proyectos</div>
      <div class="rj-subtitulo">
         Departamento: {{ ucwords(strtolower($usuario['departamento'] ?? '')) }}
      </div>

      <div class="rj-subtitulo">Fecha: {!! $hoy ?? '' !!} | Hora: {!! $hora ?? '' !!}</div>

      <div class="rj-subtitulo">
         Reporte generado por:
         {{ ucwords(strtolower($usuario['nombre'] ?? '')) }}
         {{ ucwords(strtolower($usuario['a_paterno'] ?? '')) }}
         {{ ucwords(strtolower($usuario['a_materno'] ?? '')) }}
      </div>
   </div>

   <div class="rj-divider"></div>
</div>

<!-- Contenido -->
<div class="rj-contenido-principal">

   <h2>
      Reporte de Tareas Completadas
      @if(!empty($inicio) && !empty($fin))
         del {!! $inicio !!} al {!! $fin !!}
      @elseif(!empty($fin))
         hasta {!! $fin !!}
      @elseif(!empty($inicio))
         desde {!! $inicio !!}
      @endif
   </h2>

   @if($tareas->isEmpty())

      <p style="text-align:center; font-size:16px; margin-top:20px;">
         <strong>No se encontraron tareas completadas en el periodo seleccionado.</strong>
      </p>

   @else

      <table>
         <thead>
            <tr>
               <th>Proyecto</th>
               <th>Tarea</th>
               <th>Fecha Completada</th>
            </tr>
         </thead>
         <tbody>
            @foreach($tareas as $tarea)
               <tr>
                  <td>{!! strtoupper($tarea->proyecto->p_nombre) !!}</td>
                  <td>{!! strtoupper($tarea->t_nombre) !!}</td>
                  <td>{!! $tarea->tf_completada !!}</td>
               </tr>
            @endforeach
         </tbody>
      </table>

   @endif

</div>

