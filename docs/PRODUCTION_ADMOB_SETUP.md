# 時間マスター 本番AdMob・Play公開準備

最終更新: 2026-07-12

この文書は、debugで確認済みのGoogle公式テスト広告とUMP処理を維持したまま、本番releaseへ移行するための手順です。本番ID、署名鍵、パスワードはリポジトリへ保存しません。

## 現在の安全設計

- debugはGoogle公式テスト用アプリIDとバナー広告ユニットIDを常に使用します。
- releaseは本番アプリIDと本番バナーIDの両方が設定された場合だけ `ADS_ENABLED=true` になります。
- 片方でも未設定ならreleaseの広告SDKを初期化しません。
- 開始前・結果画面だけ広告対象で、計測中・中断・アプリ情報・UMP画面では非表示です。
- UMPと広告表示制御の実装変更は、本番ID設定作業には不要です。

## 2026-07-12 設定・生成結果

- AdMobアプリ登録、本番アプリID、本番バナーID、publisher IDの取得: 完了
- `C:\Users\osie6\.gradle\gradle.properties` への2種類の本番ID設定: 完了
- debug生成設定: Google公式テストIDのみ、本番publisher番号なし
- release生成設定: 本番IDのみ、Google公式テストpublisher番号なし
- 本番ID未設定時の生成テスト: `ADS_ENABLED=false` を確認後、本番設定へ復元済み
- debug/release ManifestのアプリID切り替え: 確認済み
- バナーIDのvariant別BuildConfig反映: 確認済み
- debug APK、未署名release APK、未署名release AAB: 生成成功
- 署名鍵・署名設定: 未作成、未設定
- release実機での本番広告・本番UMP確認: 未実施

## 1. AdMobで取得する値

1. AdMobでAndroidアプリを追加します。
2. パッケージ名へ `com.ymrlab.timemaster` を指定します。
3. 発行されたAdMobアプリIDを控えます。形式は `ca-app-pub-...~...` です。
4. アンカー型アダプティブバナー用の広告ユニットを1つ作成します。
5. 発行されたバナー広告ユニットIDを控えます。形式は `ca-app-pub-.../...` です。

