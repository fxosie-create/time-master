# 時間マスター / Time Master

時計を見ずに目標時間を測る、スマホ優先の時間感覚ゲームです。計測には `performance.now()` の開始・終了時刻の差を使い、タイマーやカウントダウンは実行しません。

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
- `components/`: 開始前・計測中・結果・中断の各画面UI
- `lib/`: 時間判定とlocalStorageの処理
- `types/`: 時間マスターの型定義
- `public/icons/`: 差し替えやすいPWA仮アイコン
- `public/sw.js`: 基本的なオフライン起動用サービスワーカー

自己ベストはブラウザの `localStorage` に `time-master-best-records` キーで保存されます。外部API、アカウント、データベースは使用しません。
