<?php

use App\Enums\UserResumeEnum;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    config()->set('services.bot.url', 'http://bot.test');
    config()->set('services.bot.backend_url', 'http://backend.test');
    config()->set('services.bot.api_key', 'shared-secret');
});

function fakeSuccessfulResumeBot(): void
{
    Http::fake([
        'http://bot.test/api/v1/analyze' => Http::response([
            'score' => 64,
            'suggestion' => 'Inclua resultados mensuráveis nas experiências.',
        ]),
        'http://bot.test/api/v1/build' => Http::response([
            'score' => 89,
            'professional_summary' => 'Desenvolvedor backend com foco em APIs.',
            'header' => ['name' => 'Pessoa Teste', 'links' => []],
            'experiences' => [[
                'company' => 'Bom Currículo',
                'role' => 'Desenvolvedor',
                'start' => '2025',
                'end' => null,
                'description' => 'Desenvolvimento de APIs.',
                'is_actual' => true,
                'city' => null,
                'state' => null,
                'country' => null,
            ]],
            'projects' => [],
            'qualifications' => [],
            'skills' => [['name' => 'PHP', 'years' => 5]],
            'languages' => [],
            'others' => [],
        ]),
    ]);
}

it('sends uploaded files to the bot and persists the real analysis', function () {
    Storage::fake('local');
    fakeSuccessfulResumeBot();
    $auth = actingAsUser();

    $response = $this
        ->withHeaders($auth['headers'])
        ->postJson('/api/client/resumes/new-resume', [
            'resume_cv' => UploadedFile::fake()->create('meu-curriculo.pdf', 100, 'application/pdf'),
            'resume_linkedin' => UploadedFile::fake()->create('linkedin.pdf', 100, 'application/pdf'),
            'github_link' => 'https://github.com/pedroaruana',
            'site_link' => 'https://pedroaruana.dev',
            'skills' => [['name' => 'PHP', 'years' => 5]],
        ]);

    $response->assertOk()
        ->assertJsonPath('message', 'Currículo processado')
        ->assertJsonPath('data.resume.original_file_name_cv', 'meu-curriculo.pdf')
        ->assertJsonPath('data.resume.status', UserResumeEnum::READY->value)
        ->assertJsonPath('data.resume.analytic.original_score', 64)
        ->assertJsonPath('data.resume.analytic.score', 89)
        ->assertJsonPath('data.resume.analytic.suggestion', 'Inclua resultados mensuráveis nas experiências.')
        ->assertJsonPath('data.resume.analytic.professional_summary', 'Desenvolvedor backend com foco em APIs.');

    $user = $auth['user']->fresh();
    Storage::disk('local')->assertExists($user->resume_cv);

    $this->assertDatabaseHas('resume_analytics', [
        'user_id' => $user->id,
        'original_score' => 64,
        'score' => 89,
        'status' => UserResumeEnum::READY->value,
    ]);

    Http::assertSent(fn (Request $request) => $request->url() === 'http://bot.test/api/v1/analyze'
        && $request->hasHeader('Authorization', 'Bearer shared-secret')
        && str_contains((string) $request['resume_cv_url'], '/api/internal/bot/resumes/')
        && str_contains((string) $request['resume_cv_url'], '/cv/resume.pdf?')
        && str_contains((string) $request['resume_linkedin_url'], '/linkedin/linkedin.pdf?')
        && $request['github_url'] === 'https://github.com/pedroaruana'
        && $request['portfolio_url'] === 'https://pedroaruana.dev'
        && $request['additional_skills'] === [['name' => 'PHP', 'years' => 5]]
    );
    Http::assertSentCount(2);
});

it('serves the uploaded cv to the bot through a temporary signed URL', function () {
    Storage::fake('local');
    fakeSuccessfulResumeBot();
    $auth = actingAsUser();

    $this
        ->withHeaders($auth['headers'])
        ->postJson('/api/client/resumes/new-resume', [
            'resume_cv' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
        ])
        ->assertOk();

    $request = collect(Http::recorded())
        ->map(fn (array $record) => $record[0])
        ->first(fn (Request $request) => str_ends_with($request->url(), '/api/v1/analyze'));
    $url = (string) $request['resume_cv_url'];
    $path = parse_url($url, PHP_URL_PATH);
    $relativeUrl = $path.'?'.parse_url($url, PHP_URL_QUERY);

    $this->get($path)->assertForbidden();
    $this->get($relativeUrl)->assertOk();
});

it('persists a failed status when the bot rejects the resume', function () {
    Storage::fake('local');
    Http::fake([
        'http://bot.test/api/v1/analyze' => Http::response(['detail' => 'empty'], 422),
    ]);
    $auth = actingAsUser();

    $this
        ->withHeaders($auth['headers'])
        ->postJson('/api/client/resumes/new-resume', [
            'resume_cv' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
        ])
        ->assertUnprocessable()
        ->assertJsonPath('data.error', 'empty');

    $this->assertDatabaseHas('user_resumes', [
        'user_id' => $auth['user']->id,
        'status' => UserResumeEnum::FAIL->value,
    ]);
    $this->assertDatabaseHas('resume_analytics', [
        'user_id' => $auth['user']->id,
        'status' => UserResumeEnum::FAIL->value,
    ]);
});

it('requires a base cv because the bot cannot analyze linkedin or links alone', function () {
    $auth = actingAsUser();

    $this
        ->withHeaders($auth['headers'])
        ->postJson('/api/client/resumes/new-resume', [
            'github_link' => 'https://github.com/pedroaruana',
        ])
        ->assertUnprocessable();

    Http::assertNothingSent();
});

it('requires authentication', function () {
    $this->postJson('/api/client/resumes/new-resume')
        ->assertUnauthorized();
});
