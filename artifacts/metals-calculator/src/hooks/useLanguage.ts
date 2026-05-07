import { useTranslation } from "react-i18next";

export type Lang = "pl" | "en";

export function useLanguage() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language as Lang;

  const setLang = (l: Lang) => {
    i18n.changeLanguage(l);
    localStorage.setItem("metalrecovery_lang", l);
    document.documentElement.lang = l;
  };

  const toggleLang = () => setLang(lang === "pl" ? "en" : "pl");

  return { lang, setLang, toggleLang, t };
}
