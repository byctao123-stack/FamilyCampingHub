import os, subprocess

fp = os.path.join(os.getcwd(), 'tools', 'amazon-product-extractor.user.js')
with open(fp, 'r', encoding='utf-8') as f:
    c = f.read()

NL = '\r\n'
fixes = 0

def sr(old, new):
    global c, fixes
    if old in c:
        c = c.replace(old, new, 1)
        fixes += 1
        return True
    return False

# FIX 1: isCodeBlock JSON detect
r = sr(
    "if (style.includes('display:none') || style.includes('display: none') || style.includes('position:absolute') && style.includes('left:-9999')) return true;" + NL + "            return false;" + NL + "        }",
    "if (style.includes('display:none') || style.includes('display: none') || style.includes('position:absolute') && style.includes('left:-9999')) return true;" + NL + "            const txt = (el.textContent || '').substring(0, 200);" + NL + "            if (/[{]/.test(txt) && /\"[a-zA-Z]+\":/.test(txt)) return true;" + NL + "            return false;" + NL + "        }"
)
print('FIX 1:', 'OK' if r else 'SKIP')

# FIX 2: extractFromVisibleChildren filter
r = sr(
    "if (symbolRatio > 0.3) continue;" + NL + NL + "                    if (!parts.includes(text)) parts.push(text);",
    "if (symbolRatio > 0.3) continue;" + NL + NL + "                    const semiBrace = (text.match(/[;{}]/g) || []).length;" + NL + "                    if (semiBrace > 2 && semiBrace / text.length > 0.02) continue;" + NL + NL + "                    if (!parts.includes(text)) parts.push(text);"
)
print('FIX 2:', 'OK' if r else 'SKIP')

# FIX 3: extractFromChildren filter
r = sr(
    "if (symbolRatio > 0.25) return;" + NL + "                    parts.push(text);",
    "if (symbolRatio > 0.25) return;" + NL + "                    if (text.includes('videoUrl') || text.includes('parentAsin')) return;" + NL + "                    const semiBrace = (text.match(/[;{}]/g) || []).length;" + NL + "                    if (semiBrace > 2 && semiBrace / text.length > 0.02) return;" + NL + "                    parts.push(text);"
)
print('FIX 3:', 'OK' if r else 'SKIP')

# FIX 4: getCleanText filters
r = sr(
    "!l.includes('const ')" + NL + "                    !l.match(/",
    "!l.includes('const ')" + NL + "                    !l.includes('videoUrl')" + NL + "                    !l.includes('parentAsin')" + NL + "                    !l.match(/"
)
print('FIX 4:', 'OK' if r else 'SKIP')

# FIX 5: star regex - binary replacement
buf = open(fp, 'rb').read()
old5 = b'const match = text.match(/(\\d)\\s*'
new5 = b'const match = text.match(/([1-5])\\s*'
if old5 in buf:
    c = c.replace('const match = text.match(/(\\d)\\s*', 'const match = text.match(/([1-5])\\s*')
    fixes += 1
    print('FIX 5: OK')
else:
    print('FIX 5: SKIP')

# FIX 6: review body innerText
r = sr(
    "// Try textContent" + NL + "                if (!r.body) {" + NL + "                    r.body = getCleanText(bodyEl, 400);" + NL + "                }" + NL + "            }" + NL + NL + "            // Strategy 2:",
    "// Try innerText" + NL + "                if (!r.body) {" + NL + "                    r.body = (bodyEl.innerText || '').trim().substring(0, 400);" + NL + "                }" + NL + "                // Try textContent as last resort" + NL + "                if (!r.body) {" + NL + "                    r.body = getCleanText(bodyEl, 400);" + NL + "                }" + NL + "            }" + NL + NL + "            // Strategy 2:"
)
print('FIX 6:', 'OK' if r else 'SKIP')

