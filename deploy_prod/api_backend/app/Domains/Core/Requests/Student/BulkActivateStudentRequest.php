<?php
namespace App\Domains\Core\Requests\Student;
class BulkActivateStudentRequest extends BulkStudentRequest { protected function gateName(): string { return 'activate'; } }
