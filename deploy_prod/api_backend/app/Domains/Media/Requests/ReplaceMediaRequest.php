<?php
namespace App\Domains\Media\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Media\Models\Media;
use Illuminate\Support\Facades\Gate;
class ReplaceMediaRequest extends ApiFormRequest {
    public function authorize(): bool {
        $media = Media::findOrFail($this->route('id'));
        return Gate::allows('update', $media);
    }
    public function rules(): array {
        return [
            'file' => 'required|file|max:2097152',
        ];
    }
}
