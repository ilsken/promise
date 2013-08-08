function Deferred(onFulfilled, onRejected, onProgress){
  if(!this instanceof Deferred) return new Deferred(fn)
  var self = this;
  this.state = null;
  this.delegating = false;
  this.queue = []
  // event handlers
  this.onFulfilled = onFulfilled
  this.onRejected = onRejected
  this.onProgress = onProgress

  this.promise = new Promise($then(self))
  //this.promise = new Promise()
}
Deferred.prototype.then = function(onFulfilled, onRejected, onProgress){
  var self = this;
  var d = new Deferred()
  handle(self, d)
  return d;
}

Deferred.prototype.resolve = function(newValue){
  if(!this.delegating) resolve(this, newValue)
}

Deferred.prototype.reject = function(err){
  if(!this.delegating) reject(this, err)
}


function resolve(self, newValue){
  if(self.state !== null) return;
  try{
    if(newValue === self) throw new TypeError('A promise can not be resolved to itself')
    if(newValue && typeof newValue.then === 'function'){
      self.delegating = true;
      newValue.then($resolve(self), $reject(self))
    } else {
      self.state = true
      self.value = newValue
      flush(self)
    }
  } catch(err){
    console.log('rejected :(', self, self.value)
    self.reject(err) 
  }
}

function reject(self, err){
  if(self.state !== null) return;
  self.state = false
  self.value = err
  flush(self)
}

function flush(self){
  for(var i = 0; i < self.queue.length; i++){
    var item = self.queue[i]
    handle(self, item)
  }
  self.queue = null
}

function handle(self, deferred) {
  var state = self.state
    , value = self.value
  if (state === null) {
    return self.queue.push(deferred)
  }
  var cb = state ? deferred.onFulfilled : deferred.onRejected
  if (cb === null) {
    (state ? deferred.resolve : deferred.reject)(value)
    return
  }
  var ret
  try {
    ret = cb(value)
  }
  catch (e) {
    deferred.reject(e)
    return
  }
  deferred.resolve(ret)

}


/*! 
 *  private methods for delegating to promises
 */ 
function $resolve(target){
  return function(newValue){
    return resolve(target, newValue)
  }
}

function $reject(target){
  return function(error){
    return reject(target, error)
  }
}

function $proxy(target, method){
  return function(value){
    return target[method](value)
  }
}


function Promise(then){
  if(!(this instanceof Promise)) return new Promise(then)
  this.then = then
}

function Handler(onFulfilled, onRejected, resolve, reject){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
  this.onRejected = typeof onRejected === 'function' ? onRejected : null
  this.resolve = resolve
  this.reject = reject
}



var test = new Deferred()

test.then(function(result){
  console.log('got result', result)
}, function(err){
  console.log('got error :( ', err)
}).then(null, function(err){
  console.log('final error: ', err)
})
test.reject(new Error('buzz kill'))
test.resolve('foo')


