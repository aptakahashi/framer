require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"Pair":[function(require,module,exports){

/*

	Pair module

	See readme.md

	— Ian Bellomy, 2017
 */
var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

exports.Pair = (function(superClass) {
  extend(Pair, superClass);

  Pair.draggedItems = [];

  function Pair(_floater, _anchor) {
    this._floater = _floater;
    this._anchor = _anchor;
    this.loopListener = bind(this.loopListener, this);
    if (!(this._floater instanceof Framer.Layer)) {
      print("ERROR - Pair module:Pair:constructor,  first argument must be a Layer.");
      return;
    }
    if (!(this._anchor instanceof Framer.Layer)) {
      print("ERROR - Pair module:Pair:constructor,  second argument must be a Layer.");
      return;
    }
    if (this._floater.parent !== this._anchor.parent) {
      print("ERROR - Pair module:Pair:constructor,  first and second arguments must have the same parent.");
      return;
    }
    this._dragAndDropEnabled = false;
    this._anchorPreviouslyIgnoredEvents = this._anchor.ignoreEvents;
    this._hoveredNode = void 0;
    this._isOverAnchor = false;
    this._dragging = false;
    this._validDragTarget = false;
    this._previousCursor = this._floater.style.cursor;
    this.useHandCursor = true;
    this._previousDraggability = false;
    this._rangeListeners = [];
    this._collisionListeners = [];
    this._tempRange = void 0;
    this._contained = false;
    this._tempListener = {};
    this._px = 0;
    this._py = 0;
    this._dSquared = this.getDistanceSquared();
    this._floatMouseDown = (function(_this) {
      return function(event, layer) {
        _this._pauseEvent(event);
        if (_this.useHandCursor) {
          return _this._floater.style.cursor = "-webkit-grabbing";
        }
      };
    })(this);
    this._floatMouseUp = (function(_this) {
      return function(event, layer) {
        _this._pauseEvent(event);
        if (_this.useHandCursor) {
          return _this._floater.style.cursor = "-webkit-grab";
        }
      };
    })(this);
    this._floatOver = (function(_this) {
      return function(event, layer) {
        return _this._pauseEvent(event);
      };
    })(this);
    this._dragStartHandler = (function(_this) {
      return function(event, layer) {
        _this._pauseEvent(event);
        _this._validDragTarget = false;
        _this._dragging = true;
        Pair.draggedItems.push(_this._floater);
        _this._floater.visible = false;
        _this._hoveredNode = document.elementFromPoint(event.clientX, event.clientY);
        _this._isOverAnchor = _this._anchor._element.contains(_this._hoveredNode);
        _this._floater.visible = true;
        return _this.emit("dragStart", _this._floater);
      };
    })(this);
    this._dragHandler = (function(_this) {
      return function(event) {
        var isNowOverAnchor, nodeUnderneath;
        _this._pauseEvent(event);
        _this._floater.visible = false;
        _this._px = event.clientX;
        _this._py = event.clientY;
        nodeUnderneath = document.elementFromPoint(event.clientX, event.clientY);
        _this._floater.visible = true;
        isNowOverAnchor = _this._anchor._element.contains(nodeUnderneath);
        if (isNowOverAnchor && !_this._isOverAnchor) {
          _this._validDragTarget = true;
          _this._isOverAnchor = true;
          _this._hoveredNode = nodeUnderneath;
          return _this.emit("dragEnter", _this._floater, _this._anchor);
        } else if (!isNowOverAnchor && _this._isOverAnchor) {
          _this._validDragTarget = false;
          _this._hoveredNode = nodeUnderneath;
          _this._isOverAnchor = false;
          return _this.emit("dragLeave", _this._floater, _this._anchor);
        } else if (isNowOverAnchor && _this._isOverAnchor && _this._validDragTarget) {
          return _this.emit("dragOver", _this._floater, _this._anchor);
        }
      };
    })(this);
    this._dragEndHandler = (function(_this) {
      return function(event, layer) {
        var index;
        _this._dragging = false;
        index = Pair.draggedItems.indexOf(_this._floater);
        Pair.draggedItems.splice(index, 1);
        if (_this.useHandCursor) {
          _this._floater.style.cursor = "-webkit-grab";
        }
        if (_this._validDragTarget) {
          _this.emit("drop", _this._floater, _this._anchor);
          _this._validDragTarget = false;
        } else {
          _this.emit("invalidDrop", _this._floater);
        }
        if (_this.hitTest()) {
          return _this.emit("contactDrop", _this._floater, _this._anchor);
        } else {
          return _this.emit("invalidContactDrop", _this._floater);
        }
      };
    })(this);
    this._floatMoveHandler = (function(_this) {
      return function(event, layer) {
        return _this._pauseEvent(event);
      };
    })(this);
    this.wake();
  }

  Pair.prototype._pauseEvent = function(event) {
    event.stopPropagation();
    event.preventDefault();
    event.cancelBubble = true;
    return event.returnValue = false;
  };

  Pair.prototype.loopListener = function() {
    var i, j, k, len, len1, len2, ref, ref1, ref2, ref3, results, results1;
    this._dSquared = this.getDistanceSquared();
    ref = this._rangeListeners;
    for (i = 0, len = ref.length; i < len; i++) {
      this._tempRange = ref[i];
      this._contained = (this._tempRange.minSquared <= (ref1 = this._dSquared) && ref1 <= this._tempRange.maxSquared);
      if (this._contained && !this._tempRange.entered) {
        this._tempRange.entered = true;
        this._tempRange.enterCallback.apply(this);
      } else if (!this._contained && this._tempRange.entered) {
        this._tempRange.entered = false;
        this._tempRange.exitCallback.apply(this);
      }
    }
    if (this.hitTest()) {
      ref2 = this._collisionListeners;
      results = [];
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        this._tempListener = ref2[j];
        results.push(this._tempListener.contact++ || this._tempListener.contactStart(this._floater, this._anchor));
      }
      return results;
    } else {
      ref3 = this._collisionListeners;
      results1 = [];
      for (k = 0, len2 = ref3.length; k < len2; k++) {
        this._tempListener = ref3[k];
        if (this._tempListener.contact) {
          this._tempListener.contact = false;
          results1.push(this._tempListener.contactEnd(this._floater, this._anchor));
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    }
  };

  Pair.prototype.getDistance = function() {
    return Math.sqrt(Math.pow(this._floater.midX - this._anchor.midX, 2) + Math.pow(this._floater.midY - this._anchor.midY, 2));
  };

  Pair.prototype.getDistanceSquared = function() {
    return Math.pow(this._floater.midX - this._anchor.midX, 2) + Math.pow(this._floater.midY - this._anchor.midY, 2);
  };

  Pair.prototype.setDistance = function(newDistance) {
    var distanceDiffRatio, newXOffset, newYOffset, oldXOffset, oldYOffset;
    distanceDiffRatio = newDistance / Math.sqrt(this._dSquared);
    oldXOffset = this._floater.midX - this._anchor.midX;
    newXOffset = oldXOffset * distanceDiffRatio;
    this._floater.midX = this._anchor.midX + newXOffset;
    oldYOffset = this._floater.midY - this._anchor.midY;
    newYOffset = oldYOffset * distanceDiffRatio;
    return this._floater.midY = this._anchor.midY + newYOffset;
  };

  Pair.prototype.midpoint = function() {
    return [(this._anchor.midX + this._floater.midX) / 2.0, (this._anchor.midY + this._floater.midY) / 2.0];
  };

  Pair.prototype.hitTest = function() {
    var r1, r2;
    r1 = this._anchor;
    r2 = this._floater;
    return !(r2.x > r1.x + r1.width || r2.x + r2.width < r1.x || r2.y > r1.y + r1.height || r2.y + r2.height < r1.y);
  };

  Pair.prototype.enableDragAndDrop = function() {
    this._dragAndDropEnabled = true;
    this._previousDraggability = this._floater.draggable.enabled;
    this._floater.draggable.enabled = true;
    this._previousCursor = this._floater.style.cursor;
    if (this.useHandCursor) {
      this._floater.style.cursor = "-webkit-grab";
    }
    this._hoveredNode = void 0;
    this._anchorPreviouslyIgnoredEvents = this._anchor.ignoreEvents;
    this._anchor.ignoreEvents = false;
    this._floater.on(Events.MouseDown, this._floatMouseDown);
    this._floater.on(Events.MouseUp, this._floatMouseUp);
    this._floater.on(Events.MouseMove, this._floatMoveHandler);
    this._floater.on(Events.MouseOver, this._floatOver);
    this._floater.on(Events.DragStart, this._dragStartHandler);
    this._floater.on(Events.DragMove, this._dragHandler);
    return this._floater.on(Events.DragEnd, this._dragEndHandler);
  };

  Pair.prototype.disableDragAndDrop = function() {
    this._dragging = false;
    this._dragAndDropEnabled = false;
    this._floater.draggable.enabled = false;
    if (this.useHandCursor) {
      this._floater.style.cursor = this._previousCursor;
    }
    this._anchor.ignoreEvents = this._anchorPreviouslyIgnoredEvents;
    this._floater.off(Events.MouseDown, this._floatMouseDown);
    this._floater.off(Events.MouseUp, this._floatMouseUp);
    this._floater.off(Events.MouseMove, this._floatMoveHandler);
    this._floater.off(Events.MouseOver, this._floatOver);
    this._floater.off(Events.DragStart, this._dragStartHandler);
    this._floater.off(Events.DragMove, this._dragHandler);
    return this._floater.off(Events.DragEnd, this._dragEndHandler);
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
    count = this._rangeListeners.push({
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
    return this._rangeListeners[index] = null;
  };

  Pair.prototype.onContactChange = function(startFn, endFn) {
    var count;
    if (endFn == null) {
      endFn = function() {};
    }
    count = (this._collisionListeners.push({
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
    return this._collisionListeners[index] = null;
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

  Pair.prototype.onContactDrop = function(fn) {
    return this.on("contactDrop", fn);
  };

  Pair.prototype.onInvalidContactDrop = function(fn) {
    return this.on("invalidContactDrop", fn);
  };

  return Pair;

})(Framer.EventEmitter);


},{}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL2lhbmJlbGxvbXkvR2l0SHViL1BhaXIvZXhhbXBsZXMvMDRfTXVsdGlwbGVQYWlycy5mcmFtZXIvbW9kdWxlcy9QYWlyLmNvZmZlZSIsIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiIyMjXG5cblx0UGFpciBtb2R1bGVcblxuXHRTZWUgcmVhZG1lLm1kXG5cblx04oCUIElhbiBCZWxsb215LCAyMDE3XG5cdFxuIyMjXG5cbmNsYXNzIGV4cG9ydHMuUGFpciBleHRlbmRzIEZyYW1lci5FdmVudEVtaXR0ZXJcblxuXHQjIHN0YXRpYyBwcm9wZXJ0aWVzXG5cblx0QGRyYWdnZWRJdGVtczpbXVx0XHRcdFxuXG5cdGNvbnN0cnVjdG9yOiAoQF9mbG9hdGVyLCBAX2FuY2hvcikgLT5cdFx0XG5cblx0XHQjIHZhbGlkYXRlXG5cdFx0aWYgIShAX2Zsb2F0ZXIgaW5zdGFuY2VvZiBGcmFtZXIuTGF5ZXIpXG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpciBtb2R1bGU6UGFpcjpjb25zdHJ1Y3RvciwgIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBMYXllci5cIlxuXHRcdFx0cmV0dXJuXG5cblx0XHRpZiAhKEBfYW5jaG9yIGluc3RhbmNlb2YgRnJhbWVyLkxheWVyKVxuXHRcdFx0cHJpbnQgXCJFUlJPUiAtIFBhaXIgbW9kdWxlOlBhaXI6Y29uc3RydWN0b3IsICBzZWNvbmQgYXJndW1lbnQgbXVzdCBiZSBhIExheWVyLlwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdGlmIEBfZmxvYXRlci5wYXJlbnQgIT0gQF9hbmNob3IucGFyZW50XG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpciBtb2R1bGU6UGFpcjpjb25zdHJ1Y3RvciwgIGZpcnN0IGFuZCBzZWNvbmQgYXJndW1lbnRzIG11c3QgaGF2ZSB0aGUgc2FtZSBwYXJlbnQuXCJcblx0XHRcdHJldHVyblxuXG5cdFx0IyAncHJpdmF0ZScgcHJvcGVydGllc1x0XHRcblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCBcdCA9IGZhbHNlXG5cdFx0QF9hbmNob3JQcmV2aW91c2x5SWdub3JlZEV2ZW50cyA9IEBfYW5jaG9yLmlnbm9yZUV2ZW50c1xuXHRcdEBfaG92ZXJlZE5vZGUgXHRcdFx0PSB1bmRlZmluZWRcblx0XHRAX2lzT3ZlckFuY2hvclx0XHRcdD0gZmFsc2VcdFx0XHQjIGFyZSB3ZSBvdmVyIHRoaXMgYW5jaG9yXG5cdFx0QF9kcmFnZ2luZyBcdFx0XHRcdD0gZmFsc2Vcblx0XHRAX3ZhbGlkRHJhZ1RhcmdldCBcdFx0PSBmYWxzZVx0XHRcdCMgYXJlIHdlIG92ZXIgYW55IHZhbGlkIGFuY2hvciAvIGRyb3AgdGFyZ2V0XG5cdFx0QF9wcmV2aW91c0N1cnNvciBcdFx0PSBAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yXG5cdFx0QHVzZUhhbmRDdXJzb3JcdFx0XHQ9IHRydWVcblx0XHRAX3ByZXZpb3VzRHJhZ2dhYmlsaXR5IFx0PSBmYWxzZVxuXHRcdEBfcmFuZ2VMaXN0ZW5lcnMgXHRcdD0gW11cdFx0XG5cdFx0QF9jb2xsaXNpb25MaXN0ZW5lcnMgXHQ9IFtdXHRcblx0XHRAX3RlbXBSYW5nZSBcdFx0XHQ9IHVuZGVmaW5lZFxuXHRcdEBfY29udGFpbmVkIFx0XHRcdD0gZmFsc2Vcblx0XHRAX3RlbXBMaXN0ZW5lciBcdFx0XHQ9IHt9XHRcdFxuXHRcdEBfcHhcdFx0XHRcdFx0PSAwXG5cdFx0QF9weSBcdFx0XHRcdFx0PSAwXG5cdFx0QF9kU3F1YXJlZCA9IEBnZXREaXN0YW5jZVNxdWFyZWQoKVxuXHRcdFxuXHRcdCMgV2Ugd2FudCB0aGVzZSBldmVudCBoYW5kbGVyIG1ldGhvZHMgdG8gYmUgc2NvcGVkIHRvIHRoZSBQYWlyIGluc3RhbmNlIHdoZW4gdGhleSBydW4sIHNvIHRoZXkncmUgaGVyZVxuXHRcdEBfZmxvYXRNb3VzZURvd24gPSAoZXZlbnQsbGF5ZXIpPT5cblx0XHRcdEBfcGF1c2VFdmVudChldmVudClcblx0XHRcdGlmIEB1c2VIYW5kQ3Vyc29yIHRoZW4gQF9mbG9hdGVyLnN0eWxlLmN1cnNvciA9IFwiLXdlYmtpdC1ncmFiYmluZ1wiXG5cdFx0XG5cdFx0QF9mbG9hdE1vdXNlVXAgPSAoZXZlbnQsbGF5ZXIpPT5cdFx0XHRcblx0XHRcdEBfcGF1c2VFdmVudChldmVudClcblx0XHRcdGlmIEB1c2VIYW5kQ3Vyc29yIHRoZW4gQF9mbG9hdGVyLnN0eWxlLmN1cnNvciA9IFwiLXdlYmtpdC1ncmFiXCJcblx0XHRcdFxuXHRcdEBfZmxvYXRPdmVyID0gKGV2ZW50LGxheWVyKSA9Plx0XHRcdFxuXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVxuXHRcdFxuXHRcdEBfZHJhZ1N0YXJ0SGFuZGxlcj0gKGV2ZW50LGxheWVyKSA9Plx0XHRcdFxuXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVx0XHRcdFxuXHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVx0XHRcdFxuXHRcdFx0QF9kcmFnZ2luZyA9IHRydWVcblx0XHRcdFBhaXIuZHJhZ2dlZEl0ZW1zLnB1c2ggQF9mbG9hdGVyXG5cdFx0XHQjIEBfZmxvYXRlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gXCJub25lXCJcblx0XHRcdEBfZmxvYXRlci52aXNpYmxlID0gZmFsc2Vcblx0XHRcdEBfaG92ZXJlZE5vZGUgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpXHRcdFx0XG5cdFx0XHRAX2lzT3ZlckFuY2hvciA9IEBfYW5jaG9yLl9lbGVtZW50LmNvbnRhaW5zKEBfaG92ZXJlZE5vZGUpXG5cdFx0XHRAX2Zsb2F0ZXIudmlzaWJsZSA9IHRydWVcblx0XHRcdEBlbWl0IFwiZHJhZ1N0YXJ0XCIsIEBfZmxvYXRlclxuXHRcblx0XHRAX2RyYWdIYW5kbGVyPShldmVudCkgPT5cblx0XHRcdEBfcGF1c2VFdmVudChldmVudClcdFx0XHRcblx0XHRcdEBfZmxvYXRlci52aXNpYmxlID0gZmFsc2Vcblx0XHRcdEBfcHggPSBldmVudC5jbGllbnRYXG5cdFx0XHRAX3B5ID0gZXZlbnQuY2xpZW50WVxuXHRcdFx0bm9kZVVuZGVybmVhdGggPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpXG5cdFx0XHRAX2Zsb2F0ZXIudmlzaWJsZSA9IHRydWVcblx0XHRcdGlzTm93T3ZlckFuY2hvciA9IEBfYW5jaG9yLl9lbGVtZW50LmNvbnRhaW5zKG5vZGVVbmRlcm5lYXRoKVx0XHRcdFxuXHRcdFx0aWYgaXNOb3dPdmVyQW5jaG9yIGFuZCBub3QgQF9pc092ZXJBbmNob3Jcblx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSB0cnVlXHRcdFx0XHRcdFxuXHRcdFx0XHRAX2lzT3ZlckFuY2hvciA9IHRydWVcblx0XHRcdFx0QF9ob3ZlcmVkTm9kZSA9IG5vZGVVbmRlcm5lYXRoXHRcdFx0XHRcblx0XHRcdFx0QGVtaXQgXCJkcmFnRW50ZXJcIiwgQF9mbG9hdGVyLCBAX2FuY2hvclxuXHRcdFx0ZWxzZSBpZiBub3QgaXNOb3dPdmVyQW5jaG9yIGFuZCBAX2lzT3ZlckFuY2hvclxuXHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXHRcdFx0XHRcblx0XHRcdFx0QF9ob3ZlcmVkTm9kZSA9IG5vZGVVbmRlcm5lYXRoXG5cdFx0XHRcdEBfaXNPdmVyQW5jaG9yID0gZmFsc2Vcblx0XHRcdFx0QGVtaXQgXCJkcmFnTGVhdmVcIiwgQF9mbG9hdGVyLCBAX2FuY2hvclxuXHRcdFx0ZWxzZSBpZiBpc05vd092ZXJBbmNob3IgYW5kIEBfaXNPdmVyQW5jaG9yIGFuZCBAX3ZhbGlkRHJhZ1RhcmdldFxuXHRcdFx0XHRAZW1pdCBcImRyYWdPdmVyXCIsIEBfZmxvYXRlciwgQF9hbmNob3Jcblx0XG5cdFx0QF9kcmFnRW5kSGFuZGxlcj0oZXZlbnQsIGxheWVyKSA9PlxuXHRcdFx0QF9kcmFnZ2luZyA9IGZhbHNlXHRcdFx0XG5cdFx0XHRpbmRleCA9IFBhaXIuZHJhZ2dlZEl0ZW1zLmluZGV4T2YgQF9mbG9hdGVyXG5cdFx0XHRQYWlyLmRyYWdnZWRJdGVtcy5zcGxpY2UoaW5kZXgsMSlcblx0XHRcdGlmIEB1c2VIYW5kQ3Vyc29yIHRoZW4gQF9mbG9hdGVyLnN0eWxlLmN1cnNvciA9IFwiLXdlYmtpdC1ncmFiXCJcblx0XHRcdGlmIEBfdmFsaWREcmFnVGFyZ2V0XHRcdFx0XHRcblx0XHRcdFx0QGVtaXQgXCJkcm9wXCIsIEBfZmxvYXRlciwgQF9hbmNob3Jcblx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVxuXHRcdFx0ZWxzZVx0XHRcdFxuXHRcdFx0XHRAZW1pdCBcImludmFsaWREcm9wXCIsIEBfZmxvYXRlclxuXHRcblx0XHRcdGlmIEBoaXRUZXN0KClcblx0XHRcdFx0QGVtaXQgXCJjb250YWN0RHJvcFwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG5cdFx0XHRlbHNlIFxuXHRcdFx0XHRAZW1pdCBcImludmFsaWRDb250YWN0RHJvcFwiLCBAX2Zsb2F0ZXJcblx0XHRcdFx0XG5cdFx0QF9mbG9hdE1vdmVIYW5kbGVyID0gKGV2ZW50LGxheWVyKSA9PlxuXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVxuXHRcdFx0XG4jIFx0XHRAX2FuY2hvck1vdXNlT3Zlcj0oZXZlbnQsbGF5ZXIpPT5cbiMgXHRcdFx0aWYgQF9kcmFnZ2luZyAgXG4jIFx0XHRcdFx0bm9kZVVuZGVybmVhdGggPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpXG4jIFx0XHRcdFx0aWYgUGFpci5kcmFnZ2VkSXRlbXMuaW5kZXhPZiBAX2Zsb2F0ZXIgaXNudCAtMSBhbmQgQF9ob3ZlcmVkTm9kZSAhPSBub2RlVW5kZXJuZWF0aFxuIyBcdFx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSB0cnVlXG4jIFx0XHRcdFx0XHRAX2hvdmVyZWROb2RlID0gbm9kZVVuZGVybmVhdGhcbiMgXHRcdFx0XHRcdHByaW50IFwibmV3IG5vZGU/XCJcbiMgXHRcdFx0XHRcdHByaW50IEBfaG92ZXJlZE5vZGUgPT0gbm9kZVVuZGVybmVhdGhcbiMgXHRcdFx0XHRcdEBlbWl0IFwiZHJhZ0VudGVyXCIsIEBfZmxvYXRlciwgQF9hbmNob3JcbiMgXHRcdFx0XHRcdFxuIyBcdFxuIyBcdFx0QF9hbmNob3JNb3VzZU91dD0oZXZlbnQsbGF5ZXIpPT5cdFx0XG4jIFx0XHRcdEBfcGF1c2VFdmVudChldmVudClcbiMgXHRcdFx0aWYgQF9kcmFnZ2luZyBcbiMgXHRcdFx0XHRpZiBQYWlyLmRyYWdnZWRJdGVtcy5pbmRleE9mIEBfZmxvYXRlciBpc250IC0xXG4jIFx0XHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXG4jIFx0XHRcdFx0XHRAX2hvdmVyZWROb2RlID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKVxuIyBcdFx0XHRcdFx0QGVtaXQgXCJkcmFnTGVhdmVcIiwgQF9mbG9hdGVyLCBAX2FuY2hvclxuXG5cdFx0XG5cdFx0IyByZWFkeSFcblx0XHRAd2FrZSgpXG5cdFx0XG5cdFx0I1xuXHRcdCMgZW5kIGNvbnN0cnVjdG9yXG5cdFx0I1xuXHRcblxuXHRfcGF1c2VFdmVudDooZXZlbnQpLT5cblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblx0XHRldmVudC5jYW5jZWxCdWJibGU9dHJ1ZVxuXHRcdGV2ZW50LnJldHVyblZhbHVlPWZhbHNlXG5cdFx0XG5cdCNzaG91bGQgbXVsdGlwbGUgUGFpcnMgYmUgaGFuZGxlZCBpbiB0aGUgc2FtZSBsaXN0ZW5lcj9cblx0bG9vcExpc3RlbmVyOiA9PlxuXHRcdEBfZFNxdWFyZWQgPSBAZ2V0RGlzdGFuY2VTcXVhcmVkKClcblx0XHRmb3IgQF90ZW1wUmFuZ2UgaW4gQF9yYW5nZUxpc3RlbmVycyAgXG5cdFx0XHRAX2NvbnRhaW5lZCA9IEBfdGVtcFJhbmdlLm1pblNxdWFyZWQgPD0gQF9kU3F1YXJlZCA8PSBAX3RlbXBSYW5nZS5tYXhTcXVhcmVkIFxuXHRcdFx0aWYgQF9jb250YWluZWQgYW5kIG5vdCBAX3RlbXBSYW5nZS5lbnRlcmVkIFxuXHRcdFx0XHRAX3RlbXBSYW5nZS5lbnRlcmVkID0gdHJ1ZVxuXHRcdFx0XHRAX3RlbXBSYW5nZS5lbnRlckNhbGxiYWNrLmFwcGx5IEBcblx0XHRcdFx0XG5cdFx0XHRlbHNlIGlmIG5vdCBAX2NvbnRhaW5lZCBhbmQgQF90ZW1wUmFuZ2UuZW50ZXJlZFxuXHRcdFx0XHRAX3RlbXBSYW5nZS5lbnRlcmVkID0gZmFsc2Vcblx0XHRcdFx0QF90ZW1wUmFuZ2UuZXhpdENhbGxiYWNrLmFwcGx5IEBcdFx0XHRcblxuXHRcdGlmIEBoaXRUZXN0KClcblx0XHRcdGZvciBAX3RlbXBMaXN0ZW5lciBpbiBAX2NvbGxpc2lvbkxpc3RlbmVyc1xuXHRcdFx0XHRAX3RlbXBMaXN0ZW5lci5jb250YWN0KysgfHwgQF90ZW1wTGlzdGVuZXIuY29udGFjdFN0YXJ0KEBfZmxvYXRlcixAX2FuY2hvcilcblx0XHRcdFx0XG5cdFx0ZWxzZVxuXHRcdFx0Zm9yIEBfdGVtcExpc3RlbmVyIGluIEBfY29sbGlzaW9uTGlzdGVuZXJzXG5cdFx0XHRcdGlmKEBfdGVtcExpc3RlbmVyLmNvbnRhY3QpXG5cdFx0XHRcdFx0QF90ZW1wTGlzdGVuZXIuY29udGFjdCA9IGZhbHNlXG5cdFx0XHRcdFx0QF90ZW1wTGlzdGVuZXIuY29udGFjdEVuZChAX2Zsb2F0ZXIsQF9hbmNob3IpXG5cdFx0XG5cdFx0XG5cdFx0IyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoQGxvb3BMaXN0ZW5lcilcblx0XG5cdGdldERpc3RhbmNlOiAtPlxuXHRcdHJldHVybiBNYXRoLnNxcnQoKEBfZmxvYXRlci5taWRYLUBfYW5jaG9yLm1pZFgpKioyICsgKEBfZmxvYXRlci5taWRZLUBfYW5jaG9yLm1pZFkpKioyKVxuXHRcblx0Z2V0RGlzdGFuY2VTcXVhcmVkOiAtPlxuXHRcdHJldHVybiAoQF9mbG9hdGVyLm1pZFgtQF9hbmNob3IubWlkWCkqKjIgKyAoQF9mbG9hdGVyLm1pZFktQF9hbmNob3IubWlkWSkqKjJcblx0XG5cdHNldERpc3RhbmNlOihuZXdEaXN0YW5jZSktPlxuXHRcdGRpc3RhbmNlRGlmZlJhdGlvID0gbmV3RGlzdGFuY2UvIE1hdGguc3FydChAX2RTcXVhcmVkKVxuXG5cdFx0b2xkWE9mZnNldCA9IEBfZmxvYXRlci5taWRYIC0gQF9hbmNob3IubWlkWFxuXHRcdG5ld1hPZmZzZXQgPSBvbGRYT2Zmc2V0ICogZGlzdGFuY2VEaWZmUmF0aW9cblx0XHRAX2Zsb2F0ZXIubWlkWCA9IEBfYW5jaG9yLm1pZFggKyBuZXdYT2Zmc2V0XG5cblx0XHRvbGRZT2Zmc2V0ID0gQF9mbG9hdGVyLm1pZFkgLSBAX2FuY2hvci5taWRZXG5cdFx0bmV3WU9mZnNldCA9IG9sZFlPZmZzZXQgKiBkaXN0YW5jZURpZmZSYXRpb1xuXHRcdEBfZmxvYXRlci5taWRZID0gQF9hbmNob3IubWlkWSArIG5ld1lPZmZzZXRcblxuXHRcblx0IyB0aGUgY28tb3JkaW5hdGVzIGJldHdlZW4gdGhlIGFuY2hvciBhbmQgZmxvYXRlclxuXHRtaWRwb2ludDogLT5cblx0XHRyZXR1cm4gWyhAX2FuY2hvci5taWRYICsgQF9mbG9hdGVyLm1pZFgpLzIuMCwoQF9hbmNob3IubWlkWSArIEBfZmxvYXRlci5taWRZKS8yLjBdXG5cdFxuXHQjcmV0dXJucyB0cnVlIGlmIHRoZSBhbmNob3IgYW5kIGZsb2F0ZXIgZnJhbWVzIHRvdWNoXHRcdFxuXHRoaXRUZXN0Oi0+XG5cdFx0cjEgPSBAX2FuY2hvclxuXHRcdHIyID0gQF9mbG9hdGVyXG5cdFx0cmV0dXJuICEoIHIyLnggPiByMS54ICsgcjEud2lkdGggb3IgcjIueCArIHIyLndpZHRoIDwgcjEueCBvciByMi55ID4gcjEueSArIHIxLmhlaWdodCBvciByMi55ICsgcjIuaGVpZ2h0IDwgcjEueSlcblxuXHRlbmFibGVEcmFnQW5kRHJvcDotPlx0XHRcblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCA9IHRydWVcdFx0XG5cdFx0QF9wcmV2aW91c0RyYWdnYWJpbGl0eSA9IEBfZmxvYXRlci5kcmFnZ2FibGUuZW5hYmxlZCAjIEZJWE1FOiBCdWcgaW4gZnJhbWVyIG1ha2VzIHRoaXMgcmV0dXJuIHRydWUgaWYgYWNjZXNzZWQhXG5cdFx0QF9mbG9hdGVyLmRyYWdnYWJsZS5lbmFibGVkID0gdHJ1ZVxuXHRcdEBfcHJldmlvdXNDdXJzb3IgPSBAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yXG5cdFx0aWYgQHVzZUhhbmRDdXJzb3IgdGhlbiBAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yID0gXCItd2Via2l0LWdyYWJcIlxuXHRcdEBfaG92ZXJlZE5vZGUgPSB1bmRlZmluZWRcblx0XHRAX2FuY2hvclByZXZpb3VzbHlJZ25vcmVkRXZlbnRzID0gQF9hbmNob3IuaWdub3JlRXZlbnRzXG5cdFx0QF9hbmNob3IuaWdub3JlRXZlbnRzID0gZmFsc2Vcblx0XHRcblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLk1vdXNlRG93biwgQF9mbG9hdE1vdXNlRG93blxuXHRcdEBfZmxvYXRlci5vbiBFdmVudHMuTW91c2VVcCwgQF9mbG9hdE1vdXNlVXBcblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLk1vdXNlTW92ZSwgQF9mbG9hdE1vdmVIYW5kbGVyXHRcdFxuXHRcdEBfZmxvYXRlci5vbiBFdmVudHMuTW91c2VPdmVyLCBAX2Zsb2F0T3Zlclx0XG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5EcmFnU3RhcnQsIEBfZHJhZ1N0YXJ0SGFuZGxlclxuXHRcdEBfZmxvYXRlci5vbiBFdmVudHMuRHJhZ01vdmUsIEBfZHJhZ0hhbmRsZXJcblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLkRyYWdFbmQsIEBfZHJhZ0VuZEhhbmRsZXJcdFx0XG5cblx0ZGlzYWJsZURyYWdBbmREcm9wOi0+XHRcblx0XHRAX2RyYWdnaW5nID0gZmFsc2VcdFxuXHRcdEBfZHJhZ0FuZERyb3BFbmFibGVkID0gZmFsc2VcdFx0XG5cdFx0QF9mbG9hdGVyLmRyYWdnYWJsZS5lbmFibGVkID0gZmFsc2UgIyBAX3ByZXZpb3VzRHJhZ2dhYmlsaXR5ICMgRG9lc24ndCB3b3JrIGJlY2F1c2UgYnVnIGluIGZyYW1lclxuXHRcdGlmIEB1c2VIYW5kQ3Vyc29yIHRoZW4gQF9mbG9hdGVyLnN0eWxlLmN1cnNvciA9IEBfcHJldmlvdXNDdXJzb3Jcblx0XHRAX2FuY2hvci5pZ25vcmVFdmVudHMgPSBAX2FuY2hvclByZXZpb3VzbHlJZ25vcmVkRXZlbnRzXG5cblx0XHRAX2Zsb2F0ZXIub2ZmIEV2ZW50cy5Nb3VzZURvd24sIEBfZmxvYXRNb3VzZURvd25cblx0XHRAX2Zsb2F0ZXIub2ZmIEV2ZW50cy5Nb3VzZVVwLCBAX2Zsb2F0TW91c2VVcFxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLk1vdXNlTW92ZSwgQF9mbG9hdE1vdmVIYW5kbGVyXG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuTW91c2VPdmVyLCBAX2Zsb2F0T3Zlclx0XG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuRHJhZ1N0YXJ0LCBAX2RyYWdTdGFydEhhbmRsZXJcblx0XHRAX2Zsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnTW92ZSwgQF9kcmFnSGFuZGxlclxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLkRyYWdFbmQsIEBfZHJhZ0VuZEhhbmRsZXJcdFx0XG5cdFx0XG5cblx0c2xlZXA6LT5cblx0XHRGcmFtZXIuTG9vcC5vZmYgXCJ1cGRhdGVcIiwgQGxvb3BMaXN0ZW5lclxuXHRcdCMgZGlzYWJsZSBkcmFnIGFuZCBkcm9wLCByZW1lbWJlciB3aGF0IHRoZSBzdGF0ZSB3YXNcblxuXHR3YWtlOi0+XG5cdFx0IyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoQGxvb3BMaXN0ZW5lcilcblxuXHRcdEZyYW1lci5Mb29wLm9uIFwidXBkYXRlXCIsIEBsb29wTGlzdGVuZXJcblxuXHRcdCMgdXBkYXRlIGNvbnRhY3QgcHJvcGVydGllcyBvZiBsaXN0ZW5lcnM/XG5cdFx0IyBlbmFibGVkIGRyYWcgYW5kIGRyb3AgaWYgdGhpcyB3YXMgYWN0aXZlIGJlZm9yZVxuXG5cdGRlc3Ryb3k6LT5cblx0XHRAZGlzYWJsZURyYWdBbmREcm9wKClcblx0XHRAc2xlZXAoKVxuXHRcdCMgdGhhdCdzIGl0ISBJIHRoaW5rLi4uXG5cblxuXHQjXG5cdCNcdEV2ZW50IEhhbmRsaW5nXG5cdCNcblxuXHQjcmV0dXJucyBhbiBpbmRleFxuXHRvblJhbmdlQ2hhbmdlOiAobWluLG1heCxlbnRlckZuLGV4aXRGbiA9IC0+KSAtPlxuXHRcdGNvdW50ID0gQF9yYW5nZUxpc3RlbmVycy5wdXNoXG5cdFx0XHRtaW46bWluXG5cdFx0XHRtYXg6bWF4XG5cdFx0XHRtaW5TcXVhcmVkOiBtaW4qKjJcblx0XHRcdG1heFNxdWFyZWQ6IG1heCoqMlxuXHRcdFx0ZW50ZXJDYWxsYmFjazogZW50ZXJGblxuXHRcdFx0ZXhpdENhbGxiYWNrOiBleGl0Rm5cblx0XHRcdGVudGVyZWQ6ZmFsc2Vcblx0XHRcblx0XHRyZXR1cm4gY291bnQgLSAxXG5cblxuXHRvZmZSYW5nZUNoYW5nZTogKGluZGV4KSAtPlxuXHRcdGlmICEoaW5kZXggaW5zdGFuY2VvZiBOdW1iZXIpXG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpcjpvZmZSYW5nZUNoYW5nZShpbmRleCksIGluZGV4IG11c3QgYmUgYSBOdW1iZXJcIlxuXHRcdFx0cmV0dXJuXG5cblx0XHRAX3JhbmdlTGlzdGVuZXJzW2luZGV4XSA9IG51bGxcblxuXG5cdCMgUmV0dXJucyBpbmRleFxuXHRvbkNvbnRhY3RDaGFuZ2U6IChzdGFydEZuLGVuZEZuPS0+KSAtPlx0XHRcblx0XHRjb3VudCA9IChAX2NvbGxpc2lvbkxpc3RlbmVycy5wdXNoIFxuXHRcdFx0Y29udGFjdFN0YXJ0OnN0YXJ0Rm5cblx0XHRcdGNvbnRhY3RFbmQ6ZW5kRm5cblx0XHRcdGNvbnRhY3Q6ZmFsc2UpIC0gMVx0XG5cblx0XHRyZXR1cm4gY291bnRcblxuXG5cdG9mZkNvbnRhY3RDaGFuZ2U6IChpbmRleCkgLT5cblx0XHRpZiAhKGluZGV4IGluc3RhbmNlb2YgTnVtYmVyKVxuXHRcdFx0cHJpbnQgXCJFUlJPUiAtIFBhaXI6b2ZmQ29udGFjdENoYW5nZShpbmRleCksIGluZGV4IG11c3QgYmUgYSBOdW1iZXJcIlxuXHRcdFx0cmV0dXJuXG5cblx0XHRAX2NvbGxpc2lvbkxpc3RlbmVyc1tpbmRleF0gPSBudWxsIFx0XG5cblx0I1x0XG5cdCNcdEV2ZW50IGhhbmRsaW5nIGNvbnZlbmllbmNlIGZ1bmN0aW9uc1xuXHQjXG5cblx0b25EcmFnU3RhcnQ6IChmbiktPlxuXHRcdEBvbiBcImRyYWdTdGFydFwiLCBmblxuXG5cdG9uRHJhZ0VudGVyOiAoZm4pLT5cblx0XHRAb24gXCJkcmFnRW50ZXJcIiwgZm5cblxuXHRvbkRyYWdPdmVyOiAoZm4pLT5cblx0XHRAb24gXCJkcmFnT3ZlclwiLCBmblxuXG5cdG9uRHJhZ0xlYXZlOiAoZm4pLT5cblx0XHRAb24gXCJkcmFnTGVhdmVcIiwgZm5cblxuXHRvbkludmFsaWREcm9wOiAoZm4pLT5cblx0XHRAb24gXCJpbnZhbGlkRHJvcFwiLCBmblxuXG5cdG9uRHJvcDogKGZuKS0+XG5cdFx0QG9uIFwiZHJvcFwiLCBmblxuXG5cdG9uQ29udGFjdERyb3A6IChmbiktPlxuXHRcdEBvbiBcImNvbnRhY3REcm9wXCIsIGZuXG5cblx0b25JbnZhbGlkQ29udGFjdERyb3A6IChmbiktPlxuXHRcdEBvbiBcImludmFsaWRDb250YWN0RHJvcFwiLCBmblxuIiwiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFDQUE7O0FEQUE7Ozs7Ozs7O0FBQUEsSUFBQTs7OztBQVVNLE9BQU8sQ0FBQzs7O0VBSWIsSUFBQyxDQUFBLFlBQUQsR0FBYzs7RUFFRCxjQUFDLFFBQUQsRUFBWSxPQUFaO0lBQUMsSUFBQyxDQUFBLFdBQUQ7SUFBVyxJQUFDLENBQUEsVUFBRDs7SUFHeEIsSUFBRyxDQUFDLENBQUMsSUFBQyxDQUFBLFFBQUQsWUFBcUIsTUFBTSxDQUFDLEtBQTdCLENBQUo7TUFDQyxLQUFBLENBQU0sd0VBQU47QUFDQSxhQUZEOztJQUlBLElBQUcsQ0FBQyxDQUFDLElBQUMsQ0FBQSxPQUFELFlBQW9CLE1BQU0sQ0FBQyxLQUE1QixDQUFKO01BQ0MsS0FBQSxDQUFNLHlFQUFOO0FBQ0EsYUFGRDs7SUFJQSxJQUFHLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBVixLQUFvQixJQUFDLENBQUEsT0FBTyxDQUFDLE1BQWhDO01BQ0MsS0FBQSxDQUFNLDhGQUFOO0FBQ0EsYUFGRDs7SUFLQSxJQUFDLENBQUEsbUJBQUQsR0FBeUI7SUFDekIsSUFBQyxDQUFBLDhCQUFELEdBQWtDLElBQUMsQ0FBQSxPQUFPLENBQUM7SUFDM0MsSUFBQyxDQUFBLFlBQUQsR0FBbUI7SUFDbkIsSUFBQyxDQUFBLGFBQUQsR0FBbUI7SUFDbkIsSUFBQyxDQUFBLFNBQUQsR0FBaUI7SUFDakIsSUFBQyxDQUFBLGdCQUFELEdBQXNCO0lBQ3RCLElBQUMsQ0FBQSxlQUFE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