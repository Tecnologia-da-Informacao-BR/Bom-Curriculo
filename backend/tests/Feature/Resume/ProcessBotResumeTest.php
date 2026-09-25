<?php

use App\Enums\UserResumeEnum;
use App\Models\ResumeAnalytic;
use App\Models\UserResume;
use App\Services\Bot\Actions\PublishBotAction;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

beforeEach(function () {
    Storage::fake('local');
    config()->set('services.bot.url', 'https://resume-bot.test');
});

/**
 * @param  array<string, mixed>  $attributes
 */
function createStoredResumeForBot(array $auth, array $attributes = []): UserResume
{
    $cvPath = $attributes['original_file_path_cv'] ?? 'resumes/cv/source-real.pdf';
    $linkedinPath = $attributes['original_file_path_linkedin'] ?? null;

    if ($cvPath !== null) {
        Storage::put($cvPath, 'REAL_CV_FILE_CONTENT');
    }

    if ($linkedinPath !== null) {
        Storage::put($linkedinPath, 'REAL_LINKEDIN_PDF_CONTENT');
    }

    return $auth['user']->resumes()->create(array_merge([
        'original_file_path_cv' => $cvPath,
        'original_file_path_linkedin' => $linkedinPath,
    ], $attributes));
}

/**
 * @return array<string, mixed>
 */
function uniqueBotResumePayload(): array
{
    return json_decode(
        file_get_contents(base_path('tests/Fixtures/bot_resume_payload.json')),
        true,
        512,
        JSON_THROW_ON_ERROR
    );
}

it('persists and returns only the real successful bot build response', function () {
    $auth = actingAsUser();
    $auth['user']->forceFill([
        'github_link' => 'https://github.com/multipart-real',
        'site_link' => 'https://portfolio.example.test',
    ])->save();
    $auth['user']->skills()->create(['name' => 'Rust', 'years' => 7]);

    $resume = createStoredResumeForBot($auth, [
        'original_file_path_cv' => 'resumes/cv/source-real.docx',
        'original_file_path_linkedin' => 'resumes/linkedin/linkedin-real.pdf',
    ]);
    $botPayload = uniqueBotResumePayload();
    $multipart = [];
    $requestOptions = [];

    Http::fake(function (ClientRequest $request, array $options) use (&$multipart, &$requestOptions, $botPayload) {
        $requestOptions[$request->url()] = [
            'connect_timeout' => $options['connect_timeout'],
            'timeout' => $options['timeout'],
        ];

        if ($request->url() === 'https://resume-bot.test/health') {
            return Http::response(['status' => 'online'], 200);
        }

        if ($request->url() === 'https://resume-bot.test/api/v1/build') {
            foreach ($request->data() as $part) {
                $contents = $part['contents'];

                if (is_resource($contents)) {
                    $contents = stream_get_contents($contents);
                    rewind($part['contents']);
                }

                $multipart[$part['name']] = [
                    'contents' => $contents,
                    'filename' => $part['filename'] ?? null,
                ];
            }

            return Http::response($botPayload, 200);
        }

        return Http::response(['detail' => 'Unexpected test URL'], 500);
    });

    $response = $this
        ->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', [
            'user_resume_id' => $resume->id,
        ]);

    $response->assertOk()
        ->assertJsonPath('data.0.ai_payload', $botPayload)
        ->assertJsonMissing(['name' => 'Carlos Silva Júnior'])
        ->assertJsonMissing(['score' => 85]);

    $analytic = ResumeAnalytic::query()->sole();

    expect($analytic->status)->toBe('success')
        ->and($analytic->user_id)->toBe($auth['user']->id)
        ->and($analytic->user_resume_id)->toBe($resume->id)
        ->and(Str::isUuid($analytic->analysis_request_id))->toBeTrue()
        ->and($analytic->ai_payload)->toBe($botPayload)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::ANALYZE)
        ->and($resume->fresh()->observation)->toBeNull();

    foreach (['header', 'experiences', 'projects', 'qualifications', 'skills', 'languages', 'others'] as $field) {
        expect($analytic->{$field})->toBeNull();
    }

    $this->withHeaders($auth['headers'])
        ->getJson("/api/client/resumes/pendings/{$analytic->id}")
        ->assertOk()
        ->assertJsonPath('data.ai_payload', $botPayload)
        ->assertJsonPath('data.header', null);

    $this->withHeaders($auth['headers'])
        ->getJson('/api/client/resumes/pendings')
        ->assertOk()
        ->assertJsonPath('data.0.ai_payload', $botPayload)
        ->assertJsonPath('data.0.header', null);

    expect($multipart['resume_cv'])->toBe([
        'contents' => 'REAL_CV_FILE_CONTENT',
        'filename' => 'source-real.docx',
    ])->and($multipart['resume_linkedin'])->toBe([
        'contents' => 'REAL_LINKEDIN_PDF_CONTENT',
        'filename' => 'linkedin-real.pdf',
    ])->and($multipart['github_url']['contents'])->toBe('https://github.com/multipart-real')
        ->and($multipart['portfolio_url']['contents'])->toBe('https://portfolio.example.test')
        ->and(json_decode($multipart['additional_skills']['contents'], true))->toBe([
            ['name' => 'Rust', 'years' => 7],
        ])->and($requestOptions['https://resume-bot.test/health'])->toBe([
            'connect_timeout' => 5.0,
            'timeout' => 5.0,
        ])->and($requestOptions['https://resume-bot.test/api/v1/build'])->toBe([
            'connect_timeout' => 5.0,
            'timeout' => 260.0,
        ]);

    Http::assertSentCount(2);
    Http::assertSent(fn (ClientRequest $request) => $request->url() === 'https://resume-bot.test/health'
        && $request->method() === 'GET'
    );
    Http::assertSent(fn (ClientRequest $request) => $request->url() === 'https://resume-bot.test/api/v1/build'
        && $request->method() === 'POST'
        && $request->hasFile('resume_cv', null, 'source-real.docx')
        && $request->hasFile('resume_linkedin', null, 'linkedin-real.pdf')
    );
});

