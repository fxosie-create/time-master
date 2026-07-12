# 時間マスター / Time Master

時計を見ずに目標時間を測る、スマホ優先の時間感覚ゲームです。開始前の3秒カウントダウンは `performance.now()` 基準で表示し、終了後に取得した新しい開始時刻と終了時刻の差だけを計測結果に使います。計測中は時間更新処理を実行しません。

## 起動方法

```bash
npm install
npm run dev
```

`http://localhost:3000` を開きます。

## コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 構成

- `app/`: Next.jsのページ、メタデータ、共通スタイル
- `components/`: 開始前・カウントダウン・計測中・結果・中断の各画面UI
- `lib/`: 時間判定とlocalStorageの処理
- `types/`: 時間マスターの型定義
- `public/icons/`: PWA用の正式アイコン
- `public/sw.js`: 基本的なオフライン起動用サービスワーカー
- `android/`: Capacitor AndroidアプリとネイティブAdMob/UMP実装
- `resources/`: Androidアイコン再生成用の正式ロゴ原本
- `docs/`: Google Play公開、Data Safety、app-ads.txtの準備資料

自己ベストはブラウザの `localStorage` に `time-master-best-records` キーで保存され、外部送信されません。外部API、アカウント、データベースは使用しません。Android releaseで使用するGoogle Mobile Ads SDK / UMPのデータ処理はこの端末内データとは別で、AdMob SDKが収集・共有するユーザーデータはTLSで転送中に暗号化されます。

## Android

Android版はゲームの静的出力を端末内へ同梱します。Web版には広告SDKを読み込まず、Android版だけがネイティブAdMob/UMPを使用します。

```powershell
npm run android:sync
npm run android:apk:debug
npm run android:aab
```

公開前の設定と署名手順は [Google Play 公開前チェックリスト](docs/PLAY_STORE_RELEASE_CHECKLIST.md) を参照してください。
