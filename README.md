# 《変換 -Palette Converter-》 version 3.X series
* FEAR社のTRPGシステム、ビーストバインドトリニティ（以下BBT）用のキャラクターシートから、チャットパレット用テキストデータやオンラインセッション用ツール向けの駒データを生成するツールです。
* 2.3.0公開後に一旦開発を終了したのですが、BBTの電子書籍化やオンラインセッション用ツールの更新が重なり、自身の体調も回復してきたことから、Vue.jsの勉強も兼ねてリメイクを行いました。

## 使用方法
* キャラクターシート倉庫( http://character-sheets.appspot.com/bbt/ )の、対応するキャラクターシートのURLをコピーしておいてください。
* ページの「URL」欄にコピーしたURLをペースト、使用したいオンラインセッションツールにあわせて「ツール指定」を選択。使用予定のツールが一覧にない場合は「なし」にしてください。
* 「チャットパレット出力」ボタンをクリック／タップで、指定したツールに合わせたチャットパレットが出力されます。
* 「ユドナリウム（派生ツール含む）」「ココフォリア」を選択している場合、さらにキャラクター駒の出力も行えます。画面を下にスクロールし、駒に紐づけるパラメータを確認のうえ操作を行ってください。

## 対応オンラインセッションツール
その他のオンラインセッションツールについては、情報をいただければ対応を検討いたします。
- ココフォリア
  - キャラクター駒作成機能が、Version 2.Xのzipファイル形式から、Ccfolia Clipboard APIを利用したものに変更されています。
  - キャラクター駒作成機能で、ステータス・パラメータの操作を事前に行えるようにしました。
- ユドナリウム
  - version 2.Xからの変更点として、「ユドナリウムリリィ」が独立したツールとして扱われています。
- ユドナリウムリリィ
  - アーツ宣言の際に、コスト表記が「リソース操作コマンド」に対応しています。そのため、宣言と同時に人間性などのコストが支払われます。
  - また、「バフパレット」の組み込みに対応しています。（チャットパレット側でのバフパレット操作は未対応）
  - 一部アーツ・アイテム名に自動でルビ振りを行う機能があります。
- Udonarium with Fly
  - 独自仕様である「吹き出し表示」でアイテム名だけ表示されてしまうことを防ぐため、アイテム使用宣言の鉤括弧が『　』になります。
  - また、アーツ・アイテム名を「　」で囲み、自動的に吹き出し表示に対応させる機能もあります。アーツ名を叫び「Romancing Sa Ga」シリーズ風に遊びたい人向け。
  - 一部アーツ・アイテム名に自動でルビ振りを行う機能があります。
- ユドナリウム（ルビ対応）
  - ユドナリウム系の「一部アーツ・アイテム名に自動でルビ振りを行う」機能のみONにするパターンです。
  - ユドナリウムリリィ、Udonarium with Flyの他、ルビ機能には「Udonarium Blue」が対応しているとのこと。書式はほぼすべて同じです。
- TRPGスタジオ
  - 能力値を直接書き込む形でテキストを作成します。
- Tekey
  - チャットパレットのプルダウンリスト化に対応しています。
- Quoridorn
  - チャットパレットのプルダウンリスト化に対応していない以外は、Tekeyと同じテキストを出力します。

## Version 2.X seriesからの変更点
- Vue.jsを採用して全体的に処理を書き直しました。
- 「判定値」「命中」欄からの判定式作成に対応しました。
- チャットパレットのコピーボタンを追加しました。
- キャラクター駒作成の処理を見直しました。
  - ステータス・パラメータやリソースなどの確認があらかじめ可能になりました。
  - 「罪」「大罪」を分けて処理するようになりました。
  - 「絆数」のステータス／リソースを自動作成するようになりました。
  - ココフォリアは、Clipboard APIを用いた出力に内容を変更しています。そのため、画像データが紐づかなくなりました。
  - ユドナリウム／ユドナリウムリリィは処理としてはほぼ共通ですが、ユドナリリィのみ「バフパレット」の編集が可能になっています。
- 簡易的ではあるものの、レスポンシブデザインにある程度対応しました。画面幅の小さいデバイスで操作する場合、URL入力欄がアコーディオンメニューに変わります。
