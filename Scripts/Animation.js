(function () {

    let canvasFactory = function (options) {

        options = options || {
            id: "BaseId"
        };

        // Cache DOM
        let canvasElement = document.getElementById(options.id);

        // Create bindings
        document.addEventListener('click', clickHandler);
        
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
        
        function SetFullSize() {
            canvasElement.width = window.innerWidth;
            canvasElement.height = window.innerHeight;
        }

        function gridFactory() {

            let backgroundColor = '#333333';
            let foregoundColor = '#eee';
            const cellDiameter = 100;
            const cellRadius = cellDiameter / 2;
            const halfCellRadius = cellRadius / 2;
            let cellArray = [];
            
            init();
            
            function init() {
                let verticleSpacing = cellDiameter;
                let horizontalSpacing = (cellDiameter * 0.75);

                let xCount = canvasElement.width / cellRadius;
                let yCount = canvasElement.height / cellDiameter;

                cellArray = [];

                for (let x = 0; x < xCount; x++) {
                    for (let y = 0; y < yCount; y++) {

                        let tempY = (y * verticleSpacing);
                        let tempX = (x * horizontalSpacing);

                        if (x % 2 !== 0){
                            tempY = tempY + cellRadius;
                        }
                        
                        let cell = cellFactory(tempX, tempY, x,  y, foregoundColor, 0);
                        cellArray.push(cell);
                    }
                }

                reDraw();
            }

            function getCell(x, y) {
                return cellArray.filter(function (cell) {
                    return (cell.xIndex === x && cell.yIndex === y) ? cell : null;
                })[0];
            }
            
            function getClosestCell(xCord, yCord) {
                return cellArray.map(function (cell) {
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
            }
            
            function reDraw() {
                fillBackground();
                drawGrid();
            }
            
            function fillBackground() {
                // Paint settings
                painter.fillStyle = backgroundColor;
                
                painter.fillRect(0,0,canvasElement.width, canvasElement.height);
            }
            
            function drawGrid() {
                
                let iterations = cellArray.reduce(function (prev, current) {
                    return current.layer > prev.layer ? current : prev;
                }).layer + 1;
                
                for(let i = 0; i < iterations; i++){
                    cellArray.forEach(function (cell) {
                        if (cell.layer === i) {
                            cell.drawCell();
                        }
                    });
                }
            }

            function cellFactory(x, y, xInd, yInd, color, layer) {
                
                const proto = {
                    xCord: x, 
                    yCord: y, 
                    xIndex: xInd,
                    yIndex: yInd,
                    color: color,
                    layer: layer,
                    drawCell: function () {
                        let start = {y:this.yCord - cellRadius, x: this.xCord + halfCellRadius};
                        let cord = [];

                        cord[0] = {y:this.yCord, x: this.xCord + cellRadius};
                        cord[1] = {y:this.yCord + cellRadius, x: this.xCord + halfCellRadius};
                        cord[2] = {y:this.yCord + cellRadius, x: this.xCord - halfCellRadius};
                        cord[3] = {y:this.yCord, x: this.xCord - cellRadius};
                        cord[4] = {y:this.yCord - cellRadius, x: this.xCord - halfCellRadius};

                        painter.strokeStyle = this.color;
                        painter.lineWidth = 4;
                        
                        painter.beginPath();
                        painter.moveTo(start.x, start.y);

                        for(let i = 0; i < cord.length; i++){
                            painter.lineTo(cord[i].x, cord[i].y);
                        }

                        painter.lineTo(start.x, start.y);

                        painter.stroke();
                    }
                };
                
                return Object.create(proto);
            }
            
            return{
                cellArray,
                reDraw,
                getCell,
                getClosestCell
            }
        }
    };

    let canvas = canvasFactory({
        id: "main-canvas"
    });

})();