<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use App\Modules\Property\Models\Property;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsurePropertyVisible
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        $property = $request->route('property');
        $user = $request->user();
        abort_if($property instanceof Property && ! $property->is_visible
            && ! ($user instanceof User && $user->admin), 404);

        return $next($request);
    }
}
