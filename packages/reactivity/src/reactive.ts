import { isObject } from '@vue/shared'
import { mutableHandlers } from './baseHandles'

export function reactive(target) {
  return createReactiveObject(target)
}

/**
 * 实现reactive过程中遇到的问题：
 * 1. 非对象类型的处理问题
 * 2. target是对象，怎么关联依赖关系和触发依赖更新（targetMap和Dep的作用）？
 * 3. 访问对象的访问器属性的时候，this的指向问题（receiver的作用）
 * 4. 重复代理同一个对象的问题（reactiveMap的作用）
 * 5. 传入的对象是一个代理对象的问题（reactiveSet的作用）
 * 6. 更新的值没发生变化，不应该触发更新的处理
 * 7. target.a中的值是ref，读取时自动解包和赋值时智能处理的问题
 * 8. 嵌套对象的深度响应式问题（target={a:{b:1}}需要递归处理）
 */

/**
 * reactiveMap用于缓存已创建的响应式代理对象
 * 键：原始对象(target)，值：对应的响应式代理对象(proxy)
 * 作用：避免对同一个对象重复创建代理，提高性能并保证代理对象的唯一性
 * 使用WeakMap：当原始对象被垃圾回收时，对应的代理对象也会被自动清理，避免内存泄漏
 */
const reactiveMap = new WeakMap()

/**
 * reactiveSet用于标记哪些对象是响应式代理对象
 * 存储所有已创建的响应式代理对象
 * 作用：快速判断一个对象是否为响应式代理，避免对代理对象再次进行代理
 * 使用WeakSet：当代理对象不再被引用时会被自动清理，避免内存泄漏
 */
const reactiveSet = new WeakSet()

// 创建响应式对象函数 为什么独立成函数，因为别的地方也要用到
function createReactiveObject(target) {
  /**
   * reactive 必须是一个对象
   */
  if (!isObject(target)) {
    // 不是对象哪里的回哪去
    return target
  }

  // 检查传入的target是否已经是一个响应式代理对象
  // 如果是代理对象，直接返回，避免对代理对象再次进行代理（代理的代理）
  if (reactiveSet.has(target)) {
    return target
  }

  // 检查是否已经为这个原始对象创建过代理
  // 如果存在，直接返回缓存的代理对象，确保同一个对象只有一个代理实例
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, mutableHandlers)

  // 将原始对象和新创建的代理对象存入缓存
  // 下次对同一个原始对象调用reactive时，直接返回缓存的代理对象
  reactiveMap.set(target, proxy)

  // 将代理对象添加到响应式对象集合中
  // 用于标记这个对象是响应式代理，防止对代理对象再次进行代理
  reactiveSet.add(proxy)

  return proxy
}

/**
 * 判断一个对象是否为响应式代理对象
 * @param target 待判断的对象
 * @returns {boolean} true 表示对象为响应式代理对象，false 表示对象不是响应式代理对象
 */
export function isReactive(target) {
  return reactiveSet.has(target)
}
