<?php
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$request = new App\Http\Requests\StoreContactRequest;
foreach (['' => false, '   !!! 123' => false, 'abcdefghi' => false, 'abcdefghij' => true, 'Åäö abc defg' => true, str_repeat('a', 5001) => false] as $message => $expected) {
    $validator = Illuminate\Support\Facades\Validator::make(['message' => $message], ['message' => $request->rules()['message']]);
    if ($validator->passes() !== $expected) { throw new RuntimeException('Contact message validation failed.'); }
}
echo "Contact message validation passed.\n";
