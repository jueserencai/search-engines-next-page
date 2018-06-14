// ==UserScript==
// @name         搜索引擎自动加载下一页
// @namespace    http://tampermonkey.net/
// @home-url     
// @description  搜索引擎自动加载下一页，包括baidu sogou bing 360so
// @version      0.0.1
// @author       绝色人才
// @include      https://www.sogou.com/web*
// @include      https://cn.bing.com/search*
// @include      https://www.baidu.com/s*
// @include      https://www.so.com/s*
// @require      https://cdn.bootcss.com/jquery/3.2.1/jquery.min.js
// @run-at       document-start
// @connect      *
// ==/UserScript==

(function () {
    'use strict';

    // console.log("ok1");
    /* 返回网址对应的搜索引擎类，包含ajax参数，更新下一页码、查询关键词等的方法 */
    function Config() {
        this.sogou = function () {
            this.config = {
                url: "https://www.sogou.com/web",
                data: {
                    ie: "utf8",
                    query: "",
                    page: 2,
                },
                getOrPost: "GET",
                parentNodeName: "#main",
                contentNodeName: ".results",
                inputId: "#upquery",
            };
            let sogouObj = this;
            this.nextPage = function () {
                return sogouObj.config.data.page += 1;
            };
            this.updateQuery = function(queryString) {
                sogouObj.config.data.query = queryString;
            };
        };

        this.bing = function() {
            this.config = {
                url: "https://cn.bing.com/search",
                data: {
                    q: "",
                    first: 10,
                },
                getOrPost: "GET",
                parentNodeName: "#b_results",
                contentNodeName: ".b_algo",
                inputId: "#sb_form_q",
            };
            let bingObj = this;
            this.nextPage = function () {
                return bingObj.config.data.first += 10;
            };
            this.updateQuery = function(queryString) {
                bingObj.config.data.q = queryString;
            };
        };

        this.baidu = function() {
            this.config = {
                url: "https://www.baidu.com/s",
                data: {
                    ie: "utf-8",
                    wd: "",
                    pn: 10,
                },
                getOrPost: "GET",
                parentNodeName: "#content_left",
                contentNodeName: ".result",
                inputId: "#kw",
            };
            let baiduObj = this;
            this.nextPage = function () {
                return baiduObj.config.data.pn += 10;
            };
            this.resetPage = function () {
                baiduObj.config.data.pn = 10;
            };
            this.updateQuery = function(queryString) {
                baiduObj.config.data.wd = queryString;
            };

            (function() {
                // 页面中点击搜索按钮，重置页码
                $("#su").click(function() {
                    baiduObj.resetPage();
                });
            })();
        };

        this.so360 = function() {
            this.config = {
                url: "https://www.so.com/s",
                data: {
                    q: "",
                    pn: 2,
                },
                getOrPost: "GET",
                parentNodeName: "#main > .result",
                contentNodeName: ".res-list",
                inputId: "#keyword",
            };
            let so360Obj = this;
            this.nextPage = function () {
                return so360Obj.config.data.pn += 1;
            };
            this.updateQuery = function(queryString) {
                so360Obj.config.data.q = queryString;
            };
        };

        // 根据网址返回对应的配置类
        // return new this.bing();
        let configObj = this;
        return (function() {
            let host = window.location.host;
            let reg = /\.[a-z|0-9]+\.com/;
            let res = reg.exec(host)[0];
            res = res.substring(1, res.length-4);
            if (res == "sogou") {
                return new configObj.sogou();
            } else if (res == "bing") {
                return new configObj.bing();
            } else if (res == "baidu") {
                return new configObj.baidu();
            } else if (res == "so") {
                return new configObj.so360();
            }
        })();
    };
    var searchEngine = new Config();
    // console.log("ok2");

    /* 加载下一页数据，插入当前页 */
    function PreLoader() {
        this.load = function (callback) {
            searchEngine.updateQuery($(searchEngine.config.inputId).val());
            // console.log(searchEngine.config.data);
            // console.log("page:",  searchEngine.config.data.page);
            $.ajax({
                url: searchEngine.config.url,
                type: searchEngine.config.getOrPost,
                data: searchEngine.config.data,
                success: function (data, status) {
                    let contentNode = $(data).find(searchEngine.config.parentNodeName).find(searchEngine.config.contentNodeName);
                    $(searchEngine.config.parentNodeName).append(contentNode);
                    searchEngine.nextPage();
                    // console.log();
                    callback();
                },
            });
        };
    }
    var preLoader = new PreLoader();
    // console.log("ok3");

    /* 滚动到底部检测，判断是否要插入下一页 */
    (function scrollLoadPage() {
        $(window).unbind("scroll").scroll(function () {
            let scrollTop = $(this).scrollTop();     //获取滚动条到顶部的距离
            let windowHeight = window.screen.height;        //获取窗口的高度
            let documentHeight = $(document).height();    //获取文档区域高度

            // console.log(scrollTop, windowHeight, documentHeight);
            if (scrollTop + windowHeight >= documentHeight) {
                $(this).unbind("scroll");
                preLoader.load(scrollLoadPage);
            }
        });
    })();
})();