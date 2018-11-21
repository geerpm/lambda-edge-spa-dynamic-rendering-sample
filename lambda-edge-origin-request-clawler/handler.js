"use strict";
/**
 * Lambda@Edge: Origin Request trigger
 *
 * オリジンを見に行く時に起動
 *
 * crawlerかどうかのヘッダと、htmlかどうかをチェックして、
 * 対象ならhtmlをDynamic renderingして返す
 */

// "@serverless-chrome/lambda"はserverless-plugin-chromeにより自動でhandlerに渡される
// Not use "puppeteer"
const CDP = require("chrome-remote-interface");

// S3 Static Website Hosting Endpoint
const S3_ENDPOINT = "http://hogehoge-ap-northeast-1.amazonaws.com";

const HTTP_HEAD_NEED_DR = "x-need-dynamic-render";

function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

module.exports.orCrawler = async (event, context, callback, chrome) => {
  // callback読んだらイベントループが残っててもlambda終了する
  // context.callbackWaitsForEmptyEventLoop = false;

  // https://docs.aws.amazon.com/ja_jp/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#lambda-event-structure-request
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // guard: crawler only
  if (
    headers[HTTP_HEAD_NEED_DR] == null ||
    headers[HTTP_HEAD_NEED_DR][0].value !== "true"
  ) {
    console.log("Skip cause not needed");
    return callback(null, request);
  }

  // Dynamic rendering start..
  console.log("Dynamic rendering start..");
  let client = null;

  const WAIT_MS_MIN = 500;
  const WAIT_MS_MAX = 9000;
  const START_TIME = new Date().getTime();
  let reqIds = new Set();

  function isMinWaitOver() {
    return new Date().getTime() - START_TIME > WAIT_MS_MIN;
  }
  function isMaxWaitOver() {
    return new Date().getTime() - START_TIME > WAIT_MS_MAX;
  }

  try {
    //github.com/cyrus-and/chrome-remote-interface/wiki/Dump-HTML-after-page-load
    client = await CDP();
    const { Network, Page, Runtime } = client;

    // setup handlers
    Network.requestWillBeSent(params => {
      console.log(
        `Network.requestWillBeSent: ${params.type} ${params.requestId} ${
          params.request.url
        }`
      );
      if (params.type == "XHR") {
        reqIds.add(params.requestId);
      }
    });
    Network.responseReceived(params => {
      console.log(
        `Network.responseReceived: ${params.type} ${params.requestId} ${
          params.response.url
        }`
      );
      if (params.type == "XHR" && reqIds.has(params.requestId)) {
        reqIds.delete(params.requestId);
      }
    });

    await Network.enable();
    await Page.enable();
    await Network.setCacheDisabled({ cacheDisabled: true });
    // ページ遷移
    await Page.navigate({ url: `${S3_ENDPOINT}${request.uri}` });
    await Page.loadEventFired();

    while (!isMaxWaitOver()) {
      console.log(` ... wait loop, reqsize:${reqIds.size}`);
      if (isMinWaitOver()) {
        if (reqIds.size === 0) {
          break;
        }
      }
      await sleep(200);
    }

    const result = await Runtime.evaluate({
      expression: "document.documentElement.outerHTML"
    });
    const html = result.result.value || "";
    const response = {
      body: html.replace("<html ", '<html data-le="1" '),
      bodyEncoding: "text",
      headers: {
        // Response header
      },
      status: 200
    };
    console.log("Dynamic rendered! " + html.length + " bytes");
    callback(null, response);
  } catch (err) {
    console.error(err);
    callback(err, { status: 503 });
  } finally {
    if (client) client.close();
  }

  console.log("EOL: handler....");
};
