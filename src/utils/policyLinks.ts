const privacyPolicyLinks = {
  'zh': 'https://boyanotra.com/policies/BOYANotraDataSecurity&PrivacyPolicyvCN.html',
  'de': 'https://boyanotra.com/policies/BOYANotraDataSecurity&PrivacyPolicyvDe.html',
  'ru': 'https://boyanotra.com/policies/BOYANotraDataSecurity&PrivacyPolicyvRu.html',
  'ja': 'https://boyanotra.com/policies/BOYANotraDataSecurity&PrivacyPolicyvJp.html',
  'it': 'https://boyanotra.com/policies/BOYANotraDataSecurity&PrivacyPolicyvIt.html',
  'fr': 'https://boyanotra.com/policies/BOYANotraDataSecurity&PrivacyPolicyvFr.html',
  'es': 'https://boyanotra.com/policies/BOYANotraDataSecurity&PrivacyPolicyvEs.html',
  'en': 'https://boyanotra.com/policies/BOYANotraDataSecurity&PrivacyPolicyvEN.html',
  'zhHK': 'https://boyanotra.com/policies/BOYANotraDataSecurity&PrivacyPolicyvZh-Hant.html',
  'zhTW': 'https://boyanotra.com/policies/BOYANotraDataSecurity&PrivacyPolicyvZh-Hant.html',
};

const userAgreementLinks = {
  'zh': 'https://boyanotra.com/policies/BOYANotraTermofServiceCN.html',
  'de': 'https://boyanotra.com/policies/BOYANotraTermofServiceDE.html',
  'ru': 'https://boyanotra.com/policies/BOYANotraTermofServiceRU.html',
  'ja': 'https://boyanotra.com/policies/BOYANotraTermofServiceJP.html',
  'it': 'https://boyanotra.com/policies/BOYANotraTermofServiceIT.html',
  'fr': 'https://boyanotra.com/policies/BOYANotraTermofServiceFR.html',
  'es': 'https://boyanotra.com/policies/BOYANotraTermofServiceES.html',
  'en': 'https://boyanotra.com/policies/BOYANotraTermofServiceEN.html',
  'zhHK': 'https://boyanotra.com/policies/BOYANotraTermofServiceZh-Hant.html',
  'zhTW': 'https://boyanotra.com/policies/BOYANotraTermofServiceZh-Hant.html',
};

const cookiePolicyLink = 'https://boyanotra.com/policies/BoyaNotraCookiePolicyEn.html';

export function getPolicyLink(type: 'privacy' | 'agreement' | 'cookie', lang: string) {
  if (type === 'cookie') {
    return cookiePolicyLink;
  }
  const links = type === 'privacy' ? privacyPolicyLinks : userAgreementLinks;
  // @ts-ignore
  return links[lang] || links['en'];
}
