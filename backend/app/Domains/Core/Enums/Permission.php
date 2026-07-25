<?php

namespace App\Domains\Core\Enums;

enum Permission: string
{
    case COURSE_VIEW = 'course.view';
    case COURSE_CREATE = 'course.create';
    case COURSE_UPDATE = 'course.update';
    case COURSE_PUBLISH = 'course.publish';
    case COURSE_ARCHIVE = 'course.archive';
    case COURSE_TRANSFER = 'course.transfer';

    case BATCH_MANAGE = 'batch.manage';
    
    case MEDIA_UPLOAD = 'media.upload';
    case MEDIA_DELETE = 'media.delete';

    case LIVE_CLASS_MANAGE = 'live_class.manage';
    case ASSIGNMENT_MANAGE = 'assignment.manage';
    case EXAM_MANAGE = 'exam.manage';

    case STUDENT_VIEW = 'student.view';
    case STUDENT_MANAGE = 'student.manage';

    case CERTIFICATE_GENERATE = 'certificate.generate';
    case SETTINGS_MANAGE = 'settings.manage';
    case DASHBOARD_VIEW = 'dashboard.view';
}
