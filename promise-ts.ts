// 三种状态
enum PromiseState {
    PENDING  = 'pending',
    RESOLVED = 'resolved',
    REJECTED = 'rejected'
}

// 成功状态的回调函数
type PromiseResolve<T = any> = (value? : T) => void;
// 失败状态的回调函数
type PromiseReject<T = any> = (reason? : T) => void;
// then方法的类型
type PromiseThen<T = any> = (onResolved? : PromiseResolve<T>, onRejected? : PromiseReject<T | any>) => MyPromise<T | any>;
// catch方法的类型
type PromiseCatch<T = any> = (onRejected? : PromiseReject<T | any>) => MyPromise<T | any>;
// finally方法的类型
type PromiseFinally<T = any> = (handler? : (value? : any) => any) => MyPromise<T | any>;
// 构造函数的参数
type PromiseExecutor<T = any> = (resolve? : PromiseResolve<T>, reject? : PromiseReject<T | any>) => any;
// Promise.all
type PromiseAll = (iterable: MyPromise<any>[]) => MyPromise<any[]>;
// Promise.race
type PromiseRace = (iterable: MyPromise<any>[]) => MyPromise<any>;
//Promise.resolve
type PromiseStaticResolve<T = any> = (value: T) => MyPromise<T>;
//Promise.reject
type PromiseStaticReject<T = any> = (value: T) => MyPromise<T>;

// 构造函数的实现
class MyPromise<T = any> {
    value: T;
    state: PromiseState = PromiseState.PENDING;
    onFulfilled: PromiseResolve[] = [];// then成功的回调
    onRejected: PromiseReject[] = [];// then失败的回调

