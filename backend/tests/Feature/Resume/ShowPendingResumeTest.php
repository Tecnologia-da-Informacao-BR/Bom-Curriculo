<?php

it('shows a resume analytic belonging to the authenticated user', function () {

    $auth = actingAsUser();

    $analytic = $auth['user']->resumeAnalytics()->create([
        'status' => 'pending',
    ]);

    $response = $this
        ->withHeaders($auth['headers'])
        ->getJson("/api/client/resumes/pendings/{$analytic->id}");

    $response->assertOk()
        ->assertJson([
            'data' => [
                'id' => $analytic->id,
            ],
        ]);
});

it('loads a legacy analysis without an AI payload through the existing read endpoints', function () {
    $auth = actingAsUser();
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
        'status' => 'success',
    ]))->fresh();

    expect($analytic->ai_payload)->toBeNull()
        ->and($analytic->toArray()['ai_payload'])->toBeNull();

    $detail = $this->withHeaders($auth['headers'])
        ->getJson("/api/client/resumes/pendings/{$analytic->id}")
        ->assertOk()
        ->assertJsonPath('data.ai_payload', null);

    $list = $this->withHeaders($auth['headers'])
        ->getJson('/api/client/resumes/pendings')
        ->assertOk()
        ->assertJsonPath('data.0.ai_payload', null);

    foreach ($legacyFields as $field => $value) {
        $detail->assertJsonPath("data.{$field}", $value);
        $list->assertJsonPath("data.0.{$field}", $value);
    }
});

it('returns 404 for a resume analytic belonging to another user', function () {

    $auth = actingAsUser();
    $otherUser = authUser();

    $analytic = $otherUser->resumeAnalytics()->create([
        'status' => 'pending',
    ]);

    $response = $this
        ->withHeaders($auth['headers'])
        ->getJson("/api/client/resumes/pendings/{$analytic->id}");

    $response->assertNotFound();
});

it('returns 404 for a nonexistent resume analytic', function () {

    $auth = actingAsUser();

    $response = $this
        ->withHeaders($auth['headers'])
        ->getJson('/api/client/resumes/pendings/999999');

    $response->assertNotFound();
});

it('requires authentication', function () {

    $this->getJson('/api/client/resumes/pendings/1')
        ->assertUnauthorized();
});