it('normalizes a bot response containing JSON inside a string', function () {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);
    $payload = uniqueBotResumePayload();

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
        'https://resume-bot.test/api/v1/build' => Http::response(
            json_encode(json_encode($payload, JSON_THROW_ON_ERROR), JSON_THROW_ON_ERROR),
            200,
            ['Content-Type' => 'application/json']
        ),
    ]);

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertOk()
        ->assertJsonPath('data.0.ai_payload', $payload);

    expect(ResumeAnalytic::query()->sole()->ai_payload)->toBe($payload)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::ANALYZE);
});

it('persists empty collections and nullable personal fields without fabricating values', function () {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);
    $payload = uniqueBotResumePayload();

    foreach ($payload['personal'] as $field => $value) {
        $payload['personal'][$field] = is_array($value) ? array_fill_keys(array_keys($value), null) : null;
    }

    foreach (['professional_summary', 'target_role', 'additional_informations'] as $field) {
        $payload[$field] = null;
    }

    foreach (['skills', 'experiences', 'education', 'courses', 'languages', 'projects', 'certifications'] as $field) {
        $payload[$field] = [];
    }

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
        'https://resume-bot.test/api/v1/build' => Http::response($payload),
    ]);

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertOk()
        ->assertJsonPath('data.0.ai_payload', $payload);

    expect(ResumeAnalytic::query()->sole()->ai_payload)->toBe($payload)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::ANALYZE);
});

it('preserves JSON numbers and booleans without adding range constraints', function () {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);
    $payload = uniqueBotResumePayload();
    $payload['skills'][0]['years'] = -0.5;
    $payload['courses'][0]['workload'] = -1;
    $payload['experiences'][0]['current'] = false;
    $payload['education'][0]['current'] = true;

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
        'https://resume-bot.test/api/v1/build' => Http::response($payload),
    ]);

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertOk()
        ->assertJsonPath('data.0.ai_payload', $payload);

    expect(ResumeAnalytic::query()->sole()->ai_payload)->toBe($payload);
});

