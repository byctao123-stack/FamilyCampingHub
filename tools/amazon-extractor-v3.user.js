// ==UserScript==
// @name         Amazon Product Extractor v3
// @namespace    https://camping-hub.local
// @version      3.0
// @description  采集 Amazon 产品基本信息 + 关于此商品（纯文字），弹窗展示并一键复制
// @author       Michael
// @match        https://www.amazon.com/dp/*
// @match        https://www.amazon.com/gp/product/*
// @match        https://www.amazon.com/*/dp/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    injectStyles();
    setTimeout(init, 3000);

    function injectStyles() {
        if (document.getElementById('ext-v3-css')) return;
        var s = document.createElement('style');
        s.id = 'ext-v3-css';
        s.textContent = '#ext-panel{position:fixed;top:10px;right:10px;width:500px;max-height:85vh;z-index:999999;font:13px/1.4 Segoe UI,Arial,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.3);border-radius:8px;overflow:hidden;display:flex;flex-direction:column}#ext-hd{background:linear-gradient(135deg,#232f3e,#37475a);color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}#ext-hd b{font-size:15px}#ext-hd button{background:0 0;border:0;color:#fff;font-size:18px;cursor:pointer}#ext-body{background:#fff;padding:14px;overflow-y:auto;flex:1}.ext-sec{margin-bottom:10px}.ext-sec b{color:#232f3e;display:block;margin-bottom:4px}.ext-kv{width:100%;border-collapse:collapse}.ext-kv td{padding:3px 6px;font-size:13px;vertical-align:top}.ext-kv .k{color:#565959;width:80px}.ext-kv .v{color:#333}.ext-kv .price{color:#B12704;font-weight:700}.ext-tech{width:100%;border-collapse:collapse;border:1px solid #e7e7e7;margin-top:4px}.ext-tech td{padding:4px 8px;border:1px solid #e7e7e7;font-size:12px;color:#333}.ext-tech .tk{background:#f7f7f7;width:40%}.ext-box{background:#f9f9f9;padding:8px;border-radius:4px;margin-top:4px;font-size:12px;color:#333;max-height:200px;overflow-y:auto;white-space:pre-wrap;word-break:break-word}#ext-btns{display:flex;gap:6px;padding:10px;background:#f0f0f0;border-top:1px solid #ddd;flex-wrap:wrap}#ext-btns button{flex:1 1 40%;padding:8px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600}#ext-btn-json{background:#FFD814;border:1px solid #F0C14B}#ext-btn-txt{background:#fff;border:1px solid #ccc}#ext-toggle{position:fixed;top:10px;right:10px;z-index:999998;width:52px;height:52px;border-radius:50%;background:#FFD814;border:1px solid #F0C14B;font-size:20px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2)}.ext-url{font-size:11px;color:#888;margin-top:6px;word-break:break-all}';
        document.head.appendChild(s);
    }

    function extractData() {
        var d = {};
        d.title = txt('#productTitle');
        d.brand = cleanBrand();
        d.price = cleanPrice();
        d.rating = txt('#acrPopover .a-icon-alt') || txt('#averageCustomerReviews .a-icon-alt');
        d.reviewCount = txt('#acrCustomerReviewText');
        d.asin = findAsin();
        d.keyFeatures = extractBullets();
        d.technicalDetails = extractTechDetails();
        d.aboutItem = extractAboutItem();
        d.url = location.href;
        return d;
    }

    function txt(sel) {
        var el = document.querySelector(sel);
        return el ? el.textContent.trim() : '';
    }

    function cleanBrand() {
        var sels = ['#bylineInfo', '.po-brand .po-break-word', '#brand', '[data-feature-name="bylineInfo"]'];
        for (var i = 0; i < sels.length; i++) {
            var el = document.querySelector(sels[i]);
            if (!el) continue;
            var t = el.textContent.trim().replace(/^Visit the\s+/i, '').replace(/\s+Store$/i, '').replace(/^Brand:\s*/i, '');
            if (t.length > 1 && t.length < 80) return t;
        }
        return '';
    }

    function cleanPrice() {
        var w = document.querySelector('.a-price-whole');
        var f = document.querySelector('.a-price-fraction');
        if (!w) return '';
        var p = w.textContent.trim().replace(/[^0-9]/g, '');
        if (f) p += '.' + f.textContent.trim();
        return '$' + p;
    }

    function findAsin() {
        var m = location.pathname.match(/\/dp\/([A-Z0-9]{10})/) || location.pathname.match(/\/product\/([A-Z0-9]{10})/);
        if (m) return m[1];
        var el = document.querySelector('#ASIN, input[name="ASIN"]');
        return el ? (el.value || el.textContent).trim() : '';
    }

    function extractBullets() {
        var sels = ['#feature-bullets', '#productOverview_feature_div', '[data-feature-name="product-highlights"]'];
        for (var i = 0; i < sels.length; i++) {
            var c = document.querySelector(sels[i]);
            if (!c) continue;
            var items = c.querySelectorAll('li');
            var bullets = [];
            for (var j = 0; j < items.length; j++) {
                var t = items[j].textContent.trim();
                if (t.length > 5 && t.indexOf('{') === -1 && t.indexOf('function') === -1) bullets.push(t);
            }
            if (bullets.length > 0) return bullets.slice(0, 10);
        }
        return [];
    }

    function extractTechDetails() {
        var sels = ['#productDetails_techSpec_section_1', '#productDetails_detailBullets_sections1', '#detailBullets_feature_div', 'table.a-keyvalue'];
        for (var i = 0; i < sels.length; i++) {
            var c = document.querySelector(sels[i]);
            if (!c) continue;
            var rows = c.querySelectorAll('tr');
            var obj = {}, found = 0;
            for (var j = 0; j < rows.length; j++) {
                var th = rows[j].querySelector('th'), td = rows[j].querySelector('td');
                if (th && td) {
                    var k = th.textContent.trim().replace(/:$/, ''), v = td.textContent.trim();
                    if (k && v && v.length > 1) { obj[k] = v; found++; }
                }
            }
            if (found > 0) return obj;
        }
        return {};
    }

    function extractAboutItem() {
        var sels = ['#aplus_feature_div', '#aplus3p_feature_div', '#aplus_feature_deck', '#aplus'];
        for (var i = 0; i < sels.length; i++) {
            var c = document.querySelector(sels[i]);
            if (!c) continue;
            var walker = document.createTreeWalker(c, NodeFilter.SHOW_TEXT, {
                acceptNode: function(n) {
                    var p = n.parentElement;
                    if (!p) return NodeFilter.FILTER_REJECT;
                    var tag = p.tagName.toLowerCase();
                    if (tag === 'style' || tag === 'script' || tag === 'img') return NodeFilter.FILTER_REJECT;
                    var cls = (p.className || '').toLowerCase();
                    if (cls.indexOf('video') > -1 || cls.indexOf('player') > -1) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            });
            var parts = [], seen = {}, node;
            while (node = walker.nextNode()) {
                var t = node.textContent.trim();
                if (t.length < 4 || isNoise(t) || seen[t]) continue;
                seen[t] = 1; parts.push(t);
            }
            var result = stripHtml(parts.join('\n')).substring(0, 3000);
            if (result.length > 50) return result;
        }
        return '';
    }

    function isNoise(t) {
        if (t.length < 3) return true;
        // HTML tags - broad match
        if (t.indexOf('<') > -1 && t.indexOf('>') > -1) return true;
        // Timestamps like 0:00, 0:15, 1:23
        if (/^\d+:\d+/.test(t)) return true;
        // Percentages like 20.02%
        if (/^[\d.]+%/.test(t)) return true;
        // Starts with comma or special char
        if (/^[,;:!?.\s]/.test(t)) return true;
        // Video/player keywords (case-insensitive partial match)
        var lower = t.toLowerCase();
        var noise = ['video player', 'click to play', 'playback rate', 'current time', 'fullscreen', 'stream type', 'seek to live', 'remaining time', 'audio track', 'loaded', 'duration', 'previous page', 'next page', 'from the manufacturer', 'descriptions off', 'captions off', 'default', 'selected', 'behind live', 'type live', 'function(', 'window.', 'ue.track'];
        for (var i = 0; i < noise.length; i++) { if (lower.indexOf(noise[i]) > -1) return true; }
        // Single short words that are video controls
        if (t.length < 6 && /^(play|mute|live|stop|pause|seek)$/i.test(t)) return true;
        // CSS property lines
        if (/[;{}]\s*$/.test(t) && /\w+:\s*[^,;]+/.test(t)) return true;
        // Pure symbols/numbers
        if (/^[^a-zA-Z]*$/.test(t)) return true;
        return false;
    }

    function stripHtml(text) { return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }


    function init() {
        showPanel();
        if (!window._extV3Key) {
            window._extV3Key = function(e) {
                if (e.ctrlKey && e.shiftKey && e.key === 'X') {
                    e.preventDefault();
                    var p = document.getElementById('ext-panel');
                    if (p) p.style.display = 'flex'; else showPanel();
                }
            };
            document.addEventListener('keydown', window._extV3Key);
        }
    }

    function showPanel() {
        var data = extractData();
        var old = document.getElementById('ext-panel'); if (old) old.remove();
        var oldT = document.getElementById('ext-toggle'); if (oldT) oldT.remove();

        var panel = document.createElement('div'); panel.id = 'ext-panel';
        var hd = document.createElement('div'); hd.id = 'ext-hd';
        var ttl = document.createElement('b'); ttl.textContent = '\uD83D\uDCE6 Amazon Extractor v3';
        var cls = document.createElement('button'); cls.textContent = '\u2715';
        cls.onclick = function() { panel.remove(); showToggle(); };
        hd.appendChild(ttl); hd.appendChild(cls);

        var body = document.createElement('div'); body.id = 'ext-body';

        addSec(body, '\uD83D\uDCCB', 'Basic Info', function(s) {
            addKV(s, [['Title', data.title], ['Brand', data.brand], ['Price', data.price, 'price'], ['Rating', data.rating ? data.rating + ' ' + data.reviewCount : ''], ['ASIN', data.asin]]);
        });

        if (data.keyFeatures.length) {
            addSec(body, '\u2728', 'Key Features', function(s) {
                var ul = document.createElement('ul'); ul.style.cssText = 'margin:4px 0 0 16px;padding:0;color:#333';
                data.keyFeatures.forEach(function(f) { var li = document.createElement('li'); li.textContent = f; li.style.marginBottom = '2px'; ul.appendChild(li); });
                s.appendChild(ul);
            });
        }

        if (Object.keys(data.technicalDetails).length) {
            addSec(body, '\u2699\uFE0F', 'Technical Details', function(s) {
                var tbl = document.createElement('table'); tbl.className = 'ext-tech';
                for (var k in data.technicalDetails) {
                    var tr = document.createElement('tr');
                    var td1 = document.createElement('td'); td1.className = 'tk'; td1.textContent = k;
                    var td2 = document.createElement('td'); td2.textContent = data.technicalDetails[k];
                    tr.appendChild(td1); tr.appendChild(td2); tbl.appendChild(tr);
                }
                s.appendChild(tbl);
            });
        }

        if (data.aboutItem) {
            addSec(body, '\uD83D\uDCCC', 'About This Item', function(s) {
                var box = document.createElement('div'); box.className = 'ext-box';
                box.textContent = stripHtml(data.aboutItem).substring(0, 2000); s.appendChild(box);
            });
        }


        var urlDiv = document.createElement('div'); urlDiv.className = 'ext-url';
        urlDiv.textContent = 'URL: ' + data.url; body.appendChild(urlDiv);

        var btns = document.createElement('div'); btns.id = 'ext-btns';
        var jsonBtn = document.createElement('button'); jsonBtn.id = 'ext-btn-json';
        jsonBtn.textContent = '\uD83D\uDCCB Copy JSON';
        jsonBtn.onclick = function() { copyTo(JSON.stringify(data, null, 2), jsonBtn); };
        var txtBtn = document.createElement('button'); txtBtn.id = 'ext-btn-txt';
        txtBtn.textContent = '\uD83D\uDCC4 Copy Text';
        txtBtn.onclick = function() { copyTo(toText(data), txtBtn); };
        btns.appendChild(jsonBtn); btns.appendChild(txtBtn);

        panel.appendChild(hd); panel.appendChild(body); panel.appendChild(btns);
        document.body.appendChild(panel);
        showToggle();
    }

    function addSec(parent, icon, label, fn) {
        var sec = document.createElement('div'); sec.className = 'ext-sec';
        var b = document.createElement('b'); b.textContent = icon + ' ' + label;
        sec.appendChild(b); fn(sec); parent.appendChild(sec);
    }

    function addKV(sec, rows) {
        var tbl = document.createElement('table'); tbl.className = 'ext-kv';
        rows.forEach(function(r) {
            if (!r[1]) return;
            var tr = document.createElement('tr');
            var td1 = document.createElement('td'); td1.className = 'k'; td1.textContent = r[0] + ':';
            var td2 = document.createElement('td'); td2.className = r[2] || 'v'; td2.textContent = r[1];
            tr.appendChild(td1); tr.appendChild(td2); tbl.appendChild(tr);
        });
        sec.appendChild(tbl);
    }

    function showToggle() {
        if (document.getElementById('ext-toggle')) return;
        var btn = document.createElement('button'); btn.id = 'ext-toggle';
        btn.textContent = '\uD83D\uDCE6'; btn.title = 'Show Extractor (Ctrl+Shift+X)';
        btn.onclick = function() { btn.remove(); var p = document.getElementById('ext-panel'); if (p) p.style.display = 'flex'; else showPanel(); };
        document.body.appendChild(btn);
    }

    function toText(d) {
        var t = '=== ' + (d.title || 'Product') + ' ===\n\n';
        if (d.brand) t += 'Brand: ' + d.brand + '\n';
        if (d.price) t += 'Price: ' + d.price + '\n';
        if (d.rating) t += 'Rating: ' + d.rating + ' (' + d.reviewCount + ')\n';
        if (d.asin) t += 'ASIN: ' + d.asin + '\n';
        t += 'URL: ' + d.url + '\n\n';
        if (d.keyFeatures.length) { t += '--- Key Features ---\n'; d.keyFeatures.forEach(function(f) { t += '- ' + f + '\n'; }); t += '\n'; }
        if (Object.keys(d.technicalDetails).length) { t += '--- Technical Details ---\n'; for (var k in d.technicalDetails) t += k + ': ' + d.technicalDetails[k] + '\n'; t += '\n'; }
        if (d.aboutItem) t += '--- About This Item ---\n' + stripHtml(d.aboutItem).substring(0, 2000) + '\n\n';
        return t;
    }

    function copyTo(text, btn) {
        try { navigator.clipboard.writeText(text).then(function() { flash(btn); }).catch(function() { fallbackCopy(text, btn); }); }
        catch(e) { fallbackCopy(text, btn); }
    }
    function fallbackCopy(text, btn) {
        var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); flash(btn);
    }
    function flash(btn) { var orig = btn.textContent; btn.textContent = '\u2705 Copied!'; setTimeout(function() { btn.textContent = orig; }, 2000); }
})();
