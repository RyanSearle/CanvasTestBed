(function () {

    let canvas = function (options) {

        options = options || {
            id: "BaseId"
        };

        // Cache DOM
        let canvasElement = document.getElementById(options.id);

        // Create bindings
        document.addEventListener('click', clickHandler);
        document.addEventListener('wheel', scrollUpHandler);

        // Init
        const painter = canvasElement.getContext('2d');

        SetFullSize();

        let grid = gridFactory();

        function clickHandler(e) {
            let cell = grid.getClosestCell(e.clientX, e.clientY);
            cell.style.color = 'rgb(0, 132, 180)';
            cell.style.backgroundColor = '#330000';
            cell.style.layer = 2;
            cell.updateCell();
        }

        function scrollUpHandler(e) {
            // Increase / Decrease on logarithm scale
            if (e.deltaY < 0) {
                grid.cellDiameter = grid.cellDiameter + (grid.cellDiameter * 0.1);
            } else {
                grid.cellDiameter = grid.cellDiameter - (grid.cellDiameter * 0.1);
            }
            grid.reDraw();
        }

        function SetFullSize() {
            canvasElement.width = document.body.clientWidth - 50;
            canvasElement.height = document.body.clientHeight - 50;
        }

        function gridFactory() {

            const proto = {
                backgroundColor: '#eee',
                foregoundColor: '#666666',
                cellDiameter: 30,
                skew: 0.6,
                baseHeight: 0.5,
                get skewedBaseHeight(){
                    return this.cellDiameter * this.baseHeight * (1 - this.skew);    
                },
                get skewedDiameter(){
                    return this.cellDiameter * this.skew;
                },
                get cellDiameterShort() {
                    return (this.cellDiameter / 2) * Math.sqrt(3);
                },
                xCount: 8,
                yCount: 6,
                get cellThickness() {
                    return this.cellDiameter / 100;
                },
                cellArray: [],
                init: function () {
                    this.fillGrid();
                    this.reDraw();
                    return this;
                },
                getCell: function (x, y) {
                    return this.cellArray.filter(function (cell) {
                        return (cell.xIndex === x && cell.yIndex === y) ? cell : null;
                    })[0];
                },
                getClosestCell: function (xCord, yCord) {
                    const grid = this;
                    return this.cellArray.map(function (cell) {
                        
                        if (cell.lastRenderedCoords === undefined){
                            return {
                                distance: 99999
                            };
                        }
                        
                        let xDif = xCord - cell.lastRenderedCoords.x;
                        let yDif = yCord - cell.lastRenderedCoords.y;

                        // Turn value positive
                        xDif = xDif < 0 ? xDif * -1 : xDif;
                        yDif = yDif < 0 ? yDif * -1 : yDif;

                        yDif = yDif / grid.skew;
                        
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
                    const module = this;

                    let iterations = this.cellArray.reduce(function (prev, current) {
                        return current.style.layer > prev.style.layer ? current : prev;
                    }).style.layer + 1;

                    this.cellArray.forEach(function (cell) {
                        cell.drawCellBackground();
                    });

                    for (let i = 0; i < iterations; i++) {
                        this.cellArray.forEach(function (cell) {
                            if (cell.style.layer === i) {
                                cell.drawCell();
                            }
                        });
                    }
                },
                fillGrid: function () {
                    this.cellArray = [];

                    for (let y = 1 - this.yCount; y < this.yCount; y++) {
                        for (let x = 1 - this.xCount; x < this.xCount; x++) {

                            // Check cell for matching rules
                            let styleResult = this.creationRules.map(function (creationRule) {
                                return {
                                    priority: creationRule.priority,
                                    result: creationRule.rule(x, y)
                                };
                            }).filter(function (rule) {
                                return Boolean(rule.result);
                            }).sort(function (a, b) {
                                return b.priority - a.priority;
                            })[0];

                            let style;
                            if (styleResult) {
                                style = styleResult.result;
                            }

                            // Default style if no rules are matched
                            style = style || {
                                color: this.foregoundColor,
                                backgroundColor: this.backgroundColor,
                                layer: 0
                            };


                            let cell = cellFactory(x, y, style, this);
                            this.cellArray.push(cell);
                        }
                    }
                },
                creationRules: [
                    {
                        priority: -1,
                        rule: function (x, y) {
                            return {
                                color: '#333333',
                                backgroundColor: '#aafe96',
                                layer: 1
                            };
                        }
                    },
                    {
                        priority: 1,
                        rule: function (x, y) {
                            if (x === -19 || x === 19 || y === -14 || y === 14) {
                                return {
                                    color: '#333333',
                                    backgroundColor: '#fedcba',
                                    layer: 1
                                };
                            }
                        }
                    },
                    {
                        priority: 0,
                        rule: function (x, y) {
                            if (y === 0 || x === 0 || y === 1) {
                                return {
                                    color: '#333333',
                                    backgroundColor: '#fedcba',
                                    layer: 1,
                                    invisible: true
                                };
                            }
                        }
                    },
                    {
                        priority: 2,
                        rule: function (x, y) {
                            if (y === 0 && x === 0) {
                                return {
                                    color: '#333333',
                                    backgroundColor: '#fedcba',
                                    layer: 1,
                                };
                            }
                        }
                    }
                ]
            };

            return Object.create(proto).init();
        }

        function cellFactory(xInd, yInd, style, grid) {

            const proto = {
                grid: grid,
                xIndex: xInd,
                yIndex: yInd,
                style: style,
                drawCell: function () {

                    if (this.style.invisible){
                        return;
                    }
                    
                    let adjustedCoords = this.getCoordinates();
                    this.lastRenderedCoords = adjustedCoords;
                    
                    painter.fillStyle = this.style.backgroundColor || 'transparent';
                    painter.strokeStyle = this.style.color || '#666';
                    painter.lineWidth = this.grid.cellThickness;

                    
                    this.mapPath(adjustedCoords);

                    painter.fill();
                    painter.stroke();

                    // // Debug: Draw center of cell 
                    // painter.fillStyle = "black";
                    // painter.fillRect(adjustedCoords.x, adjustedCoords.y, 2, 2);
                },
                drawCellBackground: function () {

                    if (this.style.invisible){
                        return;
                    }
                    
                    let adjustedCoords = this.getCoordinates();
                    this.lastRenderedCoords = adjustedCoords;

                    painter.fillStyle = "#e24d00" || 'white';
                    painter.strokeStyle = this.style.color || '#666';
                    painter.lineWidth = this.grid.cellThickness;
                    
                    // Doesn't Have cell bottom left
                    let blCell = this.getAdjacentCell('bl') || { style: {invisible:true}}; 
                    if (blCell.style.invisible) {
                        this.mapLeftBackgroundPath(adjustedCoords);
                        painter.fill();
                        painter.stroke();
                    }

                    // Doesn't Have cell bottom right
                    let brCell = this.getAdjacentCell('br')|| { style: {invisible:true}};
                    if (brCell.style.invisible) {
                        this.mapRightBackgroundPath(adjustedCoords);
                        painter.fill();
                        painter.stroke();
                    }
                },
                clearCell: function () {

                    if (this.style.invisible){
                        return;
                    }
                    
                    let adjustedCoords = this.getCoordinates();
                    painter.fillStyle = 'white';
                    this.mapPath(adjustedCoords);
                    painter.fill();
                },
                updateCell: function () {
                    this.clearCell();
                    this.drawCellBackground();
                    this.drawCell();
                    
                    // See if other cells need updatings
                    let blCell =this.getAdjacentCell('bl') || { style: {invisible:true}};
                    let brCell =this.getAdjacentCell('br') || { style: {invisible:true}};
                    
                    if (blCell.style.invisible || brCell.style.invisible){
                        // Other cells to update
                        let bbCell = this.getAdjacentCell('bb');
                        if (bbCell !== undefined){
                            bbCell.clearCell();
                            bbCell.drawCell();
                        }
                    }
                    

                },
                mapPath: function (adjustedCoords) {
                    let diameter = this.grid.cellDiameter;
                    let radius = this.grid.cellDiameter / 2;
                    let shortRadius = (this.grid.cellDiameter / 2) * Math.sqrt(3) / 2;
                    let skew = this.grid.skewedDiameter;
                    
                    let sideLength = radius;

                    // Draw normal hexagon and multiply Y axis by skew ratio
                    
                    let cord = [];
                    // Top
                    let start = {y: (adjustedCoords.y - radius), x: adjustedCoords.x};
                    // Top Right
                    cord[0] = {y: (adjustedCoords.y - (sideLength / 2)), x: adjustedCoords.x + shortRadius};
                    // Bottom Right
                    cord[1] = {y: adjustedCoords.y + (sideLength / 2), x: adjustedCoords.x + shortRadius};
                    // Bottom
                    cord[2] = {y: adjustedCoords.y + radius, x: adjustedCoords.x};
                    // Bottom Left
                    cord[3] = {y: adjustedCoords.y + (sideLength / 2), x: adjustedCoords.x - shortRadius};
                    // Top Left
                    cord[4] = {y: (adjustedCoords.y - (sideLength / 2)), x: adjustedCoords.x - shortRadius};

                    start.y = start.y +((adjustedCoords.y - start.y) * (1 - this.grid.skew));
                    cord[0].y = cord[0].y +  ((adjustedCoords.y - cord[0].y) * (1 - this.grid.skew));
                    cord[1].y = cord[1].y +  ((adjustedCoords.y - cord[1].y) * (1 - this.grid.skew));
                    cord[2].y = cord[2].y +  ((adjustedCoords.y - cord[2].y) * (1 - this.grid.skew));
                    cord[3].y = cord[3].y +  ((adjustedCoords.y - cord[3].y) * (1 - this.grid.skew));
                    cord[4].y = cord[4].y +  ((adjustedCoords.y - cord[4].y) * (1 - this.grid.skew));
                    
                    painter.beginPath();
                    painter.moveTo(start.x, start.y);

                    for (let i = 0; i < cord.length; i++) {
                        painter.lineTo(cord[i].x, cord[i].y);
                    }

                    painter.lineTo(start.x, start.y);
                },
                mapLeftBackgroundPath: function (adjustedCoords) {
                    let radius = this.grid.cellDiameter / 2;
                    let shortRadius = (this.grid.cellDiameter / 2) * Math.sqrt(3) / 2;
                    let baseHeight = this.grid.skewedBaseHeight;
                    let cord = [];
                    let skew = this.grid.skewedDiameter;
                    let skewedSideLength = skew / 4;

                    // Bottom Left
                    let start = {y: adjustedCoords.y + (radius / 2), x: adjustedCoords.x - shortRadius};
                    // Bottom
                    cord[2] = {y: adjustedCoords.y + radius, x: adjustedCoords.x};

                    // Apply skew
                    start.y = start.y +((adjustedCoords.y - start.y) * (1 - this.grid.skew));
                    cord[2].y = cord[2].y +  ((adjustedCoords.y - cord[2].y) * (1 - this.grid.skew));

                    // Bottom Left -down
                    cord[0] = {y: start.y + baseHeight, x: start.x};
                    // Bottom -down
                    cord[1] = {y: cord[2].y + baseHeight, x: cord[2].x};
                    
                    painter.beginPath();
                    painter.moveTo(start.x, start.y);

                    for (let i = 0; i < cord.length; i++) {
                        painter.lineTo(cord[i].x, cord[i].y);
                    }

                    painter.lineTo(start.x, start.y);
                },
                mapRightBackgroundPath: function (adjustedCoords) {
                    let radius = this.grid.cellDiameter / 2;
                    let shortRadius = (this.grid.cellDiameter / 2) * Math.sqrt(3) / 2;
                    let baseHeight = this.grid.skewedBaseHeight;
                    let cord = [];
                    let skew = this.grid.skewedDiameter;
                    let skewedSideLength = skew / 4;
                    
                    // Bottom Right
                    let start = {y: adjustedCoords.y + (radius / 2), x: adjustedCoords.x + shortRadius};
                    // Bottom
                    cord[2] = {y: adjustedCoords.y + radius, x: adjustedCoords.x};

                    // Apply skew
                    start.y = start.y +((adjustedCoords.y - start.y) * (1 - this.grid.skew));
                    cord[2].y = cord[2].y +  ((adjustedCoords.y - cord[2].y) * (1 - this.grid.skew));

                    // Bottom -down
                    cord[1] = {y: cord[2].y + baseHeight, x: cord[2].x};
                    // Bottom Right -down
                    cord[0] = {y: start.y + baseHeight, x: start.x};
                    
                    
                    painter.beginPath();
                    painter.moveTo(start.x, start.y);

                    for (let i = 0; i < cord.length; i++) {
                        painter.lineTo(cord[i].x, cord[i].y);
                    }

                    painter.lineTo(start.x, start.y);
                },
                getCoordinates: function () {
                    let skew = this.grid.skewedDiameter;
                    let shortRadius = (this.grid.cellDiameter / 2) * Math.sqrt(3) / 2;
                    let horizontalSpacing = (this.grid.cellDiameter / 2) * Math.sqrt(3);

                    let verticleSpacing = this.grid.cellDiameter * 0.75 * this.grid.skew;
                    
                    let tempY = (this.yIndex * verticleSpacing);
                    let tempX = (this.xIndex * horizontalSpacing);

                    if (this.yIndex % 2 !== 0) {
                        tempX = tempX + shortRadius;
                    }

                    return getCenteredCoordinates(tempX, tempY);
                },
                getAdjacentCell: function (direction) {
                    let xZigZagAdjust = this.xIndex;
                    
                    if (this.yIndex % 2 ===0){
                        xZigZagAdjust = xZigZagAdjust - 1;
                    }
                    
                    switch (direction) {
                        case 'l': // Left
                            return this.grid.getCell(xZigZagAdjust - 1, this.yIndex);
                        case 'tr': // Top Right
                            return this.grid.getCell(xZigZagAdjust, this.yIndex - 1);
                        case 'br': // Bottom Right
                            return this.grid.getCell(xZigZagAdjust + 1, this.yIndex + 1);
                        case 'r': // Right
                            return this.grid.getCell(xZigZagAdjust + 1, this.yIndex);
                        case 'bl': // Bottom Left
                            return this.grid.getCell(xZigZagAdjust, this.yIndex + 1);
                        case 'tl': // TOP Left
                            return this.grid.getCell(xZigZagAdjust - 1, this.yIndex - 1);
                        case 'bb':
                            return this.grid.getCell(this.xIndex, this.yIndex + 2);
                    }
                }
            };

            function getCenteredCoordinates(x, y) {
                let xMiddle = canvasElement.width / 2;
                let yMiddle = canvasElement.height / 2;

                return {x: xMiddle + x, y: yMiddle + y};
            }

            return Object.create(proto);
        }
    };

    let mainCanvas = canvas({
        id: "main-canvas"
    });

})();