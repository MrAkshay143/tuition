<?php
namespace App\Domains\Core\Requests\Student;
class ForceLogoutStudentRequest extends AuthorizesStudentActionRequest { protected function gateName(): string { return 'forceLogout'; } }
