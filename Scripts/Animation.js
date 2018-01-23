(function () {

    let canvasFactory = function (options) {

        options = options || {
            id: "BaseId"
        };

        // Cache DOM
        let canvasElement = document.getElementById(options.id);

        // Init
        SetFullSize();
        let grid = gridFactory();

        function SetFullSize() {
            canvasElement.width = window.innerWidth;
            canvasElement.height = window.innerHeight;
        }

        function gridFactory() {

            const cellDiameter = 50;
            const cellRadius = cellDiameter / 2;
            const halfCellRadius = cellRadius / 2;
            const painter = canvasElement.getContext('2d');

            // Init
            draw();

            function draw() {
                
                let verticleSpacing = cellDiameter;
                let horizontalSpacing = cellDiameter * 0.75;
                
                let xCount = canvasElement.width / cellRadius;
                let yCount = canvasElement.height / cellDiameter;
                
                let extraSpacing = false;

                for (let x = 0; x < xCount; x++) {
                    for (let y = 0; y < yCount; y++) {

                        let tempY = y * verticleSpacing;
                        let tempX = x * horizontalSpacing;

                        if (extraSpacing){
                            tempY = tempY + cellRadius;
                        }

                        let cell = cellFactory(tempX, tempY);
                        cell.draw(painter);
                    }
                    extraSpacing = !extraSpacing;
                }
                
                

            }

            function cellFactory(x, y) {

                let yCord = y;
                let xCord = x;

                function draw(painter) {

                    let start = {y:yCord - cellRadius, x: xCord + halfCellRadius};
                    let cord = [];
                    
                    cord[0] = {y:yCord, x: xCord + cellRadius};
                    cord[1] = {y:yCord + cellRadius, x: xCord + halfCellRadius};
                    cord[2] = {y:yCord + cellRadius, x: xCord - halfCellRadius};
                    cord[3] = {y:yCord, x: xCord - cellRadius};
                    cord[4] = {y:yCord - cellRadius, x: xCord - halfCellRadius};

                    painter.beginPath();
                    painter.moveTo(start.x, start.y);
                    
                    for(let i = 0; i < cord.length; i++){
                        painter.lineTo(cord[i].x, cord[i].y);
                    }

                    painter.lineTo(start.x, start.y);

                    painter.stroke();
                }

                return {
                    yCord,
                    xCord,
                    draw
                }

            }
        }
    };

    let canvas = canvasFactory({
        id: "main-canvas"
    });

})();