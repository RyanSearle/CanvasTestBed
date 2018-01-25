(function () {

    let canvasFactory = function (options) {

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
            cell.style.layer = 1;
            cell.updateCell(grid.cellDiameter);
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

        function scrollDownHandler(e) {
            grid.cellDiameter--;
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
                xCount: 20,
                yCount: 15,
                cellThickness: 4,
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

                    for (let i = 0; i < iterations; i++) {
                        this.cellArray.forEach(function (cell) {
                            if (cell.style.layer === i) {
                                cell.drawCell(module.cellDiameter);
                            }
                        });
                    }
                },
                fillGrid: function () {
                    this.cellArray = [];

                    for (let x = 1 - this.xCount; x < this.xCount; x++) {
                        for (let y = 1 - this.yCount; y < this.yCount; y++) {

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
                            if (styleResult){
                                style = styleResult.result;
                            }

                            // Default style if no rules are matched
                            style = style || {
                                color: this.foregoundColor,
                                backgroundColor: this.backgroundColor,
                                cellThickness: this.cellThickness,
                                layer: 0
                            };

                            let cell = cellFactory(x, y, style);
                            this.cellArray.push(cell);
                        }
                    }
                },
                creationRules: [
                    {
                        priority: 1,
                        rule: function (x, y) {
                            if (x === -19 || x === 19 || y === -14 || y === 14) {
                                return {
                                    color: '#123456',
                                    backgroundColor: '#fedcba',
                                    cellThickness: 4,
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
                                    cellThickness: 4,
                                    layer: 1
                                };
                            }
                        }
                    }
                ]
            };

            return Object.create(proto).init();
        }

        function cellFactory(xInd, yInd, style) {

            const proto = {
                xIndex: xInd,
                yIndex: yInd,
                style: style,
                drawCell: function (diameter) {

                    let adjustedCoords = this.getCoordinates(diameter);
                    this.lastRenderedCoords = adjustedCoords;

                    painter.fillStyle = this.style.backgroundColor || 'transparent';
                    painter.strokeStyle = this.style.color || '#666';
                    painter.lineWidth = this.style.cellThickness || '2';

                    this.mapPath(diameter, adjustedCoords);

                    painter.fill();
                    painter.stroke();
                },
                clearCell: function (diameter) {
                    let adjustedCoords = this.getCoordinates(diameter);
                    painter.fillStyle = 'white';
                    this.mapPath(diameter, adjustedCoords);
                    painter.fill();
                },
                updateCell: function (diameter) {
                    this.clearCell(diameter);
                    this.drawCell(diameter);
                },
                mapPath: function (diameter, adjustedCoords) {
                    let halfRadius = diameter / 4;
                    let radius = diameter / 2;

                    let start = {y: adjustedCoords.y - radius, x: adjustedCoords.x + halfRadius};
                    let cord = [];

                    cord[0] = {y: adjustedCoords.y, x: adjustedCoords.x + radius};
                    cord[1] = {y: adjustedCoords.y + radius, x: adjustedCoords.x + halfRadius};
                    cord[2] = {y: adjustedCoords.y + radius, x: adjustedCoords.x - halfRadius};
                    cord[3] = {y: adjustedCoords.y, x: adjustedCoords.x - radius};
                    cord[4] = {y: adjustedCoords.y - radius, x: adjustedCoords.x - halfRadius};

                    painter.beginPath();
                    painter.moveTo(start.x, start.y);

                    for (let i = 0; i < cord.length; i++) {
                        painter.lineTo(cord[i].x, cord[i].y);
                    }

                    painter.lineTo(start.x, start.y);
                },
                getCoordinates: function (diameter) {
                    let verticleSpacing = diameter;
                    let horizontalSpacing = (diameter * 0.75);

                    let tempY = (this.yIndex * verticleSpacing);
                    let tempX = (this.xIndex * horizontalSpacing);

                    if (this.xIndex % 2 !== 0) {
                        tempY = tempY + diameter / 2;
                    }

                    return getCenteredCoordinates(tempX, tempY);
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

    let canvas = canvasFactory({
        id: "main-canvas"
    });

})();