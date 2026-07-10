# 時間マスター Android実機再確認チェックリスト

対象: debug APK、Google公式テスト広告ID

- [ ] アプリがクラッシュせず起動する
- [ ] アプリ情報に「広告・同意デバッグ情報」が表示される
- [ ] Build typeが`debug`
- [ ] AdMob modeが`test`
- [ ] AdMob App ID設定済みが`true`
- [ ] Banner ID設定済みが`true`
- [ ] MobileAds initializedが`true`
- [ ] 開始前画面でGoogleのテストバナーが画面下部に表示される
- [ ] 開始ボタンと広告の間に十分な余白がある
- [ ] 計測開始直後に広告が完全に消える
- [ ] 計測中に時間、進捗、広告アニメーションが表示されない
- [ ] 終了後の結果画面でテストバナーが再表示される
- [ ] 広告読み込み失敗時もゲーム操作を継続できる
- [ ] プライバシー設定でUMPフォームまたは理由メッセージが必ず表示される
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
