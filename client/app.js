class App {
  constructor() {
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

    this.socket = io.connect();

    this.gameBoard = new GameBoard(this.socket);
    this.gameBoard.setLineWidth(strokeSizeSlider.value);
    
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
    this.socket.on('drawLine', this.gameBoard.drawLine.bind(this.gameBoard));
  }

  onClear() {
    this.socket.on('clear', () => {
      this.gameBoard.clear();
    });
  }

  onDrawHistory() {
    this.socket.on('drawHistory', (lines) => {
      for (let i = 0; i < lines.length; i++) {
        this.gameBoard.drawLine(lines[i]);
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

    this.gameBoard.draw();
  }

  sendClearToServer() {
    this.socket.emit('clear');
  }  
}

window.onload = () => {
  const app = new App();
  app.update();
};
