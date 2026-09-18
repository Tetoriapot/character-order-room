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
