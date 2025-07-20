// packages/reactivity/src/system.ts
var linkPool;
function link(dep, sub) {
  const currentDep = sub.depsTail;
  const nextDep = currentDep === void 0 ? sub.deps : currentDep.nextDep;
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep;
    return;
  }
  let newLink;
  if (linkPool) {
    console.log("\u590D\u7528\u4E86linkPool");
    newLink = linkPool;
    linkPool = linkPool.nextDep;
    newLink.nextDep = nextDep;
    newLink.dep = dep;
    newLink.sub = sub;
  } else {
    newLink = {
      sub,
      dep,
      nextDep,
      nextSub: void 0,
      preSub: void 0
    };
  }
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink;
    newLink.preSub = dep.subsTail;
    dep.subsTail = newLink;
  } else {
    dep.subs = newLink;
    dep.subsTail = newLink;
  }
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink;
    sub.depsTail = newLink;
  } else {
    sub.deps = newLink;
    sub.depsTail = newLink;
  }
}
function progate(subs) {
  let link2 = subs;
  const queuedEffect = [];
  while (link2) {
    const sub = link2.sub;
    if (!sub.tracking) {
      queuedEffect.push(sub);
    }
    link2 = link2.nextSub;
  }
  queuedEffect.forEach((effect2) => effect2.notify());
}
function startTrack(sub) {
  sub.tracking = true;
  sub.depsTail = void 0;
}
function endTrack(sub) {
  sub.tracking = false;
  const depsTail = sub.depsTail;
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep);
      depsTail.nextDep = void 0;
    }
  } else if (sub.deps) {
    clearTracking(sub.deps);
    sub.deps = void 0;
  }
}
function clearTracking(link2) {
  while (link2) {
    const { preSub, nextDep, nextSub, dep } = link2;
    if (preSub) {
      preSub.nextSub = nextSub;
      link2.nextSub = void 0;
    } else {
      dep.subs = nextSub;
    }
    if (nextSub) {
      nextSub.preSub = preSub;
      link2.preSub = void 0;
    } else {
      dep.subsTail = preSub;
    }
    link2.sub = link2.dep = void 0;
    link2.nextDep = linkPool;
    linkPool = link2;
    console.log("\u4E0D\u8981\u4E86\u4F60\u4FDD\u5B58\u8D77\u6765\u5427");
    link2 = nextDep;
  }
}

// packages/reactivity/src/effect.ts
var activeSub;
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  // 依赖项链表头节点
  deps;
  // 依赖项链表尾节点
  depsTail;
  // 是否在追踪标记 用于处理循环递归追踪的问题
  tracking = false;
  run() {
    const prevSub = activeSub;
    activeSub = this;
    startTrack(this);
    try {
      return this.fn();
    } finally {
      endTrack(this);
      activeSub = prevSub;
    }
  }
  /**
   *  通知更新方法，如果依赖的数据发生变化，则调用这个函数
   */
  notify() {
    this.scheduler();
  }
  /**
   * 默认调用 run 如果用户传了，则以用户的为主，否则调用原生默认的
   */
  scheduler() {
    this.run();
  }
};
function effect(fn, options) {
  const e = new ReactiveEffect(fn);
  e.run();
  Object.assign(e, options);
  const runner = e.run.bind(e);
  runner.effect = e;
  return runner;
}

// packages/shared/src/index.ts
function isObject(obj) {
  return obj && typeof obj === "object" && !Array.isArray(obj) && obj !== null;
}
function hasChange(newValue, oldValue) {
  return !Object.is(newValue, oldValue);
}

// packages/reactivity/src/ref.ts
var RefImpl = class {
  _value;
  // 标记，证明是一个ref
  ["__v_isRef" /* IS_REF */] = true;
  /**
   * 订阅者头结点 header
   */
  subs;
  /**
   * 订阅者尾节点 tail
   */
  subsTail;
  constructor(value) {
    this._value = isObject(value) ? reactive(value) : value;
  }
  get value() {
    if (activeSub) {
      trackRef(this);
    }
    return this._value;
  }
  set value(newValue) {
    if (hasChange(newValue, this._value)) {
      this._value = isObject(newValue) ? reactive(newValue) : newValue;
      triggerRef(this);
    }
  }
};
function ref(value) {
  return new RefImpl(value);
}
function isRef(ref2) {
  return !!(ref2 && ref2["__v_isRef" /* IS_REF */]);
}
function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub);
  }
}
function triggerRef(dep) {
  if (dep.subs) {
    progate(dep.subs);
  }
}

// packages/reactivity/src/dep.ts
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (!activeSub) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = /* @__PURE__ */ new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Dep();
    depsMap.set(key, dep);
  }
  link(dep, activeSub);
}
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  if (!dep) {
    return;
  }
  progate(dep.subs);
}
var Dep = class {
  /**
   * 订阅者头结点 header
   */
  subs;
  /**
   * 订阅者尾节点 tail
   */
  subsTail;
  constructor() {
  }
};

// packages/reactivity/src/baseHandles.ts
var mutableHandlers = {
  get(target, key, receiver) {
    track(target, key);
    const res = Reflect.get(target, key, receiver);
    if (isRef(res)) {
      return res.value;
    }
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, newValue, receiver) {
    let oldValue = target[key];
    const res = Reflect.set(target, key, newValue, receiver);
    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue;
      return res;
    }
    if (hasChange(newValue, oldValue)) {
      trigger(target, key);
    }
    return res;
  }
};

// packages/reactivity/src/reactive.ts
function reactive(target) {
  return createReactiveObject(target);
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
var reactiveSet = /* @__PURE__ */ new WeakSet();
function createReactiveObject(target) {
  if (!isObject(target)) {
    return target;
  }
  if (reactiveSet.has(target)) {
    return target;
  }
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  reactiveSet.add(proxy);
  return proxy;
}
function isReactive(target) {
  return reactiveSet.has(target);
}
export {
  activeSub,
  effect,
  isReactive,
  isRef,
  reactive,
  ref,
  trackRef,
  triggerRef
};
