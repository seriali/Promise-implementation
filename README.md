# Promise / A+ 的规范（翻译版）
> **1.术语**
>
&emsp;&emsp;1.1. promise是一个有then 方法的对象或者函数，行为遵循这个规范

&emsp;&emsp;1.2. thenable 是一个有then 方法的对象或者函数

&emsp;&emsp;1.3. value是promise状态成功的值（包括undefined/thenable或者promise）

&emsp;&emsp;1.4. exception是一个使用throw抛出的异常值

&emsp;&emsp;1.5. reason是promise 状态失败时的值
> 要求
##### 2.1 Promise States
Promise必须处于以下三个状态之一： pending， fulfilled或者是rejected
* **2.1.1如果promise在pending状态**
```
2.1.1.1 可以变成fulfilled或者rejected
```
* **2.1.2如果promise在fulfilled状态**
```
2.1.2.1 不会变成其他状态
2.1.2.2 必须有一个value值
```
* **2.1.3如果promise在rejected状态**
```
2.1.3.1 不会变成其他状态
2.1.3.2 必须有一个promise被reject的reason
```
tip:promise的状态只能从 pending 变成 fulfilled ，或者从 pending 变成 rejected 。promise 成功有成功的value；promise失败的话，又失败的reason。
##### 2.2 then 方法
promise 必须提供一个 then 方法，来访问最终的结果。
promise 的 then 方法接收两个参数
```
promise.then(onFulfilled, onRejected)
```
* **2.2.1 onFulfilled 和 onrejected 都是可选参数**
```
2.2.1.1 onFulfilled 必须是函数类型
2.2.1.2 onRejected 必须是函数类型
```
* **2.2.2 如果 onFulfilled 是函数**
```
2.2.2.1 必须在 promise 变成 fulfilled时，调用 onFulfilled ，参数是 promise 的 value
2.2.2.2 在 promise 的状态不是 fulfilled 之前
2.2.2.3 onRejected 只能被调用一次
```
* **2.2.4 onFulfilled 和 onRejected 应该是微任务**
* **2.2.5 onFulfilled 和 onRejected 必须作为函数被调用**
* **2.2.6 then 方法可能被多次调用**
```
2.2.6.1 如果 promise 变成了 fulfilled 状态， 所有的 onFulfilled 回调都需要按照 then 的顺序执行
2.2.6.2 如果 promise 变成了 rejected 状态， 所有的 onRejected 回调都需要按照 then 的顺序执行
```
* **2.2.7 then 必须返回一个promise**
```
promise2 = promise1.then(onFulfilled, onRejected);
```
```
2.2.7.1 onFulfilled 或 onRejected 执行的结果为x， 调用resolvePromise
2.2.7.2 如果 onFulfilled 或 onRejected 执行时抛出异常e，promise2 需要被 reject
2.2.7.3 如果 onFulfilled 不是一个函数， promise2 以 promise1 的值 fulfilled
2.2.7.4 如果 onRejected 不是一个函数，promise2 以 promise1 的reason rejected
```
##### 2.3 resolvePromise 方法
* **2.3.1 如果 promise2 和 x 相等，那么 reject promise with a TypeError**
*  **2.3.2 如果 x 是一个 promise**
```
2.3.2.1 如果 x 是 pending 状态，那么 promise 必须要在pending，直到 x 变成 fulfilled or rejected
2.3.2.2 如果 x 被 fulfilled， fulfill promise with the same value
2.3.2.3 如果 x 被 rejected， reject promise with the same reason
```
* **2.3.3 如果 x 是一个 object 或者是一个 function**
```
2.3.3.1  let then = x.then
2.3.3.2 如果 x.then 出错，那么 reject promise with e as the reason
2.3.3.3 如果 then 是一个函数，then.call(x, resolvePromiseFn, rejectPromise)
&emsp;&emsp;2.3.3.3.1 resolvePrmoiseFn 的入参是y, 执行resolvePromise(promise2, x, resolve, reject)
&emsp;&emsp;2.3.3.3.2 rejectPromise 的入参是 r，reject promise with r
&emsp;&emsp;2.3.3.3.3 如果 resolvePromise 和 rejectPromise 都调用了，那么第一个调用优先，后面的调用忽略
&emsp;&emsp;2.3.3.3.4 如果调用 then 抛出异常e
&emsp;&emsp;&emsp;&emsp;2.3.3.3.4.1 如果 resolvePromise 或rejectPromise 已经被调用，那么忽略
&emsp;&emsp;&emsp;&emsp;2.3.3.3.4.2 否则，reject promise with e as the reason
2.3.3.4 如果 then 不是一个 function， fulfill promise with x
```
* **2.3.4 如果 x 不是一个 object 或者是一个 function，fulfill promise with x**
### Promise 的其他方法实现
1. Promise.resolve()
2. Promise.reject()
3. Promise.prototype.catch()
4. Promise.prototype.finally()
5. Promise.all()
6. Promise.race()