it('rejects invalid contracts before creating an analysis', function (string $path, mixed $value, bool $missing = false) {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);
    $payload = uniqueBotResumePayload();

    if ($missing) {
        Arr::forget($payload, $path);
    } else {
        Arr::set($payload, $path, $value);
    }

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
        'https://resume-bot.test/api/v1/build' => Http::response($payload),
    ]);

    $response = $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertStatus(502);

    $message = $response->json('data.message');

    expect($message)->toStartWith("Invalid bot payload at payload.{$path}")
        ->and(ResumeAnalytic::query()->count())->toBe(0)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::FAIL)
        ->and($resume->fresh()->observation)->toBe($message);
})->with([
    'missing root object' => ['personal', null, true],
    'missing nullable root field' => ['professional_summary', null, true],
    'missing nested field' => ['personal.location.country', null, true],
    'missing item boolean' => ['education.0.current', null, true],
    'extra root field' => ['score', 90],
    'extra personal field' => ['personal.extra', null],
    'extra location field' => ['personal.location.extra', null],
    'extra collection item field' => ['skills.0.extra', null],
    'null personal object' => ['personal', null],
    'list location object' => ['personal.location', []],
    'numeric summary' => ['professional_summary', 10],
    'null collection' => ['skills', null],
    'object instead of empty list' => ['courses', (object) []],
    'object with numeric keys instead of list' => ['skills', (object) [
        '0' => ['title' => null, 'years' => 0, 'level' => null],
    ]],
    'list instead of object item' => ['certifications.0', []],
    'empty object item' => ['languages.0', (object) []],
    'null object item' => ['projects.0', null],
    'string boolean' => ['experiences.0.current', 'false'],
    'integer boolean' => ['education.0.current', 1],
    'null boolean' => ['education.0.current', null],
    'numeric string years' => ['skills.0.years', '6.5'],
    'numeric string workload' => ['courses.0.workload', '8'],
    'null number' => ['skills.0.years', null],
    'boolean number' => ['courses.0.workload', true],
    'object instead of nested list' => ['experiences.0.responsibilities', (object) []],
    'numeric keys instead of nested list' => ['projects.0.skills', (object) ['0' => 'PHP']],
    'nonstring responsibility' => ['experiences.0.responsibilities.0', 1],
    'null achievement' => ['experiences.0.achievements.0', null],
    'object experience skill' => ['experiences.0.skills.0', ['title' => 'PHP']],
    'nonstring project skill' => ['projects.0.skills.0', false],
    'invalid start month' => ['experiences.0.start_date', '2024-13'],
    'full end date' => ['experiences.0.end_date', '2024-01-31'],
    'short education date' => ['education.0.start_date', '2024-1'],
    'empty education date' => ['education.0.end_date', ''],
    'invalid course date' => ['courses.0.completion_date', '2024-00'],
    'invalid certification date' => ['certifications.0.date', 'January 2024'],
]);

it('validates the contract after decoding JSON inside a string', function () {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);
    $payload = uniqueBotResumePayload();
    $payload['experiences'][0]['skills'] = (object) [];

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
        'https://resume-bot.test/api/v1/build' => Http::response(
            json_encode(json_encode($payload, JSON_THROW_ON_ERROR), JSON_THROW_ON_ERROR)
        ),
    ]);

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertStatus(502)
        ->assertJsonPath('data.message', 'Invalid bot payload at payload.experiences.0.skills: expected a JSON list.');

    expect(ResumeAnalytic::query()->count())->toBe(0)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::FAIL);
});

it('replaces the last AI payload when reprocessing succeeds', function () {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);
    $firstPayload = uniqueBotResumePayload();
    $secondPayload = $firstPayload;
    $secondPayload['personal']['name'] = 'UPDATED BOT NAME';
    $secondPayload['professional_summary'] = null;
    $secondPayload['projects'] = [];

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
        'https://resume-bot.test/api/v1/build' => Http::sequence()
            ->push($firstPayload)
            ->push($secondPayload),
    ]);

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertOk();

    $originalAnalytic = ResumeAnalytic::query()->sole();

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertOk()
        ->assertJsonPath('data.0.ai_payload', $secondPayload);

    $updatedAnalytic = ResumeAnalytic::query()->sole();

    expect($originalAnalytic->ai_payload)->toBe($firstPayload)
        ->and($updatedAnalytic->id)->toBe($originalAnalytic->id)
        ->and($updatedAnalytic->ai_payload)->toBe($secondPayload)
        ->and($updatedAnalytic->analysis_request_id)->not->toBe($originalAnalytic->analysis_request_id)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::ANALYZE);
});

it('preserves the last valid analysis when reprocessing returns an invalid contract', function () {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);
    $payload = uniqueBotResumePayload();
    $invalidPayload = $payload;
    unset($invalidPayload['personal']);

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
        'https://resume-bot.test/api/v1/build' => Http::sequence()
            ->push($payload)
            ->push($invalidPayload),
    ]);

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertOk();

    $originalAttributes = ResumeAnalytic::query()->sole()->getAttributes();

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertStatus(502)
        ->assertJsonPath('data.message', 'Invalid bot payload at payload.personal: missing required field.');

    expect(ResumeAnalytic::query()->sole()->getAttributes())->toBe($originalAttributes)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::FAIL)
        ->and($resume->fresh()->observation)->toBe('Invalid bot payload at payload.personal: missing required field.');
});

