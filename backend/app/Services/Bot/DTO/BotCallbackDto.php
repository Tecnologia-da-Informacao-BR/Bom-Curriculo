<?php

namespace App\Services\Bot\DTO;

use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

final class BotCallbackDto
{
    private const SCHEMA = [
        'personal' => [
            'name' => 'string|null',
            'email' => 'string|null',
            'phone' => 'string|null',
            'location' => [
                'city' => 'string|null',
                'state' => 'string|null',
                'country' => 'string|null',
            ],
            'linkedin' => 'string|null',
            'github' => 'string|null',
            'portfolio' => 'string|null',
        ],
        'professional_summary' => 'string|null',
        'target_role' => 'string|null',
        'skills' => [[
            'title' => 'string|null',
            'years' => 'number',
            'level' => 'string|null',
        ]],
        'experiences' => [[
            'company' => 'string|null',
            'role' => 'string|null',
            'employment_type' => 'string|null',
            'location' => 'string|null',
            'start_date' => 'YYYY-MM|null',
            'end_date' => 'YYYY-MM|null',
            'current' => 'boolean',
            'description' => 'string|null',
            'responsibilities' => ['string'],
            'achievements' => ['string'],
            'skills' => ['string'],
        ]],
        'education' => [[
            'institution' => 'string|null',
            'degree' => 'string|null',
            'start_date' => 'YYYY-MM|null',
            'end_date' => 'YYYY-MM|null',
            'current' => 'boolean',
        ]],
        'courses' => [[
            'title' => 'string|null',
            'institution' => 'string|null',
            'completion_date' => 'YYYY-MM|null',
            'workload' => 'number',
            'certificate_url' => 'string|null',
        ]],
        'languages' => [[
            'language' => 'string|null',
            'level' => 'string|null',
        ]],
        'projects' => [[
            'name' => 'string|null',
            'description' => 'string|null',
            'url' => 'string|null',
            'skills' => ['string'],
        ]],
        'certifications' => [[
            'title' => 'string|null',
            'issuer' => 'string|null',
            'date' => 'YYYY-MM|null',
            'credential_url' => 'string|null',
        ]],
        'additional_informations' => 'string|null',
    ];

    private function __construct(private readonly array $payload) {}

    public static function fromData(array $data): self
    {
        self::validateValue($data, self::SCHEMA, 'payload');

        return new self($data);
    }

    public function toArray(): array
    {
        return $this->payload;
    }

    private static function validateValue(mixed $value, array|string $schema, string $path): void
    {
        if (is_string($schema)) {
            $valid = match ($schema) {
                'string' => is_string($value),
                'string|null' => $value === null || is_string($value),
                'number' => (is_int($value) || is_float($value)) && is_finite($value),
                'boolean' => is_bool($value),
                'YYYY-MM|null' => $value === null || (is_string($value)
                    && preg_match('/\A[0-9]{4}-(0[1-9]|1[0-2])\z/', $value) === 1),
            };

            if (! $valid) {
                self::invalid($path, "expected {$schema}");
            }

            return;
        }

        if (array_is_list($schema)) {
            if (! is_array($value) || ! array_is_list($value)) {
                self::invalid($path, 'expected a JSON list');
            }

            foreach ($value as $index => $item) {
                self::validateValue($item, $schema[0], "{$path}.{$index}");
            }

            return;
        }

        if (! is_array($value) || array_is_list($value)) {
            self::invalid($path, 'expected a JSON object');
        }

        foreach ($schema as $field => $fieldSchema) {
            if (! array_key_exists($field, $value)) {
                self::invalid("{$path}.{$field}", 'missing required field');
            }

            self::validateValue($value[$field], $fieldSchema, "{$path}.{$field}");
        }

        foreach ($value as $field => $item) {
            if (! array_key_exists($field, $schema)) {
                self::invalid("{$path}.{$field}", 'unexpected field');
            }
        }
    }

    private static function invalid(string $path, string $reason): never
    {
        $message = "Invalid bot payload at {$path}: {$reason}.";

        Log::channel('bot')->error('BOT DTO fail', ['error' => $message]);

        throw new InvalidArgumentException($message, 502);
    }
}
