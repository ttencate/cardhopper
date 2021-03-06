'use strict'

// -----------------------------------------------------------------------------
// GAME
// -----------------------------------------------------------------------------

const N = 8
const HOLE_COORD = makeCoord(2, 3)
const [MIN_CARD, MAX_CARD] = [1, 9]

const HOLE = -1
const STEPS = [[-1, 0], [-1, 1], [0, -1], [0, 0], [0, 1], [1, -1], [1, 0]]
const WON = 1
const LOST = -1
const UNDECIDED = 0

class Game {
  constructor(seed) {
    const rng = new PcgRandom(seed)
    this.board = Game.randomBoard(rng)
    this.pawns = [
      makeCoord(0, 0),
      makeCoord(0, N - 1),
      makeCoord(N - 1, 0),
    ]
  }

  static randomBoard(rng) {
    const cards = []
    const cardsNeeded = N * (N + 1) / 2 - 1
    while (cards.length < cardsNeeded) {
      for (let card = MIN_CARD; card <= MAX_CARD; card++) {
        cards.push(card)
      }
    }
    shuffle(cards, rng)

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

function solve(game) {
  // For each card, precalculate and cache shortest possible route length to
  // the hole for use in A* heuristic.
  // https://www.redblobgames.com/grids/hexagons/#distances-axial
  const [hi, hj] = unmakeCoord(HOLE_COORD)
  const distancesToHole = game.board.map((_, coord) => {
    const [ci, cj] = unmakeCoord(coord)
    return (
      Math.abs(ci - hi) +
      Math.abs(ci + cj - hi - hj) +
      Math.abs(cj - hj)
    ) / 2
  })
  function minRemainingSteps(pawns) {
    let steps = 0
    for (const pawn of pawns) {
      steps += distancesToHole[pawn]
    }
    return steps
  }

  const origPawns = game.pawns
  const queue = new Heap(
    [[minRemainingSteps(game.pawns), game.pawns, []]],
    function(a, b) {
      return a[0] - b[0]
    }
  )
  const visited = new Set()
  let solution = null
  while (!queue.isEmpty()) {
    const [heuristic, pawns, steps] = queue.pop()
    if (pawns.length == 0) {
      solution = steps
      break
    }

    let pawnBits = 0n
    for (const pawn of pawns) {
      pawnBits |= 1n << BigInt(pawn)
    }
    if (visited.has(pawnBits)) {
      continue
    }
    visited.add(pawnBits)

    pawns.forEach((_, pawn) => {
      game.pawns = pawns
      const validMoves = game.validMovesFor(pawn)
      for (const move of validMoves) {
        game.pawns = [...pawns]
        game.move(pawn, move)
        const nextPawns = game.pawns
        const nextSteps = [...steps, [pawn, move]]
        const nextHeuristic = nextSteps.length + minRemainingSteps(nextPawns)
        queue.push([nextHeuristic, nextPawns, nextSteps])
      }
    })
  }
  game.pawns = origPawns
  return solution
}

let crunchTimer = null

function crunch() {
  if (crunchTimer === null) {
    const output = document.getElementById('crunch')
    console.log('Starting crunch, run crunch() again to stop')
    const seeds = new PcgRandom()
    let count = 0
    let unstartable = 0
    let unwinnable = 0
    let winnable = 0
    let seedsBySteps = []
    crunchTimer = setTimeout(function tickCrunch() {
      const seed = seeds.next32()
      const game = new Game(seed)
      if (game.checkEnd() == LOST) {
        unstartable++
      }
      const solution = solve(game)
      if (solution) {
        winnable++
        seedsBySteps[solution.length] = seedsBySteps[solution.length] || []
        seedsBySteps[solution.length].push(seed)
      } else {
        unwinnable++
      }
      count++
      if (count % 10 == 0) {
        output.innerText = [
          `Total:       ${count}`,
          `Unstartable: ${unstartable} = ${(unstartable / count * 100).toFixed(1)}%`,
          `Unwinnable:  ${unwinnable} = ${(unwinnable / count * 100).toFixed(1)}%`,
          `Winnable:    ${winnable} = ${(winnable / count * 100).toFixed(1)}%`,
          `Step counts: ${seedsBySteps.map((c, s) => c ? `${s}: ${c.length}` : '').filter((str) => !!str).join(', ')}`,
          `Seeds for ${seedsBySteps.length - 1} steps: ${seedsBySteps[seedsBySteps.length - 1].slice(0, 5).join(', ')}`,
        ].join('\n')
      }
      crunchTimer = setTimeout(tickCrunch, 0)
    }, 0)
  } else {
    console.log('Stopping crunch')
    clearTimeout(crunchTimer)
    crunchTimer = null
  }
}

// -----------------------------------------------------------------------------
// UTILS
// -----------------------------------------------------------------------------

function shuffle(array, rng) {
  const n = array.length;
  for (let i = 0; i < n; i++) {
    const j = i + rng.integer(n - i)
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
let undoStack

function onCardClick(e) {
  const cardDiv = e.target
  const coord = parseInt(cardDiv.dataset.coord)
  if (game.pawns.includes(coord)) {
    const clickedPawn = game.pawns.indexOf(coord)
    selected = clickedPawn == selected ? null : clickedPawn
  } else if (selected !== null) {
    const validMoves = game.validMovesFor(selected)
    if (validMoves.includes(coord)) {
      undoStack.push(game.pawns.slice())
      game.move(selected, coord)
    }
    selected = null
  }
  updateUi()
}

function updateUi() {
  game.board.forEach((card, coord) => {
    const cardDiv = document.getElementById(`card_${coord}`)
    cardDiv.classList.toggle('pawn', game.pawns.includes(coord))
    cardDiv.classList.toggle('selected', game.pawns[selected] == coord)
    cardDiv.classList.toggle('valid', selected !== null && game.validMovesFor(selected).includes(coord))
    cardDiv.classList.toggle('some-valid', game.pawns.some((_, pawn) => game.validMovesFor(pawn).includes(coord)))
    cardDiv.classList.remove('hint-from')
    cardDiv.classList.remove('hint-to')
  })

  document.getElementById('undo-button').disabled = undoStack.length == 0

  const end = game.checkEnd()
  document.getElementById('end').classList.toggle('hidden', end == UNDECIDED)
  if (end == WON) {
    document.getElementById('endtext').innerText = 'You won!'
  } else if (end == LOST) {
    document.getElementById('endtext').innerText = 'Out of moves!'
  }
}

function newGame() {
  if (undoStack.length == 0 || game.checkEnd() != UNDECIDED || window.confirm('Are you sure you want to abort your current game?')) {
    window.location.hash = ''
    restart()
  }
}

function showHint() {
  const solution = solve(game)
  if (solution) {
    const [pawn, coord] = solution[0]
    document.getElementById(`card_${coord}`).classList.add('hint-from')
    document.getElementById(`card_${game.pawns[pawn]}`).classList.add('hint-to')
  } else {
    let solvable
    if (undoStack.length > 0) {
      const origPawns = [...game.pawns]
      game.pawns = undoStack[0]
      solvable = !!solve(game)
      game.pawns = origPawns
    } else {
      solvable = false
    }
    if (solvable) {
      alert('The game cannot be won from this position, but there is another way. Undo some moves and try a different route.')
    } else {
      if (confirm('This appears to be one of those 12-13% of games that are unwinnable. Too bad! Start a new game?')) {
        window.location.hash = ''
        restart()
      }
    }
  }
}

function undo() {
  if (undoStack.length > 0) {
    game.pawns = undoStack.pop()
    updateUi()
  }
}

function restart() {
  let seed
  if (/#[0-9]{1,10}/.test(window.location.hash)) {
    seed = parseInt(window.location.hash.substr(1))
  } else {
    seed = Math.floor(Math.random() * 0xffffffff)
    window.location.hash = `#${seed}`
  }

  game = new Game(seed)
  selected = null
  undoStack = []

  const boardDiv = document.getElementById('board')
  boardDiv.innerHTML = ''
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

  updateUi()

  const solution = solve(game)
  if (solution) {
    const lines = [`Solvable in ${solution.length} steps:`]
    solution.forEach(([pawn, coord]) => {
      const card = game.board[coord]
      if (card == HOLE) {
        lines.push(`Pawn ${pawn + 1} into the hole (subsequent pawns now renumbered)`)
      } else {
        const [i, j] = unmakeCoord(coord)
        lines.push(`Pawn ${pawn + 1} to the (${card}) at row ${i + 1}, column ${j + 1}`)
      }
    })
    console.log(lines.join('\n'))
  } else {
    console.log('Unsolvable')
  }
}

function init() {
  document.getElementById('new-game-button').addEventListener('click', newGame)
  document.getElementById('hint-button').addEventListener('click', showHint)
  document.getElementById('undo-button').addEventListener('click', undo)
  document.getElementById('restart-button').addEventListener('click', function() {
    window.location.hash = ''
    restart()
  })

  restart()
}

document.addEventListener('DOMContentLoaded', init)
