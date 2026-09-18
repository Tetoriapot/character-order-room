# キャラクター発注室

キャラクターの設定を選んで、日本語・英語のイラスト用プロンプトを作るブラウザツールです。設定メモからの推測はルールベースで動き、外部AI APIやサーバーは不要です。

## GitHub Pagesで公開

1. このプロジェクトをGitHubリポジトリへpushします（`main`または`master`をデフォルトブランチにしてください）。
2. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にします。
3. **Actions → Deploy GitHub Pages → Run workflow** を実行します。その後はデフォルトブランチへのpushでテスト・ビルド・公開が自動実行されます。
4. 完了後の公開URLはActionsの実行結果、またはSettings → Pagesに表示されます。

`Tetoriapot/character-order-room`の場合、通常の公開URLは `https://tetoriapot.github.io/character-order-room/` です。公開が成功するまではアクセスできません。

リポジトリ名に対応したパスはGitHub Pagesの設定から自動取得します。ユーザーサイト（`Tetoriapot.github.io`）や独自ドメインでもパスの手動書き換えは不要です。追加のAPIキーやデプロイトークンは不要です。

### 検索への掲載について

GitHub Pages版にもHTMLの`noindex`等を設定しています。検索エンジンがその設定を読めるよう、`robots.txt`はクロールを許可します。GitHub Pagesではこのアプリ独自の`X-Robots-Tag`レスポンスヘッダーは設定できないため、HTMLのmetaタグを使用します。

検索非掲載はアクセス制限ではありません。URLを知っている人は利用でき、公開リポジトリのソースコードはGitHubで閲覧・検索できます。すでに検索に出ているページは、検索エンジンの再クロールまで残る場合があります。

### 保存データを既存サイトから移す場合

保存内容はブラウザのlocalStorageにあり、異なるドメインへは自動移行されません。既存サイトでJSONを書き出し、GitHub Pages版で読み込んでください。以前のサイトのデータは削除されません。

## 入力の保存・バックアップ・共有

- フォーム、設定メモの下書き、推測候補の採用・ロック・代替候補、表示設定は自動保存されます。画面上に保存状態を表示し、保存エラーや別タブとの競合は警告します。
- **完全バックアップ**は、現在の入力・プリセット・編集履歴・生成履歴・お気に入り・表示設定・メモ下書きをまとめたJSONです。別端末でも読み込めます。クラウド同期ではないため、重要な設定は定期的にファイルで保存してください。
- JSONは選択しただけでは反映しません。置き換え対象とフォームの差分を確認して読み込みます。読込直前の作業全体を1世代保管し、**保存・読込 → 読込前の状態に戻す**から復元できます。容量不足などで退避できなければ読み込みを中止します。従来のJSONも読めますが、その形式に含まれないメモ・履歴等は移行できません。
- **共有リンク**は内容を事前確認し、自由入力を項目ごとに選んで含められます。初期状態では自由入力を含めず、メモ下書き・履歴・プリセット・ロック・ギャップの変更履歴も共有しません。リンクを開いた側も、変更前後を確認してからフォームに読み込みます。
- 共有内容はURLのフラグメント（`#state=...`）に格納され、通常のHTTPリクエストには含まれません。ただし暗号化やアクセス制限ではありません。URLを知る人は読めるため、秘密情報を含めないでください。共有済みリンクは編集・失効できません。長い内容には共有用JSONを利用できます。
- 4案生成では、全変更項目の比較表、案ごとの変更前後とプロンプトを確認して採用できます。スマートフォンではプレビューから直前の入力箇所へ戻れます。

ブラウザのデータ削除やプライベートブラウジング終了では保存内容が失われる場合があります。完全バックアップには未公開の設定メモも含まれます。共有用JSONとは分けて取り扱ってください。

## ローカルで動かす

Node.js 24とpnpm 11.19.0を使用します。

```sh
pnpm install --frozen-lockfile
pnpm dev:pages
```

公開用のファイルを作る場合:

```sh
pnpm typecheck
pnpm test
pnpm build:pages
pnpm test:pages
pnpm preview:pages
```

出力先は`dist-pages/`です。ソースではなく、このフォルダーだけを公開します。

リポジトリ配下のURLをローカルで確認する場合（PowerShell）:

```powershell
$env:PAGES_BASE_PATH = '/character-order-room'
pnpm build:pages
pnpm test:pages
pnpm preview:pages
# http://localhost:4173/character-order-room/ を開く
Remove-Item Env:PAGES_BASE_PATH
```

GitHub Pages版は`github-pages/main.tsx`から既存の画面を読み込みます。生成ロジック・設定メモ推測・保存・ヘルプ等の画面コードは共通です。既存のSites版は従来どおり`pnpm dev` / `pnpm build`を使い、設定や公開先を変更していません。

GitHub公開用ソースには、既存サイト固有の`.openai/`、作業メモ、キャッシュ、過去のGit履歴は含めません。GitHub版を継続して更新する場合は、このリポジトリをcloneして編集・pushしてください。

## 参考

- [Vite公式: GitHub Pagesへのデプロイ](https://vite.dev/guide/static-deploy.html#github-pages)
- [GitHub公式: Pagesのカスタムワークフロー](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
