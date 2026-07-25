<?php
namespace App\Domains\Core\Requests\Student;
class SuspendStudentRequest extends AuthorizesStudentActionRequest { protected function gateName(): string { return 'suspend'; } }
