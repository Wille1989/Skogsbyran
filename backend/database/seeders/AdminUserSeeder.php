<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@skogsbyran.se'],
            [
                'username' => 'admin',
                'admin' => true,
                'email_verified_at' => now(),
                'password' => Hash::make('Grekland2022'),
            ],
        );
    }
}
