import { activeSub } from './effect'
import { Link, link, progate } from './system'

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
  /**
   * 订阅者头结点 header
   */
  subs: Link
  /**
   * 订阅者尾节点 tail
   */
  subsTail: Link
  constructor(value) {
    this._value = value
  }
  get value() {
    if (activeSub) {
      trackRef(this)
    }
    return this._value
  }
  set value(newValue) {
    this._value = newValue
    triggerRef(this)
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

/**
 * 收集依赖 建立ref和effect的链表关系
 * @param dep 订阅者
 */
export function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 * 触发 ref 关联的 effect 重新执行
 * @param dep
 */
export function triggerRef(dep) {
  if (dep.subs) {
    progate(dep.subs)
  }
}
