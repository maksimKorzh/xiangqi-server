/****************************\
 ============================

         INIT ENGINE

 ============================              
\****************************/

// init engine
var engine = new Engine();

// run in browser mode  
console.log('\n  Wukong JS - BROWSER MODE - v' + engine.VERSION);
console.log('  type "engine" for public API reference');


/****************************\
 ============================

           GLOBALS

 ============================              
\****************************/


var book = [];
var botName = ''


/****************************\
 ============================

        XIANGQI BOARD

 ============================              
\****************************/

// piece folder
var pieceFolder = 'traditional_pieces';

// import sounds
const MOVE_SOUND = new Audio('/static/game/sounds/move.wav');
const CAPTURE_SOUND = new Audio('/static/game/sounds/capture.wav');

// square size
const CELL_WIDTH = 46;
const CELL_HEIGHT = 46;

// select color
const SELECT_COLOR = 'brown';

// flip board
var flip = 0;

// flip board
function flipBoard() {
  flip ^= 1;
  drawBoard();  
}

// render board in browser
function drawBoard() {
  var chessBoard = '<table cellspacing="0"><tbody>'
  let isCCBridge = document.getElementById('xiangqiboard').style.backgroundImage.includes('ccbridge');
  
  // board table
  for (let row = 0; row < 14; row++) {
    chessBoard += '<tr>'
    for (let col = 0; col < 11; col++) {
      let file, rank;
      
      // flip board
      if (flip) {
        file = 11 - 1 - col;
        rank = 14 - 1 - row;
      } else {
        file = col;
        rank = row;
      }
      
      let square = rank * 11 + file;
      let piece = engine.getPiece(square);
      var pieceImage = '<img style="width: 44px" draggable="true"';
      pieceImage += 'src="/static/game/images/' + pieceFolder + '/' + piece + (isCCBridge ? '.png' : '.svg') + '"></img>';

      if (engine.squareToString(square) != 'xx') {
        chessBoard += 
          '<td align="center" id="' + square + 
          '" width="' + CELL_WIDTH + 'px" height="' + CELL_HEIGHT +  'px" ' +
          ' onclick="tapPiece(this.id)" ' + 
          ' ondragstart="dragPiece(event, this.id)" ' +
          ' ondragover="dragOver(event, this.id)"'+
          ' ondrop="dropPiece(event, this.id)">' + (piece ? pieceImage : '') +
          '</td>';
      }
    }

    chessBoard += '</tr>';
  }

  chessBoard += '</tbody></table>';
  document.getElementById('xiangqiboard').innerHTML = chessBoard;
}

// highlight legal moves
function highlightMoves(square) {  
  //if (document.getElementById('showMoves').checked == false) return;
  
  let legalMoves = engine.generateLegalMoves();
  
  for (let count = 0; count < legalMoves.length; count++) {
    let move = legalMoves[count].move;
    let sourceSquare = engine.getSourceSquare(move);
    let targetSquare = engine.getTargetSquare(move);
    if (square == sourceSquare) {
      let parent = document.getElementById(targetSquare);
      parent.style.backgroundImage = 'url("/static/game/images/misc/legal_move.png")';
      parent.style.opacity = '0.50';
      if (parent.childNodes.length) {
        parent.childNodes[0].style.opacity = '0.5';
        parent.style.opacity = '1';
        parent.style.backgroundImage = 'url("/static/game/images/misc/legal_capture.png")';
      }
    }
  }
}

// set bot
function setBot(bot) {
  botName = bot;
  document.getElementById('current-bot-image').src = bots[bot].image;
  fixedTime = bots[bot].time;
  fixedDepth = bots[bot].depth;
  book = JSON.parse(JSON.stringify(bots[bot].book));
  //document.getElementById('pgn').value = bots[bot].description;
}

// set board theme
function setBoardTheme(theme) {
  document.getElementById('xiangqiboard').style.backgroundImage = 'url(' + theme + ')';
  drawBoard();
}

// set piece theme
function setPieceTheme(theme) {
  pieceFolder = theme;
  drawBoard();
}

// play sound
function playSound(move) {
  if (engine.getCaptureFlag(move)) CAPTURE_SOUND.play();
  else MOVE_SOUND.play();
}


/****************************\
 ============================

          USER INPUT

 ============================              
\****************************/

// stats
var guiScore = 0;
var guiDepth = 0;
var guiTime = 0;
var guiPv = '';
var guiSide = 0;
var userTime = 0;
var gameResult = '*';
var guiFen = '';

