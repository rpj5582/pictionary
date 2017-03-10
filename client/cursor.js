class Cursor {
  constructor(canvas, ctx, cursorImg) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.cursorImg = cursorImg;
    this.posX = 0;
    this.posY = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.isDrawing = false;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();

      this.prevX = this.posX;
      this.prevY = this.posY;

      this.posX = e.clientX - rect.left;
      this.posY = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
    });

    this.canvas.addEventListener('mouseup', (e) => {
      this.isDrawing = false;
    });

    this.canvas.addEventListener('mouseout', () => {
      this.isDrawing = false;
    });
  }

  draw() {
    this.ctx.drawImage(this.cursorImg, this.posX, this.posY - this.cursorImg.height);
  }
}