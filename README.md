# AnimeRec

## 前提

[CHAN-TORU](https://tv.so-net.ne.jp/chan-toru/login) のアカウント設定済み(Googleアカウント連携)

Ubuntu 16.04 / 18.04

サーバとクライアントは同じプライベートネットワークに存在。
外部公開はしない(セキュリティ上および利用規約の問題のため)

## Setup

環境を汚すのでDockerコンテナ内に構築することをおすすめします。
~~検証済み環境: ubuntu:18.04 (docker)~~

1. git clone

	```
	# cd [任意のディレクトリ]
	# git clone https://github.com/eggplant60/AnimeRec.git
	```

1. 日本語環境の入った docker コンテナを build

	```
	# cd AnimeRec/docker
	# docker build -t ubuntu:18.04_ja .
	# ./docker_run.sh
	```

1. 必須パッケージのインストール

	```
	# cp /shared/install.sh ./
	# chmod +x install.sh
	# ./install.sh
	```
	途中でタイムゾーンを聞かれたときは Asia/Tokyo を選択

1. PostgreSQL の設定

	1. PostgreSQL 起動

		```
		# /etc/init.d/postgresql start
		```

	1. DBのユーザ設定

		```
		# cd work/AnimeRec/
		# cp conf/db.json.default conf/db.json
		# vi conf/db.json
		```

		"user" および "password" 任意の値に変更。他の値はそのままで良い。

	1. DBのユーザ作成

		```
		# sudo -u postgres createuser -d -U postgres -P [先程のユーザ]
		Enter password for new role: [先程のパスワード]
		Enter it again: [先程のパスワード]
		```

	1. DB作成

		```
		# cd setup
		# chmod +x 01_create_db.sh
		# ./01_create_db.sh
		Create DB anime_rec in localhost:5432
		Password: [先程のパスワード]
		success!
		```

	1. テーブル作成

		```
		# node 02_create_table.js
		Complete.
		[
		Result {
			command: 'CREATE',
			rowCount: null,
			oid: null,
			rows: [],
			fields: [],
			_parsers: undefined,
			_types: TypeOverrides { _types: [Object], text: {}, binary: {} },
			RowCtor: null,
			rowAsArray: false
		},

		...

		success!
		```

	1. テーブル確認

		```
		# sudo -u postgres psql
		psql (12.2 (Ubuntu 12.2-1.pgdg16.04+1))
		Type "help" for help.

		postgres=# \c anime_rec
		You are now connected to database "anime_rec" as user "postgres".
		anime_rec=# \d
		```

		以下の2つのテーブルが表示されればOK

		```
		            List of relations
		      Name      | Type  | Owner
		----------------+-------+--------
		 program_genres | table | user
 		 programs       | table | user
		(2 rows)
		```

		確認後、`\q` でコンソールを抜ける
		
1. バッチ関連

	1. CHAN-TORU の Cookie をコピー

		Webブラウザで[CHAN-TORU](https://tv.so-net.ne.jp/chan-toru/login)にログイン

		ログイン後、ブラウザの開発者ツール(F12を押すと出る)を使用して
		CHAN-TORU の Cookie を表示させ、コピーしておく

	1. 設定ファイルに貼り付け

		```
		# cp conf/chan_toru.json.default conf/chan_toru.json
		# vi conf/chan_toru.json
		```

		先程の Cookie を JSON の "Cookie" の値に貼り付けて保存


	1. 確認

		```
		# cd ../batch
		# ./batch.sh
		# ./batch.sh
		./batch.sh: line 10: cd: /raid/work/animeRec/batch: No such file or directory
		20200218050000: start
		20200219050000: start
		20200218050000: finish, write
		20200220050000: start
		20200219050000: finish, write
		20200221050000: start
		20200220050000: finish, write
		20200222050000: start
		20200221050000: finish, write
		20200223050000: start
		20200222050000: finish, write
		20200224050000: start
		20200223050000: finish, write
		20200224050000: finish, write
		./json/20200218.json
		./json/20200219.json
		./json/20200220.json
		./json/20200221.json
		./json/20200222.json
		./json/20200223.json
		./json/20200224.json
		success!
		----------------------------------------
		1/264
		2020-02-18 01:47:00+00:00
		2020-02-18 01:49:00+00:00
		＃もしかして…　虐待防止アニメ（1）「大人にたたかれた」[字]
		match, eid = 5318
		event_id is valid 5318
		----------------------------------------
		2/264
		2020-02-18 01:55:00+00:00
		2020-02-18 02:00:00+00:00
		みんなのうた「パプリカ　米津玄師バージョン」「花さかニャンコ」
		match, eid = 1071
		event_id is valid 1071
		----------------------------------------

		...
		```

		ここまで動作することが確認できたら Ctrl-C で停止してOK

	1. CRON登録

		```
		# crontab -e
		```

		以下の一行を追加

		```
		0 9 * * * bash -c "cd /path/to/animeRec/batch/ && ./batch.sh  >> log 2>&1"
		```

1. サーバサイド設定

	1. 起動チェック

		```
		# cd node
		# node app.js
		checkAuthenticated()
		Node.js is listening to localhost:3001
		```
		上記のように表示されればOK

1. フロントエンド設定

	1. IPアドレス指定

		```
		# cd mock/conf
		# cp environment.js.default environment.js
		# vi environment.js
		```

		```JavaScript:environment.js
		angular.module('app')
			.value('express', {
				address: "[NodeサーバのIPアドレス]",  // 127.0.0.1 は NG
				port   : "3001"
			});
		```

	2. 起動確認

		```
		# cd /path/to/AnimeRec
		# ./start.sh
		```
		ブラウザで "http://[IPアドレス]:8080/" にアクセスして番組表が表示されればOK

