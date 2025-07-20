# Vue 学习笔记

## 📚 响应式系统

### 核心概念

#### 什么是响应式？
响应式系统是 Vue 的核心特性，当数据发生变化时，视图会自动更新。

```javascript
// 基本响应式示例
const state = reactive({ count: 0 })
effect(() => {
  console.log(state.count) // 当 count 变化时自动执行
})
state.count++ // 触发 effect 重新执行
```

#### 核心 API

**reactive()**
- 创建响应式对象
- 基于 Proxy 实现
- 深度响应式

**effect()**
- 副作用函数
- 自动收集依赖
- 数据变化时重新执行

### 实现原理

#### 1. Proxy 代理
```javascript
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      // 依赖收集
      track(target, key)
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      // 触发更新
      trigger(target, key)
      return result
    }
  })
}
```

#### 2. 依赖收集系统
```javascript
// 全局变量存储当前活跃的 effect
let activeEffect = null

// 依赖映射表：target -> key -> effects
const targetMap = new WeakMap()

function track(target, key) {
  if (!activeEffect) return
  
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  
  dep.add(activeEffect)
}
```

#### 3. 触发更新
```javascript
function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  
  const dep = depsMap.get(key)
  if (dep) {
    dep.forEach(effect => effect())
  }
}
```

### 关键知识点

#### WeakMap vs Map
- **WeakMap**: 键必须是对象，弱引用，可被垃圾回收
- **Map**: 键可以是任意类型，强引用

#### Proxy vs Object.defineProperty
| 特性 | Proxy | Object.defineProperty |
|------|-------|----------------------|
| 监听范围 | 整个对象 | 单个属性 |
| 数组支持 | 原生支持 | 需要特殊处理 |
| 新增属性 | 自动监听 | 无法监听 |
| 性能 | 更好 | 较差 |

### 常见问题

#### Q: 为什么使用 Reflect？
A: Reflect 提供了更规范的对象操作方式，与 Proxy 配合使用可以确保正确的 this 绑定。

#### Q: effect 如何避免无限循环？
A: 通过检查当前执行的 effect 是否已经在依赖集合中来避免。

### 实践练习

#### 练习1：基础响应式
```javascript
// 实现一个简单的响应式对象
const data = reactive({ name: 'Vue', version: 3 })
effect(() => {
  console.log(`${data.name} ${data.version}`)
})
data.name = 'Vue.js' // 应该触发 effect
```

#### 练习2：嵌套对象
```javascript
// 处理嵌套对象的响应式
const data = reactive({
  user: {
    name: 'John',
    age: 25
  }
})
effect(() => {
  console.log(data.user.name)
})
data.user.name = 'Jane' // 应该触发 effect
```

## 🔧 开发环境

### 项目结构
```
packages/
├── reactivity/     # 响应式系统
│   ├── src/
│   │   ├── effect.ts
│   │   ├── reactive.ts
│   │   └── index.ts
│   └── examples/
├── shared/         # 共享工具
└── vue/           # 主包
```

### 开发工具
- **TypeScript**: 类型安全
- **Vitest**: 单元测试
- **pnpm**: 包管理器
- **Live Preview**: 实时预览

### 调试技巧
1. 使用 `console.log` 追踪执行流程
2. 在关键位置设置断点
3. 查看 `targetMap` 的结构理解依赖关系
4. 编写单元测试验证功能

## 📝 学习心得

### 今日收获
- 理解了响应式系统的基本原理
- 掌握了 Proxy 的基本用法
- 学会了依赖收集的实现思路

### 遇到的问题
1. **问题**: Proxy 的 get 陷阱何时触发？
   **解决**: 当访问对象属性时触发，包括读取和检查属性存在性

2. **问题**: 如何处理数组的响应式？
   **解决**: Proxy 可以自然处理数组的索引访问和方法调用

### 下次学习计划
- [ ] 深入理解 effect 的实现细节
- [ ] 学习 computed 的实现原理
- [ ] 研究 Vue 3 源码中的优化策略

---
*最后更新：2025-01-20*