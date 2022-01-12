// klasa w której są wszystkie funkcje związane z planszą, rysowaniem, kontrolą stanu planszy
const boardcontroller = {

  // wypełnij kwadraty planszy
  fillSquare: function (x, y, color = 'rgb(91, 171, 113)', ctx = 'boardlayer') {
    const board = document.getElementById(ctx);
    if (board.getContext) {
      const ctxB = board.getContext('2d');
      ctxB.fillStyle = color;
      ctxB.fillRect(x * 80, y * 80, 80, 80);
    }
  },

  // narysuj planszę
  drawBoard: function () {
    this.boardlayer.getContext('2d').clearRect(0, 0, 640, 640);
    let count = 1;
    let currentwhite = true;
    let lane = 8;
    for (let y = 0; y < 8; y += 1) {
      if (lane % 2 == 0) currentwhite = true;
      else currentwhite = false;
      for (let x = 0; x < 8; x += 1) {
        if (currentwhite) {
          currentwhite = false;
        }
        else {
          this.fillSquare(x, y, 'rgb(0,0,0)')
          currentwhite = true;
        }
      }
      lane = lane - 1;
    }
  },

  // narysuj - umieść rycerza
  drawKnight: function (x, y) {
    const figurelayer = document.getElementById('figurelayer');
    const ctxF = figurelayer.getContext('2d');
    ctxF.clearRect(0, 0, 640, 640);
    const img = new Image();
    img.onload = function () {
      ctxF.drawImage(img, x, y, 60, 60);
    }
    img.src = 'knight.png';
  },

  // funkcja wywołuje draw knight i umieszcza go na środku klikniętego pola
  drawFigure: function (horizontal, vertical) {
    const x = 80 * horizontal + 10;
    const y = 80 * vertical + 10;
    this.drawKnight(x, y);
  },

  // narysuj liczbę z kolejnością pola, jeśli opcja jest włączona
  drawNumber: function (x, y, value, color = "red") {
    const ctxF = figurelayer.getContext('2d');
    ctxF.font = "30px Arial";
    ctxF.fillStyle = color;
    ctxF.fillText(value.toString(), x * 80 + 30, y * 80 + 50);
  },

  // narysuj linię wizualizującą ścieżkę
  drawLineLinkingSquares: function (x1, y1, x2, y2) {
    const ctx = this.figurelayer.getContext('2d');
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x1 * 80 + 40, y1 * 80 + 40);
    ctx.lineTo(x2 * 80 + 40, y2 * 80 + 40);
    ctx.stroke();
  },

  // zmapuj punkt (współrzędne danego pola wyrażonych w pikselach) na numer pola
  mapPointToId: function (point) {
    const id = point.x + 8 * point.y;
    return id;
  },

  // zmapuj punkt na parę współrzędnych szachowych
  mapToChessPoint: function (point) {
    const letters = "abcdefgh";
    return letters[point.x].toString() + (8 - point.y).toString();
  },

  getClickedSquareCoo: function (canvas, event) {
    const point = this.getCursorPosition(canvas, event);
    const coo = { x: parseInt(point.x / 80), y: parseInt(point.y / 80) };
    return coo;
  },

  // zapisz pozycję kursora {x, y}, funkcja pośrednia pozwala
  getCursorPosition: function (canvas, event) {
    const rect = canvas.getBoundingClientRect()
    const canvasstyle = window.getComputedStyle(figurelayer)
    const borderwidth = { x: parseInt(canvasstyle.borderLeftWidth), y: parseInt(canvasstyle.borderTopWidth) };
    const x = event.clientX - rect.left - borderwidth.x;
    const y = event.clientY - rect.top - borderwidth.y;
    const point = { x: x, y: y };

    return point;
  },

  handleClick_Board: function (e) {
    this.id++;
    this.nullifyChessBoard();
    const coo = this.getClickedSquareCoo(this.figurelayer, e);
    this.isAnimationStarted = true;
    const delay = Number(document.getElementById('animation-speed-rate').value);
    this.clearTextArea();
    this.start(coo, this.id, delay);
    this.isAnimationStarted = false;
  },

  setevents: function () {
    this.figurelayer.addEventListener('click', this.handleClick_Board.bind(this));
  },

  getPossibleJumps: function (globalPoint) {
    // mozliwe zmiany w pozycji X i Y przy kazdym skoku
    jumpX = [2, 1, 2, 1, -2, -1, -2, -1];
    jumpY = [1, 2, -1, -2, 1, 2, -1, -2];
    // pusta tablica na generowanie mozliwych skokow
    possibleJumps = [];
    for (let i = 0; i < 8; i++) {
      // jesli po iteracji x i y zawieraja sie w przedziale 0-7 to dodaj ten punkt jako mozliwy skok
      if (globalPoint.x + jumpX[i] >= 0 && globalPoint.x + jumpX[i] <= 7 && globalPoint.y + jumpY[i] >= 0 && globalPoint.y + jumpY[i] <= 7 && this.chess_board[globalPoint.y + jumpY[i]][globalPoint.x + jumpX[i]] == 0) {
        // tworzenie obiektu, zeby bylo ladniej
        newPoint = { x: globalPoint.x + jumpX[i], y: globalPoint.y + jumpY[i] };
        // dodanie do tablicy
        possibleJumps.push({ x: newPoint.x, y: newPoint.y });
      }
    }
    // zwrocenie tablicy
    return possibleJumps;
  },

  // zwróć liczbę Warnsdorffa, czyli po prostu długość listy ze legalnymi skokami, dla aktualnej pozycji
  // funkcja pomocniczna pod tieBreaker1
  getWarnsdorffNumber: function (point) {
    return this.getPossibleJumps(point).length;
  },

  // sprawdź rekurencyjnie, który skok w głąb jest lepszy (ten, który ma mniej legalnych skoków po wykonaniu pierwszego legalnego skoku)
  tieBreaker1: function (a, b) {
    ajumps = this.getPossibleJumps(a);
    bjumps = this.getPossibleJumps(b);
    asum = 0;
    bsum = 0;
    ajumps.forEach((aa) => asum += this.getWarnsdorffNumber(aa));
    bjumps.forEach((bb) => bsum += this.getWarnsdorffNumber(bb));
    return ajumps < bjumps;
  },

  tieBreakerRandomFight: function (a, b) {
    return Math.random() <= 0.5;
  },

  tieBreakerRandomElement: function (minpoint) {
    return minpoint[Math.floor(Math.random() * minpoint.length)]
  },

  // zwróć kolor dla sprawdzonego pola, jeśli pole nie było spradwdzone, to zostaw kolor domyślny
  getCheckedColor: function (x, y) {
    if ((x + y) % 2 != 0) return 'rgb(70, 125, 85)';
    else return 'rgb(91, 171, 113)';
  },

  // odświeżenie planszy
  updateBoard: function (point) {
    this.markSquare(point);
    this.drawFigure(point.x, point.y);
    this.fillSquare(point.x, point.y, this.getCheckedColor(point.x, point.y));
  },

  // wypisz trasę w postaci listy kroków ze współrzędnymi szachowymi po zakończonym programie
  printMoves: function (route) {
    let text = "";
    for (let i = 0; i < route.x.length; i++) {
      text += (i + 1).toString() + '. ' + this.mapToChessPoint({ x: route.x[i], y: route.y[i] });
      text += "\n";
    }
    document.getElementById('moveListing').value = text;
    return text;
  },

  showRouteOnBoard: function (route) {
    this.figurelayer.getContext('2d').clearRect(0, 0, 640, 640);
    this.fillSquare(route.x[0], route.y[0], 'lightblue');
    for (let i = 0; i < route.x.length - 1; i++) {
      this.drawLineLinkingSquares(route.x[i], route.y[i], route.x[i + 1], route.y[i + 1]);
    }
    this.fillSquare(route.x[63], route.y[63], 'blue');
  },

  showMovesOnBoard: function (route) {
    //this.figurelayer.getContext('2d').clearRect(0,0,640,640);
    this.fillSquare(route.x[0], route.y[0], 'lightblue');
    for (let i = 0; i < route.x.length; i++) {
      this.drawNumber(route.x[i], route.y[i], i + 1, 'red');
    }
    this.fillSquare(route.x[63], route.y[63], 'blue');
  },

  getSpeedValue: function (delay) {
    if (document.getElementById('dynamicSpeedChangeFlag').checked)
      return Number(document.getElementById('animation-speed-rate').value);
    else return delay;
  },

  isShowMoveOrderFlagOn: function () {
    return document.getElementById('showMoveOrderFlag').checked;
  },

  isShowRouteFlagOn: function () {
    return document.getElementById('showRouteFlag').checked;
  },

  start: async function (startpoint = { x: 0, y: 0 }, startId, delay = 50) {
    this.isAnimationStarted = true;
    this.updateBoard(startpoint);

    point = JSON.parse(JSON.stringify(startpoint));
    routeX = [];
    routeY = [];
    routeX.push(point.x);
    routeY.push(point.y);
    for (let i = 0; i <= 62; i++) {
      if (startId != this.id) return;
      const jumps = this.getPossibleJumps(point);
      let min = 9;
      let minpoints = [Object.assign({}, jumps[0])];
      jumps.forEach((el) => {
        let num = this.getWarnsdorffNumber(el);
        if (num == 0) return;
        if (num == min) {
          minpoints.push(Object.assign({}, el));
        }
        else if (num < min) {
          min = num;
          minpoints = [Object.assign({}, el)];
        }
        this.drawNumber(el.x, el.y, num);
      });
      delay = this.getSpeedValue(delay)
      await new Promise(r => setTimeout(r, delay));
      point = Object.assign({}, this.tieBreakerRandomElement(minpoints));
      try {
        if (startId != this.id) throw "Another starting function has begun.";
        this.updateBoard(point);
        routeX.push(point.x);
        routeY.push(point.y);
      }
      catch (ex) {
        console.log(ex);
        return false;
      }
    }
    const route = { x: routeX, y: routeY };
    this.printMoves(route);
    if (this.isShowRouteFlagOn()) {
      await new Promise(r => setTimeout(r, this.getSpeedValue(100)));
      this.showRouteOnBoard(route);
    }
    if (this.isShowMoveOrderFlagOn()) {
      await new Promise(r => setTimeout(r, this.getSpeedValue(100)));
      this.showMovesOnBoard(route);
    }
    return route;
  },

  markSquare: function (point) {
    this.chess_board[point.y][point.x] = 1;
  },

  nullifyChessBoard: function () {
    this.drawBoard();
    this.chess_board = [[0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]];
  },

  clearTextArea: function () {
    const listing = document.getElementById('moveListing').value = '';
  },

  run: function () {
    this.boardlayer = document.getElementById('boardlayer');
    this.figurelayer = document.getElementById('figurelayer');
    this.animationbutton = document.getElementById('animate');
    this.route = undefined;
    this.id = 0;

    this.chess_board = [[0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]];

    this.isAnimationStarted = false;
    this.clearTextArea();
    this.drawBoard();
    this.setevents();
  }

}

function getSpeedValueText(value) {
  let number = value;
  let label = 'ms'
  if (value >= 1000) {
    number = Math.round(((number / 1000) + Number.EPSILON) * 100) / 100;
    label = 's';
  }
  return number + ' ' + label;
}

document.addEventListener('DOMContentLoaded', function () {
  const speedRangeInput = document.getElementById('animation-speed-rate');
  const speedRangeInputText = document.getElementById("animation-speed-rate-value");
  speedRangeInputText.innerText = getSpeedValueText(speedRangeInput.value);
  speedRangeInput.addEventListener('input', function (e) {
    speedRangeInputText.innerText = getSpeedValueText(this.value);
  });
  boardcontroller.run();
})

