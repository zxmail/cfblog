/**
 * Welcome to cf-blog-plus
 * @license Apache-2.0
 * @website https://github.com/-A-RA/cf-blog-plus
 * @version 2.0.0
 */

// --- BEGIN: Mustache.js v4.1.0 ---
const Mustache = (function(global, factory) {
    typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = global || self, global.Mustache = factory())
})(this, function() {
    "use strict";
    var objectToString = Object.prototype.toString;
    var isArray = Array.isArray || function isArrayPolyfill(object) { return objectToString.call(object) === "[object Array]" };
    function isFunction(object) { return typeof object === "function" }
    function typeStr(obj) { return isArray(obj) ? "array": typeof obj }
    function escapeRegExp(string) { return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&") }
    function hasProperty(obj, propName) { return obj != null && typeof obj === "object" && propName in obj }
    function primitiveHasOwnProperty(primitive, propName) { return primitive != null && typeof primitive !== "object" && primitive.hasOwnProperty && primitive.hasOwnProperty(propName) }
    var regExpTest = RegExp.prototype.test;
    function testRegExp(re, string) { return regExpTest.call(re, string) }
    var nonSpaceRe = /\S/;
    function isWhitespace(string) { return ! testRegExp(nonSpaceRe, string) }
    var entityMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "/": "&#x2F;", "`": "&#x60;", "=": "&#x3D;" };
    function escapeHtml(string) { return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) { return entityMap[s] }) }
    var whiteRe = /\s*/;
    var spaceRe = /\s+/;
    var equalsRe = /\s*=/;
    var curlyRe = /\s*\}/;
    var tagRe = /#|\^|\/|>|\{|&|=|!/;
    function parseTemplate(template, tags) {
        if (!template) return [];
        var lineHasNonSpace = false;
        var sections = [];
        var tokens = [];
        var spaces = [];
        var hasTag = false;
        var nonSpace = false;
        var indentation = "";
        var tagIndex = 0;
        function stripSpace() {
            if (hasTag && !nonSpace) { while (spaces.length) delete tokens[spaces.pop()] } else { spaces = [] }
            hasTag = false; nonSpace = false
        }
        var openingTagRe, closingTagRe, closingCurlyRe;
        function compileTags(tagsToCompile) {
            if (typeof tagsToCompile === "string") tagsToCompile = tagsToCompile.split(spaceRe, 2);
            if (!isArray(tagsToCompile) || tagsToCompile.length !== 2) throw new Error("Invalid tags: " + tagsToCompile);
            openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + "\\s*");
            closingTagRe = new RegExp("\\s*" + escapeRegExp(tagsToCompile[1]));
            closingCurlyRe = new RegExp("\\s*" + escapeRegExp("}" + tagsToCompile[1]))
        }
        compileTags(tags || mustache.tags);
        var scanner = new Scanner(template);
        var start, type, value, chr, token, openSection;
        while (!scanner.eos()) {
            start = scanner.pos; value = scanner.scanUntil(openingTagRe);
            if (value) {
                for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
                    chr = value.charAt(i);
                    if (isWhitespace(chr)) { spaces.push(tokens.length); indentation += chr } else { nonSpace = true; lineHasNonSpace = true; indentation += " " }
                    tokens.push(["text", chr, start, start + 1]); start += 1;
                    if (chr === "\n") { stripSpace(); indentation = ""; tagIndex = 0; lineHasNonSpace = false }
                }
            }
            if (!scanner.scan(openingTagRe)) break;
            hasTag = true; type = scanner.scan(tagRe) || "name"; scanner.scan(whiteRe);
            if (type === "=") { value = scanner.scanUntil(equalsRe); scanner.scan(equalsRe); scanner.scanUntil(closingTagRe) } 
            else if (type === "{") { value = scanner.scanUntil(closingCurlyRe); scanner.scan(curlyRe); scanner.scanUntil(closingTagRe); type = "&" } 
            else { value = scanner.scanUntil(closingTagRe) }
            if (!scanner.scan(closingTagRe)) throw new Error("Unclosed tag at " + scanner.pos);
            if (type == ">") { token = [type, value, start, scanner.pos, indentation, tagIndex, lineHasNonSpace] } else { token = [type, value, start, scanner.pos] }
            tagIndex++; tokens.push(token);
            if (type === "#" || type === "^") { sections.push(token) } 
            else if (type === "/") {
                openSection = sections.pop();
                if (!openSection) throw new Error('Unopened section "' + value + '" at ' + start);
                if (openSection[1] !== value) throw new Error('Unclosed section "' + openSection[1] + '" at ' + start)
            } else if (type === "name" || type === "{" || type === "&") { nonSpace = true } 
            else if (type === "=") { compileTags(value) }
        }
        stripSpace(); openSection = sections.pop();
        if (openSection) throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
        return nestTokens(squashTokens(tokens))
    }
    function squashTokens(tokens) {
        var squashedTokens = [];
        var token, lastToken;
        for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
            token = tokens[i];
            if (token) {
                if (token[0] === "text" && lastToken && lastToken[0] === "text") { lastToken[1] += token[1]; lastToken[3] = token[3] } 
                else { squashedTokens.push(token); lastToken = token }
            }
        }
        return squashedTokens
    }
    function nestTokens(tokens) {
        var nestedTokens = [];
        var collector = nestedTokens;
        var sections = [];
        var token, section;
        for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
            token = tokens[i];
            switch (token[0]) {
            case "#": case "^": collector.push(token); sections.push(token); collector = token[4] = []; break;
            case "/": section = sections.pop(); section[5] = token[2]; collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens; break;
            default: collector.push(token)
            }
        }
        return nestedTokens
    }
    function Scanner(string) { this.string = string; this.tail = string; this.pos = 0 }
    Scanner.prototype.eos = function eos() { return this.tail === "" };
    Scanner.prototype.scan = function scan(re) {
        var match = this.tail.match(re);
        if (!match || match.index !== 0) return "";
        var string = match[0]; this.tail = this.tail.substring(string.length); this.pos += string.length;
        return string
    };
    Scanner.prototype.scanUntil = function scanUntil(re) {
        var index = this.tail.search(re), match;
        switch (index) {
        case - 1 : match = this.tail; this.tail = ""; break;
        case 0: match = ""; break;
        default: match = this.tail.substring(0, index); this.tail = this.tail.substring(index)
        }
        this.pos += match.length;
        return match
    };
    function Context(view, parentContext) { this.view = view; this.cache = { ".": this.view }; this.parent = parentContext }
    Context.prototype.push = function push(view) { return new Context(view, this) };
    Context.prototype.lookup = function lookup(name) {
        var cache = this.cache;
        var value;
        if (cache.hasOwnProperty(name)) { value = cache[name] } 
        else {
            var context = this, intermediateValue, names, index, lookupHit = false;
            while (context) {
                if (name.indexOf(".") > 0) {
                    intermediateValue = context.view; names = name.split("."); index = 0;
                    while (intermediateValue != null && index < names.length) {
                        if (index === names.length - 1) lookupHit = hasProperty(intermediateValue, names[index]) || primitiveHasOwnProperty(intermediateValue, names[index]);
                        intermediateValue = intermediateValue[names[index++]]
                    }
                } else { intermediateValue = context.view[name]; lookupHit = hasProperty(context.view, name) }
                if (lookupHit) { value = intermediateValue; break }
                context = context.parent
            }
            cache[name] = value
        }
        if (isFunction(value)) value = value.call(this.view);
        return value
    };
    function Writer() { this.templateCache = { _cache: {}, set: function set(key, value) { this._cache[key] = value }, get: function get(key) { return this._cache[key] }, clear: function clear() { this._cache = {} } } }
    Writer.prototype.clearCache = function clearCache() { if (typeof this.templateCache !== "undefined") { this.templateCache.clear() } };
    Writer.prototype.parse = function parse(template, tags) {
        var cache = this.templateCache;
        var cacheKey = template + ":" + (tags || mustache.tags).join(":");
        var isCacheEnabled = typeof cache !== "undefined";
        var tokens = isCacheEnabled ? cache.get(cacheKey) : undefined;
        if (tokens == undefined) { tokens = parseTemplate(template, tags); isCacheEnabled && cache.set(cacheKey, tokens) }
        return tokens
    };
    Writer.prototype.render = function render(template, view, partials, config) {
        var tags = this.getConfigTags(config);
        var tokens = this.parse(template, tags);
        var context = view instanceof Context ? view: new Context(view, undefined);
        return this.renderTokens(tokens, context, partials, template, config)
    };
    Writer.prototype.renderTokens = function renderTokens(tokens, context, partials, originalTemplate, config) {
        var buffer = "";
        var token, symbol, value;
        for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
            value = undefined; token = tokens[i]; symbol = token[0];
            if (symbol === "#") value = this.renderSection(token, context, partials, originalTemplate, config);
            else if (symbol === "^") value = this.renderInverted(token, context, partials, originalTemplate, config);
            else if (symbol === ">") value = this.renderPartial(token, context, partials, config);
            else if (symbol === "&") value = this.unescapedValue(token, context);
            else if (symbol === "name") value = this.escapedValue(token, context, config);
            else if (symbol === "text") value = this.rawValue(token);
            if (value !== undefined) buffer += value
        }
        return buffer
    };
    Writer.prototype.renderSection = function renderSection(token, context, partials, originalTemplate, config) {
        var self = this;
        var buffer = "";
        var value = context.lookup(token[1]);
        function subRender(template) { return self.render(template, context, partials, config) }
        if (!value) return;
        if (isArray(value)) { for (var j = 0, valueLength = value.length; j < valueLength; ++j) { buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate, config) } } 
        else if (typeof value === "object" || typeof value === "string" || typeof value === "number") { buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate, config) } 
        else if (isFunction(value)) {
            if (typeof originalTemplate !== "string") throw new Error("Cannot use higher-order sections without the original template");
            value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);
            if (value != null) buffer += value
        } else { buffer += this.renderTokens(token[4], context, partials, originalTemplate, config) }
        return buffer
    };
    Writer.prototype.renderInverted = function renderInverted(token, context, partials, originalTemplate, config) {
        var value = context.lookup(token[1]);
        if (!value || isArray(value) && value.length === 0) return this.renderTokens(token[4], context, partials, originalTemplate, config)
    };
    Writer.prototype.indentPartial = function indentPartial(partial, indentation, lineHasNonSpace) {
        var filteredIndentation = indentation.replace(/[^ \t]/g, "");
        var partialByNl = partial.split("\n");
        for (var i = 0; i < partialByNl.length; i++) { if (partialByNl[i].length && (i > 0 || !lineHasNonSpace)) { partialByNl[i] = filteredIndentation + partialByNl[i] } }
        return partialByNl.join("\n")
    };
    Writer.prototype.renderPartial = function renderPartial(token, context, partials, config) {
        if (!partials) return;
        var tags = this.getConfigTags(config);
        var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
        if (value != null) {
            var lineHasNonSpace = token[6]; var tagIndex = token[5]; var indentation = token[4]; var indentedValue = value;
            if (tagIndex == 0 && indentation) { indentedValue = this.indentPartial(value, indentation, lineHasNonSpace) }
            var tokens = this.parse(indentedValue, tags);
            return this.renderTokens(tokens, context, partials, indentedValue, config)
        }
    };
    Writer.prototype.unescapedValue = function unescapedValue(token, context) { var value = context.lookup(token[1]); if (value != null) return value };
    Writer.prototype.escapedValue = function escapedValue(token, context, config) {
        var escape = this.getConfigEscape(config) || mustache.escape;
        var value = context.lookup(token[1]);
        if (value != null) return typeof value === "number" && escape === mustache.escape ? String(value) : escape(value)
    };
    Writer.prototype.rawValue = function rawValue(token) { return token[1] };
    Writer.prototype.getConfigTags = function getConfigTags(config) {
        if (isArray(config)) { return config } 
        else if (config && typeof config === "object") { return config.tags } 
        else { return undefined }
    };
    Writer.prototype.getConfigEscape = function getConfigEscape(config) {
        if (config && typeof config === "object" && !isArray(config)) { return config.escape } 
        else { return undefined }
    };
    var mustache = { name: "mustache.js", version: "4.1.0", tags: ["{{", "}}"], clearCache: undefined, escape: undefined, parse: undefined, render: undefined, Scanner: undefined, Context: undefined, Writer: undefined,
        set templateCache(cache) { defaultWriter.templateCache = cache },
        get templateCache() { return defaultWriter.templateCache }
    };
    var defaultWriter = new Writer;
    mustache.clearCache = function clearCache() { return defaultWriter.clearCache() };
    mustache.parse = function parse(template, tags) { return defaultWriter.parse(template, tags) };
    mustache.render = function render(template, view, partials, config) {
        if (typeof template !== "string") { throw new TypeError('Invalid template! Template should be a "string" but "' + typeStr(template) + '" was given as the first argument for mustache#render(template, view, partials)') }
        return defaultWriter.render(template, view, partials, config)
    };
    mustache.escape = escapeHtml;
    mustache.Scanner = Scanner;
    mustache.Context = Context;
    mustache.Writer = Writer;
    return mustache
});
// --- END: Mustache.js v4.1.0 ---


