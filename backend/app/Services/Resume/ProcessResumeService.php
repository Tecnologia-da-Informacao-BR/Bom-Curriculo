<?php

namespace App\Services\Resume;

use App\Enums\UserResumeEnum;
use App\Models\ResumeAnalytic;
use App\Models\User;
use App\Models\UserResume;
use App\Services\Bot\Exceptions\BotResumeException;
use App\Services\Bot\ResumeBotService;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Throwable;

final readonly class ProcessResumeService
{
    public function __construct(private ResumeBotService $bot) {}

    public function process(UserResume $resume, User $user): ResumeAnalytic
    {
        $resume->update(['status' => UserResumeEnum::ANALYZE]);

        $analytic = $resume->analytic()->create([
            'analysis_request_id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => UserResumeEnum::ANALYZE->value,
        ]);

        try {
            $result = $this->bot->analyzeAndBuild($this->payload($resume, $user));

            $analytic->update([
                'status' => UserResumeEnum::READY->value,
                'error' => null,
                'original_score' => $result->originalScore,
                'score' => $result->score,
                'suggestion' => $result->suggestion,
                'professional_summary' => $result->professionalSummary,
                'header' => $result->header,
                'experiences' => $result->experiences,
                'projects' => $result->projects,
                'qualifications' => $result->qualifications,
                'skills' => $result->skills,
                'languages' => $result->languages,
                'others' => $result->others,
            ]);

            $resume->update([
                'status' => UserResumeEnum::READY,
                'processed_at' => now(),
                'observation' => null,
            ]);
        } catch (Throwable $exception) {
            $message = $exception instanceof BotResumeException
                ? $exception->getMessage()
                : 'Não foi possível processar o currículo.';

            $analytic->update([
                'status' => UserResumeEnum::FAIL->value,
                'error' => ['message' => $message],
            ]);
            $resume->update([
                'status' => UserResumeEnum::FAIL,
                'processed_at' => now(),
                'observation' => $message,
            ]);

            throw $exception;
        }

        return $analytic->refresh();
    }

    private function payload(UserResume $resume, User $user): array
    {
        $payload = [
            'resume_cv_url' => $this->signedFileUrl($resume, 'cv'),
            'github_url' => $user->github_link,
            'portfolio_url' => $user->site_link,
            'additional_skills' => $user->skills()
                ->get(['name', 'years'])
                ->map(fn ($skill) => [
                    'name' => $skill->name,
                    'years' => $skill->years,
                ])
                ->values()
                ->all(),
        ];

        if ($resume->original_file_path_linkedin) {
            $payload['resume_linkedin_url'] = $this->signedFileUrl($resume, 'linkedin');
        }

        return array_filter($payload, static fn ($value) => $value !== null && $value !== '');
    }

    private function signedFileUrl(UserResume $resume, string $type): string
    {
        $path = $type === 'linkedin'
            ? $resume->original_file_path_linkedin
            : $resume->original_file_path_cv;
        $extension = strtolower(pathinfo((string) $path, PATHINFO_EXTENSION));
        $filename = ($type === 'linkedin' ? 'linkedin' : 'resume').'.'.$extension;

        $relativeUrl = URL::temporarySignedRoute(
            'internal.bot.resume-file',
            now()->addMinutes((int) config('services.bot.file_url_ttl', 10)),
            ['resume' => $resume->id, 'type' => $type, 'filename' => $filename],
            absolute: false,
        );

        return rtrim((string) config('services.bot.backend_url'), '/').$relativeUrl;
    }
}
