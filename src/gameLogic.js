class GameLogic {
  constructor(io) {
    this.io = io;
    
    this.gameStarted = false;
    
    this.players = [];
    this.turnCount = 0;
  }
  
  addPlayer(username) {
    this.players.push({
      username: username,
      isTurn: false,
      score: 0
    });
    
    if(!this.gameStarted) {
      if(this.players.length >== 1) {
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
    ++this.turnCount % this.players.length;
  }
  
  startGame() {
    this.gameStarted = true;
    // send game started
  }
}