// workers KV
// BLOG:博客文章数据
// CONFIG:博客配置
// STATIC:博客静态文件

// AES_KEY : AES加密密钥,https://www.a-code.cc/aes.html
// AES_IV : AES加密偏移量,https://www.a-code.cc/aes.html

// 主题
const theme = "JustNews";
// github api
const githubApi = "https://api.github.com/repos/-A-RA/cf-blog-plus/contents/themes/" + theme;
// jsdelivr cdn
const cdn = "https://cdn.jsdelivr.net/gh/-A-RA/cf-blog-plus@master/themes/" + theme;

// 站点信息
let site = {
	"title": "cf-blog",
	"logo": cdn + "/files/logo.png",
	"siteName": "CF-BLOG",
	"siteDescription": "cf-blog",
	"copyRight": "Copyright © 2022",
	"keyWords": "cf-blog",
	"github": "-A-RA/cf-blog-plus",
	"theme_github_path": cdn + "/",
	"codeBeforHead": "",
	"codeBeforBody": "",
	"commentCode": "",
	"widgetOther": "",
};

addEventListener("fetch", (event) => {
	event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
	let request = event.request;
	let url = new URL(request.url);
	let pathname = url.pathname;
	let searchParams = url.searchParams;

	//首页
	if (pathname === "/" || pathname.startsWith("/page/")) {
		return await renderHTML(request, await getIndexData(request), theme + "/index.html", 200);
	}

	//文章
	else if (pathname.startsWith("/article/")) {
		let id = pathname.substring(9, pathname.lastIndexOf('/'));
		return await renderHTML(request, await getArticleData(request, id), theme + "/article.html", 200);
	}
	//分类
	else if (pathname.startsWith("/category/")) {
		let key = pathname.substring(10, pathname.lastIndexOf('/'));
		let page = 1;
		if (pathname.substring(10, pathname.length).includes("page/")) {
			key = pathname.substring(10, pathname.lastIndexOf('/page/'));
			page = pathname.substring(pathname.lastIndexOf('/page/') + 6, pathname.lastIndexOf('/'));
		}
		return await renderHTML(request, await getCategoryOrTagsData(request, "category", key, page), theme + "/index.html", 200);
	}

	//标签
	else if (pathname.startsWith("/tags/")) {
		let key = pathname.substring(6, pathname.lastIndexOf('/'));
		let page = 1;
		if (pathname.substring(6, pathname.length).includes("page/")) {
			key = pathname.substring(6, pathname.lastIndexOf('/page/'));
			page = pathname.substring(pathname.lastIndexOf('/page/') + 6, pathname.lastIndexOf('/'));
		}
		return await renderHTML(request, await getCategoryOrTagsData(request, "tags", key, page), theme + "/index.html", 200);
	}

	//后台
	else if (pathname.startsWith("/admin")) {

		// 密码正确
		if (checkPass(request)) {
			//保存文章
			if (pathname.startsWith("/admin/saveAddNew/")) {
				let jsonA = await request.json();
				let article = {};
				jsonA.forEach(function (item) {
					article[item.name] = item.value;
				});

				let id = Date.now().toString();
				article.id = id;
				article["category[]"] = JSON.parse(JSON.stringify(article["category[]"]));
				article["contentHtml"] = await aesEncrypt(article.content, await CONFIG.get("AES_KEY"), await CONFIG.get("AES_IV"));
				delete article.content;
				let articleList = JSON.parse(await BLOG.get("articleList"));
				articleList.unshift(article);
				await BLOG.put("articleList", JSON.stringify(articleList));

				let data = { "id": id, "msg": "OK" };
				return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' }});
			}

			//保存编辑
			else if (pathname.startsWith("/admin/saveEdit/")) {
				let jsonA = await request.json();
				let article = {};
				jsonA.forEach(function (item) { article[item.name] = item.value; });

				article["category[]"] = JSON.parse(JSON.stringify(article["category[]"]));
				article["contentHtml"] = await aesEncrypt(article.content, await CONFIG.get("AES_KEY"), await CONFIG.get("AES_IV"));
				delete article.content;
				let articleList = JSON.parse(await BLOG.get("articleList"));
				let id = article.id;
				const index = articleList.findIndex(item => item.id === id)
				articleList.splice(index, 1, article)

				await BLOG.put("articleList", JSON.stringify(articleList));
				let data = { "id": id, "msg": "OK" };
				return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' }});
			}

			//获取文章
			else if (pathname.startsWith("/admin/get/")) {
				let id = pathname.substring(12, pathname.lastIndexOf('/'));
				let articleList = JSON.parse(await BLOG.get("articleList"));
				let articleSingle = articleList.find(item => item.id === id);
				articleSingle.content = await aesDecrypt(articleSingle.contentHtml, await CONFIG.get("AES_KEY"), await CONFIG.get("AES_IV"));
				delete articleSingle.contentHtml;
				return new Response(JSON.stringify(articleSingle), { status: 200, headers: { 'Content-Type': 'application/json' }});
			}
			//获取文章列表
			else if (pathname.startsWith("/admin/getList/")) {
				let page = pathname.substring(15, pathname.lastIndexOf('/'));
				let articleList = JSON.parse(await BLOG.get("articleList"));
				let pageSize = 10;
				let result = articleList.slice((page - 1) * pageSize, page * pageSize)
				return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' }});
			}
			//保存配置
			else if (pathname.startsWith("/admin/saveConfig/")) {
				let jsonA = await request.json();
				let config = {};
				jsonA.forEach(function (item) { config[item.name] = item.value; });
				await CONFIG.put("WidgetCategory", config.WidgetCategory);
				await CONFIG.put("WidgetMenu", config.WidgetMenu);
				await CONFIG.put("WidgetLink", config.WidgetLink);
				let data = { "msg": "OK" };
				return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' }});
			}
			//导出
			else if (pathname.startsWith("/admin/export/")) {
				const CONFIG_keys = await CONFIG.list();
				let CONFIG_json = {};
				for (const key of CONFIG_keys.keys) { CONFIG_json[key.name] = await CONFIG.get(key.name); }
				const BLOG_keys = await BLOG.list();
				let BLOG_json = {};
				for (const key of BLOG_keys.keys) { BLOG_json[key.name] = await BLOG.get(key.name); }
				let data = { "CONFIG": CONFIG_json, "BLOG": BLOG_json, };
				return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' }});
			}
			//导入
			else if (pathname.startsWith("/admin/import/")) {
				let jsonA = await request.json();
				let config = {};
				jsonA.forEach(function (item) { config[item.name] = item.value; });
				let data = JSON.parse(config.importJson);
				for (var key in data.CONFIG) { await CONFIG.put(key, data.CONFIG[key]); }
				for (var key in data.BLOG) { await BLOG.put(key, data.BLOG[key]); }
				let returnData = { "msg": "OK" };
				return new Response(JSON.stringify(returnData), { status: 200, headers: { 'Content-Type': 'application/json' }});
			}
			//发布
			else if (pathname.startsWith("/admin/publish/")) {
				const keys = await STATIC.list();
				for (const key of keys.keys) { await STATIC.delete(key.name); }
				let data = { "msg": "OK" };
				return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' }});
			}
			//后台首页
			else {
				let data = {};
				data["widgetCategoryList"] = JSON.parse(await CONFIG.get("WidgetCategory"));
				data["widgetMenuList"] = JSON.parse(await CONFIG.get("WidgetMenu"));
				data["widgetLinkList"] = JSON.parse(await CONFIG.get("WidgetLink"));
				return await renderHTML(request, data, theme + "/admin/index.html", 200);
			}
		}
		// 密码错误
		else {
			return new Response("Not Found", { status: 404 });
		}
	}

	// sitemap
	else if (pathname.startsWith("/sitemap.xml")) {
		let articleList = JSON.parse(await BLOG.get("articleList"));
		let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"><url><loc>`+ request.url.substring(0, request.url.length - 11) + `</loc><lastmod>`+ new Date().toISOString() + `</lastmod><priority>1.00</priority></url>`;
		for (const item of articleList) {
			xml += `<url><loc>`+ request.url.substring(0, request.url.length - 11) + `/article/` + item.id + `/` + item.link + `</loc><lastmod>`+ new Date(item.createDate).toISOString() + `</lastmod><changefreq>`+ item.changefreq + `</changefreq><priority>`+ item.priority + `</priority></url>`;
		}
		xml += `</urlset>`;
		return new Response(xml, { status: 200, headers: { 'Content-Type': 'application/xml;charset=UTF-8' }});
	}

	// --- BEGIN: 新增的评论和轮播API路由 ---
	// --- 评论 API ---
	else if (pathname.startsWith('/api/comments/') && !pathname.includes('all') && request.method === 'GET') {
		const articleSlug = pathname.split('/')[3];
		const comments = await env.COMMENTS_KV.get(articleSlug, { type: 'json' }) || [];
		return new Response(JSON.stringify(comments), { headers: { 'Content-Type': 'application/json' } });
	}
	else if (pathname.startsWith('/api/comments/') && request.method === 'POST') {
		try {
			const articleSlug = pathname.split('/')[3];
			let newComment = await request.json();
			if(!newComment.content || newComment.content.trim() === '') { return new Response('评论内容不能为空', { status: 400 }); }
			const comments = await env.COMMENTS_KV.get(articleSlug, { type: 'json' }) || [];
			newComment.id = crypto.randomUUID();
			newComment.timestamp = Date.now();
			comments.push(newComment);
			await env.COMMENTS_KV.put(articleSlug, JSON.stringify(comments));
			return new Response(JSON.stringify(newComment), { status: 201, headers: { 'Content-Type': 'application/json' } });
		} catch (e) {
			return new Response(e.message, { status: 500 });
		}
	}
	else if (pathname.startsWith('/api/comments/') && request.method === 'DELETE') {
		const [_a, _b, _c, articleSlug, commentId] = pathname.split('/');
		let comments = await env.COMMENTS_KV.get(articleSlug, { type: 'json' }) || [];
		const updatedComments = comments.filter(c => c.id !== commentId);
		await env.COMMENTS_KV.put(articleSlug, JSON.stringify(updatedComments));
		return new Response('评论已删除', { status: 200 });
	}
	else if (pathname === '/api/comments_all' && request.method === 'GET') {
		const allKeys = await env.COMMENTS_KV.list();
		let allComments = [];
		for (const key of allKeys.keys) {
			const comments = await env.COMMENTS_KV.get(key.name, { type: 'json' });
			if (comments) {
				comments.forEach(c => allComments.push({ ...c, articleSlug: key.name }));
			}
		}
		allComments.sort((a, b) => b.timestamp - a.timestamp);
		return new Response(JSON.stringify(allComments), { headers: { 'Content-Type': 'application/json' } });
	}
	
	// --- 轮播图 API ---
	else if (pathname === '/api/carousel' && request.method === 'GET') {
		const slides = await env.CAROUSEL_KV.get('slides', { type: 'json' }) || [];
		return new Response(JSON.stringify(slides), { headers: { 'Content-Type': 'application/json' } });
	}
	else if (pathname === '/api/carousel' && request.method === 'POST') {
		try {
			const newSlide = await request.json();
			if (!newSlide.imageUrl || !newSlide.linkUrl) { return new Response('URL不能为空', { status: 400 }); }
			const slides = await env.CAROUSEL_KV.get('slides', { type: 'json' }) || [];
			newSlide.id = crypto.randomUUID();
			slides.push(newSlide);
			await env.CAROUSEL_KV.put('slides', JSON.stringify(slides));
			return new Response(JSON.stringify(newSlide), { status: 201 });
		} catch (e) {
			return new Response(e.message, { status: 500 });
		}
	}
	else if (pathname.startsWith('/api/carousel/') && request.method === 'DELETE') {
		const slideId = pathname.split('/').pop();
		let slides = await env.CAROUSEL_KV.get('slides', { type: 'json' }) || [];
		const updatedSlides = slides.filter(s => s.id !== slideId);
		await env.CAROUSEL_KV.put('slides', JSON.stringify(updatedSlides));
		return new Response('轮播图已删除', { status: 200 });
	}
	// --- END: 新增的评论和轮播API路由 ---

	//静态文件
	else {
		return await getStaticFile(request, event);
	}
}

/**
 * 检查密码
 * @param {*} request
 * @returns
 */
function checkPass(request) {
	let cookie = request.headers.get("cookie");
	let isPass = false;
	if (cookie != null) {
		let cookies = {};
		cookie.split(';').forEach(function (l) {
			let parts = l.split('=');
			cookies[parts.shift().trim()] = decodeURI(parts.join('='));
		});
		if (cookies["password"] == password)
			isPass = true;
	}
	return isPass;
}

/**
 * 获取静态文件
 * @param {*} request
 * @param {*} event
 * @returns
 */
async function getStaticFile(request, event) {
	let response = await STATIC.get(request.url, { type: "stream", cacheTtl: 86400 });
	if (response === null) {
		let url = request.url.replace(new URL(request.url).origin, cdn);
		let response = await fetch(url);
		if (response.status == 200) {
			// event.waitUntil(STATIC.put(request.url, response.clone().body));
			return response;
		} else {
			return new Response("Not Found", { status: 404 });
		}
	}
	return new Response(response, { status: 200 });
}

/**
 * 渲染html
 * @param {*} request
 * @param {*} data
 * @param {*} path
 * @param {*} status
 * @returns
 */
async function renderHTML(request, data, path, status) {
	const body = await render(data, path);
	let response = new Response(body, {
		status: status,
		headers: { "Content-Type": "text/html;charset=UTF-8" },
	});
	// event.waitUntil(STATIC.put(request.url, response.clone().body));
	return response;
}

/**
 * 渲染 (已用 Mustache.js 替换)
 * @param {*} data
 * @param {*} template_path
 * @returns
 */
async function render(data, template_path) {
	let templateResponse = await fetch(githubApi + "/" + template_path, {
		headers: {
			'User-Agent': "cf-blog"
		}
	});
	let templateJson = await templateResponse.json();
	let template = atob(templateJson.content);

	for (var key in site) {
		data[key] = site[key];
	}

	// 使用 Mustache.js 进行渲染
	return Mustache.render(template, data);
}


/**
 * aes加密
 * @param {*} data
 * @param {*} key
 * @param {*} iv
 * @returns
 */
async function aesEncrypt(data, key, iv) {
	const encodedData = new TextEncoder().encode(data);
	const encodedKey = new TextEncoder().encode(key);
	const encodedIv = new TextEncoder().encode(iv);
	const cryptoKey = await crypto.subtle.importKey('raw', encodedKey, { name: 'AES-CBC' }, false, ['encrypt']);
	const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: encodedIv }, cryptoKey, encodedData);
	const buffer = new Uint8Array(encrypted);
	return btoa(String.fromCharCode.apply(null, buffer));
}

