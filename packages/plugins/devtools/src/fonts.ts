import type { DevtoolsAPI } from "./api.js";

const fonts = [
  { name: "Default", url: "" },
  {
    name: "JetBrains Mono",
    url: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap",
  },
  {
    name: "Fira Code",
    url: "https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&display=swap",
  },
  {
    name: "Roboto Mono",
    url: "https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700&display=swap",
  },
  {
    name: "Inconsolata",
    url: "https://fonts.googleapis.com/css2?family=Inconsolata:wght@200..700&display=swap",
  },
];

export const getFontUrl = (font: string): string => {
  const fontOption = fonts.find((f) => f.name === font);
  return fontOption ? fontOption.url : "";
};

export const loadFont = (font: string): void => {
  const customFontElement = document.getElementById("devtools-font");
  if (customFontElement) {
    document.head.removeChild(customFontElement);
  }

  const customFontStyleElement = document.getElementById("devtools-font-style");
  if (customFontStyleElement) {
    document.head.removeChild(customFontStyleElement);
  }

  if (font === "Default") {
    return;
  }

  const link = document.createElement("link");
  link.href = getFontUrl(font);
  link.rel = "stylesheet";
  link.id = "devtools-font";

  const style = document.createElement("style");
  style.id = "devtools-font-style";
  style.textContent = `body { font-family: ${font} !important; }`;

  document.head.appendChild(link);
  document.head.appendChild(style);
};
