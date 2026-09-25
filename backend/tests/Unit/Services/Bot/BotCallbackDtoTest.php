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

it('preserves the complete validated AI payload without legacy fields', function () {
    expect(BotCallbackDto::fromData($this->payload)->toArray())->toBe($this->payload);
});

it('accepts null in every nullable field without removing any keys', function () {
    $payload = $this->payload;

    foreach ([
        'personal.name', 'personal.email', 'personal.phone',
        'personal.location.city', 'personal.location.state', 'personal.location.country',
        'personal.linkedin', 'personal.github', 'personal.portfolio',
        'professional_summary', 'target_role', 'additional_informations',
        'skills.0.title', 'skills.0.level',
        'experiences.0.company', 'experiences.0.role', 'experiences.0.employment_type',
        'experiences.0.location', 'experiences.0.start_date', 'experiences.0.end_date',
        'experiences.0.description', 'education.0.institution', 'education.0.degree',
        'education.0.start_date', 'education.0.end_date', 'courses.0.title',
        'courses.0.institution', 'courses.0.completion_date', 'courses.0.certificate_url',
        'languages.0.language', 'languages.0.level', 'projects.0.name',
        'projects.0.description', 'projects.0.url', 'certifications.0.title',
        'certifications.0.issuer', 'certifications.0.date', 'certifications.0.credential_url',
    ] as $path) {
        Arr::set($payload, $path, null);
    }

    expect(BotCallbackDto::fromData($payload)->toArray())->toBe($payload);
});

it('accepts empty lists at every collection field', function () {
    $payload = $this->payload;

    foreach (['experiences.0.responsibilities', 'experiences.0.achievements', 'experiences.0.skills', 'projects.0.skills'] as $path) {
        Arr::set($payload, $path, []);
    }

    expect(BotCallbackDto::fromData($payload)->toArray())->toBe($payload);

    foreach (['skills', 'experiences', 'education', 'courses', 'languages', 'projects', 'certifications'] as $field) {
        $payload[$field] = [];
    }

    expect(BotCallbackDto::fromData($payload)->toArray())->toBe($payload);
});

it('accepts integer and fractional numbers without adding range constraints', function (int|float $value) {
    $payload = $this->payload;
    $payload['skills'][0]['years'] = $value;
    $payload['courses'][0]['workload'] = $value;

    expect(BotCallbackDto::fromData($payload)->toArray())->toBe($payload);
})->with([0, 6, 2.5, -1, -0.5]);

it('requires every declared root and nested key', function (string $path) {
    $payload = $this->payload;
    Arr::forget($payload, $path);

    expect(fn () => BotCallbackDto::fromData($payload))
        ->toThrow(InvalidArgumentException::class, "payload.{$path}: missing required field", 502);
})->with([
    'personal', 'professional_summary', 'target_role', 'skills', 'experiences',
    'education', 'courses', 'languages', 'projects', 'certifications', 'additional_informations',
    'personal.name', 'personal.location', 'personal.location.city',
    'skills.0.title', 'skills.0.years', 'experiences.0.current', 'experiences.0.responsibilities',
    'education.0.degree', 'courses.0.workload', 'languages.0.level',
    'projects.0.skills', 'certifications.0.date',
]);

it('rejects extra keys at every object level', function (string $path) {
    $payload = $this->payload;
    Arr::set($payload, $path, null);

    expect(fn () => BotCallbackDto::fromData($payload))
        ->toThrow(InvalidArgumentException::class, "payload.{$path}: unexpected field", 502);
})->with([
    'score', 'header', 'qualifications', 'others', 'user_resume_id',
    'personal.extra', 'personal.location.extra', 'skills.0.extra', 'experiences.0.extra',
    'education.0.extra', 'courses.0.extra', 'languages.0.extra', 'projects.0.extra',
    'certifications.0.extra',
]);

it('rejects incorrect types without coercing values', function (string $path, mixed $value) {
    $payload = $this->payload;
    Arr::set($payload, $path, $value);

    expect(fn () => BotCallbackDto::fromData($payload))
        ->toThrow(InvalidArgumentException::class, "payload.{$path}", 502);
})->with([
    'null personal' => ['personal', null],
    'list personal' => ['personal', []],
    'null location' => ['personal.location', null],
    'string location' => ['personal.location', 'Salvador'],
    'numeric name' => ['personal.name', 12],
    'object summary' => ['professional_summary', ['text' => 'Summary']],
    'boolean target role' => ['target_role', false],
    'list additional information' => ['additional_informations', []],
    'null collection' => ['skills', null],
    'object collection' => ['education', ['degree' => 'Computer Science']],
    'sparse collection' => ['languages', [1 => ['language' => null, 'level' => null]]],
    'null item' => ['projects.0', null],
    'list item' => ['certifications.0', []],
    'numeric string years' => ['skills.0.years', '6'],
    'null years' => ['skills.0.years', null],
    'boolean years' => ['skills.0.years', true],
    'numeric string workload' => ['courses.0.workload', '8.5'],
    'null workload' => ['courses.0.workload', null],
    'integer current' => ['experiences.0.current', 1],
    'string current' => ['experiences.0.current', 'true'],
    'string false current' => ['education.0.current', 'false'],
    'null current' => ['education.0.current', null],
    'null responsibilities' => ['experiences.0.responsibilities', null],
    'numeric responsibility' => ['experiences.0.responsibilities.0', 1],
    'null achievement' => ['experiences.0.achievements.0', null],
    'object experience skill' => ['experiences.0.skills.0', ['title' => 'PHP']],
    'null project skills' => ['projects.0.skills', null],
    'boolean project skill' => ['projects.0.skills.0', false],
]);

it('validates every month date field and preserves valid dates', function (string $path) {
    foreach (['2024-01', '2025-12', null] as $date) {
        $payload = $this->payload;
        Arr::set($payload, $path, $date);

        expect(BotCallbackDto::fromData($payload)->toArray())->toBe($payload);
    }

    foreach (['2024-00', '2024-13', '2024-1', '24-01', '2024-01-01', '2024-01\n', '', 202401] as $date) {
        $payload = $this->payload;
        Arr::set($payload, $path, $date);

        expect(fn () => BotCallbackDto::fromData($payload))
            ->toThrow(InvalidArgumentException::class, "payload.{$path}", 502);
    }
})->with([
    'experiences.0.start_date', 'experiences.0.end_date',
    'education.0.start_date', 'education.0.end_date',
    'courses.0.completion_date', 'certifications.0.date',
]);
