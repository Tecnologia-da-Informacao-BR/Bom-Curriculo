<?php

namespace App\Services\Bot\DTO;

use App\Enums\UserLanguageLevelEnum;
use App\Enums\UserQualificationTypeEnum;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use stdClass;

final class BotCallbackDto
{
    private const SCHEMA = [
        'score' => 'score',
        'professional_summary' => 'string|null',
        'header' => [
            'name' => 'string|null',
            'headline' => 'string|null',
            'email' => 'string|null',
            'location' => 'string|null',
            'contacts' => 'string|null',
            'emails' => 'string|null',
            'links' => 'object<string>',
        ],
        'experiences' => [[
            'company' => 'string',
            'role' => 'string',
            'start' => 'string|null',
            'end' => 'string|null',
            'description' => 'string|null',
            'is_actual' => 'boolean|null',
            'city' => 'string|null',
            'state' => 'string|null',
            'country' => 'string|null',
        ]],
        'projects' => [[
            'title' => 'string',
            'start' => 'string|null',
            'end' => 'string|null',
            'technologies' => 'string|null',
            'description' => 'string|null',
            'url' => 'string|null',
        ]],
        'qualifications' => [[
            'type' => 'qualification_type',
            'institution' => 'string',
            'title' => 'string',
            'start' => 'string|null',
            'end' => 'string|null',
            'is_coursing' => 'boolean',
        ]],
        'skills' => [[
            'name' => 'string',
            'years' => 'integer|null',
        ]],
        'languages' => [[
            'level' => 'language_level',
            'language' => 'string',
        ]],
        'others' => 'object',
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
                'score' => is_int($value) && $value >= 0 && $value <= 100,
                'integer|null' => $value === null || is_int($value),
                'boolean' => is_bool($value),
                'boolean|null' => $value === null || is_bool($value),
                'qualification_type' => is_string($value) && UserQualificationTypeEnum::tryFrom($value) !== null,
                'language_level' => is_string($value) && UserLanguageLevelEnum::tryFrom($value) !== null,
                'object', 'object<string>' => self::isJsonObject($value),
            };

            if (! $valid) {
                self::invalid($path, "expected {$schema}");
            }

            if ($schema === 'object<string>') {
                foreach ($value as $label => $url) {
                    self::validateValue($url, 'string', "{$path}.{$label}");
                }
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

        if (! self::isJsonObject($value)) {
            self::invalid($path, 'expected a JSON object');
        }

        // Inspect object properties without changing the original payload's JSON shape.
        $value = $value instanceof stdClass ? get_object_vars($value) : $value;

        // The bot's model_dump includes defaulted fields, including nulls and empty collections.
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

    private static function isJsonObject(mixed $value): bool
    {
        return $value instanceof stdClass || (is_array($value) && ! array_is_list($value));
    }

    private static function invalid(string $path, string $reason): never
    {
        $message = "Invalid bot payload at {$path}: {$reason}.";

        Log::channel('bot')->error('BOT DTO fail', ['error' => $message]);

        throw new InvalidArgumentException($message, 502);
    }
}
