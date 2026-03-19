# Laravel 実装手順書 — 日報機能

**参考プロトタイプ:** `http://localhost:3000/daily-reports`
**対象フレームワーク:** Laravel 11 + MySQL + Blade + Alpine.js

---

## 全体の流れ

```
1. Laravelプロジェクト作成
2. 認証セットアップ（Breeze）
3. マイグレーション（DBテーブル作成）
4. モデル作成
5. コントローラー作成
6. ルート定義
7. ビュー作成（Blade）
8. 動作確認
```

---

## Step 1. Laravelプロジェクト作成

```bash
composer create-project laravel/laravel intranet-portal
cd intranet-portal
```

`.env` を編集してDB接続を設定：

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=intranet_portal
DB_USERNAME=root
DB_PASSWORD=your_password
```

---

## Step 2. 認証セットアップ（Laravel Breeze）

```bash
composer require laravel/breeze --dev
php artisan breeze:install blade
npm install && npm run dev
php artisan migrate
```

これで `/login`、`/register`、ログイン済みチェックが使えるようになる。

---

## Step 3. マイグレーション（日報テーブル作成）

```bash
php artisan make:migration create_daily_reports_table
```

生成された `database/migrations/xxxx_create_daily_reports_table.php` を編集：

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('report_date');
            $table->text('tasks_done')->default('');        // 本日行った業務
            $table->text('tasks_ongoing')->default('');     // 進行中のタスク
            $table->text('tasks_planned')->default('');     // 行いたい業務
            $table->text('handover')->default('特になし');  // 引き継ぎ内容
            $table->text('issues')->default('');            // 問題点・気づき
            $table->text('sharing')->default('特になし');   // 全体共有内容
            $table->text('questions')->default('特になし'); // 質問・サポート依頼
            $table->timestamps();

            // 1ユーザー1日1件制約
            $table->unique(['user_id', 'report_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_reports');
    }
};
```

```bash
php artisan migrate
```

---

## Step 4. モデル作成

```bash
php artisan make:model DailyReport
```

