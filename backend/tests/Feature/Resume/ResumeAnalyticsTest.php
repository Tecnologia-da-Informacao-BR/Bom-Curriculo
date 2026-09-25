<?php

it('stores an AI payload without populating legacy resume fields', function () {
    $user = authUser();
    $resume = $user->resumes()->create();
    $payload = [
        'personal' => ['name' => 'Arthur'],
        'professional_summary' => null,
        'skills' => [],
    ];

    $analytic = $user->resumeAnalytics()->create([
        'user_resume_id' => $resume->id,
        'status' => 'success',
        'ai_payload' => $payload,
    ])->fresh();

    expect($analytic->ai_payload)->toBe($payload)
        ->and($analytic->user_resume_id)->toBe($resume->id);

    foreach (['header', 'experiences', 'projects', 'qualifications', 'skills', 'languages', 'others'] as $field) {
        expect($analytic->{$field})->toBeNull();
    }
});

it('lists the user resume analytics ordered from newest to oldest', function () {

    $auth = actingAsUser();

    $this->travelTo(now()->subDay());
    $older = $auth['user']->resumeAnalytics()->create([
        'status' => 'pending',
    ]);

    $this->travelBack();
    $newer = $auth['user']->resumeAnalytics()->create([
        'status' => 'pending',
    ]);

    $response = $this
        ->withHeaders($auth['headers'])
        ->getJson('/api/client/resumes/pendings');

    $response->assertOk();

    $ids = collect($response->json('data'))->pluck('id');
    expect($ids->first())->toBe($newer->id)
        ->and($ids->last())->toBe($older->id);
});

it('does not list analytics belonging to another user', function () {

    $auth = actingAsUser();
    $otherUser = authUser();

    $otherUser->resumeAnalytics()->create(['status' => 'pending']);

    $response = $this
        ->withHeaders($auth['headers'])
        ->getJson('/api/client/resumes/pendings');

    $response->assertOk()
        ->assertJsonCount(0, 'data');
});

it('requires authentication', function () {

    $this->getJson('/api/client/resumes/pendings')
        ->assertUnauthorized();
});
