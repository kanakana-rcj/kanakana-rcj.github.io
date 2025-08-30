---
title: 'サーバーへの攻撃を可視化'
description: '攻撃可視化マップサイトの作成'
pubDate: 'Nov 22 2024'
heroImage: '/5th-post-img/header.png'
---

### はじめに
私の所属するMMAというサークルのサーバーに対する攻撃を可視化するサイトを作ってみたので紹介します。
残念ながらサイト自体はは部内ネットワーク限定公開なので実物を実際に見てもらうことはできないです。

また、この記事はMMAの2024年秋号の部誌に載せた記事を移したものになります。
[MMAwiki/Booklet](https://wiki.mma.club.uec.ac.jp/Booklet)から、誰でも部誌のバックナンバーを閲覧できます。
興味のある方は覗いてみてください。

### 前提
MMA には数多くのサーバーがありますが、そのなかでも moon というサーバーの 22 番ポート(sshのポート)はアクセスを試みる形の攻撃をかなり受けています。
MMA にはすでに、攻撃元の IPアドレスから緯度経度を割り出し、そのIPからの攻撃回数などと併せて json に出力するシステムがありました。
今回はこのデータをもとに、マップ形式でどこからどれだけ攻撃されたかを可視化しました。

### elasticsearch, kibana, logstash を用いた可視化
検索エンジンである elasticsearch, データの編集や可視化に用いる kibana, それらにデータを転送するlogstash を用いて可視化します。
まず、elastic 公式から elasticsearch, kibana, logstash のアーカイブをインストールし、elasticsearch と kibana の初期設定をします。

今回は部内のみの用途なので、それぞれの config でセキュリティオプションdisable にします。(https だといろいろ面倒だった)

logstash の config で、json ファイルを読んで elasticsearch に送るように記述します。
この config の要求する json フォーマットがかなり厳しく、コロンの後に空白があると駄目、ファイルの最後に改行がないと駄目、などかなり悩まされました。

```json
  input {
    file {
      path = > "/ path /to/ json / your . json "
      start_position = > " beginning "
      sincedb_path = > "/dev / null "
      codec = > " json "
    }
  }

  filter {

  }

  output {
    elasticsearch {
      hosts = > [" http :// elasticsearch :9200 "]
      index = > " ipdata "
      document_id = > "%{ ip}"
    }
    stdout { codec = > rubydebug }
  }
```
データが転送できていることを確認したら、kibana で map を作り、埋め込み用の iframe を出力させて、web サイトに張り付けて完成。

ここでの elasticsearch, kibana, logstash は systemd で daemon 化してバックグウンドで実行しています。

<figure>
  <img width = 100% src = "/5th-post-img/2Dmap.gif"/>
  <figcaption>kibana等による2Dマップ</figcaption>
</figure>

### webGL を用いた可視化
2Dの次は3Dでの可視化もしたくなったので、webGL(three.js) を用いて可視化してみます。
three.js は 3D 表現に長ける javascript ライブラリで、簡単に 3D 表現が実装できるらしいです。
今回はインターネットの海に浮いていた example を拝借しました。
Google Data Arts チームによる WebGL GLobe というプラットフォームを利用します。3D の地球上の任意の位置に magnitude を持った棒グラフを立てることができるようになっています。
データとして json 形式で latitude, longitude, magnitude を並べたリストを与えます。
```json

  [
    [ latitude , longitude , magnitude , latitude , logitude , mag ...]
  ]

```
python で HTTP サーバーを立て、GET リクエストがきたら攻撃データの json を WebGL Globe 用フォーマットに整形して返すコードを書きます。
先ほどの kibana map を張り付けたサイトをホストしているサーバーから、python http サーバーに GET リクエストして、webGL Globe にデータを与えると以下のようなものが完成しました。
<figure>
  <img width = 100% src = "/5th-post-img/webgl.gif"/>
  <figcaption>webGLによる3Dマップ</figcaption>
</figure>

#### 今後の展望
やはり攻撃地点から東京までの軌跡を描いてよりかっこよくしたいですね。
kibana を使っているのでグラフ出力などもできそうです。
また、メンテナンス性の向上のために systemd で行っているところをdocker コンテナに置き換えていくつもりです。
