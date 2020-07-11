'use strict'

const { Rect, OneShotButton } = require('./input');


class Popout {
  constructor (name, options = {}) {
    this.name = name
    this.mouse = options.mouse
    this.mouseArea = !!options.mouseArea

    this._x = options.x || 0
    this._y = options.y || 0

    this._w = options.w || 0
    this._h = options.h || 0
    this._X = this._x + this._w
    this._Y = this._y + this._h
    this.start = {}
    this.state = {}

    this.buttons = {};

    this.resize = (options.resize || this._resize).bind(this);
    const render = (options.render || this._render).bind(this);
    this.render = () => {
      render();
      Object.values(this.buttons).forEach(button=>button.render())
    };

    this.close_btn = options.close_btn
  }

  register(button) {
    button.init({
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      ctx: this.panel.ctx
    });
    this.buttons[button.name] = button
  }

  init(panel) {
    this.resize(panel);
    if (!this.close_btn) {
      this.close_btn = this._close_btn();
    };
    this.register(this.close_btn);
  }

  _close_btn() {
    const touchpress = () => {
      this.panel.deregister(this.name);
    };
    return new OneShotButton('close', {
      x: 0.1,
      y: 0.1,
      r: 0.05,
      mouse: 0,
      mouseArea: true,
      touchpress
    });
  }

  deregister(name) {
    delete this.buttons[name]
  }

  mousedown(e) {
    Object.values(this.buttons).forEach(button=>button.mousedown(e));
    return this.on(e.clientX, e.clientY);
  }

  mousemove(e) {
    Object.values(this.buttons).forEach(button=>button.mousemove(e))
  }

  mouseup(e) {
    Object.values(this.buttons).forEach(button=>button.mouseup(e))
  }

  touchstart(e) {
    Object.values(this.buttons).forEach(button=>button.touchstart(e));
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (this.on(touch.pageX, touch.pageY)) return true;
    }
    return false;
  }

  touchmove(e) {
    Object.values(this.buttons).forEach(button=>button.touchmove(e))
  }

  touchend(e) {
    Object.values(this.buttons).forEach(button=>button.touchend(e))
  }

  _render() {
    this.panel.ctx.fillStyle = "#00ffff40"
    this.panel.ctx.fillRect(this.x, this.y, this.w, this.h);
  }

  _resize(panel) {
    this.panel = panel
    const rect = new Rect([this.panel.x, this.panel.y, this.panel.w, this.panel.h])
    this.x = rect.cast_x(this._x)
    this.y = rect.cast_y(this._y)
    this.w = rect.cast_w(this._w)
    this.h = rect.cast_h(this._h)
    this.X = this.x + this.w
    this.Y = this.y + this.h
  }

  on(x, y) {
    return x >= this.x && x <= this.X && y >= this.y && y <= this.Y
  }

}

module.exports = {
  Popout
}
