// import { ReactiveEffect } from 'vue'

interface Dep {
  // 订阅者链表的头节点
  subs: Link | undefined
  // 订阅者链表的尾节点
  subsTail: Link | undefined
}

interface Sub {
  // 依赖项链表的头结点
  deps: Link | undefined
  // 依赖项链表的尾节点
  depsTail: Link | undefined
}
/**
 * 链表节点
 */
export interface Link {
  // 保存effect
  sub: Sub
  // 节点的依赖项 ref computed
  dep: Dep
  // 下一个依赖项节点
  nextDep: Link | undefined
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
  // 如果 dep 和 sub 已经建立关系，则不需要建立关系
  const currentDep = sub.depsTail

  /**
   * 复用节点两种情况
   * 1. dep 和 sub 已经建立关系，则不需要建立关系, 即 sub.depsTail没有，并且sub.deps.dep === dep
   * 2. 尾节点有 nextDep ，这种情况要复用尾节点的nextDep
   */
  // if(currentDep === undefined && sub.deps){
  //   // 尾节点没有，头结点有
  //   if(sub.deps.dep === dep){
  //     sub.depsTail = sub.deps
  //     return
  //   }
  // } else if(currentDep){
  //   if(currentDep.nextDep?.dep === dep){
  //     sub.depsTail = currentDep.nextDep
  //     return
  //   }
  // }
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    return
  }

  const newLink = {
    sub,
    dep,
    nextDep: undefined,
    nextSub: undefined,
    preSub: undefined,
  }
  // region 将链表节点和dep建立关联关系
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
  // endregion

  // region 将链表节点和sub建立关联关系
  /**
   * 关联链表关系，分两种情况
   * 1. 如果有尾节点，将newLink设置为尾节点的nextDep
   * 2. 否者尾节点为空，则将newLink设置为头节点，尾节点也为newLink
   */
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = newLink
    sub.depsTail = newLink
  }
  // endregion
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
