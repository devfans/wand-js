'use strict'

const { AB } = require('./asset')

class ImageAsset {
  constructor (name, options={}) {
    this.name = name
    this._ = options._
    this.x = options.x || 0
    this.y = options.y || 0
    this.w = options.w || this._._.naturalWidth
    this.h = options.h || this._._.naturalHeight
  }
}

class ImageBundle {
  constructor(options = {}) {
    this._ = {}
    this.ab = options.assetBundle || AB
  }

  newScene(options={}) {
    options.imageBundle = this
    return new Scene(options)
  }

  add(name, id, options={}) {
    if (!name || !id) return
    if (options.url) {
      options.name = id
      options.kind = 'image'
      this.ab.add(options)
    }
    this._[name] = new ImageAsset (name, {
      _ : this.ab._[id],
    })
  }

  get(name) {
    if (name) {
      const obj = this._[name]
      if (obj) return obj
    }
    console.error("Can not find image with name: " + name)
  }
}

class Sprite {
  constructor(name, options={}) {
    this._ = options._ ? options._._ : null
    this.name = name
    this.x = options.x || 0
    this.y = options.y || 0
    this.w = options.w || this._._.naturalWidth
    this.h = options.h || this._._.naturalHeight
    this.dw = options.dw || this.w
    this.dh = options.dh || this.h
  }
}

class Scene {
  constructor(options={}) {
    this.ib = options.imageBundle
    this.ctx = options.ctx
    this._ = {}
  }

  add(name, id, options={}) {
    if (this.ib._[id]) {
      options._ = this.ib._[id]
      this._[name] = new Sprite(name, options)
    }
  }

  draw_fill_rect(x, y, l, style = 'white') {
    this.ctx.fillStyle = style
    this.ctx.fillRect(x - l/2, y - l/2, l, l)
  }

  draw(name, x, y) {
    const image = this._[name]
    // console.dir({name, x, y, image}, {depth: null})
    if (image && image._ && image._._ && this.ctx)
      this.ctx.drawImage(image._._, image.x, image.y, image.w, image.h, x - image.w/2, y - image.h/2, image.dw, image.dh)
    else {
      console.error("ctx is not set or image is not available")
    }
  }

  draw_with_rotation(name, x, y, r) {
    const image = this._[name]
    if (image && image._ && image._._ && this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, x, y)
      let rotation = 0
      if (r != 1) rotation = Math.PI*(r == 8 ? -0.5 : r * 0.25);
      this.ctx.rotate(rotation)
      this.ctx.drawImage(image._._, image.x, image.y, image.w, image.h, -image.w/2, -image.h/2, image.dw, image.dh)
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      console.error("ctx is not set or image is not available")
    }
  }
}

module.exports = { Scene, Sprite, ImageAsset, ImageBundle, Images: new ImageBundle }

