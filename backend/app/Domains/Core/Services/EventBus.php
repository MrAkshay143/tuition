<?php

namespace App\Domains\Core\Services;

use Illuminate\Support\Facades\Event;

class EventBus
{
    /**
     * Dispatch a domain event to listeners.
     */
    public static function dispatch(object $event): void
    {
        Event::dispatch($event);
    }
}
