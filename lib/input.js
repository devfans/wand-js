
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
      Object.values(this.buttons).forEach(button=>button.touchstart(e.pageX, e.pageY))
    });
    window.addEventListener("mousemove", e => {
      Object.values(this.buttons).forEach(button=>button.touchmove(e.clientX, e.clientY))
    });
    window.addEventListener("click", e => {
      Object.values(this.buttons).forEach(button=>button.touchend(e.clientX, e.clientY))
    });
  }

  keyup(name) {
    if (this.state[name]) return ((this.state[name].status || 0) & ButtonEvent.up) > 0
    return false
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
    this._ = {
      start: false,
      on: false,

      x: 0,
      y: 0,
      status: 0
    }
  }

  init(panel={}) {
    this.panel = panel
    this.setup()
    this.render()
  }

  setup() {
    this.x = this.panel.x + this._x
    this.y = this.panel.y + this._y
    this.r2 = this.r * this.r
  }

  tick() {
    const state = {
      status: this._.status,
      x: this._.x,
      y: this._.y
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

  touchstart(x, y) {
    this._.start = this.on(x, y)
  }

  touchmove(x, y) {
    this.on(x, y)
  }

  touchend(x, y) {
    if (this.on(x, y)) {
      this._.status |= ButtonEvent.up
      this._.x = x - this.x
      this._.y = y - this.y

      if (this._.start) {
        this._.status |= ButtonEvent.press
      }
    }

    this._.start = false
    this._.on = false
  }

  on(x, y) {
    this._.on = (this.x - x) ** 2 + (this.y - y) ** 2 < this.r2
    if (this._.on)
      this._.status |= ButtonEvent.down
    return this._.on
  }
}


module.exports = {
  ButtonEvent, Button, Panel
}

