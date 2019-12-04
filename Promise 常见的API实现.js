const MyPromise = require("./符合Promise A+ 规范的Promise");
/*
Promise.resolve(value) 返回一个给定值解析后的Promise 对象
1. 如果 value 是 thenable 对象，返回的 promise 会跟随这个 thenable 的对象, 采用它的最终形态
2. 如果传入的 value 本身就是 promise 对象，那么Promise.resolve 将不做任何修改、直接返回这个promise对象
3. 其他情况，直接返回以该值为成功状态的 promise 对象
注：thenable 对象的执行增加 setTimeout 的原因是根据原生 Promise 对象执行的结果推断的，使用setTimeout延时模拟
*/
MyPromise.resolve = function (value) {
    if (value instanceof MyPromise) {
        return value;
    }
    return new MyPromise((resolve, reject) => {
        if (value && value.then && typeof value.then === 'function') {
            setTimeout(() => {
                value.then(resolve, reject)
            })
        }else {
            reject(value)
        }
    })
};

/*
Promise.reject()方法的参数会原封不动地作为reject的理由，变成后序方法的参数
 */
MyPromise.reject = function (reason) {
    return new MyPromise((resolve, reject) => {
        reject(reason);
    })
};

/*
Promise.prototype.catch 用于指定出错时的回调，是特殊的then 方法，catch之后，可以继续使用.then
 */
MyPromise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected)
};

/*
Promise.prototype.finally 不管是成功还是失败，都会走到finally中，并且finally之后，还可以继续.then,并且会将值原封不动的传递给
后面的then
 */
MyPromise.prototype.catch = function (callback) {
    return this.then((value) => {
        return MyPromise.resolve(callback()).then(() => {
            return value;
        })
    }, (err) => {
        return MyPromise.resolve(callback()).then(() => {
            throw err;
        });
    });
};

/*
Promise.all 返回一个 promise 对象
1. 如果传入的参数是一个空的可迭代对象,那么次 promise 对象回调完成(resolve)，这个情况是同步执行的，其他都是异步返回的
2. 如果传入的参数不包含任何 promise,则返回一个异步完成.
3. promise 中所有的 promise 都 "完成" 时或参数中不包含 promise 时回调完成.
4. 如果参数中有一个 promise 失败,那么 Promise.all 返回的 promise 对象失败.
5. 在任何情况下, Promise.all 返回的 promise 的完成状态的结果都是一个数组.
 */
MyPromise.all = function (promises) {
    return new MyPromise((resolve, reject) => {
        let index = 0;
        let result = [];
        if (promises.length === 0){
            resolve(result)
        }else {
            function processValue(i, data) {
                result[i] = data;
                if (++index === promises.length){
                    resolve(result);
                }
            }

            for (let i = 0; i < promises.length; i++) {
                // promises[i] 可能是普通值
                MyPromise.resolve(promises[i]).then((data) => {
                    processValue(i, data);
                }, err => {
                    reject(err);
                    return;
                });
            }
        }
    })
};

/*
Promise.race
Promise.race(iterable) 函数返回一个 Promise,它将与第一个传递的 Promise 相同的完成方式被完成.它可以是完成(resolves),
也可以是失败(rejects),这要取决于第一个完成的方式是两个中的哪一个.
如果传的参数数组是空,则返回的 promise 将永远等待.
一旦迭代器中的某个 promise 解决或拒绝,返回的 promise就会解决或拒绝.
 */
MyPromise.race = function (promises) {
    return new MyPromise((resolve, reject) => {
        if (promises.length === 0){
            return ;
        }else {
            for (let i = 0; i < promises.length; i++) {
                MyPromise.resolve(promises[i]).then((data) => {
                    resolve(data);
                    return ;
                }, err => {
                    reject(err);
                    return;
                });
            }
        }
    });
};