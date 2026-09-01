<?php

declare(strict_types=1);

namespace App\Modules\Document\Enums;

enum DocumentVariantName: string
{
    case Original = 'original';
    case Preview = 'preview';
}
