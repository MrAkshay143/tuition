<?php

namespace App\Domains\Certificate\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Domains\Certificate\Models\Certificate;

class GenerateCertificateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly Certificate $certificate) {}

    public function handle(): void
    {
        // PDF Certificate generation logic
        $certificateNumber = 'CERT-' . strtoupper(\Illuminate\Support\Str::random(10));
        $this->certificate->update([
            'certificate_number' => $certificateNumber,
            'issued_at'          => now(),
        ]);
    }
}
