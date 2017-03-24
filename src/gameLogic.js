class GameLogic {
  constructor(io) {
    this.io = io;

    this.gameStarting = false;
    this.gameStarted = false;
    this.gameStartTime = 20000;
    this.gameStartTimeout = undefined;

    this.players = [];
    this.turnCount = -1;
    this.totalTurns = 1;

    this.prevTime = Date.now();
    this.turnTimer = 0;
    this.turnTime = 90000;

    this.startGameInterval = setInterval(this.checkStartGame.bind(this), 100);
    this.roundInterval = undefined;

    // Words taken from https://hobbylark.com/party-games/pictionary-words off of the easy list
    this.words = ['Angry', 'Fireworks', 'Pumpkin', 'Baby', 'Flower', 'Rainbow', 'Beard', 'Flying saucer', 'Recycle',
      'Bible', 'Giraffe', 'Sand castle', 'Bikini', 'Glasses', 'Snowflake', 'Book', 'High heel', 'Stairs', 'Bucket', 'Ice cream cone', 'Starfish', 'Bumble bee', 'Igloo', 'Strawberry', 'Butterfly', 'Lady bug', 'Sun', 'Camera', 'Lamp', 'Tire', 'Cat', 'Lion', 'Toast', 'Church', 'Mailbox', 'Toothbrush', 'Crayon', 'Night', 'Toothpaste', 'Dolphin', 'Nose', 'Truck', 'Egg', 'Olympics', 'Volleyball',
      'Eiffel Tower', 'Peanut',
    ];
    this.word = undefined;

    this.someoneGuessedCorrect = false;

    // A list of line objects, acting as a draw hsitory
    this.lines = [];
  }

  addPlayer(socket) {
    const player = {
      socket,
      isDrawing: false,
      guessedCorrectly: false,
      score: 0,
      totalTimesDrawn: 0,
      isSpectating: false,
    };

    this.players.push(player);

    if (!this.gameStarted) {
      if (this.gameStarting) {
        clearTimeout(this.gameStartTimeout);
        console.log('The number of players has changed. Restarting countdown...');
        this.startCountdown();
      } else {
        console.log('Waiting for more players to start');
        this.io.sockets.in('room1').emit('msg', 'Waiting for more players to start.');
      }
    } else {
      player.isSpectating = true;
    }
  }

  removePlayer(socket) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].socket === socket) {
        const removedPlayer = this.players.splice(i, 1);

        if (removedPlayer.isSpectating) return;

        if (this.gameStarting) {
          clearTimeout(this.gameStartTimeout);
          if (this.players.length > 1) {
            console.log('The number of players has changed. Restarting countdown...');
            this.startCountdown();
          } else {
            console.log('Not enough players to start');
            this.io.sockets.in('room1').emit('msg', 'Not enough players to start.');
          }
        } else if (this.gameStarted && this.players.length < 2) {
          this.gameStarted = false;
          this.stopGame();
          console.log('Not enough players to continue playing. Game stopped');
          this.io.sockets.in('room1').emit('msg', 'Not enough players to continue playing. Game stopped.');
        }
      }
    }
  }

  getPlayerFromSocket(socket) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].socket === socket) {
        return this.players[i];
      }
    }

    return null;
  }

  canPlayerDraw(socket) {
    const player = this.getPlayerFromSocket(socket);
    if (player !== null) {
      if (player.isDrawing) return true;
    }

    return false;
  }

  nextTurn() {
    this.turnCount = (this.turnCount + 1) % this.players.length;

    this.turnTimer = 0;

    let gameOver = true;
    for (let i = 0; i < this.players.length; i++) {
      if (!this.players[i].isSpectating && this.players[i].totalTimesDrawn < this.totalTurns) {
        gameOver = false;
        break;
      }
    }

    if (gameOver) {
      this.stopGame();
      return;
    }

    this.forceClearDrawing();

    this.word = this.words[Number.parseInt(Math.random() * this.words.length, 10)];

    this.someoneGuessedCorrect = false;

    const notSpectating = [];
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].guessedCorrectly = false;

      if (!this.players[i].isSpectating) {
        notSpectating.push(this.players[i]);
      }
    }

    for (let i = 0; i < notSpectating.length; i++) {
      if (i === this.turnCount) {
        notSpectating[i].isDrawing = true;
        notSpectating[i].totalTimesDrawn++;
        notSpectating[i].socket.emit('canDraw', true);

        this.io.sockets.in('room1').emit('msg', `It's ${notSpectating[i].socket.user.name}'s turn to draw!`);
        notSpectating[i].socket.emit('msg', `Your word is: ${this.word}`);
      } else {
        notSpectating[i].isDrawing = false;
        notSpectating[i].socket.emit('canDraw', false);
      }
    }
  }

  checkMessage(socket, message) {
    const player = this.getPlayerFromSocket(socket);
    if (player !== null) {
      if (this.gameStarted && !player.isSpectating &&
          !player.isDrawing && !player.guessedCorrectly) {
        if (message.toLowerCase() === this.word.toLowerCase()) {
          if (!this.someoneGuessedCorrect) {
            this.someoneGuessedCorrect = true;
            // Bonus points
            player.score += 15;
            this.io.sockets.in('room1').emit('msg', `${player.socket.user.name} got the word first! +15 points.`);
          } else {
            // Normal points
            player.score += 5;
            this.io.sockets.in('room1').emit('msg', `${player.socket.user.name} got the word! +5 points.`);
          }

          this.io.sockets.in('room1').emit('setScore', {
            name: player.socket.user.name,
            score: player.score,
          });

          player.guessedCorrectly = true;

          return false;
        }
      }
    }

    return true;
  }

  checkRound() {
    // Normal ending - all players guessed the word
    let totalGuessing = 0;
    let totalGuessedRight = 0;
    for (let i = 0; i < this.players.length; i++) {
      if (!this.players[i].isDrawing && !this.players[i].isSpectating) {
        totalGuessing++;

        if (this.players[i].guessedCorrectly) {
          totalGuessedRight++;
        }
      }
    }

    if (totalGuessedRight === totalGuessing) {
      this.io.sockets.in('room1').emit('msg', `Everyone got it! The word was ${this.word}.`);
      this.nextTurn();
    }

    // Timeout ending - round ran out of time
    const currTime = Date.now();
    this.turnTimer += currTime - this.prevTime;
    if (this.turnTimer >= this.turnTime) {
      this.io.sockets.in('room1').emit('msg', `Time's up! The word was ${this.word}.`);
      this.nextTurn();
    }

    this.prevTime = currTime;

    // Disconnect ending - round ended because the drawer left
    let hasDrawer = false;
    for (let i = 0; i < this.players.length; i++) {
      if (!this.players[i].isSpectating && this.players[i].isDrawing) {
        hasDrawer = true;
        break;
      }
    }

    if (!hasDrawer) {
      this.io.sockets.in('room1').emit('msg', 'The drawer left the game.');
      this.nextTurn();
    }
  }

  checkStartGame() {
    if (this.players.length > 1) {
      clearInterval(this.startGameInterval);
      this.startCountdown();
    }
  }

  startCountdown() {
    console.log('Starting countdown');

    this.gameStarting = true;
    this.io.sockets.in('room1').emit('msg', `A new game will start in ${this.gameStartTime / 1000} seconds.`);

    this.gameStartTimeout = setTimeout(this.startGame.bind(this), this.gameStartTime);
  }

  startGame() {
    console.log('Game started');

    this.io.sockets.in('room1').emit('clearMsg');

    this.gameStarting = false;
    this.gameStarted = true;
    this.io.sockets.in('room1').emit('msg', `A new game has started with ${this.players.length} players.`);

    this.roundInterval = setInterval(this.checkRound.bind(this), 100);

    this.nextTurn();
  }

  stopGame() {
    this.gameStarting = false;
    this.gameStarted = false;
    clearInterval(this.roundInterval);

    if (this.players.length > 0) {
      let winners = [];
      let highestScore = 0;
      for (let i = 0; i < this.players.length; i++) {
        this.players[i].totalTimesDrawn = 0;
        this.players[i].isSpectating = false;

        if (this.players[i].score > highestScore) {
          highestScore = this.players[i].score;
          winners = [];
          winners.push(this.players[i]);
        } else if (this.players[i].score === highestScore) {
          winners.push(this.players[i]);
        }
      }

      if (winners.length > 1) {
        let message = 'The game is over! The winners are ';
        for (let i = 0; i < winners.length; i++) {
          if (i === winners.length - 2) {
            message += (`${winners[i].socket.user.name}, and `);
          } else if (i === winners.length - 1) {
            message += (`${winners[i].socket.user.name}`);
          } else {
            message += (`${winners[i].socket.user.name}, `);
          }
        }
        message += ` with ${winners[0].score} points!`;

        this.io.sockets.in('room1').emit('msg', message);
      } else {
        this.io.sockets.in('room1').emit('msg', `The game is over! The winner is ${winners[0].socket.user.name} with ${winners[0].score} points!`);
      }
    }

    setTimeout(() => {
      this.startGameInterval = setInterval(this.checkStartGame.bind(this), 100);
    }, 5000);
  }

  forceClearDrawing() {
    this.lines = [];
    this.io.sockets.in('room1').emit('clear');
  }

  clearDrawing(socket) {
    const player = this.getPlayerFromSocket(socket);
    if (player !== null) {
      if (player.isDrawing) {
        this.lines = [];
        this.io.sockets.in('room1').emit('clear');
      }
    }
  }

  addToDrawing(line) {
    this.lines.push(line);
  }
}

module.exports = GameLogic;