/**
 * aes解密
 * @param {*} data
 * @param {*} key
 * @param {*} iv
 * @returns
 */
async function aesDecrypt(data, key, iv) {
	const buffer = Uint8Array.from(atob(data), c => c.charCodeAt(0));
	const encodedKey = new TextEncoder().encode(key);
	const encodedIv = new TextEncoder().encode(iv);
	const cryptoKey = await crypto.subtle.importKey('raw', encodedKey, { name: 'AES-CBC' }, false, ['decrypt']);
	const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: encodedIv }, cryptoKey, buffer);
	return new TextDecoder().decode(decrypted);
}

/**
 * 获取博客首页数据
 * @param {*} request
 * @returns
 */
async function getIndexData(request) {
	let url = new URL(request.url);
	let pathname = url.pathname;
	let page = 1;
	if (pathname.startsWith("/page/")) {
		page = pathname.substring(6, pathname.lastIndexOf('/'));
	}

	let articleList = JSON.parse(await BLOG.get("articleList"));
	let pageSize = 10;
	let result = articleList.slice((page - 1) * pageSize, page * pageSize)
	for (const item of result) {
		item.url = "/article/" + item.id + "/" + item.link + "/";
		item.createDate10 = item.createDate.substring(0, 10);
		item.contentHtml = await aesDecrypt(item.contentHtml, await CONFIG.get("AES_KEY"), await CONFIG.get("AES_IV"));
		item.contentText = item.contentHtml.replace(/<[^>]+>/g, "").substring(0, 100);
	}
	let data = {};
	data["title"] = site.siteName;
	data["keyWords"] = site.keyWords;

	data["articleList"] = result;
	//分页
	if (page > 1)
		data["pageNewer"] = { "url": "/page/" + (page - 1) + "/", "title": "上一页" };
	if (articleList.length > page * pageSize)
		data["pageOlder"] = { "url": "/page/" + (parseInt(page) + 1) + "/", "title": "下一页" };

	data["widgetCategoryList"] = JSON.parse(await CONFIG.get("WidgetCategory"));
	data["widgetMenuList"] = JSON.parse(await CONFIG.get("WidgetMenu"));
	data["widgetLinkList"] = JSON.parse(await CONFIG.get("WidgetLink"));

	let widgetRecentlyList = JSON.parse(await BLOG.get("articleList"));
	widgetRecentlyList = widgetRecentlyList.slice(0, 5)
	for (const item of widgetRecentlyList) {
		item.url = "/article/" + item.id + "/" + item.link + "/";
		item.createDate10 = item.createDate.substring(0, 10);
	}
	data["widgetRecentlyList"] = widgetRecentlyList;
	return data;

}

