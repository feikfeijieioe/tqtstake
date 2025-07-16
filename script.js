(() => {
  console.clear();
  console.log('Credits: https://t.me/maira & https://t.me/oldmat');

  const COINS = {
    BTC: "bitcoin", ETH: "ethereum", LTC: "litecoin", USDT: "tether", SOL: "solana",
    DOGE: "dogecoin", BCH: "bitcoin-cash", XRP: "ripple", TRX: "tron", EOS: "eos",
    BNB: "binancecoin", USDC: "usd-coin", APE: "apecoin", BUSD: "binance-usd",
    CRO: "crypto-com-chain", DAI: "dai", LINK: "chainlink", SAND: "the-sandbox",
    SHIB: "shiba-inu", UNI: "uniswap", POL: "polygon", TRUMP: "trumpcoin"
  };

  const API = `https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(COINS).join(',')}&vs_currencies=usd`;
  const CONV_SELECTOR = 'div.crypto[data-testid="conversion-amount"]'; 
  const WAGERED_SELECTOR = 'div.currency span.weight-bold.line-height-default.align-left.numeric.svelte-1f6lug3';
  const prices = {}, originalTexts = new WeakMap(), wageredProcessed = new WeakSet(), originalLTCTexts = new WeakMap();

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
    } catch {
      console.log('probleme avec api coin geko bg');
    }
  };

  const convertAll = () => {
    console.log('convertAll en cours');
    const val = document.querySelector('input[data-test="input-game-amount"]')?.value;
    const amount = val ? Math.max(0, +val) || null : null;
    document.querySelectorAll(CONV_SELECTOR).forEach(div => {
      if (!originalTexts.has(div)) originalTexts.set(div, div.textContent);
      const cur = (div.textContent.match(/([A-Z]{2,5})$/)?.[1] || '').toLowerCase();
      const price = prices[cur];
      const newText = amount && price ? `${(amount / price).toFixed(8)} ${cur.toUpperCase()}` : originalTexts.get(div);
      div.textContent = newText;
      console.log(`Converted ${div.textContent} to ${newText}`);
    });
  };

  const multiplyLTC = () => {
    console.log(' multiplyLTC en cours');
    const ltcElements = document.querySelectorAll(CONV_SELECTOR);
    console.log(`Found ${ltcElements.length} elements matching ${CONV_SELECTOR}`);

    const input = document.querySelector('input[data-test="input-game-amount"]');
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
    console.log(' multiplyWagered en cours');
    const wageredSpans = document.querySelectorAll(WAGERED_SELECTOR);
    wageredSpans.forEach(wageredSpan => {
      if (!wageredProcessed.has(wageredSpan)) {
        const text = wageredSpan.textContent.trim();
        const match = text.match(/^\$([\d,.]+)/);
        if (!match) {
          console.log(`No valid amount found in "${text}"`);
          return;
        }

        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
          console.log(`Invalid amount parsed: ${amount}`);
          return;
        }

        const multiplied = amount * 450;
        if (isFinite(multiplied)) {
          wageredSpan.textContent = `$${formatNumber(multiplied)}`;
          wageredProcessed.add(wageredSpan);
          console.log(`Updated wagered amount to: $${formatNumber(multiplied)}`);
        }
      }
    });
  };

  const replaceARS = () => {
    console.log(' replaceARS en cours');
    const elements = getElements();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => shouldSkip(n, elements) ? NodeFilter.FILTER_REJECT : n.nodeValue.includes('ARS') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let node;
    while (node = walker.nextNode()) {
      node.nodeValue = node.nodeValue.replace(/ARS[\s\u00A0]*/g, isUSDElement(node, elements) ? 'USD' : '$');
      console.log(`Replaced ARS with ${isUSDElement(node, elements) ? 'USD' : '$'} in "${node.nodeValue}"`);
    }
  };

  const replaceNoneAndBronze = () => {
    console.log(' replaceNoneAndBronze en cours');
    const elements = getElements();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => shouldSkip(n, elements) ? NodeFilter.FILTER_REJECT : n.nodeValue.includes('None') || n.nodeValue.includes('Bronze') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let node;
    while (node = walker.nextNode()) {
      node.nodeValue = node.nodeValue.replace(/\bNone\b/g, 'Platinum II').replace(/\bBronze\b/g, 'Platinum III');
      console.log(`Replaced None/Bronze with Platinum II/III in "${node.nodeValue}"`);
    }
  };

  const pathReplacements = [
    { from: { fill: "#FFC800", d: "M48 96c26.51 0 48-21.49" }, to: { fill: "#6CDE07", d: "M48 96c26.51 0 48-21.49 48-48S74.51 0 48 0 0 21.49 0 48s21.49 48 48 48" }},
    { from: { fill: "#276304", d: "M79.2 67.32v-4.56l.04.04c5.52-1" }, to: { fill: "#1B3802", d: "M51.52 73.32v6.56h-5.8V73.4c-7.56-.6-13.08-3.56-16.92-7.64l4.72-6.56c2.84 3 6.96 5.68 12.2 6.48V51.64c-7.48-1.88-15.4-4.64-15.4-14.12 0-7.4 6.04-13.32 15.4-14.12v-6.68h5.8v6.84c5.96.6 10.84 2.92 14.6 6.56l-4.88 6.32c-2.68-2.68-6.12-4.36-9.76-5.08v12.52c7.56 2.04 15.72 4.88 15.72 14.6 0 7.4-4.8 13.8-15.72 14.84zm-5.8-30.96V31.04c-4.16.44-6.68 2.68-6.68 5.96 0 2.84 2.84 4.28 6.68 5.36M58.6 59.28c0-3.36-3-4.88-7.04-6.12v12.52c5-.72 7.04-3.64 7.04-6.4" }},
    { from: { fill: "#2F4553", d: "m48 14.595 8.49 15.75a13.68 13.68 0 0 0 9.66 7.08L84 40.635l-12.39 12.9a13.9 13.9 0 0 0-3.9 9.63q-.069.96 0 1.92l2.46 17.76-15.66-7.56a15 15 0 0 0-6.51-1.53 15 15 0 0 0-6.6 1.5l-15.57 7.53 2.46-17.76q.051-.93 0-1.86a13.9 13.9 0 0 0-3.9-9.63L12 40.635l17.64-3.21a13.62 13.62 0 0 0 9.84-7.02z" }, to: { replaceWith: '<span class="wrap svelte-nc081s"><svg fill="none" viewBox="0 0 96 96" class="svg-icon" style="font-size: var(--text-size-md);"><title></title><path fill="#6FDDE7" d="M45.237 83.04 23.797 93.4c-3.76 1.8-8-1.28-7.44-5.4l3.28-24.12c.2-1.56-.32-3.16-1.4-4.32L1.437 42c-2.88-3-1.24-8 2.84-8.72l23.96-4.32a5.28 5.28 0 0 0 3.68-2.68l11.52-21.44c1.96-3.64 7.2-3.64 9.16 0l11.52 21.44c.76 1.4 2.12 2.4 3.68 2.68l23.96 4.32c4.08.72 5.72 5.72 2.84 8.72l-16.84 17.56a5.33 5.33 0 0 0-1.4 4.32L79.637 88c.56 4.12-3.68 7.2-7.44 5.4l-21.44-10.36c-1.72-.84-3.76-.84-5.52 0"></path><path fill="#0F212E" d="M32.597 72.16v-36h10.88v36zm19.92 0v-36h10.88v36z"></path></svg></span>' }},
    { from: { fill: "#C69C6D", d: "m48.002 14.603 8.48 15.757c1.97 3.693 5.495 6.336 9.677 7.068l.08.012 17.64 3.2L71.48 53.56a13.84 13.84 0 0 0-3.884 9.63q0 .978.132 1.922l-.01-.072 2.44 17.758L54.52 75.24c-1.908-.934-4.15-1.48-6.52-1.48s-4.613.546-6.608 1.518l.09-.039-15.637 7.56 2.438-17.759c.078-.555.123-1.197.123-1.85 0-3.741-1.482-7.137-3.887-9.633l.003.003-12.518-12.92 17.638-3.2a13.64 13.64 0 0 0 9.842-7.008l.036-.072zm0-12.521h-.01a5.2 5.2 0 0 0-4.577 2.733l-.015.027L32 26.28a5.3 5.3 0 0 1-3.648 2.675l-.033.006-23.997 4.32C1.853 33.717 0 35.847 0 38.406a5.2 5.2 0 0 0 1.443 3.596L1.44 42l16.837 17.558a5.06 5.06 0 0 1 1.473 3.578q0 .458-.078.894l.006-.03L16.4 87.997a5.2 5.2 0 0 0 5.148 5.918h.012c.045.003.102.003.156.003.834 0 1.623-.207 2.31-.576l-.027.013 21.397-10.32a6.2 6.2 0 0 1 2.76-.638c1.004 0 1.952.236 2.795.653l-.036-.014 21.08 10.319a4.7 4.7 0 0 0 2.249.56h.033-.003c.051.003.111.003.171.003a5.2 5.2 0 0 0 5.144-5.948l.004.027-3.28-23.998a5.06 5.06 0 0 1 1.4-4.32l16.84-17.557a5.18 5.18 0 0 0 1.448-3.6c0-2.55-1.836-4.67-4.257-5.114l-.033-.006-23.997-4.32a5.3 5.3 0 0 1-3.705-2.768l-.015-.03-11.399-21.44a5.2 5.2 0 0 0-4.593-2.759h-.008z" }, to: { replaceWith: '<span class="wrap svelte-nc081s" style=""><svg fill="none" viewBox="0 0 96 96" class="svg-icon " style="font-size: var(--text-size-md);"><title></title><path fill="#6FDDE7" d="M45.237 83.04 23.797 93.4c-3.76 1.8-8-1.28-7.44-5.4l3.28-24.12c.2-1.56-.32-3.16-1.4-4.32L1.437 42c-2.88-3-1.24-8 2.84-8.72l23.96-4.32a5.28 5.28 0 0 0 3.68-2.68l11.52-21.44c1.96-3.64 7.2-3.64 9.16 0l11.52 21.44c.76 1.4 2.12 2.4 3.68 2.68l23.96 4.32c4.08.72 5.72 5.72 2.84 8.72l-16.84 17.56a5.33 5.33 0 0 0-1.4 4.32L79.637 88c.56 4.12-3.68 7.2-7.44 5.4l-21.44-10.36c-1.72-.84-3.76-.84-5.52 0"></path><path fill="#0F212E" d="M22.637 72V36h10.88v36zm19.92 0V36h10.88v36zm19.92 0V36h10.88v36z"></path></svg></span>' }},
    { from: { fill: "#0F212E", d: "M42.557 72V36h10.88v36z" }, to: { replaceWith: '<span class="wrap svelte-nc081s" style=""><svg fill="none" viewBox="0 0 96 96" class="svg-icon " style="font-size: var(--text-size-md);"><title></title><path fill="#6FDDE7" d="M45.237 83.04 23.797 93.4c-3.76 1.8-8-1.28-7.44-5.4l3.28-24.12c.2-1.56-.32-3.16-1.4-4.32L1.437 42c-2.88-3-1.24-8 2.84-8.72l23.96-4.32a5.28 5.28 0 0 0 3.68-2.68l11.52-21.44c1.96-3.64 7.2-3.64 9.16 0l11.52 21.44c.76 1.4 2.12 2.4 3.68 2.68l23.96 4.32c4.08.72 5.72 5.72 2.84 8.72l-16.84 17.56a5.33 5.33 0 0 0-1.4 4.32L79.637 88c.56 4.12-3.68 7.2-7.44 5.4l-21.44-10.36c-1.72-.84-3.76-.84-5.52 0"></path><path fill="#0F212E" d="M22.637 72V36h10.88v36zm19.92 0V36h10.88v36zm19.92 0V36h10.88v36z"></path></svg></span>' }}
  ];

  const deleteAttrs = { fill: "#276304", "fill-rule": "evenodd", d: "m27.8 62.4-1.24-5.08H16.52" };
  const matches = (el, attrs) => Object.entries(attrs).every(([k, v]) => k === 'd' ? el.getAttribute(k)?.startsWith(v) : el.getAttribute(k) === v);

  const replacePaths = () => {
    console.log(' replacePaths en cours');
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
            console.log('Replaced SVG with new span');
          }
        } else {
          Object.entries(replacement.to).forEach(([k, v]) => path.setAttribute(k, v));
          console.log(`Updated path attributes: ${JSON.stringify(replacement.to)}`);
        }
      } else if (matches(path, deleteAttrs)) {
        path.remove();
        console.log('Removed path matching deleteAttrs');
      }
    });
  };

  const replaceBorder = () => {
    console.log(' replaceBorder en cours');
    document.querySelectorAll('div.flex.flex-col.justify-center.rounded-lg.w-full.bg-grey-700').forEach(div => {
      if (div.style.border === '2px solid rgb(47, 69, 83)') {
        div.style.border = '2px solid #6fdde7';
        console.log('Updated border to #6fdde7');
      }
    });
  };

  const replaceRewardElements = () => {
    console.log('replaceRewardElements en cours');
    const rakebackHTML = `
      <div class="flex flex-col p-4 rounded-lg bg-grey-700 gap-2.5" bis_skin_checked="1"><div class="flex w-full justify-between items-center gap-4" bis_skin_checked="1"><div class="flex items-center gap-4" bis_skin_checked="1"><div class="flex flex-col" bis_skin_checked="1"><svg width="55" height="64" viewBox="0 0 55 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M55 16.6384V48.1134L32.8992 60.7601L27.5 63.85L22.1008 60.7601L0 48.1134V16.6384L27.5 0.900024L55 16.6384Z" fill="#0A1D29"></path><path d="M52.8107 19.0523V45.6979C52.8107 46.4172 52.4234 47.0829 51.7954 47.4426L32.8992 58.2547L28.5153 60.7636C27.8856 61.125 27.1128 61.125 26.483 60.7636L22.1009 58.2564L3.20291 47.4426C2.5749 47.0829 2.18762 46.4172 2.18762 45.6979V19.0523C2.18762 18.333 2.5749 17.669 3.20291 17.3093L26.483 3.98654C27.1128 3.62688 27.8856 3.62688 28.5153 3.98654L51.7954 17.3093C52.4234 17.669 52.8107 18.333 52.8107 19.0523Z" fill="url(#paint0_linear_16329_1560)"></path><path d="M52.8107 19.0523V32.3751H2.18762V19.0523C2.18762 18.333 2.5749 17.669 3.20291 17.3093L26.483 3.98654C27.1128 3.62688 27.8873 3.62688 28.5153 3.98654L51.7954 17.3093C52.4234 17.669 52.8107 18.333 52.8107 19.0523Z" fill="url(#paint1_linear_16329_1560)"></path><path d="M52.8107 32.375V41.522C52.8107 42.0165 52.4234 42.473 51.7954 42.7203L28.5153 51.8656C27.8873 52.1145 27.1128 52.1145 26.483 51.8656L3.20291 42.7186C2.5749 42.4713 2.18762 42.0148 2.18762 41.5203V32.3733H52.8107V32.375Z" fill="url(#paint2_linear_16329_1560)"></path><path d="M33.568 32.375V46.5917L28.8213 48.3572C28.4148 48.5076 27.9578 48.5837 27.5007 48.5837C27.0437 48.5837 26.5866 48.5093 26.1802 48.3572L21.334 46.5537V32.375H33.568Z" fill="#1D303C"></path><path d="M49.6413 32.375V39.6286C49.6413 40.2355 49.1354 40.801 48.3207 41.1035L34.6143 46.2027L33.5676 46.5917L28.8209 48.3572C28.4144 48.5076 27.9574 48.5837 27.5003 48.5837C27.0433 48.5837 26.5862 48.5093 26.1798 48.3572L21.3336 46.5537L20.2869 46.1647L6.67995 41.1035C5.86527 40.7992 5.35938 40.2355 5.35938 39.6286V32.375H6.58051V39.6286C6.58051 39.9554 6.85265 40.258 7.29052 40.4223L20.2869 45.2569L21.3336 45.6459L26.7903 47.6759C27.2282 47.8384 27.7725 47.8384 28.2103 47.6759L33.5676 45.6822L34.6143 45.2932L47.7101 40.4223C48.148 40.258 48.4201 39.9554 48.4201 39.6286V32.375H49.6413Z" fill="#1D303C"></path><path d="M49.6413 21.2171V32.3751H48.4201V21.2171C48.4201 20.7157 48.148 20.2471 47.7101 19.9964L28.2103 8.83842C27.9923 8.71392 27.7463 8.64994 27.5003 8.64994C27.2544 8.64994 27.0084 8.71392 26.7903 8.83842L7.29052 19.9964C6.85265 20.2471 6.58051 20.7157 6.58051 21.2171V32.3751H5.35938V21.2171C5.35938 20.2851 5.86527 19.4154 6.67995 18.9485L26.1798 7.79057C26.9944 7.32371 28.0062 7.32371 28.8209 7.79057L34.3387 10.9479L34.3492 10.9531L48.3207 18.9485C49.1354 19.4154 49.6413 20.2851 49.6413 21.2171Z" fill="#0A1D29"></path><path d="M49.6413 21.2171V32.3751H48.4201V21.2171C48.4201 20.7157 48.148 20.2471 47.7101 19.9964L28.2103 8.83842C27.9923 8.71392 27.7463 8.64994 27.5003 8.64994C27.2544 8.64994 27.0084 8.71392 26.7903 8.83842L7.29052 19.9964C6.85265 20.2471 6.58051 20.7157 6.58051 21.2171V32.3751H5.35938V21.2171C5.35938 20.2851 5.86527 19.4154 6.67995 18.9485L26.1798 7.79057C26.9944 7.32371 28.0062 7.32371 28.8209 7.79057L34.3387 10.9479L34.3492 10.9531L48.3207 18.9485C49.1354 19.4154 49.6413 20.2851 49.6413 21.2171Z" fill="url(#paint3_linear_16329_1560)"></path><path d="M39.6185 27.6095H33.5669V32.375H21.3329V27.6095H15.2812L27.4508 14.885L39.6185 27.6095Z" fill="url(#paint4_linear_16329_1560)"></path><path d="M27.449 16.8752L15.2812 27.6095L27.4508 14.885L27.449 16.8752Z" fill="white"></path><defs><linearGradient id="paint0_linear_16329_1560" x1="27.5" y1="91.547" x2="27.5" y2="30.3192" gradientUnits="userSpaceOnUse"><stop stop-color="#0A1D29"></stop><stop offset="1" stop-color="#1D303C"></stop></linearGradient><linearGradient id="paint1_linear_16329_1560" x1="27.5" y1="32.9612" x2="27.5" y2="4.25282" gradientUnits="userSpaceOnUse"><stop stop-color="#213743"></stop><stop offset="1" stop-color="#2F4653"></stop></linearGradient><linearGradient id="paint2_linear_16329_1560" x1="27.5" y1="-8.04985" x2="27.5" y2="49.7837" gradientUnits="userSpaceOnUse"><stop stop-color="#213743"></stop><stop offset="1" stop-color="#2F4653"></stop></linearGradient><linearGradient id="paint3_linear_16329_1560" x1="27.5003" y1="4.83898" x2="27.5003" y2="36.4782" gradientUnits="userSpaceOnUse"><stop stop-color="#FFBB62"></stop><stop offset="1" stop-color="#E27837"></stop></linearGradient><linearGradient id="paint4_linear_16329_1560" x1="27.449" y1="12.1634" x2="27.449" y2="37.3548" gradientUnits="userSpaceOnUse"><stop stop-color="#FFBB62"></stop><stop offset="1" stop-color="#E27837"></stop></linearGradient></defs></svg></div> <div class="flex flex-col" bis_skin_checked="1"><h2 class="weight-bold line-height-120pct align-left size-md text-size-md  variant-highlighted  with-icon-space   svelte-1f6lug3" style="">Rakeback</h2><span class="weight-normal line-height-120pct align-left size-default text-size-default  variant-subtle  with-icon-space   svelte-1f6lug3" style="">New Rakeback available!</span></div></div> <button type="button" tabindex="0" class="inline-flex relative items-center gap-2 justify-center rounded-sm font-semibold whitespace-nowrap ring-offset-background transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] bg-blue-500 text-white hover:bg-blue-600 hover:text-white focus-visible:outline-white text-xs leading-none shadow-md py-[0.75rem] px-[0.75rem]" data-analytics="vip-reward-claim-rakeback" data-testid="vip-reward-claim-rakeback" data-button-root="">Claim</button></div>
    `;
    const weeklyBoostHTML = `
      <div data-state="closed" data-melt-collapsible="" data-collapsible-root="" class="flex flex-col w-full rounded-lg bg-grey-700" bis_skin_checked="1"><button data-state="closed" data-melt-collapsible-trigger="" data-collapsible-trigger="" type="button" data-analytics="vip-reward-description-weekly-boost-open" class="flex w-full justify-between items-center gap-4 transition-all [&[data-state=open]>svg]:rotate-180 p-4"><div class="flex items-center gap-4" bis_skin_checked="1"><div class="flex flex-col" bis_skin_checked="1"><svg width="55" height="64" viewBox="0 0 55 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M55 48.063V16.5871L27.5 0.849976L0 16.5871V48.063L27.5 63.8018L55 48.063Z" fill="#0A1D29"></path><path d="M52.8121 45.6489V19.0025C52.8121 18.2832 52.4248 17.6175 51.7968 17.2578L28.5167 3.93637C27.8887 3.57671 27.1141 3.57671 26.4844 3.93637L3.20425 17.2578C2.57624 17.6175 2.18896 18.2832 2.18896 19.0025V45.6489C2.18896 46.3682 2.57624 47.034 3.20425 47.3936L26.4844 60.7168C27.1124 61.0765 27.8869 61.0765 28.5167 60.7168L51.7968 47.3936C52.4248 47.034 52.8121 46.3682 52.8121 45.6489Z" fill="url(#paint0_linear_16329_13)"></path><path d="M48.4332 39.5351V25.1174C48.4332 22.1657 46.8439 19.4371 44.2656 17.9621L31.6687 10.7533C29.0903 9.27658 25.9119 9.27658 23.3336 10.7533L10.7367 17.9621C8.15831 19.4388 6.56909 22.1657 6.56909 25.1174V39.5351C6.56909 42.4868 8.15831 45.2154 10.7367 46.6904L23.3336 53.8993C25.9119 55.376 29.0903 55.376 31.6687 53.8993L44.2656 46.6904C46.8439 45.2137 48.4332 42.4868 48.4332 39.5351Z" fill="#1D303C"></path><path d="M27.5006 48.4089C36.4616 48.4089 43.726 41.2083 43.726 32.326C43.726 23.4436 36.4616 16.243 27.5006 16.243C18.5395 16.243 11.2751 23.4436 11.2751 32.326C11.2751 41.2083 18.5395 48.4089 27.5006 48.4089Z" fill="url(#paint1_linear_16329_13)"></path><path d="M40.4024 30.2921C41.1368 34.8969 39.3347 39.7385 35.2998 42.7161C29.5116 46.9837 21.3265 45.7923 17.0211 40.0532C12.714 34.3159 13.9159 26.2027 19.7041 21.9351C23.0448 19.4728 27.1809 18.8295 30.9106 19.829C30.9229 19.8324 30.9333 19.8359 30.9455 19.8393C31.0973 19.8808 31.2473 19.9241 31.3991 19.9708C31.4357 19.9829 31.4724 19.9932 31.5107 20.0053C31.6712 20.0572 31.8317 20.1108 31.9922 20.1679C32.3935 20.3114 32.7895 20.4774 33.1767 20.6607L46.7505 18.124L40.4041 30.2921H40.4024Z" fill="url(#paint2_linear_16329_13)"></path><path d="M27.5 43.3024C33.616 43.3024 38.574 38.388 38.574 32.3257C38.574 26.2634 33.616 21.349 27.5 21.349C21.384 21.349 16.426 26.2634 16.426 32.3257C16.426 38.388 21.384 43.3024 27.5 43.3024Z" fill="url(#paint3_linear_16329_13)"></path><path d="M46.7496 18.124L35.3128 21.9541H35.311C34.6464 21.4613 33.9311 21.029 33.1793 20.6693L33.1758 20.6624L46.7496 18.1258V18.124Z" fill="white"></path><defs><linearGradient id="paint0_linear_16329_13" x1="27.4996" y1="74.9253" x2="27.4996" y2="11.6709" gradientUnits="userSpaceOnUse"><stop stop-color="#213743"></stop><stop offset="1" stop-color="#2F4653"></stop></linearGradient><linearGradient id="paint1_linear_16329_13" x1="39.6718" y1="57.5682" x2="20.7359" y2="17.5984" gradientUnits="userSpaceOnUse"><stop stop-color="#0A1D29"></stop><stop offset="1" stop-color="#1D303C"></stop></linearGradient><linearGradient id="paint2_linear_16329_13" x1="47.553" y1="17.3701" x2="15.8885" y2="41.4058" gradientUnits="userSpaceOnUse"><stop stop-color="#FFBB62"></stop><stop offset="1" stop-color="#E27837"></stop></linearGradient><linearGradient id="paint3_linear_16329_13" x1="16.7069" y1="40.9179" x2="37.6671" y2="23.9351" gradientUnits="userSpaceOnUse"><stop stop-color="#FFBB62"></stop><stop offset="1" stop-color="#E27837"></stop></linearGradient></defs></svg></div><div class="flex flex-col" bis_skin_checked="1"><h2 class="weight-bold line-height-120pct align-left size-md text-size-md  variant-highlighted  with-icon-space   svelte-1f6lug3" style="">Weekly Boost</h2><span class="weight-normal line-height-120pct align-left size-default text-size-default  variant-subtle  with-icon-space   svelte-1f6lug3" style="">Next Weekly Boost in:</span><div class="flex chromatic-ignore" bis_skin_checked="1"><span class="weight-semibold line-height-120pct align-left size-default text-size-default  variant-subtle  with-icon-space   svelte-1f6lug3" style=""><span class="chromatic-ignore">03d 01h 12m </span></span></div></div></div> <svg fill="currentColor" viewBox="0 0 64 64" class="svg-icon w-4 h-4 transition-all duration-50" style=""> <title></title> <path d="M32.274 49.762 9.204 26.69l6.928-6.93 16.145 16.145L48.42 19.762l6.93 6.929-23.072 23.07z"></path></svg></button></div>
    `;
    document.querySelectorAll('div.p-4.rounded-lg.bg-grey-700.gap-2\\.5').forEach(div => {
      const header = div.querySelector('h2')?.textContent.trim();
      if (header === 'Rakeback') {
        div.outerHTML = rakebackHTML;
        console.log('Rakeback element replaced');
      } else if (header === 'Weekly Boost') {
        div.outerHTML = weeklyBoostHTML;
        console.log('Weekly Boost element replaced');
      } else {
        console.log('No matching header found for element');
      }
    });
  };

  const replaceCurrencyElements = () => {
    console.log('replaceCurrencyElements en cours');
    const arsHTML = `
      <label data-test="currency-ars-label" class="svelte-1ww0eyq" style="flex-direction: row; cursor: pointer;"><input type="radio" data-test="currency-ars-label" data-testid="currency-ars" class="svelte-84lle0"> <span class="indicator variant-default svelte-84lle0"></span> <span class="label-content svelte-1op7o5r full-width" style="padding-top: 4px; margin-left: var(--spacing-2);"><span class="label svelte-1v7ekjb" slot="label"><span>ARS</span> <svg fill="none" viewBox="0 0 96 96" class="svg-icon " style=""> <title></title> <path fill="#FFC800" d="M48 96c26.51 0 48-21.49 48-48S74.51 0 48 0 0 21.49 0 48s21.49 48 48 48"></path><path fill="#276304" d="M79.2 67.32v-4.56l.04.04c5.52-1 8.64-4.88 8.64-10.16 0-6.6-5.56-8.64-9.72-10.16-2.84-1.04-4.68-1.92-4.68-3.68 0-1.48 1.08-2.6 3.32-2.6s4.84.84 6.88 2.68l3.6-5.88c-2.16-1.88-4.96-3.12-8.08-3.56v-4.56h-5.12v4.64c-5.64.96-8.72 5.12-8.72 9.68 0 6.657 5.28 8.558 9.427 10.05l.413.15c2.72 1.04 4.64 1.96 4.64 3.92 0 1.6-1.4 2.84-3.76 2.84-3.12 0-6-1.44-7.92-3.48l-3.76 6.08c2.4 2.32 5.48 3.76 9.68 4.16v4.4z"></path><path fill="#276304" fill-rule="evenodd" d="m27.8 62.4-1.24-5.08H16.52l-1.24 5.08H7.16l9.64-32.6h9.52l9.64 32.6zm-6.2-25.68-3.48 13.8h6.96zM53.36 62.4l-4.32-11.24h-2.92V62.4H38.2V29.8h13.28c6.36 0 10.4 4.6 10.4 10.6 0 5.52-2.84 8.32-5.28 9.4l5.52 12.6zm-3.08-25.8h-4.16v7.76h4.16c2.12 0 3.6-1.52 3.6-3.88s-1.52-3.92-3.6-3.92z" clip-rule="evenodd"></path></svg></span></span></label>
    `;
    const eurHTML = `
      <div bis_skin_checked="1"><label style="flex-direction: row; cursor: pointer;" class="svelte-1ww0eyq" data-test="currency-eur-label"><input type="radio" data-test="currency-eur-label" data-testid="currency-eur" class="svelte-84lle0" checked> <span class="indicator variant-default svelte-84lle0"></span> <span class="label-content svelte-1op7o5r full-width" style="padding-top: 4px; margin-left: var(--spacing-2);"><span class="label svelte-1v7ekjb" slot="label"><span>EUR</span> <svg fill="none" viewBox="0 0 96 96" class="svg-icon " style=""> <title></title> <path fill="#0F8FF8" d="M48 96c26.51 0 48-21.49 48-48S74.51 0 48 0 0 21.49 0 48s21.49 48 48 48"></path><path fill="#fff" d="m62.159 58.758 7.28 3.72c-3.72 5.8-9.68 10.92-19.48 10.92-11.76 0-21.36-6.92-24.44-17.6h-3.8v-4.88h2.92c-.08-.88-.16-1.76-.16-2.6 0-.96.08-1.88.16-2.76h-2.92v-4.88h3.84c3.04-10.6 12.64-17.44 24.36-17.44 9.8 0 15.84 5.08 19.48 10.92l-7.28 3.72c-2.32-4-6.96-7.04-12.2-7.04-7 0-12.64 3.84-15.2 9.88h19.64v4.88h-21c-.08.88-.16 1.8-.16 2.76 0 .88.08 1.76.16 2.6h21v4.88h-19.68c2.56 6.12 8.2 10.04 15.28 10.04 5.24 0 9.88-3 12.2-7.04z"></path></svg></span></span></label></div>
    `;
    document.querySelectorAll('[data-test="currency-ars-label"]').forEach(label => {
      label.outerHTML = arsHTML;
      console.log('ARS currency element replaced');
    });
    document.querySelectorAll('[data-test="currency-eur-label"]').forEach(label => {
      const parentDiv = label.closest('div[bis_skin_checked="1"]');
      if (parentDiv) {
        parentDiv.outerHTML = eurHTML;
        console.log('EUR currency element replaced with checked state');
      } else {
        console.log('No parent div found for EUR label');
      }
    });

    // Force l'apparence visuelle de EUR comme sélectionné
    const eurInput = document.querySelector('[data-test="currency-eur-label"] input[type="radio"]');
    if (eurInput) {
      eurInput.checked = true;
      const indicator = eurInput.nextElementSibling;
      if (indicator && indicator.classList.contains('indicator')) {
        indicator.classList.add('checked');
      }
      console.log('Forced EUR input to checked state');
    }

    // Intercepter et modifier la devise sélectionnée
    const formElements = document.querySelectorAll('form, input, select, button');
    formElements.forEach(el => {
      el.addEventListener('change', (e) => {
        const selectedCurrency = document.querySelector('input[type="radio"][data-testid]:checked')?.getAttribute('data-testid');
        if (selectedCurrency === 'currency-eur') {
          const arsInput = document.querySelector('[data-testid="currency-ars"]');
          if (arsInput) {
            arsInput.setAttribute('data-selected', 'true');
            console.log('Intercepted EUR selection, forcing ARS logic');
          }
        }
        // Sauvegarde de l'état dans localStorage
        const isEurChecked = document.querySelector('[data-testid="currency-eur"]').checked;
        localStorage.setItem('customCurrencyState', JSON.stringify({ eurChecked: isEurChecked }));
      });
    });
  };

  const restoreCurrencyState = () => {
    console.log('Restoring currency state');
    const savedState = localStorage.getItem('customCurrencyState');
    if (savedState) {
      const state = JSON.parse(savedState);
      const eurInput = document.querySelector('[data-test="currency-eur-label"] input[type="radio"]');
      if (eurInput && state.eurChecked) {
        eurInput.checked = true;
        const indicator = eurInput.nextElementSibling;
        if (indicator && indicator.classList.contains('indicator')) {
          indicator.classList.add('checked');
        }
        const arsInput = document.querySelector('[data-testid="currency-ars"]');
        if (arsInput) {
          arsInput.setAttribute('data-selected', 'true');
        }
        console.log('Restored EUR as checked and ARS logic');
      }
    }
  };

  const hookInput = i => {
    if (!i?.dataset.hooked) {
      i.dataset.hooked = '1';
      ['input', 'change'].forEach(e => i.addEventListener(e, () => {
        console.log(`Input event (${e}) triggered`);
        convertAll();
        multiplyLTC();
      }));
    }
  };

  const setupDecimalLogger = () => {
    console.log('decimal OK gros bg');
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
                console.log(`Updated decimal amount to ${convertedAmount} for ${currency}`);
              }
            }
            break;
          }
        }
      });
      logged.forEach(key => !current.has(key) && logged.delete(key));
      multiplyLTC();
      requestAnimationFrame(checkDecimals);
    };
    checkDecimals();
  };

  const setupPersistentObserver = () => {
    console.log('Setting up MutationObserver');
    const observer = new MutationObserver(muts => {
      console.log(`MutationObserver triggered with ${muts.length} mutations`);
      const elements = getElements();
      let ltcChanged = false;
      muts.forEach(m => {
        if (m.type === 'characterData') {
          if (m.target.nodeValue.includes('ARS') && !shouldSkip(m.target, elements)) {
            m.target.nodeValue = m.target.nodeValue.replace(/ARS[\s\u00A0]*/g, isUSDElement(m.target, elements) ? 'USD' : '$');
            console.log(`Replaced ARS in characterData: "${m.target.nodeValue}"`);
          }
          if ((m.target.nodeValue.includes('None') || m.target.nodeValue.includes('Bronze')) && !shouldSkip(m.target, elements)) {
            m.target.nodeValue = m.target.nodeValue.replace(/\bNone\b/g, 'Platinum II').replace(/\bBronze\b/g, 'Platinum III');
            console.log(`Replaced None/Bronze in characterData: "${m.target.nodeValue}"`);
          }
          if (m.target.parentElement?.matches(CONV_SELECTOR) && m.target.nodeValue.includes('LTC')) {
            console.log('LTC characterData change detected');
            ltcChanged = true;
          }
        }
        m.addedNodes.forEach(n => {
          if (n.nodeType === 1) {
            if (n.matches?.('input[data-test="input-game-amount"]')) {
              hookInput(n);
              console.log('Hooked new input element');
            }
            n.querySelectorAll?.('input[data-test="input-game-amount"]').forEach(hookInput);
            n.querySelectorAll?.(WAGERED_SELECTOR).forEach(wageredSpan => {
              if (!wageredProcessed.has(wageredSpan)) {
                multiplyWagered();
                console.log('Processed new wagered span');
              }
            });
            n.querySelectorAll?.('path').forEach(path => replacePaths());
            n.querySelectorAll?.('div.flex.flex-col.justify-center.rounded-lg.w-full.bg-grey-700').forEach(div => replaceBorder());
            n.querySelectorAll?.('div.p-4.rounded-lg.bg-grey-700.gap-2\\.5').forEach(div => {
              replaceRewardElements();
              console.log('New reward element detected, content replaced');
            });
            n.querySelectorAll?.('[data-test="currency-ars-label"], [data-test="currency-eur-label"]').forEach(label => {
              replaceCurrencyElements();
              console.log('New currency element detected, content replaced');
            });
            n.querySelectorAll?.(CONV_SELECTOR).forEach(div => {
              if (div.textContent.includes('LTC')) {
                console.log('New LTC element found in added nodes');
                ltcChanged = true;
              }
            });
            const walker = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, {
              acceptNode: node => (node.nodeValue.includes('None') || node.nodeValue.includes('Bronze')) && !shouldSkip(node, elements) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
            });
            let node;
            while (node = walker.nextNode()) {
              node.nodeValue = node.nodeValue.replace(/\bNone\b/g, 'Platinum II').replace(/\bBronze\b/g, 'Platinum III');
              console.log(`Replaced None/Bronze in new node: "${node.nodeValue}"`);
            }
          }
        });
      });
      multiplyWagered();
      replacePaths();
      replaceBorder();
      replaceARS();
      replaceNoneAndBronze();
      replaceCurrencyElements();
      if (ltcChanged) {
        multiplyLTC();
        console.log('rate du LTC changé');
      }
      // Restaurer l'état à chaque changement
      restoreCurrencyState();
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    console.log('MutationObserver is now observing');
  };

  const waitForLTCElement = () => {
    console.log('attente dun element LTC');
    const check = () => {
      const ltcElements = document.querySelectorAll(CONV_SELECTOR);
      if (ltcElements.length > 0) {
        console.log(`Found ${ltcElements.length} LTC elements, running multiplyLTC`);
        multiplyLTC();
      } else {
        requestAnimationFrame(check);
      }
    };
    requestAnimationFrame(check);
  };

  (async () => {
    console.log('Script initialization');
    await fetchPrices();
    convertAll();
    multiplyWagered();
    multiplyLTC();
    waitForLTCElement();
    document.querySelectorAll('input[data-test="input-game-amount"]').forEach(hookInput);
    replaceARS();
    replaceNoneAndBronze();
    replacePaths();
    replaceBorder();
    replaceRewardElements();
    replaceCurrencyElements();
    restoreCurrencyState(); // Restaurer l'état au chargement initial
    setupDecimalLogger();
    setupPersistentObserver();
    setInterval(() => {
      console.log('Periodic check');
      convertAll();
      multiplyWagered();
      replaceARS();
      replaceNoneAndBronze();
      replacePaths();
      replaceBorder();
      replaceRewardElements();
      replaceCurrencyElements();
      multiplyLTC();
    }, 2000); 
  })();
})();
