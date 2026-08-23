<?php

namespace App\Services\Bot;

use App\Services\Bot\DTO\ResumeBotResult;
use App\Services\Bot\Exceptions\BotResumeException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

final class ResumeBotService
{
    private const ANALYSIS_FIELDS = ['score', 'suggestion'];

    private const BUILD_FIELDS = [
        'score',
        'header',
        'experiences',
        'projects',
        'qualifications',
        'skills',
        'languages',
        'others',
    ];

    public function analyzeAndBuild(array $payload): ResumeBotResult
    {
        $apiKey = (string) config('services.bot.api_key');

        if ($apiKey === '') {
            throw new BotResumeException('A chave de integração com o bot não está configurada.');
        }

        try {
            $request = Http::baseUrl(rtrim((string) config('services.bot.url'), '/'))
                ->withToken($apiKey)
                ->acceptJson()
                ->asJson()
                ->connectTimeout(10)
                ->timeout((int) config('services.bot.timeout', 180));

            $analysis = $request->post('/api/v1/analyze', $payload);
            $this->ensureValidResponse($analysis, self::ANALYSIS_FIELDS, 'análise');

            $built = $request->post('/api/v1/build', $payload);
            $this->ensureValidResponse($built, self::BUILD_FIELDS, 'montagem');
        } catch (ConnectionException $exception) {
            throw new BotResumeException(
                'Não foi possível conectar ao serviço do bot.',
                previous: $exception,
            );
        }

        return ResumeBotResult::fromResponses($analysis->json(), $built->json());
    }

    private function ensureValidResponse(Response $response, array $requiredFields, string $operation): void
    {
        if ($response->failed()) {
            $detail = $response->json('detail');
            $message = is_string($detail) ? $detail : "O bot recusou a {$operation} do currículo.";

            throw new BotResumeException($message, $response->status());
        }

        $payload = $response->json();
        if (! is_array($payload)) {
            throw new BotResumeException("O bot retornou uma resposta inválida durante a {$operation}.");
        }

        foreach ($requiredFields as $field) {
            if (! array_key_exists($field, $payload)) {
                throw new BotResumeException("O bot não retornou o campo {$field} durante a {$operation}.");
            }
        }
    }
}