// difficulty
var fixedTime = 0;
var fixedDepth = 0;

// user input controls
var clickLock = 0;
var allowBook = 1;
var userSource, userTarget;

// 3 fold repetitions
var repetitions = 0;

// pick piece handler
function dragPiece(event, square) {
  // disallow touch opponents pieces
  if (playerColor == 'red' && engine.getPiece(square) > 7) return;
  if (playerColor == 'black' && engine.getPiece(square) < 8) return;
    
  userSource = square;
  highlightMoves(square);
}

// drag piece handler
function dragOver(event, square) {
  event.preventDefault();
  if (square == userSource) event.target.src = '';
}

// drop piece handler
function dropPiece(event, square) {
  userTarget = square;
  let valid = validateMove(userSource, userTarget);  
  movePiece(userSource, userTarget);
  if (engine.getPiece(userTarget) == 0) valid = 0;
  clickLock = 0;
  
  if (engine.getPiece(square) && valid) {
    userTime = Date.now() - userTime;
    document.getElementById(square).style.backgroundColor = SELECT_COLOR;
    playSound(valid);
    //updatePgn();
  }
  
  event.preventDefault();
  if (valid) setTimeout(function() {
    sendMove(valid);
    //think();
  }, 100);
}

// click event handler
function tapPiece(square) {
  drawBoard();
  
  if (engine.getPiece(square)) {
    document.getElementById(square).style.backgroundColor = SELECT_COLOR;
    highlightMoves(square);
  }
  
  var clickSquare = parseInt(square, 10)
  
  if(!clickLock && engine.getPiece(clickSquare)) {      
    // disallow touch opponents pieces
    if (playerColor == 'red' && engine.getPiece(clickSquare) > 7) return;
    if (playerColor == 'black' && engine.getPiece(clickSquare) < 8) return;

    userSource = clickSquare;
    clickLock ^= 1;
  } else if(clickLock) {      
    userTarget = clickSquare;

    let valid = validateMove(userSource, userTarget);
    movePiece(userSource, userTarget);
    if (engine.getPiece(userTarget) == 0) valid = 0;
    clickLock = 0;
    
    if (engine.getPiece(square) && valid) {
      document.getElementById(square).style.backgroundColor = SELECT_COLOR;
      playSound(valid);
      //updatePgn();
    }

    if (valid) setTimeout(function() {
      sendMove(valid);
      //think();
    }, 1);
  }
}


/****************************\
 ============================

        ENGINE MOVES

 ============================              
\****************************/

// use opening book
function getBookMove() {
  if (allowBook == 0) return 0;

  let moves = engine.getMoves();
  let lines = [];
  
  if (moves.length == 0) {
    let randomLine = book[Math.floor(Math.random() * book.length)];
    let firstMove = randomLine.split(' ')[0];
    return engine.moveFromString(firstMove);
  } else if (moves.length) {
    for (let line = 0; line < book.length; line++) {
      let currentLine = moves.join(' ');

      if (book[line].includes(currentLine) && book[line].split(currentLine)[0] == '')
        lines.push(book[line]);
    }
  }
  
  if (lines.length) {
    let currentLine = moves.join(' ');
    let randomLine = lines[Math.floor(Math.random() * lines.length)];

    try {
      let bookMove = randomLine.split(currentLine)[1].split(' ')[1];
      return engine.moveFromString(bookMove);
    } catch(e) { return 0; }
  }

  return 0;
}

// check for game state
function isGameOver() {
  if (engine.isRepetition()) repetitions++;
  if (repetitions >= 3) {
    gameResult = '3 fold repetition ' + (engine.getSide() ? 'black' : 'red') + ' lost';
    return 1;
  } else if (engine.generateLegalMoves().length == 0) {
    gameResult = (engine.getSide() ? '1-0' : '0-1') + ' mate';
    return 1;
  } else if (engine.getSixty() >= 120) {
    gameResult = '1/2-1/2 Draw by 60 rule move';
    return 1;
  } // TODO: material draw?

  if (engine.generateLegalMoves().length == 0) {
    gameResult = (engine.getSide() ? '1-0' : '0-1') + ' mate';
    return 1;
  }
  
  return 0;
}

