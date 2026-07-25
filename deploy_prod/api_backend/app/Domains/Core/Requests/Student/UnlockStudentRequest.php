<?php
namespace App\Domains\Core\Requests\Student;
class UnlockStudentRequest extends AuthorizesStudentActionRequest { protected function gateName(): string { return 'unlock'; } }