/**
 * 获取文章数据
 * @param {*} request
 * @param {*} id
 * @returns
 */
async function getArticleData(request, id) {
	let data = {};
	let articleList = JSON.parse(await BLOG.get("articleList"));
	let articleSingle = articleList.find(item => item.id === id);
	articleSingle.url = "/article/" + articleSingle.id + "/" + articleSingle.link + "/";
	articleSingle.createDate10 = articleSingle.createDate.substring(0, 10);
	articleSingle.contentHtml = await aesDecrypt(articleSingle.contentHtml, await CONFIG.get("AES_KEY"), await CONFIG.get("AES_IV"));

	data["articleSingle"] = articleSingle;
	data["title"] = articleSingle.title;
	data["keyWords"] = articleSingle.tags;

	const index = articleList.findIndex(item => item.id === id)
	if (index > 0) {
		let articleNewer = articleList[index - 1];
		data["articleNewer"] = { "img": articleNewer.img, "url": "/article/" + articleNewer.id + "/" + articleNewer.link + "/", "title": articleNewer.title, "createDate10": articleNewer.createDate.substring(0, 10), };
	}
	if (index < articleList.length - 1) {
		let articleOlder = articleList[index + 1];
		data["articleOlder"] = { "img": articleOlder.img, "url": "/article/" + articleOlder.id + "/" + articleOlder.link + "/", "title": articleOlder.title, "createDate10": articleOlder.createDate.substring(0, 10), };
	}

	data["widgetCategoryList"] = JSON.parse(await CONFIG.get("WidgetCategory"));
	data["widgetMenuList"] = JSON.parse(await CONFIG.get("WidgetMenu"));
	data["widgetLinkList"] = JSON.parse(await CONFIG.get("WidgetLink"));
	let widgetRecentlyList = JSON.parse(await BLOG.get("articleList"));
	widgetRecentlyList = widgetRecentlyList.slice(0, 5)
	for (const item of widgetRecentlyList) {
		item.url = "/article/" + item.id + "/" + item.link + "/";
		item.createDate10 = item.createDate.substring(0, 10);
	}
	data["widgetRecentlyList"] = widgetRecentlyList;

	return data;
}

