<?php

namespace App\Domains\Course\Enums;

enum CourseStatus: string
{
    case DRAFT = 'draft';
    case IN_REVIEW = 'in_review';
    case APPROVED = 'approved';
    case PUBLISHED = 'published';
    case ARCHIVED = 'archived';

    /**
     * Get valid next states from the current state.
     */
    public function canTransitionTo(self $target): bool
    {
        return match ($this) {
            self::DRAFT      => in_array($target, [self::IN_REVIEW, self::PUBLISHED, self::ARCHIVED]),
            self::IN_REVIEW  => in_array($target, [self::APPROVED, self::DRAFT]),
            self::APPROVED   => in_array($target, [self::PUBLISHED, self::DRAFT]),
            self::PUBLISHED  => in_array($target, [self::ARCHIVED, self::DRAFT]),
            self::ARCHIVED   => in_array($target, [self::DRAFT]),
        };
    }
}
