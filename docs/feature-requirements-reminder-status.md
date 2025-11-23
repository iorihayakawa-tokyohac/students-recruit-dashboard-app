# 追加機能要件（リマインダー／ステータス管理）

- 対象スタック: Express + tRPC、MySQL（Drizzle）、React/Wouter。タイムゾーンは JST を既定とする。
- 目的: 「期日/選考状況の抜け漏れ防止」「時間軸での行動計画」「企業横断の可視化」を実現する。

## A. リマインダー機能（カレンダー・メール通知）

### スコープと前提
- 対象イベント: ES 提出締切、Web テスト受験期限、各種面接、内定承諾期限、説明会/OB 訪問など任意イベント。
- 通知手段: ダッシュボード表示（直近 1 週間）とメール通知。Push は対象外。
- 初期は手動登録中心。タスク/選考ステップからの自動生成は将来拡張として設計のみ意識。

### UI/UX（MVP）
- ダッシュボード: 「直近 1 週間の予定」リスト（日時、企業名、種別、タイトル、メモ有無）。開始日時順。
- カレンダー/リストビュー: 週ビュー + 日別リスト形式。フィルター（企業、種別）。
- イベント作成/編集モーダル: タイトル、種別、企業選択（任意）、開始日時、終了日時（任意）、場所/URL（任意）、メモ（任意）、リマインド設定（前日/当日）。

### データモデル案（MySQL）
1) `events` テーブル
   - `id` (PK, int, auto increment)
   - `userId` (FK -> users.id, not null)
   - `companyId` (FK -> companies.id, null 許可, ON DELETE SET NULL)
   - `title` (varchar(255), not null)
   - `type` (enum: `es_deadline` | `interview` | `test` | `briefing` | `other`, not null)
   - `startAt` (datetime, not null) — 通知判定の基準時刻
   - `endAt` (datetime, null) — 任意の終了時刻
   - `location` (text, null) — 会場 or URL
   - `memo` (text, null)
   - `remindBeforeDays` (tinyint, default 1) — 例: 1=前日、3=3日前、0=前日通知なし
   - `remindOnDay` (boolean, default true) — 当日通知を送るか
   - `createdAt` / `updatedAt` (timestamp, default now/on update)
   - 推奨インデックス: `(userId, startAt)`, `(userId, companyId, startAt)`, `(userId, type, startAt)`

2) `notification_preferences` テーブル（メール ON/OFF 管理）
   - `userId` (PK, FK -> users.id)
   - `emailEnabled` (boolean, default false)
   - `overrideEmail` (varchar(320), null) — 未指定時は users.email を利用
   - 将来拡張: `customTimes`/`customDaysBefore` などは JSON で追加可能だが MVP では保持しない

### API/tRPC 要件（MVP）
- `events.listRange({ from, to, companyId?, types? })` — 期間/フィルター付き取得（ダッシュボード・週ビュー共通）
- `events.listUpcoming({ days })` — 今日以降 N 日のイベント（ダッシュボード用、デフォルト 7 日）
- `events.create/update/delete` — バリデーション: startAt 必須、title 255 文字以内、companyId は本人所有のみ
- `notificationPreferences.get/update` — メール受信トグルと送信先設定

### メール通知仕様（MVP）
- スケジュール: 前日 09:00（翌日分）、当日 08:00（当日分）にバッチを実行。
- 実装方針: `cron` or マネージドスケジューラから専用エンドポイント/ジョブを起動し、ユーザー単位でまとめて送信。
- 対象抽出:
  - 前日通知: `event.startAt` が「翌日 00:00〜24:00」で `remindBeforeDays >= 1`
  - 当日通知: `event.startAt` が「当日 00:00〜24:00」で `remindOnDay = true`
  - `emailEnabled=true` のユーザーのみ。メールアドレスは `overrideEmail` 優先、なければ `users.email`
- メール本文（例）:
  - 件名: `[就活ダッシュボード] 明日の予定のお知らせ` / `[就活ダッシュボード] 本日の就活予定`
  - 本文: 対象日、各イベントの「時間・企業名・種別・タイトル・メモ抜粋（任意）」を列挙。
- 失敗時: ログ記録のみ（MVP）。再送なし。

