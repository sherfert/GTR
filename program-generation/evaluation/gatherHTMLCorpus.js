// Author: Michael Pradel

/*
  Downloads .html files of a given list of web sites.
 */
(function() {

    const fs = require("fs");
    const targetDir = "./corpusForEvaluation/html";

    // top 100 Alexa pages as of Mar 14, 2016 without duplicates (e.g., removed google.de)
    var urls = [
        "http://www.Google.com",
        "http://www.Facebook.com",
        "http://www.Youtube.com",
        "http://www.Baidu.com",
        "http://www.Yahoo.com",
        "http://www.Amazon.com",
        "http://www.Wikipedia.org",
        "http://www.Qq.com",
        "http://www.Twitter.com",
        "http://www.Live.com",
        "http://www.Taobao.com",
        "http://www.Msn.com",
        "http://www.Linkedin.com",
        "http://www.Sina.com.cn",
        "http://www.Weibo.com",
        "http://www.Bing.com",
        "http://www.Yandex.ru",
        "http://www.Vk.com",
        "http://www.Instagram.com",
        "http://www.Hao123.com",
        "http://www.Ebay.com",
        "http://www.Mail.ru",
        "http://www.Pinterest.com",
        "http://www.360.cn",
        "http://www.T.co",
        "http://www.Reddit.com",
        "http://www.Tmall.com",
        "http://www.Netflix.com",
        "http://www.Paypal.com",
        "http://www.Microsoft.com",
        "http://www.Sohu.com",
        "http://www.Wordpress.com",
        "http://www.Blogspot.com",
        "http://www.Onclickads.net",
        "http://www.Tumblr.com",
        "http://www.Gmw.cn",
        "http://www.Imgur.com",
        "http://www.Ok.ru",
        "http://www.Aliexpress.com",
        "http://www.Xvideos.com",
        "http://www.Apple.com",
        "http://www.Stackoverflow.com",
        "http://www.Imdb.com",
        "http://www.Fc2.com",
        "http://www.Ask.com",
        "http://www.Alibaba.com",
        "http://www.Office.com",
        "http://www.Rakuten.co.jp",
        "http://www.Tianya.cn",
        "http://www.Pornhub.com",
        "http://www.Diply.com",
        "http://www.Github.com",
        "http://www.Craigslist.org",
        "http://www.Xinhuanet.com",
        "http://www.Nicovideo.jp",
        "http://www.Soso.com",
        "http://www.Pixnet.net",
        "http://www.Blogger.com",
        "http://www.Kat.cr",
        "http://www.Outbrain.com",
        "http://www.Bongacams.com",
        "http://www.Googleusercontent.com",
        "http://www.Go.com",
        "http://www.Cnn.com",
        "http://www.Jd.com",
        "http://www.Naver.com",
        "http://www.Dropbox.com",
        "http://www.360.com",
        "http://www.Adnetworkperformance.com",
        "http://www.Chinadaily.com.cn",
        "http://www.Xhamster.com",
        "http://www.Coccoc.com",
        "http://www.Haosou.com",
        "http://www.Adobe.com",
        "http://www.Flipkart.com",
        "http://www.Microsoftonline.com",
        "http://www.China.com",
        "http://www.Whatsapp.com",
        "http://www.Cntv.cn"
    ];

    var jsdom = require("jsdom");

    for (var i = 0; i < urls.length; i++) {
        var url = urls[i];
        (function(url) {
            jsdom.env(url, [], function(err, window) {
                if (err) {
                    console.log("Error with " + url + ": " + err);
                } else {
                    const html = jsdom.serializeDocument(window.document);
                    const fileName = url.replace(/:/g, "").replace(/:/g, "").replace(/\//g, "") + ".html";
                    console.log(url + " --> " + fileName);
                    fs.writeFileSync(targetDir + "/" + fileName, html);
                }
            });
        })(url);
    }

})();