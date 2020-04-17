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

  draw(name, x, y) {
    const image = this._[name]
    // console.dir({name, x, y, image}, {depth: null})
    if (image && image._ && image._._ && this.ctx)
      this.ctx.drawImage(image._._, image.x, image.y, image.w, image.h, x, y, image.dw, image.dh)
    else {
      console.error("ctx is not set or image is not available")
    }
  }
}

module.exports = { Scene, Sprite, ImageAsset, ImageBundle, Images: new ImageBundle }

