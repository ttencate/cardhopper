'use strict'

// -----------------------------------------------------------------------------
// GAME
// -----------------------------------------------------------------------------

const N = 7
const HOLE_COORD = makeCoord(2, 2)
const [MIN_CARD, MAX_CARD] = [1, 9]

const HOLE = -1
const STEPS = [[-1, 0], [-1, 1], [0, -1], [0, 0], [0, 1], [1, -1], [1, 0]]
const WON = 1
const LOST = -1
const UNDECIDED = 0

class Game {
  constructor() {
    this.board = Game.randomBoard()
    this.pawns = [
      makeCoord(0, 0),
      makeCoord(0, N - 1),
      makeCoord(N - 1, 0),
    ]
  }

  static randomBoard() {
    const cards = []
    const cardsNeeded = N * (N + 1) / 2 - 1
    while (cards.length < cardsNeeded) {
      for (let card = MIN_CARD; card <= MAX_CARD; card++) {
        cards.push(card)
      }
    }
    shuffle(cards)

    const board = []
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N - i; j++) {
        let coord = makeCoord(i, j)
        board[coord] = coord == HOLE_COORD ? HOLE : cards.pop()
      }
    }
    return board
  }

  validMovesFor(pawn) {
    const validDestinations = [HOLE]
    for (let p = 0; p < this.pawns.length; p++) {
      if (p != pawn) {
        const card = this.board[this.pawns[p]]
        validDestinations.push(card == MIN_CARD ? MAX_CARD : card - 1)
        validDestinations.push(card == MAX_CARD ? MIN_CARD : card + 1)
      }
    }

    const [i, j] = unmakeCoord(this.pawns[pawn])
    const moves = []
    for (const [di, dj] of STEPS) {
      const [ni, nj] = [i + di, j + dj]
      if (ni >= 0 && ni < N && nj >= 0 && nj < N) {
        const nc = makeCoord(ni, nj)
        if (validDestinations.includes(this.board[nc]) && !this.pawns.includes(nc)) {
          moves.push(nc)
        }
      }
    }
    return moves
  }

  move(pawn, coord) {
    if (this.board[coord] == HOLE) {
      this.pawns.splice(pawn, 1)
    } else {
      this.pawns[pawn] = coord
    }
  }

  checkEnd() {
    if (this.pawns.length == 0) {
      return WON
    }
    if (this.pawns.every((_, pawn) => this.validMovesFor(pawn).length == 0)) {
      return LOST
    }
    return UNDECIDED
  }
}

// -----------------------------------------------------------------------------
// UTILS
// -----------------------------------------------------------------------------

function shuffle(array) {
  const n = array.length;
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (n - i))
    const tmp = array[i]
    array[i] = array[j]
    array[j] = tmp
  }
  return array
}

function makeCoord(i, j) {
  return i * N + j
}

function unmakeCoord(coord) {
  return [Math.floor(coord / N), coord % N]
}

// -----------------------------------------------------------------------------
// UI
// -----------------------------------------------------------------------------

let game
let selected

function onCardClick(e) {
  const cardDiv = e.target
  const coord = parseInt(cardDiv.dataset.coord)
  if (game.pawns.includes(coord)) {
    const clickedPawn = game.pawns.indexOf(coord)
    selected = clickedPawn == selected ? null : clickedPawn
  } else if (selected !== null) {
    const validMoves = game.validMovesFor(selected)
    if (validMoves.includes(coord)) {
      game.move(selected, coord)
      showEnd(game.checkEnd())
    }
    selected = null
  }
  updateDivs()
}

function showEnd(end) {
  if (end == WON) {
    document.getElementById('endtext').innerText = 'You won!'
    document.getElementById('end').classList.remove('hidden')
  } else if (end == LOST) {
    document.getElementById('endtext').innerText = 'Out of moves!'
    document.getElementById('end').classList.remove('hidden')
  }
}

function updateDivs() {
  game.board.forEach((card, coord) => {
    const cardDiv = document.getElementById(`card_${coord}`)
    cardDiv.classList.toggle('pawn', game.pawns.includes(coord))
    cardDiv.classList.toggle('selected', game.pawns[selected] == coord)
    cardDiv.classList.toggle('valid', selected !== null && game.validMovesFor(selected).includes(coord))
    cardDiv.classList.toggle('somevalid', game.pawns.some((_, pawn) => game.validMovesFor(pawn).includes(coord)))
  })
}

function init() {
  game = new Game()
  selected = null

  const boardDiv = document.getElementById('board')
  game.board.forEach((card, coord) => {
    const [i, j] = unmakeCoord(coord)
    const cardDiv = document.createElement('div')
    cardDiv.innerText = card == HOLE ? ' ' : `${card}`
    cardDiv.classList.add('card')
    cardDiv.classList.toggle('hole', card == HOLE)
    cardDiv.id = `card_${coord}`
    cardDiv.dataset.coord = coord.toString()
    cardDiv.style.left = `${(j * Math.sqrt(3) / 2).toFixed(7)}rem`
    cardDiv.style.top = `${i + 0.5 * j}rem`
    cardDiv.addEventListener('click', onCardClick)
    boardDiv.appendChild(cardDiv)
  })
  updateDivs()
  showEnd(game.checkEnd())
}

document.addEventListener('DOMContentLoaded', init)
