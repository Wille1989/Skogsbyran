<?php

declare(strict_types=1);

namespace App\Services;

use GdImage;
use Illuminate\Http\UploadedFile;
use RuntimeException;

final class ImageVariantService
{
    private const MAX_DIMENSION = 6_000;
    private const WEBP_QUALITY = 85;

    private const VARIANT_WIDTHS = [
        'thumb' => 300,
        'medium' => 800,
        'large' => 1600,
    ];

    public function process(UploadedFile $file): array {
        $source = $this->createSourceImage($file);
        $source = $this->rotateJpegFromExif(
            $file,
            $source
        );

        $variants = [];

        try {
            foreach (
                self::VARIANT_WIDTHS as $variant => $maxWidth
            ) {
                $variants[$variant] = $this->resizeToWebp(
                    $source,
                    $maxWidth
                );
            }

            return $variants;
        } catch (\Throwable $exception) {
            $this->deleteTemporaryFiles($variants);

            throw $exception;
        } finally {
            imagedestroy($source);
        }
    }

    private function createSourceImage(UploadedFile $file): GdImage {
        $path = $file->getRealPath();

        if (!is_string($path) || $path === '') {
            throw new RuntimeException(
                'Uploaded image path is not readable.'
            );
        }

        $imageInfo = getimagesize($path);

        if ($imageInfo === false) {
            throw new RuntimeException(
                'Invalid image file.'
            );
        }

        $width = $imageInfo[0];
        $height = $imageInfo[1];
        $mime = $imageInfo['mime'] ?? '';

        if (
            $width > self::MAX_DIMENSION
            || $height > self::MAX_DIMENSION
        ) {
            throw new RuntimeException(
                "Image dimensions are too large to process: {$width}x{$height}"
            );
        }

        if (
            !in_array(
                $mime,
                [
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                ],
                true
            )
        ) {
            throw new RuntimeException(
                "Unsupported image type: {$mime}"
            );
        }

        $binary = file_get_contents($path);

        if ($binary === false) {
            throw new RuntimeException(
                'Failed to read uploaded image.'
            );
        }

        return $this->assertImageLoaded(
            imagecreatefromstring($binary),
            $mime
        );
    }

    private function rotateJpegFromExif(UploadedFile $file, GdImage $source): GdImage {
        $path = $file->getRealPath();

        if (
            $file->getMimeType() !== 'image/jpeg'
            || !is_string($path)
            || !function_exists('exif_read_data')
        ) {
            return $source;
        }

        $exif = @exif_read_data($path);

        if (!is_array($exif)) {
            return $source;
        }

        $orientation = $exif['Orientation'] ?? null;

        return match ($orientation) {
            3 => $this->rotateImage(
                $source,
                180
            ),

            6 => $this->rotateImage(
                $source,
                -90
            ),

            8 => $this->rotateImage(
                $source,
                90
            ),

            default => $source,
        };
    }

    private function rotateImage(GdImage $source, int $angle): GdImage {
        $rotated = imagerotate($source, $angle, 0);

        if (!$rotated instanceof GdImage) {
            return $source;
        }

        imagedestroy($source);

        return $rotated;
    }

    private function resizeToWebp(GdImage $source, int $maxWidth): string {
        $width = imagesx($source);
        $height = imagesy($source);

        if ($width <= $maxWidth) {
            $newWidth = $width;
            $newHeight = $height;
        } else {
            $newWidth = $maxWidth;

            $newHeight = (int) round(
                ($height / $width) * $newWidth
            );
        }

        $resized = imagecreatetruecolor(
            $newWidth,
            $newHeight
        );

        if (!$resized instanceof GdImage) {
            throw new RuntimeException(
                'Failed to allocate resized image.'
            );
        }

        try {
            imagealphablending(
                $resized,
                false
            );

            imagesavealpha(
                $resized,
                true
            );

            $transparent = imagecolorallocatealpha(
                $resized,
                0,
                0,
                0,
                127
            );

            imagefilledrectangle(
                $resized,
                0,
                0,
                $newWidth,
                $newHeight,
                $transparent
            );

            imagecopyresampled(
                $resized,
                $source,
                0,
                0,
                0,
                0,
                $newWidth,
                $newHeight,
                $width,
                $height
            );

            $outputPath =
                sys_get_temp_dir()
                . '/'
                . uniqid(
                    'property-image-',
                    true
                )
                . '.webp';

            if (
                !imagewebp(
                    $resized,
                    $outputPath,
                    self::WEBP_QUALITY
                )
            ) {
                throw new RuntimeException(
                    'Failed to encode WebP image.'
                );
            }

            return $outputPath;
        } finally {
            imagedestroy($resized);
        }
    }

    private function deleteTemporaryFiles(array $files): void {
        foreach ($files as $path) {
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }

    private function assertImageLoaded(GdImage|false $image, string $mime): GdImage {
        if (!$image instanceof GdImage) {
            throw new RuntimeException(
                "Failed to decode image: {$mime}"
            );
        }

        return $image;
    }
}