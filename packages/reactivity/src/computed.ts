import { isFunction } from "@vue/shared"
class ComputedRefImpl{
  constructor(getter, setter) { 
  }
}
export function computed(getterOrOptions) {
  let getter, setter 
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    // setter = () => {
    //   console.warn('computed value must be readonly')
    // }
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return  new ComputedRefImpl(getter, setter)
}