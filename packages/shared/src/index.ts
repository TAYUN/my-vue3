// 判断传入的是不是对象
export function isObject(obj: any): boolean {
  return obj && typeof obj === 'object' && !Array.isArray(obj) && obj !== null
}

/**
 * 判断两个值是否相等，有没有改变
 * @param newValue 新值
 * @param oldValue 老值
 * @returns { boolean }
 */
export function hasChange(newValue, oldValue ) {
  return !Object.is(newValue, oldValue)
}