每个方法的具体实现：

> **Promise.resolve**
>
Promise.resolve(value) 返回一个以给定值解析后的Promise对象

1. 如果 value 是个 thenable 对象，返回的 promise 会"跟随"这个 thenable 的对象，采用它的最终状态
2. 如果传入的 value 本身就是 promise 对象，那么Promise.resolve 将不做任何修改、直接返回这个promise对象
3. 其他情况，直接返回以该值为成功状态的 promise 对象
```
MyPromise.resolve = function (value){
    if(value instanceof MyPromise){
        return value;
    }
    return new MyPromise((resolve, reject) => {
        if(value && vallue.then && typeof value.then === 'function'){
            setTimeout(() => {
                value.then(resolve, reject)
            })
        }else {
            reject(value)
        }
    });
}

注：thenable 对象的执行增加 setTimeout 的原因是根据原生 Promise 对象执行的结果推断的，使用setTimeout延时模拟
```
> **Promise.reject**
>
Promise.reject() 方法的参数，会原封不动地作为 reject 的理由，变成后续方法的参数

```
Promise.reject = function(reason){
    return new Promise((resolve, reject) => {
        reject(reason);
    })
}
```
> **Promise.prototype.catch**
>
Promise.prototype.catch 用于指定出错时的回调，是特殊的 then 方法，catch 之后，可以继续 .then
```
Promise.prototype.catch = function(onRejected){
    return this.then(null, onRejected);
}
```
> **Promise.prototype.finally**
>
不管是成功还是失败，都会走到finally中，并且finally之后，还可以继续 .then，并且会将值原封不动地传递给后面的 then.
```
Promise.prototype.finally = function(callback){
    return this.then((value) => {
        return Promise.resolve(callback()).then(() => {
            return value;
        })
    }, (err) => {
        return Promise.resovle(callback()).then(() => {
            throw err;
        });
    });
}
```
> **Promise.all**
>
Promise.all(promises) 返回一个 promise 对象
1. 如果传入的参数是一个空的可迭代对象,那么次 promise 对象回调完成(resolve)，这个情况是同步执行的，其他都是异步返回的
2. 如果传入的参数不包含任何 promise,则返回一个异步完成.
3. promise 中所有的 promise 都 "完成" 时或参数中不包含 promise 时回调完成.
4. 如果参数中有一个 promise 失败,那么 Promise.all 返回的 promise 对象失败.
5. 在任何情况下, Promise.all 返回的 promise 的完成状态的结果都是一个数组.
```
Promise.all = function(promises){
    return new Promise((resolve, reject) => {
        let index = 0;
        let result = [];
        if(promises.length === 0){
            resolve(result);
        }else {
            function processValue(i, data){
                result[i] = data;
                if(++index === promises.length){
                    resolve(result);
                }
            }
            for(let i = 0; i < promises.length; i++){
                // promises[i] 可能是普通值
                Promise.resolve(promises[i]).then((data) => {
                    processValue(i, data);
                }, (err) => {
                    reject(err);
                    return;
                });
            }
        }
    });
}
```
> **Promise.race()**
>
Promise.race(iterable) 函数返回一个 Promise,它将与第一个传递的 Promise 相同的完成方式被完成.它可以是完成(resolves),

也可以是失败(rejects),这要取决于第一个完成的方式是两个中的哪一个.

如果传的参数数组是空,则返回的 promise 将永远等待.

一旦迭代器中的某个 promise 解决或拒绝,返回的 promise就会解决或拒绝.
```
Promise.race = function(promises){
    return new Promise((resolve, reject) => {
        if(promises.length === 0){
            return;
        }else {
            for(let i = 0; i < promises.length; i++){
                Promise.resolve(promises[i]).then((data) => {
                    resolve(data);
                    return;
                }, (err) => {
                    reject(err);
                });
            }
        }
    });
}
```
