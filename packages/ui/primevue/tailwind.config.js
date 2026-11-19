import tailwindcssPrimeui from "tailwindcss-primeui";
import tailwindcssThreatMap from "@threatmap/tailwindcss";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{vue,js,ts}", "./src/stories/**/*.{vue,js,ts}"],
  darkMode: ["selector", "[class*=htw-dark]"],
  plugins: [tailwindcssPrimeui, tailwindcssThreatMap],
};
