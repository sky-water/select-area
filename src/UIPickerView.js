'use strict';

(function(factory) {
  var root = (typeof self == 'object' && self.self == self && self) ||
    (typeof global == 'object' && global.global == global && global);
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory();
  } else if (typeof exports === 'object') {
    exports['UIPickerView'] = factory()
  } else {
    root.UIPickerView = factory();
  };
})(function() {
  //默认常量44 0.003
  var kUP = {
    kUPCELLHEIGHT: 44, //cell高度
    kUPFRICTION: 0.003,
    kUPCONFINE: 16 //中心point
  }
  var fontSizeNumber = function(v, ulwidth) {
    var minFont = 1;
    var maxFont = 14;
    var len = v.value.length;
    var fontSize = maxFont;
    if (len * maxFont > ulwidth) {
      while (true) {
        maxFont--;
        if (len * maxFont < ulwidth) {
          fontSize = Math.round(maxFont);
          break;
        }
      }
    }
    return fontSize;
  }
  var upScrollTo = function(dest, self, runtime) {
    self.upContains.style.webkitTransitionDuration = runtime ? runtime : '100ms';
    upSetPosition(dest ? dest : 0, self);
  }
  var upSetPosition = function(pos, self) {
    self.upContains.slotYPosition = pos;
    self.upContains.style.webkitTransform = 'translate3d(0, ' + pos + 'px, 0)';
  }
  var createElement = function(handler) {
    var constraintsId = this.options.constraintsId;
    //容器元素
    var upWrapper = document.createElement('div');
    upWrapper.id = constraintsId + 'wrapper';
    upWrapper.className = 'UIPickerView-wrapper';

    //内部容器元素
    var upDepth = document.createElement('div');
    upDepth.id = constraintsId + 'deptch';
    upDepth.className = 'UIPickerView-deptch';
    upWrapper.appendChild(upDepth);

    //遮罩元素
    var pickerFrame = document.createElement('div');
    pickerFrame.id = constraintsId + 'Frame';
    pickerFrame.className = 'UIPickerView-frame';

    var emptyDiv = document.createElement('div');
    emptyDiv.className = 'UIPickerView-empty';
    pickerFrame.appendChild(emptyDiv);
    this.contains.appendChild(upWrapper);
    this.contains.appendChild(pickerFrame);

    //遮罩对象
    this.upFrame = document.getElementById(constraintsId + 'Frame');
    //容器元素对象
    this.upWrapper = document.getElementById(constraintsId + 'wrapper');
    //内容容器元素对象
    this.upDepth = document.getElementById(constraintsId + 'deptch');

    //真实列表
    var upUl = document.createElement('ul');
    upUl.id = constraintsId + 'contains';
    upUl.style.webkitTransitionTimingFunction = 'cubic-bezier(0, 0, 0.2, 1)';
    upUl.slotPosition = 0;
    upUl.slotYPosition = 0;
    upUl.slotWidth = 0;
    this.upDepth.appendChild(upUl);

    //真实列表UL对象
    this.upContains = document.getElementById(constraintsId + 'contains');
    this.UPRender(this.options.dataSource);
    this.upFrame.addEventListener('touchstart', handler, false);

  }

  var UIPickerView = function(options) {
    if (!options.dataSource.length) {
      console.warn('数据为空')
      return false;
    };

    if (!options.valueChange || !typeof options.valueChange === 'function') {
      console.warn('必须提供valueChange事件');
      return false;
    };

    this.options = options;
    this.ele = [];
    this.storageAnimationY = 0;
    this.contains = document.getElementById(options.id);
    this.contains.innerHTML = '';
    if (options.kUP) {
      //行高
      if (options.kUP.kUPCELLHEIGHT) {
        kUP.kUPCELLHEIGHT = options.kUP.kUPCELLHEIGHT;
      }
      if (options.kUP.kUPFRICTION) {
        kUP.kUPFRICTION = options.kUP.kUPFRICTION;
      }
    }
    if (kUP.kUPCELLHEIGHT % 2) {
      console.warn('行高的像素定义要求可以与2整除');
      return false;
    }
    kUP.kUPCONFINE = (kUP.kUPCELLHEIGHT / 2) - 7;
    var self = this;
    var upScrollStart = function(e) {
      // console.log('开始移动');
      self.upContains.style.webkitTransitionDuration = '0';
      var theTransform = window.getComputedStyle(self.upContains).webkitTransform;
      if (theTransform) {
        theTransform = new WebKitCSSMatrix(theTransform).m42;
        if (theTransform != self.upContains.slotYPosition) {
          upSetPosition(theTransform, self);
        }
      }
      self.startY = e.targetTouches[0].clientY;
      self.scrollStartY = self.upContains.slotYPosition;
      self.scrollStartTime = e.timeStamp;
      self.upFrame.addEventListener('touchmove', handlerEvent, false);
      self.upFrame.addEventListener('touchend', handlerEvent, false);
    }
    var upScrollMove = function(e) {
      // console.log('移动中');
      var topDelta = e.targetTouches[0].clientY - self.startY;
      if (self.upContains.slotYPosition > 0 || self.upContains.slotYPosition < self.upContains.slotMaxScroll) {
        topDelta /= 2;
      }
      upSetPosition(self.upContains.slotYPosition + topDelta, self);
      self.startY = e.targetTouches[0].clientY;
      if (e.timeStamp - self.scrollStartTime > 80) {
        self.scrollStartY = self.upContains.slotYPosition;
        self.scrollStartTime = e.timeStamp;
      }
    }
    var upScrollEnd = function(e) {
      // console.log('移动结束');
      self.upFrame.removeEventListener('touchmove', handlerEvent, false);
      self.upFrame.removeEventListener('touchend', handlerEvent, false);
      var dataSource = self.options.dataSource;
      //总个数
      var _index = dataSource.length;
      //下标数
      var len = _index - 1;
      if (!self.upContains.slotYPosition) {
        return false;
      }
      if (self.upContains.slotYPosition == len * (-kUP.kUPCELLHEIGHT)) {
        return false;
      }

      //滚动方向超出top边界时
      if (self.upContains.slotYPosition >= 0) {
        upScrollTo(0, self);
        self.options.valueChange(dataSource[0]);
        return false;
      }

      //滚动方向超出bottom边界时
      if (self.upContains.slotYPosition <= len * (-kUP.kUPCELLHEIGHT)) {
        upScrollTo(len * (-kUP.kUPCELLHEIGHT), self);
        self.options.valueChange(dataSource[len]);
        return;
      }

      //动画的Y值
      var slotY = Math.abs(self.upContains.slotYPosition);
      //原始出发数
      var ceilIndex = Math.ceil(slotY / kUP.kUPCELLHEIGHT);
      //原始所需要的Y值
      var ceilY = (ceilIndex * kUP.kUPCELLHEIGHT);
      //原始所需要的边界范围Y值
      var confineY = (ceilIndex - 1) * kUP.kUPCELLHEIGHT + kUP.kUPCONFINE;

      if (slotY > self.storageAnimationY) {
        //方向：-y
        self.storageAnimationY = slotY;
        console.log('往下');
        if (slotY > confineY && slotY < ceilY) { //下一个
          upScrollTo(-ceilY, self);
          self.options.valueChange(dataSource[ceilIndex]);
        } else {
          //回到原来位置
          var animY = kUP.kUPCELLHEIGHT * (ceilIndex - 1);
          upScrollTo(-animY, self);
          self.options.valueChange(dataSource[ceilIndex - 1]);
          //重置缓存动画Y值
          self.storageAnimationY = animY;
        }
      } else {
        //方向：+y
        self.storageAnimationY = slotY;
        console.log('往上');
        if (slotY > confineY && slotY < ceilY) {
          //回到原来位置
          var animY = ceilIndex * kUP.kUPCELLHEIGHT;
          upScrollTo(-animY, self);
          self.options.valueChange(dataSource[ceilIndex]);
          self.storageAnimationY = animY;
        } else {
          //返回上一个
          upScrollTo((-(ceilIndex - 1) * kUP.kUPCELLHEIGHT), self);
          self.options.valueChange(dataSource[ceilIndex - 1]);
        }
      }
      return true;
    }
    var upLockEvent = function(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    var handlerEvent = function(e) {
      if (e.type === 'touchstart') {
        if (e.currentTarget.id === self.options.constraintsId + 'Frame') {
          upScrollStart(e);
        }
      } else if (e.type === 'touchmove') {
        if (e.currentTarget.id === self.options.constraintsId + 'Frame') {
          upScrollMove(e);
        }
      } else if (e.type === 'touchend') {
        if (e.currentTarget.id === self.options.constraintsId + 'Frame') {
          upScrollEnd(e);
        }
      }
      upLockEvent(e);
    }
    createElement.call(this, handlerEvent);
  };

  UIPickerView.prototype.UPRender = function(dataSource) {
    if (Array.isArray(dataSource)) {
      this.options.dataSource = dataSource;
      var html = '';
      var ulw = window.getComputedStyle(this.contains, null).width;
      ulw = ulw.split('px')[0];
      dataSource.forEach(function(v) {
        var fontsize = fontSizeNumber(v, ulw);
        html += '<li style="font-size:' + fontsize + 'px">' + v.value + '</li>';
      });
      this.upContains.innerHTML = html;
      upSetPosition(0, this);
    }
  };

  UIPickerView.prototype.UPSelectRowIndexPath = function(i) {
    if (i && i > 0 && i <= this.options.dataSource.length) {
      upSetPosition(-((i - 1) * kUP.kUPCELLHEIGHT), this);
      this.indexPath = {
        "row": i - 1,
        "section": 0
      }
      return this;
    } else {
      console.warn('i选择必须大于0');
    }
  };

  UIPickerView.prototype.UPThen = function(func) {
    var selectRowData = this.options.dataSource[this.indexPath.row];
    if (func && typeof func === 'function') {
      func(this.indexPath, selectRowData);
    } else {
      this.options.valueChange(selectRowData);
    }
  };

  UIPickerView.createPickerView = function(options, callback) {
    var up = new UIPickerView(options);
    return up;
  };

  return UIPickerView;

});
