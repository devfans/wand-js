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
      ctx: this.panel ? this.panel.ctx : null
    });
    this.buttons[button.name] = button
  }

  init(panel) {
    this.resize(panel);
    if (!this.close_btn) {
      this.close_btn = this._close_btn();
    };
    this.register(this.close_btn);
    Object.values(this.buttons).forEach(button => this.register(button));
  }

  _close_btn() {
    const touchpress = () => {
      this.panel.deregister(this.name);
    };
    return new OneShotButton('close', {
      x: 0.94,
      y: 0.1,
      r: 0.055,
      mouse: 0,
      mouseArea: true,
      touchpress,
      render: function () {
        const ctx = this.panel.ctx;
        ctx.strokeStyle = this.id ? '#00ffff': '#00aaaa';
        ctx.lineWidth = 2;
        ctx.shadowBlur = this.id ? 15 : 8;
        ctx.shadowColor = '#00ffff'
        // ctx.beginPath();
        // ctx.arc(this.x, this.y, this.r,
        //    this._s_0 = (this._s_0 || 0) + (this.id ? 0.1 : 0.05), this._s_0 + 5.05);
        // ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r + 4,
            this._s_1 = (this._s_1 || 0) + (this.id ? 0.16 : 0.08), this._s_1 + 3.8);
        ctx.stroke();

        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        ctx.font = '18px sans-serif'
        ctx.fillStyle = this.id ? "#00ffff" : "#00aaaa"
        ctx.fillText("X", this.x, this.y)

      }
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
    const ctx = this.panel.ctx;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
        
    // this.panel.ctx.StrokeRect(this.x, this.y, this.w, this.h);
    ctx.roundRectWithTitle(0.8 * this.w, this.x, this.y, this.w, this.h, 10, 10)
    ctx.stroke();
    ctx.fillStyle = '#000000a0';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 0;
    ctx.fill();

    ctx.fillStyle = '#00ffff';
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.font = '12px sans-serif'
    ctx.fillText(this.name, this.x + this.w /2, this.y)
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

    Object.values(this.buttons).forEach(h => h.resize({
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      ctx: panel.ctx
    }));
  }

  on(x, y) {
    return x >= this.x && x <= this.X && y >= this.y && y <= this.Y
  }

}

module.exports = {
  Popout
}
