---
title: 'BlockFront Managerを作った話'
description: 'BlockFrontをやろう'
pubDate: 'Dec 22 2024'
heroImage: '/4th-post-img/BlockFrontManager.png'
---

この記事は[MMA Advent Calendar 2024 - Adventar](https://adventar.org/calendars/10770) の記事です。

<figure>
  <img width = 100% src = "/4th-post-img/MMAadcare.png"/>
  <figcaption>(なんか緑で染まってる気がしますが気のせいです)</figcaption>
</figure>

### はじめに
こんにちは。kanakanaです。

この記事は僕の所属するサークルMMA内のアドベントカレンダーの22日目の記事です。

昨日(12/21)の記事はgaeさんの[SlackAPIを使っていろいろ入手してみよう](https://zenn.dev/gae/articles/f292084bfc2c5f)でした。

https://zenn.dev/gae/articles/f292084bfc2c5f

作ったものが充実しすぎて公開できないって僕も言ってみたいですね。
gaeさんには今後ろから拳銃(部長権限)をつきつけられているので、早く進捗ださないとなって感じです。
明日から本気出します。

今回僕が書くのは、BlockFrontというMineCraftのMODのバージョン管理ツールを作った話です。

BlockFrontは今のところアクティブなMODなので、updateがそれなりの頻度できます。
また、ネット対戦を前提にしたMODなので、最新のバージョンでないとほぼ遊べないようになっています。

しかしそのバージョン更新を毎回やっていくうちに面倒くさくなってきたので、少しでも楽にできないかと思い立ちました。

### そもそもBlockFrontとは

https://modrinth.com/mod/blockfront

本題に入る前に、そもそもBlockFrontがどのようなMODなのかについて説明します。
BlockFrontとは、MineCraftを第二次世界大戦を舞台にしたFPSゲームに変身させるMODです。

<figure>
  <img width = 100% src = "/4th-post-img/play1.png"/>
  <figcaption>待機画面はこんなかんじになる</figcaption>
</figure>

基本的にオンラインプレイです。
どの時間でも最低10人くらいはプレイヤーがオンラインでプレイしている印象です。
2チーム(枢軸国vs連合軍)に分かれて陣地を取り合うDomination modeの対戦が多いです。

各対戦の始めにMAP VOTEがありMap, Modeを決めます。
MapはKwai, Avalanche, Bastogne, Creteなど実際の都市を再現したものが多いです。


<figure>
  <img width = 100% src = "/4th-post-img/play2.png"/>
  <figcaption>Game mode</figcaption>
</figure>

<figure>
  <img width = 100% src = "/4th-post-img/play3.png"/>
  <figcaption>Map Vote</figcaption>
</figure>


マップが決まったらAssult, Rifle, Sniper, Gunnerなどの役職・武器を選び、対戦開始です。
killされても5秒後ぐらいにはリスポーンできるので、制限時間か自国側のポイントが上限に達するまで遊べます。

銃の反動、リロード時間などは割とリアル至高な気がします(他のFPSをあまりやったことがないため自信なし)。
覗き込みをしないと弾の散弾がひどく、いわゆる腰撃ちはほぼ当たらないです。

また、各チームに一定数BOTがいるのですが、BOTはその国の言葉でしゃべります。
少し前までは日本軍のBOTの音声が明らかに片言で残念だったのですが、最近のアプデで少しマシになって嬉しいです。

### 今までの更新手順
そんなBlockFrontですが、更新の際に今まで行っていた手順をお伝えしようと思います。

まず、公式Discordサーバーのupdateチャンネルでupdateが来ていることを知ります。
気づかずにBlockFrontを開いても最新のバージョンでない旨を伝えてくれます。

<figure>
  <img width = 100% src = "/4th-post-img/discord.png"/>
  <figcaption>discordが活発だと良いよねおじさん「discordが活発だと良いよね」</figcaption>
</figure>

[modrinth](https://modrinth.com/mod/blockfront/versions)に行き、最新のバージョンのMODファイルをダウンロードします。
ダウンロードしたファイルはMinecraft launcherで指定しているmodsフォルダ―の中に配置します。

次に、Discordのupdateチャンネルの履歴をみて対応しているNeoForgeのインストーラーをダウンロードします。
([NeoForge](https://projects.neoforged.net/)は、BlockFrontが依存している親MODのようなものです) 
その後インストーラーを使ってクライアント用NeoForgeをインストールします。

これで更新終了です。

ここまでの流れですが、意外と面倒くさいです。
特に2つもファイルをダウンロードした上に所定の場所において、更にインストールまでするので繰り返すうちにうんざりしてきます。
そこでBlockFrontのバージョンを管理するBlockFront Managerを作ろうというわけです。

### BlockFront Manager
自分以外に使う人がいるのか分かりませんが、今回作ったものは一応publicで公開しています。

https://github.com/kanakana-rcj/BlockFrontManager

#### BlockFrontが最新かどうかを調べる
まず、コマンドでアップデートが必要なのかどうか分かるようにします。
そのために現在システムにあるBlockFrontのMODファイルのバージョンと、modrinthで公開されている最新のバージョンが一致しているかどうかを調べます。

modrinthで公開されている最新のバージョンを得るには、スクレイピングが必要です。
スクレイピングといえばpythonのbeautifulsoupが便利そうなので、不本意ながらpythonを用いて書くことにします。

versionsの一番上の方に書いてあるバージョン番号をとってくればよさそうです。
ここでバージョン番号のみをとってきても良いのですが、後にファイルのダウンロードもpythonコードで書くつもりだったので、
modファイルのURLをまずは取得することにします。

modファイルのURLはダウンロードボタンを押したときのGETリクエストの内容から確認できました。
<figure>
  <img width = 100% src = "/4th-post-img/network.png"/>
  <figcaption>GETリクエストの内容</figcaption>
</figure>
こんどはページのhtmlを調べてこのURLがhref属性に設定されているタグを調べると、ダウンロードボタンに該当するaタグが見つかりました。

arial-label:Downloadのaタグのhref属性に、modファイルのURLが設定されています。
よって、beautifulsoupでこの条件を満たすaタグのなかで一番上のもののhref属性のURLを取り出すことにします。
このURLから、ファイル名を取り出します。
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

BlockFrontのファイル名は、`BlockFront-1.21.1-0.6.0.2b-RELEASE.jar`のような形式なので、ファイル名からバージョンを取り出すことができます。

システムにあるmodファイルについても同様に、ファイル名からバージョンを取り出します。

最後にシステムとサイト側のバージョン文字列を比較して、同じだったら最新と判断します。

#### 最新のBlockFrontが要求するNeoForgeのバージョンを知る
さて、システムにあるNeoForgeが、最新のBlockFrontが必要とするNeoForgeのバージョンなのかどうかも知りたいです。

ここで一つ難点がありました。
modrinthのBlockFrontの各バージョンの詳細にはNeoForgeの対応バージョンが書いてありません。
毎回のアップデートの詳細に、対応バージョンぐらい書いてくれても良い気がするのですが、明記されていませんでした。

仕方ないので、苦渋の決断としてmodrinthのChangelogを参考にすることにしました。
Changelogの中で最後に書かれた`Update to the latest version of NeoForge(21.xx.xx)`が、最新のBlockFrontのNeoForge対応バージョンだと考えることにします。
(流石にNeoForgeの対応バージョンを上げたらChangelogにかいてくれるはず...)

<figure>
  <img width = 80% src = "/4th-post-img/changelog.png"/>
  <figcaption>Changelogの様子</figcaption>
</figure>

Changelogのページをスクレイピングして、`Update to the latest`までを含む行のなかで、一番上のものを取得します。
(なぜ`Update to the latest`までなのかというと、その次の単語が`version`のものと`release`のものがあったからです...😢)
その行のなかで括弧に囲まれた文字列を探し、取り出します。

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

これで最新のBlockFrontが要求しているNeoForgeのバージョンを得ることが出来ました。

あとはシステムにあるNeoForgeのインストーラーのファイル名(`neoforge-21.1.77-installer.jar`のような形式)からバージョンを取得します。
そしてmodrinthからとってきたバージョンと比較します。

最終的に、このように動作するようになりました。
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
良い感じに最新であることが分かりました。

#### 最新のファイルをダウンロードする
最後に上のコマンドで最新でないと分かったとき、最新のものをダウンロードする機能を用意します。

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