import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import pl from "./pl.json";
import en from "./en.json";

const saved = localStorage.getItem("metalrecovery_lang");
const browserLang = navigator.language?.startsWith("en") ? "en" : "pl";
const initialLang = (saved === "en" || saved === "pl") ? saved : browserLang;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pl: { translation: pl },
      en: { translation: en },
    },
    lng: initialLang,
    fallbackLng: "pl",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
