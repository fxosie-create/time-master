# 時間マスター Android Logcat確認手順

## 1. debug APKをインストール

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$adb = "$env:ANDROID_HOME\platform-tools\adb.exe"

& $adb devices -l
& $adb install -r "android\app\build\outputs\apk\debug\app-debug.apk"
```

## 2. 時間マスターのログだけを表示

```powershell
& $adb logcat -c
& $adb logcat -v time "TimeMasterAds:I" "TimeMasterUMP:I" "TimeMasterApp:I" "TimeMasterBridge:I" "*:S"
```

Android Studioの場合はLogcatを開き、検索欄へ次を入力します。

```text
tag:TimeMasterAds | tag:TimeMasterUMP | tag:TimeMasterApp | tag:TimeMasterBridge
```

## 3. 起動時に確認する順番

1. `TimeMasterApp`: アプリ起動
2. `TimeMasterAds`: バナーコンテナを画面下部へ追加
3. `TimeMasterUMP`: UMP同意情報更新開始
4. `TimeMasterUMP`: 更新成功または更新失敗
5. `TimeMasterUMP`: `canRequestAds` と `privacyOptionsRequirementStatus`
6. debugでUMPが利用できない場合は「debug公式テスト広告のためフォールバック」
7. `TimeMasterAds`: MobileAds初期化開始・完了
8. `TimeMasterBridge`: WebViewからshowBannerを受信
9. `TimeMasterAds`: バナー広告ロード開始・成功

広告が出ない場合は、`バナー広告ロード失敗 code=... message=...` をそのまま控えてください。

## 4. 画面遷移ログ

- 開始前: `画面遷移時の広告表示対象=true`
- 計測開始: `WebViewからhideBannerを受信`、`広告表示対象=false`、`広告非表示処理`
- 結果表示: `WebViewからshowBannerを受信`、`広告表示対象=true`

## 5. UMPテスト端末ハッシュ

debug版は端末のテストデバイスハッシュを算出して`TimeMasterUMP`ログとアプリ内診断情報に表示し、EEA強制設定へ使用します。Google UMP SDKが別の設定例をLogcatへ出した場合は、その値を優先してリポジトリ外の `%USERPROFILE%\.gradle\gradle.properties` へ設定します。

```properties
TIME_MASTER_UMP_TEST_DEVICE_HASHED_ID=LOGCATに表示されたハッシュ
```

設定後に `npm run android:apk:debug` でAPKを再生成します。本番IDや署名鍵はまだ設定しません。
