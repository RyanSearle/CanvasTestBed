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
            let cell = grid.getClosestCell(e.clientX, e.clientY).getAdjacentCell("bl");
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
                get cellDiameterShort() {
                    return (this.cellDiameter / 2) * Math.sqrt(3);
                },
                xCount: 8,
                yCount: 6,
                get cellThickness() {
                    return this.cellDiameter / 20;
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
                    return this.cellArray.map(function (cell) {
                        let xDif = xCord - cell.lastRenderedCoords.x;
                        let yDif = yCord - cell.lastRenderedCoords.y;

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
                                color: '#123456',
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
                                    color: '#123456',
                                    backgroundColor: '#fedcba',
                                    layer: 1
                                };
                            }
                        }
                    },
                    {
                        priority: 0,
                        rule: function (x, y) {
                            if (y === 0 || x === 0) {
                                return {
                                    color: '#123456',
                                    backgroundColor: '#fedcba',
                                    layer: 1
                                };
                            }
                        }
                    },
                    {
                        priority: 2,
                        rule: function (x, y) {
                            if (y === 0 && x === 0) {
                                return {
                                    color: 'transparent',
                                    backgroundColor: 'transparent',
                                    layer: 1,
                                    invisible: true
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
                },
                drawCellBackground: function () {

                    let adjustedCoords = this.getCoordinates();
                    this.lastRenderedCoords = adjustedCoords;

                    painter.fillStyle = this.style.backgroundColor || 'white';
                    painter.strokeStyle = this.style.color || '#666';
                    painter.lineWidth = this.grid.cellThickness;

                    // Doesn't Have cell bottom left
                    let blCell = this.getAdjacentCell('bl') || {invisible:true}; 
                    if (blCell.invisible) {
                        this.mapLeftBackgroundPath(adjustedCoords);
                        painter.fill();
                        painter.stroke();
                    }

                    // Doesn't Have cell bottom right
                    let brCell = this.getAdjacentCell('br')|| {invisible:true};
                    if (brCell.invisible) {
                        this.mapRightBackgroundPath(adjustedCoords);
                        painter.fill();
                        painter.stroke();
                    }
                },
                clearCell: function () {
                    let adjustedCoords = this.getCoordinates();
                    painter.fillStyle = 'white';
                    this.mapPath(adjustedCoords);
                    painter.fill();
                },
                updateCell: function () {
                    this.clearCell();
                    this.drawCell();
                },
                mapPath: function (adjustedCoords) {
                    let radius = this.grid.cellDiameter / 2;
                    let shortRadius = (this.grid.cellDiameter / 2) * Math.sqrt(3) / 2;

                    let skew = 0.2 * this.grid.cellDiameter;

                    let cord = [];
                    // Top
                    let start = {y: (adjustedCoords.y - radius) + skew, x: adjustedCoords.x};
                    // Top Right
                    cord[0] = {y: (adjustedCoords.y - radius / 2) + skew, x: adjustedCoords.x + shortRadius};
                    // Bottom Right
                    cord[1] = {y: adjustedCoords.y + radius / 2, x: adjustedCoords.x + shortRadius};
                    // Bottom
                    cord[2] = {y: adjustedCoords.y + radius, x: adjustedCoords.x};
                    // Bottom Left
                    cord[3] = {y: adjustedCoords.y + radius / 2, x: adjustedCoords.x - shortRadius};
                    // Top Left
                    cord[4] = {y: (adjustedCoords.y - radius / 2) + skew, x: adjustedCoords.x - shortRadius};

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

                    let baseHeight = this.grid.cellDiameter / 4;
                    let cord = [];

                    // Bottom Left
                    let start = {y: adjustedCoords.y + radius / 2, x: adjustedCoords.x - shortRadius};
                    // Bottom Left -down
                    cord[0] = {y: (adjustedCoords.y + radius / 2) + baseHeight, x: adjustedCoords.x - shortRadius};
                    // Bottom -down
                    cord[1] = {y: (adjustedCoords.y + radius) + baseHeight, x: adjustedCoords.x};
                    // Bottom
                    cord[2] = {y: adjustedCoords.y + radius, x: adjustedCoords.x};

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

                    let baseHeight = this.grid.cellDiameter / 4;
                    let cord = [];

                    // Bottom Right
                    let start = {y: adjustedCoords.y + radius / 2, x: adjustedCoords.x + shortRadius};
                    // Bottom Right -down
                    cord[0] = {y: (adjustedCoords.y + radius / 2) + baseHeight, x: adjustedCoords.x + shortRadius};
                    // Bottom -down
                    cord[1] = {y: (adjustedCoords.y + radius) + baseHeight, x: adjustedCoords.x};
                    // Bottom
                    cord[2] = {y: adjustedCoords.y + radius, x: adjustedCoords.x};

                    painter.beginPath();
                    painter.moveTo(start.x, start.y);

                    for (let i = 0; i < cord.length; i++) {
                        painter.lineTo(cord[i].x, cord[i].y);
                    }

                    painter.lineTo(start.x, start.y);
                },
                getCoordinates: function () {
                    let skew = 0.2 * this.grid.cellDiameter;
                    let shortRadius = (this.grid.cellDiameter / 2) * Math.sqrt(3) / 2;
                    let horizontalSpacing = (this.grid.cellDiameter / 2) * Math.sqrt(3);
                    let verticleSpacing = (this.grid.cellDiameter * 0.75);

                    let tempY = (this.yIndex * (verticleSpacing - skew));
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