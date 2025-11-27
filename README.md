# Recruit Dashboard

Next.js 14 + TypeScript で構成されたリクルート向けダッシュボード。Firebase 認証、TRPC ベースのサーバー、Drizzle（MySQL）によるデータ永続化を利用します。UI は shadcn/radix ベースのコンポーネント群を同梱。

## 技術スタック
- Next.js 14 / React 19 / TypeScript 5.9
- TRPC + Express ランタイム（`server/`）
- Drizzle ORM + MySQL（`drizzle/`）
- Firebase（クライアント SDK + Admin SDK）
- Tailwind（postcss）、shadcn/radix UI、Vitest

## ディレクトリ概要
- `src/pages/` ページルーティング（auth / marketing / dashboard / research など）。`src/pages/_app.tsx` が Next のエントリで共通 Provider/グローバルスタイルを管理。
- `src/App.tsx` は Vite 時代のスタンドアロンシェル（Next 実行時は未使用）。Storybook/単体デモ用途など限定で利用。
- `src/components/` アプリ共通 UI。`src/components/ui/` に shadcn/radix キットとバレル (`@/components/ui`)。
- `src/lib/` Firebase/TRPC 初期化とユーティリティ。
- `src/_core/hooks/` 認証フック、`src/contexts/` テーマコンテキスト。
- `server/` TRPC ルータや Firebase セッション、ストレージプロキシ、テスト。
- `drizzle/` スキーマ・リレーション・生成 SQL・スナップショット。
- `shared/` クライアント/サーバー共通の定数・型。
- `dist/` はビルド成果物（コミット不要）、`public/` は現状空。
- `patches/` 依存関係への pnpm パッチ（`wouter`, `streamdown`）。

## 前提
- Node.js 18+ 推奨
- pnpm 10.x（`packageManager` に固定）
- MySQL 8（ローカルは `docker-compose.yml` で起動可）

## セットアップ
1) 依存インストール  
   ```sh
   pnpm install
   ```
2) 環境変数 `.env` を作成（以下参照）。秘密情報はコミット禁止。
3) データベース起動（ローカル）  
   ```sh
   docker-compose up -d db
   ```
4) 開発サーバー  
   ```sh
   pnpm dev
   # http://localhost:3000
   ```

## 環境変数（主要）
```
# Next/Firebase (クライアント)
NEXT_PUBLIC_APP_ID=
NEXT_PUBLIC_APP_TITLE=
NEXT_PUBLIC_APP_LOGO=
NEXT_PUBLIC_OAUTH_PORTAL_URL=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# サーバー/セキュリティ
DATABASE_URL=                      # mysql://user:pass@host:3306/db
JWT_SECRET=
OAUTH_SERVER_URL=
OWNER_OPEN_ID=

# Firebase Admin（いずれか）
FIREBASE_ADMIN_CREDENTIALS=        # JSON 文字列
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=              # \n を改行に展開

### Firebase Admin SDK の認証エラー (invalid_grant) と対処

Firebase の管理 SDK で以下のようなエラーが出ることがあります:

```
Credential implementation provided to initializeApp() ... failed to fetch a valid Google OAuth2 access token: "invalid_grant: Invalid JWT: Token must be a short-lived token (60 minutes) and in a reasonable timeframe. Check your iat and exp values in the JWT claim."
```

主な原因と対応:

- サーバ / コンテナの時刻がずれている（最も多い原因）
   - コンテナ内の時刻がホストとずれていると、JWT の iat/exp が "合理的な時間" と見なされず失敗します。
   - コンテナで確認するコマンド例:
      - Docker Compose の場合:
         ```sh
         docker compose exec app date
         ```
      - Podman の場合:
         ```sh
         podman exec -it <app-container> date
         ```

- サービスアカウントのキーが無効化/ローテーションされている
   - Google Cloud Console > IAM & Admin > Service Accounts にアクセスし、対象サービスアカウントのキーが有効か確認してください。
   - キーがない、あるいは削除/ローテーションされた場合は新しいキーを生成し、コンテナに配置（または `FIREBASE_ADMIN_CREDENTIALS` に JSON を設定）してください。

- JSON のフォーマット/改行が壊れている
   - 環境変数に `FIREBASE_PRIVATE_KEY` を直接セットする場合は `\n` を改行に展開する必要があります。
   - `FIREBASE_ADMIN_CREDENTIALS` を使う場合は JSON が正しくエンコードされているか確認してください。

セキュリティ注意:
- サービスアカウント JSON は機密情報です。リポジトリに置かないでください。既に公開してしまった場合はすぐにキーを削除・再生成してください。

README 内にもトラブルシュートのログ出力を追加してあるので、initialize 時に出るログを見ればサーバー時刻や環境の手掛かりが得られます。

# ストレージプロキシ
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=

# OpenAI など追加で必要な場合は .env で定義
```

## スクリプト
- `pnpm dev` 開発サーバー（Next）
- `pnpm build` ビルド
- `pnpm start` 本番サーバー（`next start`）
- `pnpm lint` ESLint
- `pnpm check` TypeScript noEmit チェック
- `pnpm test` Vitest
- `pnpm db:push` Drizzle: SQL 生成 → migrate（`drizzle/migrations/` に出力）

## エントリポイントと UI 利用指針
- `_app.tsx` が Next 側の唯一のエントリ。グローバル Provider とスタイルはここに集約する。
- `src/App.tsx` はレガシーな Vite シェルで、本番実行には使わない。必要なら UI デモ/Storybook 的な用途に限定。
- shadcn/radix コンポーネントは `@/components/ui`（バレル）からインポートする方針。

## データベース / Drizzle
- スキーマ: `drizzle/schema.ts`、リレーション: `drizzle/relations.ts`
- 生成 SQL: `drizzle/0002_company_researches.sql`, `0003_events_selection_steps.sql`
- マイグレーション手順（開発フロー）
  1) `drizzle/schema.ts` を更新
  2) `pnpm db:push` を実行（generate + migrate → `drizzle/migrations/` 出力）
  3) 生成 SQL とスキーマ変更をコミット（破壊的変更は PR で明示）
- `drizzle/migrations/` は空にしないこと（スキーマと同期させる）

## テスト・検証
- 単体/結合: `pnpm test`
- 型: `pnpm check`
- Lint: `pnpm lint`
- スモーク: サインイン/サインアップ、ダッシュボード表示、companies/research 詳細、404、API catch-all、テーマ切替を手動確認

## デプロイ/運用メモ
- `dist/`, `.env`, Firebase 認証 JSON はコミットしない（`.gitignore` で除外済み）。`.next/`, `.turbo/` などキャッシュも対象外。
- `dist/` はローカル成果物のみ。デプロイは Next のビルド成果物を利用。
- TRPC と Firebase セッションはクライアント/サーバーで型・トークン整合性が必要。変更時は双方を更新。
- `patches/` で依存を上書きしているため pnpm でのインストールを前提にする。
