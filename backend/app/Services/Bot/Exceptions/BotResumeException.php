<?php

namespace App\Services\Bot\Exceptions;

use RuntimeException;
use Throwable;

final class BotResumeException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?int $upstreamStatus = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }
}
