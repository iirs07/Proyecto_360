<div class="header">
   <table class="logo-table">
      <tr>
         <td class="logo-cell left"><img src="{{ public_path('imagenes/logo1.png') }}" class="logo-img" /></td>
         <td class="logo-cell center"><img src="{{ public_path('imagenes/logo2.png') }}" class="logo-img" /></td>
         <td class="logo-cell right"><img src="{{ public_path('imagenes/logo3.png') }}" class="logo-img" /></td>
      </tr>
   </table>

   <div class="header-center">
      <div class="titulo">H. Ayuntamiento de Minatitlán, Ver.</div>
      <div class="subtitulo">Sistema de Gestión de Proyectos</div>
      <div class="subtitulo">
         Departamento: {{ ucwords(strtolower($usuario['departamento'] ?? '')) }}
      </div>

      <div class="subtitulo">Fecha: {!! $hoy ?? '' !!} | Hora: {!! $hora ?? '' !!}</div>

      <div class="subtitulo">
         Reporte generado por:
         {{ ucwords(strtolower($usuario['nombre'] ?? '')) }}
         {{ ucwords(strtolower($usuario['a_paterno'] ?? '')) }}
         {{ ucwords(strtolower($usuario['a_materno'] ?? '')) }}
      </div>
   </div>

   <div class="divider"></div>
</div>

<!-- Contenido -->
<div class="contenido-principal">

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

