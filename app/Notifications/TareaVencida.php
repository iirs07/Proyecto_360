<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class TareaVencida extends Notification
{
    protected $tarea;

    public function __construct($tarea)
    {
        $this->tarea = $tarea;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        // Verifica si cusuario existe antes de acceder a sus campos
        $nombreCompleto = $notifiable->cusuario
            ? trim(
                $notifiable->cusuario->u_nombre . ' ' .
                $notifiable->cusuario->a_paterno . ' ' .
                $notifiable->cusuario->a_materno
              )
            : 'Usuario';

        return (new MailMessage)
            ->subject('Tarea Vencida')
            ->view('emails.tareas.tarea_vencida', [
                'tarea' => $this->tarea,
                'nombreCompleto' => $nombreCompleto
            ]);
    }
}


