
const ButtonEvent = {
  null: 0,
  press: 1,
  down: 2,
  up: 4
}

class Rect {
  constructor (size) {
    this.size = size
  }

  cast(x, y) {
    return [ Math.round(this.size[0] + this.size[2] * x), Math.round(this.size[1] + this.size[3] * y)]
  }

  cast_x(x) {
    return Math.round(this.size[0] + this.size[2] * x);
  }

  cast_y(y) {
    return Math.round(this.size[1] + this.size[3] * y);
  }

  cast_w(w) {
    return Math.round(this.size[2] * w);
  }

  cast_h(h) {
    return Math.round(this.size[3] * h);
  }
}

class Panel {
  constructor (options={}) {
    this.rect = options.rect || this._rect
    this.handlers = []  // For special button handlers to feed in filtered touch events
    this.buttons = {}
    this.ctx = options.ctx

    this._size = options._size
    this.resize(this._size)
    this.state = {}
    this.setup()
  }

  _rect (size) {
    return size || []
  }

  resize (_size) {
    this._size = _size
    const size = this.rect(_size)
    this.x = size[0] || 0
    this.y = size[1] || 0
    this.w = size[2] || 0
    this.h = size[3] || 0

    const panel = {
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      ctx: this.ctx
    };
    
    this.handlers.forEach(h => h.resize(panel));
    Object.values(this.buttons).forEach(h => h.resize(panel));
  }

  setup() {
    window.addEventListener("mousedown", e => {
      this.handlers.forEach(button=>button.mousedown(e))
    })

    window.addEventListener("mousemove", e => {
      this.handlers.forEach(button=>button.mousemove(e))
    })

    window.addEventListener("mouseup", e => {
      this.handlers.forEach(button=>button.mouseup(e))
    })

    window.addEventListener("touchstart", e => {
      // console.log(e)
      Object.values(this.buttons).forEach(button=>button.touchstart(e))
      this.handlers.forEach(button=>button.touchstart(e))
    });
    window.addEventListener("touchmove", e => {
      // console.log(e)
      Object.values(this.buttons).forEach(button=>button.touchmove(e))
      this.handlers.forEach(button=>button.touchmove(e))
    });
    window.addEventListener("touchend", e => {
      // console.log(e)
      Object.values(this.buttons).forEach(button=>button.touchend(e))
      this.handlers.forEach(button=>button.touchend(e))
    });
  }

  keyup(name) {
    if (this.state[name]) return ((this.state[name].status || 0) & ButtonEvent.up) > 0
    return false
  }

  keyon(name) {
    return this.state[name] ? this.state[name].on : false
  }

  keyaxis(neg, pos) {
    const p = this.keyon(pos)? 1 : 0
    const n = this.keyon(neg)? -1 : 0
    return n + p
  }

  keysdir(v1, v2, v4, v8) {
    if (this.keyon(v1)) return 1
    if (this.keyon(v2)) return 2
    if (this.keyon(v4)) return 4
    if (this.keyon(v8)) return 8
    return 0
  }

  keydown(name) {
    return (this.state[name].status || 0) & ButtonEvent.down
  }

  keypress(name) {
    if (this.state[name]) return (this.state[name].status || 0) & ButtonEvent.press > 0
    return false
  }

  // return an vector2 from the button center to the touch point
  keydir(name) {
    return this.state[name]
  }

  keydirx(name) {
    return  this.state[name].x || 0
  }

  keydiry(name) {
    return this.state[name].y || 0
  }
 
  keydirmax(name) {
    const x = this.state[name].x || 0
    const y = this.state[name].y || 0
    if (x && x >= y) return 1
    if (y && y >= x) return 2
    return 0
  }

  tick() {
    Object.keys(this.buttons).forEach(key =>  {
      this.state[key] = this.buttons[key].tick() || {}
    })
    // if (this.state['A'] && this.state['A'].status) console.dir(this.state['A'].status)
  }

  render() {
    this.ctx.strokeStyle = 'blue';
    Object.values(this.buttons).forEach(button=>button.render())
    this.handlers.forEach(button=>button.render())
  }

  registerHandler(handler) {
    handler.init({
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      ctx: this.ctx
    });
    this.handlers.push(handler)
  }

  register(button) {
    button.init({
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      ctx: this.ctx
    })
    this.buttons[button.name] = button
  }
}

// Filter only allow touches with start point fall in the button area which is a rectangle
class ButtonHandler {
  constructor (name, options) {
    this.name = name
    this._x = options.x || 0
    this._y = options.y || 0
    this._w = options.w || 0
    this._h = options.h || 0
    this._X = this._x + this._w
    this._Y = this._y + this._h
    this.mouse = options.mouse
    this.mouseArea = !!options.mouseArea

    this.id = null
    this.start = {}
    this.state = {}
    this.resize = (options.resize || this._resize).bind(this)

    this.ontouchstart = options.touchstart || this._ignore
    this.ontouchmove = options.touchmove || this._ignore
    this.ontouchend = options.touchend || this._ignore
  }

