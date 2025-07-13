(() => {
  console.clear();
  console.log('Script Stake EUR activé');

  const COINS = {
    BTC: "bitcoin", ETH: "ethereum", LTC: "litecoin", USDT: "tether", SOL: "solana",
    DOGE: "dogecoin", BCH: "bitcoin-cash", XRP: "ripple", TRX: "tron", EOS: "eos",
    BNB: "binancecoin", USDC: "usd-coin", APE: "apecoin", BUSD: "binance-usd",
    CRO: "crypto-com-chain", DAI: "dai", LINK: "chainlink", SAND: "the-sandbox",
    SHIB: "shiba-inu", UNI: "uniswap", POL: "polygon", TRUMP: "trumpcoin"
  };

  // API pour récupérer les prix en EUR
  const API = https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(COINS).join(',')}&vs_currencies=eur;
  const prices = {}, originalTexts = new WeakMap();

  // Récupérer les prix en EUR
  const fetchPrices = async () => {
    try {
      const data = await (await fetch(API)).json();
      Object.entries(COINS).forEach(([sym, id]) => prices[sym.toLowerCase()] = data[id]?.eur || null);
    } catch {}
  };

  // Conversion des montants
  const convertAll = () => {
    // Conversion sur les montants affichés
    document.querySelectorAll('[data-testid="conversion-amount"], .balance, .wallet-balance, .account-balance').forEach(div => {
      // On ne traite que le texte contenant un montant suivi de USD/$
      let txt = div.textContent.trim();
      // Remplacement USD -> EUR et $ -> €
      txt = txt.replace(/USD/g, 'EUR').replace(/$/g, '€');
      // Déplacement du symbole € à droite
      txt = txt.replace(/^€\s*([0-9.,]+)/, '$1 €');
      // Si déjà à droite, on ne touche pas
      div.textContent = txt;
    });
  };

  // Observer pour les mutations (ajout de nouveaux éléments)
  const observer = new MutationObserver(() => {
    convertAll();
  });

  // Initialisation
  (async () => {
    await fetchPrices();
    convertAll();
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(fetchPrices, 60000);
    setInterval(convertAll, 1000);
  })();
})();