# FIX 7: accordionSections cleanup
r = sr(
    "        // --- Customer Reviews ---",
    "        // --- Cleanup accordion sections ---" + NL +
    "        const uiLabels = ['See more', 'Show less', 'Show more', 'Hide', 'See less'];" + NL +
    "        for (const key of Object.keys(data.accordionSections)) {" + NL +
    "            if (uiLabels.includes(key.trim())) { delete data.accordionSections[key]; continue; }" + NL +
    "            if (key.includes('How customer reviews')) { delete data.accordionSections[key]; continue; }" + NL +
    "            let val = data.accordionSections[key];" + NL +
    "            if (val) {" + NL +
    "                const parts = val.split('\\n\\n').map(s => s.trim()).filter(s => s.length > 3);" + NL +
    "                const seen = new Set();" + NL +
    "                const unique = parts.filter(p => { if (seen.has(p)) return false; seen.add(p); return true; });" + NL +
    "                data.accordionSections[key] = unique.join('\\n\\n');" + NL +
    "            }" + NL +
    "        }" + NL + NL +
    "        // --- Customer Reviews ---"
)
print('FIX 7:', 'OK' if r else 'SKIP')

# FIX 8: prevent double showPanel
r = sr(
    "setTimeout(showPanel, 2000);" + NL + NL + "    // Also try again after longer delay in case first attempt misses lazy-loaded content" + NL + "    setTimeout(showPanel, 6000);",
    "setTimeout(showPanel, 2000);" + NL + NL + "    setTimeout(() => {" + NL + "        if (!document.getElementById('amazon-extractor-panel') && !document.getElementById('extractor-toggle')) {" + NL + "            showPanel();" + NL + "        }" + NL + "    }, 6000);"
)
print('FIX 8:', 'OK' if r else 'SKIP')

# FIX 9: toggle always visible
r = sr(
    "function showToggleBtn() {" + NL + "        if (document.getElementById('extractor-toggle')) return;",
    "function showToggleBtn() {" + NL + "        var existing = document.getElementById('extractor-toggle');" + NL + "        if (existing) { existing.style.display = 'block'; return; }"
)
print('FIX 9:', 'OK' if r else 'SKIP')

# FIX 10: keyboard shortcut
r = sr(
    "        // Also show a floating toggle button" + NL + "        showToggleBtn();" + NL + "    }",
    "        // Also show a floating toggle button" + NL + "        showToggleBtn();" + NL + NL +
    "        if (!window._extractorKeyHandler) {" + NL +
    "            window._extractorKeyHandler = function(e) {" + NL +
    "                if (e.ctrlKey && e.shiftKey && e.key === 'X') {" + NL +
    "                    e.preventDefault();" + NL +
    "                    var p = document.getElementById('amazon-extractor-panel');" + NL +
    "                    if (p) { p.style.display = 'flex'; } else { showPanel(); }" + NL +
    "                }" + NL +
    "            };" + NL +
    "            document.addEventListener('keydown', window._extractorKeyHandler);" + NL +
    "        }" + NL + "    }"
)
print('FIX 10:', 'OK' if r else 'SKIP')

# FIX 11: bigger toggle
r = sr(
    "width: 48px !important; height: 48px !important;",
    "width: 56px !important; height: 56px !important;"
)
print('FIX 11:', 'OK' if r else 'SKIP')

# Write back
with open(fp, 'w', encoding='utf-8') as f:
    f.write(c)

print('\nTotal fixes:', fixes)
print('File size:', len(c))

# Syntax check
result = subprocess.run(
    ['node', '-e', "var fs=require('fs');var c=fs.readFileSync('tools/amazon-product-extractor.user.js','utf-8');try{new Function(c);console.log('Syntax OK')}catch(e){console.log('Syntax ERROR:',e.message)}"],
    capture_output=True, text=True, cwd=os.getcwd()
)
print(result.stdout.strip())
if result.stderr:
    print('STDERR:', result.stderr.strip()[:200])
