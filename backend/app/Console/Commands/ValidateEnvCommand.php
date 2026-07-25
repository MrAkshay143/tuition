<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ValidateEnvCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:validate-env';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Validate environment configuration for production readiness';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Validating production environment configuration...');
        $errors = [];

        if (config('app.debug') === true) {
            $errors[] = 'APP_DEBUG is enabled (true). Production requires APP_DEBUG=false.';
        }

        if (config('app.env') !== 'production') {
            $this->warn("APP_ENV is set to '" . config('app.env') . "'. Recommended: 'production'.");
        }

        if (empty(config('app.key'))) {
            $errors[] = 'APP_KEY is missing or empty.';
        }

        if (config('app.env') === 'production' && empty(config('database.connections.mysql.password'))) {
            $errors[] = 'Database password is empty in production mode.';
        }

        if (count($errors) > 0) {
            $this->error('Environment Validation Failed!');
            foreach ($errors as $error) {
                $this->line("  ❌ {$error}");
            }
            return Command::FAILURE;
        }

        $this->info('✅ Production environment validation PASSED successfully.');
        return Command::SUCCESS;
    }
}
