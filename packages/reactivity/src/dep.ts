/**
 * 绑定 target 的 key 关联的所有的 Dep
 * obj = { a:0, b:1 }
 * targetMap = {
 *  [obj]:{
 *    a:Dep,
 *    b:Dep
 *  }
 * }
 */

import { activeSub } from "./effect"
import { Link, link, progate } from "./system"

/**
 * targetMap是一个WeakMap，用于存储响应式对象与其依赖关系的映射
 * 键是原始对象(target)，值是一个Map，该Map的键是对象的属性名，值是依赖收集器(Dep)
 * 使用WeakMap可以避免内存泄漏，当目标对象不再被引用时，相关的依赖也会被垃圾回收
 */
export const targetMap = new WeakMap()
/**
 * 追踪依赖，将target对象的key属性与当前活跃的订阅者关联起来
 * @param target 目标对象
 * @param key 属性键
 */
export function track(target, key) {
  // 如果没有活跃的订阅者，则不需要追踪依赖
  if (!activeSub) {
    return
  }

  // 获取target对象对应的依赖映射表
  let depsMap = targetMap.get(target)
  // 如果依赖映射表不存在，则创建一个新的Map并与target关联
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  // 获取特定key对应的依赖收集器
  let dep = depsMap.get(key)
  // 如果依赖收集器不存在，则创建一个新的Dep实例并与key关联
  if (!dep) {
    dep = new Dep()
    depsMap.set(key, dep)
  }

  /**
   * 订阅者关联 dep
   * 将当前活跃的订阅者与依赖收集器建立链接关系
   */
  link(dep, activeSub)
}

/**
 * 触发与target对象的key属性关联的所有订阅者更新
 * @param target 目标对象
 * @param key 属性键
 */
export function trigger(target, key) {
  /**
   * 获取target对象对应的依赖映射表
   */
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }
  /**
   * 获取特定key对应的依赖收集器
   */
  const dep = depsMap.get(key)
  if (!dep) {
    return
  }

  /**
   * 触发与该属性关联的所有订阅者更新
   * 从依赖收集器的订阅者链表头开始传播更新
   */
  progate(dep.subs)
}
export class Dep {
  /**
   * 订阅者头结点 header
   */
  subs: Link
  /**
   * 订阅者尾节点 tail
   */
  subsTail: Link
  constructor() {}
}