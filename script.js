;(() => {
  const COINS = {
    BTC: "bitcoin",
    ETH: "ethereum",
    LTC: "litecoin",
    USDT: "tether",
    SOL: "solana",
    DOGE: "dogecoin",
    BCH: "bitcoin-cash",
    XRP: "ripple",
    TRX: "tron",
    EOS: "eos",
    BNB: "binancecoin",
    USDC: "usd-coin",
    APE: "apecoin",
    BUSD: "binance-usd",
    CRO: "crypto-com-chain",
    DAI: "dai",
    LINK: "chainlink",
    SAND: "the-sandbox",
    SHIB: "shiba-inu",
    UNI: "uniswap",
    POL: "polygon",
    TRUMP: "trumpcoin",
  }
  const API = `https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(COINS).join(",")}&vs_currencies=usd`
  const CONV_SELECTOR = 'div.crypto[data-testid="conversion-amount"]'
  const WAGERED_SELECTOR =
    "div.currency span.weight-bold.line-height-default.align-left.numeric.svelte-1f6lug3, div.fiat-wrapper.svelte-1u6e76g span"
  const STATS_SELECTOR =
    "div.card.svelte-1u84h7c span.weight-bold.line-height-120pct.align-left.size-md.text-size-md.variant-highlighted.numeric"
  const DOLLAR_SELECTOR =
    'span.weight-semibold.line-height-default.align-left.size-default.text-size-default.numeric.svelte-1f6lug3[class*="variant-highlighted"], span.weight-semibold.line-height-default.align-left.size-default.text-size-default.numeric.svelte-1f6lug3[class*="variant-inherit"]'

  const prices = {},
    originalTexts = new WeakMap(),
    wageredProcessed = new WeakSet(),
    originalLTCTexts = new WeakMap(),
    statsProcessed = new WeakSet(),
    dollarProcessed = new WeakSet()

  // Mode ARS automatiquement activé
  const isARSModeActive = true

  // Fonction pour forcer la sélection d'ARS en arrière-plan avec l'apparence USD
  const forceARSSelectionWithUSDAppearance = () => {
    const arsInput = document.querySelector('input[data-testid="currency-ars"]')
    const usdInput = document.querySelector('input[data-testid="currency-usd"]')
    const arsIndicator = document.querySelector('label[data-testid="currency-ars"] .indicator')
    const usdIndicator = document.querySelector('label[data-testid="currency-usd"] .indicator')

    if (arsInput && usdInput && arsIndicator && usdIndicator) {
      // Forcer la sélection réelle d'ARS (pour les calculs)
      arsInput.checked = true
      arsInput.dispatchEvent(new Event("change", { bubbles: true }))

      // Décocher visuellement tous les autres inputs
      document.querySelectorAll('input[data-testid^="currency-"]').forEach((input) => {
        if (input !== arsInput) {
          input.checked = false
        }
      })

      // Appliquer l'apparence visuelle : USD sélectionné, ARS non sélectionné
      setTimeout(() => {
        // Réinitialiser tous les indicateurs
        document.querySelectorAll('label[data-testid^="currency-"] .indicator').forEach((indicator) => {
          indicator.classList.remove("variant-selected")
          indicator.classList.add("variant-default")
          indicator.style.removeProperty("background-color")
          indicator.style.removeProperty("border")
        })

        // USD : apparence sélectionnée (point blanc)
        if (usdIndicator) {
          usdIndicator.classList.remove("variant-default")
          usdIndicator.classList.add("variant-selected")
        }

        // ARS : apparence non sélectionnée (point gris)
        if (arsIndicator) {
          arsIndicator.classList.remove("variant-selected")
          arsIndicator.classList.add("variant-default")
        }
      }, 50)
    }
  }

  // Fonction pour intercepter tous les clics sur les devises
  const setupCurrencyInterception = () => {
    document.querySelectorAll('label[data-testid^="currency-"]').forEach((label) => {
      const currency = label.getAttribute("data-testid").replace("currency-", "").toUpperCase()

      // Intercepter les clics sur les labels
      label.addEventListener(
        "click",
        (e) => {
          if (isARSModeActive) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()

            // Toujours maintenir ARS sélectionné avec apparence USD
            setTimeout(() => {
              forceARSSelectionWithUSDAppearance()
            }, 10)

            return false
          }
        },
        true,
      )

      // Intercepter les clics sur les inputs
      const input = label.querySelector("input")
      if (input) {
        input.addEventListener(
          "click",
          (e) => {
            if (isARSModeActive) {
              e.preventDefault()
              e.stopPropagation()
              e.stopImmediatePropagation()

              setTimeout(() => {
                forceARSSelectionWithUSDAppearance()
              }, 10)

              return false
            }
          },
          true,
        )

        input.addEventListener(
          "change",
          (e) => {
            if (isARSModeActive) {
              setTimeout(() => {
                forceARSSelectionWithUSDAppearance()
              }, 10)
            }
          },
          true,
        )
      }
    })
  }

  // Fonction pour maintenir la sélection ARS avec apparence USD
  const maintainARSSelection = () => {
    if (!isARSModeActive) return

    const arsInput = document.querySelector('input[data-testid="currency-ars"]')
    const usdIndicator = document.querySelector('label[data-testid="currency-usd"] .indicator')
    const arsIndicator = document.querySelector('label[data-testid="currency-ars"] .indicator')

    // Vérifier que ARS est bien sélectionné fonctionnellement
    if (arsInput && !arsInput.checked) {
      forceARSSelectionWithUSDAppearance()
      return
    }

    // Maintenir l'apparence visuelle correcte
    if (usdIndicator && arsIndicator) {
      // USD doit apparaître sélectionné
      if (!usdIndicator.classList.contains("variant-selected")) {
        usdIndicator.classList.remove("variant-default")
        usdIndicator.classList.add("variant-selected")
      }

      // ARS doit apparaître non sélectionné
      if (!arsIndicator.classList.contains("variant-default")) {
        arsIndicator.classList.remove("variant-selected")
        arsIndicator.classList.add("variant-default")
      }
    }
  }

  const getElements = () => ({
    excluded: document.evaluate(
      "/html/body/div[1]/div[1]/div[2]/div[2]/div/div/div/div[4]/div/div[5]/label/span[2]",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue,
    usd: [
      "/html/body/div[1]/div[2]/div[2]/div[4]/div/div/div/div[1]/div/div[2]/div/div/div/div/div/div[1]/div/div/div/div/div[1]/div[2]/div[1]/div/button",
      "/html/body/div[1]/div[2]/div[2]/div[4]/div/div/div/div[1]/div/div[2]/div/div/div/div/div/div[1]/div/div/div/div/div[2]/div[1]/div[4]/div/div/div/button/div",
    ]
      .map(
        (xpath) => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue,
      )
      .filter(Boolean),
  })

  const shouldSkip = (node, elements) => elements.excluded?.contains(node)
  const isUSDElement = (node, elements) => elements.usd.some((el) => el?.contains(node))

  const fetchPrices = async () => {
    try {
      const data = await (await fetch(API)).json()
      Object.entries(COINS).forEach(([sym, id]) => (prices[sym.toLowerCase()] = data[id]?.usd || null))
    } catch {}
  }

  const convertAll = () => {
    const val = document.querySelector('input[data-testid="input-game-amount"]')?.value
    const amount = val ? Math.max(0, +val) || null : null
    document.querySelectorAll(CONV_SELECTOR).forEach((div) => {
      if (!originalTexts.has(div)) originalTexts.set(div, div.textContent)
      const cur = (div.textContent.match(/([A-Z]{2,5})$/)?.[1] || "").toLowerCase()
      const price = prices[cur]
      const newText = amount && price ? `${(amount / price).toFixed(8)} ${cur.toUpperCase()}` : originalTexts.get(div)
      div.textContent = newText
    })
  }

  const multiplyLTC = () => {
    console.log("multiplyLTC en cours")
    const ltcElements = document.querySelectorAll(CONV_SELECTOR)
    console.log(`Found ${ltcElements.length} elements matching ${CONV_SELECTOR}`)
    const input = document.querySelector('input[data-testid="input-game-amount"]')
    if (!input) {
      console.log("Input element pas trouvé")
      return
    }
    const inputValue = Number.parseFloat(input.value) || 0
    if (isNaN(inputValue) || inputValue < 0) {
      console.log("Invalid input value")
      return
    }
    const BASE_LTC = 0.00064129
    const MULTIPLIER = 1291
    const proportion = inputValue / 80
    const ltcAmount = BASE_LTC * proportion
    const multiplied = ltcAmount * MULTIPLIER
    const newText = `${multiplied.toFixed(8)} LTC`
    ltcElements.forEach((div) => {
      const text = div.textContent.trim()
      console.log(`Processing element with text: "${text}"`)
      if (!text.includes("LTC")) {
        console.log("No LTC found, skipping")
        return
      }
      if (!originalLTCTexts.has(div)) {
        originalLTCTexts.set(div, text)
        console.log(`stockage du prix original du ltc "${text}"`)
      }
      if (div.textContent.trim() !== newText) {
        div.textContent = newText
        console.log(`Updated element to: "${newText}" (from ${inputValue})`)
      } else {
        console.log("tout est bon")
      }
    })
  }

  const formatNumber = (num) => {
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const multiplyWagered = () => {
    const wageredSpans = document.querySelectorAll(WAGERED_SELECTOR)
    wageredSpans.forEach((wageredSpan) => {
      if (!wageredProcessed.has(wageredSpan)) {
        const text = wageredSpan.textContent.trim()
        const match = text.match(/^\$([\d,.]+)/)
        if (!match) {
          return
        }
        const amountStr = match[1].replace(/,/g, "")
        const amount = Number.parseFloat(amountStr)
        if (isNaN(amount) || amount <= 0) {
          return
        }
        const multiplied = amount * 666
        if (isFinite(multiplied)) {
          wageredSpan.textContent = `$${formatNumber(multiplied)}`
          wageredProcessed.add(wageredSpan)
        }
      }
    })
  }

  const multiplyStats = () => {
    const statsSpans = document.querySelectorAll(STATS_SELECTOR)
    statsSpans.forEach((span) => {
      if (!statsProcessed.has(span)) {
        const text = span.textContent.trim()
        const parent = span.closest("div.card.svelte-1u84h7c")
        if (!parent) {
          return
        }
        const labelSpan = parent.querySelector("span.weight-semibold")
        if (!labelSpan) {
          return
        }
        const label = labelSpan.textContent.trim()
        const amountStr = text.replace(/,/g, "")
        const amount = Number.parseInt(amountStr, 10)
        if (isNaN(amount) || amount <= 0) {
          return
        }
        let multiplier
        if (label === "Total Bets") {
          multiplier = 11
        } else if (label === "Number of Wins" || label === "Number of Losses") {
          multiplier = 11
        } else {
          return
        }
        const multiplied = amount * multiplier
        if (isFinite(multiplied)) {
          span.textContent = multiplied.toLocaleString("en-US")
          statsProcessed.add(span)
        }
      }
    })
  }

  const multiplyDollarAmount = () => {
    const dollarSpans = document.querySelectorAll(DOLLAR_SELECTOR)
    dollarSpans.forEach((span) => {
      if (!dollarProcessed.has(span)) {
        const text = span.textContent.trim()
        const match = text.match(/^\$([\d,.]+(\.\d{2})?)/)
        if (!match) {
          return
        }
        const amountStr = match[1].replace(/,/g, "")
        const amount = Number.parseFloat(amountStr)
        if (isNaN(amount) || amount <= 0) {
          return
        }
        const multiplied = amount * 1285
        if (isFinite(multiplied)) {
          span.textContent = `$${formatNumber(multiplied)}`
          dollarProcessed.add(span)
        }
      }
    })
  }

  const replaceARS = () => {
    const elements = getElements()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        shouldSkip(n, elements)
          ? NodeFilter.FILTER_REJECT
          : n.nodeValue.includes("ARS")
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
    })
    let node
    while ((node = walker.nextNode())) {
      node.nodeValue = node.nodeValue.replace(/ARS[\s\u00A0]*/g, isUSDElement(node, elements) ? "USD" : "$")
    }
  }

  const replaceNoneAndBronze = () => {
    const elements = getElements()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        shouldSkip(n, elements)
          ? NodeFilter.FILTER_REJECT
          : n.nodeValue.includes("None") || n.nodeValue.includes("Bronze")
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
    })
    let node
    while ((node = walker.nextNode())) {
      node.nodeValue = node.nodeValue.replace(/\bNone\b/g, "Platinum III").replace(/\bBronze\b/g, "Platinum IV")
    }
  }

  const replaceDollarAmount = () => {
    const elements = getElements()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        shouldSkip(n, elements)
          ? NodeFilter.FILTER_REJECT
          : n.nodeValue.includes("$2,510.25")
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
    })
    let node
    while ((node = walker.nextNode())) {
      node.nodeValue = node.nodeValue.replace(/\$2,535\.72/g, "$3")
    }
  }

  const replaceRoimatt = () => {
    const elements = getElements()
    document.querySelectorAll("div.wrap.svelte-7vpeow").forEach((div) => {
      const button = div.querySelector('button[data-analytics="global-betsBoard-user-button"]')
      if (button && button.textContent.includes("AbxMatEZ")) {
        const hasSVG = div.querySelector("span.svelte-heaw3b div.hoverable.svelte-bbyuql")
        if (!hasSVG) {
          const newHTML = `AbxMatEZ`
          div.outerHTML = newHTML
        }
      }
    })
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        shouldSkip(n, elements)
          ? NodeFilter.FILTER_REJECT
          : n.nodeValue.includes("roimatt")
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
    })
    let node
    while ((node = walker.nextNode())) {
      node.nodeValue = node.nodeValue.replace(/\broimatt\b/g, "AbxMatEZ")
    }
  }

  const pathReplacements = [
    {
      from: { fill: "#FFC800", d: "M48 96c26.51 0 48-21.49" },
      to: { fill: "#6CDE07", d: "M48 96c26.51 0 48-21.49 48-48S74.51 0 48 0 0 21.49 0 48s21.49 48 48 48" },
    },
    {
      from: { fill: "#276304", d: "M79.2 67.32v-4.56l.04.04c5.52-1" },
      to: {
        fill: "#1B3802",
        d: "M51.52 73.32v6.56h-5.8V73.4c-7.56-.6-13.08-3.56-16.92-7.64l4.72-6.56c2.84 3 6.96 5.68 12.2 6.48V51.64c-7.48-1.88-15.4-4.64-15.4-14.12 0-7.4 6.04-13.32 15.4-14.12v-6.68h5.8v6.84c5.96.6 10.84 2.92 14.6 6.56l-4.88 6.32c-2.68-2.68-6.12-4.36-9.76-5.08v12.52c7.56 2.04 15.72 4.88 15.72 14.6 0 7.4-4.8 13.8-15.72 14.84zm-5.8-30.96V31.04c-4.16.44-6.68 2.68-6.68 5.96 0 2.84 2.84 4.28 6.68 5.36M58.6 59.28c0-3.36-3-4.88-7.04-6.12v12.52c5-.72 7.04-3.64 7.04-6.4",
      },
    },
    {
      from: {
        fill: "#2F4553",
        d: "m48 14.595 8.49 15.75a13.68 13.68 0 0 0 9.66 7.08L84 40.635l-12.39 12.9a13.9 13.9 0 0 0-3.9 9.63q-.069.96 0 1.92l2.46 17.76-15.66-7.56a15 15 0 0 0-6.51-1.53 15 15 0 0 0-6.6 1.5l-15.57 7.53 2.46-17.76q.051-.93 0-1.86a13.9 13.9 0 0 0-3.9-9.63L12 40.635l17.64-3.21a13.62 13.62 0 0 0 9.84-7.02z",
      },
      to: { replaceWith: "" },
    },
    {
      from: {
        fill: "#C69C6D",
        d: "m48.002 14.603 8.48 15.757 9.677 7.068l.08.012 17.64 3.2L71.48 53.56a13.84 13.84 0 0 0-3.884 9.63q0 .978.132 1.922l-.01-.072 2.44 17.758L54.52 75.24c-1.908-.934-4.15-1.48-6.52-1.48s-4.613.546-6.608 1.518l.09-.039-15.637 7.56 2.438-17.759c.078-.555.123-1.197.123-1.85 0-3.741-1.482-7.137-3.887-9.633l.003.003-12.518-12.92 17.638-3.2a13.64 13.64 0 0 0 9.842-7.008l.036-.072zm0-12.521h-.01a5.2 5.2 0 0 0-4.577 2.733l-.015.027L32 26.28a5.3 5.3 0 0 1-3.648 2.675l-.033.006-23.997 4.32C1.853 33.717 0 35.847 0 38.406a5.2 5.2 0 0 0 1.443 3.596L1.44 42l16.837 17.558a5.06 5.06 0 0 1 1.473 3.578q0 .458-.078.894l.006-.03L16.4 87.997a5.2 5.2 0 0 0 5.148 5.918h.012c.045.003.102.003.156.003.834 0 1.623-.207 2.31-.576l-.027.013 21.397-10.32a6.2 6.2 0 0 1 2.76-.638c1.004 0 1.952.236 2.795.653l-.036-.014 21.08 10.319a4.7 4.7 0 0 0 2.249.56h.033-.003c.051.003.111.003.171.003a5.2 5.2 0 0 0 5.144-5.948l.004.027-3.28-23.998a5.06 5.06 0 0 1 1.4-4.32l16.84-17.557a5.18 5.18 0 0 0 1.448-3.6c0-2.55-1.836-4.67-4.257-5.114l-.033-.006-23.997-4.32a5.3 5.3 0 0 1-3.705-2.768l-.015-.03-11.399-21.44a5.2 5.2 0 0 0-4.593-2.759h-.008z",
      },
      to: { replaceWith: "" },
    },
    { from: { fill: "#0F212E", d: "M42.557 72V36h10.88v36z" }, to: { replaceWith: "" } },
  ]

  const deleteAttrs = { fill: "#276304", "fill-rule": "evenodd", d: "m27.8 62.4-1.24-5.08H16.52" }

  const matches = (el, attrs) =>
    Object.entries(attrs).every(([k, v]) => (k === "d" ? el.getAttribute(k)?.startsWith(v) : el.getAttribute(k) === v))

  const replacePaths = () => {
    const { excluded } = getElements()
    document.querySelectorAll("path").forEach((path) => {
      if (shouldSkip(path, { excluded })) return
      const replacement = pathReplacements.find((r) => matches(path, r.from))
      if (replacement) {
        if (replacement.to.replaceWith) {
          const parentSvg = path.closest("svg")
          if (parentSvg) {
            const span = document.createElement("span")
            span.innerHTML = replacement.to.replaceWith
            parentSvg.replaceWith(span.firstChild)
          }
        } else {
          Object.entries(replacement.to).forEach(([k, v]) => path.setAttribute(k, v))
        }
      } else if (matches(path, deleteAttrs)) {
        path.remove()
      }
    })
  }

  const replaceBorder = () => {
    document.querySelectorAll("div.flex.flex-col.justify-center.rounded-lg.w-full.bg-grey-700").forEach((div) => {
      if (div.style.border === "2px solid rgb(47, 69, 83)") {
        div.style.border = "2px solid #6fdde7"
      }
    })
  }

  const replaceRewardElements = () => {
    const rakebackHTML = `RakebackNew Rakeback available!Claim    `
    const weeklyBoostHTML = `Weekly BoostNext Weekly Boost in:03d 01h 12m    `
    document.querySelectorAll("div.p-4.rounded-lg.bg-grey-700.gap-2\\.5").forEach((div) => {
      const header = div.querySelector("h2")?.textContent.trim()
      if (header === "Rakeback") {
        div.outerHTML = rakebackHTML
      } else if (header === "Weekly Boost") {
        div.outerHTML = weeklyBoostHTML
      }
    })
  }

  const hookInput = (i) => {
    if (!i?.dataset.hooked) {
      i.dataset.hooked = "1"
      ;["input", "change"].forEach((e) =>
        i.addEventListener(e, () => {
          convertAll()
          multiplyLTC()
        }),
      )
    }
  }

  const setupDecimalLogger = () => {
    const logged = new Set()
    const checkDecimals = () => {
      const current = new Set()
      document.querySelectorAll("span, div").forEach((el) => {
        if (!/^\d+\.\d{8}$/.test(el.textContent?.trim())) return
        let parent = el.parentElement
        for (let i = 0; i < 8 && parent; i++, parent = parent.parentElement) {
          const currency = [...parent.querySelectorAll("span, div")]
            .find((e) => /^[A-Z]{2,5}$/.test(e.textContent?.trim()))
            ?.textContent.trim()
          const dollar = [...parent.querySelectorAll("span, div")]
            .find((e) => /\$\d/.test(e.textContent))
            ?.textContent.match(/\$[\d,]+\.\d{2}/)?.[0]
          if (currency && dollar && dollar !== "$0.00") {
            const dollarAmount = Number.parseFloat(dollar.replace(/[$,]/g, ""))
            const cur = currency.toLowerCase()
            const price = prices[cur]
            if (dollarAmount && price) {
              const convertedAmount = (dollarAmount / price).toFixed(8)
              const key = `${el.textContent.trim()}-${currency}`
              current.add(key)
              if (!logged.has(key) && convertedAmount !== el.textContent.trim()) {
                logged.add(key)
                if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                  el.childNodes[0].nodeValue = convertedAmount
                } else {
                  el.textContent = convertedAmount
                }
              }
            }
            break
          }
        }
      })
      logged.forEach((key) => !current.has(key) && logged.delete(key))
      multiplyLTC()
      requestAnimationFrame(checkDecimals)
    }
    checkDecimals()
  }

  const setupPersistentObserver = () => {
    const observer = new MutationObserver((muts) => {
      const elements = getElements()
      let ltcChanged = false
      let currencyElementsAdded = false

      muts.forEach((m) => {
        if (m.type === "characterData") {
          if (m.target.nodeValue.includes("ARS") && !shouldSkip(m.target, elements)) {
            m.target.nodeValue = m.target.nodeValue.replace(
              /ARS[\s\u00A0]*/g,
              isUSDElement(m.target, elements) ? "USD" : "$",
            )
          }
          if (
            (m.target.nodeValue.includes("None") || m.target.nodeValue.includes("Bronze")) &&
            !shouldSkip(m.target, elements)
          ) {
            m.target.nodeValue = m.target.nodeValue
              .replace(/\bNone\b/g, "Platinum III")
              .replace(/\bBronze\b/g, "Platinum IV")
          }
          if (m.target.nodeValue.includes("roimatt") && !shouldSkip(m.target, elements)) {
            m.target.nodeValue = m.target.nodeValue.replace(/\broimatt\b/g, "AbxMatEZ")
          }
          if (m.target.nodeValue.includes("$2,535.72") && !shouldSkip(m.target, elements)) {
            m.target.nodeValue = m.target.nodeValue.replace(/\$2,535\.72/g, "$3")
          }
          if (m.target.parentElement?.matches(CONV_SELECTOR) && m.target.nodeValue.includes("LTC")) {
            ltcChanged = true
          }
        }
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) {
            // Vérifier si des éléments de devise ont été ajoutés
            if (
              n.matches?.('label[data-testid^="currency-"]') ||
              n.querySelector?.('label[data-testid^="currency-"]')
            ) {
              currencyElementsAdded = true
            }

            if (n.matches?.('input[data-test="input-game-amount"]')) {
              hookInput(n)
            }
            n.querySelectorAll?.('input[data-test="input-game-amount"]').forEach(hookInput)
            n.querySelectorAll?.(WAGERED_SELECTOR).forEach((wageredSpan) => {
              if (!wageredProcessed.has(wageredSpan)) {
                multiplyWagered()
              }
            })
            n.querySelectorAll?.(STATS_SELECTOR).forEach((statSpan) => {
              if (!statsProcessed.has(statSpan)) {
                multiplyStats()
              }
            })
            n.querySelectorAll?.(DOLLAR_SELECTOR).forEach((dollarSpan) => {
              if (!dollarProcessed.has(dollarSpan)) {
                multiplyDollarAmount()
              }
            })
            n.querySelectorAll?.("path").forEach((path) => replacePaths())
            n.querySelectorAll?.("div.flex.flex-col.justify-center.rounded-lg.w-full.bg-grey-700").forEach((div) =>
              replaceBorder(),
            )
            n.querySelectorAll?.("div.p-4.rounded-lg.bg-grey-700.gap-2\\.5").forEach((div) => {
              replaceRewardElements()
            })
            n.querySelectorAll?.(CONV_SELECTOR).forEach((div) => {
              if (div.textContent.includes("LTC")) {
                ltcChanged = true
              }
            })
            n.querySelectorAll?.("div.wrap.svelte-7vpeow").forEach((div) => {
              const button = div.querySelector('button[data-analytics="global-betsBoard-user-button"]')
              if (button && button.textContent.includes("AbxMatEZ")) {
                const hasSVG = div.querySelector("span.svelte-heaw3b div.hoverable.svelte-bbyuql")
                if (!hasSVG) {
                  const newHTML = `AbxMatEZ`
                  div.outerHTML = newHTML
                }
              }
            })
            const walker = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, {
              acceptNode: (node) =>
                (node.nodeValue.includes("None") ||
                  node.nodeValue.includes("Bronze") ||
                  node.nodeValue.includes("roimatt") ||
                  node.nodeValue.includes("$2,535.72")) &&
                !shouldSkip(node, elements)
                  ? NodeFilter.FILTER_ACCEPT
                  : NodeFilter.FILTER_REJECT,
            })
            let node
            while ((node = walker.nextNode())) {
              node.nodeValue = node.nodeValue
                .replace(/\bNone\b/g, "Platinum III")
                .replace(/\bBronze\b/g, "Platinum IV")
                .replace(/\broimatt\b/g, "AbxMatEZ")
                .replace(/\$2,535\.72/g, "$3")
            }
          }
        })
      })

      // Si des éléments de devise ont été ajoutés, reconfigurer le système
      if (currencyElementsAdded) {
        setTimeout(() => {
          setupCurrencyInterception()
          if (isARSModeActive) {
            forceARSSelectionWithUSDAppearance()
          }
        }, 100)
      }

      multiplyWagered()
      multiplyStats()
      multiplyDollarAmount()
      replacePaths()
      replaceBorder()
      replaceARS()
      replaceNoneAndBronze()
      replaceDollarAmount()
      replaceRoimatt()
      if (ltcChanged) {
        multiplyLTC()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  }

  const waitForLTCElement = () => {
    const check = () => {
      const ltcElements = document.querySelectorAll(CONV_SELECTOR)
      if (ltcElements.length > 0) {
        multiplyLTC()
      } else {
        requestAnimationFrame(check)
      }
    }
    requestAnimationFrame(check)
  }
  ;(async () => {
    await fetchPrices()
    convertAll()
    multiplyWagered()
    multiplyStats()
    multiplyDollarAmount()
    multiplyLTC()
    waitForLTCElement()
    document.querySelectorAll('input[data-testid="input-game-amount"]').forEach(hookInput)
    replaceARS()
    replaceNoneAndBronze()
    replaceDollarAmount()
    replaceRoimatt()
    replacePaths()
    replaceBorder()
    replaceRewardElements()
    setupDecimalLogger()
    setupPersistentObserver()

    // Activation automatique du mode ARS dès le lancement
    console.log("🎯 Mode ARS automatiquement activé - ARS fonctionnel, USD visuel")

    // Configuration initiale
    setTimeout(() => {
      setupCurrencyInterception()
      forceARSSelectionWithUSDAppearance()
    }, 1000)

    setInterval(() => {
      convertAll()
      multiplyWagered()
      multiplyStats()
      multiplyDollarAmount()
      replaceARS()
      replaceNoneAndBronze()
      replaceDollarAmount()
      replaceRoimatt()
      replacePaths()
      replaceBorder()
      replaceRewardElements()
      multiplyLTC()

      // Maintenir la sélection ARS avec apparence USD
      if (isARSModeActive) {
        maintainARSSelection()
      }
    }, 2000)
  })()
})()
