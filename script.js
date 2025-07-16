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

  const replaceRewardElement = () => {
    console.log('replaceRewardElement en cours');
    const rewardElement = document.querySelector('div.flex.p-4.rounded-lg.bg-grey-700.gap-2\\.5.flex-row.items-center');
    if (!rewardElement) {
      console.log('Reward element not found');
      return;
    }
    const newRewardHTML = `
      <div data-state="closed" data-melt-collapsible="" data-collapsible-root="" class="flex flex-col w-full rounded-lg bg-grey-700" bis_skin_checked="1">
        <button data-state="closed" data-melt-collapsible-trigger="" data-collapsible-trigger="" type="button" data-analytics="vip-reward-description-monthly-boost-open" class="flex w-full justify-between items-center gap-4 transition-all [&[data-state=open]>svg]:rotate-180 p-4">
          <div class="flex items-center gap-4" bis_skin_checked="1">
            <div class="flex flex-col" bis_skin_checked="1">
              <svg width="55" height="64" viewBox="0 0 55 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M55 48.0134V16.5384L27.5 0.801758L0 16.5384V48.0134L27.5 63.7518L55 48.0134Z" fill="#0A1D29"></path>
                <path d="M52.8124 45.5996V18.954C52.8124 18.2347 52.4252 17.569 51.7971 17.2093L28.517 3.88827C27.889 3.52862 27.1145 3.52862 26.4847 3.88827L3.20462 17.2093C2.57661 17.569 2.18933 18.2347 2.18933 18.954V45.5996C2.18933 46.3189 2.57661 46.9846 3.20462 47.3443L26.4847 60.6671C27.1127 61.0267 27.8873 61.0267 28.517 60.6671L51.7971 47.3443C52.4252 46.9846 52.8124 46.3189 52.8124 45.5996Z" fill="url(#paint0_linear_16329_1249)"></path>
                <path d="M47.5467 41.6364V22.917C47.5467 21.6098 46.8437 20.4012 45.7011 19.7476L29.3466 10.3879C28.2039 9.7343 26.7979 9.7343 25.6553 10.3879L9.30074 19.7476C8.1581 20.4012 7.45508 21.6098 7.45508 22.917V41.6364C7.45508 42.9436 8.1581 44.1523 9.30074 44.8059L25.6553 54.1655C26.7979 54.8191 28.2039 54.8191 29.3466 54.1655L45.7011 44.8059C46.8437 44.1523 47.5467 42.9436 47.5467 41.6364Z" fill="url(#paint1_linear_16329_1249)"></path>
                <path d="M15.9297 14.9597V19.1684C15.9297 19.9032 16.5298 20.4981 17.2712 20.4981H25.5104C26.4541 20.4981 26.7856 19.2566 25.9639 18.7932L17.5241 14.0398C16.8124 13.6387 15.9297 14.1488 15.9297 14.9597Z" fill="url(#paint2_linear_16329_1249)"></path>
                <path d="M39.0311 14.9597V19.1684C39.0311 19.9032 38.431 20.4981 37.6896 20.4981H29.4504C28.5066 20.4981 28.1752 19.2566 28.9968 18.7932L37.4366 14.0398C38.1484 13.6387 39.0311 14.1488 39.0311 14.9597Z" fill="url(#paint3_linear_16329_1249)"></path>
                <path d="M41.6426 20.498H13.3575C13.0791 20.498 12.8534 20.7218 12.8534 20.9978V25.4762C12.8534 25.7521 13.0791 25.9759 13.3575 25.9759H41.6426C41.921 25.9759 42.1467 25.7521 42.1467 25.4762V20.9978C42.1467 20.7218 41.921 20.498 41.6426 20.498Z" fill="url(#paint4_linear_16329_1249)"></path>
                <path d="M40.2099 38.1869H14.7893C14.5109 38.1869 14.2852 38.4106 14.2852 38.6866V50.1523C14.2852 50.4283 14.5109 50.652 14.7893 50.652H40.2099C40.4883 50.652 40.714 50.4283 40.714 50.1523V38.6866C40.714 38.4106 40.4883 38.1869 40.2099 38.1869Z" fill="url(#paint5_linear_16329_1249)"></path>
                <path d="M30.1185 38.1869H24.9199V50.652H30.1185V38.1869Z" fill="url(#paint6_linear_16329_1249)"></path>
                <path d="M31.3405 19.6007L30.9968 18.0359C30.8904 17.5483 30.4543 17.199 29.9501 17.199H25.0464C24.5422 17.199 24.1061 17.5465 23.9997 18.0359L23.656 19.6007C23.5548 20.0624 23.909 20.4981 24.3852 20.4981H24.9155V25.9759H30.1158V20.4981H30.6078C31.084 20.4981 31.4382 20.0624 31.337 19.6007H31.3405Z" fill="url(#paint7_linear_16329_1249)"></path>
                <path d="M37.7619 36.0981C37.0048 31.1546 32.6977 27.3661 27.4991 27.3661C22.3006 27.3661 17.9934 31.1546 17.2363 36.0981H37.7636H37.7619Z" fill="url(#paint8_linear_16329_1249)"></path>
                <path d="M34.263 36.0981C33.5513 33.048 30.795 30.7742 27.4997 30.7742C24.2044 30.7742 21.4498 33.048 20.7363 36.0981H34.2613H34.263Z" fill="url(#paint9_linear_16329_1249)"></path>
                <path d="M28.0137 27.3782C27.8428 27.3696 27.6718 27.3644 27.4991 27.3644C22.2988 27.3644 17.9934 31.1529 17.2363 36.0964H18.2656C18.9983 31.3171 23.0472 27.6168 28.0137 27.3765V27.3782Z" fill="white"></path>
                <defs>
                  <linearGradient id="paint0_linear_16329_1249" x1="27.5" y1="74.8752" x2="27.5" y2="11.6226" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#213743"></stop>
                    <stop offset="1" stop-color="#2F4653"></stop>
                  </linearGradient>
                  <linearGradient id="paint1_linear_16329_1249" x1="27.4992" y1="-14.8364" x2="27.4992" y2="91.8152" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#0A1D29"></stop>
                    <stop offset="1" stop-color="#213745"></stop>
                  </linearGradient>
                  <linearGradient id="paint2_linear_16329_1249" x1="21.1806" y1="25.1442" x2="21.1806" y2="14.0658" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FFBB62"></stop>
                    <stop offset="1" stop-color="#E27837"></stop>
                  </linearGradient>
                  <linearGradient id="paint3_linear_16329_1249" x1="33.7802" y1="25.1442" x2="33.7802" y2="14.0658" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FFBB62"></stop>
                    <stop offset="1" stop-color="#E27837"></stop>
                  </linearGradient>
                  <linearGradient id="paint4_linear_16329_1249" x1="27.5001" y1="-19.1418" x2="27.5001" y2="50.7661" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#213743"></stop>
                    <stop offset="1" stop-color="#2F4653"></stop>
                  </linearGradient>
                  <linearGradient id="paint5_linear_16329_1249" x1="27.4996" y1="-33.5176" x2="27.4996" y2="47.1471" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#213743"></stop>
                    <stop offset="1" stop-color="#2F4653"></stop>
                  </linearGradient>
                  <linearGradient id="paint6_linear_16329_1249" x1="27.5192" y1="21.5511" x2="27.5192" y2="64.9068" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FFBB62"></stop>
                    <stop offset="1" stop-color="#E27837"></stop>
                  </linearGradient>
                  <linearGradient id="paint7_linear_16329_1249" x1="27.4991" y1="19.5436" x2="27.4991" y2="56.6037" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FFBB62"></stop>
                    <stop offset="1" stop-color="#E27837"></stop>
                  </linearGradient>
                  <linearGradient id="paint8_linear_16329_1249" x1="27.4991" y1="29.5292" x2="27.4991" y2="48.1932" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FFBB62"></stop>
                    <stop offset="1" stop-color="#E27837"></stop>
                  </linearGradient>
                  <linearGradient id="paint9_linear_16329_1249" x1="27.4997" y1="47.1471" x2="27.4997" y2="28.9759" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FFBB62"></stop>
                    <stop offset="1" stop-color="#E27837"></stop>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div class="flex flex-col" bis_skin_checked="1">
              <h2 class="weight-bold line-height-120pct align-left size-md text-size-md variant-highlighted with-icon-space svelte-1f6lug3" style="">Monthly Bonus</h2>
              <span class="weight-normal line-height-120pct align-left size-default text-size-default variant-subtle with-icon-space svelte-1f6lug3" style="">Released once a month.</span>
            </div>
          </div>
          <svg fill="currentColor" viewBox="0 0 64 64" class="svg-icon w-4 h-4 transition-all duration-50" style="">
            <title></title>
            <path d="M32.274 49.762 9.204 26.69l6.928-6.93 16.145 16.145L48.42 19.762l6.93 6.929-23.072 23.07z"></path>
          </svg>
        </button>
      </div>
    `;
    rewardElement.outerHTML = newRewardHTML;
    console.log('Reward element replaced');
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
            n.querySelectorAll?.('div.flex.p-4.rounded-lg.bg-grey-700.gap-2\\.5.flex-row.items-center').forEach(() => {
              replaceRewardElement();
              console.log('New reward element detected, content replaced');
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
      if (ltcChanged) {
        multiplyLTC();
        console.log('rate du LTC changé');
      }
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
    replaceRewardElement();
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
      replaceRewardElement();
      multiplyLTC();
    }, 2000); 
  })();
})();
