import { activeSub } from './effect'

enum ReactiveFlags {
  IS_REF = '__v_isRef',
}
/**
 * ref对象
 */
class RefImpl {
  _value;
  // 标记，证明是一个ref
  [ReactiveFlags.IS_REF] = true
  subs
  constructor(value) {
    this._value = value
  }
  get value() {
    console.log('有人访问我了')
    if (activeSub) {
      //如果activeSub有值，说明有依赖，那么将activeSub添加到subs中，更新的时候触发
      this.subs = activeSub
    }
    return this._value
  }
  set value(newValue) {
    console.log('我的值更新了')
    this._value = newValue
    // 通知effect重新执行
    this.subs?.()
  }
}

export function ref(value) {
  return new RefImpl(value)
}

/**
 *
 * @param value 判断是不是ref
 * @returns boolean
 */
export function isRef(ref) {
  return !!(ref && ref[ReactiveFlags.IS_REF])
}
