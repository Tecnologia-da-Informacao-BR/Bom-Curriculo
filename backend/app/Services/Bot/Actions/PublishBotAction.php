<?php

namespace App\Services\Bot\Actions;

use App\Models\User;
use App\Models\UserResume;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Storage;
use JsonException;
use RuntimeException;
use stdClass;

class PublishBotAction
{
    private static $http;

    private static User $user;

    private static UserResume $resume;

    public function __construct(
        $http,
        User $user,
        UserResume $resume
    ) {
        self::$http = $http;
        self::$user = $user;
        self::$resume = $resume;
    }

    /**
     * @return array<string, mixed>
     *
     * @throws RequestException
     * @throws JsonException
     */
    public static function handle(): array
    {
        $bot = self::build(self::$resume, self::$user);

        if (! $bot->successful()) {
            throw new RequestException($bot);
        }

        try {
            $data = $bot->json();
            $json = is_string($data) ? $data : $bot->body();

            if (is_string($data)) {
                $data = json_decode($data, true, 512, JSON_THROW_ON_ERROR);
            }

            // Preserve JSON object/list distinctions lost by associative decoding.
            $object = json_decode($json, false, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException('Bot returned an invalid response.', 502, $exception);
        }

        if (! is_array($data) || ! $object instanceof stdClass) {
            throw new RuntimeException('Bot returned an invalid response.', 502);
        }

        return array_map(self::normalizeJsonValue(...), get_object_vars($object));
    }

    private static function normalizeJsonValue(mixed $value): mixed
    {
        if ($value instanceof stdClass) {
            $properties = get_object_vars($value);

            // An empty or numerically keyed object must not become a JSON list.
            if (array_is_list($properties)) {
                return $value;
            }

            $value = $properties;
        }

        return is_array($value) ? array_map(self::normalizeJsonValue(...), $value) : $value;
    }

    /**
     * @throws JsonException
     */
    private static function build(UserResume $resume, User $user): Response
    {
        $cvPath = $resume->original_file_path_cv;

        if (empty($cvPath) || ! Storage::exists($cvPath)) {
            throw new RuntimeException('Resume CV file is missing.', 422);
        }

        $cvStream = Storage::readStream($cvPath);

        if (! is_resource($cvStream)) {
            throw new RuntimeException('Resume CV file could not be opened.', 500);
        }

        $linkedinStream = null;
        $linkedinPath = $resume->original_file_path_linkedin;

        try {
            $request = self::$http->attach(
                'resume_cv',
                $cvStream,
                basename($cvPath)
            );

            if (! empty($linkedinPath) && Storage::exists($linkedinPath)) {
                $linkedinStream = Storage::readStream($linkedinPath);

                if (! is_resource($linkedinStream)) {
                    throw new RuntimeException('LinkedIn resume file could not be opened.', 500);
                }

                $request = $request->attach(
                    'resume_linkedin',
                    $linkedinStream,
                    basename($linkedinPath)
                );
            }

            $form = [
                'additional_skills' => json_encode(
                    $user->skills()->select('name', 'years')->get()->toArray(),
                    JSON_THROW_ON_ERROR
                ),
            ];

            if (! empty($user->github_link)) {
                $form['github_url'] = $user->github_link;
            }

            if (! empty($user->site_link)) {
                $form['portfolio_url'] = $user->site_link;
            }

            return $request->post('/build', $form);
        } finally {
            fclose($cvStream);

            if (is_resource($linkedinStream)) {
                fclose($linkedinStream);
            }
        }
    }
}
