# express_chat_app
JavaScriptで作られた簡易掲示板(Webアプリ)です。
CSSフレームワークには「Buluma」を使用しています。

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E.svg?logo=JavaScript&style=flat&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-6DA55F.svg?logo=node.js&style=flat&logoColor=white)

![Image 1](https://yuuronacademy.com/wp-content/uploads/2022/04/app2_1.jpg)

## 環境構築
Node.jsの実行環境を用意した後に、このリポジトリを各自のPCの適切な場所にクローンしてください。
このプロジェクトのフォルダに移動したのち以下コマンドを使用してモジュールをインストールしてください。

```bash
npm install express

npm install crypto

npm install date-utils

npm install ejs

npm install sqlite3
```

またnodemonをインストールしていない場合は以下のコマンドでグローバルインストール可能です。
```bash
npm install --g nodemon
```

次に以下コマンドでデータベースを作成します。
```bash
sqlite3 database.sqlite3
```
データベースのテーブル設計は以下の通りです。
```
sqlite3> create table threads(id INTEGER, thread_id TEXT, thread_name TEXT, com_sum INTEGER, wrote_at NUMRIC, created_at NUMRIC, ip_address TEXT,del_flag NUMRIC DEFAULT 0, PRIMARY KEY(id AUTOINCREMENT))
sqlite3> create table users(id INTEGER, ip_address TEXT, thread_created_date NUMRIC, created_sum INTEGER,last_comment_date NUMRIC, PRIMARY KEY(id AUTOINCREMENT))
```
またテーブル設計のパラメータは以下の通りです

・threads
| id | thread_id | thread_name | com_sum | wrote_at | created_at | ip_address | del_flag |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| プライマリキー | スレッドID | スレッド名 | レス数 | 最終書き込み時刻 | 作成時刻 | 作成者IPアドレス | 削除フラグ |

・users
| id | ip_address | thread_created_date | created_sum | last_comment_date|
| ---- | ---- | ---- | ---- | ----|
| プライマリキー | 作成者IPアドレス | 最終スレッド作成時刻 | スレッド作成回数 | 最終コメント時刻|


## 実行
次のコマンドでサーバを立ち上げ可能です。
```bash
npm start dev
```

上記コマンドを入力したらブラウザで「localhost:3000」にアクセスしてください。
立ち上げたサーバは「ctrl+c」を2回押すことで停止できます。


また、以下のコマンドでスレッドの書き込み回数のリセットができます。
いわゆるバッチ処理です。1日1回起動することを想定しています。

```bash
npm run batch
```