// send move to server
function sendMove(move) {
  console.log('send move', move)
  
  // send move to the server
  $.post( "/board", {gameId: gameId, move: move, side: playerColor}, function(response) {
    console.log('UDP POST response:', response);
    
    if (engine.generateLegalMoves().length == 0) {
      gameResult = (engine.getSide() ? '1-0' : '0-1') + ' mate';
      
      // is game over ?
      if (playerColor == 'red' && gameResult == '1-0 mate') alert('You win!');
      if (playerColor == 'red' && gameResult == '0-1 mate') alert('You lose!');
      if (playerColor == 'black' && gameResult == '0-1 mate') alert('You win!');
      if (playerColor == 'black' && gameResult == '1-0 mate') alert('You lose!');
    }
  });
}

// engine move
function think() {
  if (isGameOver()) {updatePgn(); return;}
  
  if (document.getElementById('editMode').checked == true) return;
  engine.resetTimeControl();

  let timing = engine.getTimeControl();
  let startTime = new Date().getTime();
  
  if (fixedTime) {
    fixedDepth = 64;
    timing.timeSet = 1;
    timing.time = fixedTime * 1000;
    timing.stopTime = startTime + timing.time
    engine.setTimeControl(timing);
  }
  
  let bookMoveFlag = 0;
  let delayMove = 0;
  let bestMove = getBookMove();

  if (botName == 'Baihua') {
    let moves = engine.generateLegalMoves();
    try { bestMove = moves[Math.floor(Math.random() * moves.length)].move;
    } catch(e) {}
  } else {
    if (bestMove) bookMoveFlag = 1;
    else if (bestMove == 0) bestMove = engine.search(fixedDepth);
  }
  
  if (bestMove == 0) return;
  if (bookMoveFlag || fixedDepth || typeof(guiScore) == 'string') delayMove = 1000;
  
  let sourceSquare = engine.getSourceSquare(bestMove);
  let targetSquare = engine.getTargetSquare(bestMove);

  setTimeout(function() {
    movePiece(sourceSquare, targetSquare);
    drawBoard();
 
    if (engine.getPiece(targetSquare)) {
      document.getElementById(targetSquare).style.backgroundColor = SELECT_COLOR;             
      playSound(bestMove);
      updatePgn();
      userTime = Date.now();
    }
  
  }, delayMove);
}

// move piece in GUI
function movePiece(userSource, userTarget) {
  let moveString = engine.squareToString(userSource) +
                   engine.squareToString(userTarget);

  if (isGameOver() == 0) engine.loadMoves(moveString);
  else updatePgn();
  drawBoard();
}

// take move back
function undo() {
  gameResult = '*';
  try {
    engine.takeBack();
    drawBoard();
  } catch(e) {}
}

// validate move
function validateMove(userSource, userTarget) {
  let moveString = engine.squareToString(userSource) + 
                   engine.squareToString(userTarget);

  let move = engine.moveFromString(moveString);
  return move;
}


/****************************\
 ============================

             PGN

 ============================              
\****************************/

// get pgn
function getGamePgn() {
  let moveStack = engine.moveStack();
  let pgn = '';

  for (let index = 0; index < moveStack.length; index++) {
    let move = moveStack[index].move;
    let moveScore = moveStack[index].score;
    let moveDepth = moveStack[index].depth;
    let moveTime = moveStack[index].time;
    let movePv = moveStack[index].pv;
    let moveString = engine.moveToString(move);
    let moveNumber = ((index % 2) ? '': ((index / 2 + 1) + '. '));
    let displayScore = (((moveScore / 100) == 0) ? '-0.00' : (moveScore / 100)) + '/' + moveDepth + ' ';
    
    if (displayScore.toString().includes('NaN') && moveScore.includes('M'))
      displayScore = moveScore.replace('M', 'mate in ') + ' # ';
    
    let stats = (movePv ? '(' + movePv.trim() + ')' + ' ': '') + 
                (moveDepth ? ((moveScore > 0) ? ('+' + displayScore) : displayScore): '') +
                Math.round(moveTime / 1000);
    
    let nextMove = moveNumber + moveString + (moveTime ? ' {' + stats + '}' : '');
    
    pgn += nextMove + ' ';
    userTime = 0;      
  }

  return pgn;
}

// update PGN
function updatePgn() {
  let pgn = getGamePgn();
  let gameMoves = document.getElementById('pgn');
  
  gameMoves.value = pgn;
  
  if (gameResult == '1-0 Mate' || gameResult == '0-1 Mate') {
    gameMoves.value += '# ' + gameResult;
  } else if (gameResult != '*') {
    gameMoves.value += ' ' + gameResult;
  }
  
  gameMoves.scrollTop = gameMoves.scrollHeight;
}

