// 响应式系统中receiver的重要性
let trackCount = 0

function track(target, key) {
  trackCount++
  console.log(`[TRACK ${trackCount}] 收集依赖: ${String(key)}`)
}

const original = {
  firstName: 'Vue',
  lastName: 'JS',
  get fullName() {
    // 注意：这里访问了this.firstName和this.lastName
    return `${this.firstName} ${this.lastName}`
  },
}

console.log('=== 不使用receiver的问题 ===')
trackCount = 0
const proxyWithoutReceiver = new Proxy(original, {
  get(target, key) {
    track(target, key)
    return Reflect.get(target, key) // 没有传receiver
  },
})

console.log('访问fullName:', proxyWithoutReceiver.fullName)
console.log('总共收集了', trackCount, '个依赖\n')

console.log('=== 使用receiver的正确做法 ===')
trackCount = 0
const proxyWithReceiver = new Proxy(original, {
  get(target, key, receiver) {
    track(target, key)
    return Reflect.get(target, key, receiver) // 传了receiver
  },
})

console.log('访问fullName:', proxyWithReceiver.fullName)
console.log('总共收集了', trackCount, '个依赖')

console.log('\n=== 为什么这很重要？ ===')
console.log(
  '不使用receiver: getter中的this.firstName访问的是原始对象，不会触发依赖收集',
)
console.log(
  '使用receiver: getter中的this.firstName访问的是代理对象，会正确触发依赖收集',
)