(function () {

    let canvasFactory = function (options) {

        options = options || {
            id: "BaseId"
        };

        // Cache DOM
        let canvasElement = document.getElementById(options.id);

        // Create bindings
        document.addEventListener('click', clickHandler);
        document.addEventListener('scroll', scrollUpHandler);
        //document.addEventListener('scrolldown', scrollDownHandler);

        // Init
        const painter = canvasElement.getContext('2d');

        SetFullSize();

        let grid = gridFactory();

        function clickHandler(e) {
            let cell = grid.getClosestCell(e.clientX, e.clientY);
            cell.color = 'rgb(0, 132, 180)';
            cell.layer = 1;
            grid.reDraw();
        }

        function scrollUpHandler(e) {
            grid.cellDiameter++;
            grid.reDraw();
        }

        function scrollDownHandler(e) {
            grid.cellDiameter--;
        }

        function SetFullSize() {
            canvasElement.width = window.innerWidth;
            canvasElement.height = window.innerHeight;
        }

        function gridFactory() {

            const proto = {
                backgroundColor: '#eee',
                foregoundColor: '#333333',
                cellDiameter: 200,
                cellRadius: function () {
                    return this.cellDiameter / 2;    
                },
                halfCellRadius: function () {
                    return this.cellDiameter / 4;    
                },
                cellThickness: 4,
                cellArray: [],
                getCell: function (x, y) {
                    return this.cellArray.filter(function (cell) {
                        return (cell.xIndex === x && cell.yIndex === y) ? cell : null;
                    })[0];
                },
                getClosestCell: function (xCord, yCord) {
                    return this.cellArray.map(function (cell) {
                        let xDif = xCord - cell.xCord;
                        let yDif = yCord - cell.yCord;

                        // Turn value positive
                        xDif = xDif < 0 ? xDif * -1 : xDif;
                        yDif = yDif < 0 ? yDif * -1 : yDif;

                        return {
                            cell: cell,
                            distance: xDif + yDif
                        };
                    }).reduce(function (previousValue, currentValue) {
                        return previousValue.distance > currentValue.distance ? currentValue : previousValue;
                    }).cell;
                },
                reDraw: function () {
                    this.fillBackground();
                    this.drawGrid();
                    console.log("Redraw");
                },
                fillBackground: function () {
                    // Paint settings
                    painter.fillStyle = this.backgroundColor;

                    painter.fillRect(0, 0, canvasElement.width, canvasElement.height);
                },
                drawGrid: function () {
                    let iterations = this.cellArray.reduce(function (prev, current) {
                        return current.layer > prev.layer ? current : prev;
                    }).layer + 1;

                    for (let i = 0; i < iterations; i++) {
                        this.cellArray.forEach(function (cell) {
                            if (cell.layer === i) {
                                cell.drawCell();
                            }
                        });
                    }
                }
            };
            
            let newGrid = Object.create(proto);
            
            (function init() {
                let verticleSpacing = newGrid.cellDiameter;
                let horizontalSpacing = (newGrid.cellDiameter * 0.75);

                let xCount = canvasElement.width / newGrid.cellRadius.call(newGrid);
                let yCount = canvasElement.height / newGrid.cellDiameter;

                newGrid.cellArray = [];

                for (let x = 0; x < xCount; x++) {
                    for (let y = 0; y < yCount; y++) {

                        let tempY = (y * verticleSpacing);
                        let tempX = (x * horizontalSpacing);

                        if (x % 2 !== 0) {
                            tempY = tempY + newGrid.cellRadius.call(newGrid);
                        }

                        let cell = cellFactory(tempX, tempY, x, y, newGrid.foregoundColor, 0);
                        newGrid.cellArray.push(cell);
                    }
                }

                newGrid.reDraw();
            })();


            function cellFactory(x, y, xInd, yInd, color, layer) {

                const proto = {
                    xCord: x,
                    yCord: y,
                    xIndex: xInd,
                    yIndex: yInd,
                    color: color,
                    layer: layer,
                    drawCell: function () {
                        
                        let getCellRadius = newGrid.cellRadius.bind(newGrid);
                        let getHalfCellRadius = newGrid.halfCellRadius.bind(newGrid);
                        
                        let start = {y: this.yCord - getCellRadius(), x: this.xCord + getHalfCellRadius()};
                        let cord = [];

                        cord[0] = {y: this.yCord, x: this.xCord + getCellRadius()};
                        cord[1] = {y: this.yCord + getCellRadius(), x: this.xCord + getHalfCellRadius()};
                        cord[2] = {y: this.yCord + getCellRadius(), x: this.xCord - getHalfCellRadius()};
                        cord[3] = {y: this.yCord, x: this.xCord - getCellRadius()};
                        cord[4] = {y: this.yCord - getCellRadius(), x: this.xCord - getHalfCellRadius()};

                        painter.strokeStyle = this.color;
                        painter.lineWidth = newGrid.cellThickness;

                        painter.beginPath();
                        painter.moveTo(start.x, start.y);

                        for (let i = 0; i < cord.length; i++) {
                            painter.lineTo(cord[i].x, cord[i].y);
                        }

                        painter.lineTo(start.x, start.y);
                        painter.stroke();
                    }
                };

                return Object.create(proto);
            }

            return newGrid;
        }
    };

    let canvas = canvasFactory({
        id: "main-canvas"
    });

})();