  _ignore(e) {
    console.log("Ignored touch event for ", this.name);
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

  init(panel) {
    this.resize(panel);
    this.render()
  }

  render() {
    this.panel.ctx.strokeStyle = this.id ? 'red' : 'blue';
    this.panel.ctx.beginPath()
    // console.dir({ x: this.x, y: this.y, r: this.r, panel: this.panel, _x: this._x})
    this.panel.ctx.rect(this.x, this.y, this.w, this.h)
    this.panel.ctx.stroke()
  }

  _on(x, y) {
    return x >= this.x && x <= this.X && y >= this.y && y <= this.Y
  }

  mousedown(e) {
    if (e.button == this.mouse) {
      const x = e.clientX;
      const y = e.clientY;
      if (!this.mouseArea || this._on(x, y)) {
        this.start = {x, y}
        this.id = true
        this.ontouchstart(x, y)
      }
    }
  }

  mousemove(e) {
    if (e.button == this.mouse) {
      if (this.id) {
        const y = e.clientY;
        const x = e.clientX;
        this.state = {x, y}
        this.ontouchmove(x, y, this.start.x, this.start.y)
      }
    }
  }

  mouseup(e) {
    if (e.button == this.mouse) {
      if (this.id) {
        const x = e.clientX;
        const y = e.clientY;
        const start = this.start;
        this.start = {}
        this.state = {}
        this.id = false
        this.ontouchend(x, y, start.x, start.y)
      }
    }
  }

  touchstart(e) {
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const id = touch.identifier;
      const x = touch.pageX;
      const y = touch.pageY;
      if (this._on(x, y)) {
        this.id = id;
        this.start = {x, y}
        this.ontouchstart(x, y)
      }
    }
  }

  touchmove(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const id = touch.identifier;
      if (this.id == id) {
        const x = touch.pageX;
        const y = touch.pageY;
        this.state = { x, y }
        this.ontouchmove(x, y, this.start.x, this.start.y);
        break;
      }
    }
  }

  touchend(e) {
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const id = touch.identifier;
      if (this.id == id) {
        this.id = null
        const start = this.start
        this.start = {}
        this.state = {}
        this.ontouchend(touch.pageX, touch.pageY, start.x, start.y);
      }
    }
  }
}

class Button {
  constructor (name, options={}) {
    this.name = name
    this._x = options.x || 0
    this._y = options.y || 0
    this._r = options.r || 0
    this.follow = options.follow || false
    this.overlapping = options.overlapping || 5
    this.r2 = (this._r + this.overlapping) ** 2
    this._ = {
      on: false,
      x: 0,
      y: 0,
      status: 0
    }

    this.resize = (options.resize || this._resize).bind(this)
    this.state = {} // identifier: status // 0, 1: start
  }

  _resize(panel) {
    this.panel = panel
    const rect = new Rect([this.panel.x, this.panel.y, this.panel.w, this.panel.h])
    this.x = rect.cast_x(this._x)
    this.y = rect.cast_y(this._y)
    this.r = rect.cast_w(this._r)
    this.r2 = (this.r + this.overlapping) ** 2
  }

  init(panel) {
    this.resize(panel);
    this.render()
  }

  tick() {
    const state = {
      status: this._.status,
      x: this._.x,
      y: this._.y,
      on: this._.on
    }

    // Clean up
    this._.status = 0
    this._.x = 0
    this._.y = 0
    return state
  }

  render() {
    this.panel.ctx.strokeStyle = this._.on ? 'red' : 'blue';
    this.panel.ctx.beginPath()
    // console.dir({ x: this.x, y: this.y, r: this.r, panel: this.panel, _x: this._x})
    this.panel.ctx.ellipse(this.x, this.y, this.r, this.r, 0, 0, 2 * Math.PI);
    this.panel.ctx.stroke()
  }

  touchstart(e) {
    const state = this.on(e)
    if (e.changedTouches.length > 0) {
      const id = e.changedTouches[0].identifier;
      if (state[id]) state[id].start = true
    }
    this.state = state || {}
  }

  touchmove(e) {
    const state = this.on(e)
    Object.keys(state).forEach(id => {
      // this.state[id] = { x: state[id].x, y: state[id].y }
      if (this.state[id]) {
        this.state[id].x = state[id].x;
        this.state[id].y = state[id].y;
      } else {
        this.state[id] = state[id];
      }
    })
    //TODO: To update touches which have been moved out of button area
  }

  touchend(e) {
    const state = this.on(e)
    if (e.changedTouches.length > 0) {
      const t = e.changedTouches[0];
      const id = t.identifier;
      if (this._on(e.pageX, e.pageY)) {
        this._.status |= ButtonEvent.up
        if (this.state[id] && this.state[id].start) this._.status |= ButtonEvent.press
      }
      delete this.state[id]
    }
  }

  _on(x, y) {
    return ((this.x - x) ** 2 + (this.y - y) ** 2) < this.r2
  }

  on(e) {
    const state = {}
    let touched = false
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i]
      if (this._on(t.pageX, t.pageY)) {
        this._.x = t.pageX - this.x
        this._.y = t.pageY - this.y
        touched = true
        state[t.identifier] = { x: t.pageX, y: t.pageY, start: false }
      }
    }

    this._.on = touched
    if (touched) this._.status |= ButtonEvent.down
    return state
  }
}


module.exports = {
  ButtonEvent, Button, Panel, ButtonHandler
}

