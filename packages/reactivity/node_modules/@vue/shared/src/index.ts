// 判断传入的是不是对象
export function isObject(obj: any): boolean {
  return obj && typeof obj === 'object' && !Array.isArray(obj) && obj !== null
}