/**
 * 获取分类/标签数据
 * @param {*} request
 * @param {*} type
 * @param {*} key
 * @param {*} page
 * @returns
 */
async function getCategoryOrTagsData(request, type, key, page) {
	let articleList = JSON.parse(await BLOG.get("articleList"));
	let result = [];
	for (const item of articleList) {
		if (type == "category") {
			if (item["category[]"].includes(decodeURI(key))) { result.push(item); }
		} else {
			if (item.tags.includes(decodeURI(key))) { result.push(item); }
		}
	}
	let pageSize = 10;
	let resultPage = result.slice((page - 1) * pageSize, page * pageSize)
	for (const item of resultPage) {
		item.url = "/article/" + item.id + "/" + item.link + "/";
		item.createDate10 = item.createDate.substring(0, 10);
		item.contentHtml = await aesDecrypt(item.contentHtml, await CONFIG.get("AES_KEY"), await CONFIG.get("AES_IV"));
		item.contentText = item.contentHtml.replace(/<[^>]+>/g, "").substring(0, 100);
	}
	let data = {};
	data["title"] = key;
	data["keyWords"] = key;

	data["articleList"] = resultPage;
	//分页
	if (page > 1)
		data["pageNewer"] = { "url": "/" + type + "/" + key + "/page/" + (page - 1) + "/", "title": "上一页" };
	if (result.length > page * pageSize)
		data["pageOlder"] = { "url": "/" + type + "/" + key + "/page/" + (parseInt(page) + 1) + "/", "title": "下一页" };

	data["widgetCategoryList"] = JSON.parse(await CONFIG.get("WidgetCategory"));
	data["widgetMenuList"] = JSON.parse(await CONFIG.get("WidgetMenu"));
	data["widgetLinkList"] = JSON.parse(await CONFIG.get("WidgetLink"));

	let widgetRecentlyList = JSON.parse(await BLOG.get("articleList"));
	widgetRecentlyList = widgetRecentlyList.slice(0, 5)
	for (const item of widgetRecentlyList) {
		item.url = "/article/" + item.id + "/" + item.link + "/";
		item.createDate10 = item.createDate.substring(0, 10);
	}
	data["widgetRecentlyList"] = widgetRecentlyList;

	return data;
}