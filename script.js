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

  // API pour récupérer les prix en EUR
  const API = `https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(COINS).join(',')}&vs_currencies=eur`;
  const CONV_SELECTOR = 'span.label-content.svelte-osbo5w.full-width div.crypto[data-testid="conversion-amount"]';
  const prices = {}, originalTexts = new WeakMap();

  // Fonctions pour les éléments spécifiques
  const getElements = () => ({
    excluded: document.evaluate('/html/body/div[1]/div[1]/div[2]/div[2]/div/div/div/div[4]/div/div[5]/label/span[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue,
    eur: ['/html/body/div[1]/div[2]/div[2]/div[4]/div/div/div/div[1]/div/div[2]/div/div/div/div/div/div[1]/div/div/div/div/div[1]/div[2]/div[1]/div/button','/html/body/div[1]/div[2]/div[2]/div[4]/div/div/div/div[1]/div/div[2]/div/div/div/div/div/div[1]/div/div/div/div/div[2]/div[1]/div[4]/div/div/div/button/div'].map(xpath => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue).filter(Boolean)
  });

  const shouldSkip = (node, elements) => elements.excluded?.contains(node);
  const isEURElement = (node, elements) => elements.eur.some(el => el?.contains(node));

  // Récupérer les prix en EUR
  const fetchPrices = async () => {
    try {
      const data = await (await fetch(API)).json();
      Object.entries(COINS).forEach(([sym, id]) => prices[sym.toLowerCase()] = data[id]?.eur || null);
    } catch {}
  };

  // Conversion des montants
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

  // Remplacement global ARS → EUR ou €
  const replaceARS = () => {
    const elements = getElements();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => shouldSkip(n, elements) ? NodeFilter.FILTER_REJECT : n.nodeValue.includes('ARS') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let node;
    while (node = walker.nextNode()) {
      node.nodeValue = node.nodeValue.replace(/ARS[\s\u00A0]*/g, isEURElement(node, elements) ? 'EUR' : '€');
    }
  };

  // Observer pour remplacer en temps réel
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

  // Remplacement des symboles USD/$ → EUR/€
  function replaceUSDEUR() {
    // Remplace tous les USD par EUR et $ par €
    document.querySelectorAll('*').forEach(el => {
      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
        el.textContent = el.textContent.replace(/USD/g, 'EUR').replace(/\$/g, '€');
      }
    });
  }

  // Mettre le symbole € à droite du montant
  function moveEuroSymbolRight() {
    // Sélecteurs à adapter selon la structure Stake
    document.querySelectorAll('.balance, .wallet-balance, .account-balance, [data-testid="wallet-balance"], [data-testid="balance"]').forEach(el => {
      // Cherche les montants commençant par "€"
      el.innerHTML = el.innerHTML.replace(/€\s*([0-9.,]+)/g, '$1&nbsp;€');
      // Si jamais il y a encore un € à gauche, on le déplace
      el.innerHTML = el.innerHTML.replace(/([0-9.,]+)\s*€/g, '$1&nbsp;€');
    });
    // Pour les montants dans les boutons ou autres
    document.querySelectorAll('button, span, div').forEach(el => {
      if (/^€\s*[0-9]/.test(el.textContent)) {
        el.textContent = el.textContent.replace(/^€\s*([0-9.,]+)/, '$1 €');
      }
    });
  }

  // Observer pour les mutations (ajout de nouveaux éléments)
  const observer = new MutationObserver(() => {
    replaceUSDEUR();
    moveEuroSymbolRight();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initialisation
  (async () => {
    await fetchPrices();
    convertAll();
    document.querySelectorAll('input[data-test="input-game-amount"]').forEach(i => {
      if (!i.dataset.hooked) {
        i.dataset.hooked = '1';
        ['input', 'change'].forEach(e => i.addEventListener(e, convertAll));
      }
    });
    replaceARS();
    setupTextObserver();
    replaceUSDEUR();
    moveEuroSymbolRight();
    setInterval(fetchPrices, 60000);
    setInterval(() => { convertAll(); replaceARS(); replaceUSDEUR(); moveEuroSymbolRight(); }, 1000);
  })();
})();
