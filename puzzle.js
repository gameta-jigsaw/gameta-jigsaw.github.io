const canvas = document.getElementById('puzzleCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 4;
const pieceSize = canvas.width / gridSize;
const img = new Image();
img.src = `./${window.imgName}.jpg`;

img.onload = function () {
    const resizedImg = resizeImageToFitPuzzleArea(img);
    const pieces = createShuffledPieces();
    drawPieces(pieces, resizedImg);

    canvas.addEventListener('click', (event) => {
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
};

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

