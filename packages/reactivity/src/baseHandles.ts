import { hasChange, isObject } from '@vue/shared'
import { track, trigger } from './dep'
import { isRef } from './ref'
import { reactive } from './reactive'

export const mutableHandlers = {
  get(target, key, receiver) {
    /**
     * 收集依赖，绑定 target 中某个 key 和 sub 之间的关系
     */
    track(target, key)
    // receiver 用来保证访问器里面的 this 指向代理对象 proxy
    const res = Reflect.get(target, key, receiver)

    if (isRef(res)) {
      /**
       * target = { a: ref(1)}
       * 如果targer.a 是ref，不要让他访问.value，直接返回res
       */
      return res.value
    }
    if (isObject(res)) {
      /**
       * 处理对象切套的问题，如果res 是对象，就包装成代理对象
       */
      return reactive(res)
    }
    return res
  },
  set(target, key, newValue, receiver) {
    let oldValue = target[key]
    /**
     * 设置属性值，并触发更新
     * 1. 使用Reflect.set设置属性值
     * 2. 触发与该属性关联的所有订阅者更新
     */
    const res = Reflect.set(target, key, newValue, receiver)

    /**
     * 处理响应式对象中ref属性的特殊赋值逻辑
     *
     * 场景：当响应式对象的属性是ref，且要赋予的新值不是ref时
     * 我们需要更新ref.value而不是替换整个ref对象
     *
     * 为什么这样做？
     * 1. 保持ref对象的引用不变，维持响应式链路
     * 2. 确保所有依赖这个ref的地方都能收到更新通知
     * 3. 符合用户预期：state.count = 2 等同于 count.value = 2
     */
    if (isRef(oldValue) && !isRef(newValue)) {
      /**
       * 示例：
       * const count = ref(1)
       * const state = reactive({ count })
       *
       * 当执行 state.count = 2 时：
       * - oldValue = ref(1) (原属性值是ref)
       * - newValue = 2 (新值是普通值)
       *
       * 此时应该执行 count.value = 2
       * 而不是直接替换 state.count = 2
       */
      oldValue.value = newValue
      return res
    }

    if (hasChange(newValue, oldValue)) {
      /**
       * 如果新值和旧值不相等，那么触发更新
       * 先 set 再通知 dep 中的 sub 触发更新
       */
      trigger(target, key)
    }
    return res
  },
}