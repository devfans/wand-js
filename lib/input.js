/*
 * State:
 *  - on: in area
 *  - active: start and now in area
 *  - out: start in area but out now
 *  - dir: when active
 * 
 * Event:
 *  - start 
 *  - move
 *  - end:  touchend or cancel
 *  - active
 *  - press
 *  - dir: dir change
 *
 * Buttons
 * - Button: Check if any touch in area, output: state(on)
 * - ButtonHandler: Check touchstart in area, output: event(start/move/end)
 * - OneShotButton: Check touchstart and touchstop in area output: state(active) event(active/end/press) | clicks
 * - ActiveButton: Check touchstart in area output: state(active) event(active/end)  | attack
 * - StickButton: Check touchstart(dynamic) in area output: state(dir) event(active/dir/end) | steer, directional attack
 */
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
    this.popout = null

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
    if (this.popout) {
      panel.deregister = this.deregister_popout.bind(this);
      this.popout.resize(panel)
    }
  }

  setup() {
    window.addEventListener("mousedown", e => {
      if (!this.popout || !this.popout.mousedown(e)) {
        Object.values(this.buttons).forEach(button=>button.mousedown(e))
        this.handlers.forEach(button=>button.mousedown(e))
      }
    })

    window.addEventListener("mousemove", e => {
      Object.values(this.buttons).forEach(button=>button.mousemove(e))
      this.handlers.forEach(button=>button.mousemove(e))
      if (this.popout) 
        Object.values(this.popout.buttons).forEach(button=>button.mousemove(e))
    })

    window.addEventListener("mouseup", e => {
      Object.values(this.buttons).forEach(button=>button.mouseup(e))
      this.handlers.forEach(button=>button.mouseup(e))
      if (this.popout) 
        Object.values(this.popout.buttons).forEach(button=>button.mouseup(e))
    })

    window.addEventListener("touchstart", e => {
      if (!this.popout || !this.popout.touchstart(e)) {
        // console.log(e)
        Object.values(this.buttons).forEach(button=>button.touchstart(e))
        this.handlers.forEach(button=>button.touchstart(e))
      }
    });

    window.addEventListener("touchmove", e => {
      // console.log(e)
      Object.values(this.buttons).forEach(button=>button.touchmove(e))
      this.handlers.forEach(button=>button.touchmove(e))
      if (this.popout) 
        Object.values(this.popout.buttons).forEach(button=>button.touchmove(e))
    });
    window.addEventListener("touchend", e => {
      // console.log(e)
      Object.values(this.buttons).forEach(button=>button.touchend(e))
      this.handlers.forEach(button=>button.touchend(e))
      if (this.popout) 
        Object.values(this.popout.buttons).forEach(button=>button.touchend(e))
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
    Object.values(this.buttons).forEach(button=>button.render())
    this.handlers.forEach(button=>button.render())
    if (this.popout) this.popout.render();
  }

  register_popout(popout) {
    const deregister = this.deregister_popout.bind(this);
    popout.init({
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      ctx: this.ctx,
      deregister
    })
    this.popout = popout
  }

  deregister_popout(name) {
    console.log("deregistering popout ", name);
    if (this.popout && this.popout.name == name) this.popout = null
  }

  deregister_handlers() {
    this.handlers.length = 0;
  }

  register_handler(handler) {
    handler.init({
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      ctx: this.ctx
    });
    this.handlers.push(handler)
  }

  deregister(name) {
    delete this.buttons[name]
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
    // console.log("Ignored touch event for ", this.name);
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
    /*
    this.panel.ctx.strokeStyle = this.id ? 'red' : 'blue';
    this.panel.ctx.beginPath()
    // console.dir({ x: this.x, y: this.y, r: this.r, panel: this.panel, _x: this._x})
    this.panel.ctx.rect(this.x, this.y, this.w, this.h)
    this.panel.ctx.stroke()
    */
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
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const id = touch.identifier;
      const x = touch.pageX;
      const y = touch.pageY;
      if (this._on(x, y)) {
        this.id = id;
        this.start = {x, y}
        this.ontouchstart(x, y)
        break;
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

class OneShotButton {
  constructor (name, options={}) {
    this.name = name
    this._x = options.x || 0
    this._y = options.y || 0
    this._r = options.r || 0
    this.follow = options.follow || false
    this.overlapping = options.overlapping || 5
    this.r2 = (this._r + this.overlapping) ** 2

    this.mouse = options.mouse
    this.mouseArea = !!options.mouseArea

    this.id = null
    this._ = {
      active: false,
      x: 0,
      y: 0,
      status: 0
    }

    this.resize = (options.resize || this._resize).bind(this)
    this.state = {} // identifier: status // 0, 1: start
    this.start = {}

    this.onactive = options.touchactive || this._ignore
    this.onpress = options.touchpress || this._ignore
    this.onend = options.touchend || this._ignore
    this.events = []
    this.render = (options.render || this._render).bind(this)
  }

  _ignore(e) {
    // console.log("Ignored touch event for ", this.name);
  }

  _resize(panel) {
    this.panel = panel
    const rect = new Rect([this.panel.x, this.panel.y, this.panel.w, this.panel.h])
    this.x = rect.cast_x(this._x)
    this.y = rect.cast_y(this._y)
    this.r = rect.cast_h(this._r)
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

  _render() {
    this.panel.ctx.strokeStyle = this.id ? 'red' : 'blue';
    this.panel.ctx.beginPath()
    // console.dir({ x: this.x, y: this.y, r: this.r, panel: this.panel, _x: this._x})
    this.panel.ctx.ellipse(this.x, this.y, this.r, this.r, 0, 0, 2 * Math.PI);
    this.panel.ctx.stroke()
  }

  touchstart(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const id = touch.identifier;
      const x = touch.pageX;
      const y = touch.pageY;
      if (this._on(x, y)) {
        this.id = id;
        this.start = {x, y}
        this._.active = true
        this.onactive(x, y)
        break;
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
        if (this._on(x, y)) {
          this._.active = true
        } else {
          this._.active = false
        }
        break;
      }
    }
  }

  touchend(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const id = touch.identifier;
      if (this.id == id) {
        this.id = null
        this._.active = false
        const x = touch.pageX;
        const y = touch.pageY;
        const start = this.start;
        if (this._on(x, y)) {
          this.onpress(x, y, start.x, start.y)
        } else {
          this.onend(x, y, start.x, start.y)
        }
        // clean up
        this.state = {}
        this.start = {}
        break;
      }
    }
  }

  _on(x, y) {
    return ((this.x - x) ** 2 + (this.y - y) ** 2) < this.r2
  }

  mousedown(e) {
    if (e.button == this.mouse) {
      const x = e.clientX;
      const y = e.clientY;
      if (!this.mouseArea || this._on(x, y)) {
        this.start = {x, y}
        this.id = true
        this.onactive(x, y)
      }
    }
  }

  mousemove(e) {
    if (e.button == this.mouse) {
      if (this.id) {
        const y = e.clientY;
        const x = e.clientX;
        this.state = {x, y}
        if (this._on(x, y)) {
          this._.active = true
        } else {
          this._.active = false
        }
      }
    }
  }

  mouseup(e) {
    if (e.button == this.mouse) {
      if (this.id) {
        this.id = false;
        this._.active = false;
        const x = e.clientX;
        const y = e.clientY;
        const start = this.start;
        if (this._on(x, y)) {
          this.onpress(x, y, start.x, start.y)
        } else {
          this.onend(x, y, start.x, start.y)
        }
        this.start = {}
        this.state = {}
      }
    }
  }
}

class OneShotButtonRect extends OneShotButton {
  constructor (name, options={}) {
    super(name, options);
    this._w = options.w || 0
    this._h = options.h || 0
    this._X = this._x + this._w
    this._Y = this._y + this._h
    this.start = {}
    this.state = {}
    this.resize = (options.resize || this._resize).bind(this)
    this.render = (options.render || this._render).bind(this)
  }

  _ignore(e) {
    // console.log("Ignored touch event for ", this.name);
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


  _render() {
    this.panel.ctx.strokeStyle = this.id ? 'red' : 'blue';
    this.panel.ctx.beginPath()
    // console.dir({ x: this.x, y: this.y, r: this.r, panel: this.panel, _x: this._x})
    this.panel.ctx.rect(this.x, this.y, this.w, this.h)
    this.panel.ctx.stroke()
  }

  _on(x, y) {
    return x >= this.x && x <= this.X && y >= this.y && y <= this.Y
  }
}

class ActiveButton {
  constructor (name, options={}) {
    this.name = name
    this._x = options.x || 0
    this._y = options.y || 0
    this._r = options.r || 0
    this.follow = options.follow || false
    this.overlapping = options.overlapping || 5
    this.r2 = (this._r + this.overlapping) ** 2
    this.id = null
    this._ = {
      active: false,
      x: 0,
      y: 0,
      status: 0
    }

    this.resize = (options.resize || this._resize).bind(this)
    this.state = {} // identifier: status // 0, 1: start
    this.start = {}

    this.onactive = options.touchactive || this._ignore
    this.onend = options.touchend || this._ignore
    this.events = []
  }

  _ignore(e) {
    // console.log("Ignored touch event for ", this.name);
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
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const id = touch.identifier;
      const x = touch.pageX;
      const y = touch.pageY;
      if (this._on(x, y)) {
        this.id = id;
        this.start = {x, y}
        this._.active = true
        this.onactive(x, y)
        break;
      }
    }
  }

  touchmove(e) {
    /*
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const id = touch.identifier;
      if (this.id == id) {
        const x = touch.pageX;
        const y = touch.pageY;
        this.state = { x, y }
        if (this._on(x, y)) {
          this._.active = true
        } else {
          this._.active = false
        }
        break;
      }
    }
    */
  }

  touchend(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const id = touch.identifier;
      if (this.id == id) {
        this.id = null
        this._.active = false
        const x = touch.pageX;
        const y = touch.pageY;
        const start = this.start;
        this.onend(x, y, start.x, start.y)
        // clean up
        this.state = {}
        this.start = {}
        break;
      }
    }
  }

  _on(x, y) {
    return ((this.x - x) ** 2 + (this.y - y) ** 2) < this.r2
  }
}

class StickButton {
  constructor (name, options={}) {
    this.name = name
    this._a = options.a || 0
    this._b = options.b || 0
    this._w = options.w || 0
    this._h = options.h || 0
    this._x = options.x || 0
    this._y = options.y || 0
    this._r = options.r || 0
    // cursor
    this._cr = options.cr || 0
    this._cd = options.cd || 0
    this.cx = 0
    this.cy = 0

    this.mouse = options.mouse
    this.mouseArea = !!options.mouseArea

    this.follow = options.follow || false
    this.overlapping = options.overlapping || 5
    this.r2 = (this._r + this.overlapping) ** 2
    this.id = null
    this._ = {
      active: false,
      x: 0,
      y: 0,
      status: 0
    }

    this.resize = (options.resize || this._resize).bind(this)
    this.state = {} // identifier: status // 0, 1: start
    this.start = {}

    this.onactive = options.touchactive || this._ignore
    this.ondir = options.touchdir || this._ignore
    this.onend = options.touchend || this._ignore
    this.render = (options.render || this._render).bind(this)
    this.events = []
  }

  _ignore(e) {
    // console.log("Ignored touch event for ", this.name);
  }

  _resize(panel) {
    this.panel = panel
    const rect = new Rect([this.panel.x, this.panel.y, this.panel.w, this.panel.h])
    this.a = rect.cast_x(this._a)
    this.b = rect.cast_y(this._b)
    this.w = rect.cast_w(this._w)
    this.h = rect.cast_h(this._h)
    this.A = this.a + this.w
    this.B = this.b + this.h
    this.x = rect.cast_x(this._x)
    this.y = rect.cast_y(this._y)
    this.r = rect.cast_w(this._r)
    this.r2 = (this.r + this.overlapping) ** 2
    // Initial center point
    this.px = this.x
    this.py = this.y

    // curosr
    this.cr = rect.cast_w(this._cr)
    this.cd = rect.cast_w(this._cd)
    this.cd2 = this.cd ** 2
    this.c2 = (this.r - this.cr) ** 2
  }

  init(panel) {
    this.resize(panel);
    this.render()
  }

  tick() {
    return this._.active ? {
      active: true,
      x: this.state.x - this.start.x,
      y: this.state.y - this.start.y
    } : {
      active: false,
      x: 0,
      y: 0,
    }
  }

  _render() {
    this.panel.ctx.strokeStyle = this._.active ? 'red' : 'blue';
    this.panel.ctx.beginPath()
    // draw rect
    // this.panel.ctx.rect(this.a, this.b, this.w, this.h)
    // console.dir({ x: this.x, y: this.y, r: this.r, panel: this.panel, _x: this._x})
    this.panel.ctx.ellipse(this.x, this.y, this.r, this.r, 0, 0, 2 * Math.PI);
    this.panel.ctx.stroke()
    if (this._.active) {
      // draw cursor
      this.panel.ctx.beginPath()
      this.panel.ctx.ellipse(this.cx, this.cy, this.cr, this.cr, 0, 0, 2 * Math.PI);
      this.panel.ctx.stroke()
    }
  }

  touchstart(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const id = touch.identifier;
      const x = touch.pageX;
      const y = touch.pageY;
      if (this._onrect(x, y)) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.start = {x, y}
        this.state = {x, y}
        this._.active = true
        this.onactive(x, y)
        this.updatecursor(x, y);
        break;
      }
    }
  }

  updatecursor(x, y) {
    const distance2 = (x - this.x) ** 2 + (y - this.y) **2;
    if (distance2 > this.c2 ) {
      const delta = (this.r - this.cr) / Math.sqrt(distance2);
      this.cx = this.x + (x - this.x) * delta;
      this.cy = this.y + (y - this.y) * delta;
    } else {
      this.cx = x
      this.cy = y
    }
  }

  touchmove(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const id = touch.identifier;
      if (this.id == id) {
        const x = touch.pageX;
        const y = touch.pageY;
        this.ondir(x, y, this.start.x, this.start.y);
        this.state = { x, y }
        this.updatecursor(x, y);
        break;
      }
    }
  }

  touchend(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const id = touch.identifier;
      if (this.id == id) {
        this.id = null
        this._.active = false
        const x = touch.pageX;
        const y = touch.pageY;
        const start = this.start;
        this.onend(x, y, start.x, start.y);
        // clean up
        this.state = {}
        this.start = {}
        // restore
        this.x = this.px
        this.y = this.py
        break;
      }
    }
  }

  _on(x, y) {
    return ((this.x - x) ** 2 + (this.y - y) ** 2) < this.r2
  }

  _onrect(x, y) {
    return x >= this.a && x <= this.A && y >= this.b && y <= this.B
  }

  mousedown(e) {
    if (e.button == this.mouse) {
      const x = e.clientX;
      const y = e.clientY;

      if (this._onrect(x, y)) {
        this.id = true;
        this.x = x;
        this.y = y;
        this.start = {x, y}
        this.state = {x, y}
        this._.active = true
        this.onactive(x, y)
        this.updatecursor(x, y);
      }
    }
  }

  mousemove(e) {
    if (e.button == this.mouse) {
      if (this.id) {
        const y = e.clientY;
        const x = e.clientX;
        this.ondir(x, y, this.start.x, this.start.y);
        this.state = { x, y }
        this.updatecursor(x, y);
      }
    }
  }

  mouseup(e) {
    if (e.button == this.mouse) {
      if (this.id) {
        this.id = false;
        this._.active = false
        const x = e.clientX;
        const y = e.clientY;
        const start = this.start;
        this.onend(x, y, start.x, start.y);
        // clean up
        this.state = {}
        this.start = {}
        // restore
        this.x = this.px
        this.y = this.py
      }
    }
  }
}


