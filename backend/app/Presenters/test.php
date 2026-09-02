<?php

declare(strict_types=1);

final class TestClass
{
    public function getProperty(string $name, int $id): array
    {
        $message = "Hello world";
        $count = 42;

        if ($id > 0) {
            return [
                'name' => $name,
                'message' => $message,
                'count' => $count,
            ];
        }

        return [];
    }
}