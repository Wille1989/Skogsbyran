<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Modules\Document\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->file('document') !== null && $this->file('file') === null) {
            $this->files->set('file', $this->file('document'));
            $this->merge(['file' => $this->file('document')]);
        }
    }

    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'mimetypes:application/pdf',
                'max:20480',
            ],

            'type' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in(Document::TYPES),
            ],

            'title' => [
                'nullable',
                'string',
                'max:120',
            ],
        ];
    }
}