class VScrollable {
  constructor (name, options={}) {
    this.name = name
    this._x = options.x || 0
    this._y = options.y || 0
    this._w = options.w || 0
    this._h = options.h || 0
    this._lh = options.lh || 1;
    this.items = options.items || [];
    this.item_values = options.item_values || {};
    this.speed = options.speed || 1;

    this.mouse = options.mouse
    this.mouseArea = !!options.mouseArea

    this._X = this._x + this._w
    this._Y = this._y + this._h
    this.start = {}
    this.state = {};
    this.resize = (options.resize || this._resize).bind(this)
    this.render = (options.render || this._render).bind(this)
    this.item_render = (options.item_render || this._item_render).bind(this);

    this.offset = 0;
    this.id = false;
  }

  _resize(panel) {
    this.panel = panel
    const rect = new Rect([this.panel.x, this.panel.y, this.panel.w, this.panel.h])
    this.x = rect.cast_x(this._x)
    this.y = rect.cast_y(this._y)
    this.w = rect.cast_w(this._w)
    this.h = rect.cast_h(this._h)
    this.X = this.x + this.w
    this.Y = this.y + this.h;
    this.lh = rect.cast_h(this._lh);
    this.window = Math.ceil(this.h / this.lh) + 1;
    this.max_offset = this.lh * this.items.length - this.h + 10;
    this.cursor = this.max_offset > 10;
  }

