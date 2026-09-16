<?php

declare(strict_types=1);

namespace App\Modules\Activity\Enums;

enum EventType: string
{
    case PropertyCreated = 'property_created';
    case PropertyDeleted = 'property_deleted';
    case PropertyUpdated = 'property_updated';
    case ImagesUploaded = 'images_uploaded';
    case PropertyPublished = 'property_published';
    case PropertyUnpublished = 'property_unpublished';
}
