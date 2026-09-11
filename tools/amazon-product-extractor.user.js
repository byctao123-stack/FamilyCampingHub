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
                display: flex !important; gap: 6px !important; padding: 10px 12px !important;
                background: #f0f0f0 !important; border-top: 1px solid #ddd !important;
                flex-wrap: wrap !important;
            }
            #extractor-btns button {
                flex: 1 1 40% !important; padding: 8px !important; border-radius: 4px !important;
                cursor: pointer !important; font-size: 12px !important; font-weight: 600 !important;
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
        data.accordionSections = {};
        data.reviews = { overall: '', totalCount: '', starDistribution: {}, topReviews: [] };

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


        // --- Collapsed/Accordion Sections (Features & Specs, Materials, Measurements, etc.) ---
        data.accordionSections = {};
        const accordionSelectors = [
            '#detailBullets_feature_div',
            '#detailBulletsWrapper_feature_div',
            '#productDetails_superpositionDiv',
            '#productDetails_techSpec_section_1',
            'div[data-action="a-expander"]',
            '.a-expander-content',
            '#productDetails_Overview_section1',
        ];
        for (const sel of accordionSelectors) {
            const el = document.querySelector(sel);
            if (!el) continue;
            const headers = el.querySelectorAll('h3, h4, .a-expander-header, [data-action="a-expander"]');
            headers.forEach(header => {
                const title = st(header).trim();
                if (!title || title.length > 120) return;
                let content = '';
                let sibling = header.nextElementSibling;
                while (sibling && content.length < 2000) {
                    const text = st(sibling).trim();
                    if (text && !text.includes('{') && !text.includes('function')) content += text + '
';
                    sibling = sibling.nextElementSibling;
                    if (sibling && (sibling.tagName === 'H3' || sibling.tagName === 'H4' || sibling.querySelector('.a-expander-header'))) break;
                }
                if (content.trim().length > 3) data.accordionSections[title] = content.trim().substring(0, 1000);
            });
            if (Object.keys(data.accordionSections).length > 0) break;
        }

        // --- Customer Reviews ---
        data.reviews = { overall: data.rating, totalCount: data.reviewCount, starDistribution: {}, topReviews: [] };
        const histogram = document.querySelector('#cm_cr_dp_d_rating_histogram');
        if (histogram) {
            const bars = histogram.querySelectorAll('.a-meter');
            bars.forEach((bar, idx) => {
                const pct = bar.getAttribute('aria-label') || '';
                const stars = 5 - idx;
                data.reviews.starDistribution[stars + ' stars'] = pct || '';
            });
        }
        const reviewCards = document.querySelectorAll('[data-hook="review"], .review, #cm_cr_reviews_list .a-section');
        reviewCards.forEach((card, idx) => {
            if (idx >= 5) return;
            const r = {};
            const starEl = card.querySelector('[data-hook="review-star-rating"], .a-icon-alt, .a-icon-star');
            r.rating = starEl ? st(starEl).trim() : '';
            const titleEl = card.querySelector('[data-hook="review-title"], .review-title');
            r.title = titleEl ? st(titleEl).trim() : '';
            const bodyEl = card.querySelector('[data-hook="review-body"], .review-text, .a-expander-content');
            r.body = bodyEl ? st(bodyEl).trim().substring(0, 300) : '';
            const authorEl = card.querySelector('[data-hook="review-author"], .a-profile-name');
            r.author = authorEl ? st(authorEl).trim() : '';
            if (r.body || r.title) data.reviews.topReviews.push(r);
        });

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

        // Images - convert to highest resolution available
        data.images = [];
        const seen = new Set();
        document.querySelectorAll('#altImages img, #landingImage').forEach(img => {
            let src = img.getAttribute('data-old-hires') || img.src || '';
            if (!src || src.includes('sprite') || src.includes('gif')) return;
            // Convert thumbnail URLs to high resolution
            // _AC_US40_ → 40px thumb → _AC_SL1500_ → 1500px wide
            // _AC_SY88_ → 88px tall → remove size constraint
            src = src
                .replace(/_AC_US\d+_/, '_AC_SL1500_')
                .replace(/_AC_SY\d+_/, '_AC_SL1500_')
                .replace(/_AC_MP\d+_/, '_AC_SL1500_')
                .replace(/_SX\d+_/, '_SX1500_')
                .replace(/_SY\d+_/, '_SY1500_')
                .replace(/,_SX\d+_,/, ',_SX1500_,')
                .replace(/\._[^_]+_\./, '._AC_SL1500_.');
            if (!seen.has(src)) {
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

        // Accordion/Collapsed Sections
        if (Object.keys(data.accordionSections).length > 0) {
            const accSec = addSection('📑', 'Product Details');
            const accBox = document.createElement('div');
            accBox.className = 'ext-desc-box';
            let accText = '';
            for (const [title, content] of Object.entries(data.accordionSections)) {
                accText += '[' + title + ']\n' + content + '\n\n';
            }
            accBox.textContent = accText.trim().substring(0, 2000);
            accSec.appendChild(accBox);
        }

        // Customer Reviews
        if (data.reviews.topReviews.length > 0 || Object.keys(data.reviews.starDistribution).length > 0) {
            const revSec = addSection('⭐', 'Customer Reviews (' + data.reviews.totalCount + ')');

            // Star distribution
            if (Object.keys(data.reviews.starDistribution).length > 0) {
                const distDiv = document.createElement('div');
                distDiv.style.cssText = 'margin-bottom:8px;font-size:12px;';
                for (const [stars, pct] of Object.entries(data.reviews.starDistribution)) {
                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex;align-items:center;gap:4px;margin-bottom:2px;';
                    row.innerHTML = '<span style="width:50px;color:#666;">' + stars + '</span><span style="flex:1;background:#eee;height:8px;border-radius:4px;overflow:hidden;"><div style="width:' + pct + ';height:100%;background:#FFA726;border-radius:4px;"></div></span><span style="width:40px;color:#666;font-size:11px;">' + pct + '</span>';
                    distDiv.appendChild(row);
                }
                revSec.appendChild(distDiv);
            }

            // Top reviews
            data.reviews.topReviews.forEach(r => {
                const revDiv = document.createElement('div');
                revDiv.style.cssText = 'border-top:1px solid #eee;padding-top:8px;margin-top:8px;';
                if (r.rating) {
                    const rBar = document.createElement('div');
                    rBar.style.cssText = 'color:#FFA726;font-size:12px;margin-bottom:2px;';
                    rBar.textContent = r.rating;
                    revDiv.appendChild(rBar);
                }
                if (r.title) {
                    const rTitle = document.createElement('div');
                    rTitle.style.cssText = 'font-weight:600;font-size:13px;margin-bottom:2px;';
                    rTitle.textContent = r.title;
                    revDiv.appendChild(rTitle);
                }
                if (r.author) {
                    const rAuthor = document.createElement('div');
                    rAuthor.style.cssText = 'font-size:11px;color:#888;margin-bottom:2px;';
                    rAuthor.textContent = r.author;
                    revDiv.appendChild(rAuthor);
                }
                if (r.body) {
                    const rBody = document.createElement('div');
                    rBody.style.cssText = 'font-size:12px;color:#555;line-height:1.5;';
                    rBody.textContent = r.body;
                    revDiv.appendChild(rBody);
                }
                revSec.appendChild(revDiv);
            });
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
            data.images.forEach((src, idx) => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';

                const img = document.createElement('img');
                img.src = src;
                img.className = 'ext-img';
                img.style.cssText = 'width:60px;height:60px;object-fit:contain;flex-shrink:0;cursor:pointer;border:1px solid #ddd;border-radius:4px;padding:2px;';
                img.title = 'Click to open full size';
                img.onclick = () => window.open(src, '_blank');

                const info = document.createElement('div');
                info.style.cssText = 'flex:1;min-width:0;';
                const fname = document.createElement('div');
                fname.style.cssText = 'font-size:11px;color:#333;word-break:break-all;';
                fname.textContent = `Image ${idx + 1}: ${src.split('/').pop()}`;
                const openLink = document.createElement('a');
                openLink.href = src;
                openLink.target = '_blank';
                openLink.textContent = 'Open full size →';
                openLink.style.cssText = 'font-size:11px;color:#0066c0;text-decoration:none;';
                info.appendChild(fname);
                info.appendChild(openLink);

                row.appendChild(img);
                row.appendChild(info);
                sec.appendChild(row);
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
                accordionSections: data.accordionSections,
                reviews: data.reviews,
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

        const imgBtn = document.createElement('button');
        imgBtn.id = 'btn-copy-images';
        imgBtn.textContent = '🖼️ Open All Images';
        imgBtn.onclick = () => {
            if (data.images.length === 0) return;
            data.images.forEach((src, i) => {
                setTimeout(() => window.open(src, '_blank'), i * 300);
            });
            flash(imgBtn);
        };

        const imgUrlBtn = document.createElement('button');
        imgUrlBtn.id = 'btn-copy-img-urls';
        imgUrlBtn.textContent = '📎 Copy Image URLs';
        imgUrlBtn.onclick = () => {
            copyText(data.images.join('\n'), imgUrlBtn);
        };

        btnRow.appendChild(jsonBtn);
        btnRow.appendChild(textBtn);
        btnRow.appendChild(imgBtn);
        btnRow.appendChild(imgUrlBtn);

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
        if (Object.keys(d.accordionSections).length) {
            t += '--- Product Details (Accordion) ---\n';
            for (const [title, content] of Object.entries(d.accordionSections)) {
                t += '[' + title + ']\n' + content + '\n\n';
            }
        }
        if (d.reviews.topReviews.length || Object.keys(d.reviews.starDistribution).length) {
            t += '--- Customer Reviews ---\n';
            t += 'Overall: ' + d.reviews.overall + ' (' + d.reviews.totalCount + ')\n';
            if (Object.keys(d.reviews.starDistribution).length) {
                t += 'Star Distribution:\n';
                for (const [stars, pct] of Object.entries(d.reviews.starDistribution)) {
                    t += '  ' + stars + ': ' + pct + '\n';
                }
                t += '\n';
            }
            d.reviews.topReviews.forEach(r => {
                t += 'Review: ' + (r.title || 'No title') + '\n';
                if (r.rating) t += 'Rating: ' + r.rating + '\n';
                if (r.author) t += 'By: ' + r.author + '\n';
                if (r.body) t += r.body + '\n';
                t += '\n';
            });
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
