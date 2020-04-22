'use strict'


const Status = {
  empty: 0,
  loading: 1,
  loaded: 2,
  failed: 3
}

class Asset {
  constructor(options={}) {
    this.name = options.name || ''
    this.url = options.url
    this.lazy = Boolean(options.lazy)
    this.status = options.status || Status.empty
    this._ = options._
    this.kind = options.kind
    this.init()
    if (!this.lazy) this.load()
  }

  clone() {
    return new Asset({
      name: this.name,
      url: this.url,
      lazy: false,
      status: Status.empty,
      kind: this.kind
    })
  }

  init() {
    if (!this._) {
      if (this.kind == 'image') {
        this._ = new Image
      } else if (this.kind == 'audio') {
        this._ = new Audio
      }
    }
    if (this._) {
       this._.onload = () => this.status = Status.loaded
       this._.onloadeddata = () => this.status = Status.loaded
    }
  }

  load(force=false) {
    if (((this.status == Status.loading || this.status == Status.loaded) && !force) || !this._)  return
    this._.src = this.url
    if (typeof(this._.load) == 'function') this._.load()
  }
}

class AssetBundle {
  constructor() {
    this._ = {}
  }

  add(options={}) {
    return this.register(new Asset(options))
  }

  register(asset) {
    if (!asset || !asset.name) return
    this._[asset.name] = asset
    return this._[asset.name]
  }

  get(name) {
    return this._[name]
  }
}

const AB = new AssetBundle

module.exports = { AB, Asset, AssetBundle }