it('adds an AI payload to a legacy analysis without changing its stored legacy fields', function () {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);
    $legacyFields = [
        'header' => ['name' => 'Legacy name', 'summary' => 'Legacy summary'],
        'experiences' => [['company' => 'Legacy company']],
        'projects' => [['title' => 'Legacy project']],
        'qualifications' => [['title' => 'Legacy degree']],
        'skills' => [['name' => 'PHP', 'years' => 3]],
        'languages' => [['language' => 'Português', 'level' => 'native']],
        'others' => ['score' => 75],
    ];
    $analytic = $auth['user']->resumeAnalytics()->create(array_merge($legacyFields, [
        'user_resume_id' => $resume->id,
        'status' => 'success',
    ]));
    $payload = uniqueBotResumePayload();

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
        'https://resume-bot.test/api/v1/build' => Http::response($payload),
    ]);

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertOk()
        ->assertJsonPath('data.0.id', $analytic->id)
        ->assertJsonPath('data.0.ai_payload', $payload);

    $updatedAnalytic = ResumeAnalytic::query()->sole();

    expect($updatedAnalytic->ai_payload)->toBe($payload);

    foreach ($legacyFields as $field => $value) {
        expect($updatedAnalytic->{$field})->toBe($value);
    }
});

it('preserves JSON objects that would otherwise be mistaken for lists', function () {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);

    Http::fake([
        'https://resume-bot.test/api/v1/build' => Http::response(
            '{"empty_object":{},"numeric_object":{"0":"PHP"},"list":[]}'
        ),
    ]);

    $payload = (new PublishBotAction(
        Http::baseUrl('https://resume-bot.test/api/v1'),
        $auth['user'],
        $resume
    ))::handle();

    expect($payload['empty_object'])->toBeInstanceOf(stdClass::class)
        ->and($payload['numeric_object'])->toBeInstanceOf(stdClass::class)
        ->and($payload['list'])->toBe([]);
});

it('rejects invalid JSON or a nonobject root without overwriting an existing analysis', function (string $body, bool $hasExistingAnalysis) {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);
    $originalAttributes = null;

    if ($hasExistingAnalysis) {
        $originalAttributes = $auth['user']->resumeAnalytics()->create([
            'user_resume_id' => $resume->id,
            'analysis_request_id' => (string) Str::uuid(),
            'status' => 'success',
            'ai_payload' => uniqueBotResumePayload(),
        ])->fresh()->getAttributes();
    }

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
        'https://resume-bot.test/api/v1/build' => Http::response($body, 200, ['Content-Type' => 'application/json']),
    ]);

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertStatus(502)
        ->assertJsonPath('data.message', 'Bot returned an invalid response.');

    expect(ResumeAnalytic::query()->count())->toBe($hasExistingAnalysis ? 1 : 0)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::FAIL)
        ->and($resume->fresh()->observation)->toBe('Bot returned an invalid response.');

    if ($hasExistingAnalysis) {
        expect(ResumeAnalytic::query()->sole()->getAttributes())->toBe($originalAttributes);
    }
})->with([
    'invalid body JSON' => '{invalid',
    'invalid JSON inside a string' => '"{invalid"',
    'list' => '[{"name":"Arthur"}]',
    'empty list' => '[]',
    'number' => '42',
    'boolean' => 'true',
    'null' => 'null',
    'encoded list' => '"[]"',
    'encoded scalar' => '"42"',
    'encoded string' => '"\"still a string\""',
])->with([
    'new analysis' => false,
    'existing analysis' => true,
]);

it('omits the optional LinkedIn multipart field when no stored file exists', function () {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
        'https://resume-bot.test/api/v1/build' => Http::response(uniqueBotResumePayload()),
    ]);

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertOk();

    Http::assertSent(fn (ClientRequest $request) => $request->url() === 'https://resume-bot.test/api/v1/build'
        && $request->hasFile('resume_cv', null, 'source-real.pdf')
        && ! $request->hasFile('resume_linkedin')
    );
});

it('preserves a bot validation failure and never persists fictional analytics', function () {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
        'https://resume-bot.test/api/v1/build' => Http::response([
            'detail' => 'REAL BOT 422 DETAIL 04c1',
        ], 422),
    ]);

    $response = $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id]);

    $response->assertUnprocessable()
        ->assertJsonPath('data.message', 'REAL BOT 422 DETAIL 04c1')
        ->assertJsonPath('data.details.detail', 'REAL BOT 422 DETAIL 04c1')
        ->assertJsonMissing(['name' => 'Carlos Silva Júnior'])
        ->assertJsonMissing(['score' => 85]);

    expect(ResumeAnalytic::query()->count())->toBe(0)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::FAIL)
        ->and($resume->fresh()->observation)->toBe('REAL BOT 422 DETAIL 04c1');
});

