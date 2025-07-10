import { ReactiveEffect } from 'vue'
/**
 * 链表节点
 */
export interface Link {
  // 保存effect
  sub: ReactiveEffect
  // 上一个节点
  nextSub: Link | undefined
  // 下一个节点
  preSub: Link | undefined
}

/**
 * 链接链表关系
 * @param dep
 * @param sub
 */
export function link(dep, sub) {
  const newLink = {
    sub,
    nextSub: undefined,
    preSub: undefined,
  }
  /**
   * 添加到链表末尾
   * 1. 如果有尾节点，将newLink设置为尾节点的nextSub
   * 2. 否者尾节点为空，则将newLink设置为头节点
   */
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.preSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = newLink
    dep.subsTail = newLink
  }
}

/**
 * 传播更新的函数
 * @param subs
 */
export function progate(subs) {
  // 通知effect重新执行
  let link = subs
  const queuedEffect = []
  while (link) {
    // 收集依赖
    queuedEffect.push(link.sub)
    link = link.nextSub
  }
  queuedEffect.forEach(effect => effect.notify())
}
