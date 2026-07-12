# 時間マスター Google Play 公開前チェックリスト

最終更新: 2026-07-12

この文書は `com.ymrlab.timemaster` を同じ時間マスターのAndroid版として公開するための確認表です。

## 実装済み

- [x] Capacitor 8によるAndroidプロジェクト
- [x] パッケージ名 `com.ymrlab.timemaster`
- [x] `minSdk 24`、`compileSdk 36`、`targetSdk 36`
- [x] 縦画面固定、オフラインWebアセット同梱、不要な端末権限なし
- [x] 正式ロゴを通常・丸型・アダプティブアイコンへ反映
- [x] Google Mobile Ads SDK `25.4.0`
- [x] UMP SDK `4.0.0`
- [x] 開始前と結果画面だけにアンカー型アダプティブバナーを要求
- [x] 計測中・中断・アプリ情報・同意画面では広告を非表示
- [x] 広告取得失敗時は余白を残さずゲームを継続
- [x] debugはGoogle公式テストIDのみを使用
- [x] releaseは本番IDが2つそろわない限り広告SDKを初期化しない
- [x] releaseはUMP更新後かつ `canRequestAds()` がtrueのときだけ広告SDKを初期化
- [x] debugのネイティブ単体診断だけは、公式テスト広告に限りUMP gateと分離可能
- [x] Android戻る操作とバックグラウンド移動による計測中断
- [x] debug APK、未署名release APK、未署名AABの生成確認

