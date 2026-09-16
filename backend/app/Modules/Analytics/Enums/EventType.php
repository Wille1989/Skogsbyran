<?php

declare(strict_types=1);

namespace App\Modules\Analytics\Enums;

enum EventType: string
{
    case Visitor = 'visitor';
    case PropertyClick = 'property_click';
    case ImageClick = 'image_click';
}
