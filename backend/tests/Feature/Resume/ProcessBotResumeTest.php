<?php

use App\Enums\UserResumeEnum;
use App\Models\ResumeAnalytic;
use App\Models\UserResume;
use App\Services\Bot\Actions\PublishBotAction;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request as ClientRequest;
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
    return [
        'score' => 97,
        'professional_summary' => 'REAL BOT SUMMARY 7f5d8a',
        'header' => [
            'name' => 'REAL BOT NAME 7f5d8a',
            'headline' => 'Real bot headline',
            'email' => 'real-bot@example.test',
            'emails' => 'real-bot@example.test',
            'contacts' => '+55 71 90000-1234',
            'location' => 'Salvador, BA',
            'links' => ['GitHub' => 'https://github.com/real-bot'],
        ],
        'experiences' => [[
            'company' => 'REAL BOT COMPANY 7f5d8a',
            'role' => 'Platform Engineer',
            'start' => '2024-01',
            'end' => null,
            'description' => 'Built the real processing path.',
            'is_actual' => true,
            'city' => 'Salvador',
            'state' => 'BA',
            'country' => 'Brasil',
        ]],
        'projects' => [[
            'title' => 'REAL BOT PROJECT 7f5d8a',
            'start' => '2025-01',
            'end' => null,
            'technologies' => 'Laravel, React',
            'description' => 'Project returned only by the fake bot.',
            'url' => 'https://example.test/real-project',
        ]],
        'qualifications' => [],
        'skills' => [['name' => 'REAL BOT SKILL 7f5d8a', 'years' => 6]],
        'languages' => [['language' => 'Português', 'level' => 'native']],
        'others' => ['source' => 'REAL BOT OTHER 7f5d8a'],
    ];
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
        ->assertJsonPath('data.0.header.name', 'REAL BOT NAME 7f5d8a')
        ->assertJsonPath('data.0.header.summary', 'REAL BOT SUMMARY 7f5d8a')
        ->assertJsonPath('data.0.experiences.0.company', 'REAL BOT COMPANY 7f5d8a')
        ->assertJsonPath('data.0.others.score', 97)
        ->assertJsonMissing(['name' => 'Carlos Silva Júnior'])
        ->assertJsonMissing(['score' => 85]);

    $analytic = ResumeAnalytic::query()->sole();

    expect($analytic->status)->toBe('success')
        ->and($analytic->header['name'])->toBe('REAL BOT NAME 7f5d8a')
        ->and($analytic->header['emails'])->toBe('real-bot@example.test')
        ->and($analytic->experiences[0]['company'])->toBe('REAL BOT COMPANY 7f5d8a')
        ->and($analytic->projects[0]['technologies'])->toBe('Laravel, React')
        ->and($analytic->others['score'])->toBe(97)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::ANALYZE)
        ->and($resume->fresh()->observation)->toBeNull();

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
        ->assertJsonPath('data.0.header.name', $payload['header']['name']);

    expect($resume->fresh()->status)->toBe(UserResumeEnum::ANALYZE);
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

it('rejects invalid JSON or a bot response whose root is not an object', function (string $body) {
    $auth = actingAsUser();
    $resume = createStoredResumeForBot($auth);

    Http::fake([
        'https://resume-bot.test/health' => Http::response(['status' => 'online']),
        'https://resume-bot.test/api/v1/build' => Http::response($body, 200, ['Content-Type' => 'application/json']),
    ]);

    $this->withHeaders($auth['headers'])
        ->postJson('/api/client/services/bot/process', ['user_resume_id' => $resume->id])
        ->assertStatus(502)
        ->assertJsonPath('data.message', 'Bot returned an invalid response.');

    expect(ResumeAnalytic::query()->count())->toBe(0)
        ->and($resume->fresh()->status)->toBe(UserResumeEnum::FAIL)
        ->and($resume->fresh()->observation)->toBe('Bot returned an invalid response.');
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
