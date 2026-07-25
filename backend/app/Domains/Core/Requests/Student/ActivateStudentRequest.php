<?php
namespace App\Domains\Core\Requests\Student;
class ActivateStudentRequest extends AuthorizesStudentActionRequest { protected function gateName(): string { return 'activate'; } }
