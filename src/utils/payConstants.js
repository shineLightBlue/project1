/**
 * 支付相关常量
 * 与后端 PayConstants 保持一致
 */

// 产品类型常量
export const PRODUCT_TYPE = {
  /** 补充包 */
  SUPPLEMENT: 0,
  /** 专业版会员 */
  PROFESSIONAL: 1,
  /** 体验版会员 */
  EXPERIENCE: 2,
  /** 大师版会员 */
  MASTER: 3
};

// 产品类型选项（用于下拉框）
export const PRODUCT_TYPE_OPTIONS = [
  { value: PRODUCT_TYPE.SUPPLEMENT, label: '补充包' },
  { value: PRODUCT_TYPE.PROFESSIONAL, label: '专业版会员' },
  { value: PRODUCT_TYPE.EXPERIENCE, label: '体验版会员' },
  { value: PRODUCT_TYPE.MASTER, label: '大师版会员' }
];

// 产品类型名称映射
export const PRODUCT_TYPE_NAME_MAP = {
  [PRODUCT_TYPE.SUPPLEMENT]: '补充包',
  [PRODUCT_TYPE.PROFESSIONAL]: '专业版会员',
  [PRODUCT_TYPE.EXPERIENCE]: '体验版会员',
  [PRODUCT_TYPE.MASTER]: '大师版会员'
};

// 产品类型标签类型映射（用于 el-tag）
export const PRODUCT_TYPE_TAG_TYPE_MAP = {
  [PRODUCT_TYPE.SUPPLEMENT]: 'warning',      // 补充包 - 橙色
  [PRODUCT_TYPE.PROFESSIONAL]: 'success',    // 专业版会员 - 绿色
  [PRODUCT_TYPE.EXPERIENCE]: 'primary',      // 体验版会员 - 蓝色
  [PRODUCT_TYPE.MASTER]: 'danger'            // 大师版会员 - 红色
};

/**
 * 获取货币符号
 * 根据币种代码返回对应的货币符号，与后端 OrderDescBuilder.getCurrencySymbol 保持一致
 * @param {string} currencyCode 币种代码（如 'CNY', 'USD', 'EUR' 等）
 * @returns {string} 货币符号
 */
export function getCurrencySymbol(currencyCode) {
  if (!currencyCode || typeof currencyCode !== 'string') {
    return '¥'; // 默认人民币
  }

  const code = currencyCode.toUpperCase();
  const symbolMap = {
    'CNY': '¥',
    'RMB': '¥',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'KRW': '₩',
    'HKD': 'HK$',
    'TWD': 'NT$',
    'AUD': 'A$',
    'CAD': 'C$',
    'SGD': 'S$',
    'INR': '₹',
    'THB': '฿',
    'MYR': 'RM',
    'PHP': '₱',
    'VND': '₫'
  };

  return symbolMap[code] || (code + ' '); // 如果找不到，返回币种代码 + 空格
}

/**
 * 格式化金额
 * 根据金额和币种格式化显示
 * @param {number|string} amount 金额
 * @param {string} currency 币种代码
 * @returns {string} 格式化后的金额字符串（如 '¥298.00', '$29.99'）
 */
export function formatMoney(amount, currency) {
  if (amount === null || amount === undefined || amount === '') {
    return '-';
  }
  const num = parseFloat(amount);
  if (isNaN(num)) {
    return '-';
  }
  const symbol = getCurrencySymbol(currency);
  return symbol + num.toFixed(2);
}
