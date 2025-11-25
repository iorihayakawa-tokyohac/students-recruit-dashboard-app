# 第一回リファクタリング要件定義書（ドラフト）

## 1. 文書名
- 第一回リファクタリング要件定義書（ドラフト）

## 2. 背景・目的
- Vite から Next.js 14 へ移行した結果、Vite 時代のコードと Next.js 用コードが混在し、エントリポイント・ルーティング・状態管理・コンポーネント構成が分散している。
- データ層（Drizzle + MySQL）と TRPC ベースのサーバー接続は成立しており、Next.js アプリとしての安定化を早期に図る必要がある。
- 本要件定義書は、第一回リファクタリング（Batch 1）の範囲・ゴール・受け入れ条件を定義し、「混乱した現状を一度整える」ことを目的とする。

## 3. 対象範囲（スコープ）
- フロントエンド（Next.js）
  - `src/pages/` 以下のページ（auth / marketing / dashboard / research / 404 等）
  - `src/pages/_app.tsx`
  - `src/App.tsx`
- 共通コンポーネント
  - `src/components/`
  - `src/components/ui/`（shadcn / radix UI キット）
- 状態管理・コンテキスト
  - `src/_core/hooks/useAuth.ts`
  - `src/contexts/ThemeContext.tsx`
  - その他 `src/hooks/` 配下で対象と判断したもの
- ライブラリ層
  - `src/lib/{firebase,trpc,utils}.ts`
  - `shared/{const.ts,types.ts,_core/errors.ts}`
- バックエンド境界
  - `server/` 配下の TRPC ルータ構成・型共有部分
- ビルド・ツール類
  - `.gitignore`
  - `next.config.js`, `vite.config.ts`, `vitest.config.ts`, `drizzle.config.ts`
  - `package.json` の scripts
  - `dist/` ディレクトリの扱い

## 4. 非対象範囲
- 既存ビジネスロジックの仕様変更・機能追加
- UI デザイン（見た目）の大幅刷新
- 新規ページ・新機能の追加
- インフラ構成（本番環境・CI/CD）の抜本的変更
- 認証方式（Firebase Auth）自体の変更

## 5. ゴール（達成状態）
- **エントリポイント統一**: `_app.tsx` を唯一のエントリとしてプロバイダ／グローバルスタイルを集約。`src/App.tsx` は削除または限定用途に明記。
- **レイアウト・ルーティング整理**: 認証・マーケティング・ダッシュボードを統一レイアウト配下に整理し、404 画面を一つに統合。
- **状態管理の一元化**: useAuth と Firebase セッションの型整合、ThemeContext を唯一のテーマ管理ポイントとする。
- **UI コンポーネントの統一**: `src/components/ui/index.ts` によるバレルエクスポートとインポート経路統一、未使用コンポーネント整理。
- **API／データ境界の明確化**: クライアントデータアクセスを原則 TRPC 経由とし、ルータ入出力を zod スキーマ化、shared/types.ts と整合。
- **ビルド成果物・機密情報の適正管理**: `dist/` をリポジトリから除外し `.gitignore` で管理、`.env` や Firebase JSON はコミット対象外を明示。
- **Drizzle マイグレーションの確立**: `drizzle/migrations/` を最新化し、DB 変更手順（generate → migrate → commit）を README に明記。

## 6. 機能要件（作業要件）
- **エントリポイント／レイアウト統合**
  - `_app.tsx` にテーマコンテキスト、TRPC Provider、全体スタイルを集約。
  - `src/App.tsx` は役割重複なら削除。限定用途とする場合は README に用途・利用箇所を明記。
  - 重複したグローバルスタイル import を整理し二重読み込みを防止。
- **ルーティング／UX 整理**
  - 404 実装を `404.tsx` または `NotFound.tsx` のいずれかに統一し、Next.js の 404 ルーティングと整合。
  - 認証／マーケ／ダッシュボードに共通レイアウト（例: DashboardLayout）を導入し、ヘッダ／サイドバーなどを集約。
  - 認証必須ページのアクセス制御（ガード）を 1 箇所に集約。
- **認証／状態管理**
  - `useAuth` 内部ロジックをサービス層に切り出し、テスト容易性を確保。
  - Firebase セッション情報とクライアントユーザー型を `shared/types.ts` で定義・共有し、ローディング／エラー状態を明示的に扱う。
  - ThemeContext を唯一のテーマ管理ポイントとし、散在するテーマロジックを排除。
- **UI キット整理**
  - `src/components/ui/index.ts` を作成し shadcn コンポーネントをバレルエクスポート。
  - 既存コードのインポートを原則 `@/components/ui` に統一。
  - 未使用 UI コンポーネントを検索し、削除または TODO 管理。
- **データ／API 境界整備**
  - `server/routers.ts` を機能単位で分割していない場合は分割し、各ルータの入出力スキーマを整理。
  - `src/lib/trpc.ts` から TRPC 型が正しく推論されるようエクスポート構成を見直す。
  - axios/fetch など TRPC を経由しない呼び出しは原則 TRPC 化、困難な場合は例外として明示。
- **ビルド・運用まわり**
  - `.gitignore` を見直し、少なくとも `dist/`, `.env`, Firebase 認証 JSON、ローカルキャッシュ（`.turbo`, `.next/cache` 等）を除外。
  - 既にコミットされている `dist/` があれば削除し、デプロイ影響を確認。
  - README に開発／本番起動コマンド、必須環境変数（キー名のみ）、Drizzle マイグレーション運用、TRPC / Firebase 変更時の注意を追記。

## 7. 非機能要件
- `pnpm lint`, `pnpm check`, `pnpm test` が全て成功すること。
- 主要ページ（サインイン／サインアップ／ダッシュボード／companies 詳細／research 詳細／404）がビルド後も正常表示。
- 既存 DB スキーマおよび本番データを破壊しないこと。変更はマイグレーションで管理し、破壊的変更の有無を明示。

## 8. 実施順序（推奨）
1) ビルド／シークレット衛生対応（`.gitignore`、`dist/` 方針）
2) エントリポイント／レイアウト統合（`_app.tsx` 集約、`src/App.tsx` 決定、404 統合）
3) UI キット整理（バレルエクスポート、インポート統一、未使用整理）
4) 認証／状態管理整理（auth サービス化、共有型定義、テーマ集約）
5) API／データ境界の整理（TRPC ルータ構造と型整合、例外整理）
6) DB マイグレーションフロー確立（`pnpm db:push` で生成、`drizzle/migrations/` 管理）
7) ドキュメント整備（README 更新、開発者向け注意事項明文化）

## 9. 受け入れ条件
- `pnpm lint`, `pnpm check`, `pnpm test` が全て成功。
- ローカル動作確認: サインイン／サインアップ → ダッシュボード遷移、companies 一覧・詳細、research 関連ページ、テーマ切替、存在しないページで統一 404。
- `drizzle/migrations/` が空でなく、DB スキーマと整合。
- README にセットアップ〜起動手順、環境変数キー一覧、マイグレーション手順、TRPC/Firebase 変更時の注意が明記。

## 10. 制約・リスク・留意事項
- 認証・セッションはクライアント／サーバー双方にまたがるため、片側のみの変更で整合性を崩さないよう注意。
- TRPC ルータ再構成時にエクスポート名が変わるとクライアント型推論が崩れるリスクがある。
- shadcn UI は CSS 副作用 import に依存するため、バレル導入時にスタイルが失われないよう確認。
- `dist/` 削除がデプロイ手順に影響しないか事前確認。
- Firebase / OpenAI / AWS など秘密鍵を誤コミットしないよう厳重に管理。
