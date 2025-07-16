(() => {
  console.clear();
  console.log('Credits: https://t.me/coneticlarp & https://youtube.com/conetic');

  const COINS = {
    BTC: "bitcoin", ETH: "ethereum", LTC: "litecoin", USDT: "tether", SOL: "solana",
    DOGE: "dogecoin", BCH: "bitcoin-cash", XRP: "ripple", TRX: "tron", EOS: "eos",
    BNB: "binancecoin", USDC: "usd-coin", APE: "apecoin", BUSD: "binance-usd",
    CRO: "crypto-com-chain", DAI: "dai", LINK: "chainlink", SAND: "the-sandbox",
    SHIB: "shiba-inu", UNI: "uniswap", POL: "polygon", TRUMP: "trumpcoin"
  };

  const API = `https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(COINS).join(',')}&vs_currencies=usd`;
  const CONV_SELECTOR = 'span.label-content.svelte-osbo5w.full-width div.crypto[data-testid="conversion-amount"]';
  const WAGERED_SELECTOR = 'div.currency span.weight-bold.line-height-default.align-left.numeric.svelte-1f6lug3';
  const prices = {}, originalTexts = new WeakMap(), wageredProcessed = new WeakSet();

  const getElements = () => ({
    excluded: document.evaluate('/html/body/div[1]/div[1]/div[2]/div[2]/div/div/div/div[4]/div/div[5]/label/span[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue,
    usd: ['/html/body/div[1]/div[2]/div[2]/div[4]/div/div/div/div[1]/div/div[2]/div/div/div/div/div/div[1]/div/div/div/div/div[1]/div[2]/div[1]/div/button','/html/body/div[1]/div[2]/div[2]/div[4]/div/div/div/div[1]/div/div[2]/div/div/div/div/div/div[1]/div/div/div/div/div[2]/div[1]/div[4]/div/div/div/button/div'].map(xpath => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue).filter(Boolean)
  });

  const shouldSkip = (node, elements) => elements.excluded?.contains(node);
  const isUSDElement = (node, elements) => elements.usd.some(el => el?.contains(node));

  const fetchPrices = async () => {
    try {
      const data = await (await fetch(API)).json();
      Object.entries(COINS).forEach(([sym, id]) => prices[sym.toLowerCase()] = data[id]?.usd || null);
    } catch {}
  };

  const convertAll = () => {
    const val = document.querySelector('input[data-test="input-game-amount"]')?.value;
    const amount = val ? Math.max(0, +val) || null : null;
    const ARS_TO_USD = 1 / 1200; // Conversion ARS vers USD (1 USD = 1200 ARS)
    const amountInUSD = amount ? amount * ARS_TO_USD : null;

    document.querySelectorAll(CONV_SELECTOR).forEach(div => {
      if (!originalTexts.has(div)) originalTexts.set(div, div.textContent);
      const cur = (div.textContent.match(/([A-Z]{2,5})$/)?.[1] || '').toLowerCase();
      const price = prices[cur];
      div.textContent = amountInUSD && price ? `${(amountInUSD / price).toFixed(8)} ${cur.toUpperCase()}` : originalTexts.get(div);
    });
  };

  const formatNumber = (num) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const multiplyWagered = () => {
    const wageredSpans = document.querySelectorAll(WAGERED_SELECTOR);
    wageredSpans.forEach(wageredSpan => {
      if (!wageredProcessed.has(wageredSpan)) {
        const text = wageredSpan.textContent.trim();
        const match = text.match(/^\$([\d,.]+)/);
        if (!match) return;

        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) return;

        const multiplied = amount * 450;
        if (isFinite(multiplied)) {
          wageredSpan.textContent = `$${formatNumber(multiplied)}`;
          wageredProcessed.add(wageredSpan);
        }
      }
    });
  };

  const replaceARS = () => {
    const elements = getElements();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => shouldSkip(n, elements) ? NodeFilter.FILTER_REJECT : n.nodeValue.includes('ARS') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let node;
    while (node = walker.nextNode()) {
      node.nodeValue = node.nodeValue.replace(/ARS[\s\u00A0]*/g, isUSDElement(node, elements) ? 'USD' : '$');
    }
  };

  const replaceNoneAndBronze = () => {
    const elements = getElements();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => shouldSkip(n, elements) ? NodeFilter.FILTER_REJECT : n.nodeValue.includes('None') || n.nodeValue.includes('Bronze') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let node;
    while (node = walker.nextNode()) {
      node.nodeValue = node.nodeValue.replace(/\bNone\b/g, 'Platinum II').replace(/\bBronze\b/g, 'Platinum III');
    }
  };

  const pathReplacements = [
    { from: { fill: "#FFC800", d: "M48 96c26.51 0 48-21.49" }, to: { fill: "#6CDE07", d: "M48 96c26.51 0 48-21.49 48-48S74.51 0 48 0 0 21.49 0 48s21.49 48 48 48" }},
    { from: { fill: "#276304", d: "M79.2 67.32v-4.56l.04.04c5.52-1" }, to: { fill: "#1B3802", d: "M51.52 73.32v6.56h-5.8V73.4c-7.56-.6-13.08-3.56-16.92-7.64l4.72-6.56c2.84 3 6.96 5.68 12.2 6.48V51.64c-7.48-1.88-15.4-4.64-15.4-14.12 0-7.4 6.04-13.32 15.4-14.12v-6.68h5.8v6.84c5.96.6 10.84 2.92 14.6 6.56l-4.88 6.32c-2.68-2.68-6.12-4.36-9.76-5.08v12.52c7.56 2.04 15.72 4.88 15.72 14.6 0 7.4-4.8 13.8-15.72 14.84zm-5.8-30.96V31.04c-4.16.44-6.68 2.68-6.68 5.96 0 2.84 2.84 4.28 6.68 5.36M58.6 59.28c0-3.36-3-4.88-7.04-6.12v12.52c5-.72 7.04-3.64 7.04-6.4" }},
    // ... autres remplacements de chemins SVG ...
  ];

  const deleteAttrs = { fill: "#276304", "fill-rule": "evenodd", d: "m27.8 62.4-1.24-5.08H16.52" };
  const matches = (el, attrs) => Object.entries(attrs).every(([k, v]) => k === 'd' ? el.getAttribute(k)?.startsWith(v) : el.getAttribute(k) === v);

  const replacePaths = () => {
    const { excluded } = getElements();
    document.querySelectorAll('path').forEach(path => {
      if (shouldSkip(path, { excluded })) return;
      const replacement = pathReplacements.find(r => matches(path, r.from));
      if (replacement) {
        if (replacement.to.replaceWith) {
          const parentSvg = path.closest('svg');
          if (parentSvg) {
            const span = document.createElement('span');
            span.innerHTML = replacement.to.replaceWith;
            parentSvg.replaceWith(span.firstChild);
          }
        } else {
          Object.entries(replacement.to).forEach(([k, v]) => path.setAttribute(k, v));
        }
      } else if (matches(path, deleteAttrs)) {
        path.remove();
      }
    });
  };

  const replaceBorder = () => {
    document.querySelectorAll('div.flex.flex-col.justify-center.rounded-lg.w-full.bg-grey-700').forEach(div => {
      if (div.style.border === '2px solid rgb(47, 69, 83)') {
        div.style.border = '2px solid #6fdde7';
      }
    });
  };

  const hookInput = i => {
    if (!i?.dataset.hooked) {
      i.dataset.hooked = '1';
      ['input', 'change'].forEach(e => i.addEventListener(e, convertAll));
    }
  };

  const setupDecimalLogger = () => {
    const logged = new Set();
    const checkDecimals = () => {
      const current = new Set();
      document.querySelectorAll('span, div').forEach(el => {
        if (!/^\d+\.\d{8}$/.test(el.textContent?.trim())) return;
        let parent = el.parentElement;
        for (let i = 0; i < 8 && parent; i++, parent = parent.parentElement) {
          const currency = [...parent.querySelectorAll('span, div')].find(e => /^[A-Z]{2,5}$/.test(e.textContent?.trim()))?.textContent.trim();
          const dollar = [...parent.querySelectorAll('span, div')].find(e => /\$\d/.test(e.textContent))?.textContent.match(/\$[\d,]+\.\d{2}/)?.[0];
          if (currency && dollar && dollar !== "$0.00") {
            const dollarAmount = parseFloat(dollar.replace(/[$,]/g, ''));
            const cur = currency.toLowerCase();
            const price = prices[cur];
            if (dollarAmount && price) {
              const convertedAmount = (dollarAmount / price).toFixed(8);
              const key = `${el.textContent.trim()}-${currency}`;
              current.add(key);
              if (!logged.has(key) && convertedAmount !== el.textContent.trim()) {
                logged.add(key);
                if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                  el.childNodes[0].nodeValue = convertedAmount;
                } else {
                  el.textContent = convertedAmount;
                }
              }
            }
            break;
          }
        }
      });
      logged.forEach(key => !current.has(key) && logged.delete(key));
      requestAnimationFrame(checkDecimals);
    };
    checkDecimals();
  };

  const setupPersistentObserver = () => {
    const observer = new MutationObserver(muts => {
      const elements = getElements();
      muts.forEach(m => {
        if (m.type === 'characterData') {
          if (m.target.nodeValue.includes('ARS') && !shouldSkip(m.target, elements)) {
            m.target.nodeValue = m.target.nodeValue.replace(/ARS[\s\u00A0]*/g, isUSDElement(m.target, elements) ? 'USD' : '$');
          }
          if ((m.target.nodeValue.includes('None') || m.target.nodeValue.includes('Bronze')) && !shouldSkip(m.target, elements)) {
            m.target.nodeValue = m.target.nodeValue.replace(/\bNone\b/g, 'Platinum II').replace(/\bBronze\b/g, 'Platinum III');
          }
        }
        m.addedNodes.forEach(n => {
          if (n.nodeType === 1) {
            if (n.matches?.('input[data-test="input-game-amount"]')) hookInput(n);
            n.querySelectorAll?.('input[data-test="input-game-amount"]').forEach(hookInput);
            n.querySelectorAll?.(WAGERED_SELECTOR).forEach(wageredSpan => {
              if (!wageredProcessed.has(wageredSpan)) multiplyWagered();
            });
            n.querySelectorAll?.('path').forEach(path => replacePaths());
            n.querySelectorAll?.('div.flex.flex-col.justify-center.rounded-lg.w-full.bg-grey-700').forEach(div => replaceBorder());
            const walker = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, {
              acceptNode: node => (node.nodeValue.includes('None') || node.nodeValue.includes('Bronze')) && !shouldSkip(node, elements) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
            });
            let node;
            while (node = walker.nextNode()) {
              node.nodeValue = node.nodeValue.replace(/\bNone\b/g, 'Platinum II').replace(/\bBronze\b/g, 'Platinum III');
            }
          }
        });
      });
      multiplyWagered();
      replacePaths();
      replaceBorder();
      replaceARS();
      replaceNoneAndBronze();
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  };

  (async () => {
    await fetchPrices();
    convertAll();
    multiplyWagered();
    document.querySelectorAll('input[data-test="input-game-amount"]').forEach(hookInput);
    replaceARS();
    replaceNoneAndBronze();
    replacePaths();
    replaceBorder();
    setupDecimalLogger();
    setupPersistentObserver();
    setInterval(() => {
      convertAll();
      multiplyWagered();
      replaceARS();
      replaceNoneAndBronze();
      replacePaths();
      replaceBorder();
    }, 1000);
  })();
})();
