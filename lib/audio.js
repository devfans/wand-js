'use strict'

const { AB } = require('./asset')

const Status = {
  playing: 0,
  stopped: 1,
  paused: 2,
  waiting: 3
}



const EnableAutoPlay = (audio) => {

  console.log("Setting up autotplay");
  const obj = new Audio();

  const auto = (e) => {
    obj.currentTime=obj.duration-.01
    console.log("playing")
    obj.play()
    setTimeout(() => {
      console.log('autoplay disposing!');
      window.removeEventListener('touchstart', auto)
    }, 500)
  } 

  obj.oncanplaythrough = e => {
    window.addEventListener('touchstart', auto);
  }

  obj.src = audio;
  obj.load();
}

class AudioAsset {
  constructor(name, options={}) {
    this.name = name
    this._ = options._
    this.v = options.v || 0
    this.V = options.V || 1
    this.priority = options.priority
    this.status = Status.waiting
    this.loop = options.loop || false
    this.volume = options.volume == null ? 1 : options.volume
  }

  build() {
    this._ = this._.clone()
  }

  playOn(options = {}) {
    if (this.status != Status.playing) this.play(options)
    else this.apply()
  }

  setVolume(volume = 1) {
    this._._.volume = Math.min(volume, 1.0)
  }

  play(options = {}) {
    this._._.onended = () => {
      this.status = Status.stopped
      // if (this.onstop) this.onstop()
    }
    this._._.onpause = () => {
      this.status = Status.paused
      if (this.onstop) this.onstop()
    }
    this.status = Status.playing
    this.apply()
    this._._.play()
  }

  pause(reset=true) {
    this._._.pause()
    if (reset) this._._.currentTime = 0
  }

  stopped() {
    return this.status == Status.stopped || this.status.paused
  }

  available() {
    return this.status != Status.playing
  }

  apply() {
    if (this.loop != null) this._._.loop = this.loop
    if (this.volume != null) this._._.volume = this.volume
  }

  update(options={}) {
    if (options._) this._ = options._
    if (options.v != null) this.v = options.v
    if (options.V != null) this.V = options.V
    if (options.loop != null) this.loop = options.loop
    if (options.priority != null) this.priority = options.priority
    if (options.status != null) this.status = options.status
    if (options.volume != null) this.volume = options.volume
  }
}

class AudioBundle {
  constructor(options = {}) {
    this._ = {}
    this.ab = options.assetBundle || AB
  }

  newMixer(options={}) {
    options.audioBundle = this
    return new Mixer(options)
  }

  add(name, id, options={}) {
    if (!name || !id) return
    if (options.url) {
      options.name = id
      options.kind = 'audio'
      this.ab.add(options)
    }
    this._[name] = new AudioAsset (name, {
      _ : this.ab._[id],
      v: options.v || 0,
      V: options.V || 1,
      priority: options.priority
    })
  }

  get(name) {
    if (name) {
      const obj = this._[name]
      if (obj) return obj
    }
    console.error("Can not find audio with name: " + name)
  }
}

class Mixer {
  constructor (options = {}) {
    this.ab = options.audioBundle
    this.v = options.v || 0  // min volume
    this.V = options.V || 1  // max volume
    this.muted = false
    this.__ = {}
    this._ = {}
  }

  prepare(name, options = {}) {
    if (!name) return
    const count = options.count || 2
    this.__[name] = []
    for (let i = 0; i < count; i++) {
      const audio = this.get(name, options)
      audio.build()
      this.setup(audio)
      this.__[name].push(audio)
    }
  }

  get(name, options={}) {
    const obj = this.ab.get(name)
    if (!obj) return
    return new AudioAsset(name, {
      priority: options.priority == null ? obj.priority : options.priority,
      v: options.v == null ? obj.v : options.v,
      V: options.V == null ? obj.V : options.V,
      status: Status.waiting,
      loop: options.loop || false,
      _: obj._
    })
  }

  playOn(name, options={}) {
    if (!name) return
    if (this._[name]) {
      this._[name].update(options)
      this._[name].playOn()
      this.mix(name)
      return
    }
    const audio = this.get(name, options)
    if (audio) {
      audio.build()
      this.setup(audio)
      this._[name] = audio
      audio.playOn(options)
      this.mix(name)
    }
  }

  playOff(name, reset=true) {
    if (this._[name]) {
      this._[name].pause(reset)
    }
  }

  play(name, options={}) {
    if (!name || !this.__[name] || this.__[name].length < 1) return
    for (let i = 0; i < this.__[name].length; i++) {
      if (this.__[name][i].available()) {
        // this.__[name][i].currentTime = 0
        this.__[name][i].update(options)
        this.__[name][i].play()
        this.mix(name)
        return
      }
    }
    this.__[name][0].pause()
    this.__[name][0].currentTime = 0
    this.__[name][0].update(options)
    this.__[name][0].play()
    this.mix(name)
  }

  setup(audio) {
    audio.onstop = () => this.mix()
  }

  stop(name, reset=true) {
    if (!name || !this.__[name]) return
    this.__[name].forEach(audio => audio.pause(reset))
  }

  mute(off=true) {
    this.muted = off
    this.mix()
  }

  _mix(audio, ignore) {
    if (this.muted) {
      audio.setVolume(0)
    } else if (audio.name != ignore) {
      if (ignore) {
        audio.setVolume(audio.volume /2)
      } else {
        audio.setVolume(audio.volume)
      }
    }
  }

  mix(ignore) {
    Object.values(this._).forEach(audio => this._mix(audio, ignore))
    Object.values(this.__).forEach(audios => audios.forEach(audio => this._mix(audio, ignore)))
  }
}

module.exports = { AudioAsset, AudioBundle, Mixer, Audios: new AudioBundle, EnableAutoPlay }

