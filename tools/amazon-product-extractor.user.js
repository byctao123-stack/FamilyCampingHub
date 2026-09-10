// ==UserScript==
// @name         Amazon Product Data Extractor
// @namespace    https://camping-hub.local
// @version      2.0
// @description  从 Amazon 产品页提取关键数据，便于导出给 AI 写评测文章
// @author       Michael
// @match        https://www.amazon.com/dp/*
// @match        https://www.amazon.com/gp/product/*
// @match        https://www.amazon.com/*/dp/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // Inject CSS first
    injectStyles();

    // Wait for Amazon's dynamic content to render
    setTimeout(showPanel, 2000);

    // Also try again after longer delay in case first attempt misses lazy-loaded content
    setTimeout(showPanel, 6000);

    function injectStyles() {
        if (document.getElementById('extractor-styles')) return;
        const style = document.createElement('style');
        style.id = 'extractor-styles';
        style.textContent = `
            #amazon-extractor-panel {
                position: fixed !important; top: 10px !important; right: 10px !important;
                width: 480px !important; max-height: 85vh !important; z-index: 999999 !important;
                font-family: 'Segoe UI', Arial, sans-serif !important; font-size: 13px !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important; border-radius: 8px !important;
                overflow: hidden !important; display: flex !important; flex-direction: column !important;
            }
            #extractor-header {
                background: linear-gradient(135deg, #232f3e, #37475a) !important; color: #fff !important;
                padding: 14px 18px !important; display: flex !important; justify-content: space-between !important; align-items: center !important;
            }
            #extractor-content {
                background: #fff !important; padding: 16px !important; overflow-y: auto !important; flex: 1 !important;
            }
            #extractor-btns {
                display: flex !important; gap: 8px !important; padding: 12px 16px !important;
                background: #f0f0f0 !important; border-top: 1px solid #ddd !important;
            }
            #extractor-btns button {
                flex: 1 !important; padding: 10px !important; border-radius: 4px !important;
                cursor: pointer !important; font-size: 13px !important; font-weight: 600 !important;
            }
            #btn-copy-json { background: #FFD814 !important; border: 1px solid #F0C14B !important; }
            #btn-copy-text { background: #fff !important; border: 1px solid #ccc !important; }
            #extractor-toggle {
                position: fixed !important; top: 10px !important; right: 10px !important; z-index: 999998 !important;
                width: 48px !important; height: 48px !important; border-radius: 50% !important;
                background: #FFD814 !important; border: 1px solid #F0C14B !important; font-size: 22px !important;
                cursor: pointer !important; box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
            }
            .ext-section { margin-bottom: 12px !important; }
            .ext-section strong { color: #232f3e !important; }
            .ext-table { width: 100% !important; border-collapse: collapse !important; margin-top: 4px !important; }
            .ext-table td { padding: 3px 8px !important; font-size: 13px !important; }
            .ext-label { color: #565959 !important; width: 80px !important; vertical-align: top !important; }
            .ext-tech-table { width: 100% !important; border-collapse: collapse !important; margin-top: 4px !important; border: 1px solid #e7e7e7 !important; }
            .ext-tech-table td { padding: 4px 8px !important; border: 1px solid #e7e7e7 !important; font-size: 12px !important; color: #333 !important; }
            .ext-tech-key { background: #f7f7f7 !important; width: 40% !important; }
            .ext-desc-box {
                background: #f9f9f9 !important; padding: 8px !important; border-radius: 4px !important; margin-top: 4px !important;
                font-size: 12px !important; color: #333 !important; max-height: 150px !important; overflow-y: auto !important;
                white-space: pre-wrap !important; word-break: break-word !important;
            }
            .ext-img { max-width: 100% !important; height: auto !important; border: 1px solid #ddd !important; border-radius: 4px !important; margin-bottom: 4px !important; display: block !important; }
            .ext-close { background: none !important; border: none !important; color: #fff !important; font-size: 20px !important; cursor: pointer !important; padding: 0 4px !important; }
            .ext-url { font-size: 11px !important; color: #888 !important; margin-top: 8px !important; word-break: break-all !important; }
        `;
        document.head.appendChild(style);
    }

    function st(el) { return el ? el.textContent.trim() : ''; }

    function extractAllData() {
        const data = {};

        // Title
        data.title = st(document.querySelector('#productTitle'));

        // Brand
        data.brand = st(document.querySelector('#bylineInfo'))
            .replace(/^Visit the\s+/i, '').replace(/\s+Store$/i, '').trim();

        // Price
        const pw = document.querySelector('.a-price-whole');
        const pf = document.querySelector('.a-price-fraction');
        if (pw) {
            let p = st(pw).replace(/[^0-9]/g, '');
            if (pf) p += '.' + st(pf).trim();
            data.price = '$' + p;
        }

        // Rating
        data.rating = st(document.querySelector('#acrPopover span.a-icon-alt, #averageCustomerReviews .a-icon-alt'));

        // Review count
        data.reviewCount = st(document.querySelector('#acrCustomerReviewText'));

        // Bullet points - try multiple selectors
        data.keyFeatures = [];
        const bulletSelectors = [
            '#feature-bullets', '#productOverview_feature_div',
            'div[data-feature-name="product-highlights"]',
            '#summaryBullets_feature_div', '#productSummary'
        ];
        for (const sel of bulletSelectors) {
            const container = document.querySelector(sel);
            if (!container) continue;
            const items = container.querySelectorAll('li.a-spacing-mini, li');
            if (items.length > 0) {
                data.keyFeatures = Array.from(items)
                    .map(li => st(li))
                    .filter(t => t.length > 5 && !t.includes('{') && !t.includes('function'))
                    .slice(0, 10);
                if (data.keyFeatures.length > 0) break;
            }
        }

        // Technical details - try multiple selectors
        data.technicalDetails = {};
        const techSelectors = [
            '#productDetails_techSpec_section_1',
            '#productDetails_detailBullets_sections1',
            '#detailBullets_feature_div',
            '#detailBulletsWrapper_feature_div',
            'table.a-keyvalue'
        ];
        for (const sel of techSelectors) {
            const container = document.querySelector(sel);
            if (!container) continue;
            const rows = container.querySelectorAll('tr');
            let found = 0;
            rows.forEach(row => {
                const th = row.querySelector('th');
                const td = row.querySelector('td');
                if (th && td) {
                    const key = st(th).replace(/:$/, '').trim();
                    const value = st(td).trim();
                    if (key && value && value.length > 1) { data.technicalDetails[key] = value; found++; }
                }
            });
            if (found > 0) break;
            // Try list format
            const items = container.querySelectorAll('li');
            items.forEach(li => {
                const text = st(li);
                const idx = text.indexOf(':');
                if (idx > 0 && idx < 80) {
                    const key = text.substring(0, idx).trim();
                    const value = text.substring(idx + 1).trim();
                    if (key && value) data.technicalDetails[key] = value;
                }
            });
            if (Object.keys(data.technicalDetails).length > 0) break;
        }

        // Description
        const descEl = document.querySelector('#productDescription_feature_div') || document.querySelector('#productDescription');
        if (descEl) {
            // Filter out style/script content
            const parts = [];
            descEl.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const t = node.textContent.trim();
                    if (t.length > 15) parts.push(t);
                } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'STYLE' && node.tagName !== 'SCRIPT') {
                    const t = st(node).trim();
                    if (t.length > 15 && !t.includes('{')) parts.push(t);
                }
            });
            data.description = parts.join('\n\n').substring(0, 2000);
        }

        // About This Item
        const aboutEl = document.querySelector('#aplus_feature_div, #aplus3p_feature_div, #aplus_feature_deck');
        if (aboutEl) {
            const t = st(aboutEl);
            // Filter CSS/JS
            const lines = t.split('\n').filter(l => !l.includes('{') && !l.includes('}') && !l.includes('function') && l.trim().length > 3);
            data.aboutThisItem = lines.join('\n').trim().substring(0, 3000);
        }

        // Images
        data.images = [];
        const seen = new Set();
        document.querySelectorAll('#altImages img, #landingImage').forEach(img => {
            let src = img.getAttribute('data-old-hires') || img.src || '';
            src = src.replace(/_SX\d+_/, '_SX1500_').replace(/_SY\d+_/, '_SY1500_');
            if (src && !seen.has(src) && !src.includes('sprite') && !src.includes('gif')) {
                seen.add(src);
                data.images.push(src);
            }
        });
        data.images = data.images.slice(0, 8);

        // ASIN
        const asinMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
        data.asin = asinMatch ? asinMatch[1] : '';

        // URL
        data.url = window.location.href;

        return data;
    }

    function showPanel() {
        const data = extractAllData();

        // Remove old panel/toggle
        const old = document.getElementById('amazon-extractor-panel');
        if (old) old.remove();
        const oldToggle = document.getElementById('extractor-toggle');
        if (oldToggle) oldToggle.remove();

        // Build panel
        const panel = document.createElement('div');
        panel.id = 'amazon-extractor-panel';

        // Header
        const header = document.createElement('div');
        header.id = 'extractor-header';
        const titleSpan = document.createElement('strong');
        titleSpan.style.fontSize = '15px';
        titleSpan.textContent = '📦 Amazon Product Extractor';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'ext-close';
        closeBtn.textContent = '✕';
        closeBtn.onclick = () => { panel.remove(); showToggleBtn(); };
        header.appendChild(titleSpan);
        header.appendChild(closeBtn);

        // Content
        const content = document.createElement('div');
        content.id = 'extractor-content';

        function addSection(icon, labelText) {
            const sec = document.createElement('div');
            sec.className = 'ext-section';
            const lbl = document.createElement('strong');
            lbl.textContent = icon + ' ' + labelText;
            sec.appendChild(lbl);
            content.appendChild(sec);
            return sec;
        }

        function addKVTable(sec, fields) {
            const tbl = document.createElement('table');
            tbl.className = 'ext-table';
            fields.forEach(([label, value]) => {
                if (!value) return;
                const tr = document.createElement('tr');
                const td1 = document.createElement('td');
                td1.className = 'ext-label';
                td1.textContent = label;
                const td2 = document.createElement('td');
                td2.textContent = value;
                if (label === 'Price:') { td2.style.color = '#B12704'; td2.style.fontWeight = 'bold'; }
                if (label === 'Title:') td2.style.fontWeight = '500';
                if (label === 'ASIN:') td2.style.fontFamily = 'monospace';
                tr.appendChild(td1);
                tr.appendChild(td2);
                tbl.appendChild(tr);
            });
            sec.appendChild(tbl);
        }

        // Basic Info
        const basicSec = addSection('📋', 'Basic Info');
        addKVTable(basicSec, [
            ['Title:', data.title],
            ['Brand:', data.brand],
            ['Price:', data.price],
            ['Rating:', data.rating ? data.rating + ' ' + data.reviewCount : ''],
            ['ASIN:', data.asin],
        ]);

        // Key Features
        if (data.keyFeatures.length > 0) {
            const featSec = addSection('✨', 'Key Features');
            const ul = document.createElement('ul');
            ul.style.cssText = 'margin:4px 0 0 16px;padding:0;color:#333;';
            data.keyFeatures.forEach(f => {
                const li = document.createElement('li');
                li.textContent = f;
                li.style.marginBottom = '2px';
                ul.appendChild(li);
            });
            featSec.appendChild(ul);
        }

        // Technical Details
        if (Object.keys(data.technicalDetails).length > 0) {
            const techSec = addSection('⚙️', 'Technical Details');
            const tbl = document.createElement('table');
            tbl.className = 'ext-tech-table';
            for (const [k, v] of Object.entries(data.technicalDetails)) {
                const tr = document.createElement('tr');
                const td1 = document.createElement('td');
                td1.className = 'ext-tech-key';
                td1.textContent = k;
                const td2 = document.createElement('td');
                td2.textContent = v;
                tr.appendChild(td1);
                tr.appendChild(td2);
                tbl.appendChild(tr);
            }
            techSec.appendChild(tbl);
        }

        // Description
        if (data.description) {
            const sec = addSection('📝', 'Description');
            const box = document.createElement('div');
            box.className = 'ext-desc-box';
            box.textContent = data.description.substring(0, 1500);
            sec.appendChild(box);
        }

        // About This Item
        if (data.aboutThisItem) {
            const sec = addSection('📌', 'About This Item');
            const box = document.createElement('div');
            box.className = 'ext-desc-box';
            box.textContent = data.aboutThisItem.substring(0, 1500);
            sec.appendChild(box);
        }

        // Images
        if (data.images.length > 0) {
            const sec = addSection('🖼️', 'Images');
            data.images.forEach(src => {
                const img = document.createElement('img');
                img.src = src;
                img.className = 'ext-img';
                sec.appendChild(img);
            });
        }

        // URL
        const urlDiv = document.createElement('div');
        urlDiv.className = 'ext-url';
        urlDiv.textContent = 'URL: ' + data.url;
        content.appendChild(urlDiv);

        // Buttons
        const btnRow = document.createElement('div');
        btnRow.id = 'extractor-btns';

        const jsonBtn = document.createElement('button');
        jsonBtn.id = 'btn-copy-json';
        jsonBtn.textContent = '📋 Copy Data (JSON)';
        jsonBtn.onclick = () => {
            const clean = {
                title: data.title, brand: data.brand, price: data.price,
                rating: data.rating, reviewCount: data.reviewCount, asin: data.asin,
                keyFeatures: data.keyFeatures, technicalDetails: data.technicalDetails,
                description: data.description.substring(0, 1000),
                aboutThisItem: data.aboutThisItem ? data.aboutThisItem.substring(0, 1000) : '',
                images: data.images, url: data.url
            };
            copyText(JSON.stringify(clean, null, 2), jsonBtn);
        };

        const textBtn = document.createElement('button');
        textBtn.id = 'btn-copy-text';
        textBtn.textContent = '📄 Copy as Text';
        textBtn.onclick = () => copyText(toText(data), textBtn);

        btnRow.appendChild(jsonBtn);
        btnRow.appendChild(textBtn);

        // Assemble
        panel.appendChild(header);
        panel.appendChild(content);
        panel.appendChild(btnRow);
        document.body.appendChild(panel);

        // Also show a floating toggle button
        showToggleBtn();
    }

    function showToggleBtn() {
        if (document.getElementById('extractor-toggle')) return;
        const btn = document.createElement('button');
        btn.id = 'extractor-toggle';
        btn.textContent = '📦';
        btn.title = 'Show Product Extractor';
        btn.onclick = () => {
            btn.remove();
            const panel = document.getElementById('amazon-extractor-panel');
            if (panel) panel.style.display = 'flex';
            else showPanel();
        };
        document.body.appendChild(btn);
    }

    function toText(d) {
        let t = '=== ' + (d.title || 'Product') + ' ===\n\n';
        if (d.brand) t += 'Brand: ' + d.brand + '\n';
        if (d.price) t += 'Price: ' + d.price + '\n';
        if (d.rating) t += 'Rating: ' + d.rating + ' (' + d.reviewCount + ')\n';
        if (d.asin) t += 'ASIN: ' + d.asin + '\n';
        t += 'URL: ' + d.url + '\n\n';
        if (d.keyFeatures.length) {
            t += '--- Key Features ---\n';
            d.keyFeatures.forEach(f => t += '• ' + f + '\n');
            t += '\n';
        }
        if (Object.keys(d.technicalDetails).length) {
            t += '--- Technical Details ---\n';
            for (const [k, v] of Object.entries(d.technicalDetails)) t += k + ': ' + v + '\n';
            t += '\n';
        }
        if (d.description) t += '--- Description ---\n' + d.description.substring(0, 1500) + '\n\n';
        if (d.aboutThisItem) t += '--- About This Item ---\n' + d.aboutThisItem.substring(0, 1500) + '\n\n';
        if (d.images.length) { t += '--- Images ---\n'; d.images.forEach(i => t += i + '\n'); }
        return t;
    }

    function copyText(text, btn) {
        try {
            navigator.clipboard.writeText(text).then(() => flash(btn)).catch(() => fallbackCopy(text, btn));
        } catch(e) { fallbackCopy(text, btn); }
    }
    function fallbackCopy(text, btn) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
        flash(btn);
    }
    function flash(btn) {
        const orig = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => btn.textContent = orig, 2000);
    }

})();
