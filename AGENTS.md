# Codex作業ルール

## 進捗情報の更新

作業終了時には必ず `.project/app-status.json` を更新すること。

- 修正履歴は記録しない
- `current` は現在の到達点を1〜2文で記録する
- `next` は最優先の1件だけにする
- `nextOwner` を `user` または `codex` で設定する
- テストしていない項目を `done` にしない
- AdMob管理画面やPlay Consoleの状態を推測しない
- ユーザー確認が必要な場合は `waiting_user` にする
- `updatedAt` を日本時間で更新する
- 通常のコード変更と一緒に進捗ファイルもGitへ反映する
