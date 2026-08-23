<?php

namespace App\Services\Bot\DTO;

final readonly class ResumeBotResult
{
    public function __construct(
        public int $originalScore,
        public int $score,
        public string $suggestion,
        public ?string $professionalSummary,
        public array $header,
        public array $experiences,
        public array $projects,
        public array $qualifications,
        public array $skills,
        public array $languages,
        public array $others,
    ) {}

    public static function fromResponses(array $analysis, array $built): self
    {
        return new self(
            originalScore: (int) $analysis['score'],
            score: (int) $built['score'],
            suggestion: (string) $analysis['suggestion'],
            professionalSummary: isset($built['professional_summary'])
                ? (string) $built['professional_summary']
                : null,
            header: (array) $built['header'],
            experiences: (array) $built['experiences'],
            projects: (array) $built['projects'],
            qualifications: (array) $built['qualifications'],
            skills: (array) $built['skills'],
            languages: (array) $built['languages'],
            others: (array) $built['others'],
        );
    }
}
