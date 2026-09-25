<?php

namespace App\Services\Bot\Actions;

use App\Enums\UserResumeEnum;
use App\Models\ResumeAnalytic;
use App\Models\UserResume;
use App\Services\Bot\DTO\BotCallbackDto;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProcessBotAction
{
    public static function handle(array $callback, UserResume $resume)
    {
        try {
            $analytic = null;

            DB::transaction(function () use ($callback, $resume, &$analytic) {
                // Valida o callback recebido pelo BOT
                $payload = BotCallbackDto::fromData($callback)->toArray();

                // Atualiza o status da análise do currículo
                $resume->update([
                    'status' => UserResumeEnum::ANALYZE,
                    'observation' => null,
                ]);

                // Cria ou atualiza a análise do currículo
                $analytic = ResumeAnalytic::query()->updateOrCreate(
                    [
                        'user_resume_id' => $resume->id,
                    ],
                    [
                        // Gera um UUID para identificar esta solicitação de análise
                        'analysis_request_id' => (string) Str::uuid(),

                        'user_id' => $resume->user_id,
                        'user_resume_id' => $resume->id,
                        'status' => 'success',
                        'error' => '',
                        'ai_payload' => $payload,
                    ]
                );
            });

            return $analytic;
        } catch (Exception $exception) {
            // Preserva a exceção original
            throw $exception;
        }
    }
}
