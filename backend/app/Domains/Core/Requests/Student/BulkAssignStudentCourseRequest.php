<?php
namespace App\Domains\Core\Requests\Student;
class BulkAssignStudentCourseRequest extends BulkStudentRequest {
    protected function gateName(): string { return 'assignCourse'; }
    public function rules(): array {
        return array_merge(parent::rules(), [
            'course_ids'   => 'required|array',
            'course_ids.*' => 'exists:courses,id'
        ]);
    }
}
