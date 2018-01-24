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
        let grid = gridFactory();

        SetFullSize();
        grid.drawGrid();

        
        function clickHandler(e) {
            let cell = grid.getClosestCell(e.clientX, e.clientY);
            paintCell(cell, '#330000');
        }
        
        function paintCell(cell, color) {
            const newPainter = canvasElement.getContext('2d');
            newPainter.strokeStyle = color;
            cell.drawCell(newPainter);
        }
        
        function SetFullSize() {
            canvasElement.width = window.innerWidth;
            canvasElement.height = window.innerHeight;
        }

        function gridFactory() {

            const cellDiameter = 90;
            const cellRadius = cellDiameter / 2;
            const halfCellRadius = cellRadius / 2;
            const painter = canvasElement.getContext('2d');
            let cellArray = [];

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
            
            function drawGrid() {

                // Paint settings
                painter.strokeStyle = '#eee';

                let verticleSpacing = cellDiameter;
                let horizontalSpacing = cellDiameter * 0.75;
                
                let xCount = canvasElement.width / cellRadius;
                let yCount = canvasElement.height / cellDiameter;
                
                cellArray = [];
                
                for (let x = 0; x < xCount; x++) {
                    for (let y = 0; y < yCount; y++) {

                        let tempY = y * verticleSpacing;
                        let tempX = x * horizontalSpacing;

                        if (x % 2 !== 0){
                            tempY = tempY + cellRadius;
                        }

                        let cell = cellFactory(tempX, tempY, x,  y);
                        cell.drawCell(painter);
                        cellArray.push(cell);
                    }
                }
                
                

            }

            function cellFactory(x, y, xInd, yInd) {
                
                function drawCell(painter) {

                    let start = {y:y - cellRadius, x: x + halfCellRadius};
                    let cord = [];
                    
                    cord[0] = {y:y, x: x + cellRadius};
                    cord[1] = {y:y + cellRadius, x: x + halfCellRadius};
                    cord[2] = {y:y + cellRadius, x: x - halfCellRadius};
                    cord[3] = {y:y, x: x - cellRadius};
                    cord[4] = {y:y - cellRadius, x: x - halfCellRadius};

                    painter.beginPath();
                    painter.moveTo(start.x, start.y);
                    
                    for(let i = 0; i < cord.length; i++){
                        painter.lineTo(cord[i].x, cord[i].y);
                    }

                    painter.lineTo(start.x, start.y);

                    painter.stroke();
                }

                return {
                    yCord: y,
                    xCord: x,
                    xIndex: xInd,
                    yIndex: yInd,
                    drawCell
                }

            }
            
            return{
                cellArray,
                drawGrid,
                getCell,
                getClosestCell
            }
        }
    };

    let canvas = canvasFactory({
        id: "main-canvas"
    });

})();