function Deferred(onFulfilled, onRejected, onProgress){
  if(!this instanceof Deferred) return new Deferred(fn)
  this.state = null;
  this.delegating = false;
  this.queue = []
  // event handlers
  this.onFulfilled = onFulfilled
  this.onRejected = onRejected
  this.onProgress = onProgress

  // create a public promise
  this.promise = new Promise(this)
  
}
Deferred.prototype.then = function(onFulfilled, onRejected, onProgress){
  var self = this;
  var d = new Deferred(onFulfilled, onRejected, onProgress)
  handle(self, d)
  return d.promise;
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
    console.log('rejected :(', self, self.value, err, err.stackTrace)
    console.trace(err)
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
    console.log('Callback is null with state', state, value, deferred.resolve, deferred.reject)
    if(state === true){
      deferred.resolve(value)
    } else {
      deferred.reject(value)
    }
    return;
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

function $then(target){
  return function(onFufilled, onRejected, onProgress){
    return target.then(onFufilled, onRejected, onProgress)
  }
}

function $resolver(target){
  return function(newValue){
    return target.resolve(newValue)
  }
}

function $rejecter(target){
  return function(newValue){
    return target.reject(newValue)
  }
}

function $notifier(target){
  return function(progress){
    return target.notify(progress)
  }
}

function $proxy(target, method){
  return function(value){
    return target[method](value)
  }
}


function Promise(deferred){
  // support factory method
  if (!(this instanceof Promise)) return new Promise(deferred)
  var type = typeof deferred, fn;
  if (type == 'function'){
    fn = deferred
    deferred = new Deferred()
  }

  if (!(deferred instanceof Deferred)) throw new TypeError('You must pass either a function or Deferred object')
  
  this.then = $then(deferred)
  if (fn) fn($resolver(deferred), $rejecter(deferred))
  
}


Promise.prototype.fail = function(onRejected){
  return this.then(null, onRejected)
}
