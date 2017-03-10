class GameLogic {
  constructor(io) {
    this.io = io;

    this.gameStarted = false;

    this.players = [];
    this.turnCount = 0;
  }

  addPlayer(username, socket) {
    this.players.push({
      username,
      socket,
      isDrawing: false,
      score: 0,
    });

    if (!this.gameStarted) {
      if (this.players.length >= 1) {
        // send message "Starting game"
        this.startGame();
      } else {
        // send message "Waiting for more players to join..."
      }
    }
  }

  removePlayer(player) {
    const index = this.players.indexOf(player);
    this.players.splice(index, 1);
  }

  nextTurn() {
    this.turnCount = (this.turnCount + 1) % this.players.length;
  }

  startGame() {
    this.gameStarted = true;
    // send game started

    const drawingPlayer = this.players[this.turnCount];
    drawingPlayer.isDrawing = true;

    // send drawing player
  }
}

module.exports = GameLogic;
