# 時間マスター Android実機再確認チェックリスト

対象: debug APK、Google公式テスト広告ID

## 2026-07-11 実機確認済み（ユーザー報告）

- [x] アプリがクラッシュせず起動する
- [x] 起動時にUMPの「Publisher Test Ads」同意画面が表示される
- [x] `Consent`を押すとアプリへ戻れる
- [x] 開始前画面でGoogle公式テストバナーが表示される
- [x] 計測中画面では広告が表示されない
- [x] 結果画面でGoogle公式テストバナーが表示される
- [x] アプリ情報画面が開く
- [x] 「プライバシー設定」からUMPのConsent画面を再表示できる
- [x] フォーム終了後に「プライバシー設定を表示しました」と表示される

上記により、debug APKのAdMobテスト広告、UMP初回同意、プライバシー設定の再表示、画面別広告制御は実機確認済みです。

## 未確認または報告値未取得

以下は今回の実機報告には含まれていないため、完了扱いにしません。

- [ ] アプリ情報に「広告・同意デバッグ情報」が表示される
- [ ] Build typeが`debug`
- [ ] Android buildが`1.0.1 (2)`
- [ ] AdMob modeが`test`
- [ ] AdMob App ID設定済みが`true`
- [ ] Banner ID設定済みが`true`
- [ ] MobileAds initializedが`true`
- [ ] Native bridge statusが`connected`
- [ ] 「テスト広告を再読み込み」でWeb画面状態と無関係に公式テストバナーを要求できる
- [ ] 開始ボタンと広告の間に十分な余白がある
- [ ] 計測中に時間、進捗、広告アニメーションが表示されない
- [ ] 広告読み込み失敗時もゲーム操作を継続できる
- [ ] debug同意状態リセット後にUMP状態が更新される
- [ ] 10秒・30秒・1分・5分を開始・終了できる
- [ ] 自己ベストが保存され、再起動後も残る
- [ ] バックグラウンド移動で計測が中断される
- [ ] 360dp幅で横スクロール・重なりがない
- [ ] Logcatに未処理例外がなく、広告/UMPの成功または失敗理由を確認できる

## 報告時に控える値

- Consent status:
- canRequestAds:
- Privacy options required:
- Last ad event:
- Last ad error code:
- Last ad error message:
- Last UMP error:
- 使用端末とAndroidバージョン:
