<?php

use App\Services\Bot\DTO\BotCallbackDto;
use Illuminate\Support\Arr;

beforeEach(function () {
    $this->payload = json_decode(
        file_get_contents(base_path('tests/Fixtures/bot_resume_payload.json')),
        true,
        512,
        JSON_THROW_ON_ERROR
    );
});

it('preserves the complete canonical bot payload without adding or renaming fields', function () {
    expect(BotCallbackDto::fromData($this->payload)->toArray())->toBe($this->payload);
});

it('accepts null in every nullable field without removing any keys', function () {
    $payload = $this->payload;

    foreach ([
        'professional_summary',
        'header.name', 'header.headline', 'header.email', 'header.location',
        'header.contacts', 'header.emails',
        'experiences.0.start', 'experiences.0.end', 'experiences.0.description',
        'experiences.0.is_actual', 'experiences.0.city', 'experiences.0.state', 'experiences.0.country',
        'projects.0.start', 'projects.0.end', 'projects.0.technologies',
        'projects.0.description', 'projects.0.url',
        'qualifications.0.start', 'qualifications.0.end', 'skills.0.years',
    ] as $path) {
        Arr::set($payload, $path, null);
    }

    expect(BotCallbackDto::fromData($payload)->toArray())->toBe($payload);
});

it('preserves empty lists and empty JSON objects as different structures', function () {
    $payload = $this->payload;

    foreach (['experiences', 'projects', 'qualifications', 'skills', 'languages'] as $field) {
        $payload[$field] = [];
    }
    $payload['header']['links'] = (object) [];
    $payload['others'] = (object) [];

    $result = BotCallbackDto::fromData($payload)->toArray();

    expect($result)->toBe($payload)
        ->and(json_encode($result, JSON_THROW_ON_ERROR))->toContain('"links":{}', '"others":{}', '"skills":[]');
});

it('accepts nested stdClass objects without changing their representation', function () {
    $payload = (array) json_decode(
        file_get_contents(base_path('tests/Fixtures/bot_resume_payload.json')),
        false,
        512,
        JSON_THROW_ON_ERROR
    );

    expect(BotCallbackDto::fromData($payload)->toArray())->toBe($payload);
});

it('preserves arbitrary JSON values inside others and numeric object keys', function () {
    $payload = $this->payload;
    $payload['header']['links'] = (object) ['0' => 'https://example.test'];
    $payload['others'] = (object) [
        '0' => null,
        'certifications' => ['Cloud certification'],
        'details' => (object) ['verified' => false, 'weight' => 2.5],
        'empty_object' => (object) [],
        'empty_list' => [],
    ];

    $result = BotCallbackDto::fromData($payload)->toArray();

    expect($result)->toBe($payload)
        ->and(json_encode($result, JSON_THROW_ON_ERROR))->toContain('"empty_object":{}', '"empty_list":[]');
});

it('accepts scores at the boundaries of the Python contract', function (int $score) {
    $payload = $this->payload;
    $payload['score'] = $score;

    expect(BotCallbackDto::fromData($payload)->toArray())->toBe($payload);
})->with([0, 50, 100]);

it('accepts integer or null skill years without inventing a range constraint', function (?int $years) {
    $payload = $this->payload;
    $payload['skills'][0]['years'] = $years;

    expect(BotCallbackDto::fromData($payload)->toArray())->toBe($payload);
})->with([0, 6, -1, null]);

it('accepts every Python qualification type', function (string $type) {
    $payload = $this->payload;
    $payload['qualifications'][0]['type'] = $type;

    expect(BotCallbackDto::fromData($payload)->toArray())->toBe($payload);
})->with([
    'elementary_education', 'high_school', 'extracurricular_course', 'technical_course',
    'undergraduate_degree', 'postgraduate_degree', 'master_degree', 'doctorate_degree',
]);

it('accepts every Python language level', function (string $level) {
    $payload = $this->payload;
    $payload['languages'][0]['level'] = $level;

    expect(BotCallbackDto::fromData($payload)->toArray())->toBe($payload);
})->with(['beginner', 'intermediate', 'advanced', 'fluent', 'native']);

it('requires every key emitted by the bot serializer', function (string $path) {
    $payload = $this->payload;
    Arr::forget($payload, $path);

    expect(fn () => BotCallbackDto::fromData($payload))
        ->toThrow(InvalidArgumentException::class, "payload.{$path}: missing required field", 502);
})->with([
    'score', 'professional_summary', 'header', 'experiences', 'projects',
    'qualifications', 'skills', 'languages', 'others',
    'header.name', 'header.headline', 'header.email', 'header.location',
    'header.contacts', 'header.emails', 'header.links',
    'experiences.0.company', 'experiences.0.role', 'experiences.0.start', 'experiences.0.end',
    'experiences.0.description', 'experiences.0.is_actual',
    'experiences.0.city', 'experiences.0.state', 'experiences.0.country',
    'projects.0.title', 'projects.0.start', 'projects.0.end', 'projects.0.technologies',
    'projects.0.description', 'projects.0.url',
    'qualifications.0.type', 'qualifications.0.institution', 'qualifications.0.title',
    'qualifications.0.start', 'qualifications.0.end', 'qualifications.0.is_coursing',
    'skills.0.name', 'skills.0.years', 'languages.0.level', 'languages.0.language',
]);