アプリIDと広告ユニットIDを取り違えないでください。公式設定手順: [Set up Google Mobile Ads SDK](https://developers.google.com/admob/android/quick-start)

## 2. 本番IDの入力場所

推奨場所は、リポジトリ外の次のファイルです。

```text
C:\Users\osie6\.gradle\gradle.properties
```

次の2行を追加します。引用符は付けません。

```properties
TIME_MASTER_ADMOB_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
TIME_MASTER_ADMOB_BANNER_AD_UNIT_ID=ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ
```

読み込み先は `android/app/build.gradle` の `TIME_MASTER_ADMOB_APP_ID` と `TIME_MASTER_ADMOB_BANNER_AD_UNIT_ID` です。環境変数でも同じ名前を利用できますが、ユーザーGradle設定へまとめる方法を推奨します。

次の場所には入力しません。

- `android/gradle.properties`
- `.env`、`.env.local`
- `AndroidManifest.xml`
- `build.gradle`への実値直書き
- GitHub、Vercel環境変数

## 3. 本番UMPメッセージ

1. AdMobの「プライバシーとメッセージ」を開きます。
2. 時間マスターを対象に欧州規制メッセージを作成・公開します。
3. 配信地域、同意選択肢、プライバシーポリシーURLを確認します。
4. release候補を実機へ入れ、初回フォームとアプリ情報からの再表示を確認します。

debugでPublisher Test Adsフォームと再表示は確認済みですが、本番メッセージの公開確認とは別です。AdMobが提供するメッセージ種別: [Available user message types](https://support.google.com/admob/answer/10114020)

## 4. app-ads.txt

AdMobのpublisher IDは、アプリIDや広告ユニットIDとは別の `pub-...` です。AdMobの「設定 > アカウント」、または「アプリ > すべてのアプリを表示 > app-ads.txt > app-ads.txtの設定方法」から確認・コピーします。

時間マスターで確認済みのpublisher IDは `pub-7486115105644729` です。

公開内容の基本形:

```text
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

手順:

1. `docs/app-ads.txt.example` のpublisher IDを実値へ置き換えます。
2. 時間マスターのVercel URLではなく、YMR Labサイト側へ公開します。
3. `https://www.ymrlab.com/app-ads.txt` を直接開けるようにします。
4. `https://ymrlab.com/app-ads.txt` でも取得できるか、有効な転送で同じ内容へ到達することを確認します。
5. Google Playの開発者ウェブサイトを `https://www.ymrlab.com/` に設定します。
6. Play掲載後、AdMobのクロールと検証完了を待ちます。

AdMobはPlay掲載の開発者ウェブサイトのホスト名を基準にルートのapp-ads.txtを探し、`www.`を除外して探索する場合があります。公式手順: [Set up an app-ads.txt file](https://support.google.com/admob/answer/9363762)

2026-07-11現在、apex側はwww側へHTTP 308転送され、`https://www.ymrlab.com/app-ads.txt` はHTTP 404です。

## 5. プライバシーポリシー

公開候補URL:

```text
https://www.ymrlab.com/ja/privacy/time-master
```

最低限、次を記載します。

- 運営者名と問い合わせ先 `contact@ymrlab.com`
- ゲーム結果・自己ベストは端末内localStorageだけに保存すること
- アカウント、外部DB、独自分析APIを使用しないこと
- Google Mobile Ads SDKとUMPを利用すること
- IPアドレス、アプリ操作、診断情報、デバイスまたは広告関連IDがGoogleにより処理され得ること
- 利用目的（広告配信、分析、不正防止・セキュリティ）
- UMPでの同意と、アプリ情報からプライバシー設定を再表示できること
- Googleのプライバシーポリシー等、第三者サービスへのリンク
- 端末データはアプリのストレージ消去またはアンインストールで削除できること
- データ保持、セキュリティ、子どもの利用方針、改定日

Play Consoleへ登録するURLとアプリ内リンクは同じ公開ページにし、ログイン不要・公開アクセス可能・HTTP 200であることを確認します。2026-07-11現在、このURLはHTTP 404です。

## 6. Data Safety回答案

`PLAY_DATA_SAFETY_DRAFT.md`を使用します。本番AdMobを含むため「ユーザーデータを収集または共有する」は「はい」を前提とします。

- データの具体例: IPアドレス
- Playのデータ種類: おおよその位置情報、アプリでの操作、診断情報、デバイスまたはその他のID
- 目的: 広告、分析、不正防止、セキュリティ
- 転送中の暗号化: **はい**。Google Mobile Ads SDKが扱うユーザーデータはTLSで暗号化されます。
- localStorageの自己ベスト: **外部送信なし**。端末内保存であり、AdMob/UMP SDKが処理するデータとは分けます。
- UMP: 同意画面が表示されても、Data Safetyを「収集なし」にはしません。

これは回答案です。Play Consoleへ入力する直前に、提出するrelease版へ実際に導入されている全SDKと実装内容を確認して最終回答を確定します。

Google Mobile Ads SDK 25.4.0の公式開示: [Google Play data disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure)

## 7. 署名済みAABの前に止まる位置

次がそろうまで署名鍵を作成せず、AABをPlayへアップロードしません。

1. 本番AdMobアプリ登録と2種類のID取得
2. 本番UMPメッセージ公開
3. プライバシーポリシー公開
4. app-ads.txt公開とPlay開発者ウェブサイト決定
5. Data Safety、広告あり、対象年齢の回答確定
6. release実機テストの準備
7. 既存アップロード鍵がないことの確認

その後、アップロード鍵を安全に作成または確認し、署名情報をリポジトリ外へ設定してAABを生成します。新しい個人デベロッパーアカウントに該当する場合は、12人以上が14日間連続でオプトインするクローズドテスト条件をPlay Consoleで確認します。公式情報: [App testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465)
