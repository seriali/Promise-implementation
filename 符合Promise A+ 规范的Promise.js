// 定义常量表示状态
const PENDING = "pending";
const RESOLVED = "resolved";
const REJECTED = "rejected";

function MyPromise(executor){
    const that = this;
    // 初始化状态为pending
    that.state = PENDING;
    // value 用于保存resolve / reject 传入的值,初始值为null
    that.value = null;
    // 用于保存resolve和reject的then中的回调
    that.onFulfilled = [];
    that.onRejected = [];

    // Promise / A+ 2.1
    function resolve(value) {
        if (that.state === PENDING){
            that.state = RESOLVED;
            that.value = value;
            that.onFulfilled.map(cb => cb(that.value));
        }
    }
    function reject(reason) {
        if (that.state === REJECTED){
            that.state = REJECTED;
            that.value = reason;
            that.onRejected.map(cb => cb(that.value));
        }
    }

    // 执行Promise中传入的函数
    try {
        executor(resolve, reject);
    }catch (e) {
        reject(e);
    }
}
// then函数的实现
MyPromise.prototype.then = function (onFulfilled, onRejected) {
    const that = this;
    // Promise / A+ 2.2.1 / Promise / A+ 2.2.5 / Promise / A+ 2.2.7.3 / Promise / A+ 2.2.7.4
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };
    // Promise / A+ 2.2.7
    if (that.state === PENDING){
        // 返回一个新的Promise对象，并且在Promise中传入了一个函数
        return (promise2 = new MyPromise((resolve, reject) => {
            // 规范规定，执行onFulfilled / onRejected函数时会返回一个 x ，并且执行Promise解决过程
            // 这是为了不同的Promise都可以兼容使用，比如jQuery的Promise能兼容ES6的Promise
            that.onFulfilled.push(() => {
                try {
                    const x = onFulfilled(that.value);
                    resolutionPromise(promise2, x, resolve, reject);
                }catch (e) {
                    reject(e)
                }
            });
            that.onRejected.push(() => {
                try {
                    const x = onRejected(that.value);
                    resolutionPromise(promise2, x, resolve, reject);
                }catch (e) {
                    reject(e)
                }
            })
        }))
    }
    if (that.state === RESOLVED){
        return (promise2 = new MyPromise((resolve, reject) => {
            // Promise / A+ 2.2.2
            // Promise / A+ 2.2.4 --setTimeout
            setTimeout(() => {
                try {
                    // Promise / A+ 2.2.7.1
                    const x = onFulfilled(that.value);
                    resolutionPromise(promise2, x, resolve, reject);
                }catch (e) {
                    reject(e);
                }
            })
        }))
    }
    if (that.state === REJECTED){
        return (promise2 = new MyPromise((resolve, reject) => {
            // Promise / A+ 2.2.3
            setTimeout(() =>{
                try {
                    const x = onRejected(that.value);
                    resolutionPromise(promise2, x, resolve, reject);
                }catch (e) {
                    reject(e);
                }
            })
        }))
    }
};
// 能兼容多种 Promise 的 resolutionPromise函数
function resolutionPromise(promise2, x, resolve, reject) {
    const that = this;
    // Promise / A+ 2.3.1
    // 如果x与promise指向同一对象，报TypeError错误，因为会发生循环引用的问题
    if (x === promise2){
        reject(new TypeError("Error"));
    }
    // Promise / A+ 2.3.2
    if (x instanceof MyPromise){
        if (x.state === PENDING){
            x.then(value => {
                resolutionPromise(promise2, value, resolve, reject);
            }, reject)
        }else {
            // Promise / A+ 2.3.2.2 / Promise / A+ 2.3.2.3
            x.then(resolve, reject);
        }
        return;
    }
    // 创建变量判断是否已经调用过函数,默认为false
    // Promise / A+ 2.3.3.3.3 只能调用一次
    let called = false;
    // 判断x是否为对象或者函数，如果都不是，将x 传入resolve中
    // 如果x 是对象或者函数
    if (x !== null && typeof x === 'object' || typeof x === 'function'){
        try {
            let then = x.then;
            // 如果then 是函数类型， 将x 作为函数的作用域this调用，并且传入两个回调函数作为参数
            // 第一个参数为resolvePromise, 第二个参数为rejectPromise, 两个参数都需要判断是否已经执行过
            // Promise / A+ 2.3.3
            if (typeof then === 'function'){
                // Promise / A+ 2.3.3.1
                then.call(x, y => {
                    if(called) return;
                    called = true;
                    resolutionPromise(promise2, y, resolve, reject);
                }, r => {
                    // Promise / A+ 2.3.3.2
                    if (called) return;
                    called = true;
                    reject(r);
                })
            }else {
                // Promise / A+ 2.3.3.4
                if (called) return;
                called = true;
                resolve(x)
            }
        }catch (e) {
            // Promise / A+ 2.3.3.2
            if (called) return;
            called = true;
            reject(e)
        }
    }else {
        // Promise / A+ 2.3.3.4
        resolve(x)
    }
}
module.exports = MyPromise;