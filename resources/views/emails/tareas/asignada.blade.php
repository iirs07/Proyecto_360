<div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); text-align: center; font-family: Arial, sans-serif;">

    <h2 style="color: #2c3e50; margin-bottom: 10px;">
        ¡Hola, {{ ucwords(strtolower($nombreCompleto)) }}!
    </h2>

    <p style="font-size: 16px; color: #555555; margin-bottom: 25px;">
        Se te ha asignado una nueva tarea:
    </p>

    <div style="border: 2px solid #5dade2; padding: 20px; border-radius: 10px; background-color: #f0f8ff; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <p style="text-transform: uppercase; font-weight: bold; color: #2c3e50; font-size: 18px;">
            TAREA: {{ $tarea->t_nombre }}
        </p>
        <p style="text-transform: uppercase; font-weight: bold; color: #2c3e50; font-size: 16px;">
            DESCRIPCIÓN: {{ $tarea->descripcion }}
        </p>
        <p style="font-weight: bold; color: #2c3e50; font-size: 16px; margin-top: 10px;">
            FECHA LÍMITE: {{ $tarea->tf_fin }}
        </p>
    </div>

    <p style="font-size: 14px; color: #888888; margin-top: 20px;">
        Por favor, revisa tu panel de tareas para más detalles.
    </p>

    <p style="font-size: 12px; color: #aaaaaa; margin-top: 30px;">
        Este correo se generó automáticamente, por favor no respondas.
    </p>

</div>





