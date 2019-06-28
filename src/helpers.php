<?php

namespace CopaChampagnat;

use \Cocur\Slugify\Slugify;
use \IndieHD\FilenameSanitizer\FilenameSanitizer;
use Riimu\Kit\PathJoin\Path;
use Slim\Http\Request;
use Spatie\Image\Image;
use Spatie\Image\Manipulations;

class Helpers {

    public function slugify($string, $separator = '-') {
        $slugify = new Slugify();

        return $slugify->slugify($string,$separator);
    }

    public function sanitizeFileName($filename, $separator = '-') {
        $sanitizer = new FilenameSanitizer();
        $sanitizer->setFilename($filename);
        $sanitizer->stripIllegalFilesystemCharacters();

        return $this->slugify($sanitizer->getFilename(), $separator);
    }

    function pathJoin($base, $path) {
        return rtrim( $base, '/' ) . '/' . ltrim( $path, '/' );
    }

    public function pathJoinFile($base, $path) {
        return Path::join($base, $path);
    }

    public function normalizePath($path) {
        return Path::normalize($path);
    }

    public function getFileExtension($file) {
        $info = new \SplFileInfo($file);

        return $info->getExtension();
    }

    public function imageReiszeDown($image, $width, $height) {
        $img = Image::load($image);

        if ($img->getWidth() > $width || $img->getHeight() > $height)
            $img->width($width)->height($height);

        $img->optimize()->save($image);
    }

    public function imageCreateThumb($image, $destImage, $width, $height) {
        Image::load($image)->fit(Manipulations::FIT_CROP, $width, $height)->optimize()->save($destImage);
    }

    public function buildAbsoluteUrl(Request $request, $path = '') {
        $uri = $request->getUri();

        $scheme = $uri->getScheme();
        $host = $uri->getHost();
        $port = ((int) $uri->getPort()) ?: 80;

        $baseUrl = "{$scheme}://{$host}" . ($port !== 80 ? ":{$port}" : '');

        return $this->pathJoin($baseUrl, $path);
    }
}