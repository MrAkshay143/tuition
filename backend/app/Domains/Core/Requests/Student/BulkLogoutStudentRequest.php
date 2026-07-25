<?php
namespace App\Domains\Core\Requests\Student;
class BulkLogoutStudentRequest extends BulkStudentRequest { protected function gateName(): string { return 'forceLogout'; } }
