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
 * 依赖收集器：收集依赖 建立ref和effect的链表关系
 * @param dep 订阅者
 */
export function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 *依赖触发器：触发 ref 关联的 effect 重新执行
 * @param dep
 */
export function triggerRef(dep) {
  if (dep.subs) {
    progate(dep.subs)
  }
}

/**
 * 从语义层面来看，trackRef 的命名通常与响应式编程相关，尤其是在像 Vue 或类似框架中处理响应式数据时。以下是对 track 和 trigger 的解释：

track
语义：track 的意思是“跟踪”或“追踪”。在响应式系统中，track 通常用于记录哪些依赖（例如组件或函数）正在使用某个响应式数据。
用途：当某个响应式数据被访问时，track 会将当前的依赖（例如一个函数或组件）添加到依赖列表中，以便在数据发生变化时通知这些依赖。
命名原因：它表示“跟踪依赖关系”，即跟踪哪些地方需要监听这个数据的变化。
trigger
语义：trigger 的意思是“触发”。在响应式系统中，trigger 通常用于通知依赖某个数据的所有监听者，当数据发生变化时需要重新执行。
用途：当响应式数据被修改时，trigger 会触发所有依赖于该数据的更新逻辑（例如重新渲染组件或重新执行某些函数）。
命名原因：它表示“触发更新”，即通知依赖数据的地方进行响应。
为什么命名为 trackRef
trackRef 的命名可能表示这是一个与“引用”（ref）相关的响应式数据跟踪功能。它可能负责跟踪某个 ref 的依赖关系，以便在 ref 的值发生变化时触发更新。
总结：

**track**：跟踪依赖关系。
**trigger**：触发依赖更新。 这种命名方式清晰地表达了响应式系统的核心机制：跟踪依赖和触发更新。
 */
