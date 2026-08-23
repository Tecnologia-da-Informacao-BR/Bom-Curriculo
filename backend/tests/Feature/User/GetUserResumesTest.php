<?php

it('lists the user resumes ordered from newest to oldest', function () {

    $auth = actingAsUser();

    $this->travelTo(now()->subDay());
    $older = $auth['user']->resumes()->create([
        'original_file_path_cv' => 'resumes/old-cv.pdf',
    ]);

    $this->travelBack();
    $newer = $auth['user']->resumes()->create([
        'original_file_path_cv' => 'resumes/new-cv.pdf',
    ]);
    $newer->analytic()->create([
        'user_id' => $auth['user']->id,
        'status' => 'ready',
        'original_score' => 77,
        'score' => 91,
        'suggestion' => 'Detalhe melhor os resultados.',
    ]);

    $response = $this
        ->withHeaders($auth['headers'])
        ->getJson('/api/client/user/resumes');

    $response->assertOk();

    $ids = collect($response->json('data.data'))->pluck('id');
    expect($ids->first())->toBe($newer->id)
        ->and($ids->last())->toBe($older->id);
    $response->assertJsonPath('data.data.0.analytic.original_score', 77)
        ->assertJsonPath('data.data.0.analytic.score', 91)
        ->assertJsonPath('data.data.0.analytic.suggestion', 'Detalhe melhor os resultados.');
});

it('does not list resumes belonging to another user', function () {

    $auth = actingAsUser();
    $otherUser = authUser();

    $otherUser->resumes()->create([
        'original_file_path_cv' => 'resumes/other-cv.pdf',
    ]);

    $response = $this
        ->withHeaders($auth['headers'])
        ->getJson('/api/client/user/resumes');

    $response->assertOk()
        ->assertJsonCount(0, 'data.data');
});

it('requires authentication', function () {

    $this->getJson('/api/client/user/resumes')
        ->assertUnauthorized();
});
