class GameBoard {
  constructor(socket) {
    this.socket = socket;
    
    this.canvas = document.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');

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
    
    const pencilImg = document.querySelector('#pencil');
    this.cursor = new Cursor(this.socket, this.canvas, this.ctx, pencilImg, this.dynCanvas);
    
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.cursor.isDrawing) {
        const line = {
          startX: this.cursor.prevX,
          startY: this.cursor.prevY,
          endX: this.cursor.posX,
          endY: this.cursor.posY,
          lineWidth: this.dynCtx.lineWidth,
          strokeStyle: this.dynCtx.strokeStyle,
        };

        this.drawToDynamicCanvas(line);
        this.socket.emit('drawLine', line);
      }
    });
  }
  
  setLineWidth(lineWidth) {
    this.dynCtx.lineWidth = lineWidth;
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
    this.cursor.draw();
  }
}