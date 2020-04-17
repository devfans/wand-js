## Wand JS

A simple library to manage asset bundles and input for games, especially for wand (https://github.com/devfans/wand) and dragon(https://github.com/devfans/dragon)

## Get Started

```
const wand = require('wand-js')

class Game {
  constructor (options={}) {
    this.audios = options.audios
    this.images = options.images
    this.ab = options.ab
    this.init()
  }

  init() {
    this.mixer = this.audios.newMixer()
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext('2d')
    this.scene = this.images.newScene({ctx})
    this.audios.add('explosion', 'explosion_1', {
      url: '/sound/explosion_1.ogg'
    })

    this.audios.add('bgm', 'bgm', {
      url: '/sound/powerup_pick.ogg'
    })
    this.images.add('tank', 'tank', {
      url: '/img/general_sprites.png'
    })
    this.scene.add('tank', 'tank', {
      h: 40,
      w: 37
    })
    this.input = new wand.Panel({ctx})
    const button = new wand.Button('A', {
      x: 200,
      y: 200,
      r: 100
    })
    this.input.register(button)
  }

  play_audio(name) {
    this.mixer.play(name)
  }

  draw_sprite(name, x, y) {
    this.scene.draw(name, x, y)
  }

  preTick() {
    this.input.tick();
  }

  tick() {
    this.input.render();
  }

  buttonPressed (name) {
    return this.input.keyup(name)
  }
}

const newGame = () => {
  const game = new Game({
    audios: wand.Audios,
    images: wand.Images,
    ab: wand.AB
  })
  return game
}

```