`app/Models/DailyReport.php` を編集：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyReport extends Model
{
    protected $fillable = [
        'user_id',
        'report_date',
        'tasks_done',
        'tasks_ongoing',
        'tasks_planned',
        'handover',
        'issues',
        'sharing',
        'questions',
    ];

    protected $casts = [
        'report_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // チャットワーク貼り付け用フォーマット生成
    public function toReportText(): string
    {
        $date = $this->report_date->format('n/j');
        $name = $this->user->name;

        return <<<EOT
        【日付】{$date}
        【名前】{$name}

        ■ 本日行った業務
        {$this->tasks_done}

        ■ 進行中のタスク
        {$this->tasks_ongoing}

        ■ 行いたい業務（今後やること）
        {$this->tasks_planned}

        ■ 引き継ぎ内容
        {$this->handover}

        ■ 問題点・気づき / 改善案
        {$this->issues}

        ■ 全体共有内容
        {$this->sharing}

        ■ 質問 / サポート依頼
        {$this->questions}
        EOT;
    }
}
```

---

## Step 5. コントローラー作成

```bash
php artisan make:controller DailyReportController --resource
```

`app/Http/Controllers/DailyReportController.php` を編集：

```php
<?php

namespace App\Http\Controllers;

use App\Models\DailyReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DailyReportController extends Controller
{
    // 一覧表示
    public function index()
    {
        $reports = DailyReport::where('user_id', Auth::id())
            ->orderBy('report_date', 'desc')
            ->paginate(5);

        return view('daily-reports.index', compact('reports'));
    }

    // 作成フォーム表示
    public function create()
    {
        $today = now()->toDateString();
        return view('daily-reports.create', compact('today'));
    }

    // 保存（作成 or 上書き）
    public function store(Request $request)
    {
        $validated = $request->validate([
            'report_date'   => 'required|date',
            'tasks_done'    => 'required|string',
            'tasks_ongoing' => 'nullable|string',
            'tasks_planned' => 'nullable|string',
            'handover'      => 'nullable|string',
            'issues'        => 'nullable|string',
            'sharing'       => 'nullable|string',
            'questions'     => 'nullable|string',
        ]);

        // 同じ日付があれば上書き、なければ作成
        DailyReport::updateOrCreate(
            ['user_id' => Auth::id(), 'report_date' => $validated['report_date']],
            array_merge($validated, ['user_id' => Auth::id()])
        );

        return redirect()->route('daily-reports.index')
            ->with('success', '日報を保存しました');
    }

    // 編集フォーム表示
    public function edit(DailyReport $dailyReport)
    {
        // 自分の日報だけ編集可能
        abort_if($dailyReport->user_id !== Auth::id(), 403);

        return view('daily-reports.edit', compact('dailyReport'));
    }

    // 更新
    public function update(Request $request, DailyReport $dailyReport)
    {
        abort_if($dailyReport->user_id !== Auth::id(), 403);

        $validated = $request->validate([
            'tasks_done'    => 'required|string',
            'tasks_ongoing' => 'nullable|string',
            'tasks_planned' => 'nullable|string',
            'handover'      => 'nullable|string',
            'issues'        => 'nullable|string',
            'sharing'       => 'nullable|string',
            'questions'     => 'nullable|string',
        ]);

        $dailyReport->update($validated);

        return redirect()->route('daily-reports.index')
            ->with('success', '日報を更新しました');
    }

    // 削除
    public function destroy(DailyReport $dailyReport)
    {
        abort_if($dailyReport->user_id !== Auth::id(), 403);

        $dailyReport->delete();

        return redirect()->route('daily-reports.index')
            ->with('success', '日報を削除しました');
    }

    // テキスト出力（コピー用）
    public function text(DailyReport $dailyReport)
    {
        abort_if($dailyReport->user_id !== Auth::id(), 403);

        return response($dailyReport->toReportText(), 200)
            ->header('Content-Type', 'text/plain; charset=UTF-8');
    }
}
```

---

## Step 6. ルート定義

`routes/web.php` に追加：

```php
use App\Http\Controllers\DailyReportController;

Route::middleware('auth')->group(function () {
    Route::resource('daily-reports', DailyReportController::class);
    Route::get('daily-reports/{dailyReport}/text', [DailyReportController::class, 'text'])
        ->name('daily-reports.text');
});
```

ルート確認：
```bash
php artisan route:list --path=daily-reports
```

---

## Step 7. ビュー作成（Blade）

### ディレクトリ構成

```
resources/views/daily-reports/
  ├── index.blade.php   # 一覧
  ├── create.blade.php  # 作成フォーム
  ├── edit.blade.php    # 編集フォーム
  └── _form.blade.php   # 共通フォーム部品
```

---

### 7-1. 共通フォーム部品 `_form.blade.php`

```blade
{{-- 本日行った業務（必須） --}}
<div class="mb-4">
    <label class="block text-sm font-semibold text-gray-600 mb-1">
        ■ 本日行った業務 <span class="text-red-500">*</span>
    </label>
    <textarea name="tasks_done" rows="4" required
        placeholder="・タスク名 1h&#10;・タスク名 0.5h"
        class="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">{{ old('tasks_done', $report->tasks_done ?? '') }}</textarea>
    @error('tasks_done')
        <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
    @enderror
</div>

<div class="mb-4">
    <label class="block text-sm font-semibold text-gray-600 mb-1">■ 進行中のタスク</label>
    <textarea name="tasks_ongoing" rows="3"
        class="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">{{ old('tasks_ongoing', $report->tasks_ongoing ?? '') }}</textarea>
</div>

<div class="mb-4">
    <label class="block text-sm font-semibold text-gray-600 mb-1">■ 行いたい業務（今後やること）</label>
    <textarea name="tasks_planned" rows="3"
        class="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">{{ old('tasks_planned', $report->tasks_planned ?? '') }}</textarea>
</div>

<div class="mb-4">
    <label class="block text-sm font-semibold text-gray-600 mb-1">■ 引き継ぎ内容</label>
    <textarea name="handover" rows="2"
        class="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">{{ old('handover', $report->handover ?? '特になし') }}</textarea>
</div>

<div class="mb-4">
    <label class="block text-sm font-semibold text-gray-600 mb-1">■ 問題点・気づき / 改善案</label>
    <textarea name="issues" rows="4"
        class="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">{{ old('issues', $report->issues ?? '') }}</textarea>
</div>

<div class="mb-4">
    <label class="block text-sm font-semibold text-gray-600 mb-1">■ 全体共有内容</label>
    <textarea name="sharing" rows="2"
        class="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">{{ old('sharing', $report->sharing ?? '特になし') }}</textarea>
</div>

<div class="mb-4">
    <label class="block text-sm font-semibold text-gray-600 mb-1">■ 質問 / サポート依頼</label>
    <textarea name="questions" rows="2"
        class="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">{{ old('questions', $report->questions ?? '特になし') }}</textarea>
</div>
```

---

### 7-2. 一覧画面 `index.blade.php`

```blade
<x-app-layout>
    <div class="max-w-3xl mx-auto py-8 px-4">

        {{-- ヘッダー --}}
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-xl font-bold text-gray-800">日報</h1>
            <a href="{{ route('daily-reports.create') }}"
               class="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                ＋ 今日の日報
            </a>
        </div>

        {{-- フラッシュメッセージ --}}
        @if(session('success'))
            <div class="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-4 text-sm">
                {{ session('success') }}
            </div>
        @endif

        {{-- 日報一覧 --}}
        @forelse($reports as $report)
            <div class="bg-white rounded-2xl shadow-sm px-4 py-4 mb-3">
                <div class="flex items-center justify-between mb-3">
                    <span class="font-semibold text-gray-800">
                        {{ $report->report_date->format('n/j') }}（{{ Auth::user()->name }}）
                    </span>
                    <div class="flex gap-2">
                        {{-- コピーボタン（Alpine.js） --}}
                        <div x-data="{ copied: false }">
                            <button
                                @click="
                                    fetch('{{ route('daily-reports.text', $report) }}')
                                        .then(r => r.text())
                                        .then(t => navigator.clipboard.writeText(t));
                                    copied = true;
                                    setTimeout(() => copied = false, 2000)
                                "
                                class="text-xs px-3 py-1.5 rounded-lg border text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                            >
                                <span x-show="!copied">コピー</span>
                                <span x-show="copied" class="text-green-600">コピー済み ✓</span>
                            </button>
                        </div>
                        <a href="{{ route('daily-reports.edit', $report) }}"
                           class="text-xs px-3 py-1.5 rounded-lg border text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                            編集
                        </a>
                        {{-- 削除 --}}
                        <form action="{{ route('daily-reports.destroy', $report) }}" method="POST"
                              onsubmit="return confirm('削除しますか？')">
                            @csrf @method('DELETE')
                            <button type="submit"
                                class="text-xs px-3 py-1.5 rounded-lg border text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors">
                                削除
                            </button>
                        </form>
                    </div>
                </div>

                <div class="space-y-2 text-xs">
                    @if($report->tasks_done)
                        <div>
                            <p class="font-semibold text-gray-400 mb-0.5">■ 本日行った業務</p>
                            <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">{{ $report->tasks_done }}</p>
                        </div>
                    @endif
                    @if($report->tasks_ongoing)
                        <div>
                            <p class="font-semibold text-gray-400 mb-0.5">■ 進行中のタスク</p>
                            <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">{{ $report->tasks_ongoing }}</p>
                        </div>
                    @endif
                    @if($report->issues)
                        <div>
                            <p class="font-semibold text-gray-400 mb-0.5">■ 問題点・気づき / 改善案</p>
                            <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">{{ $report->issues }}</p>
                        </div>
                    @endif
                </div>
            </div>
        @empty
            <div class="bg-white rounded-2xl shadow-sm px-4 py-10 text-center text-sm text-gray-400">
                日報はまだありません
            </div>
        @endforelse

        {{-- ページング --}}
        <div class="mt-4">
            {{ $reports->links() }}
        </div>
    </div>
</x-app-layout>
```

---

### 7-3. 作成フォーム `create.blade.php`

```blade
<x-app-layout>
    <div class="max-w-2xl mx-auto py-8 px-4">
        <h1 class="text-xl font-bold text-gray-800 mb-6">日報を作成</h1>

        <div class="bg-white rounded-2xl shadow-sm p-6">
            <form action="{{ route('daily-reports.store') }}" method="POST">
                @csrf

                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-600 mb-1">日付</label>
                    <input type="date" name="report_date"
                        value="{{ old('report_date', $today) }}"
                        class="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                </div>

                @include('daily-reports._form')

                <div class="flex gap-3 mt-6">
                    <a href="{{ route('daily-reports.index') }}"
                       class="flex-1 text-center border rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                        キャンセル
                    </a>
                    <button type="submit"
                        class="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700">
                        保存
                    </button>
                </div>
            </form>
        </div>
    </div>
</x-app-layout>
```

---

### 7-4. 編集フォーム `edit.blade.php`

```blade
<x-app-layout>
    <div class="max-w-2xl mx-auto py-8 px-4">
        <h1 class="text-xl font-bold text-gray-800 mb-6">
            日報を編集（{{ $dailyReport->report_date->format('n/j') }}）
        </h1>

        <div class="bg-white rounded-2xl shadow-sm p-6">
            <form action="{{ route('daily-reports.update', $dailyReport) }}" method="POST">
                @csrf @method('PUT')

                @php $report = $dailyReport @endphp
                @include('daily-reports._form')

                <div class="flex gap-3 mt-6">
                    <a href="{{ route('daily-reports.index') }}"
                       class="flex-1 text-center border rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                        キャンセル
                    </a>
                    <button type="submit"
                        class="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700">
                        更新
                    </button>
                </div>
            </form>
        </div>
    </div>
</x-app-layout>
```

---

## Step 8. Alpine.js の導入（コピーボタン用）

`resources/views/layouts/app.blade.php` の `<head>` に追加（Breezeデフォルトレイアウト）：

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

---

## Step 9. 動作確認

```bash
php artisan serve
```

| URL | 内容 |
|---|---|
| `http://localhost:8000/daily-reports` | 一覧 |
| `http://localhost:8000/daily-reports/create` | 作成フォーム |
| `http://localhost:8000/daily-reports/1/edit` | 編集フォーム |

---

## 完成後のディレクトリ構成

```
app/
  Http/Controllers/DailyReportController.php
  Models/DailyReport.php

database/migrations/
  xxxx_create_daily_reports_table.php

resources/views/daily-reports/
  index.blade.php
  create.blade.php
  edit.blade.php
  _form.blade.php

routes/
  web.php
```

---

## 社内ポータル全体に組み込む場合の追加作業

1. **サイドバー** に `/daily-reports` へのリンクを追加
2. **ミドルウェア** でロールチェックが必要な場合は `auth` の他に独自ミドルウェアを追加
3. **管理者画面** で全員の日報を閲覧したい場合は `AdminDailyReportController` を別途作成
