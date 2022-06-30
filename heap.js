(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Heap"] = factory();
	else
		root["Heap"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

var _require = __webpack_require__(1),
    isArrayLike = _require.isArrayLike,
    sift_down = _require.sift_down,
    sift_up = _require.sift_up,
    defaultCmp = _require.defaultCmp,
    swap = _require.swap;

var Arr = Array.prototype;

/**
* Creates a new Heap according to the arguments passed
* @constructor
* @param {(Object|Heap|Function)} other
* Can be an Array like Object of which all elements will be added to the Heap,
* another heap instance or just a custom comparator function.
* @param {Function} comparator
* If other is an Array like Object or another heap the custom comparator
* can always be passed as as second argument.
* @returns {Heap} The new heap instance
*/
var Heap = function Heap(other, comparator) {
  if (!(this instanceof Heap)) {
    return new Heap(other, comparator);
  }

  this._cmp = defaultCmp;
  this._data = [];

  if (other instanceof Heap) {
    this._cmp = other._cmp;
    this._data = Arr.slice.call(other._data, 0);
  } else if (isArrayLike(other)) {
    this._data = Arr.slice.call(other, 0);

    if (typeof comparator === "function") {
      this._cmp = comparator;
    }

    Heap.heapify(this._data, this._cmp);
  } else if (typeof other === "function") {
    this._cmp = other;
  }
};

/**
* Modifies an Array like Object in place such that it satisfies the heap property
* @param {Object} arr An Array like Object
* @param {Function} cmp An optional comparator function
* @returns {Object} The original Array like Object
*/
Heap.heapify = function (arr) {
  var cmp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultCmp;

  if (!isArrayLike(arr)) {
    throw new Error("argument to heapify must be array like object");
  }

  if (typeof cmp !== "function") {
    throw new Error("custom comparator must be a function");
  }

  var len = arr.length;
  var idx = len;

  while (idx-- !== 0) {
    sift_down(arr, idx, len, cmp);
  }

  return arr;
};

/**
* Merges two heaps into a new heap.
* @param {Heap} h1 The first heap
* @param {Heap} h2 The second heap
* @param {Function} comparator A custom comparator function
* @returns {Heap} The new merged heap
*/
Heap.merge = function (h1, h2, comparator) {
  if (h1 instanceof Heap && h2 instanceof Heap) {
    var merged_data = Arr.concat.call(h1._data, h2._data);

    return new Heap(merged_data, comparator);
  } else {
    throw new Error("expected arguments to be heaps");
  }
};

/**
* Returns the first element in the heap
* @returns {*} The first element in the heap
*/
Heap.prototype.peek = function () {
  if (!this.isEmpty()) {
    return this._data[0];
  }
};

/**
* Pushes a new element onto the heap
* @param {*} el The new element to be pushed
* @returns {this} The heap instance
*/
Heap.prototype.push = function (el) {
  Arr.push.call(this._data, el);

  sift_up(this._data, this._data.length - 1, this._cmp);

  return this;
};

/**
* Pops the first element from the heap
* @returns {*} The first element from the heap
*/
Heap.prototype.pop = function () {
  swap(this._data, 0, this._data.length - 1);
  var elm = Arr.pop.call(this._data);

  sift_down(this._data, 0, this._data.length, this._cmp);

  return elm;
};

/**
* Returns an array representation of the heap
* @returns {Array} The array representation of the heap
*/
Heap.prototype.toArray = function () {
  return Arr.slice.call(this._data, 0);
};

/**
* Returns the number of elements in the heap
* @returns {number} The size of the heap
*/
Heap.prototype.size = function () {
  return this._data.length;
};

/**
* Returns true if the heap is empty
* @returns {boolean} True if heap is empty. False otherwise
*/
Heap.prototype.isEmpty = function () {
  return this.size() === 0;
};

module.exports = Heap;

/***/ }),
/* 1 */
/***/ (function(module, exports) {

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var isArrayLike = function isArrayLike(o) {
  // https://stackoverflow.com/a/24048615
  return Array.isArray(o) || !!o && (typeof o === "undefined" ? "undefined" : _typeof(o)) === "object" && o.hasOwnProperty("length") && typeof o.length === "number" && (o.length === 0 || o.length > 0 && o.length - 1 in o);
};

var swap = function swap(coll, idx_a, idx_b) {
  if (idx_a < 0 || idx_a >= coll.length || idx_b < 0 || idx_b >= coll.length) {
    throw new Error("index out of bounds");
  }

  var temp = coll[idx_a];
  coll[idx_a] = coll[idx_b];
  coll[idx_b] = temp;

  return coll;
};

var defaultCmp = function defaultCmp(a, b) {
  if (typeof a === "number" && typeof b === "number") {
    return a < b ? -1 : a > b ? 1 : 0;
  }

  if (typeof a === "string" && typeof b === "string") {
    var a_code = void 0,
        b_code = void 0;

    for (var i = 0; i < Math.min(a.length, b.length); i++) {
      a_code = a.charCodeAt(i);
      b_code = b.charCodeAt(i);

      if (a_code < b_code) {
        return -1;
      }
      if (a_code > b_code) {
        return 1;
      }
    }

    return a.length < b.length ? -1 : a.length > b.length ? 1 : 0;
  }

  throw new Error("defaultCmp only compares numbers and strings");
};

var sift_down = function sift_down(coll, idx, heap_size, cmp) {
  var lChild = 2 * idx + 1;
  var rChild = lChild + 1;
  var smallerChild = void 0;

  if (rChild >= heap_size) {
    smallerChild = lChild;
  }
  if (lChild >= heap_size) {
    return;
  }

  if (rChild < heap_size) {
    smallerChild = cmp(coll[lChild], coll[rChild]) <= -1 ? lChild : rChild;
  }

  if (cmp(coll[smallerChild], coll[idx]) <= -1) {
    swap(coll, idx, smallerChild);
    sift_down(coll, smallerChild, heap_size, cmp);
  }
};

var sift_up = function sift_up(coll, idx, cmp) {
  if (idx > 0) {
    var parent = Math.floor((idx - 1) / 2);

    if (cmp(coll[idx], coll[parent]) <= -1) {
      swap(coll, idx, parent);
      sift_up(coll, parent, cmp);
    }
  }
};

module.exports = {
  isArrayLike: isArrayLike,
  swap: swap,
  defaultCmp: defaultCmp,
  sift_down: sift_down,
  sift_up: sift_up
};

/***/ })
/******/ ]);
});