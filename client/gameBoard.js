class GameBoard {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    this.dynCanvas = document.createElement('canvas');
    this.dynCanvas.width = this.canvas.width;
    this.dynCanvas.height = this.canvas.height;
    this.dynCanvas.style = this.canvas.style;
    this.dynCtx = this.dynCanvas.getContext('2d');

    this.dynCtx.fillStyle = 'white';
    this.dynCtx.fillRect(0, 0, this.dynCanvas.width, this.dynCanvas.height);
    this.dynCtx.fillStyle = 'black';
    
    this.dynCtx.lineCap = 'round';
    this.dynCtx.lineJoin = 'round';
  }
  
  getLineWidth() {
    return this.dynCtx.lineWidth;
  }
  
  getLineColor() {
    return this.dynCtx.strokeStyle;
  }
  
  setLineWidth(lineWidth) {
    this.dynCtx.lineWidth = lineWidth;
  }
  
  setLineColor(lineColor) {
    this.dynCtx.strokeStyle = lineColor;
  }
  
  drawLine(line) {
    this.dynCtx.save();
    this.dynCtx.lineWidth = line.lineWidth;
    this.dynCtx.strokeStyle = line.strokeStyle;
    this.dynCtx.beginPath();
    this.dynCtx.moveTo(line.startX, line.startY);
    this.dynCtx.lineTo(line.endX, line.endY);
    this.dynCtx.stroke();
    this.dynCtx.closePath();
    this.dynCtx.restore();
  }
  
  clear() {
    this.dynCtx.save();
    this.dynCtx.fillStyle = 'white';
    this.dynCtx.fillRect(0, 0, this.dynCanvas.width, this.dynCanvas.height);
    this.dynCtx.restore();
  }
  
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.dynCanvas, 0, 0);
  }
}