### 連携/ルール
- タスク連携: `tasks` の `dueDate` からイベント生成は将来拡張。初期は手動登録のみ。
- 企業削除時: 連鎖削除は行わず、`companyId` を null にする（イベントは残す）。UI で「未紐づけ」と表示。
- 重複判定: 同一日時・同タイトルの多重登録を許容（あえて抑止しない）。

### 非機能・検討事項
- コスト/パフォーマンス: バッチは 1 日 2 回、ユーザー単位でまとめ読み（`userId` フィルター + 期間絞り）を徹底。
- タイムゾーン: 全ユーザー JST 固定で計算。将来のタイムゾーン対応は留保。
- オープン課題: カスタム通知時刻、複数日前通知、繰り返しイベント、招待メール返信要否。

## B. ステータス管理（選考フロー管理）

### スコープと前提
- 企業ごとに選考ステップを保持し、ステップ状態から `companies.status` を拡張・自動反映。
- 標準ステータスのみをサポート（ユーザー定義は将来拡張）。

### 標準ステータス定義（企業ステータス）
- 事前: `未エントリー`, `情報収集中`, `説明会参加`
- 応募: `ES作成中`, `ES提出済`, `書類選考中`
- 選考: `一次面接`, `二次面接`, `最終面接`
- 結果: `内定`, `辞退`, `不合格`

### データモデル案（MySQL）
1) `companies` 既存列の整理
   - `status` を上記標準ステータスに正規化（既存データはマッピングするか自由入力を許容するか要判断）。
   - `nextStep`（テキスト）は維持。`nextDeadline` は次のステップ予定日と連動可能。

2) `selection_steps` テーブル（企業ごとのフロー）
   - `id` (PK, int, auto increment)
   - `userId` (FK -> users.id, not null)
   - `companyId` (FK -> companies.id, not null, ON DELETE CASCADE もしくは SET NULL; 要選択)
   - `order` (smallint, not null) — 並び順
   - `name` (varchar(100), not null) — ステップ名
   - `status` (enum: `not_started` | `scheduled` | `in_review` | `passed` | `failed`, default `not_started`)
   - `plannedDate` (date, null) — 予定日/期限
   - `actualDate` (date, null) — 実施日
   - `memo` (text, null)
   - `createdAt` / `updatedAt` (timestamp)
   - インデックス: `(userId, companyId, order)`, `(userId, companyId, status)`

### フロー初期化・テンプレート
- 標準テンプレート（ES→Web テスト→一次→二次→最終→内定）をフロント/バックいずれかで保持。
- 企業作成時またはユーザー操作でテンプレートを複製し `selection_steps` を生成（不要ステップは削除可、追加は MVP では無し or 限定）。

### API/tRPC 要件
- `selectionSteps.listByCompany({ companyId })`
- `selectionSteps.create`（テンプレ複製時にバルク作成を許容）
- `selectionSteps.update`（name, status, plannedDate, actualDate, memo, order の編集）
- `selectionSteps.delete`（MVP: 削除のみ許可 or 並び替え時に order 更新）
- バリデーション: 会社が本人の所有であること、order の一意性/連番維持。

### 企業ステータス自動連動ルール（案）
- ステップ更新時に `companies.status` を再計算し更新。
  - `failed` があり、以降ステップなし -> `不合格`
  - 最下流の `passed` が「内定」相当ステップ -> `内定`
  - 進行中の最上流ステップ（`scheduled`/`in_review`）の名前を `status` に反映
  - すべて `not_started` なら `未エントリー` またはテンプレ先頭名
- `nextStep`/`nextDeadline` は、`status` が `passed/failed` でない最上流の未完了ステップから自動算出。

### UI/UX
- 企業詳細: タイムライン/リストでステップ表示。ステータス変更（ドロップダウン）、予定日/実施日編集、メモ表示。不要ステップの削除を許容。
- ダッシュボード: ステータス別企業数の集計カード、次ステップ未設定企業のリスト。
- 企業一覧: `status` カラムとフィルター（例: 一次面接以上）。

### 非機能・移行
- ステップ数は 1 社あたり 10 前後を想定。クエリベースの集計で対応、事前集計テーブルは持たない。
- 既存 `companies.status` 文字列の扱い: 標準値へのマッピング表を用意し、マッピング不能なものは `その他` 扱い/フリーテキスト許容を決定する必要あり。
- オープン課題: ステップの自由追加/並び替え UI、複数フロー（職種別）対応、履歴ログの保持。
