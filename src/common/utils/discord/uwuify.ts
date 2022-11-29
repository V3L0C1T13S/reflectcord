/* eslint-disable no-param-reassign */
export const owoifyText = (text: string) => {
  try {
    const stutterChance = 0.1;
    const prefixChance = 0.05;
    const suffixChance = 0.15;
    const words = {
      love: "wuv",
      mr: "mistuh",
      dog: "doggo",
      cat: "kitteh",
      hello: "henwo",
      hell: "heck",
      fuck: "fwick",
      fuk: "fwick",
      shit: "shoot",
      friend: "fwend",
      stop: "stawp",
      god: "gosh",
      dick: "peepee",
      penis: "peepee",
      cock: "bulgy-wulgy",
      mother: "muthuwr",
      lol: "lawl",
    };
    const suffixes = [
      "(ﾉ´ з `)ノ",
      "( ´ ▽ ` ).｡ｏ♡",
      "(´,,•ω•,,)♡",
      "(*≧▽≦)",
      "ɾ⚈▿⚈ɹ",
      "( ﾟ∀ ﾟ)",
      "( ・ ̫・)",
      "( •́ .̫ •̀ )",
      "(▰˘v˘▰)",
      "(・ω・)",
      "✾(〜 ☌ω☌)〜✾",
      "(ᗒᗨᗕ)",
      "(・`ω´・)",
      ":3",
      ">:3",
      "hehe",
      "xox",
      ">3<",
      "murr~",
      "UwU",
      "*gwomps*",
    ];
    const prefixes = [
      "OwO",
      "OwO whats this?",
      "*unbuttons shirt*",
      "*nuzzles*",
      "*waises paw*",
      "*notices bulge*",
      "*blushes*",
      "*giggles*",
      "hehe",
    ];

    // eslint-disable-next-line no-inner-declarations, @typescript-eslint/no-shadow
    function replaceAll(text: string, map: { [key: string]: string }) {
      const source = Object.keys(map).map((i) => `\\b${i}`);
      const re = new RegExp(`(?:${source.join(")|(?:")})`, "gi");
      return text.replace(re, (match) => {
        let out = map[match.toLowerCase()];
        // Not very tidy way to work out if the word is capitalised
        if ((match.match(/[A-Z]/g) || []).length > match.length / 2) {
          out = out?.toUpperCase();
        }
        return out ?? "owo";
      });
    }

    text = replaceAll(text, words);

    // OwO
    text = text.replace(/[rl]/gi, (match) => (match.charCodeAt(0) < 97 ? "W" : "w"));
    // Nya >;3
    text = text.replace(
      /n[aeiou]/gi,
      (match) => `${match[0]}${match.charCodeAt(1) < 97 ? "Y" : "y"}${match[1]}`,
    );
    // Words that end in y like yummy wummy
    text = text.replace(
      /\b[A-V,X-Z,a-v,x-z]\w{3,}y\b/gi,
      (match) => `${match} ${match.charCodeAt(0) < 97 ? "W" : "w"}${match.slice(1)}`,
    );
    // S-stutter
    text = text
      .split(" ")
      .map((word) => {
        if (word.length === 0 || word[0]?.match(/[a-zA-Z]/) === null) {
          return word;
        }
        while (Math.random() < stutterChance) {
          word = `${word[0]}-${word}`;
        }
        return word;
      })
      .join(" ");
    // Prefixes
    if (Math.random() < prefixChance) {
      text = `${text} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    }
    // Suffixes
    if (Math.random() < suffixChance) {
      text = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${text}`;
    }
    return text;
  } catch (e) {
    return "owo";
  }
};
