'use strict'


class ProgressCounter {
  constructor (options={}) {
    this.stopped = false;
    this.done = false;

    // Slow down before reaching target
    this.buffer = options.buffer || 0.8

    // Prediction for progress of next job
    this.prediction = options.prediction || 0.8

    // Update frequency
    this.fps = options.fps || 60.0

    // On end callback
    this.onend = options.onend

    // Total jobs
    this.total = options.total || 0;

    // Finished jobs
    this.finished = options.finished || 0;

    // Progress value
    this.progress = 1.0 * this.finished / (this.total || 1);
    
    // Progress speed
    this.speed = 0

    // Buffer blocking line
    this.blocking = 0

    // Calculate initital target
    this.target = this.update_target()

    this.max_speed_factor = 1.0;

    this.max_speed = this.max_speed_factor / (this.total * this.fps)

    // Still adding or done
    this.closed = false
  }

  change_target(count) {
    this.total = count;
    this.max_speed = this.max_speed_factor / (this.total * this.fps)
    this.target = this.update_target();
  }

  update_target() {
    if ((this.finished < this.total) || !this.closed) {
      this.done = false
      this.blocking = (this.finished + this.prediction - this.buffer) / this.total;
      return (this.finished + this.prediction) / this.total
    } else {
      this.done = true
      this.speed = (1.0 - this.progress)/this.fps
      return 1.0
    }
  }

  update() {
    if (this.stopped || !this.closed) return
    // Ending in 1s
    if (!this.done) {
      if (this.progress <= this.blocking) {
        this.speed += this.speed >= this.max_speed ?
          (this.max_speed - this.speed) : this.max_speed / this.fps;
      } else {
        this.speed = (this.target - this.progress) * 0.01
      }
    }

    this.progress += this.speed

    if (this.progress >= 1.0 && this.done) {
      this.stopped = true;
      console.log("Counter is finishing");
      if (this.onend) this.onend()
    }
  }

  push(count=1) {
    this.finished += count
    this.target = this.update_target()
  }

  finish() {
    this.close();
    this.finished = this.total;
    this.target = this.update_target()
  }

  add(count=1) {
    this.change_target(this.total + count)
  }

  close() {
    console.log("Counter is starting total %d, finsihed %d", this.total, this.finished);
    this.closed = true
  }
}

class ProgressBar {
  constructor (options={}) {
    this.ctx = options.ctx;
    this.counter = options.counter;
    this.text = options.text || '';
    this.x = options.x || 0
    this.y = options.y || 0
    this.w = options.w || 1
    this.h = options.h || 1
    this.font = options.font  || '14px sans-serif'
    this.font_fill = options.font_fill || "rgb(222,222,222)"
    this.back = options.background || 'rgb(10, 10, 10)'
    this.front = options.front || [[0, '#2C5FBD'], [0.8, '#2C6FCD'], [1, '#3C6FCD']]
    this.stroke = options.stroke || 'yellow'
  }

  render() {
    this.ctx.fillStyle = this.back
    this.ctx.fillRect(this.x, this.y, this.w, this.h)

    const linear = this.ctx.createLinearGradient(this.x, 0, this.x + this.w * this.counter.progress, 0);
    this.front.forEach(i => linear.addColorStop(i[0], i[1]));
    this.ctx.fillStyle = linear;
    this.ctx.fillRect(this.x, this.y, this.w * this.counter.progress, this.h)
    // this.ctx.strokeStyle = this.stroke
    // this.ctx.strokeRect(this.x, this.y, this.w, this.h)
    this.ctx.font = this.font
    this.ctx.fillStyle = this.font_fill;
    this.ctx.textBaseline = 'alphabetic'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(this.text, this.x, this.y - 10)
    this.ctx.textAlign = 'right'
    this.ctx.fillText(Math.round(100 * this.counter.progress) + '%', this.x + this.w, this.y - 10)
  }

}


module.exports = { ProgressCounter, ProgressBar }