// download PGN
function downloadPgn() {
  let userName = prompt('Enter your name:', 'Player');
  if (userName == null) return;
  let userColor = (guiSide == 0) ? 'White' : 'Black';
  
  if (userColor != 'White' && userColor != 'Black') {
    alert('Wrong color, please try again');
    return;
  }

  let header = '';
  if (guiFen) header += '[FEN "' + guiFen + '"]\n';
  header += '[Event "Friendly chess game"]\n';
  header += '[Site "https://maksimkorzh.github.io/wukong-xiangqi/src/gui/xiangqi.html"]\n';
  header += '[Date "' + new Date() + '"]\n';
  header += '[White "' + ((userColor == 'White') ? userName : botName) + '"]\n';
  header += '[Black "' + ((userColor == 'Black') ? userName : botName) + '"]\n';
  header += '[Variant "xiangqi"]\n';
  header += '[Result "' + gameResult + '"]\n\n';

  let downloadLink = document.createElement('a');
  downloadLink.id = 'download';
  downloadLink.download = ((userColor == 'White') ? (userName + '_vs_' + botName + '.pgn') : (botName + '_vs_' + userName + '.pgn'));
  downloadLink.hidden = true;
  downloadLink.href = window.URL.createObjectURL( new Blob([header + getGamePgn() + ((gameResult == '*') ? ' *' : '')], {type: 'text'}));
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}


/****************************\
 ============================

        GAME CONTROLS

 ============================              
\****************************/

// start new game
function newGame() {
  guiScore = 0;
  guiDepth = 0;
  guiTime = 0;
  guiPv = '';
  gameResult = '';
  userTime = 0;
  allowBook = 1;
  engine.setBoard(engine.START_FEN);
  drawBoard();
  //document.getElementById('pgn').value = '';
  repetitions = 0;
}

/****************************\
 ============================

          ON STARTUP

 ============================              
\****************************/

newGame();
//setBot('Wukong');

//document.getElementById('xiangqiboard').style.disabled = true;
//document.getElementById('pgn').value = 'Waiting for opponent to connect...';

// extract gameId and side to move from currrent URL
let gameId = window.location.href.split('board/')[1].split('?')[0];
let playerColor = window.location.href.split('side=')[1];

// flip board from side to move perspective
playerColor == 'red' ? 0 : flipBoard();

// connect to server
$.post( "/board", {gameId: gameId, side: (flip ? 'black' : 'red'), move: 'connect'}, function(response) {
  console.log('HTTP server response:', response)
  
  // "listen" to board update
  var interval = 1000;  // 1000 = 1 second, 3000 = 3 seconds
  function receiveMove() {
      $.get('/board?gameId=' + gameId + '&side=none&move=get', function(response) {
        let parseResponse = JSON.parse(response);
        console.log('UDP GET response:', parseResponse);
        if (parseResponse.red == false && parseResponse.red == false) {
          window.location.href = '/';
          alert('Opponent has disconnected');
        }
        try {
          let lastMove = parseResponse.moves[parseResponse.moves.length - 1];
          let oldMoveStackLength = engine.moveStack().length;
          engine.loadMoves(engine.moveToString(lastMove));
          let newMoveStackLength = engine.moveStack().length;
          if (newMoveStackLength > oldMoveStackLength) {
            drawBoard();
            document.getElementById(engine.getTargetSquare(lastMove)).style.backgroundColor = SELECT_COLOR;
            playSound(lastMove);
            
            if (engine.generateLegalMoves().length == 0) {
              gameResult = (engine.getSide() ? '1-0' : '0-1') + ' mate';
              
              // is game over ?
              if (playerColor == 'red' && gameResult == '1-0 mate') alert('You win!');
              if (playerColor == 'red' && gameResult == '0-1 mate') alert('You lose!');
              if (playerColor == 'black' && gameResult == '0-1 mate') alert('You win!');
              if (playerColor == 'black' && gameResult == '1-0 mate') alert('You lose!');
            }
          }
        } catch(e) {console.log('error updating move:', e)}
      });
      setTimeout(receiveMove, interval);
  }
  setTimeout(receiveMove, interval);
});

// disconnect when leave
window.addEventListener('beforeunload', (event) => {
  // send move to the server
  $.post( "/board", {gameId: gameId, move: 'disconnect', side: playerColor}, function(response) {
    console.log('UDP POST response:', response)
  });
});





