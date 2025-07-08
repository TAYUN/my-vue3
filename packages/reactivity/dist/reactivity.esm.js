// packages/reactivity/src/effect.ts
var activeSub;
function effect(fn) {
  activeSub = fn;
  activeSub();
  console.log("2222", 2222);
  activeSub = void 0;
}

// packages/reactivity/src/ref.ts
var RefImpl = class {
  _value;
  // 标记，证明是一个ref
  ["__v_isRef" /* IS_REF */] = true;
  subs;
  constructor(value) {
    this._value = value;
  }
  get value() {
    console.log("\u6709\u4EBA\u8BBF\u95EE\u6211\u4E86");
    if (activeSub) {
      this.subs = activeSub;
    }
    return this._value;
  }
  set value(newValue) {
    console.log("\u6211\u7684\u503C\u66F4\u65B0\u4E86");
    this._value = newValue;
    this.subs?.();
  }
};
function ref(value) {
  return new RefImpl(value);
}
function isRef(ref2) {
  return !!(ref2 && ref2["__v_isRef" /* IS_REF */]);
}
export {
  activeSub,
  effect,
  isRef,
  ref
};