it('preserves a bot service failure and never persists fictional analytics', function () {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
        'https://resume-bot.test/api/v1/build' => Http::response([
            'detail' => 'REAL BOT 503 DETAIL b38e',
        ], 503),
    ]);

    $response = $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id]);

    $response->assertServiceUnavailable()
        ->assertJsonPath('data.message', 'REAL BOT 503 DETAIL b38e')
        ->assertJsonPath('data.details.detail', 'REAL BOT 503 DETAIL b38e')
        ->assertJsonMissing(['name' => 'Carlos Silva Júnior'])
        ->assertJsonMissing(['score' => 85]);

    expect(ResumeAnalytic::query()->count())->toBe(0)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::FAIL)
        ->and($resume->fresh()->observation)->toBe('REAL BOT 503 DETAIL b38e');
});

it('marks the resume failed when the bot health endpoint is unavailable', function () {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);

    Http::fake([
        'https://resume-bot.test/health' => Http::response([
            'detail' => 'BOT HEALTH UNAVAILABLE 2a19',
        ], 503),
    ]);

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertServiceUnavailable()
        ->assertJsonPath('data.message', 'BOT HEALTH UNAVAILABLE 2a19');

    expect(ResumeAnalytic::query()->count())->toBe(0)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::FAIL)
        ->and($resume->fresh()->observation)->toBe('BOT HEALTH UNAVAILABLE 2a19');

    Http::assertSentCount(1);
});

it('returns service unavailable and marks the resume failed on a connection or timeout error', function (string $message) {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);

    Http::fake(fn () => throw new ConnectionException($message));

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertServiceUnavailable()
        ->assertJsonPath('data.message', 'Bot service is unavailable.')
        ->assertJsonMissing(['message' => $message]);

    expect(ResumeAnalytic::query()->count())->toBe(0)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::FAIL)
        ->and($resume->fresh()->observation)->toBe('Bot service is unavailable.');
})->with([
    'connection failure' => 'CONNECTION FAILURE 8ce2',
    'timeout' => 'BOT REQUEST TIMED OUT 52b1',
]);

it('rejects a missing or invalid resume UUID before contacting the bot', function (?string $resumeId) {
    $auth = actingAsUser();
    Http::preventStrayRequests();

    $payload = $resumeId === null ? [] : ['user_resume_id' => $resumeId];

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', $payload)
        ->assertUnprocessable()
        ->assertJsonPath('data.message', 'A valid user_resume_id UUID is required.');

    Http::assertNothingSent();
})->with([
    'missing UUID' => null,
    'invalid UUID' => 'not-a-uuid',
]);

it('returns not found for nonexistent or unauthorized resumes without contacting the bot', function (bool $otherUserOwnsResume) {
    $auth = actingAsUser();
    Http::preventStrayRequests();

    $resumeId = (string) Str::uuid();

    if ($otherUserOwnsResume) {
        $resumeId = authUser()->resumes()->create([
            'original_file_path_cv' => 'resumes/cv/other-user.pdf',
        ])->id;
    }

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resumeId])
        ->assertNotFound()
        ->assertJsonPath('data.message', 'Resume not found for this user.');

    Http::assertNothingSent();
})->with([
    'nonexistent resume' => false,
    'resume owned by another user' => true,
]);

it('marks the resume failed when its required CV is missing', function () {
    $auth = actingAsUser();
    $resume = $auth['user']->resumes()->create([
        'original_file_path_cv' => 'resumes/cv/missing.pdf',
    ]);

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
    ]);

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertUnprocessable()
        ->assertJsonPath('data.message', 'Resume CV file is missing.');

    expect(ResumeAnalytic::query()->count())->toBe(0)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::FAIL)
        ->and($resume->fresh()->observation)->toBe('Resume CV file is missing.');

    Http::assertSentCount(1);
});

it('marks the resume failed when its required CV cannot be opened', function () {
    $auth = actingAsUser();
    $resume = $auth['user']->resumes()->create([
        'original_file_path_cv' => 'resumes/cv/unreadable.pdf',
    ]);

    Storage::shouldReceive('exists')
        ->once()
        ->with('resumes/cv/unreadable.pdf')
        ->andReturnTrue();
    Storage::shouldReceive('readStream')
        ->once()
        ->with('resumes/cv/unreadable.pdf')
        ->andReturnFalse();

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
    ]);

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertInternalServerError()
        ->assertJsonPath('data.message', 'Resume CV file could not be opened.');

    expect(ResumeAnalytic::query()->count())->toBe(0)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::FAIL)
        ->and($resume->fresh()->observation)->toBe('Resume CV file could not be opened.');

    Http::assertSentCount(1);
});
