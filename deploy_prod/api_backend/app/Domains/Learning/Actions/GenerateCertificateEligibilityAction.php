<?php

namespace App\Domains\Learning\Actions;

use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Course;
use App\Domains\Certificate\Models\Certificate;

class GenerateCertificateEligibilityAction
{
    public function execute(User $user, Course $course): Certificate
    {
        $certNo = 'CERT-' . strtoupper(bin2hex(random_bytes(6)));

        return Certificate::firstOrCreate(
            [
                'user_id'   => $user->id,
                'course_id' => $course->id,
            ],
            [
                'certificate_no' => $certNo,
                'type'           => 'completion',
                'issued_at'      => now(),
                'pdf_url'        => '/certificates/' . $certNo . '.pdf',
                'qr_code'        => 'QR-' . $certNo,
            ]
        );
    }
}
