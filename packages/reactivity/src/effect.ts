import { Link } from './system'

export let activeSub

class ReactiveEffect {
  // 依赖项链表头节点
  deps: Link | undefined
  // 依赖项链表尾节点
  depsTail: Link | undefined
  constructor(public fn) {}
  run() {
    // 先将当前的effect保存起来，用来处理嵌套逻辑
    const prevSub = activeSub

    // 每次执行fn的时候，将当前的effect保存在activeSub中
    activeSub = this
    // 标记为undefined，表示dep触发了重新执行，要尝试复用 link 节点
    this.depsTail = undefined
    try {
      return this.fn()
    } finally {
      // 执行fn完成之后，恢复之前的effect
      activeSub = prevSub
    }
  }
  /**
   *  通知更新方法，如果依赖的数据发生变化，则调用这个函数
   */
  notify() {
    this.scheduler()
  }
  /**
   * 默认调用 run 如果用户传了，则以用户的为主，否则调用原生默认的
   */

  scheduler() {
    this.run()
  }
}
export function effect(fn, options) {
  const e = new ReactiveEffect(fn)
  e.run()
  // scheduler
  Object.assign(e, options)
  // const runner = () => e.run()
  /**
   * 绑定函数this
   */
  const runner = e.run.bind(e)
  runner.effect = e
  return runner
}
