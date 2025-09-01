---
title: 'OWASP ZAPメモ'
description: 'OWSAP ZAPで大量の検査対象を検査する'
pubDate: 'March 1 2025'
heroImage: '/6th-post-img/header.png'
---

### はじめに
| 雑記事注意

OWASP ZAPで割と多めの検査を行ったので、その時のメモ

### OWSAP ZAPのPython API
自動化したかったら、PythonのAPIが便利です。
先に検査対象をリストアップしておいて、Python で上からAPIを使って検査できます。

APIについては基本的に以下の公式ドキュメントとソフトに元からついてるAPIヘルプが参考になります。

https://www.zaproxy.org/docs/api/


公式ドキュメントにpython, java, shellについてサンプルが表示されているので、そこからコピーして使えます。

### ZAPが落ちる対策
初期設定のままプログラムを走らせると、zap proxyからの応答がなくなることがありました。
`~/.ZAP/zap.log` を確認すると、`java.lang.OutOfMemoryError: Java heap space ` と書かれていたので、どうやらリソースが足りなかったようです。
試しにzapのプロセスについてpsコマンドで見てみます。

```bash
$ ps aux | grep zap
user    1014537  6.7  6.1 4809032 498804 ?      Sl   14:49   0:32 java -Xmx1987m -jar /usr/share/zaproxy/zap-2.16.0.jar
```

` -Xmx1987m ` から1.9Gしか割り当てられてなかったとわかりました。
割り当てるメモリ容量は`/usr/share/zaproxy/zap.sh`の中の`-xmx`の箇所を編集することで変更できます。

