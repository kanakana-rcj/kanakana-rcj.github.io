---
title: 'BlockFront Managerを作った話'
description: 'BlockFrontをやろう'
pubDate: 'Dec 22 2024'
heroImage: '/4th-post-img/BlockFrontManager.png'
---

### はじめに
この記事は僕の所属するMMAというサークルでのアドベントカレンダー[MMA Advent Calendar 2024 - Adventar](https://adventar.org/calendars/10770)の22日目の記事です。

昨日(12/21)の記事はgaeさんの[SlackAPIを使っていろいろ入手してみよう](https://zenn.dev/gae/articles/f292084bfc2c5f)でした。
gaeさんには今後ろから拳銃(部長権限)をつきつけられているので、早く進捗ださないとなって感じです。

今回はBlockFrontというMineCraftのMODのバージョン管理ツールを作ったので、紹介します。

### 前提
BlockFrontについては、以下のサイト等を参考にしてくだい。

https://modrinth.com/mod/blockfront

BlockFrontはネット対戦型のMODで、最新のバージョンでないと遊べないようになっています。
更新はそれなりの頻度で来るのですが、手動でファイルをダウンロードし、時には前提MODであるneoforgeも更新する必要があるので大変です。
今回はその作業を半自動化しました。

### 従来の更新手順
BlockFrontの従来の更新の際に行っていた手順をまとめます。

まず、公式Discordサーバーかゲーム内通知で最新バージョンがリリースされていることを知ります。

[modrinth](https://modrinth.com/mod/blockfront/versions)に行き、最新のバージョンのMODファイルをダウンロードします。
ダウンロードしたファイルはMinecraft launcherで指定しているmodsフォルダ―の中に配置します。

次に、最新バージョンのBlockFrontが対応しているNeoForgeを確認し、更新が必要ならNeoforgeのインストーラーを[neoforge.net](https://projects.neoforged.net/)からダウンロードします。
その後インストーラーを使ってクライアント用NeoForgeをインストールします。

これで更新終了です。

### BlockFront Manager
自分以外に使う人がいるのか分かりませんが、今回作ったものは以下で一応Publicで公開しています。

https://github.com/kanakana-rcj/BlockFrontManager

言語はPython, ライブラリはbeautifulsoupなどを使ってます。

ターミナル上で使う前提で作りました。
一応LinuxでもWindowsでも動作するはずです。

#### BlockFrontが最新かどうかを調べる
まず、更新が必要なのかどうか分かるようにします。
そのために現在modsフォルダにあるBlockFrontのバージョンと、modrinthで公開されている最新のバージョンが一致しているかどうかを調べます。

modrinthで公開されている最新のバージョンを得るには、スクレイピングが必要です。
スクレイピングといえばpythonのbeautifulsoupが便利そうなので、pythonを用いて開発することにしました。

[modrinth/blockfront/versions](https://modrinth.com/mod/blockfront/versions) の一番上に書いてあるバージョン番号を取ってくればよさそうです。
ここでバージョン番号のみをとってきても良いのですが、後にファイルのダウンロードもpythonコードで書くつもりだったので、modファイルのURLを取得することにします。

modファイルのURLはダウンロードボタンを押したときのGETリクエストの内容から確認できました。
<figure>
  <img width = 100% src = "/4th-post-img/network.png"/>
  <figcaption>GETリクエストの内容</figcaption>
</figure>

[modrinth/blockfront/versions](https://modrinth.com/mod/blockfront/versions)のHTMLを調べ、このダウンロードボタンのHTMLタグを探します。
すると、`arial-label:Download`がついているaタグのhref属性に、modファイルのURLがあったので、このaタグがダウンロードボタンに設定されているものと分かりました。
よって、`arial-label:Download`とされているaタグのなかで、一番上のaタグのhref属性のURLを取り出すことにします。

具体的には以下のような処理をしています。
```python
def get_latest_blockfront_url():
    url = 'https://modrinth.com/mod/blockfront/versions'
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    #arial-label : Download　の aタグの中で最初のものを取得
    a_tag = soup.find('a', {'aria-label': 'Download'})

    if a_tag:
        latest_blockfront_url = a_tag.get('href')
        return latest_blockfront_url
    else:
        print("<a> tag not found")
```

BlockFrontのファイル名は、`BlockFront-1.21.1-0.6.0.2b-RELEASE.jar`のような形式で統一されているので、ファイル名からバージョンを取り出すことができます。
システムにあるmodファイルについても同様に、ファイル名からバージョンを取り出します。

最後にmodsフォルダ内とサイト側のバージョン文字列を比較して、同じだったら最新と判断します。

#### 最新のBlockFrontが要求するNeoForgeのバージョンを知る
さて、システムにあるNeoForgeが、最新のBlockFrontがサポートするNeoForgeのバージョンなのかどうかも知りたいです。

ここで一つ難点がありました。
modrinthには、一部のBlockfrontバージョンについて、サポートしているNeoForgeのバージョンが明記されていませんでした。
(全てのバージョンについてサポートするNeoforgeのバージョン範囲が明記されていると嬉しかったのですが)

仕方ないので、[modrinth/blockfront/Changelog](https://modrinth.com/mod/blockfront/changelog)を参考にすることにしました。
サポートするneoforgeのバージョン範囲が変わったときには、必ずその旨が`Update to the latest version of NeoForge(21.xx.xx)`といった形式でchangelogに書いてありました。
よって、Changelogの中で最後に書かれた `(21.xx.xx)` を、最新のBlockFrontのNeoForge対応バージョンだと考えます。

<figure>
  <img width = 80% src = "/4th-post-img/changelog.png"/>
  <figcaption>Changelogの様子</figcaption>
</figure>

Changelogのページをスクレイピングして、`Update to the latest`までを含む行のなかで、一番上のものを取得します。
(なぜ`Update to the latest`までなのかというと、その次の単語が`version`のものと`release`のものがあったからです...😢)
その行の中で括弧に囲まれた文字列を探し、取り出します。

```python
def get_required_neoforge_version():
    url = "https://modrinth.com/mod/blockfront/changelog"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    matching_tags = soup.find_all(string=lambda text: "NeoForge" in text if text else False)

    required_neoforge_version = ""
    for tag in matching_tags:
        if tag.find("Updated to the latest") != -1:
            open_parenthesis_index = tag.find("(")
            close_parenthesis_index = tag.find(")")
            required_neoforge_version = tag[open_parenthesis_index+1:close_parenthesis_index]
            break
    return required_neoforge_version
```

これで最新のBlockFrontがサポートするNeoForgeのバージョンを得ることが出来ました。

あとはPCにあるNeoForgeのインストーラーのファイル名(`neoforge-21.1.77-installer.jar`のような形式)から現在のバージョンを推測します。
そしてmodrinthからとってきたバージョンと比較します。

Blockfrontのバージョン比較機能と、Neoforgeのバージョン比較機能を合わせると、最終的にこのように動作するようになりました。
```bash
$ python3 ./main.py status
latest BlockFront URL: https://cdn.modrinth.com/data/hTexWmdS/versions/4fh84LES/BlockFront-1.21.1-0.6.0.2b-RELEASE.jar
BlockFront latest file:  BlockFront-1.21.1-0.6.0.2b-RELEASE.jar
BlockFront latest version:  0.6.0.2b

BlockFront requires NeoForge version: 21.1.77
required NeoForge URL: https://maven.NeoForged.net/releases/net/NeoForged/NeoForge/21.1.77/NeoForge-21.1.77-installer.jar
required NeoForge filename: NeoForge-21.1.77-installer.jar

system BlockFront version: 0.6.0.2b
system NeoForge version: 21.1.77

BlockFront is up to date
NeoForge is up to date
```

#### 最新のファイルをダウンロードする
上のコマンドで最新でないと分かったとき、最新のものをダウンロードする機能を用意します。

すでにBlockFrontのMODファイルとNeoForgeのURLは取得してあるので、そのURLでGETリクエストを送ります。
```bash
$ python3 ./main.py update
getting latest BlockFront file: 0.6.0.2b
saved BlockFront to /mnt/c/Users/Username/AppData/Roaming/.minecraft/mods/BlockFront-1.21.1-0.6.0.2b-RELEASE.jar
BlockFront requires NeoForge 21.1.77
getting required NeoForge file: 21.1.77
saved NeoForge to /mnt/c/Users/Username/Documents/minecraft/BlockFront/NeoForge-21.1.77-installer.jar
```
良い感じにダウンロードできてます。

### おわりに
今回作ったものの概要は以上になります。
実はpythonはCTFぐらいでしか使わなかったので、しっかり使ったのはこれが初めてでした。
勘で書いたのでだいぶ汚いコードになってしまいました。

ただ、スクレイピング・httpリクエストなどの処理を少しだけ触れたのは良かったです。
普通に自分が使えるものが作れたのも大きいです。

明日(12/23)はnamorさんの記事です。乞うご期待!