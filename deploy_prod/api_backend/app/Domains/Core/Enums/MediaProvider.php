<?php

namespace App\Domains\Core\Enums;

enum MediaProvider: string
{
    case YOUTUBE = 'youtube';
    case VIMEO = 'vimeo';
    case CLOUDFLARE_R2 = 'cloudflare_r2';
    case AMAZON_S3 = 'amazon_s3';
    case LOCAL = 'local';
}
