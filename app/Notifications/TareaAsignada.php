<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class TareaAsignada extends Notification
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
    $nombreCompleto = $notifiable->cusuario 
        ? $notifiable->cusuario->u_nombre.' '.$notifiable->cusuario->a_paterno.' '.$notifiable->cusuario->a_materno
        : 'Usuario';

    return (new \Illuminate\Notifications\Messages\MailMessage)
        ->subject('Nueva tarea asignada')
        ->view('emails.tareas.asignada', [
            'tarea' => $this->tarea,
            'nombreCompleto' => $nombreCompleto
        ]);
}
}

