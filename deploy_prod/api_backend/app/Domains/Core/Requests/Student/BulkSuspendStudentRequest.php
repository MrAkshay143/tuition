<?php
namespace App\Domains\Core\Requests\Student;
class BulkSuspendStudentRequest extends BulkStudentRequest { protected function gateName(): string { return 'suspend'; } }
