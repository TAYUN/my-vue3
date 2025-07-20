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
// 保存已经被清理掉的节点，留着复用
let linkPool: Link

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
  let newLink: Link
  // 如果有就复用linkPool
  if (linkPool) {
    console.log('复用了linkPool')
    newLink = linkPool
    linkPool = linkPool.nextDep
    newLink.nextDep = nextDep
    newLink.dep = dep
    newLink.sub = sub
    // newLink.nextDep = undefined
    // newLink.preSub = undefined
    // 如果没有就创建新的
  } else {
    newLink = {
      sub,
      dep,
      nextDep,
      nextSub: undefined,
      preSub: undefined,
    }
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
    const sub = link.sub
    if (!sub.tracking) {
      queuedEffect.push(sub)
    }
    link = link.nextSub
  }
  queuedEffect.forEach(effect => effect.notify())
}

/**
 * 开始追踪依赖，将depsDtail尾节点设置成undefined
 * @param sub 订阅者
 */
export function startTrack(sub) {
  // 标记正在追踪依赖
  sub.tracking = true
  // 标记为undefined，表示dep触发了重新执行，要尝试复用 link 节点
  sub.depsTail = undefined
}
/**
 * 结束追踪，找到需要清理的依赖清除依赖关系
 * @param sub 订阅者
 */
export function endTrack(sub) {
  sub.tracking = false
  const depsTail = sub.depsTail
  /**
   * 两种情况：
   * 1. 如果depsTail有值，且depsTail有nextDep，应该把它移除
   * 2. 如果depsTail没有，但头结点有，就把所有依赖清理掉

   */
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep)
      depsTail.nextDep = undefined
    }
  } else if (sub.deps) {
    clearTracking(sub.deps)
    sub.deps = undefined
  }
}
/**
 * 清理依赖关系
 * @param link 链表
 */
function clearTracking(link: Link) {
  while (link) {
    const { preSub, nextDep, nextSub, dep } = link
    /**
     * 处理上一个节点
     * 如果preSub有，那就把preSub的下一个节点指向当前节点的下一个节点
     * 如果preSub没有，那就把dep.subs指向当前节点的下一个节点
     */
    if (preSub) {
      preSub.nextSub = nextSub
      link.nextSub = undefined
    } else {
      dep.subs = nextSub
    }
    /**
     * 处理下一个节点
     * 如果nextSub有，那就把nextSub的preSub指向当前节点的preSub
     * 如果nextSub没有，那就把dep.subsTail指向当前节点的preSub
     */
    if (nextSub) {
      nextSub.preSub = preSub
      link.preSub = undefined
    } else {
      dep.subsTail = preSub
    }

    link.sub = link.dep = undefined
    // 把不要的节点给linkPool 让他复用
    link.nextDep = linkPool
    linkPool = link
    console.log('不要了你保存起来吧')
    link = nextDep
  }
}
