class App {
  constructor() {
    this.canvas = document.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');

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
        this.sendDrawLineToServer(line);
      }
    });

    this.dynCanvas = document.createElement('canvas');
    this.dynCanvas.width = this.canvas.width;
    this.dynCanvas.height = this.canvas.height;
    this.dynCanvas.style = this.canvas.style;
    this.dynCtx = this.dynCanvas.getContext('2d');

    this.dynCtx.fillStyle = 'white';
    this.dynCtx.fillRect(0, 0, this.dynCanvas.width, this.dynCanvas.height);
    this.dynCtx.fillStyle = 'black';

    const pencilRadioButton = document.querySelector('#pencilRadio');
    const eraserRadioButton = document.querySelector('#eraserRadio');
    const strokeSizeSlider = document.querySelector('#strokeSizeSlider');
    const clearButton = document.querySelector('#clearButton');

    this.chatHistory = document.querySelector('#chatHistory');
    const chatBox = document.querySelector('#chatBox');
    const sendChatButton = document.querySelector('#sendChatButton');

    pencilRadioButton.addEventListener('click', () => {
      this.dynCtx.strokeStyle = 'black';
    });

    eraserRadioButton.addEventListener('click', () => {
      this.dynCtx.strokeStyle = 'white';
    });

    strokeSizeSlider.addEventListener('change', (e) => {
      this.dynCtx.lineWidth = e.target.value;
    });

    clearButton.addEventListener('click', (e) => {
      this.clear();
      this.sendClearToServer();
    });

    sendChatButton.addEventListener('click', () => {
      const message = chatBox.value;
      chatBox.value = '';

      this.socket.emit('msg', message);
    });

    this.dynCtx.lineWidth = strokeSizeSlider.value;
    this.dynCtx.lineCap = 'round';
    this.dynCtx.lineJoin = 'round';

    this.socket = io.connect();

    const pencilImg = document.querySelector('#pencil');
    this.cursor = new Cursor(this.socket, this.canvas, this.ctx, pencilImg, this.dynCanvas);

    this.socket.on('connect', () => {
      this.onReconnecting();
      this.onReconnect();
      this.onReconnectFailed();
      this.onDisconnect();
      this.onLineDraw();
      this.onClear();
      this.onDrawHistory();
      this.onMsg();
    });
  }

  onReconnecting() {
    this.socket.on('reconnecting', (attempt) => {
      if (attempt === 1) {
        this.addChatMsg('Attempting to reconnect...');
      }
    });
  }

  onReconnect() {
    this.socket.on('reconnect', () => {
      this.addChatMsg('Successfully reconnected to server.');
    });
  }

  onReconnectFailed() {
    this.socket.on('reconnect_failed', () => {
      this.addChatMsg('Could not reconnect to the server.');
    });
  }

  onDisconnect() {
    this.socket.on('disconnect', () => {
      this.addChatMsg('Lost connection to server.');
    });
  }

  onLineDraw() {
    this.socket.on('drawLine', this.drawToDynamicCanvas.bind(this));
  }

  onClear() {
    this.socket.on('clear', () => {
      this.clear();
    });
  }

  onDrawHistory() {
    this.socket.on('drawHistory', (lines) => {
      for (let i = 0; i < lines.length; i++) {
        this.drawToDynamicCanvas(lines[i]);
      }
    });
  }

  onMsg() {
    this.socket.on('msg', (message) => {
      this.addChatMsg(message);
    });
  }

  addChatMsg(message) {
    this.chatHistory.value += `${message}\n`;
  }

  update() {
    requestAnimationFrame(this.update.bind(this));

    this.draw();
  }

  sendDrawLineToServer(line) {
    this.socket.emit('drawLine', line);
  }

  sendClearToServer() {
    this.socket.emit('clear');
  }

  clear() {
    this.dynCtx.save();
    this.dynCtx.fillStyle = 'white';
    this.dynCtx.fillRect(0, 0, this.dynCanvas.width, this.dynCanvas.height);
    this.dynCtx.restore();
  }

  drawToDynamicCanvas(line) {
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

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.dynCanvas, 0, 0);
    this.cursor.draw();
  }
}

window.onload = () => {
  const app = new App();
  app.update();
};
