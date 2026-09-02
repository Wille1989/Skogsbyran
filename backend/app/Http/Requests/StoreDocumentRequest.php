<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Modules\Document\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreDocumentRequest extends FormRequest
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
            'type' => [
                'required',
                'string',
                Rule::in(Document::TYPES),
            ],

            'file' => [
                'required',
                'file',
                'mimetypes:application/pdf',
                'max:20480',
            ],
        ];
    }
}
