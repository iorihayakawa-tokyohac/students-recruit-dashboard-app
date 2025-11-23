# Firebase 環境構築ガイド

このドキュメントでは、本プロジェクトで Firebase を利用するために必要な Firebase コンソール上での設定手順について説明します。

## 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセスします。
2. 「プロジェクトを追加」をクリックします。
3. プロジェクト名を入力し（例: `recruit-dashboard`）、「続行」をクリックします。
4. Google アナリティクスの設定（任意）を行い、「プロジェクトを作成」をクリックします。
5. プロジェクトの準備ができたら「続行」をクリックします。

## 2. Web アプリの登録と設定情報の取得

1. プロジェクトの概要ページで、iOS / Android / Web アイコンが並んでいる場所から「Web（`</>` アイコン）」をクリックします。
2. アプリのニックネームを入力します（例: `Recruit Dashboard Web`）。
3. 「Firebase Hosting も設定します」は、現時点で Hosting を利用しない場合はチェック不要です。
4. 「アプリを登録」をクリックします。
5. `firebaseConfig` オブジェクトが表示されます。この中の情報を `.env` ファイルに設定します。

### 環境変数の設定 (.env)

プロジェクトのルートディレクトリにある `.env` ファイル（なければ作成）に以下の形式で記述します。

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 3. Authentication (認証) の設定

ユーザー認証機能を利用する場合の設定です。

1. 左側のメニューから「構築」>「Authentication」を選択します。
2. 「始める」をクリックします。
3. 「ログイン方法」タブで、利用したいプロバイダを選択します。
    *   **メール / パスワード**: 「有効にする」をオンにして保存します。
    *   **Google**: 「有効にする」をオンにし、プロジェクトのサポートメールアドレスを選択して保存します。

## 4. Firestore Database (データベース) の設定

NoSQL データベースを利用する場合の設定です。

1. 左側のメニューから「構築」>「Firestore Database」を選択します。
2. 「データベースの作成」をクリックします。
3. ロケーションを選択します（例: 日本の場合は `asia-northeast1` (Tokyo) が推奨されます）。
4. セキュリティルールの初期設定を選択します。
    *   **テストモード**: 開発中は便利ですが、誰でも読み書き可能になるため、本番公開前には必ずルールを変更してください。
    *   **本番環境モード**: デフォルトで全てのアクセスを拒否します。適切なルール設定が必要です。
5. 「有効にする」をクリックします。

## 5. Storage (ストレージ) の設定

画像やファイルアップロード機能を利用する場合の設定です。

1. 左側のメニューから「構築」>「Storage」を選択します。
2. 「始める」をクリックします。
3. セキュリティルールの設定（Firestoreと同様、テストモードか本番モードか選択）を行い、「次へ」をクリックします。
4. ロケーションを選択（Firestoreと同じ場所が推奨されます）し、「完了」をクリックします。

## 6. セキュリティルールの設定例

開発段階での簡易的なセキュリティルールの例です。**本番環境ではより厳格なルールを設定してください。**

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // 認証済みユーザーのみ読み書き許可
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage Security Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // 認証済みユーザーのみ読み書き許可
      allow read, write: if request.auth != null;
    }
  }
}
```
