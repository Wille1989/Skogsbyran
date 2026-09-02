<?php

declare(strict_types=1);

namespace App\Modules\Property\Enums;

enum ListingStatus: string
{
    case Upcoming = 'upcoming';
    case Available = 'available';
    case Bidding = 'bidding';
    case Reserved = 'reserved';
    case Sold = 'sold';
}
