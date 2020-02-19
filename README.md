# AnimeRec

## 前提

[CHAN-TORU](https://tv.so-net.ne.jp/chan-toru/login) のアカウント設定済み(Googleアカウント連携)

サーバとクライアントは同じプライベートネットワークに存在する
外部公開はしない(セキュリティ上および利用規約の問題のため)

## 検証済みホスト環境

- Ubuntu 16.04
- Docker 19.03.5
- git および jq をインストール済みであること

## Setup

~~環境を汚すのでDockerコンテナ内に構築することをおすすめします。~~

-> はじめからDockerを使用した手順に変更

1. git clone

	```
	# cd [任意のディレクトリ]
	# git clone https://github.com/eggplant60/AnimeRec.git
	```

1. サーバサイド・フロントエンドの公開ポート番号を設定

	```
	# cd AnimeRec
	# vi conf/docker.json
	```

	他のサービスとかぶらないように2つのポート番号を設定(以下は例)
	```:conf/docker.json
	{
		"http": "8084",
		"node": "3004"
	}
	```

1. CHAN-TORU の認証設定

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


1. フロントエンド設定

	```
	# cd ../mock/conf
	# cp environment.js.default environment.js
	# vi environment.js
	```

	```JavaScript:environment.js
	angular.module('app')
		.value('express', {
			address: "[ホストのIPアドレス]",
			port   : "[2.で指定したnodeのポート番号]"
		});
	```


1. Docker コンテナのビルド＆アタッチ

	```
	# docker build -t "anime/rec" .
	# ./docker_run.sh
	```
	----------- ここから先はコンテナ内の作業 ---------------


1. PostgreSQL の設定

	1. PostgreSQL 起動

		```
		# /etc/init.d/postgresql start
		```

	1. DBのユーザ作成

		```
		# sudo -u postgres createuser -d -U postgres -P user
		Enter password for new role: ("abc"と入力)
		Enter it again: ("abc"と入力)
		```

	1. DB作成

		```
		# cd /AnimeRec/setup
		# ./01_create_db.sh
		Create DB anime_rec in localhost:5432
		Password: ("abc"と入力)
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

	1. DBのタイムゾーンの指定＆テーブル確認

		```
		# sudo -u postgres psql
		psql (12.2 (Ubuntu 12.2-1.pgdg16.04+1))
		Type "help" for help.

		postgres=# ALTER DATABASE anime_rec SET timezone TO 'Asia/Tokyo';
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

1. バッチ処理の動作確認

	```
	# cd /AnimeRec/batch
	# ./batch.sh
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

	ここまで動作することが確認できたら Ctrl-C で停止させてOK

1. サーバサイドの起動チェック

	```
	# cd /AnimeRec/node
	# node app.js
	checkAuthenticated()
	Node.js is listening to localhost:3001
	```
	上記のように表示されればOK. Ctrl-C で停止させる

1. サーバサイド＆フロントエンドの起動

	```
	# cd /AnimeRec
	# ./start.sh
	```
	Ctrl-P Q でコンテナから抜ける

	------------ コンテナ内の作業はここまで ---------------	

1. ブラウザでの動作確認

	"http://[ホストIPアドレス]:[2.で設定したhttpのポート番号]/" に
	アクセスして番組表が表示されればOK

1. CRON登録

	```
	# crontab -e
	```

	以下の一行を追加

	```
	0 9 * * * docker exec -i anime_rec "/AnimeRec/batch/batch.sh" >> /var/log/anime_rec.log 2>&1
	```

	
	以上