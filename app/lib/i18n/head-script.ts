import {
  AVAILABLE_LANGUAGE_CODES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  type LanguageCode,
} from "./languages";

/*
 * Runs while the page is parsed, before the first paint,
 * so lang is right from the start. It is the same choice as
 * the app makes later: a saved language that is available,
 * then the first available language in the device's list,
 * then English. It is written by hand because it has to run
 * on its own in the page head.
 */
export function buildLanguageScript(
  available: readonly LanguageCode[],
): string {
  return `(function(){var d=${JSON.stringify(DEFAULT_LANGUAGE)},a=${JSON.stringify(available)},l=null;try{var v=localStorage.getItem(${JSON.stringify(LANGUAGE_STORAGE_KEY)});if(a.indexOf(v)!==-1)l=v}catch(e){}if(!l){try{var n=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language];for(var i=0;i<n.length;i++){if(typeof n[i]!=="string")continue;var p=n[i].trim().toLowerCase().split(/[-_]/)[0];if(a.indexOf(p)!==-1){l=p;break}}}catch(e){}}if(!l)l=d;var h=document.documentElement;h.setAttribute("lang",l);h.setAttribute("data-lang",l)})()`;
}

export const languageScript = buildLanguageScript(
  AVAILABLE_LANGUAGE_CODES,
);
