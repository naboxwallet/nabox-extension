import Vue from "vue";
// import locale from "element-ui/lib/locale";
import VueI18n from "vue-i18n";
import messages from "../locales";

Vue.use(VueI18n);
const default_lang = window.navigator.language
  ? window.navigator.language === "zh-CN"
    ? "cn"
    : "en"
  : "en";
const localLang = localStorage.getItem("lang");
const lang = localLang ? localLang : default_lang;
const i18n = new VueI18n({
  locale: lang,
  messages
});

// locale.i18n((key, value) => i18n.t(key, value)); //重点：为了实现
export default i18n;
