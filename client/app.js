class App {
  constructor() {
    this.socket = undefined;
    
    //---- Sets up canvas controls
    const pencilRadioButton = document.querySelector('#pencilRadio');
    const eraserRadioButton = document.querySelector('#eraserRadio');
    const strokeSizeSlider = document.querySelector('#strokeSizeSlider');
    const clearButton = document.querySelector('#clearButton');

    this.chatHistory = document.querySelector('#chatHistory');
    const chatBox = document.querySelector('#chatBox');
    const sendChatButton = document.querySelector('#sendChatButton');

    pencilRadioButton.addEventListener('click', () => {
      this.gameBoard.setLineColor('black');
    });

    eraserRadioButton.addEventListener('click', () => {
      this.gameBoard.setLineColor('white');
    });

    strokeSizeSlider.addEventListener('change', (e) => {
      this.gameBoard.setLineWidth(e.target.value);
    });

    clearButton.addEventListener('click', (e) => {
      this.gameBoard.clear();
      this.socket.emit('clear');
    });

    const sendMessage = () => {
      const message = chatBox.value;
      chatBox.value = '';

      this.socket.emit('msg', message);
    };
    
    sendChatButton.addEventListener('click', () => {
      sendMessage();
    });
    
    chatBox.addEventListener('keyup', (e) => {
      e.preventDefault();
      if(e.keyCode === 13) {
        sendMessage();
      }
    });
    //----
    
    //---- Sets up username popup window controls
    const popupWindow = document.querySelector('#popupWindow');
    const usernameTextField = document.querySelector('#usernameTextField');
    const badUsernameText = document.querySelector('#badUsernameText');
    const usernameSubmitButton = document.querySelector('#usernameSubmitButton');
    
    const connect = () => {
      const username = usernameTextField.value;
      
      this.socket = io.connect('', { query: `username=${username}` });
      
      this.socket.on('connect', () => {
        this.onReconnecting();
        this.onReconnect();
        this.onReconnectFailed();
        this.onDisconnect();
        this.onUsername();
        this.onLineDraw();
        this.onClear();
        this.onDrawHistory();
        this.onMsg();
      });
    };
    
    usernameSubmitButton.addEventListener('click', connect);
    usernameTextField.addEventListener('keyup', (e) => {
      e.preventDefault();
      if(e.keyCode === 13) {
        connect();
      }
    });
    //----

    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    
    this.gameBoard = new GameBoard(canvas, ctx);
    this.gameBoard.setLineWidth(strokeSizeSlider.value);
    
    const pencilImg = document.querySelector('#pencil');
    this.cursor = new Cursor(canvas, ctx, pencilImg);
    
    canvas.addEventListener('mousemove', (e) => {
      if (this.cursor.isDrawing) {
        const line = {
          startX: this.cursor.prevX,
          startY: this.cursor.prevY,
          endX: this.cursor.posX,
          endY: this.cursor.posY,
          lineWidth: this.gameBoard.getLineWidth(),
          strokeStyle: this.gameBoard.getLineColor()
        };

        this.gameBoard.drawLine(line);
        this.socket.emit('drawLine', line);
      }
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

  onUsername() {
    this.socket.on('username', (type) => {    
      switch(type) {
        case 'invalid': {
          badUsernameText.innerHTML = 'Please enter a valid username';
          break;
        }
          
        case 'taken': {
          badUsernameText.innerHTML = 'Someone already has that username';
          break;
        }
          
        case 'valid': {
          popupWindow.style.display = 'none';
          break;
        }
          
        default: {
          badUsernameText.innerHTML = 'Unknown error in connection';
          break;
        }
      }

      badUsernameText.style.display = 'inline';
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
    this.cursor.draw();
  } 
}

window.onload = () => {
  const app = new App();
  app.update();
};
