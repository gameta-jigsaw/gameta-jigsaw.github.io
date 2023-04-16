const canvas = document.getElementById('puzzleCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 4;
const pieceSize = canvas.width / gridSize;

const referenceCanvas = document.getElementById('referenceCanvas');
const referenceCtx = referenceCanvas.getContext('2d');
const referencePieceSize = referenceCanvas.width / gridSize;

let timerInterval;
let startTime;
let isTimerStarted = false;

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const resizedImg = resizeImageToFitPuzzleArea(img);
      resolve(resizedImg);
    };
    img.src = src;
  });
}

(async () => {
  const resizedImg = await loadImage(`./${window.imgName}.jpg`);
  initPuzzle(resizedImg);
  drawReferencePuzzle(resizedImg);
})();

function initPuzzle(resizedImg) {
  const pieces = createShuffledPieces();
  drawPieces(pieces, resizedImg);

  canvas.addEventListener('click', (event) => {
    if (!isTimerStarted) {
      startTimer();
      isTimerStarted = true;
    }

    const [x, y] = getClickedPosition(event);
    const clickedPieceIndex = findPieceAtPosition(pieces, x, y);
    if (clickedPieceIndex !== -1) {
      const emptyPieceIndex = findEmptyPiece(pieces);
      if (areNeighbors(clickedPieceIndex, emptyPieceIndex, gridSize)) {
        swapPieces(pieces, clickedPieceIndex, emptyPieceIndex);
        drawPieces(pieces, resizedImg);
      }
    }
  });
}

function drawReferencePuzzle(resizedImg) {
  const refCtx = referenceCanvas.getContext('2d');
  const refGridSize = gridSize * 2; // Scale down the gridSize for the reference puzzle
  const refPieceSize = referenceCanvas.width / refGridSize;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (row === gridSize - 1 && col === gridSize - 1) {
        continue; // Skip the bottom-right piece
      }

      const sx = col * pieceSize;
      const sy = row * pieceSize;
      const dx = col * refPieceSize;
      const dy = row * refPieceSize;
      const gap = 1; // Adjust the size of the gap between pieces for the reference puzzle

      refCtx.drawImage(
        resizedImg,
        sx,
        sy,
        pieceSize - gap,
        pieceSize - gap,
        dx,
        dy,
        refPieceSize - gap,
        refPieceSize - gap
      );
    }
  }
}

function startTimer() {
  startTime = new Date();
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  const currentTime = new Date();
  const elapsedTime = Math.floor((currentTime - startTime) / 1000);
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  document.getElementById('timer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function stopTimer() {
  clearInterval(timerInterval);
}

function createShuffledPieces() {
  const pieceCount = gridSize * gridSize;
  const pieces = Array.from({ length: pieceCount }, (_, i) => i).sort(() => Math.random() - 0.5);
  if (!isSolvable(pieces, gridSize)) {
    const nonEmptyIndices = pieces.filter(i => i !== pieceCount - 1);
    swapPieces(pieces, nonEmptyIndices[0], nonEmptyIndices[1]);
  }
  return pieces;
}

function drawPieces(pieces, resizedImg) {
  drawPiecesOnCanvas(ctx, pieces, resizedImg, pieceSize);
}

function drawPiecesOnCanvas(ctx, pieces, resizedImg, pieceSize) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  pieces.forEach((piece, index) => {
    if (piece === gridSize * gridSize - 1) return;
    const sx = piece % gridSize * pieceSize;
    const sy = Math.floor(piece / gridSize) * pieceSize;
    const dx = index % gridSize * pieceSize;
    const dy = Math.floor(index / gridSize) * pieceSize;
    const gap = 2; // Change this value to adjust the size of the gap between pieces
    ctx.drawImage(resizedImg, sx, sy, pieceSize - gap, pieceSize - gap, dx, dy, pieceSize - gap, pieceSize - gap);
  });
}

function getClickedPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return [x, y];
}

function findPieceAtPosition(pieces, x, y) {
  const row = Math.floor(y / pieceSize);
  const col = Math.floor(x / pieceSize);
  const index = row * gridSize + col;
  return pieces[index] === gridSize * gridSize - 1 ? -1 : index;
}

function findEmptyPiece(pieces) {
  return pieces.findIndex(piece => piece === gridSize * gridSize - 1);
}

function areNeighbors(index1, index2, gridSize) {
  const row1 = Math.floor(index1 / gridSize);
  const col1 = index1 % gridSize;
  const row2 = Math.floor(index2 / gridSize);
  const col2 = index2 % gridSize;
  return (Math.abs(row1 - row2) === 1 && col1 === col2) || (Math.abs(col1 - col2) === 1 && row1 === row2);
}

function swapPieces(pieces, index1, index2) {
  [pieces[index1], pieces[index2]] = [pieces[index2], pieces[index1]];
}

function isSolvable(pieces, gridSize) {
  let inversions = 0;
  for (let i = 0; i < pieces.length - 1; i++) {
    if (pieces[i] === gridSize * gridSize - 1) continue;
    for (let j = i + 1; j < pieces.length; j++) {
      if (pieces[j] === gridSize * gridSize - 1) continue;
      if (pieces[i] > pieces[j]) inversions++;
    }
  }
  return gridSize % 2 === 1 ? inversions % 2 === 0 : Math.floor(pieces.indexOf(gridSize * gridSize - 1) / gridSize) % 2 === inversions % 2;
}

function resizeImageToFitPuzzleArea(image) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.height = 400; // Puzzle area size

  const scaleFactor = Math.min(canvas.width / image.width, canvas.height / image.height);
  const width = image.width * scaleFactor;
  const height = image.height * scaleFactor;
  const offsetX = (canvas.width - width) / 2;
  const offsetY = (canvas.height - height) / 2;

  ctx.drawImage(image, offsetX, offsetY, width, height);
  const resizedImg = new Image();
  resizedImg.src = canvas.toDataURL();
  return resizedImg;
}