it('rejects legacy and extra keys in closed objects', function (string $path) {
    $payload = $this->payload;
    Arr::set($payload, $path, null);

    expect(fn () => BotCallbackDto::fromData($payload))
        ->toThrow(InvalidArgumentException::class, "payload.{$path}: unexpected field", 502);
})->with([
    'personal', 'target_role', 'education', 'courses', 'certifications',
    'additional_informations', 'user_resume_id',
    'header.summary', 'header.extra', 'experiences.0.start_date', 'experiences.0.extra',
    'projects.0.name', 'projects.0.extra', 'qualifications.0.extra',
    'skills.0.title', 'skills.0.extra', 'languages.0.extra',
]);

it('rejects incorrect types without coercing values', function (string $path, mixed $value) {
    $payload = $this->payload;
    Arr::set($payload, $path, $value);

    expect(fn () => BotCallbackDto::fromData($payload))
        ->toThrow(InvalidArgumentException::class, "payload.{$path}", 502);
})->with([
    'negative score' => ['score', -1],
    'score above 100' => ['score', 101],
    'fractional score' => ['score', 90.5],
    'float score' => ['score', 90.0],
    'numeric string score' => ['score', '90'],
    'null score' => ['score', null],
    'boolean score' => ['score', true],
    'null header' => ['header', null],
    'list header' => ['header', []],
    'numeric name' => ['header.name', 12],
    'list contacts' => ['header.contacts', ['123']],
    'list emails' => ['header.emails', ['example@test.com']],
    'object location' => ['header.location', ['city' => 'Salvador']],
    'null links' => ['header.links', null],
    'empty list links' => ['header.links', []],
    'list links' => ['header.links', ['https://example.test']],
    'null link' => ['header.links.GitHub', null],
    'numeric link' => ['header.links.GitHub', 1],
    'object link' => ['header.links.GitHub', ['url' => 'https://example.test']],
    'object summary' => ['professional_summary', ['text' => 'Summary']],
    'null collection' => ['skills', null],
    'object collection' => ['qualifications', ['title' => 'Computer Science']],
    'empty object collection' => ['experiences', (object) []],
    'numeric object collection' => ['skills', (object) ['0' => ['name' => 'PHP', 'years' => null]]],
    'sparse collection' => ['languages', [1 => ['language' => 'Português', 'level' => 'native']]],
    'null item' => ['projects.0', null],
    'list item' => ['qualifications.0', []],
    'null company' => ['experiences.0.company', null],
    'null role' => ['experiences.0.role', null],
    'null project title' => ['projects.0.title', null],
    'list technologies' => ['projects.0.technologies', ['PHP']],
    'null institution' => ['qualifications.0.institution', null],
    'null qualification title' => ['qualifications.0.title', null],
    'invalid qualification type' => ['qualifications.0.type', 'higher_education'],
    'null qualification type' => ['qualifications.0.type', null],
    'null skill name' => ['skills.0.name', null],
    'numeric string years' => ['skills.0.years', '6'],
    'fractional years' => ['skills.0.years', 6.5],
    'float years' => ['skills.0.years', 6.0],
    'boolean years' => ['skills.0.years', true],
    'integer is_actual' => ['experiences.0.is_actual', 1],
    'string is_actual' => ['experiences.0.is_actual', 'false'],
    'integer is_coursing' => ['qualifications.0.is_coursing', 1],
    'string is_coursing' => ['qualifications.0.is_coursing', 'false'],
    'null is_coursing' => ['qualifications.0.is_coursing', null],
    'null language' => ['languages.0.language', null],
    'null language level' => ['languages.0.level', null],
    'invalid language level' => ['languages.0.level', 'expert'],
    'null others' => ['others', null],
    'empty list others' => ['others', []],
    'list others' => ['others', ['information']],
    'string others' => ['others', 'information'],
]);

it('preserves dates as free form strings or null without imposing a date format', function (string $path) {
    foreach (['2024', '2024-01', '2024-01-31', 'January 2024', '2024-13', '', null] as $date) {
        $payload = $this->payload;
        Arr::set($payload, $path, $date);

        expect(BotCallbackDto::fromData($payload)->toArray())->toBe($payload);
    }

    foreach ([202401, false, ['year' => 2024]] as $date) {
        $payload = $this->payload;
        Arr::set($payload, $path, $date);

        expect(fn () => BotCallbackDto::fromData($payload))
            ->toThrow(InvalidArgumentException::class, "payload.{$path}", 502);
    }
})->with([
    'experiences.0.start', 'experiences.0.end',
    'projects.0.start', 'projects.0.end',
    'qualifications.0.start', 'qualifications.0.end',
]);
