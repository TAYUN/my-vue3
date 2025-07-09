import { activeSub } from './effect'

enum ReactiveFlags {
  IS_REF = '__v_isRef',
}
/**
 * 链表节点
 */
interface Link {
  // 保存effect
  sub: Function
  // 上一个节点
  nextSub: Link | undefined
  // 下一个节点
  preSub: Link | undefined
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
      const newLink = {
        sub: activeSub,
        nextSub: undefined,
        preSub: undefined,
      }
      /**
       * 添加到链表末尾
       * 1. 如果有尾节点，将newLink设置为尾节点的nextSub
       * 2. 否者尾节点为空，则将newLink设置为头节点
       */
      if (this.subsTail) {
        this.subsTail.nextSub = newLink
        newLink.preSub = this.subsTail
        this.subsTail = newLink
      } else {
        this.subs = newLink
        this.subsTail = newLink
      }
    }
    return this._value
  }
  set value(newValue) {
    this._value = newValue
    // 通知effect重新执行
    let link = this.subs
    const queuedEffect = []
    while( link ){
      queuedEffect.push(link.sub)
      link = link.nextSub
    }
    queuedEffect.forEach(effect => effect())
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
