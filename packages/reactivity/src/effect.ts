export let activeSub
export function effect(fn) {
  activeSub = fn
  activeSub()
  console.log('2222', 2222)
  activeSub = undefined
}
