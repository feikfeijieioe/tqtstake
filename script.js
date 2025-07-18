(() => {

  const COINS = {
    BTC: "bitcoin", ETH: "ethereum", LTC: "litecoin", USDT: "tether", SOL: "solana",
    DOGE: "dogecoin", BCH: "bitcoin-cash", XRP: "ripple", TRX: "tron", EOS: "eos",
    BNB: "binancecoin", USDC: "usd-coin", APE: "apecoin", BUSD: "binance-usd",
    CRO: "crypto-com-chain", DAI: "dai", LINK: "chainlink", SAND: "the-sandbox",
    SHIB: "shiba-inu", UNI: "uniswap", POL: "polygon", TRUMP: "trumpcoin"
  };

  const API = `https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(COINS).join(',')}&vs_currencies=usd,ars`;

  const CONV_SELECTOR = 'div.crypto[data-testid="conversion-amount"]'; 
  const WAGERED_SELECTOR = 'div.currency span.weight-bold.line-height-default.align-left.numeric.svelte-1f6lug3, div.fiat-wrapper.svelte-1u6e76g span';
  const STATS_SELECTOR = 'div.card.svelte-1u84h7c span.weight-bold.line-height-120pct.align-left.size-md.text-size-md.variant-highlighted.numeric';
  const DOLLAR_SELECTOR = 'span.weight-semibold.line-height-default.align-left.size-default.text-size-default.numeric.svelte-1f6lug3[class*="variant-highlighted"], span.weight-semibold.line-height-default.align-left.size-default.text-size-default.numeric.svelte-1f6lug3[class*="variant-inherit"]';

  const prices = { usd: {}, ars: {} }, originalTexts = new WeakMap(), wageredProcessed = new WeakSet(), originalLTCTexts = new WeakMap(), statsProcessed = new WeakSet(), dollarProcessed = new WeakSet();

  const getElements = () => ({
    excluded: document.evaluate('/html/body/div[1]/div[1]/div[2]/div[2]/div/div/div/div[4]/div/div[5]/label/span[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue,
    usd: ['/html/body/div[1]/div[2]/div[2]/div[4]/div/div/div/div[1]/div/div[2]/div/div/div/div/div/div[1]/div/div/div/div/div[1]/div[2]/div[1]/div/button','/html/body/div[1]/div[2]/div[2]/div[4]/div/div/div/div[1]/div/div[2]/div/div/div/div/div/div[1]/div/div/div/div/div[2]/div[1]/div[4]/div/div/div/button/div'].map(xpath => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue).filter(Boolean)
  });

  const shouldSkip = (node, elements) => elements.excluded?.contains(node);

  const isUSDElement = (node, elements) => elements.usd.some(el => el?.contains(node));

  const fetchPrices = async () => {
    try {
      const data = await (await fetch(API)).json();
      Object.entries(COINS).forEach(([sym, id]) => {
        prices.usd[sym.toLowerCase()] = data[id]?.usd || null;
        prices.ars[sym.toLowerCase()] = data[id]?.ars || null;
      });
    } catch {
    }
  };

  const setCurrencyARS = () => {
    const arsRadio = document.querySelector('input[data-testid="currency-ars"]');
    const usdRadio = document.querySelector('input[data-testid="currency-usd"]');
    if (arsRadio && usdRadio) {
      arsRadio.checked = true; // Programmatically select ARS for calculations
      usdRadio.checked = false; // Ensure USD is not checked
      // Update visual state to show USD as selected
      const usdLabel = usdRadio.closest('label');
      const arsLabel = arsRadio.closest('label');
      if (usdLabel && arsLabel) {
        usdLabel.querySelector('.indicator').classList.add('variant-checked');
        arsLabel.querySelector('.indicator').classList.remove('variant-checked');
      }
    }
  };

  const convertAll = () => {
    const val = document.querySelector('input[data-testid="input-game-amount"]')?.value;
    const amount = val ? Math.max(0, +val) || null : null;
    document.querySelectorAll(CONV_SELECTOR).forEach(div => {
      if (!originalTexts.has(div)) originalTexts.set(div, div.textContent);
      const cur = (div.textContent.match(/([A-Z]{2,5})$/)?.[1] || '').toLowerCase();
      const price = prices.ars[cur]; // Use ARS prices for calculations
      const newText = amount && price ? `${(amount / price).toFixed(8)} ${cur.toUpperCase()}` : originalTexts.get(div);
      div.textContent = newText;
    });
  };

  const multiplyLTC = () => {
    console.log('multiplyLTC en cours');
    const ltcElements = document.querySelectorAll(CONV_SELECTOR);
    console.log(`Found ${ltcElements.length} elements matching ${CONV_SELECTOR}`);
    const input = document.querySelector('input[data-testid="input-game-amount"]');
    if (!input) {
      console.log('Input element pas trouvé');
      return;
    }
    const inputValue = parseFloat(input.value) || 0;
    if (isNaN(inputValue) || inputValue < 0) {
      console.log('Invalid input value');
      return;
    }
    const BASE_LTC = 0.00064129; 
    const MULTIPLIER = 1291;
    const proportion = inputValue / 80; 
    const ltcAmount = BASE_LTC * proportion;
    const multiplied = ltcAmount * MULTIPLIER;
    const newText = `${multiplied.toFixed(8)} LTC`;
    ltcElements.forEach(div => {
      const text = div.textContent.trim();
      console.log(`Processing element with text: "${text}"`);
      if (!text.includes('LTC')) {
        console.log('No LTC found, skipping');
        return;
      }
      if (!originalLTCTexts.has(div)) {
        originalLTCTexts.set(div, text);
        console.log(`stockage du prix original du ltc "${text}"`);
      }
      if (div.textContent.trim() !== newText) {
        div.textContent = newText;
        console.log(`Updated element to: "${newText}" (from ${inputValue})`);
      } else {
        console.log('tout est bon');
      }
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
        if (!match) {
          return;
        }
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
          return;
        }
        const multiplied = amount * 666;
        if (isFinite(multiplied)) {
          wageredSpan.textContent = `$${formatNumber(multiplied)}`;
          wageredProcessed.add(wageredSpan);
        }
      }
    });
  };

  const multiplyStats = () => {
    const statsSpans = document.querySelectorAll(STATS_SELECTOR);
    statsSpans.forEach(span => {
      if (!statsProcessed.has(span)) {
        const text = span.textContent.trim();
        const parent = span.closest('div.card.svelte-1u84h7c');
        if (!parent) {
          return;
        }
        const labelSpan = parent.querySelector('span.weight-semibold');
        if (!labelSpan) {
          return;
        }
        const label = labelSpan.textContent.trim();
        const amountStr = text.replace(/,/g, '');
        const amount = parseInt(amountStr, 10);
        if (isNaN(amount) || amount <= 0) {
          return;
        }
        let multiplier;
        if (label === 'Total Bets') {
          multiplier = 11;
        } else if (label === 'Number of Wins' || label === 'Number of Losses') {
          multiplier = 11;
        } else {
          return;
        }
        const multiplied = amount * multiplier;
        if (isFinite(multiplied)) {
          span.textContent = multiplied.toLocaleString('en-US');
          statsProcessed.add(span);
        }
      }
    });
  };

  const multiplyDollarAmount = () => {
    const dollarSpans = document.querySelectorAll(DOLLAR_SELECTOR);
    dollarSpans.forEach(span => {
      if (!dollarProcessed.has(span)) {
        const text = span.textContent.trim();
        const match = text.match(/^\$([\d,.]+(\.\d{2})?)/);
        if (!match) {
          return;
        }
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
          return;
        }
        const multiplied = amount * 1285;
        if (isFinite(multiplied)) {
          span.textContent = `$${formatNumber(multiplied)}`;
          dollarProcessed.add(span);
        }
      }
    });
  };

  const replaceARS = () => {
    const elements = getElements();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => shouldSkip(n, elements) ? NodeFilter.FILTER_REJECT : n.nodeValue.includes('ARS') && !isUSDElement(n, elements) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let node;
    while (node = walker.nextNode()) {
      node.nodeValue = node.nodeValue.replace(/ARS[\s\u00A0]*/g, '$'); // Display USD symbol in UI
    }
  };

  const replaceNoneAndBronze = () => {
    const elements = getElements();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => shouldSkip(n, elements) ? NodeFilter.FILTER_REJECT : n.nodeValue.includes('None') || n.nodeValue.includes('Bronze') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let node;
    while (node = walker.nextNode()) {
      node.nodeValue = node.nodeValue.replace(/\bNone\b/g, 'Platinum III').replace(/\bBronze\b/g, 'Platinum IV');
    }
  };

  const replaceDollarAmount = () => {
    const elements = getElements();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => shouldSkip(n, elements) ? NodeFilter.FILTER_REJECT : n.nodeValue.includes('$2,535.72') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let node;
    while (node = walker.nextNode()) {
      node.nodeValue = node.nodeValue.replace(/\$2,535\.72/g, '$3');
    }
  };

  const replaceRoimatt = () => {
    const elements = getElements();
    document.querySelectorAll('div.wrap.svelte-7vpeow').forEach(div => {
      const button = div.querySelector('button[data-analytics="global-betsBoard-user-button"]');
      if (button && button.textContent.includes('AbxMatEZ')) {
        const hasSVG = div.querySelector('span.svelte-heaw3b div.hoverable.svelte-bbyuql');
        if (!hasSVG) {
          const newHTML = `<div class="wrap svelte-7vpeow" style="" bis_skin_checked="1"><span class="svelte-heaw3b"><span class="svelte-heaw3b"><div class="hoverable svelte-bbyuql" bis_skin_checked="1"><span class="wrap svelte-nc081s" style=""><svg fill="none" viewBox="0 0 96 96" class="svg-icon " style="font-size: var(--text-size-md);"> <title></title> <path fill="#6FDDE7" d="M45.237 83.04 23.797 93.4c-3.76 1.8-8-1.28-7.44-5.4l3.28-24.12c.2-1.56-.32-3.16-1.4-4.32L1.437 42c-2.88-3-1.24-8 2.84-8.72l23.96-4.32a5.28 5.28 0 0 0 3.68-2.68l11.52-21.44c1.96-3.64 7.2-3.64 9.16 0l11.52 21.44c.76 1.4 2.12 2.4 3.68 2.68l23.96 4.32c4.08.72 5.72 5.72 2.84 8.72l-16.84 17.56a5.33 5.33 0 0 0-1.4 4.32L79.637 88c.56 4.12-3.68 7.2-7.44 5.4l-21.44-10.36c-1.72-.84-3.76-.84-5.52 0"></path><path fill="#0F212E" d="M22.637 72V36h10.88v36zm19.92 0V36h10.88v36zm19.92 0V36h10.88v36z"></path></svg></span></div><!----></span><!----></span><button type="button" tabindex="0" class="inline-flex relative items-center gap-2 justify-center rounded-(--ds-radius-md,0.25rem) font-semibold whitespace-nowrap ring-offset-background transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] bg-transparent text-grey-200 hover:bg-transparent hover:text-white focus-visible:text-white focus-visible:outline-hidden text-sm leading-normal" data-analytics="global-betsBoard-user-button" data-button-root="">AbxMatEZ</button></div>`;
          div.outerHTML = newHTML;
        }
      }
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => shouldSkip(n, elements) ? NodeFilter.FILTER_REJECT : n.nodeValue.includes('roimatt') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let node;
    while (node = walker.nextNode()) {
      node.nodeValue = node.nodeValue.replace(/\broimatt\b/g, 'AbxMatEZ');
    }
  };

  const pathReplacements = [
    { from: { fill: "#FFC800", d: "M48 96c26.51 0 48-21.49" }, to: { fill: "#6CDE07", d: "M48 96c26.51 0 48-21.49 48-48S74.51 0 48 0 0 21.49 0 48s21.49 48 48 48" }},
    { from: { fill: "#276304", d: "M79.2 67.32v-4.56l.04.04c5.52-1" }, to: { fill: "#1B3802", d: "M51.52 73.32v6.56h-5.8V73.4c-7.56-.6-13.08-3.56-16.92-7.64l4.72-6.56c2.84 3 6.96 5.68 12.2 6.48V51.64c-7.48-1.88-15.4-4.64-15.4-14.12 0-7.4 6.04-13.32 15.4-14.12v-6.68h5.8v6.84c5.96.6 10.84 2.92 14.6 6.56l-4.88 6.32c-2.68-2.68-6.12-4.36-9.76-5.08v12.52c7.56 2.04 15.72 4.88 15.72 14.6 0 7.4-4.8 13.8-15.72 14.84zm-5.8-30.96V31.04c-4.16.44-6.68 2.68-6.68 5.96 0 2.84 2.84 4.28 6.68 5.36M58.6 59.28c0-3.36-3-4.88-7.04-6.12v12.52c5-.72 7.04-3.64 7.04-6.4" }},
    { from: { fill: "#2F4553", d: "m48 14.595 8.49 15.75a13.68 13.68 0 0 0 9.66 7.08L84 40.635l-12.39 12.9a13.9 13.9 0 0 0-3.9 9.63q-.069.96 0 1.92l2.46 17.76-15.66-7.56a15 15 0 0 0-6.51-1.53 15 15 0 0 0-6.6 1.5l-15.57 7.53 2.46-17.76q.051-.93 0-1.86a13.9 13.9 0 0 0-3.9-9.63L12 40.635l17.64-3.21a13.62 13.62 0 0 0 9.84-7.02z" }, to: { replaceWith: '<span class="svelte-heaw3b"><div class="hoverable svelte-bbyuql" bis_skin_checked="1"><span class="wrap svelte-nc081s" style=""><svg fill="none" viewBox="0 0 96 96" class="svg-icon " style="font-size: var(--text-size-md);"> <title></title> <path fill="#6FDDE7" d="M45.237 83.04 23.797 93.4c-3.76 1.8-8-1.28-7.44-5.4l3.28-24.12c.2-1.56-.32-3.16-1.4-4.32L1.437 42c-2.88-3-1.24-8 2.84-8.72l23.96-4.32a5.28 5.28 0 0 0 3.68-2.68l11.52-21.44c1.96-3.64 7.2-3.64 9.16 0l11.52 21.44c.76 1.4 2.12 2.4 3.68 2.68l23.96 4.32c4.08.72 5.72 5.72 2.84 8.72l-16.84 17.56a5.33 5.33 0 0 0-1.4 4.32L79.637 88c.56 4.12-3.68 7.2-7.44 5.4l-21.44-10.36c-1.72-.84-3.76-.84-5.52 0"></path><path fill="#0F212E" d="M22.637 72V36h10.88v36zm19.92 0V36h10.88v36zm19.92 0V36h10.88v36z"></path></svg></span></div><!----></span>' }},
    { from: { fill: "#C69C6D", d: "m48.002 14.603 8.48 15.757 9.677 7.068l.08.012 17.64 3.2L71.48 53.56a13.84 13.84 0 0 0-3.884 9.63q0 .978.132 1.922l-.01-.072 2.44 17.758L54.52 75.24c-1.908-.934-4.15-1.48-6.52-1.48s-4.613.546-6.608 1.518l.09-.039-15.637 7.56 2.438-17.759c.078-.555.123-1.197.123-1.85 0-3.741-1.482-7.137-3.887-9.633l.003.003-12.518-12.92 17.638-3.2a13.64 13.64 0 0 0 9.842-7.008l.036-.072zm0-12.521h-.01a5.2 5.2 0 0 0-4.577 2.733l-.015.027L32 26.28a5.3 5.3 0 0 1-3.648 2.675l-.033.006-23.997 4.32C1.853 33.717 0 35.847 0 38.406a5.2 5.2 0 0 0 1.443 3.596L1.44 42l16.837 17.558a5.06 5.06 0 0 1 1.473 3.578q0 .458-.078.894l.006-.030L16.4 87.997a5.2 5.2 0 0 0 5.148 5.918h.012c.045.003.102.003.156.003.834 0 1.623-.207 2.31-.576l-.027.013 21.397-10.32a6.2 6.2 0 0 1 2.76-.638c1.004 0 1.952.236 2.795.653l-.036-.014 21.08 10.319a4.7 4.7 0 0 0 2.249.56h.033-.003c.051.003.111.003.171.003a5.2 5.2 0 0 0 5.144-5.948l.004.027-3.28-23.998a5.06 5.06 0 0 1 1.4-4.32l16.84-17.557a5.18 5.18 0 0 0 1.448-3.6c0-2.55-1.836-4.67-4.257-5.114l-.033-.006-23.997-4.32a5.3 5.3 0 0 1-3.705-2.768l-.015-.030-11.399-21.44a5.2 5.2 0 0 0-4.593-2.759h-.008z" }, to: { replaceWith: '<div class="hoverable svelte-bbyuql" bis_skin_checked="1"><span class="wrap svelte-nc081s" style=""><svg fill="none" viewBox="0 0 96 96" class="svg-icon " style="font-size: var(--text-size-md);"> <title></title> <path fill="#6FDDE7" d="M45.237 83.04 23.797 93.4c-3.76 1.8-8-1.28-7.44-5.4l3.28-24.12c.2-1.56-.32-3.16-1.4-4.32L1.437 42c-2.88-3-1.24-8 2.84-8.72l23.96-4.32a5.28 5.28 0 0 0 3.68-2.68l11.52-21.44c1.96-3.64 7.2-3.64 9.16 0l11.52 21.44c.76 1.4 2.12 2.4 3.68 2.68l23.96 4.32c4.08.72 5.72 5.72 2.84 8.72l-16.84 17.56a5.33 5.33 0 0 0-1.4 4.32L79.637 88c.56 4.12-3.68 7.2-7.44 5.4l-21.44-10.36c-1.72-.84-3.76-.84-5.52 0"></path><path fill="#0F212E" d="M23.997 72V36h10.88v36zm29.4 0-13.28-36h12.36l7.76 24.24L67.997 36h12.36l-13.28 36h-13.72z"></path></svg></span></div>' }},
    { from: { fill: "#0F212E", d: "M42.557 72V36h10.88v36z" }, to: { replaceWith: '<span class="svelte-heaw3b"><div class="hoverable svelte-bbyuql" bis_skin_checked="1"><span class="wrap svelte-nc081s" style=""><svg fill="none" viewBox="0 0 96 96" class="svg-icon " style="font-size: var(--text-size-md);"> <title></title> <path fill="#6FDDE7" d="M45.237 83.04 23.797 93.4c-3.76 1.8-8-1.28-7.44-5.4l3.28-24.12c.2-1.56-.32-3.16-1.4-4.32L1.437 42c-2.88-3-1.24-8 2.84-8.72l23.96-4.32a5.28 5.28 0 0 0 3.68-2.68l11.52-21.44c1.96-3.64 7.2-3.64 9.16 0l11.52 21.44c.76 1.4 2.12 2.4 3.68 2.68l23.96 4.32c4.08.72 5.72 5.72 2.84 8.72l-16.84 17.56a5.33 5.33 0 0 0-1.4 4.32L79.637 88c.56 4.12-3.68 7.2-7.44 5.4l-21.44-10.36c-1.72-.84-3.76-.84-5.52 0"></path><path fill="#0F212E" d="M22.637 72V36h10.88v36zm19.92 0V36h10.88v36zm19.92 0V36h10.88v36z"></path></svg></span></div><!----></span>' }}
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

  const replaceRewardElements = () => {
    const rakebackHTML = `
      <div class="flex flex-col p-4 rounded-lg bg-grey-700 gap-2.5" bis_skin_checked="1"><div class="flex w-full justify-between items-center gap-4" bis_skin_checked="1"><div class="flex items-center gap-4" bis_skin_checked="1"><div class="flex flex-col" bis_skin_checked="1"><svg width="55" height="64" viewBox="0 0 55 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M55 16.6384V48.1134L32.8992 60.7601L27.5 63.85L22.1008 60.7601L0 48.1134V16.6384L27.5 0.900024L55 16.6384Z" fill="#0A1D29"></path><path d="M52.8107 19.0523V45.6979C52.8107 46.4172 52.4234 47.0829 51.7954 47.4426L32.8992 58.2547L28.5153 60.7636C27.8856 61.125 27.1128 61.125 26.483 60.7636L22.1009 58.2564L3.20291 47.4426C2.5749 47.0829 2.18762 46.4172 2.18762 45.6979V19.0523C2.18762 18.333 2.5749 17.669 3.20291 17.3093L26.483 3.98654C27.1128 3.62688 27.8873 3.62688 28.5153 3.98654L51.7954 17.3093C52.4234 17.669 52.8107 18.333 52.8107 19.0523Z" fill="url(#paint0_linear_16329_1560)"></path><path d="M52.8107 19.0523V32.3751H2.18762V19.0523C2.18762 18.333 2.5749 17.669 3.20291 17.3093L26.483 3.98654C27.1128 3.62688 27.8873 3.62688 28.5153 3.98654L51.7954 17.3093C52.4234 17.669 52.8107 18.333 52.8107 19.0523Z" fill="url(#paint1_linear_16329_1560)"></path><path d="M52.8107 32.375V41.522C52.8107 42.0165 52.4234 42.473 51.7954 42.7203L28.5153 51.8656C27.8873 52.1145 27.1128 52.1145 26.483 51.8656L3.20291 42.7186C2.5749 42.4713 2.18762 42.0148 2.18762 41.5203V32.3733H52.8107V32.375Z" fill="url(#paint2_linear_16329_1560)"></path><path d="M33.568 32.375V46.5917L28.8213 48.3572C28.4148 48.5076 27.9578 48.5837 27.5007 48.5837C27.0437 48.5837 26.5866 48.5093 26.1802 48.3572L21.334 46.5537V32.375H33.568Z" fill="#1D303C"></path><path d="M49.6413 32.375V39.6286C49.6413 40.2355 49.1354 40.801 48.3207 41.1035L34.6143 46.2027L33.5676 46.5917L28.8209 48.3572C28.4144 48.5076 27.9574 48.5837 27.5003 48.5837C27.0433 48.5837 26.5862 48.5093 26.1798 48.3572L21.3336 46.5537L20.2869 46.1647L6.67995 41.1035C5.86527 40.7992 5.35938 40.2355 5.35938 39.6286V32.375H6.58051V39.6286C6.58051 39.9554 6.85265 40.258 7.29052 40.4223L20.2869 45.2569L21.3336 45.6459L26.7903 47.6759C27.2282 47.8384 27.7725 47.8384 28.2103 47.6759L33.5676 45.6822L34.6143 45.2932L47.7101 40.4223C48.148 40.258 48.4201 39.9554 48.4201 39.6286V32.375H49.6413Z" fill="#1D303C"></path><path d="M49.6413 21.2171V32.3751H48.4201V21.2171C48.4201 20.7157 48.148 20.2471 47.7101 19.9964L28.2103 8.83842C27.9923 8.71392 27.7463 8.64994 27.5003 8.64994C27.2544 8.64994 27.0084 8.71392 26.7903 8.83842L7.29052 19.9964C6.85265 20.2471 6.58051 20.7157 6.58051 21.2171V32.3751H5.35938V21.2171C5.35938 20.2851 5.86527 19.4154 6.67995 18.9485L26.1798 7.79057C26.9944 7.32371 28.0062 7.32371 28.8209 7.79057L34.3387 10.9479L34.3492 10.9531L48.3207 18.9485C49.1354 19.4154 49.6413 20.2851 49.6413 21.2171Z" fill="#0A1D29"></path><path d="M49.6413 21.2171V32.3751H48.4201V21.2171C48.4201 20.7157 48.148 20.2471 47.7101 19.9964L28.2103 8.83842C27.9923 8.71392 27.7463 8.64994 27.5003 8.64994C27.2544 8.64994 27.0084 8.71392 26.7903 8.83842L7.29052 19.9964C6.85265 20.2471 6.58051 20.7157 6.58051 21.2171V32.3751H5.35938V21.2171C5.35938 20.2851 5.86527 19.4154 6.67995 18.9485L26.1798 7.79057C26.9944 7.32371 28.0062 7.32371 28.8209 7.79057L48.3207 18.9485C49.1354 19.4154 49.6413 20.2851 49.6413 21.2171Z" fill="url(#paint3_linear_16329_1560)"></path><defs><linearGradient id="paint0_linear_16329_1560" x1="2.18762" y1="32.3751" x2="52.8107" y2="32.3751" gradientUnits="userSpaceOnUse"><stop stop-color="#6FDDE7"></stop><stop offset="1" stop-color="#1D303C"></stop></linearGradient><linearGradient id="paint1_linear_16329_1560" x1="2.18762" y1="18.1808" x2="52.8107" y2="18.1808" gradientUnits="userSpaceOnUse"><stop stop-color="#6FDDE7"></stop><stop offset="1" stop-color="#1D303C"></stop></linearGradient><linearGradient id="paint2_linear_16329_1560" x1="2.18762" y1="37.4467" x2="52.8107" y2="37.4467" gradientUnits="userSpaceOnUse"><stop stop-color="#6FDDE7"></stop><stop offset="1" stop-color="#1D303C"></stop></linearGradient><linearGradient id="paint3_linear_16329_1560" x1="5.35938" y1="15.2976" x2="49.6413" y2="15.2976" gradientUnits="userSpaceOnUse"><stop stop-color="#6FDDE7"></stop><stop offset="1" stop-color="#1D303C"></stop></linearGradient></defs></svg></div><div class="flex flex-col gap-0.5" bis_skin_checked="1"><span class="weight-semibold line-height-default align-left size-default text-size-default">Rakeback</span><span class="weight-normal line-height-default align-left size-sm text-size-sm variant-subtle">Available</span></div></div><div class="flex items-center gap-2.5" bis_skin_checked="1"><span class="weight-bold line-height-default align-left numeric svelte-1f6lug3 variant-highlighted">$100,000,000.00</span><button type="button" tabindex="0" class="inline-flex relative items-center gap-2 justify-center rounded-(--ds-radius-md,0.25rem) font-semibold whitespace-nowrap ring-offset-background transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] bg-[--ds-green-500,#00A676] text-[--ds-grey-1000,#0F212E] hover:bg-[--ds-green-400,#00CC92] focus-visible:bg-[--ds-green-400,#00CC92] focus-visible:outline-hidden text-sm leading-normal h-[2.25rem] px-4" data-button-root=""><span class="svelte-12r0off">Claim</span></button></div></div></div>`;
    document.querySelectorAll('div[class*="flex flex-col p-4 rounded-lg"]').forEach(div => {
      if (div.textContent.includes('Rakeback')) {
        div.outerHTML = rakebackHTML;
      }
    });
  };

  const init = async () => {
    await fetchPrices();
    setCurrencyARS(); // Set ARS as the currency for calculations, show USD in UI
    const input = document.querySelector('input[data-testid="input-game-amount"]');
    if (input) {
      input.addEventListener('input', () => {
        convertAll();
        multiplyLTC();
      });
    }
    new MutationObserver(() => {
      setCurrencyARS();
      convertAll();
      multiplyLTC();
      multiplyWagered();
      multiplyStats();
      multiplyDollarAmount();
      replaceARS();
      replaceNoneAndBronze();
      replaceDollarAmount();
      replaceRoimatt();
      replacePaths();
      replaceBorder();
      replaceRewardElements();
    }).observe(document.body, { childList: true, subtree: true });
  };

  init();
})();
