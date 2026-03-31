import {createI18n} from 'vue-i18n'
import zh from './zh.json'
import en from './en.json'
import de from './de.json'
import es from './es.json'
import fr from './fr.json'
import it from './it.json'
import ja from './ja.json'
import ru from './ru.json'
import zhHK from './zh-HK.json'
import zhTW from './zh-TW.json'

/**
 * 浏览器语言
 */
function getNavigatorLanguage(){
  const browserLang = navigator.language || navigator.languages[0] || 'en';

  const supportedLangs = ['zh', 'en', 'de', 'es', 'fr', 'it', 'ja', 'ru', 'zh-HK', 'zh-TW'];

  // 优先完全匹配【解决香港、台湾】
  if (supportedLangs.includes(browserLang)) {
    return browserLang;
  }

  // 其次前缀匹配
  const prefix = browserLang.split('-')[0];
  if (supportedLangs.includes(prefix)) {
    return prefix;
  }

  // 默认en
  return 'en';
}
/**
 * 获取语言
 */
function getLang(){
  // 本地保存的语言
  const local = localStorage.getItem('lang')
  if(local){
    // console.log(local,'保存的语言');
    return local;
  }
  // 浏览器语言
  let lang = getNavigatorLanguage();
  // console.log(lang,'浏览器语言');
  return lang;
}

const i18n = createI18n({
  legacy: false,
  locale: getLang(),
  fallbackLocale: 'en',
  messages: {
    zh,
    en,
    de,
    es,
    fr,
    it,
    ja,
    ru,
    'zh-HK':zhHK,
    'zh-TW':zhTW,
  },
})

export default i18n