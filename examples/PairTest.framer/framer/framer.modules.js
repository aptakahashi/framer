require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"Pair":[function(require,module,exports){

/*

	Pair module

	See readme.md

	— Ian Bellomy, 2016
 */
var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

exports.Pair = (function(superClass) {
  var _anchor, _collisionListeners, _contained, _dSquared, _dragAndDropEnabled, _dragging, _floater, _hoveredNode, _previousDraggability, _previousPointerEvents, _rangeListeners, _tempListener, _tempRange, _validDragTarget;

  extend(Pair, superClass);

  Pair.draggedItems = [];

  _floater = {};

  _anchor = {};

  _dragAndDropEnabled = false;

  _hoveredNode = void 0;

  _dragging = false;

  _validDragTarget = false;

  _previousPointerEvents = "auto";

  _previousDraggability = false;

  _rangeListeners = [];

  _collisionListeners = [];

  _tempRange = void 0;

  _dSquared = 0;

  _contained = false;

  _tempListener = {};

  function Pair(floater, anchor) {
    this.loopListener = bind(this.loopListener, this);
    if (!(floater instanceof Framer.Layer)) {
      print("ERROR - Pair module:Pair:constructor,  first argument must be a Layer.");
      return;
    }
    if (!(anchor instanceof Framer.Layer)) {
      print("ERROR - Pair module:Pair:constructor,  second argument must be a Layer.");
      return;
    }
    if (floater.parent !== anchor.parent) {
      print("ERROR - Pair module:Pair:constructor,  first and second arguments must have the same parent.");
      return;
    }
    _dSquared = this.getDistanceSquared();
    _floater = floater;
    _anchor = anchor;
    this.wake();
    this.dragStartHandler = (function(_this) {
      return function(event, layer) {
        _validDragTarget = false;
        _previousPointerEvents = _floater.style.pointerEvents;
        _dragging = true;
        Pair.draggedItems.push(_floater);
        _floater.visible = false;
        _hoveredNode = document.elementFromPoint(event.clientX, event.clientY);
        _floater.visible = true;
        return _this.emit("dragStart", _floater);
      };
    })(this);
    this.dragHandler = (function(_this) {
      return function(event) {
        var nodeUnderneath;
        _floater.visible = false;
        nodeUnderneath = document.elementFromPoint(event.clientX, event.clientY);
        _floater.visible = true;
        if (nodeUnderneath !== _this._hoveredNode) {
          if (_anchor._element === nodeUnderneath) {
            _this._validDragTarget = true;
            _this._hoveredNode = nodeUnderneath;
            return _this.emit("dragEnter", _floater, _anchor);
          } else if (_this._hoveredNode === _anchor._element) {
            _this._validDragTarget = false;
            _this._hoveredNode = nodeUnderneath;
            return _this.emit("dragLeave", _floater, _anchor);
          }
        } else if (_this._validDragTarget) {
          return _this.emit("dragOver", _floater, _anchor);
        }
      };
    })(this);
    this.dragEndHandler = (function(_this) {
      return function(event, layer) {
        var index;
        _this._dragging = false;
        index = Pair.draggedItems.indexOf(_floater);
        Pair.draggedItems.splice(index, 1);
        if (_this._validDragTarget) {
          _this.emit("drop", _floater, _anchor);
          return _this._validDragTarget = false;
        } else {
          return _this.emit("invalidDrop", _floater);
        }
      };
    })(this);
    this.anchorMouseOver = (function(_this) {
      return function(event, layer) {
        if (_this._dragging) {
          if (Pair.draggedItems.indexOf(_floater !== -1)) {
            _this._validDragTarget = true;
            return _this.emit("dragEnter", _floater, _anchor);
          }
        }
      };
    })(this);
    this.anchorMouseOut = (function(_this) {
      return function(event, layer) {
        if (_this._dragging) {
          if (Pair.draggedItems.indexOf(_floater !== -1)) {
            _this._validDragTarget = false;
            return _this.emit("dragLeave", _floater, _anchor);
          }
        }
      };
    })(this);
  }

  Pair.prototype.loopListener = function() {
    var i, j, k, len, len1, len2, results, results1;
    _dSquared = this.getDistanceSquared();
    for (i = 0, len = _rangeListeners.length; i < len; i++) {
      _tempRange = _rangeListeners[i];
      _contained = (_tempRange.minSquared <= _dSquared && _dSquared <= _tempRange.maxSquared);
      if (_contained && !_tempRange.entered) {
        _tempRange.entered = true;
        _tempRange.enterCallback.apply(this);
      } else if (!_contained && _tempRange.entered) {
        _tempRange.entered = false;
        _tempRange.exitCallback.apply(this);
      }
    }
    if (this.hitTest()) {
      results = [];
      for (j = 0, len1 = _collisionListeners.length; j < len1; j++) {
        _tempListener = _collisionListeners[j];
        results.push(_tempListener.contact++ || _tempListener.contactStart(_anchor, _floater));
      }
      return results;
    } else {
      results1 = [];
      for (k = 0, len2 = _collisionListeners.length; k < len2; k++) {
        _tempListener = _collisionListeners[k];
        if (_tempListener.contact) {
          _tempListener.contact = false;
          results1.push(_tempListener.contactEnd(_anchor, _floater));
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    }
  };

  Pair.prototype.getDistance = function() {
    return Math.sqrt(Math.pow(_floater.midX - _anchor.midX, 2) + Math.pow(_floater.midY - _anchor.midY, 2));
  };

  Pair.prototype.getDistanceSquared = function() {
    return Math.pow(_floater.midX - _anchor.midX, 2) + Math.pow(_floater.midY - _anchor.midY, 2);
  };

  Pair.prototype.setDistance = function(newDistance) {
    var distanceDiffRatio, newXOffset, newYOffset, oldXOffset, oldYOffset;
    distanceDiffRatio = newDistance / Math.sqrt(_dSquared);
    oldXOffset = _floater.midX - _anchor.midX;
    newXOffset = oldXOffset * distanceDiffRatio;
    _floater.midX = _anchor.midX + newXOffset;
    oldYOffset = _floater.midY - _anchor.midY;
    newYOffset = oldYOffset * distanceDiffRatio;
    return _floater.midY = _anchor.midY + newYOffset;
  };

  Pair.prototype.midpoint = function() {
    return [(_anchor.midX + _floater.midX) / 2.0, (_anchor.midY + _floater.midY) / 2.0];
  };

  Pair.prototype.hitTest = function() {
    var r1, r2;
    r1 = _anchor;
    r2 = _floater;
    return !(r2.x > r1.x + r1.width || r2.x + r2.width < r1.x || r2.y > r1.y + r1.height || r2.y + r2.height < r1.y);
  };

  Pair.prototype.enableDragAndDrop = function() {
    this._dragAndDropEnabled = true;
    this._previousDraggability = _floater.draggable;
    _floater.draggable = true;
    this._hoveredNode = void 0;
    _floater.on(Events.DragStart, this.dragStartHandler);
    _floater.on(Events.DragMove, this.dragHandler);
    _floater.on(Events.DragEnd, this.dragEndHandler);
    _anchor.on(Events.MouseOver, this.anchorMouseOver);
    return _anchor.on(Events.MouseOut, this.anchorMouseOut);
  };

  Pair.prototype.disableDragAndDrop = function() {
    this._dragging = false;
    this._dragAndDropEnabled = false;
    _floater.draggable = this._previousDraggability;
    print(this._previousDraggability);
    _floater.off(Events.DragStart, this.dragStartHandler);
    _floater.off(Events.DragMove, this.dragHandler);
    _floater.off(Events.DragEnd, this.dragEndHandler);
    _anchor.off(Events.MouseOver, this.anchorMouseOver);
    return _anchor.off(Events.MouseOut, this.anchorMouseOut);
  };

  Pair.prototype.sleep = function() {
    return Framer.Loop.off("update", this.loopListener);
  };

  Pair.prototype.wake = function() {
    return Framer.Loop.on("update", this.loopListener);
  };

  Pair.prototype.destroy = function() {
    this.disableDragAndDrop();
    return this.sleep();
  };

  Pair.prototype.onRangeChange = function(min, max, enterFn, exitFn) {
    var count;
    if (exitFn == null) {
      exitFn = function() {};
    }
    count = _rangeListeners.push({
      min: min,
      max: max,
      minSquared: Math.pow(min, 2),
      maxSquared: Math.pow(max, 2),
      enterCallback: enterFn,
      exitCallback: exitFn,
      entered: false
    });
    return count - 1;
  };

  Pair.prototype.offRangeChange = function(index) {
    if (!(index instanceof Number)) {
      print("ERROR - Pair:offRangeChange(index), index must be a Number");
      return;
    }
    return _rangeListeners[index] = null;
  };

  Pair.prototype.onContactChange = function(startFn, endFn) {
    var count;
    if (endFn == null) {
      endFn = function() {};
    }
    count = (_collisionListeners.push({
      contactStart: startFn,
      contactEnd: endFn,
      contact: false
    })) - 1;
    return count;
  };

  Pair.prototype.offContactChange = function(index) {
    if (!(index instanceof Number)) {
      print("ERROR - Pair:offContactChange(index), index must be a Number");
      return;
    }
    return _collisionListeners[index] = null;
  };

  Pair.prototype.onDragStart = function(fn) {
    return this.on("dragStart", fn);
  };

  Pair.prototype.onDragEnter = function(fn) {
    return this.on("dragEnter", fn);
  };

  Pair.prototype.onDragOver = function(fn) {
    return this.on("dragOver", fn);
  };

  Pair.prototype.onDragLeave = function(fn) {
    return this.on("dragLeave", fn);
  };

  Pair.prototype.onInvalidDrop = function(fn) {
    return this.on("invalidDrop", fn);
  };

  Pair.prototype.onDrop = function(fn) {
    return this.on("drop", fn);
  };

  return Pair;

})(Framer.EventEmitter);


/* 

	Convenience function for making multiple pairs.
 */

exports.makePairs = function(float, anchors) {
  var anchor, i, len, p, pairs;
  pairs = [];
  for (i = 0, len = anchors.length; i < len; i++) {
    anchor = anchors[i];
    p = new Pair(float, anchor);
  }
  return pairs;
};


/* 

TODO:

	Cursor issue: Text carrot while dragging... 
		not resolvable

	Animating distance?
 */


},{}]},{},[])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaWFuYmVsbG9teS9HaXRIdWIvUGFpci9leGFtcGxlcy9QYWlyVGVzdC5mcmFtZXIvbW9kdWxlcy9QYWlyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTs7Ozs7Ozs7QUFBQSxJQUFBOzs7O0FBVU0sT0FBTyxDQUFDO0FBSWIsTUFBQTs7OztFQUFBLElBQUMsQ0FBQSxZQUFELEdBQWM7O0VBR2QsUUFBQSxHQUFjOztFQUNkLE9BQUEsR0FBYzs7RUFDZCxtQkFBQSxHQUF1Qjs7RUFDdkIsWUFBQSxHQUFrQjs7RUFDbEIsU0FBQSxHQUFnQjs7RUFDaEIsZ0JBQUEsR0FBcUI7O0VBQ3JCLHNCQUFBLEdBQTBCOztFQUMxQixxQkFBQSxHQUF5Qjs7RUFDekIsZUFBQSxHQUFvQjs7RUFDcEIsbUJBQUEsR0FBdUI7O0VBQ3ZCLFVBQUEsR0FBaUI7O0VBQ2pCLFNBQUEsR0FBZ0I7O0VBQ2hCLFVBQUEsR0FBaUI7O0VBQ2pCLGFBQUEsR0FBbUI7O0VBRU4sY0FBQyxPQUFELEVBQVUsTUFBVjs7SUFFWixJQUFHLENBQUMsQ0FBQyxPQUFBLFlBQW1CLE1BQU0sQ0FBQyxLQUEzQixDQUFKO01BQ0MsS0FBQSxDQUFNLHdFQUFOO0FBQ0EsYUFGRDs7SUFJQSxJQUFHLENBQUMsQ0FBQyxNQUFBLFlBQWtCLE1BQU0sQ0FBQyxLQUExQixDQUFKO01BQ0MsS0FBQSxDQUFNLHlFQUFOO0FBQ0EsYUFGRDs7SUFJQSxJQUFHLE9BQU8sQ0FBQyxNQUFSLEtBQWtCLE1BQU0sQ0FBQyxNQUE1QjtNQUNDLEtBQUEsQ0FBTSw4RkFBTjtBQUNBLGFBRkQ7O0lBSUEsU0FBQSxHQUFZLElBQUMsQ0FBQSxrQkFBRCxDQUFBO0lBRVosUUFBQSxHQUFXO0lBQ1gsT0FBQSxHQUFVO0lBRVYsSUFBQyxDQUFBLElBQUQsQ0FBQTtJQUtBLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixDQUFBLFNB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O0FBa1JsQzs7Ozs7QUFNQSxPQUFPLENBQUMsU0FBUixHQUFvQixTQUFDLEtBQUQsRUFBTyxPQUFQO0FBQ25CLE1BQUE7RUFBQSxLQUFBLEdBQVE7QUFDUixPQUFBLHlDQUFBOztJQUNDLENBQUEsR0FBUSxJQUFBLElBQUEsQ0FBSyxLQUFMLEVBQVksTUFBWjtBQURUO0FBR0EsU0FBTztBQUxZOzs7QUFRcEIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIyMjXG5cblx0UGFpciBtb2R1bGVcblxuXHRTZWUgcmVhZG1lLm1kXG5cblx04oCUIElhbiBCZWxsb215LCAyMDE2XG5cdFxuIyMjXG5cbmNsYXNzIGV4cG9ydHMuUGFpciBleHRlbmRzIEZyYW1lci5FdmVudEVtaXR0ZXJcblxuXHQjIHN0YXRlIHByb3BlcnRpZXNcblxuXHRAZHJhZ2dlZEl0ZW1zOltdXHRcdFxuXG5cdCMgcHJpdmF0ZSBwcm9wZXJ0aWVzXG5cdF9mbG9hdGVyXHRcdFx0XHQ9IHt9XG5cdF9hbmNob3JcdFx0XHRcdFx0PSB7fVxuXHRfZHJhZ0FuZERyb3BFbmFibGVkIFx0PSBmYWxzZVxuXHRfaG92ZXJlZE5vZGUgXHRcdFx0PSB1bmRlZmluZWRcblx0X2RyYWdnaW5nIFx0XHRcdFx0PSBmYWxzZVxuXHRfdmFsaWREcmFnVGFyZ2V0IFx0XHQ9IGZhbHNlXG5cdF9wcmV2aW91c1BvaW50ZXJFdmVudHMgXHQ9IFwiYXV0b1wiXG5cdF9wcmV2aW91c0RyYWdnYWJpbGl0eSBcdD0gZmFsc2Vcblx0X3JhbmdlTGlzdGVuZXJzIFx0XHQ9IFtdXHRcdFxuXHRfY29sbGlzaW9uTGlzdGVuZXJzIFx0PSBbXVx0XG5cdF90ZW1wUmFuZ2UgXHRcdFx0XHQ9IHVuZGVmaW5lZFxuXHRfZFNxdWFyZWQgXHRcdFx0XHQ9IDBcblx0X2NvbnRhaW5lZCBcdFx0XHRcdD0gZmFsc2Vcblx0X3RlbXBMaXN0ZW5lciBcdFx0XHQ9IHt9XG5cblx0Y29uc3RydWN0b3I6IChmbG9hdGVyLCBhbmNob3IpIC0+XHRcdFxuXG5cdFx0aWYgIShmbG9hdGVyIGluc3RhbmNlb2YgRnJhbWVyLkxheWVyKVxuXHRcdFx0cHJpbnQgXCJFUlJPUiAtIFBhaXIgbW9kdWxlOlBhaXI6Y29uc3RydWN0b3IsICBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIGEgTGF5ZXIuXCJcblx0XHRcdHJldHVyblxuXG5cdFx0aWYgIShhbmNob3IgaW5zdGFuY2VvZiBGcmFtZXIuTGF5ZXIpXG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpciBtb2R1bGU6UGFpcjpjb25zdHJ1Y3RvciwgIHNlY29uZCBhcmd1bWVudCBtdXN0IGJlIGEgTGF5ZXIuXCJcblx0XHRcdHJldHVyblxuXG5cdFx0aWYgZmxvYXRlci5wYXJlbnQgIT0gYW5jaG9yLnBhcmVudFxuXHRcdFx0cHJpbnQgXCJFUlJPUiAtIFBhaXIgbW9kdWxlOlBhaXI6Y29uc3RydWN0b3IsICBmaXJzdCBhbmQgc2Vjb25kIGFyZ3VtZW50cyBtdXN0IGhhdmUgdGhlIHNhbWUgcGFyZW50LlwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdF9kU3F1YXJlZCA9IEBnZXREaXN0YW5jZVNxdWFyZWQoKVx0XHRcblxuXHRcdF9mbG9hdGVyID0gZmxvYXRlclxuXHRcdF9hbmNob3JcdD0gYW5jaG9yXG5cblx0XHRAd2FrZSgpXG5cblx0XHQjIFRoZXNlIHByaXZhdGUgbWV0aG9kcyB3aWxsIGJlIGV2ZW50IGhhbmRsZXJzIGF0dGFjaGVkIHRvIHRoZSBmbG9hdGVyIGFuZCBhbmNob3IgbGF5ZXJzLlxuXHRcdCMgVGhleSBzaG91bGQgc3RheSBzY29wZWQgdG8gdGhlIFBhaXIgaW5zdGFuY2Ugd2hlbiBjYWxsZWQuIFxuXG5cdFx0QGRyYWdTdGFydEhhbmRsZXIgPSAoZXZlbnQsbGF5ZXIpID0+XHRcdFx0XG5cdFx0XHRfdmFsaWREcmFnVGFyZ2V0ID0gZmFsc2Vcblx0XHRcdF9wcmV2aW91c1BvaW50ZXJFdmVudHMgPSBfZmxvYXRlci5zdHlsZS5wb2ludGVyRXZlbnRzXG5cdFx0XHRfZHJhZ2dpbmcgPSB0cnVlXG5cdFx0XHRQYWlyLmRyYWdnZWRJdGVtcy5wdXNoIF9mbG9hdGVyXG5cdFx0XHQjIF9mbG9hdGVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIlxuXHRcdFx0X2Zsb2F0ZXIudmlzaWJsZSA9IGZhbHNlXG5cdFx0XHRfaG92ZXJlZE5vZGUgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpXG5cdFx0XHRfZmxvYXRlci52aXNpYmxlID0gdHJ1ZVxuXHRcdFx0QGVtaXQgXCJkcmFnU3RhcnRcIiwgX2Zsb2F0ZXJcblxuXHRcdEBkcmFnSGFuZGxlciA9IChldmVudCkgPT5cdFx0XHRcblx0XHRcdF9mbG9hdGVyLnZpc2libGUgPSBmYWxzZVxuXHRcdFx0bm9kZVVuZGVybmVhdGggPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpXG5cdFx0XHRfZmxvYXRlci52aXNpYmxlID0gdHJ1ZVxuXHRcdFx0aWYgbm9kZVVuZGVybmVhdGggIT0gQF9ob3ZlcmVkTm9kZSAjIHRvdWNoZWQgc29tZXRoaW5nIG5ldy4uLlx0XHRcdFx0XG5cdFx0XHRcdGlmIF9hbmNob3IuX2VsZW1lbnQgPT0gbm9kZVVuZGVybmVhdGggIyB0b3VjaGVkIGFuY2hvcj9cblx0XHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IHRydWVcdFx0XHRcdFx0XG5cdFx0XHRcdFx0QF9ob3ZlcmVkTm9kZSA9IG5vZGVVbmRlcm5lYXRoXG5cdFx0XHRcdFx0QGVtaXQgXCJkcmFnRW50ZXJcIiwgX2Zsb2F0ZXIsIF9hbmNob3Jcblx0XHRcdFx0ZWxzZSBpZiBAX2hvdmVyZWROb2RlID09IF9hbmNob3IuX2VsZW1lbnQgI2xlZnQgYW5jaG9yP1xuXHRcdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gZmFsc2VcdFx0XHRcdFxuXHRcdFx0XHRcdEBfaG92ZXJlZE5vZGUgPSBub2RlVW5kZXJuZWF0aFxuXHRcdFx0XHRcdEBlbWl0IFwiZHJhZ0xlYXZlXCIsIF9mbG9hdGVyLCBfYW5jaG9yXG5cdFx0XHRlbHNlIGlmIEBfdmFsaWREcmFnVGFyZ2V0XG5cdFx0XHRcdEBlbWl0IFwiZHJhZ092ZXJcIiwgX2Zsb2F0ZXIsIF9hbmNob3JcblxuXHRcdEBkcmFnRW5kSGFuZGxlciA9IChldmVudCwgbGF5ZXIpID0+XG5cdFx0XHRAX2RyYWdnaW5nID0gZmFsc2Vcblx0XHRcdCMgX2Zsb2F0ZXIuc3R5bGUucG9pbnRlckV2ZW50cyA9IEBfcHJldmlvdXNQb2ludGVyRXZlbnRzXG5cdFx0XHRpbmRleCA9IFBhaXIuZHJhZ2dlZEl0ZW1zLmluZGV4T2YgX2Zsb2F0ZXJcblx0XHRcdFBhaXIuZHJhZ2dlZEl0ZW1zLnNwbGljZShpbmRleCwxKVxuXHRcdFx0aWYgQF92YWxpZERyYWdUYXJnZXRcdFx0XHRcdFxuXHRcdFx0XHRAZW1pdCBcImRyb3BcIiwgX2Zsb2F0ZXIsIF9hbmNob3Jcblx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVxuXHRcdFx0ZWxzZVx0XHRcdFxuXHRcdFx0XHRAZW1pdCBcImludmFsaWREcm9wXCIsIF9mbG9hdGVyXG5cblx0XHRAYW5jaG9yTW91c2VPdmVyID0gKGV2ZW50LGxheWVyKT0+XG5cdFx0XHRpZiBAX2RyYWdnaW5nICBcblx0XHRcdFx0aWYgUGFpci5kcmFnZ2VkSXRlbXMuaW5kZXhPZiBfZmxvYXRlciBpc250IC0xXG5cdFx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSB0cnVlXG5cdFx0XHRcdFx0QGVtaXQgXCJkcmFnRW50ZXJcIiwgX2Zsb2F0ZXIsIF9hbmNob3JcblxuXHRcdEBhbmNob3JNb3VzZU91dCA9IChldmVudCxsYXllcik9PlxuXHRcdFx0aWYgQF9kcmFnZ2luZyBcblx0XHRcdFx0aWYgUGFpci5kcmFnZ2VkSXRlbXMuaW5kZXhPZiBfZmxvYXRlciBpc250IC0xXG5cdFx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVxuXHRcdFx0XHRcdEBlbWl0IFwiZHJhZ0xlYXZlXCIsIF9mbG9hdGVyLCBfYW5jaG9yXG5cdFx0XG5cdFx0I2VuZCBwcml2YXRlIG1ldGhvZHNcblxuXG5cdCNzaG91bGQgbXVsdGlwbGUgUGFpcnMgYmUgaGFuZGxlZCBpbiB0aGUgc2FtZSBsaXN0ZW5lcj9cblx0bG9vcExpc3RlbmVyOiA9PlxuXHRcdF9kU3F1YXJlZCA9IEBnZXREaXN0YW5jZVNxdWFyZWQoKVxuXHRcdGZvciBfdGVtcFJhbmdlIGluIF9yYW5nZUxpc3RlbmVycyAgXG5cdFx0XHRfY29udGFpbmVkID0gX3RlbXBSYW5nZS5taW5TcXVhcmVkIDw9IF9kU3F1YXJlZCA8PSBfdGVtcFJhbmdlLm1heFNxdWFyZWQgXG5cdFx0XHRpZiBfY29udGFpbmVkIGFuZCBub3QgX3RlbXBSYW5nZS5lbnRlcmVkIFxuXHRcdFx0XHRfdGVtcFJhbmdlLmVudGVyZWQgPSB0cnVlXG5cdFx0XHRcdF90ZW1wUmFuZ2UuZW50ZXJDYWxsYmFjay5hcHBseSBAXG5cdFx0XHRcdFxuXHRcdFx0ZWxzZSBpZiBub3QgX2NvbnRhaW5lZCBhbmQgX3RlbXBSYW5nZS5lbnRlcmVkXG5cdFx0XHRcdF90ZW1wUmFuZ2UuZW50ZXJlZCA9IGZhbHNlXG5cdFx0XHRcdF90ZW1wUmFuZ2UuZXhpdENhbGxiYWNrLmFwcGx5IEBcdFx0XHRcblxuXHRcdGlmIEBoaXRUZXN0KClcblx0XHRcdGZvciBfdGVtcExpc3RlbmVyIGluIF9jb2xsaXNpb25MaXN0ZW5lcnNcblx0XHRcdFx0X3RlbXBMaXN0ZW5lci5jb250YWN0KysgfHwgX3RlbXBMaXN0ZW5lci5jb250YWN0U3RhcnQoX2FuY2hvcixfZmxvYXRlcilcblx0XHRcdFx0XG5cdFx0ZWxzZVxuXHRcdFx0Zm9yIF90ZW1wTGlzdGVuZXIgaW4gX2NvbGxpc2lvbkxpc3RlbmVyc1xuXHRcdFx0XHRpZihfdGVtcExpc3RlbmVyLmNvbnRhY3QpXG5cdFx0XHRcdFx0X3RlbXBMaXN0ZW5lci5jb250YWN0ID0gZmFsc2Vcblx0XHRcdFx0XHRfdGVtcExpc3RlbmVyLmNvbnRhY3RFbmQoX2FuY2hvcixfZmxvYXRlcilcblxuXG5cdFx0XHRcblxuXG5cdFxuXHRnZXREaXN0YW5jZTogLT5cblx0XHRyZXR1cm4gTWF0aC5zcXJ0KChfZmxvYXRlci5taWRYLV9hbmNob3IubWlkWCkqKjIgKyAoX2Zsb2F0ZXIubWlkWS1fYW5jaG9yLm1pZFkpKioyKVxuXHRcblx0Z2V0RGlzdGFuY2VTcXVhcmVkOiAtPlxuXHRcdHJldHVybiAoX2Zsb2F0ZXIubWlkWC1fYW5jaG9yLm1pZFgpKioyICsgKF9mbG9hdGVyLm1pZFktX2FuY2hvci5taWRZKSoqMlxuXHRcblx0c2V0RGlzdGFuY2U6KG5ld0Rpc3RhbmNlKS0+XG5cdFx0ZGlzdGFuY2VEaWZmUmF0aW8gPSBuZXdEaXN0YW5jZS8gTWF0aC5zcXJ0KF9kU3F1YXJlZClcblxuXHRcdG9sZFhPZmZzZXQgPSBfZmxvYXRlci5taWRYIC0gX2FuY2hvci5taWRYXG5cdFx0bmV3WE9mZnNldCA9IG9sZFhPZmZzZXQgKiBkaXN0YW5jZURpZmZSYXRpb1xuXHRcdF9mbG9hdGVyLm1pZFggPSBfYW5jaG9yLm1pZFggKyBuZXdYT2Zmc2V0XG5cblx0XHRvbGRZT2Zmc2V0ID0gX2Zsb2F0ZXIubWlkWSAtIF9hbmNob3IubWlkWVxuXHRcdG5ld1lPZmZzZXQgPSBvbGRZT2Zmc2V0ICogZGlzdGFuY2VEaWZmUmF0aW9cblx0XHRfZmxvYXRlci5taWRZID0gX2FuY2hvci5taWRZICsgbmV3WU9mZnNldFxuXG5cdFx0IyBnZXQgeCx5IGNvbXBvbmVudHNcblx0XHQjIGNhbGN1bGF0ZSBvZmZzZXRcblxuXHRcblx0IyB0aGUgY28tb3JkaW5hdGVzIGJldHdlZW4gdGhlIGFuY2hvciBhbmQgZmxvYXRlclxuXHQjIEZJWE1FISEgSW4gd2hhdCBzcGFjZT8gQXNzdW1pbmcgdGhleSBoYXZlIHRoZSBzYW1lIHBhcmVudCFcdFxuXHRtaWRwb2ludDogLT5cblx0XHRyZXR1cm4gWyhfYW5jaG9yLm1pZFggKyBfZmxvYXRlci5taWRYKS8yLjAsKF9hbmNob3IubWlkWSArIF9mbG9hdGVyLm1pZFkpLzIuMF1cblx0XG5cdCNyZXR1cm5zIHRydWUgaWYgdGhlIGFuY2hvciBhbmQgZmxvYXRlciBmcmFtZXMgdG91Y2hcdFx0XG5cdGhpdFRlc3Q6LT5cblx0XHRyMSA9IF9hbmNob3Jcblx0XHRyMiA9IF9mbG9hdGVyXG5cdFx0cmV0dXJuIG5vdCggcjIueCA+IHIxLnggKyByMS53aWR0aCBvciByMi54ICsgcjIud2lkdGggPCByMS54IG9yIHIyLnkgPiByMS55ICsgcjEuaGVpZ2h0IG9yIHIyLnkgKyByMi5oZWlnaHQgPCByMS55KTtcblxuXG5cdCMgd2hhdCBoYXBwZW5zIHdoZW4gdGhlcmUgYXJlIG90aGVyIGJ1dHRvbnM/XG5cdCMgdGhlIGN1cnNvciBzaG91bGQgcmVhbGx5IGJlIGNhcHR1cmVkIHNvbWVob3cuXG5cdCMgKGluc2VydCBhIGJsb2NraW5nIGxheWVyIGJlbG93IHRoZSBfZmxvYXRlcj8pXG5cdCMgZG9uJ3QgdXNlIHRoZSBvcmlnaW5hbCBlbGVtZW50IC8gY2xvbmUgdGhlIGZsb2F0ZXIgYW5kIHBhc3MgdGhhdD9cblx0IyBob3cgdG8gZ2V0IHJpZCBvZiB0aGF0IHN0dXBpZCB0ZXh0IGN1cnNvciE/IVx0XG5cblx0ZW5hYmxlRHJhZ0FuZERyb3A6LT5cblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCA9IHRydWVcblx0XHRAX3ByZXZpb3VzRHJhZ2dhYmlsaXR5ID0gX2Zsb2F0ZXIuZHJhZ2dhYmxlXG5cdFx0X2Zsb2F0ZXIuZHJhZ2dhYmxlID0gdHJ1ZVxuXHRcdCMgX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yID0gXCItd2Via2l0LWdyYWJcIlxuXHRcdEBfaG92ZXJlZE5vZGUgPSB1bmRlZmluZWRcblxuXHRcdF9mbG9hdGVyLm9uIEV2ZW50cy5EcmFnU3RhcnQsIEBkcmFnU3RhcnRIYW5kbGVyXG5cdFx0X2Zsb2F0ZXIub24gRXZlbnRzLkRyYWdNb3ZlLCBAZHJhZ0hhbmRsZXJcblx0XHRfZmxvYXRlci5vbiBFdmVudHMuRHJhZ0VuZCwgQGRyYWdFbmRIYW5kbGVyXHRcdFxuXHRcdF9hbmNob3Iub24gRXZlbnRzLk1vdXNlT3ZlciwgQGFuY2hvck1vdXNlT3ZlclxuXHRcdF9hbmNob3Iub24gRXZlbnRzLk1vdXNlT3V0LCBAYW5jaG9yTW91c2VPdXRcblxuXG5cdGRpc2FibGVEcmFnQW5kRHJvcDotPlx0XG5cdFx0QF9kcmFnZ2luZyA9IGZhbHNlXHRcblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCA9IGZhbHNlXG5cdFx0X2Zsb2F0ZXIuZHJhZ2dhYmxlID0gQF9wcmV2aW91c0RyYWdnYWJpbGl0eVxuXG5cdFx0cHJpbnQgQF9wcmV2aW91c0RyYWdnYWJpbGl0eVxuXG5cdFx0X2Zsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnU3RhcnQsIEBkcmFnU3RhcnRIYW5kbGVyXG5cdFx0X2Zsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnTW92ZSwgQGRyYWdIYW5kbGVyXG5cdFx0X2Zsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnRW5kLCBAZHJhZ0VuZEhhbmRsZXJcdFx0XG5cdFx0X2FuY2hvci5vZmYgRXZlbnRzLk1vdXNlT3ZlciwgQGFuY2hvck1vdXNlT3ZlclxuXHRcdF9hbmNob3Iub2ZmIEV2ZW50cy5Nb3VzZU91dCwgQGFuY2hvck1vdXNlT3V0XG5cblx0c2xlZXA6LT5cblx0XHRGcmFtZXIuTG9vcC5vZmYgXCJ1cGRhdGVcIiwgQGxvb3BMaXN0ZW5lclxuXHRcdCMgZGlzYWJsZSBkcmFnIGFuZCBkcm9wLCByZW1lbWJlciB3aGF0IHRoZSBzdGF0ZSB3YXNcblxuXHR3YWtlOi0+XG5cdFx0RnJhbWVyLkxvb3Aub24gXCJ1cGRhdGVcIiwgQGxvb3BMaXN0ZW5lclxuXHRcdCMgdXBkYXRlIGNvbnRhY3QgcHJvcGVydGllcyBvZiBsaXN0ZW5lcnM/XG5cdFx0IyBlbmFibGVkIGRyYWcgYW5kIGRyb3AgaWYgdGhpcyB3YXMgYWN0aXZlIGJlZm9yZVxuXG5cdGRlc3Ryb3k6LT5cblx0XHRAZGlzYWJsZURyYWdBbmREcm9wKClcblx0XHRAc2xlZXAoKVxuXHRcdCMgdGhhdCdzIGl0ISBJIHRoaW5rLi4uXG5cblxuXHQjXG5cdCNcdEV2ZW50IEhhbmRsZXIgXG5cdCNcblxuXHQjcmV0dXJucyBhbiBpbmRleFxuXHRvblJhbmdlQ2hhbmdlOiAobWluLG1heCxlbnRlckZuLGV4aXRGbiA9IC0+KSAtPlxuXHRcdGNvdW50ID0gX3JhbmdlTGlzdGVuZXJzLnB1c2hcblx0XHRcdG1pbjptaW5cblx0XHRcdG1heDptYXhcblx0XHRcdG1pblNxdWFyZWQ6IG1pbioqMlxuXHRcdFx0bWF4U3F1YXJlZDogbWF4KioyXG5cdFx0XHRlbnRlckNhbGxiYWNrOiBlbnRlckZuXG5cdFx0XHRleGl0Q2FsbGJhY2s6IGV4aXRGblxuXHRcdFx0ZW50ZXJlZDpmYWxzZVxuXHRcdFxuXHRcdHJldHVybiBjb3VudCAtIDFcblxuXG5cdG9mZlJhbmdlQ2hhbmdlOiAoaW5kZXgpIC0+XG5cdFx0aWYgIShpbmRleCBpbnN0YW5jZW9mIE51bWJlcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyOm9mZlJhbmdlQ2hhbmdlKGluZGV4KSwgaW5kZXggbXVzdCBiZSBhIE51bWJlclwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdF9yYW5nZUxpc3RlbmVyc1tpbmRleF0gPSBudWxsXG5cblxuXHQjIFJldHVybnMgaW5kZXhcblx0b25Db250YWN0Q2hhbmdlOiAoc3RhcnRGbixlbmRGbj0tPikgLT5cblx0XHRjb3VudCA9IChfY29sbGlzaW9uTGlzdGVuZXJzLnB1c2ggXG5cdFx0XHRjb250YWN0U3RhcnQ6c3RhcnRGblxuXHRcdFx0Y29udGFjdEVuZDplbmRGblxuXHRcdFx0Y29udGFjdDpmYWxzZSkgLSAxXHRcblxuXHRcdHJldHVybiBjb3VudFxuXG5cblx0b2ZmQ29udGFjdENoYW5nZTogKGluZGV4KSAtPlxuXHRcdGlmICEoaW5kZXggaW5zdGFuY2VvZiBOdW1iZXIpXG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpcjpvZmZDb250YWN0Q2hhbmdlKGluZGV4KSwgaW5kZXggbXVzdCBiZSBhIE51bWJlclwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdF9jb2xsaXNpb25MaXN0ZW5lcnNbaW5kZXhdID0gbnVsbCBcdFxuXG5cdCNcdFxuXHQjXHRFdmVudCBoYW5kbGluZyBjb252ZW5pZW5jZSBmdW5jdGlvbnNcblx0I1xuXG5cdG9uRHJhZ1N0YXJ0OiAoZm4pLT5cblx0XHRAb24gXCJkcmFnU3RhcnRcIiwgZm5cblxuXHRvbkRyYWdFbnRlcjogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ0VudGVyXCIsIGZuXG5cblx0b25EcmFnT3ZlcjogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ092ZXJcIiwgZm5cblxuXHRvbkRyYWdMZWF2ZTogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ0xlYXZlXCIsIGZuXG5cblx0b25JbnZhbGlkRHJvcDogKGZuKS0+XG5cdFx0QG9uIFwiaW52YWxpZERyb3BcIiwgZm5cblxuXHRvbkRyb3A6IChmbiktPlxuXHRcdEBvbiBcImRyb3BcIiwgZm5cblxuXG4jIyMgXG5cblx0Q29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIG1ha2luZyBtdWx0aXBsZSBwYWlycy4gXG5cdFxuIyMjIFxuXG5leHBvcnRzLm1ha2VQYWlycyA9IChmbG9hdCxhbmNob3JzKS0+XG5cdHBhaXJzID0gW11cblx0Zm9yIGFuY2hvciBpbiBhbmNob3JzXG5cdFx0cCA9IG5ldyBQYWlyIGZsb2F0LCBhbmNob3JcblxuXHRyZXR1cm4gcGFpcnNcblxuXG4jIyMgXG5cblRPRE86XG5cblx0Q3Vyc29yIGlzc3VlOiBUZXh0IGNhcnJvdCB3aGlsZSBkcmFnZ2luZy4uLiBcblx0XHRub3QgcmVzb2x2YWJsZVxuXG5cdEFuaW1hdGluZyBkaXN0YW5jZT9cblxuIyMjIl19