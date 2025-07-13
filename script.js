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

  const API = `https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(COINS).join(',')}&vs_currencies=eur`;
  const CONV_SELECTOR = 'span.label-content.svelte-osbo5w.full-width div.crypto[data-testid="conversion-amount"]';
  const prices = {}, originalTexts = new WeakMap();

  // Fonction pour remplacer $ par € et USD par EUR partout sur la page
  function replaceDollarByEuro() {
    document.querySelectorAll('span, div, td, th, button').forEach(el => {
      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
        el.textContent = el.textContent
          .replace(/\$/g, '€')
          .replace(/USD/g, 'EUR')
          .replace(/€\s*([0-9.,]+)/g, '$1 €') // €123.45 -> 123.45 €
          .replace(/([0-9.,]+)\s*€/g, '$1 €'); // Corrige les doublons éventuels
      }
    });
  }

  const fetchPrices = async () => {
    try {
      const data = await (await fetch(API)).json();
      Object.entries(COINS).forEach(([sym, id]) => prices[sym.toLowerCase()] = data[id]?.eur || null);
    } catch {}
  };

  const convertAll = () => {
    const val = document.querySelector('input[data-test="input-game-amount"]')?.value;
    const amount = val ? Math.max(0, +val) || null : null;
    document.querySelectorAll(CONV_SELECTOR).forEach(div => {
      if (!originalTexts.has(div)) originalTexts.set(div, div.textContent);
      // On suppose que le code devise est toujours une crypto (BTC, ETH, etc.)
      const cur = (div.textContent.match(/([A-Z]{2,5})$/)?.[1] || '').toLowerCase();
      const price = prices[cur];
      // Conversion en euro et affichage du symbole à droite
      div.textContent = amount && price ? `${(amount / price).toFixed(2)} €` : originalTexts.get(div);
    });
  };

  // Remplacement ARS par EUR/€
  const getElements = () => ({
    excluded: document.evaluate('/html/body/div[1]/div[1]/div[2]/div[2]/div/div/div/div[4]/div/div[5]/label/span[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue,
    eur: ['/html/body/div[1]/div[2]/div[2]/div[4]/div/div/div/div[1]/div/div[2]/div/div/div/div/div/div[1]/div/div/div/div/div[1]/div[2]/div[1]/div/button','/html/body/div[1]/div[2]/div[2]/div[4]/div/div/div/div[1]/div/div[2]/div/div/div/div/div/div[1]/div/div/div/div/div[2]/div[1]/div[4]/div/div/div/button/div'].map(xpath => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue).filter(Boolean)
  });

  const shouldSkip = (node, elements) => elements.excluded?.contains(node);
  const isEURElement = (node, elements) => elements.eur.some(el => el?.contains(node));

const replaceARS = () => {
    const elements = getElements();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => shouldSkip(n, elements) ? NodeFilter.FILTER_REJECT : n.nodeValue.includes('ARS') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let node;
    while (node = walker.nextNode()) {
      node.nodeValue = node.nodeValue.replace(/ARS[\s\u00A0]*(\d+(?:\.\d+)?)/g, isUSDElement(node, elements) ? 'EUR $1' : '$1 €');
    }
};
  
  const setupTextObserver = () => {
    const observer = new MutationObserver(muts => {
      const elements = getElements();
      muts.forEach(m => {
        if (m.type === 'characterData' && m.target.nodeValue.includes('ARS') && !shouldSkip(m.target, elements)) {
          m.target.nodeValue = m.target.nodeValue.replace(/ARS[\s\u00A0]*/g, isEURElement(m.target, elements) ? 'EUR' : '€');
        }
      });
    });

    const observeNode = node => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue.includes('ARS')) {
        const elements = getElements();
        if (!shouldSkip(node, elements)) {
          observer.observe(node, { characterData: true });
          node.nodeValue = node.nodeValue.replace(/ARS[\s\u00A0]*/g, isEURElement(node, elements) ? 'EUR' : '€');
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        [...node.childNodes].forEach(observeNode);
      }
    };

    observeNode(document.body);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  };

  const hookInput = i => {
    if (!i?.dataset.hooked) {
      i.dataset.hooked = '1';
      ['input', 'change'].forEach(e => i.addEventListener(e, () => {
        convertAll();
        replaceDollarByEuro();
      }));
    }
  };

  (async () => {
    await fetchPrices();
    convertAll();
    replaceDollarByEuro();

    document.querySelectorAll('input[data-test="input-game-amount"]').forEach(hookInput);
    replaceARS();
    setupTextObserver();

    setInterval(fetchPrices, 60000);
    setInterval(() => { 
      convertAll(); 
      replaceARS();
      replaceDollarByEuro();
    }, 1000);

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
      replaceDollarByEuro();
    }).observe(document.body, { childList: true, subtree: true });
  })();
})();
