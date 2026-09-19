<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120', 'not_regex:/[\r\n]/'],
            'email' => ['nullable', 'required_without:phone', 'string', 'email:rfc', 'max:254', 'not_regex:/[\r\n]/'],
            'phone' => ['nullable', 'required_without:email', 'string', 'max:50', 'regex:/^[0-9+() .\-]{5,50}$/'],
            'message' => ['nullable', 'string', 'max:5000'],
            'website' => ['nullable', 'string', 'max:0'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Ange ditt namn.',
            'email.required_without' => 'Ange e-postadress eller telefonnummer.',
            'phone.required_without' => 'Ange e-postadress eller telefonnummer.',
            'email.email' => 'Ange en giltig e-postadress.',
            'phone.regex' => 'Ange ett giltigt telefonnummer.',
            'max' => 'Fältet :attribute får innehålla högst :max tecken.',
            'not_regex' => 'Fältet :attribute får inte innehålla radbrytningar.',
            'website.max' => 'Formuläret kunde inte skickas.',
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return ['name' => 'namn', 'email' => 'e-postadress', 'phone' => 'telefon', 'message' => 'meddelande'];
    }
}
