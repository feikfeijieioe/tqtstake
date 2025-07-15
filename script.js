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
  const prices = {}, originalTexts = new WeakMap();
  
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
    document.querySelectorAll(CONV_SELECTOR).forEach(div => {
      if (!originalTexts.has(div)) originalTexts.set(div, div.textContent);
      const cur = (div.textContent.match(/([A-Z]{2,5})$/)?.[1] || '').toLowerCase();
      const price = prices[cur];
      div.textContent = amount && price ? `${(amount / price).toFixed(8)} ${cur.toUpperCase()}` : originalTexts.get(div);
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
      node.nodeValue = node.nodeValue.replace(/\bNone\b/g, 'Platinum II').replace(/\bBronze\b/g, 'Platinum I');
    }
  };

  const setupTextObserver = () => {
    const observer = new MutationObserver(muts => {
      const elements = getElements();
      muts.forEach(m => {
        if (m.type === 'characterData') {
          if (m.target.nodeValue.includes('ARS') && !shouldSkip(m.target, elements)) {
            m.target.nodeValue = m.target.nodeValue.replace(/ARS[\s\u00A0]*/g, isUSDElement(m.target, elements) ? 'USD' : '$');
          }
          if ((m.target.nodeValue.includes('None') || m.target.nodeValue.includes('Bronze')) && !shouldSkip(m.target, elements)) {
            m.target.nodeValue = m.target.nodeValue.replace(/\bNone\b/g, 'Platinum II').replace(/\bBronze\b/g, 'Platinum I');
          }
        }
      });
    });

    const observeNode = node => {
      if (node.nodeType === Node.TEXT_NODE && (node.nodeValue.includes('ARS') || node.nodeValue.includes('None') || node.nodeValue.includes('Bronze'))) {
        const elements = getElements();
        if (!shouldSkip(node, elements)) {
          observer.observe(node, { characterData: true });
          node.nodeValue = node.nodeValue.replace(/ARS[\s\u00A0]*/g, isUSDElement(node, elements) ? 'USD' : '$')
                                       .replace(/\bNone\b/g, 'Platinum II')
                                       .replace(/\bBronze\b/g, 'Platinum I');
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        [...node.childNodes].forEach(observeNode);
      }
    };

    observeNode(document.body);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  };

  const pathReplacements = [
    { from: { fill: "#FFC800", d: "M48 96c26.51 0 48-21.49" }, to: { fill: "#6CDE07", d: "M48 96c26.51 0 48-21.49 48-48S74.51 0 48 0 0 21.49 0 48s21.49 48 48 48" }},
    { from: { fill: "#276304", d: "M79.2 67.32v-4.56l.04.04c5.52-1" }, to: { fill: "#1B3802", d: "M51.52 73.32v6.56h-5.8V73.4c-7.56-.6-13.08-3.56-16.92-7.64l4.72-6.56c2.84 3 6.96 5.68 12.2 6.48V51.64c-7.48-1.88-15.4-4.64-15.4-14.12 0-7.4 6.04-13.32 15.4-14.12v-6.68h5.8v6.84c5.96.6 10.84 2.92 14.6 6.56l-4.88 6.32c-2.68-2.68-6.12-4.36-9.76-5.08v12.52c7.56 2.04 15.72 4.88 15.72 14.6 0 7.4-4.8 13.8-15.72 14.84zm-5.8-30.96V31.04c-4.16.44-6.68 2.68-6.68 5.96 0 2.84 2.84 4.28 6.68 5.36M58.6 59.28c0-3.36-3-4.88-7.04-6.12v12.52c5-.72 7.04-3.64 7.04-6.4" }},
    { from: { fill: "#2F4553", d: "m48 14.595 8.49 15.75a13.68 13.68 0 0 0 9.66 7.08L84 40.635l-12.39 12.9a13.9 13.9 0 0 0-3.9 9.63q-.069.96 0 1.92l2.46 17.76-15.66-7.56a15 15 0 0 0-6.51-1.53 15 15 0 0 0-6.6 1.5l-15.57 7.53 2.46-17.76q.051-.93 0-1.86a13.9 13.9 0 0 0-3.9-9.63L12 40.635l17.64-3.21a13.62 13.62 0 0 0 9.84-7.02z" }, to: { replaceWith: '<span class="wrap svelte-nc081s"><svg fill="none" viewBox="0 0 96 96" class="svg-icon" style="font-size: var(--text-size-md);"><title></title><path fill="#6FDDE7" d="M45.237 83.04 23.797 93.4c-3.76 1.8-8-1.28-7.44-5.4l3.28-24.12c.2-1.56-.32-3.16-1.4-4.32L1.437 42c-2.88-3-1.24-8 2.84-8.72l23.96-4.32a5.28 5.28 0 0 0 3.68-2.68l11.52-21.44c1.96-3.64 7.2-3.64 9.16 0l11.52 21.44c.76 1.4 2.12 2.4 3.68 2.68l23.96 4.32c4.08.72 5.72 5.72 2.84 8.72l-16.84 17.56a5.33 5.33 0 0 0-1.4 4.32L79.637 88c.56 4.12-3.68 7.2-7.44 5.4l-21.44-10.36c-1.72-.84-3.76-.84-5.52 0"></path><path fill="#0F212E" d="M32.597 72.16v-36h10.88v36zm19.92 0v-36h10.88v36z"></path></svg></span>' }},
    { from: { fill: "#C69C6D", d: "m48.002 14.603 8.48 15.757c1.97 3.693 5.495 6.336 9.677 7.068l.08.012 17.64 3.2L71.48 53.56a13.84 13.84 0 0 0-3.884 9.63q0 .978.132 1.922l-.01-.072 2.44 17.758L54.52 75.24c-1.908-.934-4.15-1.48-6.52-1.48s-4.613.546-6.608 1.518l.09-.039-15.637 7.56 2.438-17.759c.078-.555.123-1.197.123-1.85 0-3.741-1.482-7.137-3.887-9.633l.003.003-12.518-12.92 17.638-3.2a13.64 13.64 0 0 0 9.842-7.008l.036-.072zm0-12.521h-.01a5.2 5.2 0 0 0-4.577 2.733l-.015.027L32 26.28a5.3 5.3 0 0 1-3.648 2.675l-.033.006-23.997 4.32C1.853 33.717 0 35.847 0 38.406a5.2 5.2 0 0 0 1.443 3.596L1.44 42l16.837 17.558a5.06 5.06 0 0 1 1.473 3.578q0 .458-.078.894l.006-.03L16.4 87.997a5.2 5.2 0 0 0 5.148 5.918h.012c.045.003.102.003.156.003.834 0 1.623-.207 2.31-.576l-.027.013 21.397-10.32a6.2 6.2 0 0 1 2.76-.638c1.004 0 1.952.236 2.795.653l-.036-.014 21.08 10.319a4.7 4.7 0 0 0 2.249.56h.033-.003c.051.003.111.003.171.003a5.2 5.2 0 0 0 5.144-5.948l.004.027-3.28-23.998a5.06 5.06 0 0 1 1.4-4.32l16.84-17.557a5.18 5.18 0 0 0 1.448-3.6c0-2.55-1.836-4.67-4.257-5.114l-.033-.006-23.997-4.32a5.3 5.3 0 0 1-3.705-2.768l-.015-.03-11.399-21.44a5.2 5.2 0 0 0-4.593-2.759h-.008z" }, to: { replaceWith: '<span class="wrap svelte-nc081s" style=""><svg fill="none" viewBox="0 0 96 96" class="svg-icon " style="font-size: var(--text-size-md);"><title></title><path fill="#6FDDE7" d="M45.237 83.04 23.797 93.4c-3.76 1.8-8-1.28-7.44-5.4l3.28-24.12c.2-1.56-.32-3.16-1.4-4.32L1.437 42c-2.88-3-1.24-8 2.84-8.72l23.96-4.32a5.28 5.28 0 0 0 3.68-2.68l11.52-21.44c1.96-3.64 7.2-3.64 9.16 0l11.52 21.44c.76 1.4 2.12 2.4 3.68 2.68l23.96 4.32c4.08.72 5.72 5.72 2.84 8.72l-16.84 17.56a5.33 5.33 0 0 0-1.4 4.32L79.637 88c.56 4.12-3.68 7.2-7.44 5.4l-21.44-10.36c-1.72-.84-3.76-.84-5.52 0"></path><path fill="#0F212E" d="M42.557 72V36h10.88v36z"></path></svg></span>' }}
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

  (async () => {
    await fetchPrices();
    convertAll();
    document.querySelectorAll('input[data-test="input-game-amount"]').forEach(hookInput);
    replaceARS();
    replaceNoneAndBronze();
    replacePaths();
    setupTextObserver();
    setupDecimalLogger();
    setInterval(fetchPrices, 60000);
    setInterval(() => { convertAll(); replaceARS(); replaceNoneAndBronze(); }, 1000);
    new MutationObserver(muts => {
      muts.forEach(m => {
        m.addedNodes.forEach(n => {
          if (n.nodeType === 1) {
            if (n.matches?.('input[data-test="input-game-amount"]')) hookInput(n);
            n.querySelectorAll?.('input[data-test="input-game-amount"]').forEach(hookInput);
          }
        });
      });
      replaceARS();
      replaceNoneAndBronze();
      replacePaths();
    }).observe(document.body, { childList: true, subtree: true });
  })();
})();
