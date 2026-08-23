<?php

namespace App\Http\Controllers\Api\Resume;

use App\Http\Controllers\Controller;
use App\Models\UserResume;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class BotResumeFileController extends Controller
{
    public function __invoke(
        Request $request,
        UserResume $resume,
        string $type,
        string $filename,
    ): StreamedResponse {
        abort_unless(in_array($type, ['cv', 'linkedin'], true), 404);

        $path = $type === 'linkedin'
            ? $resume->original_file_path_linkedin
            : $resume->original_file_path_cv;

        abort_unless($path && Storage::exists($path), 404);

        return Storage::download($path, $filename);
    }
}
