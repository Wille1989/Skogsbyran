<?php

declare(strict_types=1);

namespace App\Modules\Image\Enums;

enum ImageVariantName: string
{
    case Thumb = 'thumb';
    case Medium = 'medium';
    case Large = 'large';
}
