var stream = require('stream');

exports.fromArray = function (array) {

  if (Array.isArray(array)) {

    var readable = new stream.Readable({ objectMode: true });
    var index = -1;

    readable._read = function () {

      if (array && index < array.length) {

        readable.push(array[++index]);
      }
      else {

        readable.push(null);
      }
    };

    return readable;
  }
  else {

    var transform = new stream.Transform();

    transform._readableState.objectMode = true;
    transform._writableState.objectMode = true;

    transform._transform = function (obj, encoding, next) {

      if (Array.isArray(chunk)) {

        var self = this;

        chunk.forEach(function (item) {

          self.push(item);
        });
      }
      else {

        this.push(chunk);
      }

      next();
    };

    return transform;
  }
};

exports.map = function (iterator) {
  var transform = new stream.Transform();
  transform._readableState.objectMode = true;
  transform._writableState.objectMode = true;
  transform._transform = function (obj, encoding, next) {
    if (!iterator) return next(null, obj);
    if (iterator.length > 1) {
      iterator(obj, next);
    } else {
      next(null, iterator(obj));
    }
  };
  return transform;
};

exports.save = function (iterator, callback) {
  var writable = new stream.Writable({ objectMode: true });
  writable._write = function (obj, encoding, next) {
    try {
      if (iterator.length > 1) {
        iterator(obj, next);
      } else {
        iterator(obj);
        next();
      }
    } catch (err) {
      next(err);
    }
  };
  return writable.once('finish', function () {
    callback && callback();
  }).once('error', function (err) {
    callback && callback(err);
  });
};

exports.toArray = function (callback) {
  var writable = new stream.Writable({ objectMode: true });
  var array = [];
  writable._write = function (obj, encoding, next) {
    array.push(obj);
    next();
  };
  return writable.once('finish', function () {
    callback && callback(null, array);
  }).once('error', function (err) {
    callback && callback(err);
  });
};

exports.collect = function (chunkSize) {

  return new ItemCollector(chunkSize);
};

/**
 *
 */

function ItemCollector (chunkSize) {

  this._buffer = [];
  this._chunkSize = chunkSize;

  stream.Transform.call(this, { objectMode: true });
}

util.inherits(ItemCollector, stream.Transform);

ItemCollector.prototype._transform = function (chunk, encoding, done) {

  var out = [];

  if (this._buffer.length == this._chunkSize) {

    this.push(this._buffer);
    this._buffer = [];
  }

  this._buffer.push(chunk);

  done();
};

ItemCollector.prototype._flush = function () {

  this.push(this._buffer);
};
