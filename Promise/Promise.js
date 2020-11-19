class MyPromise {
    constructor (executor) {
        this.status = 'pending' // 执行状态
        this.value = undefined  // 值
        this.reason = undefined // 失败原因
        this.onResolveCallBack = [] // 存放resolve回调
        this.onRejectCallBack = [] // 存放reject回调
        let resolve = (val) => {
            if (this.status === 'pending') {
                this.status = 'resolved'
                this.value = val
                // 链式调用
                while (this.onResolveCallBack.length) {
                    const callback = this.onResolveCallBack.shift();
                    callback(val)
                }
            }
        }
        let reject = (val) => {
            if (this.status === 'pending') {
                this.status = 'rejected'
                this.reason = val
                while (this.onRejectCallBack.length) {
                    const callback = this.onRejectCallBack.shift();
                    callback(val)
                }
            }
        } 
        try {
            executor(resolve,reject)
        } catch(e) {
            reject(e)
        }
    }
    then (onResolved, onRejected) {
        // 按照规范，如果回调不是函数的话，则重写成函数跳过此次回调，让他继续执行
        typeof onResolved !== 'function' ? onResolved = val => val : null
        typeof onRejected !== 'function' ? onRejected = reason => {
            throw new Error(reason) 
        } : null
        // 返回一个新的promise
        return new MyPromise((resolve,reject) => {
            // 重写resolve函数
            const resolveFn = val => {
                try {
                    // 执行前一个promise的resolve
                    let x = onResolved(val)
                    // 判断返回值为promise还是数值
                    x instanceof MyPromise ? x.then(resolve,reject): resolve(x)
                } catch(e) {
                    reject(e)
                }
            }
            const rejectFn = error => {
                try {
                    let x = onRejected(error)
                    x instanceof MyPromise ? x.then(resolve,reject) : reject(x)
                } catch(e) {
                    reject(e)
                }
            }
            // 根据状态区分处理方式
            if (this.status === 'pending') {
                this.onResolveCallBack.push(resolveFn)
                this.onRejectCallBack.push(rejectFn)
            } else if (this.status === 'resolved') {
                resolveFn(this.value)
            } else if (this.status === 'rejected') {
                rejectFn(this.reason)
            }
        })
    }

    catch (onRejected) {
        return this.then(undefined, onRejected)
    }
    // 无论上一个 promise 成败都会执行
    finally (callBack) {
        return this.then(
            val => MyPromise.resolve(callBack().then(() => val)),
            error => MyPromise.reject(callBack().then(()=> {
                throw new Error(error)
            }))
        )
    }
    // 返回promise对象
    static resolve (val) {
        if (val instanceof MyPromise) { //如果为promise实例，则直接返回，否则转为promise实例再返回
            return value
        }
        return new MyPromise(resolve => resolve(val))
    }

    // 返回promise对象
    static reject (reason) {
        return new MyPromise((resolve,reject) => reject(reason))
    }

    static all (arr) {
        let index = 0
        let resArr = []
        return new MyPromise ((resolve, reject)=> {
            arr.forEach((x,y) => {
                // MyPromise.resolve(p)用于处理传入值不为Promise的情况
                MyPromise.resolve(x).then(res=> {
                    index++
                    resArr[y] = res
                    if (index === arr.length) {
                        // 全部执行完，执行resolve
                        resolve(resArr)
                    }
                }, err => {
                    reject(err)
                })
            })
        })
    }

    static race (arr) {
        return new MyPromise ((resolve, reject)=> {
            for (let x of arr) {
                // 只要一个执行成功则返回
                MyPromise.resolve(x).then(res=> {
                    resolve(res)
                }, err=> {
                    reject(err)
                })
            }
        })
    }
}
// executor函数
const executor = (resolve, reject) => { 
    setTimeout(()=> {
        resolve('success')
    },1000)
}
const successExecutor = (resolve, reject) => { 
    resolve('resolve-promise')
}
const failExecutor = (resolve, reject) => { 
    reject('reject-promise')
}
const p1 = new MyPromise(executor)
const p2 = new MyPromise(successExecutor)
const p3 = new MyPromise(failExecutor)
p1.then(res=> {
    console.log(res)
    // 链式调用，返回promise
    return p2
}, err => {
    console.error(err)
}).then(res => {
    // 链式调用，返回普通数值
    console.log(res)
    return 1
}).then(12) // 非函数
.then(res=> {
    console.log(res)
    return p3
}).catch(err=>{
    console.error(err)
})
