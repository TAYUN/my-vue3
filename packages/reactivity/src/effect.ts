export let activeSub

class ReactiveEffect {
  constructor(public fn) {}
  run() {
    try {
      // 每次执行fn的时候，将当前的effect保存在activeSub中
      activeSub = this
      return this.fn()
    } finally {
      // 执行fn完成之后，将activeSub设置为undefined
      activeSub = undefined
    }
  }
}
export function effect(fn) {
  const e = new ReactiveEffect(fn)
  e.run()
}
