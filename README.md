# 株式会社トモヤ LP（WordPress 組込用）

## ファイル構成

```
tomoya-lp/
├─ index.html          … LP本体（プレビュー/参照用）
├─ assets/
│  ├─ css/style.css    … 全スタイル（.tmy-lp にスコープ済み）
│  └─ js/script.js     … スクロール制御・追従CTA・FAQ・フォーム検証
└─ README.md
```

すべてのCSSとJSクラス/ID名は `tmy-` プレフィックスで名前空間化しており、既存WordPressテーマと衝突しません。

## WordPress への組込手順（推奨：固定ページ + 子テーマテンプレート）

### 手順 A. 固定ページテンプレート方式（推奨）

1. 子テーマのディレクトリに以下を配置
   ```
   wp-content/themes/child/
   ├─ page-lp.php             ← 新規作成
   └─ assets/tomoya-lp/
      ├─ css/style.css
      └─ js/script.js
   ```
2. `page-lp.php` を以下で作成
   ```php
   <?php
   /* Template Name: Tomoya LP */
   get_header();
   ?>
   <link rel="stylesheet" href="<?php echo get_stylesheet_directory_uri(); ?>/assets/tomoya-lp/css/style.css">
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap" rel="stylesheet">

   <!-- ここに index.html の <body class="tmy-lp"> ～ </body> の中身をペースト -->

   <script src="<?php echo get_stylesheet_directory_uri(); ?>/assets/tomoya-lp/js/script.js" defer></script>
   <?php get_footer();
   ```
3. 管理画面 → 固定ページ新規追加 → ページ属性テンプレートで「Tomoya LP」を選択して公開。
4. CSSは `.tmy-lp` スコープ下で閉じているため、テーマのヘッダー/フッターと共存可能。ただしテーマのグローバルCSSでbody余白やリンク装飾が強すぎる場合は、必要に応じて `.tmy-lp` 側の優先度を上げてください。

### 手順 B. カスタムHTMLブロック方式（簡易）

1. 管理画面 → 外観 → テーマファイルエディタ（または子テーマ `functions.php`）で以下を追加。
   ```php
   add_action('wp_enqueue_scripts', function () {
     if (is_page('lp')) { // スラッグを合わせる
       wp_enqueue_style('tmy-lp', get_stylesheet_directory_uri().'/assets/tomoya-lp/css/style.css', [], '1.0');
       wp_enqueue_script('tmy-lp', get_stylesheet_directory_uri().'/assets/tomoya-lp/js/script.js', [], '1.0', true);
       wp_enqueue_style('tmy-lp-font', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap');
     }
   });
   ```
2. 固定ページに「カスタムHTML」ブロックを配置、`index.html` の `<body>` 内マークアップを貼り付け。

## フォーム連携（Contact Form 7 例）

`index.html` の `<form id="contact-form">` は見た目のみ用意してあります。本番公開時は Contact Form 7 / WPForms 等のショートコードに差し替えてください。Contact Form 7 を使う場合、各 `<input>` を以下のように置き換えます:

```
[text* company class:tmy-input placeholder "株式会社◯◯"]
[text* your-name class:tmy-input]
[email* your-email class:tmy-input]
...
[submit class:tmy-btn class:tmy-btn--primary class:tmy-btn--xl "送信する"]
```

## レスポンシブ対応

- PC：1200px 基準（1600px 以上は最大 1320px まで拡張）
- タブレット：1024px 以下（グリッド2列化、ハンバーガーメニュー）
- スマートフォン：768px 以下（1列、追従ボトムバー表示）

## 追従CTA

- PC/タブレット：右側の「電話・資料請求・お問い合わせ」縦型バー（スクロール600px超で出現）
- スマートフォン：画面下部固定バー

## ダミー画像の差し替え

`data-label` 属性付きの `.tmy-product__img` `.tmy-voice__img` `.tmy-sustain__img` はCSSのグラデーションと縞模様で描画しています。本番用画像に差し替える場合は以下いずれかで対応:

```html
<!-- 方法1: 背景画像を直接指定 -->
<div class="tmy-product__img" style="background-image:url('/wp-content/uploads/product-01.jpg');background-size:cover;"></div>

<!-- 方法2: imgタグに置換 -->
<img class="tmy-product__img" src="..." alt="...">
```

方法2で差し替える場合は `aspect-ratio` が効くよう `object-fit: cover; width:100%;` を付与してください。

## カラー／フォント調整

`style.css` 冒頭の CSSカスタムプロパティ（`--c-primary` 等）を変更するだけで全体のトーンを調整できます。

## ブラウザ対応

Chrome / Edge / Safari / Firefox の最新2バージョン。`prefers-reduced-motion` にも対応。
