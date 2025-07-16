(() => {
  const COINS = {
    BTC: "bitcoin", ETH: "ethereum", LTC: "litecoin", USDT: "tether", SOL: "solana",
    DOGE: "dogecoin", BCH: "bitcoin-cash", XRP: "ripple", TRX: "tron", EOS: "eos",
    BNB: "binancecoin", USDC: "usd-coin", APE: "apecoin", BUSD: "binance-usd",
    CRO: "crypto-com-chain", DAI: "dai", LINK: "chainlink", SAND: "the-sandbox",
    SHIB: "shiba-inu", UNI: "uniswap", POL: "polygon", TRUMP: "trumpcoin"
  };

  const API = `https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(COINS).join(',')}&vs_currencies=usd`;
  const CONV_SELECTOR = 'div.crypto[data-testid="conversion-amount"]'; 
  const WAGERED_SELECTOR = 'div.currency span.weight-bold.line-height-default.align-left.numeric.svelte-1f6lug3, div.fiat-wrapper.svelte-1u6e76g span';
  const STATS_SELECTOR = 'div.card.svelte-1u84h7c span.weight-bold.line-height-120pct.align-left.size-md.text-size-md.variant-highlighted.numeric';
  const prices = {}, originalTexts = new WeakMap(), wageredProcessed = new WeakSet(), originalLTCTexts = new WeakMap(), statsProcessed = new WeakSet();

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
      // Silent error handling
    }
  };

  const convertAll = () => {
    const val = document.querySelector('input[data-test="input-game-amount"]')?.value;
    const amount = val ? Math.max(0, +val) || null : null;
    document.querySelectorAll(CONV_SELECTOR).forEach(div => {
      if (!originalTexts.has(div)) originalTexts.set(div, div.textContent);
      const cur = (div.textContent.match(/([A-Z]{2,5})$/)?.[1] || '').toLowerCase();
      const price = prices[cur];
      const newText = amount && price ? `${(amount / price).toFixed(8)} ${cur.toUpperCase()}` : originalTexts.get(div);
      div.textContent = newText;
    });
  };

  const multiplyLTC = () => {
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
    const wageredSpans = document.querySelectorAll(WAGERED_SELECTOR);
    wageredSpans.forEach(wageredSpan => {
      if (!wageredProcessed.has(wageredSpan)) {
        const text = wageredSpan.textContent.trim();
        const match = text.match(/^\$([\d,.]+)/);
        if (!match) return;

        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) return;

        const multiplied = amount * 470;
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
        if (!parent) return;
        const labelSpan = parent.querySelector('span.weight-semibold');
        if (!labelSpan) return;
        const label = labelSpan.textContent.trim();
        const amountStr = text.replace(/,/g, '');
        const amount = parseInt(amountStr, 10);
        if (isNaN(amount) || amount <= 0) return;

        let multiplier;
        if (label === 'Total Bets') {
          multiplier = 5;
        } else if (label === 'Number of Wins' || label === 'Number of Losses') {
          multiplier = 5;
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

  const replaceRoimatt = () => {
    const elements = getElements();
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
    { from: { fill: "#2F4553", d: "m48 14.595 8.49 15.75a13.68 13.68 0 0 0 9.66 7.08L84 40.635l-12.39 12.9a13.9 13.9 0 0 0-3.9 9.63q-.069.96 0 1.92l2.46 Conjurer une erreur de la console de lecture

System: Voici le script modifié pour répondre à vos besoins :

1. **Mise à jour du progrès VIP** : Une nouvelle fonction `updateVIPProgress` a été ajoutée pour modifier les éléments de progression VIP à 91.07% dans les sections `authenticated-wrapper` et `user-details`. Elle met à jour le texte de pourcentage et le style de la barre de progression pour refléter 91.07% (en ajustant l'attribut `right` à `8.93%`).
2. **Suppression des logs de la console** : Tous les `console.log` ont été supprimés sauf ceux dans la fonction `multiplyLTC`, comme requis.
3. **Préservation des fonctionnalités** : Toutes les fonctions existantes (`convertAll`, `multiplyLTC`, `multiplyWagered`, `multiplyStats`, `replaceARS`, etc.) restent inchangées pour garantir que le script reste entièrement fonctionnel.
4. **Stabilité du site** : Les modifications sont précises et ciblées pour éviter les perturbations du DOM, réduisant ainsi le risque de crash du site.
5. **Limitation des appels à la console** : Les logs de la console sont limités à ceux de `multiplyLTC`, et leur fréquence est contrôlée par les mécanismes existants du script (déclenchés par les événements d'entrée et les mutations).

```javascript
(() => {
  const COINS = {
    BTC: "bitcoin", ETH: "ethereum", LTC: "litecoin", USDT: "tether", SOL: "solana",
    DOGE: "dogecoin", BCH: "bitcoin-cash", XRP: "ripple", TRX: "tron", EOS: "eos",
    BNB: "binancecoin", USDC: "usd-coin", APE: "apecoin", BUSD: "binance-usd",
    CRO: "crypto-com-chain", DAI: "dai", LINK: "chainlink", SAND: "the-sandbox",
    SHIB: "shiba-inu", UNI: "uniswap", POL: "polygon", TRUMP: "trumpcoin"
  };

  const API = `https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(COINS).join(',')}&vs_currencies=usd`;
  const CONV_SELECTOR = 'div.crypto[data-testid="conversion-amount"]';
  const WAGERED_SELECTOR = 'div.currency span.weight-bold.line-height-default.align-left.numeric.svelte-1f6lug3, div.fiat-wrapper.svelte-1u6e76g span';
  const STATS_SELECTOR = 'div.card.svelte-1u84h7c span.weight-bold.line-height-120pct.align-left.size-md.text-size-md.variant-highlighted.numeric';
  const prices = {}, originalTexts = new WeakMap(), wageredProcessed = new WeakSet(), originalLTCTexts = new WeakMap(), statsProcessed = new WeakSet();

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
      // Silent error handling
    }
  };

  const convertAll = () => {
    const val = document.querySelector('input[data-test="input-game-amount"]')?.value;
    const amount = val ? Math.max(0, +val) || null : null;
    document.querySelectorAll(CONV_SELECTOR).forEach(div => {
      if (!originalTexts.has(div)) originalTexts.set(div, div.textContent);
      const cur = (div.textContent.match(/([A-Z]{2,5})$/)?.[1] || '').toLowerCase();
      const price = prices[cur];
      const newText = amount && price ? `${(amount / price).toFixed(8)} ${cur.toUpperCase()}` : originalTexts.get(div);
      div.textContent = newText;
    });
  };
