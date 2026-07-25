<?php
namespace App\Domains\Media\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Media\Models\Media;
use Illuminate\Support\Facades\Gate;
class DeleteMediaRequest extends ApiFormRequest {
    public function authorize(): bool {
        $media = Media::findOrFail($this->route("id"));
        return Gate::allows("delete", $media);
    }
    public function rules(): array { return []; }
}
