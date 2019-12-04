// 定义常量表示状态
const PENDING = "pending"
const RESOLVED = "resolved"
const REJECTED = "rejected"

function MyPromise (fn) {
    const that = this
    // 初始化状态为pending
    that.state = PENDING
    // value 用于保存resolve / reject 传入的值,初始值为null
    that.value = null
    // 用于保存resolve和reject的then中的回调
    that.onFulfilled = []
    that.onRejected = []

    function resolve(value) {
        if (that.state === PENDING){
            that.state = RESOLVED
            that.value = value
            that.onFulfilled.map(cb => cb(that.value))
        }
    }
    function reject(reason) {
        if (that.state === PENDING){
            that.state = REJECTED
            that.value = reason
            that.onRejected.map(cb => cb(that.value))
        }
    }

    // 执行Promise中传入的函数
    try {
        fn(resolve, reject)
    }catch (e) {
        reject(e)
    }
}
// 实现then函数
MyPromise.prototype.then = function (onFulfilled, onRejected) {
    const that = this
    // 判断两个参数是否为函数类型，如果不是，则创建一个函数赋值给对应得参数，同时也实现了透传
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
    onRejected = typeof onRejected === 'function' ? onRejected : r => { throw r }

    if (that.state === PENDING){
        that.onFulfilled.push(onFulfilled)
        that.onRejected.push(onRejected)
    }
    if (that.state === RESOLVED){
        onFulfilled(that.value)
    }
    if (that.state === REJECTED){
        onRejected(that.value)
    }
}

// 测试实现
new MyPromise((resolve, reject) => {
    setTimeout(() => {
        resolve(1)
    })
}).then(value => {
    console.log(value);
})