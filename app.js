import { toDOM, toJSON } from "./domToJson.js";
// Connexion au serveur via socket io
let socket = io.connect('http://localhost:8080/');

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.grid')
  const gridP2 = document.querySelector('.grid2')
  const miniGrid = document.querySelector('.mini-grid')
  const miniGridP2 = document.querySelector('.mini-grid2')
  let squares = Array.from(document.querySelectorAll('.grid div'))
  const scoreDisplay = document.querySelector('#score')
  const scoreDisplayP2 = document.querySelector('#scoreP2')
  const width = 10
  let nextRandom = 0
  let timerId
  let score = 0
  const colors = [
    'orange',
    'red',
    'purple',
    'green',
    'blue'
  ]

  // Les formes
  const lTetromino = [
    [1, width+1, width*2+1, 2],
    [width, width+1, width+2, width*2+2],
    [1, width+1, width*2+1, width*2],
    [width, width*2, width*2+1, width*2+2]
  ]

  const zTetromino = [
    [0,width,width+1,width*2+1],
    [width+1, width+2,width*2,width*2+1],
    [0,width,width+1,width*2+1],
    [width+1, width+2,width*2,width*2+1]
  ]

  const tTetromino = [
    [1,width,width+1,width+2],
    [1,width+1,width+2,width*2+1],
    [width,width+1,width+2,width*2+1],
    [1,width,width+1,width*2+1]
  ]

  const oTetromino = [
    [0,1,width,width+1],
    [0,1,width,width+1],
    [0,1,width,width+1],
    [0,1,width,width+1]
  ]

  const iTetromino = [
    [1,width+1,width*2+1,width*3+1],
    [width,width+1,width+2,width+3],
    [1,width+1,width*2+1,width*3+1],
    [width,width+1,width+2,width+3]
  ]

  const theTetrominoes = [lTetromino, zTetromino, tTetromino, oTetromino, iTetromino]

  let currentPosition = 4
  let currentRotation = 0

  console.log(theTetrominoes[0][0])

  // Selection random d'une forme et de sa rotation
  let random = Math.floor(Math.random()*theTetrominoes.length)
  let current = theTetrominoes[random][currentRotation]

  // Fonction de dessin
  function draw() {
    current.forEach(index => {
      squares[currentPosition + index].classList.add('tetromino')
      squares[currentPosition + index].style.backgroundColor = colors[random]
    })
  }

  // Fonction qui permet d'effacer le dessin
  function undraw() {
    current.forEach(index => {
      squares[currentPosition + index].classList.remove('tetromino')
      squares[currentPosition + index].style.backgroundColor = ''

    })
  }

  // Fonction d'assignement en fonction de l'eventlistener
  function control(e) {
    if(e.keyCode === 37) {
      moveLeft()
    } else if (e.keyCode === 38) {
      rotate()
    } else if (e.keyCode === 39) {
      moveRight()
    } else if (e.keyCode === 40) {
      moveDown()
    }
  }
  document.addEventListener('keyup', control)

  // Accélération de la descente
  function moveDown() {
    undraw()
    currentPosition += width
    draw()
    freeze()
    console.log(scoreDisplay.innerHTML.toString());
    socket.emit("sendGrid", toJSON(grid));
    socket.emit("sendScore", scoreDisplay.innerHTML);
  }

  // Fonction de freeze d'une forme
  function freeze() {
    if(current.some(index => squares[currentPosition + index + width].classList.contains('taken'))) {
      current.forEach(index => squares[currentPosition + index].classList.add('taken'))
      // Une nouvelle forme tombe
      random = nextRandom
      nextRandom = Math.floor(Math.random() * theTetrominoes.length)
      current = theTetrominoes[random][currentRotation]
      currentPosition = 4
      draw()
      displayShape()
      addScore()
      gameOver()
    }
  }

  // Fonction pour aller vers la gauche si c'est possible
  function moveLeft() {
    undraw()
    const isAtLeftEdge = current.some(index => (currentPosition + index) % width === 0)
    if(!isAtLeftEdge) currentPosition -=1
    if(current.some(index => squares[currentPosition + index].classList.contains('taken'))) {
      currentPosition +=1
    }
    draw()
    socket.emit("sendGrid", toJSON(grid));
    socket.emit("sendScore", scoreDisplay.innerHTML);
  }

  // Fonction pour aller vers la droite si c'est possible
  function moveRight() {
    undraw()
    const isAtRightEdge = current.some(index => (currentPosition + index) % width === width -1)
    if(!isAtRightEdge) currentPosition +=1
    if(current.some(index => squares[currentPosition + index].classList.contains('taken'))) {
      currentPosition -=1
    }
    draw()
    socket.emit("sendGrid", toJSON(grid));
    socket.emit("sendScore", scoreDisplay.innerHTML);
  }

  function isAtRight() {
    return current.some(index=> (currentPosition + index + 1) % width === 0)
  }

  function isAtLeft() {
    return current.some(index=> (currentPosition + index) % width === 0)
  }

  function checkRotatedPosition(P){
    P = P || currentPosition
    if ((P+1) % width < 4) {
      if (isAtRight()){
        currentPosition += 1
        checkRotatedPosition(P)
        }
    }
    else if (P % width > 5) {
      if (isAtLeft()){
        currentPosition -= 1
      checkRotatedPosition(P)
      }
    }
  }

  // Fonction de rotation pour passer d'une forme à une autre, si c'est possible
  function rotate() {
    undraw()
    currentRotation ++
    if(currentRotation === current.length) {
      currentRotation = 0
    }
    current = theTetrominoes[random][currentRotation]
    checkRotatedPosition()
    draw()
    console.log(grid);
    socket.emit("sendGrid", toJSON(grid));
    socket.emit("sendScore", scoreDisplay.innerHTML);
  }
  /////////

  const displaySquares = document.querySelectorAll('.mini-grid div')
  const displayWidth = 4
  const displayIndex = 0

  // Les formes basiques
  const upNextTetrominoes = [
    [1, displayWidth+1, displayWidth*2+1, 2], //lTetromino
    [0, displayWidth, displayWidth+1, displayWidth*2+1], //zTetromino
    [1, displayWidth, displayWidth+1, displayWidth+2], //tTetromino
    [0, 1, displayWidth, displayWidth+1], //oTetromino
    [1, displayWidth+1, displayWidth*2+1, displayWidth*3+1] //iTetromino
  ]

  // Fonction qui permet d'afficher les formes dans la MiniGrid
  function displayShape() {
    displaySquares.forEach(square => {
      square.classList.remove('tetromino')
      square.style.backgroundColor = ''
    })
    upNextTetrominoes[nextRandom].forEach( index => {
      displaySquares[displayIndex + index].classList.add('tetromino')
      displaySquares[displayIndex + index].style.backgroundColor = colors[nextRandom]
    })
    socket.emit("sendMiniGrid", toJSON(miniGrid));
  }

  // Dès que l'on reçoit le message "startGame", on lance le jeu
  socket.on("startGame", function(){
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    } else {
      draw()
      timerId = setInterval(moveDown, 1000)
      nextRandom = Math.floor(Math.random()*theTetrominoes.length)
      displayShape()
    }
  })

  // Fonction qui permet d'update le score
  function addScore() {
    for (let i = 0; i < 199; i += width) {
      const row = [i, i+1, i+2, i+3, i+4, i+5, i+6, i+7, i+8, i+9];

      if(row.every(index => squares[index].classList.contains('taken'))) {
        score += 10;
        scoreDisplay.innerHTML = score;
        row.forEach(index => {
          squares[index].classList.remove('taken');
          squares[index].classList.remove('tetromino');
          squares[index].style.backgroundColor = '';
        })
        const squaresRemoved = squares.splice(i, width);
        squares = squaresRemoved.concat(squares);
        squares.forEach(cell => grid.appendChild(cell));
      }
    }
  }

  // Fonction de GameOver
  function gameOver() {
    if(current.some(index => squares[currentPosition + index].classList.contains('taken'))) {
      scoreDisplay.innerHTML = 'end'
      clearInterval(timerId)
    }
  }

  // On reçoit le message "gridPlayer2" qui contient l'objet de la grid de l'adversaire, on peut alors update la grille
  socket.on("gridPlayer2", function(newGrid){
    newGrid = toDOM(newGrid)
    newGrid.className = "grid2"
    gridP2.innerHTML = newGrid.innerHTML
  });

  // On reçoit le message "scorePlayer2" qui contient l'objet du score de l'adversaire, on peut alors update le score
  socket.on("scorePlayer2", function(newScore){
    scoreDisplayP2.innerHTML = newScore;
  });

  // On reçoit le message "miniGridPlayer2" qui contient l'objet de la minigrid de l'adversaire, on peut alors update la mini grille
  socket.on("miniGridPlayer2", function(newMiniGrid){
    newMiniGrid = toDOM(newMiniGrid)
    newMiniGrid.className = "mini-grid2"
    miniGridP2.innerHTML = newMiniGrid.innerHTML
  });

})
