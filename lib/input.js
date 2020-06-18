
const ButtonEvent = {
  null: 0,
  press: 1,
  down: 2,
  up: 4
}

class Panel {
  constructor (options={}) {
    this.buttons = {}
    this.ctx = options.ctx
    this.x = options.x || 0
    this.y = options.y || 0
    this.w = options.w || 0
    this.h = options.h || 0
    this.state = {}
    this.setup()
  }

  setup() {
    window.addEventListener("touchstart", e => {
      // console.dir(e, {depth: null})
      Object.values(this.buttons).forEach(button=>button.touchstart(e))
    });
    window.addEventListener("touchmove", e => {
      // console.dir(e, {depth: null})
      Object.values(this.buttons).forEach(button=>button.touchmove(e))
    });
    window.addEventListener("touchend", e => {
      // window.e = e
      // console.dir(e, {depth: null})
      Object.values(this.buttons).forEach(button=>button.touchend(e))
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

class Button {
  constructor (name, options={}) {
    this.name = name
    this._x = options.x || 0
    this._y = options.y || 0
    this.r = options.r || 10
    this.r2 = this.r ** 2
    this.follow = options.follow || false
    this.overlapping = options.overlapping || 5
    this._ = {
      on: false,
      x: 0,
      y: 0,
      status: 0
    }

    this.state = {} // identifier: status // 0, 1: start
  }

  resize(options) {
    this._x = options.x || 0
    this._y = options.y || 0
    this.r = options.r || 10
    this.r2 = this.r ** 2
    this.overlapping = options.overlapping || 5
  }

  init(panel={}) {
    this.panel = panel
    this.setup()
    this.render()
  }

  setup() {
    this.x = this.panel.x + this._x
    this.y = this.panel.y + this._y
    this.r2 = (this.r + this.overlapping) ** 2
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
  ButtonEvent, Button, Panel
}