  init(panel) {
    this.resize(panel);
  }

  _item_render(item, ctx, x, y, w, h) {
    // ctx.strokeRect(x, y+1, w, h-2);
    ctx.textAlign = 'right'
    ctx.fillText(item + '  |', x + w/2, y + h /2);
    ctx.textAlign = 'left'
    ctx.fillText('  ' + this.item_values[item], x + w/2, y + h /2);
  }

  _render() {
    const ctx = this.panel.ctx;
    const index = Math.floor(this.offset / this.lh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.w, this.h)
    ctx.clip();

    ctx.fillStyle = '#00ffff';
    ctx.textBaseline = 'middle'
    ctx.font = '14px sans-serif'
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00ffff'

    this.items.slice(index, index + this.window).forEach((item, i) => {
      this.item_render(item, ctx, this.x,
          this.y + this.lh * (index + i) - this.offset, this.w, this.lh);
    });
    ctx.restore();
  }

  _on(x, y) {
    return x >= this.x && x <= this.X && y >= this.y && y <= this.Y
  }

  touchstart(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const id = touch.identifier;
      const x = touch.pageX;
      const y = touch.pageY;
      if (this._on(x, y)) {
        this.id = id;
        this.start = {x, y}
        this.sy = y;
        // this.onactive(x, y)
        break;
      }
    }
  }

  update_offset(offset) {
    offset = this.offset + offset * this.speed;
    this.offset = Math.max(0, Math.min(offset, this.max_offset));
  }

  touchmove(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const id = touch.identifier;
      if (this.id == id) {
        const x = touch.pageX;
        const y = touch.pageY;
        this.state = { x, y };
        this.update_offset(this.sy - y);
        this.sy = y;
        break;
      }
    }
  }

  touchend(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const id = touch.identifier;
      if (this.id == id) {
        this.id = null
        const x = touch.pageX;
        const y = touch.pageY;
        const start = this.start;
        // clean up
        this.state = {}
        this.start = {}
        break;
      }
    }
  }

  mousedown(e) {
    if (e.button == this.mouse) {
      const x = e.clientX;
      const y = e.clientY;
      if (!this.mouseArea || this._on(x, y)) {
        this.start = {x, y}
        this.id = true
        this.sy = y;
        // this.onactive(x, y)
      }
    }
  }

  mousemove(e) {
    if (e.button == this.mouse) {
      if (this.id) {
        const y = e.clientY;
        const x = e.clientX;
        this.state = {x, y}
        this.update_offset(this.sy - y);
        this.sy = y;
      }
    }
  }

  mouseup(e) {
    if (e.button == this.mouse) {
      if (this.id) {
        this.id = false;
        const x = e.clientX;
        const y = e.clientY;
        const start = this.start;
        this.start = {}
        this.state = {}
      }
    }
  }

  tick() {}
}


module.exports = {
  ButtonEvent, Button, Panel, ButtonHandler, OneShotButton, ActiveButton, StickButton,
  OneShotButtonRect, Rect, VScrollable
}

