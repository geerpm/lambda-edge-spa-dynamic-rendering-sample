"use strict";
/**
 * Lambda@Edge: Viewer Request trigger
 *
 * 指定Behavior全てのリクエストで実行
 * Dynamic Renderingをする必要のあるリクエストに専用ヘッダをつける
 *
 * bot and suffix samples
 * https://gist.github.com/thoop/8165802
 */

const crawlers = [
  // 検証する場合、DNS ルックアップを行う https://support.google.com/webmasters/answer/80553
  "Googlebot",
  // IPリスト取得して制限が可能 https://developers.facebook.com/docs/sharing/webmasters/crawler?locale=ja_JP
  "facebookexternalhit",
  // IP制限が可能かも https://developer.twitter.com/en/docs/tweets/optimize-with-cards/guides/troubleshooting-cards#15_seconds
  "Twitterbot",
  // 検証ツールがあるぽい https://www.bing.com/webmaster/help/which-crawlers-does-bing-use-8c184ec0
  "bingbot",
  "msnbot",
  "Slackbot"
  // "Baiduspider"
];

const excludeSuffixes = [
  "jpg",
  "png",
  "gif",
  "jpeg",
  "svg",
  "css",
  "js",
  "json",
  "txt",
  "ico"
];

const HTTP_HEAD_NEED_DR = "x-need-dynamic-render";

module.exports.vrFixer = async (event, context, callback) => {
  // https://docs.aws.amazon.com/ja_jp/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#lambda-event-structure-request
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // is html
  const suffix =
    request.uri == null
      ? ""
      : request.uri
          .split("?")
          .shift()
          .split(".")
          .pop()
          .toLowerCase();
  const maybeHtml = !excludeSuffixes.some(es => es === suffix);

  const isCrawler = crawlers.some(c => {
    return headers["user-agent"][0].value.includes(c);
  });

  if (isCrawler && maybeHtml) {
    request.headers[HTTP_HEAD_NEED_DR] = [
      {
        key: "X-Need-Dynamic-Render",
        value: "true"
      }
    ];
  }

  console.log(
    `isCrawler "${isCrawler}", maybeHtml "${maybeHtml}", uri "${request.uri}"`
  );

  callback(null, request);
};
