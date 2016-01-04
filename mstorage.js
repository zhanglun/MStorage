var MStorage = (function() {

  var _instance;

  function _init() {
    return new Instance();
  }

  var mergeObject = function(obj1, obj2) {
    var obj3 = {};
    for (var attrname in obj1) {
      obj3[attrname] = obj1[attrname];
    }
    for (var attrname in obj2) {
      obj3[attrname] = obj2[attrname];
    }
    return obj3;
  }

  var setItem = function(key, value) {
    value = JSON.stringify(value);
    var prefix = this.prefix || this.db.prefix;
    window.localStorage.setItem(prefix + key, value);
  };

  var removeItem = function(key) {
    var prefix = this.prefix || this.db.prefix;
    window.localStorage.removeItem(prefix + key);
  };

  var clear = function() {
    window.localStorage.clear();
  }

  var util = {
    /**
     * 插入数据
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
     */
    insert: function(obj) {
      var _this = this;
      return new Promise(function(resolve, reject) {
        obj['_id'] = new Date().getTime();
        _this.data.push(obj);
        setItem.call(_this, _this.key, _this.data);
        resolve(obj);
      });
    },

    /**
     * Find
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
     */
    find: function(query) {
      var _this = this;
      var args = arguments;
      var result = [];

      return new Promise(function(resolve, reject) {
        result = JSON.parse(JSON.stringify(_this.data));;
        if (Object.prototype.toString(query) == '[object Object]') {
          for (var key in query) {
            result = result.filter(function(item) {
              if (item[key]) {
                return item[key] == query[key];
              } else {
                return false;
              }
            });
          }
        }
        resolve(result);
      });
    },

    update: function(query, update, options) {
      var _this = this;
      var args = arguments;
      var result = [];
      return new Promise(function(resolve, reject) {
        result = JSON.parse(JSON.stringify(_this.data));;
        for (var key in query) {
          result = result.filter(function(item) {
            if (item[key]) {
              return item[key] == query[key];
            } else {
              return false;
            }
          });
        }
        if (result.length == 0) {
          var item = mergeObject(query, update);
          _this.data.push(item);
          result.push(item);
        } else {

        }
        var len = _this.data.length;
        for (var i = 0; i < len; i++) {
          for (var j = result.length; j >= 0; j--) {
            if (_this.data[i]._id == result[j]._id) {
              _this.data[i] = result[j];
              break;
            }
          }
        }

        setItem.call(_this, _this.key, _this.data);

        resolve(result);
      });
    },

    /**
     * 删除doc
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
     */
    delete: function(obj) {
      var _this = this;
      var args = arguments;
      return new Promise(function(resolve, reject) {
        if (args.length == 0) {
          resolve(_this.data);
          return false;
        }
        if (typeof obj === "object" && (obj !== null)) {
          obj = [obj];
        }
        obj.forEach(function(item) {
          var index = _this.data.indexOf(item);
          index != -1 ? _this.data.splice(index, 1) : '';
        });
        setItem.call(_this, _this.key, _this.data);
        resolve(_this.data);
      });
    },

    remove: function() {
      delete this.db[this.key];
      removeItem.call(this.prefix + this.key);
    }
  };

  var collectionExtender = function() {
    return Object.create(util);
  };

  function Instance() {
    this.collectionMap = {};
    this.nameList = [];
    this.prefix = 'mstorage.';

    var storages = window.localStorage;
    var reg = new RegExp('^' + this.prefix, 'ig');

    for (var key in storages) {
      // 过滤掉不是MStorage 创建的key
      if (reg.test(key)) {
        key = key.replace(this.prefix, '');
        this.nameList.push(key);
        this.collectionMap[key] = storages[this.prefix + key];
        this[key] = collectionExtender();
        this[key].data = JSON.parse(storages[this.prefix + key]);
        this[key].key = key;
        this[key].db = this;
      }
    }
  }

  /**
   * show All collections
   * @return {Array} name of collections
   */
  Instance.prototype.showCollections = function() {
    var _this = this;
    var storages = window.localStorage;
    var result = [];
    var reg = new RegExp('^' + this.prefix, 'ig');
    for (var key in storages) {
      if (reg.test(key)) {
        result.push(key);
      }
    }
    return result;
  };

  /**
   * create collection
   * @param  {[type]} collection [description]
   * @return {[type]}            [description]
   */
  Instance.prototype.create = function(collection) {
    collection = collection ? collection : 'default';
    if (this.collectionMap[collection] !== undefined) {
      console.warn('key named "%s" has already exist...', collection);
      return false;
    }
    this.nameList.push(collection);
    this.collectionMap[collection] = [];
    this[collection] = collectionExtender();
    this[collection].data = [];
    this[collection].key = collection;
    this[collection].db = this;
    setItem.call(this, collection, []);
    return this[collection];
  };

  return {
    init: function() {
      if (!_instance) {
        _instance = _init();
      }
      return _instance;
    }
  }
})();
