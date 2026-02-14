# 🎚️ PA表 Generator

ライブPA表（音響プラン表）をブラウザ上で簡単に作成し、PDF出力できるWebアプリケーションです。

## 機能

- **基本情報入力** — 出演順・バンド名・日付・イベント名
- **メンバー管理** — パート・氏名・ニックネーム・バンマス指定、ドラッグ＆ドロップで並び替え
- **立ち位置調整** — ステージレイアウトをビジュアルに編集
- **マイク番号自動割当** — ベース→Ch5、パーカス→Ch6 を自動認識
- **セットリスト管理** — 曲・MCの追加、テンポ・時間・備考の入力
- **SE設定** — 入場SE・退場SEの指定
- **PDF出力** — A4サイズのPA表をワンクリックでダウンロード

## 使い方

1. `index.html` をブラウザで開く
2. 各項目を入力
3. 「📄 PDFを作成してダウンロード」ボタンをクリック

## 技術構成

| 項目 | 内容 |
|------|------|
| フロントエンド | HTML / CSS / JavaScript |
| PDF生成 | [jsPDF](https://github.com/parallax/jsPDF) + AutoTable |
| 日本語フォント | IPAexゴシック |

## ファイル構成

```
PA_Table_Generator/
├── index.html          # メインページ
├── css/
│   └── style.css       # スタイルシート
├── js/
│   ├── main.js         # UIアニメーション
│   ├── pa_app.js       # PA表ロジック・PDF生成
│   ├── font_data.js    # 日本語フォントデータ
│   └── libs/
│       ├── jspdf.umd.min.js
│       └── jspdf.plugin.autotable.min.js
├── .gitignore
├── LICENSE
└── README.md
```

## ライセンス

MIT License — 詳細は [LICENSE](./LICENSE) を参照してください。