Google Playの新規アプリはAPI 35以上が必要です。現在はAPI 36なので条件を満たします。公式情報: [Target API level requirements](https://support.google.com/googleplay/android-developer/answer/11926878)

## debug実機確認済み（2026-07-11）

- [x] 起動時にUMPの「Publisher Test Ads」同意画面が表示される
- [x] `Consent`後にゲームへ戻れる
- [x] 開始前画面でGoogle公式テストバナーが表示される
- [x] 計測中画面では広告が完全に非表示になる
- [x] 結果画面でGoogle公式テストバナーが表示される
- [x] アプリ情報画面が開く
- [x] 「プライバシー設定」からUMP Consent画面を再表示できる
- [x] フォーム終了後に成功メッセージが表示される

これはdebug APKとGoogle公式テストIDの確認結果です。本番IDを設定したrelease版、署名済みAAB、Play配布版の確認を兼ねません。

## PCの環境変数

Android StudioとAndroid SDKは検出済みです。通常のPowerShellでも使えるように、Windowsの「環境変数」で次を設定してください。

```text
JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
ANDROID_HOME=C:\Users\osie6\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=C:\Users\osie6\AppData\Local\Android\Sdk
```

`Path`には `%JAVA_HOME%\bin`、`%ANDROID_HOME%\platform-tools`、`%ANDROID_HOME%\cmdline-tools\latest\bin` を追加します。2026-07-12にユーザー環境変数へ設定済みで、`lintRelease` を含むAndroidビルドを再実行して成功しました。開いているPowerShellには即時反映されないため、新しいPowerShellで `java -version` と `adb version` を確認します。

## AdMob本番設定

詳細手順: [`PRODUCTION_ADMOB_SETUP.md`](PRODUCTION_ADMOB_SETUP.md)

- [x] AdMobでパッケージ名 `com.ymrlab.timemaster` のAndroidアプリを登録
- [x] アンカー型アダプティブバナー用の広告ユニットを1つ作成
- [x] `%USERPROFILE%\.gradle\gradle.properties` に次の2設定を追加

```properties
TIME_MASTER_ADMOB_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
TIME_MASTER_ADMOB_BANNER_AD_UNIT_ID=ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ
```

設定場所はリポジトリ外のユーザーGradle設定です。アプリIDまたは広告ユニットIDのどちらかが空なら、release版の広告は無効です。

- [x] debug APKでGoogleのテスト広告だけが出ることを実機確認
- [ ] 実機でUMPを強制テストする場合、ログに表示されたハッシュを同じファイルへ追加

```properties
TIME_MASTER_UMP_TEST_DEVICE_HASHED_ID=YOUR_TEST_DEVICE_HASH
```

- [ ] Ad Inspectorを使う場合もdebug版だけで確認

## 本番ID設定・variant生成確認済み（2026-07-12）

- [x] debugの `ADS_ENABLED=true`
- [x] debugのアプリIDとバナーIDはGoogle公式テストID
- [x] debug生成設定に本番publisher番号が含まれない
- [x] releaseの `ADS_ENABLED=true`
- [x] 本番IDを空で上書きした生成テストではreleaseの `ADS_ENABLED=false`
- [x] releaseのアプリIDとバナーIDはユーザーGradle設定から取得した本番ID
- [x] release生成設定にGoogle公式テストpublisher番号が含まれない
- [x] debug Manifestの `APPLICATION_ID` はGoogle公式テスト用アプリIDへ解決
- [x] release Manifestの `APPLICATION_ID` は本番AdMobアプリIDへ解決
- [x] バナーIDはvariant別の `BuildConfig.ADMOB_BANNER_AD_UNIT_ID` へ正しく反映
- [x] debug APK、未署名release APK、未署名release AABを再生成
- [x] release APKの署名検証はfalse、AABの署名エントリは0件で、意図どおり未署名
- [ ] 本番広告・本番UMPのrelease実機確認

## UMP / プライバシー

- [ ] AdMobの「プライバシーとメッセージ」で欧州規制メッセージを作成・公開
- [x] debug強制EEAで初回同意フォームが表示されることを実機確認
- [x] debugでアプリ情報の「プライバシー設定」から再表示できることを確認
- [ ] 本番用メッセージ公開後、release版で対象地域の表示と再表示を確認
- [ ] 同意拒否・取得失敗・オフラインでもゲーム本体が動くことを確認
- [ ] `https://www.ymrlab.com/ja/privacy/time-master` に時間マスター用ポリシーを公開

2026-07-11時点で上記プライバシーURLはHTTP 404です。Play申請前に必ず公開し、200応答を確認してください。

## app-ads.txt

- [x] AdMobでpublisher ID `pub-7486115105644729` を確認
- [x] `docs/app-ads.txt.example` を実際のpublisher IDへ更新
- [ ] 別プロジェクトであるYMR Labサイトのルートへ `app-ads.txt` を公開
- [ ] `https://www.ymrlab.com/app-ads.txt` がリダイレクトなし・HTTP 200・プレーンテキストで取得できることを確認
- [ ] AdMobクローラー向けに `https://ymrlab.com/app-ads.txt` でも取得できるか、有効な転送先へ到達できることを確認
- [ ] Playストア掲載情報の開発者ウェブサイトに `https://www.ymrlab.com` を設定
- [ ] AdMob管理画面でapp-ads.txtの検証完了を確認

2026-07-11時点で両app-ads.txt URLは未公開です。`https://ymrlab.com/app-ads.txt` はwww側へHTTP 308転送され、その転送先 `https://www.ymrlab.com/app-ads.txt` はHTTP 404でした。このリポジトリから別ドメインへは公開していません。

## 署名済みAAB作成前のゲート

- [x] AdMobへ時間マスターをAndroidアプリとして登録し、本番アプリIDを取得
- [x] 本番バナー広告ユニットを作成し、ユニットIDを取得
- [ ] AdMobの「プライバシーとメッセージ」で本番用メッセージを作成・公開
- [ ] YMR Labへプライバシーポリシーを公開し、HTTP 200を確認
- [ ] YMR Labルートへapp-ads.txtを公開し、Playの開発者ウェブサイトを `https://www.ymrlab.com/` に設定
- [x] 本番IDをリポジトリ外のユーザーGradle設定へ入力
- [x] release生成設定で `ADS_ENABLED=true` と本番IDの反映を確認
- [ ] release実機で本番UMPと画面別広告制御を確認
- [ ] 既存アップロード鍵の有無を確認し、新規作成が必要か判断
- [ ] Data Safety、広告あり、対象年齢、コンテンツレーティングの回答を確定

これらが完了するまで、署名鍵の新規作成、署名済みAAB生成、Play Consoleへのアップロードへ進みません。

## 署名と成果物

- [ ] 既存のアップロード鍵がないことをPlay Consoleで確認
- [ ] 新規の場合だけ、リポジトリ外にアップロード鍵を作成

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
  -keystore "$env:USERPROFILE\time-master-upload.jks" `
  -alias time-master-upload -keyalg RSA -keysize 2048 -validity 10000
```

- [ ] 鍵とパスワードをパスワード管理ツールと安全なバックアップ先へ保存
- [ ] `%USERPROFILE%\.gradle\gradle.properties` に署名情報を追加

```properties
TIME_MASTER_UPLOAD_STORE_FILE=C:/Users/osie6/time-master-upload.jks
TIME_MASTER_UPLOAD_STORE_PASSWORD=YOUR_STORE_PASSWORD
TIME_MASTER_UPLOAD_KEY_ALIAS=time-master-upload
TIME_MASTER_UPLOAD_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

- [ ] `npm run android:aab` を実行
- [ ] `jarsigner -verify android/app/build/outputs/bundle/release/app-release.aab` で署名を確認
- [ ] Play App Signingを有効にして、署名済みAABをアップロード

鍵・パスワード・本番AdMob IDはソースコード、`.env`、GitHubへ保存しません。

## Play Console入力

- [ ] アプリ名、短い説明、詳しい説明
- [ ] アプリアイコン、フィーチャーグラフィック、スマホ画面のスクリーンショット
- [ ] カテゴリを実際の掲載方針に合わせて選択
- [ ] 広告ありを申告
- [ ] 対象年齢を設定。子どもを対象に含める場合はFamilies向け広告要件を別途満たす
- [ ] コンテンツレーティング質問票
- [ ] `docs/PLAY_DATA_SAFETY_DRAFT.md` を最終SDK構成と照合してData Safetyを入力
- [ ] AdMob SDK由来のデータは「収集または共有あり」と回答
- [ ] IPアドレス、おおよその位置情報、アプリでの操作、診断情報、デバイスまたはその他のIDを確認
- [ ] 利用目的に広告、分析、不正防止、セキュリティを含める
- [ ] AdMob SDK由来のデータはTLSで暗号化されるため「転送中の暗号化：はい」と回答
- [ ] localStorageの自己ベストは端末内保存・外部送信なしとしてAdMob/UMP由来データと分離
- [ ] UMP同意画面の表示だけを理由にData Safetyを「収集なし」にしない
- [ ] 提出するrelease版の全SDKと実装内容を再確認して最終回答を確定
- [ ] プライバシーポリシーURLを登録
- [ ] `contact@ymrlab.com` が正式に受信可能か確認してから連絡先へ登録
- [ ] 国・地域、無料/有料設定を確認

個人デベロッパーアカウントを2023-11-13以降に作成した場合、12人以上が14日間連続でオプトインするクローズドテスト後に本番アクセス申請が必要です。アカウント条件はPlay Consoleのダッシュボードで最終確認します。公式情報: [App testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465)

## 実機・申請直前テスト

詳細なdebug実機確認は `docs/ANDROID_DEVICE_TEST_CHECKLIST.md`、Logcat手順は `docs/ANDROID_LOGCAT_GUIDE.md` を使用します。

- [ ] Android Studioでdebug APKを実機またはエミュレーターへインストール
- [ ] 10秒・30秒・1分・5分を各1回計測
- [ ] 計測中に時間・広告・時間推測可能な動きが出ない
- [ ] 10種類から開始ごとに1つだけ選ばれ、計測中は固定
- [ ] 開始前・結果だけテストバナーが表示される
- [ ] 広告失敗時に大きな空白が残らない
- [ ] UMP同意前に広告リクエストが送信されない
- [ ] バックグラウンド移動・画面ロック・Android戻るで計測が中断される
- [ ] アプリ情報、プライバシーポリシー、プライバシー設定、メールリンクが動く
- [ ] オフライン起動、自己ベスト保存、再起動後の保持
- [ ] 360dp幅で横スクロールやボタン重なりがない
- [ ] Logcatにクラッシュ、WebView、AdMob、UMPの未処理エラーがない
- [ ] 署名済みrelease版でも同じ項目を再確認

## ビルドコマンド

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run android:sync
.\android\gradlew.bat -p android testDebugUnitTest lintDebug assembleDebug bundleRelease assembleRelease
```

生成先:

- debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- release APK: `android/app/build/outputs/apk/release/app-release-unsigned.apk`（署名未設定時）
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`（署名未設定時は未署名）
