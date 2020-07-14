

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, ul, ll, ur, lr) {
  ul = ul || 1;
  ll = ll || ul;
  ur = ur || ul;
  lr = lr || ll;

	this.beginPath();
	this.moveTo(x + ul, y);
	this.lineTo(x + w - ur, y);
	this.quadraticCurveTo(x + w, y, x + w, y + ur);
	this.lineTo(x + w, y + h - lr);
	this.quadraticCurveTo(x + w, y + h, x + w - lr, y + h);
	this.lineTo(x + ll, y + h);
	this.quadraticCurveTo(x, y + h, x, y + h - ll);
	this.lineTo(x, y + ul);
	this.quadraticCurveTo(x, y, x + ul, y);
	this.closePath();
} 

CanvasRenderingContext2D.prototype.roundRectWithTitle = function (l, x, y, w, h, ul, ll, ur, lr) {
  ul = ul || 1;
  ll = ll || ul;
  ur = ur || ul;
  lr = lr || ll;

  const margin = (w - ul - ur - l)/2;
  const lw = 18;
  const lh = 16;
	this.beginPath();
	this.moveTo(x + ul, y);
	this.lineTo(x + ul + margin, y);
	this.lineTo(x + ul + margin - lw, y - lh);
	this.lineTo(x + w - ur - margin + lw, y - lh);
	this.lineTo(x + w - ur - margin, y);
	// this.lineTo(x + w - ur - margin + lw, y + lh);
	// this.lineTo(x + ul + margin - lw, y + lh);
	// this.lineTo(x + ul + margin, y);
	// this.moveTo(x + w - ur - margin, y);
	this.lineTo(x + w - ur, y);
	this.quadraticCurveTo(x + w, y, x + w, y + ur);
	this.lineTo(x + w, y + h - lr);
	this.quadraticCurveTo(x + w, y + h, x + w - lr, y + h);
	this.lineTo(x + ll, y + h);
	this.quadraticCurveTo(x, y + h, x, y + h - ll);
	this.lineTo(x, y + ul);
	this.quadraticCurveTo(x, y, x + ul, y);
	this.closePath();
}
