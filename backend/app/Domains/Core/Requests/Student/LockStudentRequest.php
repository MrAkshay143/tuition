<?php
namespace App\Domains\Core\Requests\Student;
class LockStudentRequest extends AuthorizesStudentActionRequest { protected function gateName(): string { return 'lock'; } }