    static resolutionPromise = <T = any>(promise2: MyPromise, x: any, resolve: PromiseResolve<T>, reject: PromiseReject<T | any>) => {
        // 2.3.1
        if (promise2 === x) {
            return reject(new TypeError("Error"));
        }
        // 2.3.2
        if (x instanceof MyPromise) {
            if (x.state === PromiseState.PENDING) {
                x.then((value: any) => {
                    MyPromise.resolutionPromise(promise2, x, resolve, reject);
                }, reject);
            }else {
                // 2.3.2.2     2.3.2.3
                x.then(resolve, reject)
            }
            return ;
        }
        // 2.3.3.3.3
        let called = false;
        // 2.3.3.2
        if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
            // 2.3.3.2
            try {
                // 2.3.3.1
                let then = x.then;
                if (typeof then === 'function') {
                    // 2.3.3.3
                    then.call(x, y => {
                        if (called) return;
                        called = true;
                        // 2.3.3.3.1
                        MyPromise.resolutionPromise(promise2, x, resolve,reject);
                    }, e => {
                        if (called) return;
                        called = true;
                        reject(e);
                    })
                }else {
                    // 2.3.3.4
                    resolve(x);
                }
            }catch (e) {
                if (called) return ;
                called = true;
                reject(e);
            }
        }else {
            // 2.3.4
            resolve(x);
        }
    };

    static all: PromiseAll = (iterable: MyPromise<any>[]) => {
        return new MyPromise<any[]>((resolve, reject) => {
            const result: any[] = [];
            iterable.forEach((data, i) => {
                data.then((value) => {
                    result[i] = value;
                    if (result.length === iterable.length){
                        resolve(result);
                    }
                }, reject);
            });
            return result;
        });
    };

    static race: PromiseRace = (iterable: MyPromise<any>[]) => {
        return new MyPromise<any>((resolve, reject) => {
            iterable.forEach(data => {
                data.then(value => resolve(value), reject)
            })
        })
    };

    static resolve: PromiseStaticResolve = <T>(value: T) => {
        const promise2 = new MyPromise<T>((resolve, reject) => {
            MyPromise.resolutionPromise(promise2, value, resolve, reject);
        });
        return promise2;
    };

    static reject: PromiseStaticReject = <T>(value: T) => {
        return new MyPromise<T>((resolve, reject) => {
            reject(value);
        })
    };

    constructor(executor: PromiseExecutor<T>) {
        try {
            executor(this.resolve, this.reject);
        }catch (e) {

        }
    };

    resolve: PromiseResolve<T> = (value? : T) => {
        if (value instanceof MyPromise) {
            return value.then(this.resolve, this.reject);
        }
        // 宏任务代替微任务执行
        setTimeout(() => {
            if (this.state === PromiseState.PENDING) {
                this.state = PromiseState.RESOLVED;
                this.value = value;
                this.onFulfilled.map(cb => cb(this.value))
            }
        })
    };

    reject: PromiseResolve<T> = (reason? : T) => {
        setTimeout(() => {
            if (this.state === PromiseState.PENDING) {
                this.state = PromiseState.REJECTED;
                this.value = reason;
                this.onRejected.map(cb => cb(this.value));
            }
        })
    };

    then: PromiseThen<T> = (onResolved? : PromiseResolve<T>, onRejected? : PromiseReject<T>) => {
        let promise2:MyPromise;
        const _onResolved: any = typeof onResolved === 'function' ? onResolved : v => v;
        const _onRejected: any = typeof onRejected === 'function' ? onRejected : r => { throw r };

        if (this.state == PromiseState.PENDING){
            promise2 = new MyPromise<T>((resolve, reject) => {
                this.onFulfilled.push(() => {
                    try {
                        let x = _onResolved(this.value);
                        MyPromise.resolutionPromise(promise2, x, resolve, reject);
                    }catch (reason) {
                        reject(reason)
                    }
                });
                this.onRejected.push(() => {
                    try {
                        let x = _onRejected(this.value);
                        MyPromise.resolutionPromise(promise2, x, resolve, reject);
                    }catch (e) {
                        reject(e)
                    }
                })
            });
            return promise2;
        }
        if (this.state === PromiseState.RESOLVED) {
            let promise2 = new MyPromise<T>((resolve, reject) => {
                setTimeout(() => {
                    try {
                        let x = _onResolved(this.value);
                        MyPromise.resolutionPromise(promise2, x, resolve, reject)
                    }catch (reason) {
                        reject(reason)
                    }
                })
            });
            return promise2;
        }
        if (this.state === PromiseState.REJECTED) {
            let promise2 = new MyPromise<T>((resolve, reject) => {
                setTimeout(() => {
                    try {
                        let x = _onRejected(this.value);
                        MyPromise.resolutionPromise(promise2, x, resolve, reject);
                    }catch (e) {
                        reject(e);
                    }
                })
            });
            return promise2;
        }
    };

    catch: PromiseCatch<T> = (onRejected: PromiseReject<T>) => {
        return this.then(null, onRejected);
    };

    finally: PromiseFinally<T> = (handler? : (value? : any) => any) => {
        return this.then(value => {
            handler(value);
            return value;
        }, r => {
            handler(r);
            throw r;
        });
    }
}

/*new MyPromise((resolve, reject) => {
    setTimeout(() => {
        resolve(1);
    })
}).then(value => {
    console.log(value);
});*/

//promise.race
/*
const promise1 = new MyPromise((resolve, reject) => {
    setTimeout(resolve, 500, 'one');
});
const promise2 = new MyPromise((resolve, reject) => {
    setTimeout(resolve, 100, 'two');
});
MyPromise.race([promise1, promise2]).then((value) => {
    console.log(value);
    // Both resolve, but promise2 is faster
});// expected output: "two"
*/

// promise.all
/*
const promise1 = MyPromise.resolve(3);
const promise2 = MyPromise.resolve(4);
const promise3 = new MyPromise((resolve, reject) => {
    setTimeout(resolve, 100, 'foo');
});

MyPromise.all([promise1, promise2, promise3]).then((values) => {
    console.log(values);
});
*/
