<?php

namespace App\Support\Constants;

class Permissions
{
    public const COURSE_VIEW = 'course.view';
    public const COURSE_CREATE = 'course.create';
    public const COURSE_UPDATE = 'course.update';
    public const COURSE_PUBLISH = 'course.publish';
    public const COURSE_ARCHIVE = 'course.archive';
    public const COURSE_TRANSFER = 'course.transfer';

    public const EXAM_MANAGE = 'exam.manage';
    public const ASSIGNMENT_MANAGE = 'assignment.manage';

    public const MEDIA_UPLOAD = 'media.upload';
    public const MEDIA_DELETE = 'media.delete';

    public const STUDENT_VIEW = 'student.view';
    public const STUDENT_MANAGE = 'student.manage';

    public const CERTIFICATE_GENERATE = 'certificate.generate';
    public const SETTINGS_MANAGE = 'settings.manage';
    public const DASHBOARD_VIEW = 'dashboard.view';
}
