<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Core\Models\Announcement;
class DeleteAnnouncementRequest extends ApiFormRequest {
    public function authorize(): bool {
        $announcement = Announcement::findOrFail($this->route('id'));
        if (!$this->user()->isAdmin() && $announcement->created_by !== $this->user()->id) {
            return false;
        }
        return true;
    }
    public function rules(): array { return []; }
}
