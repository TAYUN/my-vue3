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
    this._value = value;
  }
  get value() {
    if (activeSub) {
      trackRef(this);
    }
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
    triggerRef(this);
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
export {
  activeSub,
  effect,
  isRef,
  ref,
  trackRef,
  triggerRef
};
