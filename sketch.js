
// p5.disableFriendlyErrors = true;

var noiseOffset, grid;

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);

    randomSeed(1);
    noiseSeed(1);
    
    frameRate(0);
    
    noiseOffset = {
        x: Math.random(1000),
        z: Math.random(1000)
    };
    
    grid = [];
    for (var x = 0; x < 11 * 3; x++) {
        grid.push([]);
        for (var z = 0; z < 11 * 3; z++) {
            grid[x].push([]);
            for (var y = 0; y < 1; y++) {
                grid[x][z].push({
                    type: "empty",
                    ran: 0,
                    rot: 0,
                    built: 0,
                    merged: []
                });
                if (Math.round(Math.random(0.51))) {
                    grid[x][z][0].type = "stump";
                }
                if (Math.round(Math.random(0.505))) {
                    grid[x][z][0].type = "large-rock";
                }
                if (Math.round(Math.random(0.55))) {
                    grid[x][z][0].type = "small-rock";
                }
                if (Math.round(Math.random(0.55))) {
                    grid[x][z][0].type = "bush";
                }
                if (Math.round(Math.random(0.7))) {
                    grid[x][z][0].type = "tree";
                }
                if (noise(x / 30 + noiseOffset.x, z / 30 + noiseOffset.z) > 0.51 && noise(x / 30 + noiseOffset.x, z / 30 + noiseOffset.z) < 0.55) {
                    grid[x][z][0].type = "water";
                }
                // if (x === 0 || z === 10) {
                //     grid[x][z][0].type = "road";
                // }
                // if (x === 16) {
                //     var r = round(random(0.6)) * 0;
                //     for (var i = 0; i < r; i++) {
                //         grid[x][z].push({
                //             type: "test"
                //         });
                //     }
                //     if (grid[x][z][1] && grid[x][z][1].type === "test") {
                //         grid[x][z][0].type = "test";
                //     }
                // }
            }
        }
    }
    
    // angleMode(DEGREES);
}

var width = window.innerWidth;
var height = window.innerHeight;

/**

    Orthographic City Builder — WIP
    By Intermediate Coder
    
    Current Controls:
     - Use the tool bar to control things!
     
    
    BUGS:
     - Demolishing blocks does not update the merge status of neighboring blocks
    
    TODO:
     - Add "Essentials/Zoning" build tab
     - Add "Skyscraper" build tab
     - Add $$$ and a sidebar panel with all the details (citizens, money, satisfaction, res/com/ind levels, etc.)
     - Add modes (to see stats such as pollution levels, etc.)

*/
var cam = {
    x: 16,
    z: 16,
    y: 0,
    a: 30,
    zoom: 4
};
cam.a = Math.max(Math.min(cam.a, 90), -90);
var tileSize = 10;

var selected = {
    start: {
        x: -1,
        z: -1
    },
    stop: {
        x: -1,
        z: -1
    },
    group: []
};

var options = ["Move", "Rotate", "Zoom", "Build", "Demolish", "Merge"];
var buildings = [{
    category: "Zoning",
    contents: [{
        type: "LD Residential",
        multi: 2, // Number of dimensions the user can drag in to place multiple (this would be 2D; roads are 1D)
        cost: 200
    }, {
        type: "MD Residential",
        multi: 2,
        cost: 500
    }, {
        type: "HD Residential",
        multi: 2,
        cost: 2500
    }, {
        type: "LD Commercial",
        multi: 2, // Number of dimensions the user can drag in to place multiple (this would be 2D; roads are 1D)
        cost: 200
    }, {
        type: "MD Commercial",
        multi: 2,
        cost: 500
    }, {
        type: "HD Commercial",
        multi: 2,
        cost: 2500
    }, {
        type: "LD Industrial",
        multi: 2, // Number of dimensions the user can drag in to place multiple (this would be 2D; roads are 1D)
        cost: 200
    }, {
        type: "MD Industrial",
        multi: 2,
        cost: 500
    }, {
        type: "HD Industrial",
        multi: 2,
        cost: 2500
    }]
}, {
    category: "Nature",
    contents: [{
        type: "Tree",
        multi: 0,
        cost: 100
    }, {
        type: "Bush",
        multi: 0,
        cost: 50
    }, {
        type: "Stump",
        multi: 0,
        cost: 30
    }, {
        type: "Small Rock",
        multi: 0,
        cost: 150
    }, {
        type: "Large Rock",
        multi: 0,
        cost: 500
    }]
}, {
    category: "Transport",
    contents: [{
        type: "Road",
        multi: 1,
        cost: 50
    }]
}, {
    category: "Water",
    contents: [{
        type: "Water",
        multi: 2,
        cost: 5000
    }]
}];
var selectedOption = 0;
var selectedCategory = -1;
var selectedBuilding = -1;
var hoverDuration = {
    options: [0, 0, 0, 0, 0],
    categories: [0, 0],
    buildings: [0, 0, 0, 0, 0]
};

var mc = false;
function mouseClicked() {
    mc = true;
}
var kp = [];
function keyPressed() {
    kp[keyCode] = true;
}
function keyReleased() {
    kp[keyCode] = false;
}

function isBetween(n, a, b) {
   return (n - a) * (n - b) <= 0;
}

var mergeable = ["road", "ld-residential"]; // TODO: add others

var sqrt2 = Math.sqrt(2);
var s = tileSize * cam.zoom; // Size
var rw = s * sqrt2; // "Radius width" (distance from center to x point)
var rh = s * sqrt2 * Math.sin(cam.a * Math.PI / 180); // "Radius height"
var xo = width / 2 - (cam.x + cam.z) * rw - rw; // "-rw" is to center the camera on the center of a tile
var yo = height / 2 + cam.x * rh - cam.z * rh;
var levelo = Math.cos(cam.a * Math.PI / 180);

function drawQuad(x, z, y, d, w, h, rot) {
    if (d === 0 || w === 0) {
        quad((x + z) * rw + xo, (-x + z) * rh - ((y + h) * levelo) * s * sqrt2 + yo, ((x + d) + (z + w)) * rw + xo, (-(x + d) + (z + w)) * rh - ((y + h) * levelo) * s * sqrt2 + yo, ((x + d) + (z + w)) * rw + xo, (-(x + d) + (z + w)) * rh - (y * levelo) * s * sqrt2 + yo, (x + z) * rw + xo, (-x + z) * rh - (y * levelo) * s * sqrt2 + yo);
    } else if (h === 0) {
        quad((x + z) * rw + xo, (-x + z) * rh - (y * levelo) * s * sqrt2 + yo, ((x + d) + z) * rw + xo, (-(x + d) + z) * rh - (y * levelo) * s * sqrt2 + yo, ((x + d) + (z + w)) * rw + xo, (-(x + d) + (z + w)) * rh - (y * levelo) * s * sqrt2 + yo, (x + (z + w)) * rw + xo, (-x + (z + w)) * rh - (y * levelo) * s * sqrt2 + yo);
    } else {
        quad((x + z) * rw + xo, (-x + z) * rh - (y * levelo) * s * sqrt2 + yo, ((x + d) + z) * rw + xo, (-(x + d) + z) * rh - ((y + (rot ? h : 0)) * levelo) * s * sqrt2 + yo, ((x + d) + (z + w)) * rw + xo, (-(x + d) + (z + w)) * rh - ((y + h) * levelo) * s * sqrt2 + yo, (x + (z + w)) * rw + xo, (-x + (z + w)) * rh - ((y + (rot ? 0 : h)) * levelo) * s * sqrt2 + yo);
    }
}
function drawBlock(x, z, y) {
    switch(grid[x][z][y].type) {
        case "test":
            if (grid[x - 1] === undefined || grid[x - 1][z][y] === undefined || grid[x - 1][z][y].type === "empty" || grid[x - 1][z][y].type === "road") {
                stroke(200, 0, 0);
                fill(200, 0, 0);
                quad(x * rw + z * rw + xo, -x * rh + z * rh - ((y + 1) * levelo) * s * sqrt2 + yo, x * rw + (z + 1) * rw + xo, -x * rh + (z + 1) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, x * rw + (z + 1) * rw + xo, -x * rh + (z + 1) * rh - (y * levelo) * s * sqrt2 + yo, x * rw + z * rw + xo, -x * rh + z * rh - (y * levelo) * s * sqrt2 + yo);
            }
            if (grid[x][z + 1] === undefined || grid[x][z + 1][y] === undefined || grid[x][z + 1][y].type === "empty" || grid[x][z + 1][y].type === "road") {
                stroke(225, 0, 0);
                fill(225, 0, 0);
                quad(x * rw + (z + 1) * rw + xo, -x * rh + (z + 1) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, (x + 1) * rw + (z + 1) * rw + xo, -(x + 1) * rh + (z + 1) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, (x + 1) * rw + (z + 1) * rw + xo, -(x + 1) * rh + (z + 1) * rh - (y * levelo) * s * sqrt2 + yo, x * rw + (z + 1) * rw + xo, -x * rh + (z + 1) * rh - (y * levelo) * s * sqrt2 + yo);
            }
            if (y === grid[x][z].length - 1 && cam.a >= 0) {
                stroke(255, 0, 0);
                fill(255, 0, 0);
                quad(x * rw + z * rw + xo, -x * rh + z * rh - ((y + 1) * levelo) * s * sqrt2 + yo, (x + 1) * rw + z * rw + xo, -(x + 1) * rh + z * rh - ((y + 1) * levelo) * s * sqrt2 + yo, (x + 1) * rw + (z + 1) * rw + xo, -(x + 1) * rh + (z + 1) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, x * rw + (z + 1) * rw + xo, -x * rh + (z + 1) * rh - ((y + 1) * levelo) * s * sqrt2 + yo);
            }
        break;
        case "tree":
            // -- SIDES --
            // Trunk:
            if (cam.a < 90) {
            stroke(200, 100, 0);
            fill(200, 100, 0);
            // quad((x + 0.375) * rw + (z + 0.375) * rw + xo, -(x + 0.375) * rh + (z + 0.375) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, (x + 0.375) * rw + (z + 0.625) * rw + xo, -(x + 0.375) * rh + (z + 0.625) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, (x + 0.375) * rw + (z + 0.625) * rw + xo, -(x + 0.375) * rh + (z + 0.625) * rh - (y * levelo) * s * sqrt2 + yo, (x + 0.375) * rw + (z + 0.375) * rw + xo, -(x + 0.375) * rh + (z + 0.375) * rh - (y * levelo) * s * sqrt2 + yo);
            drawQuad(x + 0.375, z + 0.375, y,
                     0,         0.25,      0.5);
            stroke(225, 125, 0);
            fill(225, 125, 0);
            drawQuad(x + 0.375, z + 0.625, y,
                     0.25,      0,         0.5);
            // Leaves:
            stroke(0, 200, 0);
            fill(0, 200, 0);
            drawQuad(x + 0.25, z + 0.25, y + 0.5,
                     0,        0.5,      0.5);
            stroke(0, 225, 0);
            fill(0, 225, 0);
            drawQuad(x + 0.25, z + 0.75, y + 0.5,
                     0.5,      0,        0.5);
            }
            // -- TOP --
            stroke(0, 255, 0);
            fill(0, 255, 0);
            drawQuad(x + 0.25, z + 0.25, y + 1,
                     0.5,      0.5,      0);
        break;
        case "bush":
            // -- SIDES --
            if (cam.a < 90) {
            stroke(0, 200, 0);
            fill(0, 200, 0);
            drawQuad(x + 0.25, z + 0.25, y,
                     0,        0.5,      0.5);
            stroke(0, 225, 0);
            fill(0, 225, 0);
            drawQuad(x + 0.25, z + 0.75, y,
                     0.5,      0,        0.5);
            }
            // -- TOP --
            stroke(0, 255, 0);
            fill(0, 255, 0);
            drawQuad(x + 0.25, z + 0.25, y + 0.5,
                     0.5,      0.5,      0);
        break;
        case "stump":
            // -- SIDES --
            if (cam.a < 90) {
            stroke(200, 100, 0);
            fill(200, 100, 0);
            drawQuad(x + 0.375, z + 0.375, y,
                     0,         0.25,      0.5);
            stroke(225, 125, 0);
            fill(225, 125, 0);
            drawQuad(x + 0.375, z + 0.625, y,
                     0.25,      0,         0.5);
            }
            // -- TOP --
            stroke(255, 150, 0);
            fill(255, 150, 0);
            drawQuad(x + 0.375, z + 0.375, y + 0.5,                                    0.25,      0.25,      0);
        break;
        case "small-rock":
            // -- SIDES --
            if (cam.a < 90) {
            stroke(200);
            fill(200);
            drawQuad(x + 0.375, z + 0.375, y,
                     0,         0.25,      0.25);
            stroke(225);
            fill(225);
            drawQuad(x + 0.375, z + 0.625, y,
                     0.25,      0,         0.25);
            }
            // -- TOP --
            stroke(250);
            fill(250);
            drawQuad(x + 0.375, z + 0.375, y + 0.25,                                 0.25,      0.25,      0);
        break;
        case "large-rock":
            // -- SIDES --
            if (cam.a < 90) {
            stroke(200);
            fill(200);
            drawQuad(x + 0.25, z + 0.25, y,
                     0,        0.5,      0.5);
            stroke(225);
            fill(225);
            drawQuad(x + 0.25, z + 0.75, y,
                     0.5,      0,        0.5);
            }
            // -- TOP --
            stroke(250);
            fill(250);
            drawQuad(x + 0.25, z + 0.25, y + 0.5,
                     0.5,      0.5,      0);
        break;
        case "ld-residential":
            switch(grid[x][z][y].built) {
                case 0:
                break;
                case 1:
                    // BACK LEFT
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.25, y,
                         0,        0.125,   0.5);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.375, y,
                         0.125,     0,      0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.625, z + 0.25, y + 0.5,                                     0.126,     0.125,    0);
                    // BACK RIGHT
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.625, y,
                         0,        0.125,   0.5);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.75, y,
                         0.125,     0,      0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.625, z + 0.625, y + 0.5,                                   0.126,     0.125,    0);
                    // FRONT LEFT
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.25, z + 0.25, y,
                         0,        0.125,   0.5);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.375, y,
                         0.125,     0,      0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.25, z + 0.25, y + 0.5,                                     0.126,     0.125,    0);
                    // FRONT RIGHT
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.25, z + 0.625, y,
                         0,        0.125,   0.5);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.75, y,
                         0.125,     0,      0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.25, z + 0.625, y + 0.5,                                     0.126,     0.125,    0);
                break;
                case 2:
                    // -- SIDES --
                    if (cam.a < 90) {
                    // BACK LEFT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.25, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.375, y,
                         0.125,     0,    0.375);
                    // BACK LEFT -> FRONT LEFT
                drawQuad(x + 0.375, z + 0.375, y + 0.375,                                 0.25,    0,     0.125);
                    // BACK LEFT -> BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.375, y + 0.375,                                 0,         0.25, 0.125);
                    // FRONT LEFT
                drawQuad(x + 0.25, z + 0.25, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.375, y,
                         0.125,     0,    0.375);
                    // BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.625, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.75, y,
                         0.125,     0,    0.375);
                    // FRONT RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.25, z + 0.625, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.75, y,
                         0.125,     0,    0.375);
                    // FRONT LEFT -> FRONT RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.25, z + 0.25, y + 0.375,                                   0,        0.5,   0.125);
                    // FRONT RIGHT -> BACK RIGHT
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.75, y + 0.375,                                   0.5,      0,     0.125);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x + 0.25, z + 0.25, y + 0.5,                                     0.5,      0.125,    0);
                    // FRONT RIGHT -> BACK RIGHT
                drawQuad(x + 0.25, z + 0.625, y + 0.5,                                     0.5,      0.125,     0);
                    // BACK LEFT -> BACK RIGHT
                drawQuad(x + 0.625, z + 0.375, y + 0.5,                                   0.125,     0.25,     0);
                    // FRONT LEFT -> FRONT RIGHT
                drawQuad(x + 0.25, z + 0.375, y + 0.5,                                     0.125,    0.25,      0);
                break;
                case 3:
                    // -- SIDES --
                    if (cam.a < 90) {
                    // WALLS + DOOR (BACK)
                    stroke(200, 50, 50);
                    fill(200, 50, 50);
                drawQuad(x + 0.75, z + 0.25, y,
                         0,        0.5,     0.5);
                    stroke(175, 50, 50);
                    fill(175, 50, 50);
                drawQuad(x + 0.25, z + 0.25, y,
                         0.5,      0,       0.5);
                    // BACK LEFT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.25, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.375, y,
                         0.125,     0,    0.375);
                    // BACK LEFT -> FRONT LEFT
                drawQuad(x + 0.375, z + 0.375, y + 0.375,                                 0.25,    0,     0.125);
                    // BACK LEFT -> BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.375, y + 0.375,                                 0,         0.25, 0.125);
                    // WALLS + DOOR (FRONT)
                    stroke(200, 50, 50);
                    fill(200, 50, 50);
                drawQuad(x + 0.25, z + 0.25, y,
                         0,        0.5,     0.5);
                    stroke(225, 50, 50);
                    fill(225, 50, 50);
                drawQuad(x + 0.25, z + 0.75, y,
                         0.5,      0,       0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x + 0.25, z + 0.25, y + 0.5,                                     0.5,      0.125,    0);
                    // FRONT RIGHT -> BACK RIGHT
                drawQuad(x + 0.25, z + 0.625, y + 0.5,                                     0.5,      0.125,     0);
                    // BACK LEFT -> BACK RIGHT
                drawQuad(x + 0.625, z + 0.375, y + 0.5,                                   0.125,     0.25,     0);
                    // FRONT LEFT -> FRONT RIGHT
                drawQuad(x + 0.25, z + 0.375, y + 0.5,                                     0.125,    0.25,      0);
                break;
                default:
                    // -- SIDES --
                    if (cam.a < 90) {
                    if (grid[x][z][y].merged.indexOf("-1,0") === -1) {
                    stroke(200, 50, 50);
                    fill(200, 50, 50);
                drawQuad(x + 0.25, z + 0.25, y,
                         0,        0.5,     0.5);
                    stroke(100, 50, 0);
                    fill(100, 50, 0);
                drawQuad(x + 0.25, z + 0.375, y,
                         0,        0.125, 0.375);
                    } else {
                    stroke(225, 50, 50);
                    fill(225, 50, 50);
                drawQuad(x + 0, z + 0.75, y,
                         0.25,  0,       0.5);
                    }
                    if (grid[x][z][y].merged.indexOf("0,1") === -1) {
                    stroke(225, 50, 50);
                    fill(225, 50, 50);
                drawQuad(x + 0.25, z + 0.75, y,
                         0.5,      0,       0.5);
                    } else {
                    stroke(200, 50, 50);
                    fill(200, 50, 50);
                drawQuad(x + 0.25, z + 0.75, y,
                         0,        0.25,     0.5);
                    }
                    if (grid[x][z][y].merged.indexOf("1,0") !== -1) {
                    stroke(225, 50, 50);
                    fill(225, 50, 50);
                drawQuad(x + 0.75, z + 0.75, y,
                         0.25,     0,       0.5);
                    }
                    if (grid[x][z][y].merged.indexOf("0,-1") !== -1) {
                    stroke(200, 50, 50);
                    fill(200, 50, 50);
                drawQuad(x + 0.25, z,    y,
                         0,        0.25, 0.5);
                    }
                    }
                    // -- TOP --
                    if (cam.a > 30) {
                    if (grid[x][z][y].merged.indexOf("0,-1") === -1) {
                    // Back left
                    stroke(0);
                    fill(0);
                    if (grid[x][z][y].merged.indexOf("-1,0") === -1 && grid[x][z][y].merged.indexOf("1,0") === -1) {
                    triangle((x + 0.875) * rw + (z + 0.125) * rw + xo, -(x + 0.875) * rh + (z + 0.125) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, (x + 0.5) * rw + (z + 0.5) * rw + xo, -(x + 0.5) * rh + (z + 0.5) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, (x + 0.125) * rw + (z + 0.125) * rw + xo, -(x + 0.125) * rh + (z + 0.125) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    } else if (grid[x][z][y].merged.indexOf("-1,0") !== -1 && grid[x][z][y].merged.indexOf("1,0") === -1) {
                        quad(((x + 0.875) + (z + 0.125)) * rw + xo, (-(x + 0.875) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x) + (z + 0.5)) * rw + xo, (-(x) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x) + (z + 0.125)) * rw + xo, (-(x) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    } else if (grid[x][z][y].merged.indexOf("-1,0") === -1 && grid[x][z][y].merged.indexOf("1,0") !== -1) {
                        quad(((x + 0.125) + (z + 0.125)) * rw + xo, (-(x + 0.125) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 1) + (z + 0.5)) * rw + xo, (-(x + 1) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 1) + (z + 0.125)) * rw + xo, (-(x + 1) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    } else {
                        quad(((x) + (z + 0.125)) * rw + xo, (-(x) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x) + (z + 0.5)) * rw + xo, (-(x) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 1) + (z + 0.5)) * rw + xo, (-(x + 1) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 1) + (z + 0.125)) * rw + xo, (-(x + 1) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    }
                    }
                    if (grid[x][z][y].merged.indexOf("1,0") === -1) {
                    // Back right
                    stroke(25);
                    fill(25);
                    if (grid[x][z][y].merged.indexOf("0,-1") === -1 && grid[x][z][y].merged.indexOf("0,1") === -1) {
                    triangle((x + 0.875) * rw + (z + 0.125) * rw + xo, -(x + 0.875) * rh + (z + 0.125) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, (x + 0.5) * rw + (z + 0.5) * rw + xo, -(x + 0.5) * rh + (z + 0.5) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, (x + 0.875) * rw + (z + 0.875) * rw + xo, -(x + 0.875) * rh + (z + 0.875) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    } else if (grid[x][z][y].merged.indexOf("0,-1") !== -1 && grid[x][z][y].merged.indexOf("0,1") === -1) {
                        quad(((x + 0.875) + (z + 0.875)) * rw + xo, (-(x + 0.875) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z)) * rw + xo, (-(x + 0.5) + (z)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.875) + (z)) * rw + xo, (-(x + 0.875) + (z)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    } else if (grid[x][z][y].merged.indexOf("0,-1") === -1 && grid[x][z][y].merged.indexOf("0,1") !== -1) {
                        quad(((x + 0.875) + (z + 0.125)) * rw + xo, (-(x + 0.875) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 1)) * rw + xo, (-(x + 0.5) + (z + 1)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.875) + (z + 1)) * rw + xo, (-(x + 0.875) + (z + 1)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    } else {
                        quad(((x + 0.875) + (z)) * rw + xo, (-(x + 0.875) + (z)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z)) * rw + xo, (-(x + 0.5) + (z)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 1)) * rw + xo, (-(x + 0.5) + (z + 1)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.875) + (z + 1)) * rw + xo, (-(x + 0.875) + (z + 1)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    }
                    }
                    }
                    // BACK
                    if (grid[x][z][y].merged.indexOf("1,0") !== -1 && grid[x][z][y].merged.indexOf("0,-1") !== -1) {
                        stroke(0);
                        fill(0);
                        quad(((x + 1) + (z + 0.5)) * rw + xo, (-(x + 1) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.875) + (z + 0.125)) * rw + xo, (-(x + 0.875) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 1) + (z + 0.125)) * rw + xo, (-(x + 1) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                        stroke(25);
                        fill(25);
                        quad(((x + 0.5) + (z)) * rw + xo, (-(x + 0.5) + (z)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.875) + (z + 0.125)) * rw + xo, (-(x + 0.875) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.875) + (z)) * rw + xo, (-(x + 0.875) + (z)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    }
                    // LEFT
                    if (grid[x][z][y].merged.indexOf("0,-1") !== -1 && grid[x][z][y].merged.indexOf("-1,0") !== -1) {
                        stroke(0);
                        fill(0);
                        quad(((x) + (z + 0.5)) * rw + xo, (-(x) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.125) + (z + 0.125)) * rw + xo, (-(x + 0.125) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x) + (z + 0.125)) * rw + xo, (-(x) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                        stroke(35);
                        fill(35);
                        quad(((x + 0.5) + (z)) * rw + xo, (-(x + 0.5) + (z)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.125) + (z + 0.125)) * rw + xo, (-(x + 0.125) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.125) + (z)) * rw + xo, (-(x + 0.125) + (z)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    }
                    // RIGHT
                    if (grid[x][z][y].merged.indexOf("1,0") !== -1 && grid[x][z][y].merged.indexOf("0,1") !== -1) {
                        stroke(50);
                        fill(50);
                        quad(((x + 1) + (z + 0.5)) * rw + xo, (-(x + 1) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.875) + (z + 0.875)) * rw + xo, (-(x + 0.875) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 1) + (z + 0.875)) * rw + xo, (-(x + 1) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                        stroke(25);
                        fill(25);
                        quad(((x + 0.5) + (z + 1)) * rw + xo, (-(x + 0.5) + (z + 1)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.875) + (z + 0.875)) * rw + xo, (-(x + 0.875) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.875) + (z + 1)) * rw + xo, (-(x + 0.875) + (z + 1)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    }
                    // FRONT
                    if (grid[x][z][y].merged.indexOf("-1,0") !== -1 && grid[x][z][y].merged.indexOf("0,1") !== -1) {
                        stroke(50);
                        fill(50);
                        quad(((x) + (z + 0.5)) * rw + xo, (-(x) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.125) + (z + 0.875)) * rw + xo, (-(x + 0.125) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x) + (z + 0.875)) * rw + xo, (-(x) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                        stroke(35);
                        fill(35);
                        quad(((x + 0.5) + (z + 1)) * rw + xo, (-(x + 0.5) + (z + 1)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.125) + (z + 0.875)) * rw + xo, (-(x + 0.125) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.125) + (z + 1)) * rw + xo, (-(x + 0.125) + (z + 1)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    }
                    if (grid[x][z][y].merged.indexOf("0,1") === -1) {
                    // Front right
                    stroke(50);
                    fill(50);
                    if (grid[x][z][y].merged.indexOf("-1,0") === -1 && grid[x][z][y].merged.indexOf("1,0") === -1) {
                    triangle((x + 0.125) * rw + (z + 0.875) * rw + xo, -(x + 0.125) * rh + (z + 0.875) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, (x + 0.5) * rw + (z + 0.5) * rw + xo, -(x + 0.5) * rh + (z + 0.5) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, (x + 0.875) * rw + (z + 0.875) * rw + xo, -(x + 0.875) * rh + (z + 0.875) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    } else if (grid[x][z][y].merged.indexOf("-1,0") !== -1 && grid[x][z][y].merged.indexOf("1,0") === -1) {
                        quad(((x + 0.875) + (z + 0.875)) * rw + xo, (-(x + 0.875) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x) + (z + 0.5)) * rw + xo, (-(x) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x) + (z + 0.875)) * rw + xo, (-(x) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    } else if (grid[x][z][y].merged.indexOf("-1,0") === -1 && grid[x][z][y].merged.indexOf("1,0") !== -1) {
                        quad(((x + 0.125) + (z + 0.875)) * rw + xo, (-(x + 0.125) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 1) + (z + 0.5)) * rw + xo, (-(x + 1) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 1) + (z + 0.875)) * rw + xo, (-(x + 1) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    } else {
                        quad(((x) + (z + 0.875)) * rw + xo, (-(x) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x) + (z + 0.5)) * rw + xo, (-(x) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 1) + (z + 0.5)) * rw + xo, (-(x + 1) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 1) + (z + 0.875)) * rw + xo, (-(x + 1) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    }
                    }
                    if (grid[x][z][y].merged.indexOf("-1,0") === -1) {
                    // Front left
                    stroke(35);
                    fill(35);
                    if (grid[x][z][y].merged.indexOf("0,-1") === -1 && grid[x][z][y].merged.indexOf("0,1") === -1) {
                    triangle((x + 0.125) * rw + (z + 0.125) * rw + xo, -(x + 0.125) * rh + (z + 0.125) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, (x + 0.5) * rw + (z + 0.5) * rw + xo, -(x + 0.5) * rh + (z + 0.5) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, (x + 0.125) * rw + (z + 0.875) * rw + xo, -(x + 0.125) * rh + (z + 0.875) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    } else if (grid[x][z][y].merged.indexOf("0,-1") !== -1 && grid[x][z][y].merged.indexOf("0,1") === -1) {
                        quad(((x + 0.125) + (z + 0.875)) * rw + xo, (-(x + 0.125) + (z + 0.875)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z)) * rw + xo, (-(x + 0.5) + (z)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.125) + (z)) * rw + xo, (-(x + 0.125) + (z)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    } else if (grid[x][z][y].merged.indexOf("0,-1") === -1 && grid[x][z][y].merged.indexOf("0,1") !== -1) {
                        quad(((x + 0.125) + (z + 0.125)) * rw + xo, (-(x + 0.125) + (z + 0.125)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 1)) * rw + xo, (-(x + 0.5) + (z + 1)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.125) + (z + 1)) * rw + xo, (-(x + 0.125) + (z + 1)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    } else {
                        quad(((x + 0.125) + (z)) * rw + xo, (-(x + 0.125) + (z)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z)) * rw + xo, (-(x + 0.5) + (z)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.5) + (z + 1)) * rw + xo, (-(x + 0.5) + (z + 1)) * rh - ((y + 1) * levelo) * s * sqrt2 + yo, ((x + 0.125) + (z + 1)) * rw + xo, (-(x + 0.125) + (z + 1)) * rh - ((y + 0.5) * levelo) * s * sqrt2 + yo);
                    }
                    }
                break;
            }
        break;
        case "ld-commercial":
            switch(grid[x][z][y].built) {
                case 0:
                break;
                case 1:
                    // BACK LEFT
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.25, y,
                         0,        0.125,   0.5);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.375, y,
                         0.125,     0,      0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.625, z + 0.25, y + 0.5,                                     0.126,     0.125,    0);
                    // BACK RIGHT
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.625, y,
                         0,        0.125,   0.5);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.75, y,
                         0.125,     0,      0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.625, z + 0.625, y + 0.5,                                   0.126,     0.125,    0);
                    // FRONT LEFT
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.25, z + 0.25, y,
                         0,        0.125,   0.5);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.375, y,
                         0.125,     0,      0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.25, z + 0.25, y + 0.5,                                     0.126,     0.125,    0);
                    // FRONT RIGHT
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.25, z + 0.625, y,
                         0,        0.125,   0.5);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.75, y,
                         0.125,     0,      0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.25, z + 0.625, y + 0.5,                                     0.126,     0.125,    0);
                break;
                case 2:
                    // -- SIDES --
                    if (cam.a < 90) {
                    // BACK LEFT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.25, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.375, y,
                         0.125,     0,    0.375);
                    // BACK LEFT -> FRONT LEFT
                drawQuad(x + 0.375, z + 0.375, y + 0.375,                                 0.25,    0,     0.125);
                    // BACK LEFT -> BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.375, y + 0.375,                                 0,         0.25, 0.125);
                    // FRONT LEFT
                drawQuad(x + 0.25, z + 0.25, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.375, y,
                         0.125,     0,    0.375);
                    // BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.625, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.75, y,
                         0.125,     0,    0.375);
                    // FRONT RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.25, z + 0.625, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.75, y,
                         0.125,     0,    0.375);
                    // FRONT LEFT -> FRONT RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.25, z + 0.25, y + 0.375,                                   0,        0.5,   0.125);
                    // FRONT RIGHT -> BACK RIGHT
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.75, y + 0.375,                                   0.5,      0,     0.125);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x + 0.25, z + 0.25, y + 0.5,                                     0.5,      0.125,    0);
                    // FRONT RIGHT -> BACK RIGHT
                drawQuad(x + 0.25, z + 0.625, y + 0.5,                                     0.5,      0.125,     0);
                    // BACK LEFT -> BACK RIGHT
                drawQuad(x + 0.625, z + 0.375, y + 0.5,                                   0.125,     0.25,     0);
                    // FRONT LEFT -> FRONT RIGHT
                drawQuad(x + 0.25, z + 0.375, y + 0.5,                                     0.125,    0.25,      0);
                break;
                case 3:
                    // -- SIDES --
                    if (cam.a < 90) {
                    // WALLS + DOOR (BACK)
                    stroke(150, 100, 75);
                    fill(150, 100, 75);
                drawQuad(x + 0.75, z + 0.25, y,
                         0,        0.5,     0.5);
                    stroke(125, 75, 50);
                    fill(125, 75, 50);
                drawQuad(x + 0.25, z + 0.25, y,
                         0.5,      0,       0.5);
                    // BACK LEFT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.25, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.375, y,
                         0.125,     0,    0.375);
                    // BACK LEFT -> FRONT LEFT
                drawQuad(x + 0.375, z + 0.375, y + 0.375,                                 0.25,    0,     0.125);
                    // BACK LEFT -> BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.375, y + 0.375,                                 0,         0.25, 0.125);
                    // WALLS + DOOR (FRONT)
                    stroke(150, 100, 75);
                    fill(150, 100, 75);
                drawQuad(x + 0.25, z + 0.25, y,
                         0,        0.5,     0.5);
                    stroke(175, 125, 100);
                    fill(175, 125, 100);
                drawQuad(x + 0.25, z + 0.75, y,
                         0.5,      0,       0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x + 0.25, z + 0.25, y + 0.5,                                     0.5,      0.125,    0);
                    // FRONT RIGHT -> BACK RIGHT
                drawQuad(x + 0.25, z + 0.625, y + 0.5,                                     0.5,      0.125,     0);
                    // BACK LEFT -> BACK RIGHT
                drawQuad(x + 0.625, z + 0.375, y + 0.5,                                   0.125,     0.25,     0);
                    // FRONT LEFT -> FRONT RIGHT
                drawQuad(x + 0.25, z + 0.375, y + 0.5,                                     0.125,    0.25,      0);
                break;
                default:
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(150, 100, 75);
                    fill(150, 100, 75);
                drawQuad(x + 0.25, z + 0.25, y,
                         0,        0.5,     0.5);
                    stroke(100, 50, 0);
                    fill(100, 50, 0);
                drawQuad(x + 0.25, z + 0.375, y,
                         0,        0.125, 0.375);
                    stroke(175, 125, 100);
                    fill(175, 125, 100);
                drawQuad(x + 0.25, z + 0.75, y,
                         0.5,      0,       0.5);
                    }
                    // -- TOP --
                    // ROOF
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.25, z + 0.25, y + 0.5,
                         0.5,      0.5,      0);
                    // OVERHANG
                    stroke(255, 100, 100);
                    fill(255, 100, 100);
                drawQuad(x + 0.1875, z + 0.25, y + 0.4375,
                         0.0625,     0.125,    0.0625, true);
                drawQuad(x + 0.1875, z + 0.5, y + 0.4375,
                         0.0625,     0.125,    0.0625, true);
                    stroke(255);
                    fill(255);
                drawQuad(x + 0.1875, z + 0.375, y + 0.4375,
                         0.0625,     0.125,     0.0625, true);
                drawQuad(x + 0.1875, z + 0.625, y + 0.4375,
                         0.0625,     0.125,     0.0625, true);
                    // STORE ROOF
                    
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(175);
                    fill(175);
                    // BACK LEFT -> FRONT LEFT
                drawQuad(x + 0.375, z + 0.375, y + 0.5,                                 0.25,    0,     0.125);
                    // BACK LEFT -> BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.375, y + 0.5,                                 0,         0.25, 0.125);
                    // FRONT LEFT -> FRONT RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.25, z + 0.25, y + 0.5,                                   0,        0.5,   0.125);
                    // FRONT RIGHT -> BACK RIGHT
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.75, y + 0.5,                                   0.5,      0,     0.125);
                    // -- TOP --
                    stroke(200);
                    fill(200);
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x + 0.25, z + 0.25, y + 0.625,                                0.5,      0.125,    0);
                    // FRONT RIGHT -> BACK RIGHT
                drawQuad(x + 0.25, z + 0.625, y + 0.625,                               0.5,      0.125,     0);
                    // BACK LEFT -> BACK RIGHT
                drawQuad(x + 0.625, z + 0.375, y + 0.625,                              0.125,     0.25,     0);
                    // FRONT LEFT -> FRONT RIGHT
                drawQuad(x + 0.25, z + 0.375, y + 0.625,                               0.125,    0.25,      0);
                    }
                break;
            }
        break;
        case "ld-industrial":
            switch(grid[x][z][y].built) {
                case 0:
                break;
                case 1:
                    // BACK LEFT
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.25, y,
                         0,        0.125,   0.5);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.375, y,
                         0.125,     0,      0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.625, z + 0.25, y + 0.5,                                     0.126,     0.125,    0);
                    // BACK RIGHT
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.625, y,
                         0,        0.125,   0.5);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.75, y,
                         0.125,     0,      0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.625, z + 0.625, y + 0.5,                                   0.126,     0.125,    0);
                    // FRONT LEFT
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.25, z + 0.25, y,
                         0,        0.125,   0.5);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.375, y,
                         0.125,     0,      0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.25, z + 0.25, y + 0.5,                                     0.126,     0.125,    0);
                    // FRONT RIGHT
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.25, z + 0.625, y,
                         0,        0.125,   0.5);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.75, y,
                         0.125,     0,      0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.25, z + 0.625, y + 0.5,                                     0.126,     0.125,    0);
                break;
                case 2:
                    // -- SIDES --
                    if (cam.a < 90) {
                    // BACK LEFT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.25, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.375, y,
                         0.125,     0,    0.375);
                    // BACK LEFT -> FRONT LEFT
                drawQuad(x + 0.375, z + 0.375, y + 0.375,                                 0.25,    0,     0.125);
                    // BACK LEFT -> BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.375, y + 0.375,                                 0,         0.25, 0.125);
                    // FRONT LEFT
                drawQuad(x + 0.25, z + 0.25, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.375, y,
                         0.125,     0,    0.375);
                    // BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.625, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.75, y,
                         0.125,     0,    0.375);
                    // FRONT RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.25, z + 0.625, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.75, y,
                         0.125,     0,    0.375);
                    // FRONT LEFT -> FRONT RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.25, z + 0.25, y + 0.375,                                   0,        0.5,   0.125);
                    // FRONT RIGHT -> BACK RIGHT
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.25, z + 0.75, y + 0.375,                                   0.5,      0,     0.125);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x + 0.25, z + 0.25, y + 0.5,                                     0.5,      0.125,    0);
                    // FRONT RIGHT -> BACK RIGHT
                drawQuad(x + 0.25, z + 0.625, y + 0.5,                                     0.5,      0.125,     0);
                    // BACK LEFT -> BACK RIGHT
                drawQuad(x + 0.625, z + 0.375, y + 0.5,                                   0.125,     0.25,     0);
                    // FRONT LEFT -> FRONT RIGHT
                drawQuad(x + 0.25, z + 0.375, y + 0.5,                                     0.125,    0.25,      0);
                break;
                case 3:
                    // -- SIDES --
                    if (cam.a < 90) {
                    // WALLS + DOOR (BACK)
                    stroke(75);
                    fill(75);
                drawQuad(x + 0.75, z + 0.25, y,
                         0,        0.5,     0.5);
                    stroke(50);
                    fill(50);
                drawQuad(x + 0.25, z + 0.25, y,
                         0.5,      0,       0.5);
                    // BACK LEFT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.25, y,
                         0,        0.125, 0.375);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.625, z + 0.375, y,
                         0.125,     0,    0.375);
                    // BACK LEFT -> FRONT LEFT
                drawQuad(x + 0.375, z + 0.375, y + 0.375,                                 0.25,    0,     0.125);
                    // BACK LEFT -> BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.625, z + 0.375, y + 0.375,                                 0,         0.25, 0.125);
                    // WALLS + DOOR (FRONT)
                    stroke(75);
                    fill(75);
                drawQuad(x + 0.25, z + 0.25, y,
                         0,        0.5,     0.5);
                    stroke(100);
                    fill(100);
                drawQuad(x + 0.25, z + 0.75, y,
                         0.5,      0,       0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x + 0.25, z + 0.25, y + 0.5,                                     0.5,      0.125,    0);
                    // FRONT RIGHT -> BACK RIGHT
                drawQuad(x + 0.25, z + 0.625, y + 0.5,                                     0.5,      0.125,     0);
                    // BACK LEFT -> BACK RIGHT
                drawQuad(x + 0.625, z + 0.375, y + 0.5,                                   0.125,     0.25,     0);
                    // FRONT LEFT -> FRONT RIGHT
                drawQuad(x + 0.25, z + 0.375, y + 0.5,                                     0.125,    0.25,      0);
                break;
                default:
                    // -- TOP --
                    // ROOF
                    stroke(125);
                    fill(125);
                drawQuad(x + 0.25, z + 0.25, y + 0.5,
                         0.5,      0.5,      0);
                    // SMOKE STACK
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.4375, z + 0.4375, y + 0.5,
                         0.125,      0,          0.5);
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.5625, z + 0.4375, y + 0.5,
                         0,          0.125,      0.5);
                    }
                    fill(0);
                    stroke(0);
                drawQuad(x + 0.4375, z + 0.4375, y + 0.5,
                         0.125,      0.125,      0);
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.4375, z + 0.375, y + 1,
                         0.1875,     0.0625,    0);
                drawQuad(x + 0.5625, z + 0.4375, y + 1,
                         0.0625,     0.125,      0);
                    // SMOKE
                    noStroke();
                    for (var i = 0; i < 5; i++) {
                        fill(255, 200 - ((i * 0.4 + frameCount / 100) % 2) * 100);
                        ellipse(((x + 0.5) + (z + 0.5)) * rw + xo, (-(x + 0.5) + (z + 0.5)) * rh - ((y + ((i * 0.4 + frameCount / 100) % 2) + 0.5) * levelo) * s * sqrt2 + yo, rw * 0.125, rw * 0.125);
                    }
                    // -- SIDES --
                    if (cam.a < 90) {
                    // BUILDING SIDES
                    stroke(75);
                    fill(75);
                drawQuad(x + 0.25, z + 0.25, y,
                         0,        0.5,     0.5);
                    stroke(100);
                    fill(100);
                drawQuad(x + 0.25, z + 0.75, y,
                         0.5,      0,       0.5);
                    // SMOKE STACK SIDES
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.375, z + 0.375, y + 0.5,
                         0,         0.25,      0.5);
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.375, z + 0.625, y + 0.5,
                             0.25,      0,         0.5);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                drawQuad(x + 0.375, z + 0.5625, y + 1,
                         0.25,      0.0625,     0);
                drawQuad(x + 0.375, z + 0.375, y + 1,
                         0.0625,    0.1875,    0);
                break;
            }
        break;
        case "road":
            switch(grid[x][z][y].built) {
                case 0:
                break;
                case 1:
                    // SIDEWALK
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(175);
                    fill(175);
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x + 0.125, z + 0.125, y,
                         0.75,      0,         0.03125);
                    // BACK LEFT -> BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.875, z + 0.125, y,
                         0,         0.75,      0.03125);
                    // FRONT LEFT -> FRONT RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x, z, y,
                         0, 1, 0.03125);
                    // FRONT RIGHT -> BACK RIGHT
                    stroke(175);
                    fill(175);
                drawQuad(x, z + 1, y,
                         1, 0,     0.03125);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x, z,     y + 0.03125,
                         1, 0.125, 0);
                    // FRONT RIGHT -> BACK RIGHT
                drawQuad(x,   z + 0.875, y + 0.03125,
                         1, 0.125,     0);
                    // BACK LEFT -> BACK RIGHT
                drawQuad(x + 0.875, z + 0.125, y + 0.03125,
                         0.125,     0.75,      0);
                    // FRONT LEFT -> FRONT RIGHT
                drawQuad(x,     z + 0.125, y + 0.03125,
                         0.125, 0.75,      0);
                break;
                case 2:
                    // SIDEWALK
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(175);
                    fill(175);
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x + 0.125, z + 0.125, y,
                         0.75,      0,         0.0625);
                    // BACK LEFT -> BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.875, z + 0.125, y,
                         0,         0.75,      0.0625);
                    // FRONT LEFT -> FRONT RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x, z, y,
                         0, 1, 0.0625);
                    // FRONT RIGHT -> BACK RIGHT
                    stroke(175);
                    fill(175);
                drawQuad(x, z + 1, y,
                         1, 0,     0.0625);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x, z,     y + 0.0625,
                         1, 0.125, 0);
                    // FRONT RIGHT -> BACK RIGHT
                drawQuad(x,   z + 0.875, y + 0.0625,
                         1, 0.125,     0);
                    // BACK LEFT -> BACK RIGHT
                drawQuad(x + 0.875, z + 0.125, y + 0.0625,
                         0.125,     0.75,      0);
                    // FRONT LEFT -> FRONT RIGHT
                drawQuad(x,     z + 0.125, y + 0.0625,
                         0.125, 0.75,      0);
                break;
                case 3:
                    // SIDEWALK
                    // -- SIDES --
                    if (cam.a < 90) {
                    stroke(175);
                    fill(175);
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x + 0.125, z + 0.125, y,
                         0.75,      0,         0.09375);
                    // BACK LEFT -> BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.875, z + 0.125, y,
                         0,         0.75,      0.09375);
                    // FRONT LEFT -> FRONT RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x, z, y,
                         0, 1, 0.09375);
                    // FRONT RIGHT -> BACK RIGHT
                    stroke(175);
                    fill(175);
                drawQuad(x, z + 1, y,
                         1, 0,     0.09375);
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x, z,     y + 0.09375,
                         1, 0.125, 0);
                    // FRONT RIGHT -> BACK RIGHT
                drawQuad(x,   z + 0.875, y + 0.09375,
                         1, 0.125,     0);
                    // BACK LEFT -> BACK RIGHT
                drawQuad(x + 0.875, z + 0.125, y + 0.09375,
                         0.125,     0.75,      0);
                    // FRONT LEFT -> FRONT RIGHT
                drawQuad(x,     z + 0.125, y + 0.09375,
                         0.125, 0.75,      0);
                break;
                default:
                    // SIDEWALK
                    // -- SIDES --
                    if (cam.a < 90) {
                    if (grid[x][z][y].merged.indexOf("0,-1") === -1) {
                    // FRONT LEFT -> BACK LEFT
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.125, z + 0.125, y,
                         0.75,      0,         0.125);
                    } else {
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.875, z,     y,
                         0,         0.125, 0.125);
                    }
                    if (grid[x][z][y].merged.indexOf("1,0") === -1) {
                    // BACK LEFT -> BACK RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x + 0.875, z + 0.125, y,
                         0,         0.75,      0.125);
                    } else {
                    stroke(175);
                    fill(175);
                drawQuad(x + 0.875, z + 0.125, y,
                         0.125,     0,         0.125);
                    }
                    if (grid[x][z][y].merged.indexOf("-1,0") === -1) {
                    // FRONT LEFT -> FRONT RIGHT
                    stroke(150);
                    fill(150);
                drawQuad(x, z, y,
                         0, 1, 0.125);
                    } else {
                    stroke(175);
                    fill(175);
                drawQuad(x,     z + 0.125, y,
                         0.125, 0,         0.125);
                    }
                    if (grid[x][z][y].merged.indexOf("0,1") === -1) {
                    // FRONT RIGHT -> BACK RIGHT
                    stroke(175);
                    fill(175);
                drawQuad(x, z + 1, y,
                         1, 0,     0.125);
                    } else {
                        stroke(150);
                        fill(150);
                drawQuad(x + 0.875, z + 0.875, y,
                         0,         0.125,     0.125);
                    }
                    }
                    // -- TOP --
                    stroke(200);
                    fill(200);
                    // BACK LEFT
                drawQuad(x + 0.875, z,     y + 0.125,
                         0.125,     0.125, 0);
                    // BACK RIGHT
                drawQuad(x + 0.875, z + 0.875, y + 0.125,
                         0.125,     0.125,     0);
                    // FRONT LEFT
                drawQuad(x,     z,     y + 0.125,
                         0.125, 0.125, 0);
                    // FRONT RIGHT
                drawQuad(x,     z + 0.875, y + 0.125,
                         0.125, 0.125,     0);
                    if (grid[x][z][y].merged.indexOf("0,-1") === -1) {
                    // FRONT LEFT -> BACK LEFT
                drawQuad(x + 0.125, z,     y + 0.125,
                         0.75,      0.125, 0);
                    }
                    if (grid[x][z][y].merged.indexOf("0,1") === -1) {
                    // FRONT RIGHT -> BACK RIGHT
                drawQuad(x + 0.125, z + 0.875, y + 0.125,
                         0.75,      0.125,     0);
                    }
                    if (grid[x][z][y].merged.indexOf("1,0") === -1) {
                    // BACK LEFT -> BACK RIGHT
                drawQuad(x + 0.875, z + 0.125, y + 0.125,
                         0.125,     0.75,      0);
                    }
                    if (grid[x][z][y].merged.indexOf("-1,0") === -1) {
                    // FRONT LEFT -> FRONT RIGHT
                drawQuad(x,     z + 0.125, y + 0.125,
                         0.125, 0.75,      0);
                    }
                break;
            }
        break;
    }
}

var options, selectedOption, mergeAllowed;
function drawGrid() {
    var cb; // Current Block
    s = tileSize * cam.zoom;
    rw = s * sqrt2;
    rh = s * sqrt2 * Math.sin(cam.a * Math.PI / 180);
    xo = width / 2 - (cam.x + cam.z) * rw - rw;
    yo = height / 2 + cam.x * rh - cam.z * rh;
    levelo = Math.cos(cam.a * Math.PI / 180);
    strokeWeight(1);
    mergeAllowed = false;
    if (selected.group.length !== 0) {
        mergeAllowed = true;
        for (var i = 0; i < selected.group.length; i++) {
                var tileX = selected.group[i].split(",")[0];
                var tileZ = selected.group[i].split(",")[1];
                // IF not mergeable OR not built OR not same type as first block = NOT ELIGIBLE
                if (mergeable.indexOf(grid[tileX][tileZ][0].type) === -1 || grid[tileX][tileZ][0].built < 4 || grid[tileX][tileZ][0].type !== grid[selected.group[0].split(",")[0]][selected.group[0].split(",")[1]][0].type) {
                    mergeAllowed = false;
                }
            }
    }
    for (var x = grid.length - 1; x >= 0; x--) {
        for (var z = 0; z < grid[x].length; z++) {
            // Update/Display ON SCREEN:
            if (x * rw + z * rw + xo + rw * 2 >= 0 && x * rw + z * rw + xo <= width && -x * rh + z * rh + yo + rh >= 0 && -x * rh + z * rh + yo - rh <= height) { // TODO: show tops of buildings
                switch(grid[x][z][0].type) {
                    case "road":
                        stroke(160);
                        fill(160);
                    break;
                    case "tree":
                    case "bush":
                    case "stump":
                        stroke(0, 150, 0);
                        fill(0, 150, 0);
                    break;
                    case "small-rock":
                    case "large-rock":
                        stroke(160);
                        fill(160);
                    break;
                    case "ld-residential":
                        stroke(255, 200, 100);
                        fill(255, 200, 100);
                        if (grid[x][z][0].built >= 4) {
                            stroke(160);
                            fill(160);
                        }
                    break;
                    case "md-residential":
                        stroke(225, 175, 75);
                        fill(225, 175, 75);
                        if (grid[x][z][0].built >= 4) {
                            stroke(160);
                            fill(160);
                        }
                    break;
                    case "hd-residential":
                        stroke(200, 150, 50);
                        fill(200, 150, 50);
                        if (grid[x][z][0].built >= 4) {
                            stroke(160);
                            fill(160);
                        }
                    break;
                    case "ld-commercial":
                        stroke(200, 100, 255);
                        fill(200, 100, 255);
                        if (grid[x][z][0].built >= 4) {
                            stroke(160);
                            fill(160);
                        }
                    break;
                    case "md-commercial":
                        stroke(175, 75, 225);
                        fill(175, 75, 225);
                        if (grid[x][z][0].built >= 4) {
                            stroke(160);
                            fill(160);
                        }
                    break;
                    case "hd-commercial":
                        stroke(150, 50, 200);
                        fill(150, 50, 200);
                        if (grid[x][z][0].built >= 4) {
                            stroke(160);
                            fill(160);
                        }
                    break;
                    case "ld-industrial":
                        stroke(255, 100, 100);
                        fill(255, 100, 100);
                        if (grid[x][z][0].built >= 4) {
                            stroke(160);
                            fill(160);
                        }
                    break;
                    case "md-industrial":
                        stroke(225, 75, 75);
                        fill(225, 75, 75);
                        if (grid[x][z][0].built >= 4) {
                            stroke(160);
                            fill(160);
                        }
                    break;
                    case "hd-industrial":
                        stroke(200, 50, 50);
                        fill(200, 50, 50);
                        if (grid[x][z][0].built >= 4) {
                            stroke(160);
                            fill(160);
                        }
                    break;
                    case "water":
                        stroke(50, 100, 200);
                        fill(50, 100, 200);
                    break;
                    default:
                        stroke(100);
                        fill(50);
                    break;
                }
                if (selected.start.x !== -1 && isBetween(x, selected.start.x, selected.stop.x) && isBetween(z, selected.start.z, selected.stop.z)) {
                    switch(options[selectedOption]) {
                        case "Build":
                            if (grid[x][z][0].type === "empty") {
                                switch(buildings[selectedCategory].contents[selectedBuilding].type.toLowerCase().split(" ").join("-")) {
                                    case "road":
                                        stroke(160);
                                        fill(160);
                                    break;
                                    case "tree":
                                    case "bush":
                                    case "stump":
                                        stroke(0, 150, 0);
                                        fill(0, 150, 0);
                                    break;
                                    case "small-rock":
                                    case "large-rock":
                                        stroke(160);
                                        fill(160);
                                    break;
                                    case "ld-residential":
                                        stroke(255, 200, 100);
                                        fill(255, 200, 100);
                                    break;
                                    case "md-residential":
                                        stroke(225, 175, 75);
                                        fill(225, 175, 75);
                                    break;
                                    case "hd-residential":
                                        stroke(200, 150, 50);
                                        fill(200, 150, 50);
                                    break;
                                    case "ld-commercial":
                                        stroke(200, 100, 255);
                                        fill(200, 100, 255);
                                    break;
                                    case "md-commercial":
                                        stroke(175, 75, 225);
                                        fill(175, 75, 225);
                                    break;
                                    case "hd-commercial":
                                        stroke(150, 50, 200);
                                        fill(150, 50, 200);
                                    break;
                                    case "ld-industrial":
                                        stroke(255, 100, 100);
                                        fill(255, 100, 100);
                                    break;
                                    case "md-industrial":
                                        stroke(225, 75, 75);
                                        fill(225, 75, 75);
                                    break;
                                    case "hd-industrial":
                                        stroke(200, 50, 50);
                                        fill(200, 50, 50);
                                    break;
                                    case "water":
                                        stroke(50, 100, 200);
                                        fill(50, 100, 200);
                                    break;
                                    default:
                                        stroke(100);
                                        fill(50);
                                    break;
                                }
                            }
                        break;
                        case "Demolish":
                            stroke(200, 0, 0);
                            fill(100, 0, 0);
                        break;
                    }
                }
                // TODO: make merge work on other y levels
                if (selected.group.length !== 0 && selected.group.indexOf(x + "," + z) !== -1) {
                    if (mergeable.indexOf(grid[x][z][0].type) !== -1 && grid[x][z][0].built >= 4 && grid[x][z][0].type === grid[selected.group[0].split(",")[0]][selected.group[0].split(",")[1]][0].type) {
                        if (mergeAllowed) {
                            stroke(0, 150, 0);
                            fill(0, 200, 0);
                        } else {
                            stroke(255, 150, 0);
                            fill(255, 200, 0);
                        }
                    } else {
                        stroke(200, 0, 0);
                        fill(100, 0, 0);
                    }
                }
                quad(x * rw + z * rw + xo, -x * rh + z * rh + yo, (x + 1) * rw + z * rw + xo, -(x + 1) * rh + z * rh + yo, (x + 1) * rw + (z + 1) * rw + xo, -(x + 1) * rh + (z + 1) * rh + yo, x * rw + (z + 1) * rw + xo, -x * rh + (z + 1) * rh + yo);
                if (grid[x][z][0].type !== "empty") {
                    for (var y = 0; y < grid[x][z].length; y++) {
                        drawBlock(x, z, y);
                    }
                }
            }
            // Update ALL:
            if (grid[x][z].length > 1) {
                for (var y = 0; y < grid[x][z].length; y++) {
                    if (Math.random() > 0.99 && grid[x][z][y].type !== "empty") {
                        grid[x][z][y].built++;
                    }
                }
            } else {
                if (Math.random() > 0.99 && grid[x][z][0].type !== "empty") {
                    grid[x][z][0].built++;
                }
            }
        }
    }
}

function drawToolbar() {
    if (selected.start.x === -1 && selected.group.length === 0) {
        stroke(240);
        fill(255);
        (rect)(-1, height - 60, options.length * 60 + 20, 60, 0, 10, 0, 0);
        (rect)(0, height - 90, 80, 30, 0, 10, 0, 0);
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(12);
        text(round(frameRate()) + " FPS " + cam.a, 40, height - 74);
        if (mouseX <= options.length * 60 + 20 && mouseY >= height - 60) {
            mouseIsPressed = false;
        }
        for (var i = 0; i < options.length; i++) {
            strokeWeight(1);
            noFill();
            stroke(240);
            if (mouseX >= i * 60 + 20 && mouseY >= height - 50 && mouseX <= i * 60 + 60 && mouseY <= height - 10) {
                hoverDuration.options[i]++;
                if (hoverDuration.options[i] >= 30) {
                    textSize(12);
                    textAlign(CENTER, CENTER);
                    fill(50);
                    noStroke();
                    rect(i * 60 + 40 - (textWidth(options[i]) + 30) / 2, height - 83, textWidth(options[i]) + 30, 25, 10);
                    triangle(i * 60 + 30, height - 58, i * 60 + 50, height - 58, i * 60 + 40, height - 53);
                    fill(255);
                    text(options[i], i * 60 + 40, height - 70);
                }
                stroke(240);
                fill(250);
                cursor(HAND);
                if (mc) {
                    selectedOption = i;
                    // Reset Build category and building selections:
                    selectedCategory = -1;
                    selectedBuilding = -1;
                    mc = false;
                }
            } else {
                hoverDuration.options[i] = 0;
            }
            if (selectedOption === i) {
                fill(250);
            }
            rect(i * 60 + 20, height - 50, 40, 40, 5);
            switch(options[i]) {
                case "Move":
                    noFill();
                    stroke(50, 150, 50);
                    strokeWeight(2);
                    line(i * 60 + 34, height - 24, i * 60 + 46, height - 36);
                    beginShape();
                    vertex(i * 60 + 30, height - 25);
                    vertex(i * 60 + 30, height - 20);
                    vertex(i * 60 + 35, height - 20);
                    endShape();
                    beginShape();
                    vertex(i * 60 + 50, height - 35);
                    vertex(i * 60 + 50, height - 40);
                    vertex(i * 60 + 45, height - 40);
                    endShape();
                break;
                case "Rotate":
                    noFill();
                    stroke(150, 50, 150);
                    strokeWeight(2);
                    arc(i * 60 + 40, height - 30, 20, 20, -150, 140);
                    beginShape();
                    vertex(i * 60 + 29, height - 22);
                    vertex(i * 60 + 29, height - 28);
                    vertex(i * 60 + 34, height - 28);
                    endShape();
                break;
                case "Zoom":
                    noFill();
                    stroke(50, 150, 150);
                    strokeWeight(2);
                    ellipse(i * 60 + 35, height - 35, 15, 15);
                    line(i * 60 + 43, height - 27, i * 60 + 50, height - 20);
                break;
                case "Build":
                    noFill();
                    stroke(200, 150, 50);
                    strokeWeight(2);
                    line(i * 60 + 40, height - 40, i * 60 + 40, height - 20);
                    line(i * 60 + 30, height - 30, i * 60 + 36, height - 30);
                    line(i * 60 + 44, height - 30, i * 60 + 50, height - 30);
                break;
                case "Demolish":
                    noFill();
                    stroke(150, 50, 50);
                    strokeWeight(2);
                    push();
                    translate(i * 60 + 40, height - 30);
                    rotate(45);
                    line(0, -10, 0, 10);
                    line(-10, 0, -4, 0);
                    line(4, 0, 10, 0);
                    pop();
                break;
                case "Merge":
                    noFill();
                    stroke(50, 100, 200);
                    strokeWeight(2);
                    push();
                    translate(i * 60 + 37, height - 30);
                    rotate(45);
                    beginShape();
                    vertex(-10, 0);
                    vertex(0, 0);
                    vertex(0, 10);
                    endShape();
                    pop();
                    push();
                    translate(i * 60 + 43, height - 30);
                    rotate(45);
                    beginShape();
                    vertex(0, -10);
                    vertex(0, 0);
                    vertex(10, 0);
                    endShape();
                    // line(0, -10, 0, 10);
                    // line(-10, 0, -4, 0);
                    // line(4, 0, 10, 0);
                    pop();
                break;
            }
        }
    } else {
        switch(options[selectedOption]) {
            case "Build":
            case "Demolish":
            case "Merge":
                stroke(200, 0, 0);
                fill(100, 0, 0);
                (rect)(-1, height - 60, options.length * 60 + 20, 60, 0, 10, 0, 0);
                (rect)(0, height - 90, 80, 30, 0, 10, 0, 0);
                fill(255, 0, 0);
                textAlign(CENTER, CENTER);
                textSize(12);
                text(round(frameRate()) + " FPS", 40, height - 74);
                textSize(24);
                text("Cancel", options.length * 30 + 10, height - 30);
                if (mouseX <= options.length * 60 + 20 && mouseY >= height - 60) {
                    mouseIsPressed = false;
                    selected = {
                        start: {
                            x: -1,
                            z: -1
                        },
                        stop: {
                            x: -1,
                            z: -1
                        },
                        group: []
                    };
                }
            break;
        }
    }
    if (options[selectedOption] === "Build" && selected.start.x === -1) {
        strokeWeight(1);
        stroke(240);
        fill(255);
        (rect)(-1, -1, buildings.length * 60 + 20, 60, 0, 0, 10, 0);
        if (mouseX <= buildings.length * 60 + 20 && mouseY <= 60 || selectedCategory !== -1 && mouseX <= buildings[selectedCategory].contents.length * 60 + 20 && mouseY >= 60 && mouseY <= 120) {
            mouseIsPressed = false;
        }
        if (selectedCategory !== -1) {
            stroke(240);
            fill(255);
            (rect)(-1, 59, buildings[selectedCategory].contents.length * 60 + 20, 60, 0, 10, 10, 0);
            for (var i = 0; i < buildings[selectedCategory].contents.length; i++) {
                strokeWeight(1);
                noFill();
                stroke(240);
                if (mouseX >= i * 60 + 20 && mouseY >= 70 && mouseX <= i * 60 + 60 && mouseY <= 110) {
                    hoverDuration.buildings[i]++;
                    if (hoverDuration.buildings[i] >= 30) {
                        textSize(12);
                        textAlign(CENTER, CENTER);
                        fill(50);
                        noStroke();
                        rect(max(i * 60 + 40 - (textWidth(buildings[selectedCategory].contents[i].type) + 30) / 2, 0), 118, textWidth(buildings[selectedCategory].contents[i].type) + 30, 25, 10);
                        triangle(i * 60 + 30, 118, i * 60 + 50, 118, i * 60 + 40, 113);
                        fill(255);
                        text(buildings[selectedCategory].contents[i].type, i * 60 + 40 + (i * 60 + 40 - (textWidth(buildings[selectedCategory].contents[i].type) + 30) / 2 < 0 ? -(i * 60 + 40 - (textWidth(buildings[selectedCategory].contents[i].type) + 30) / 2) : 0), 131);
                    }
                    stroke(240);
                    fill(250);
                    cursor(HAND);
                    if (mc) {
                        if (selectedBuilding === i) {
                            selectedBuilding = -1;
                        } else {
                            selectedBuilding = i;
                        }
                        mc = false;
                    }
                } else {
                    hoverDuration.buildings[i] = 0;
                }
                if (selectedBuilding === i) {
                    fill(250);
                }
                rect(i * 60 + 20, 70, 40, 40, 5);
                var rw = 15;
                var rh = rw * sin(cam.a);
                var xo = i * 60 + 25;
                var yo = 90 + cos(cam.a) * 10;
                var levelo = cos(cam.a) * 20;
                switch(buildings[selectedCategory].contents[i].type) {
                    case "LD Residential":
                        // GROUND
                        stroke(255, 200, 100);
                        fill(255, 200, 100);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                    break;
                    case "MD Residential":
                        // GROUND
                        stroke(225, 175, 75);
                        fill(225, 175, 75);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                    break;
                    case "HD Residential":
                        // GROUND
                        stroke(200, 150, 50);
                        fill(200, 150, 50);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                    break;
                    case "LD Commercial":
                        // GROUND
                        stroke(200, 100, 255);
                        fill(200, 100, 255);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                    break;
                    case "MD Commercial":
                        // GROUND
                        stroke(175, 75, 225);
                        fill(175, 75, 225);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                    break;
                    case "HD Commercial":
                        // GROUND
                        stroke(150, 50, 200);
                        fill(150, 50, 200);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                    break;
                    case "LD Industrial":
                        // GROUND
                        stroke(255, 100, 100);
                        fill(255, 100, 100);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                    break;
                    case "MD Industrial":
                        // GROUND
                        stroke(225, 75, 75);
                        fill(225, 75, 75);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                    break;
                    case "HD Industrial":
                        // GROUND
                        stroke(200, 50, 50);
                        fill(200, 50, 50);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                    break;
                    case "Tree":
                        // GROUND
                        stroke(0, 150, 0);
                        fill(0, 150, 0);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                        // TRUNK
                        stroke(200, 100, 0);
                        fill(200, 100, 0);
                        quad(0.375 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 - (0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 + yo, 0.375 * rw * 2 + xo, yo);
                        stroke(225, 125, 0);
                        fill(225, 125, 0);
                        quad(0.5 * rw * 2 + xo, 0.125 * rh * 2 - (0.5 * levelo) + yo, 0.625 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.625 * rw * 2 + xo, yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 + yo);
                        // LEAVES
                        stroke(0, 200, 0);
                        fill(0, 200, 0);
                        quad(0.25 * rw * 2 + xo, -(levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 - (levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 - (0.5 * levelo) + yo, 0.25 * rw * 2 + xo, -(0.5 * levelo) + yo);
                        stroke(0, 225, 0);
                        fill(0, 225, 0);
                        quad(0.5 * rw * 2 + xo, 0.25 * rh * 2 - (levelo) + yo, 0.75 * rw * 2 + xo, -(levelo) + yo, 0.75 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 - (0.5 * levelo) + yo);
                        stroke(0, 255, 0);
                        fill(0, 255, 0);
                        quad(0.25 * rw * 2 + xo, -(levelo) + yo, 0.5 * rw * 2 + xo, -0.5 * rh - (levelo) + yo, 0.75 * rw * 2 + xo, -(levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 - (levelo) + yo);
                    break;
                    case "Bush":
                        // GROUND
                        stroke(0, 150, 0);
                        fill(0, 150, 0);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                        // BUSH
                        stroke(0, 200, 0);
                        fill(0, 200, 0);
                        quad(0.25 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 - (0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 + yo, 0.25 * rw * 2 + xo, yo);
                        stroke(0, 225, 0);
                        fill(0, 225, 0);
                        quad(0.5 * rw * 2 + xo, 0.25 * rh * 2 - (0.5 * levelo) + yo, 0.75 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.75 * rw * 2 + xo, yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 + yo);
                        stroke(0, 255, 0);
                        fill(0, 255, 0);
                        quad(0.25 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.5 * rw * 2 + xo, -0.5 * rh - (0.5 * levelo) + yo, 0.75 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 - (0.5 * levelo) + yo);
                    break;
                    case "Stump":
                        // GROUND
                        stroke(0, 150, 0);
                        fill(0, 150, 0);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                        // STUMP
                        stroke(200, 100, 0);
                        fill(200, 100, 0);
                        quad(0.375 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 - (0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 + yo, 0.375 * rw * 2 + xo, yo);
                        stroke(225, 125, 0);
                        fill(225, 125, 0);
                        quad(0.5 * rw * 2 + xo, 0.125 * rh * 2 - (0.5 * levelo) + yo, 0.625 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.625 * rw * 2 + xo, yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 + yo);
                        stroke(255, 150, 0);
                        fill(255, 150, 0);
                        quad(0.375 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.5 * rw * 2 + xo, -0.125 * rh * 2 - (0.5 * levelo) + yo, 0.625 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 - (0.5 * levelo) + yo);
                    break;
                    case "Small Rock":
                        // GROUND
                        stroke(150);
                        fill(150);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                        // ROCK
                        stroke(200);
                        fill(200);
                        quad(0.375 * rw * 2 + xo, -(0.25 * levelo) + yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 - (0.25 * levelo) + yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 + yo, 0.375 * rw * 2 + xo, yo);
                        stroke(225);
                        fill(225);
                        quad(0.5 * rw * 2 + xo, 0.125 * rh * 2 - (0.25 * levelo) + yo, 0.625 * rw * 2 + xo, -(0.25 * levelo) + yo, 0.625 * rw * 2 + xo, yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 + yo);
                        stroke(250);
                        fill(250);
                        quad(0.375 * rw * 2 + xo, -(0.25 * levelo) + yo, 0.5 * rw * 2 + xo, -0.125 * rh * 2 - (0.25 * levelo) + yo, 0.625 * rw * 2 + xo, -(0.25 * levelo) + yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 - (0.25 * levelo) + yo);
                    break;
                    case "Large Rock":
                        // GROUND
                        stroke(150);
                        fill(150);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                        // ROCK
                        stroke(200);
                        fill(200);
                        quad(0.25 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 - (0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 + yo, 0.25 * rw * 2 + xo, yo);
                        stroke(225);
                        fill(225);
                        quad(0.5 * rw * 2 + xo, 0.25 * rh * 2 - (0.5 * levelo) + yo, 0.75 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.75 * rw * 2 + xo, yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 + yo);
                        stroke(250);
                        fill(250);
                        quad(0.25 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.5 * rw * 2 + xo, -0.5 * rh - (0.5 * levelo) + yo, 0.75 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 - (0.5 * levelo) + yo);
                    break;
                    case "Road":
                        // GROUND
                        stroke(150);
                        fill(150);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                    break;
                    case "Water":
                        // GROUND
                        stroke(50, 100, 200);
                        fill(50, 100, 200);
                        quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                    break;
                }
            }
        }
        for (var i = 0; i < buildings.length; i++) {
            strokeWeight(1);
            noFill();
            stroke(240);
            if (mouseX >= i * 60 + 20 && mouseY >= 10 && mouseX <= i * 60 + 60 && mouseY <= 50) {
                hoverDuration.categories[i]++;
                if (hoverDuration.categories[i] >= 30) {
                    textSize(12);
                    textAlign(CENTER, CENTER);
                    fill(50);
                    noStroke();
                    rect(i * 60 + 40 - (textWidth(buildings[i].category) + 30) / 2, 58, textWidth(buildings[i].category) + 30, 25, 10);
                    triangle(i * 60 + 30, 58, i * 60 + 50, 58, i * 60 + 40, 53);
                    fill(255);
                    text(buildings[i].category, i * 60 + 40, 71);
                }
                stroke(240);
                fill(250);
                cursor(HAND);
                if (mc) {
                    if (selectedCategory === i) {
                        selectedCategory = -1;
                        selectedBuilding = -1;
                    } else {
                        selectedCategory = i;
                        selectedBuilding = -1;
                    }
                    mc = false;
                }
            } else {
                hoverDuration.categories[i] = 0;
            }
            if (selectedCategory === i) {
                fill(250);
            }
            rect(i * 60 + 20, 10, 40, 40, 5); // TODO: does it look better without these boxes?? i kinda like it...
            var rw = 15;
            var rh = rw * sin(cam.a);
            var xo = i * 60 + 25;
            var yo = 30 + cos(cam.a) * 10;
            var levelo = cos(cam.a) * 20;
            switch(buildings[i].category) {
                case "Zoning":
                    // GROUND
                    stroke(200, 100, 255);
                    fill(200, 100, 255);
                    triangle(xo, yo, rw / 1.5 + xo, -rh / 1.5 + yo, rw / 1.5 + xo, rh / 1.5 + yo);
                    stroke(255, 100, 100);
                    fill(255, 100, 100);
                    triangle(xo + rw * 2, yo, rw * 2 - rw / 1.5 + xo, -rh / 1.5 + yo, rw * 2 - rw / 1.5 + xo, rh / 1.5 + yo);
                    stroke(255, 200, 100);
                    fill(255, 200, 100);
                    beginShape();
                    vertex(rw / 1.5 + xo, -rh / 1.5 + yo);
                    vertex(rw + xo, -rh + yo);
                    vertex(rw * 2 - rw / 1.5 + xo, -rh / 1.5 + yo);
                    vertex(rw * 2 - rw / 1.5 + xo, rh / 1.5 + yo);
                    vertex(rw + xo, rh + yo);
                    vertex(rw / 1.5 + xo, rh / 1.5 + yo);
                    endShape();
                break;
                case "Nature":
                    // GROUND
                    stroke(0, 150, 0);
                    fill(0, 150, 0);
                    quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                    // TRUNK
                    stroke(200, 100, 0);
                    fill(200, 100, 0);
                    quad(0.375 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 - (0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 + yo, 0.375 * rw * 2 + xo, yo);
                    stroke(225, 125, 0);
                    fill(225, 125, 0);
                    quad(0.5 * rw * 2 + xo, 0.125 * rh * 2 - (0.5 * levelo) + yo, 0.625 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.625 * rw * 2 + xo, yo, 0.5 * rw * 2 + xo, 0.125 * rh * 2 + yo);
                    // LEAVES
                    stroke(0, 200, 0);
                    fill(0, 200, 0);
                    quad(0.25 * rw * 2 + xo, -(levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 - (levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 - (0.5 * levelo) + yo, 0.25 * rw * 2 + xo, -(0.5 * levelo) + yo);
                    stroke(0, 225, 0);
                    fill(0, 225, 0);
                    quad(0.5 * rw * 2 + xo, 0.25 * rh * 2 - (levelo) + yo, 0.75 * rw * 2 + xo, -(levelo) + yo, 0.75 * rw * 2 + xo, -(0.5 * levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 - (0.5 * levelo) + yo);
                    stroke(0, 255, 0);
                    fill(0, 255, 0);
                    quad(0.25 * rw * 2 + xo, -(levelo) + yo, 0.5 * rw * 2 + xo, -0.5 * rh - (levelo) + yo, 0.75 * rw * 2 + xo, -(levelo) + yo, 0.5 * rw * 2 + xo, 0.25 * rh * 2 - (levelo) + yo);
                break;
                case "Transport":
                    // GROUND
                    stroke(150);
                    fill(150);
                    quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                break;
                case "Water":
                    // GROUND
                    stroke(50, 100, 200);
                    fill(50, 100, 200);
                    quad(xo, yo, rw + xo, -rh + yo, 2 * rw + xo, yo, rw + xo, rh + yo);
                break;
            }
        }
    }
};

var total = 0;
var frames = 0;

function draw() {
    angleMode(DEGREES);
    cursor();
    background(75, 225, 255);
    drawGrid();
    drawToolbar();
    stroke(200, 200, 200);
    strokeWeight(1);
    noFill();
    ellipse(width / 2, height / 2, 5, 5);
    if (mouseIsPressed) {
        switch(options[selectedOption]) {
            case "Move":
                cam.x += (pmouseX - mouseX) / (tileSize * 2 * sqrt2 * cam.zoom) - (pmouseY - mouseY) / (tileSize * 2 * sqrt2 * sin(cam.a) * cam.zoom);
                cam.z += (pmouseX - mouseX) / (tileSize * 2 * sqrt2 * cam.zoom) + (pmouseY - mouseY) / (tileSize * 2 * sqrt2 * sin(cam.a) * cam.zoom);
                cam.x = Math.max(Math.min(cam.x, grid.length - 1), 0);
                cam.z = Math.max(Math.min(cam.z, grid[0].length - 1), 0);
            break;
            case "Rotate":
                cam.a -= (pmouseY - mouseY);
                cam.a = Math.max(Math.min(cam.a, 90), 0);
            break;
            case "Zoom":
                cam.zoom *= Math.pow(1.01, (pmouseY - mouseY));
                cam.zoom = Math.max(Math.min(cam.zoom, 5), 1);
            break;
            case "Build":
                if (selectedBuilding !== -1) {
                    var rw = tileSize * cam.zoom * sqrt2;
                    var rh = rw * Math.sin(cam.a * Math.PI / 180);
                    var xo = width / 2 - (cam.x + cam.z) * rw - rw;
                    var yo = height / 2 + cam.x * rh - cam.z * rh;
                    var tileX = Math.floor((mouseX / rw - mouseY / rh - xo / rw + yo / rh) / 2);
                    var tileZ = Math.floor((mouseX / rw + mouseY / rh - xo / rw - yo / rh) / 2);
                    if (buildings[selectedCategory].contents[selectedBuilding].multi) {
                        // TODO: build multiple things at once
                        if (selected.start.x === -1 && tileX >= 0 && tileX < grid.length && tileZ >= 0 && tileZ < grid[0].length) {
                            selected.start = {
                                x: tileX,
                                z: tileZ
                            };
                        }
                        if (buildings[selectedCategory].contents[selectedBuilding].multi === 1) {
                            var xl = Math.abs(Math.max(Math.min(tileX, grid.length - 1), 0) - selected.start.x);
                            var zl = Math.abs(Math.max(Math.min(tileZ, grid[0].length - 1), 0) - selected.start.z);
                            selected.stop = {
                                x: xl >= zl ? Math.max(Math.min(tileX, grid.length - 1), 0) : selected.start.x,
                                z: zl > xl ? Math.max(Math.min(tileZ, grid[0].length - 1), 0) : selected.start.z
                            };
                        } else {
                            selected.stop = {
                                x: Math.max(Math.min(tileX, grid.length - 1), 0),
                                z: Math.max(Math.min(tileZ, grid[0].length - 1), 0)
                            };
                        }
                        // Move when on edge
                        if (mouseX >= width - 50) {
                            cam.x += (10 - (width - mouseX) / 5) / (tileSize * 2 * sqrt2 * cam.zoom);
                            cam.z += (10 - (width - mouseX) / 5) / (tileSize * 2 * sqrt2 * cam.zoom);
                        }
                        if (mouseX <= 50) {
                            cam.x -= (10 - mouseX / 5) / (tileSize * 2 * sqrt2 * cam.zoom);
                            cam.z -= (10 - mouseX / 5) / (tileSize * 2 * sqrt2 * cam.zoom);
                        }
                        if (mouseY >= height - 50) {
                            cam.x += -(10 - (height - mouseY) / 5) / (tileSize * 2 * sqrt2 * Math.sin(cam.a * Math.PI / 180) * cam.zoom);
                            cam.z += (10 - (height - mouseY) / 5) / (tileSize * 2 * sqrt2 * Math.sin(cam.a * Math.PI / 180) * cam.zoom);
                        }
                        if (mouseY <= 50) {
                            cam.x -= -(10 - mouseY / 5) / (tileSize * 2 * sqrt2 * Math.sin(cam.a * Math.PI / 180) * cam.zoom);
                            cam.z -= (10 - mouseY / 5) / (tileSize * 2 * sqrt2 * Math.sin(cam.a * Math.PI / 180) * cam.zoom);
                        }
                        cam.x = Math.max(Math.min(cam.x, grid.length - 1), 0);
                        cam.z = Math.max(Math.min(cam.z, grid[0].length - 1), 0);
                    } else if (mc && grid[tileX] && grid[tileX][tileZ] && grid[tileX][tileZ][0].type === "empty") {
                        grid[tileX][tileZ][0].type = buildings[selectedCategory].contents[selectedBuilding].type.toLowerCase().split(" ").join("-");
                        // TODO: allow for changing the level that you are building on; with a slider on the side?? moves empty tiles all up one Y value if the thing can be built on
                        mc = false;
                    }
                }
            break;
            case "Demolish":
                var rw = tileSize * cam.zoom * sqrt2;
                var rh = rw * Math.sin(cam.a * Math.PI / 180);
                var xo = width / 2 - (cam.x + cam.z) * rw - rw;
                var yo = height / 2 + cam.x * rh - cam.z * rh;
                var tileX = Math.floor((mouseX / rw - mouseY / rh - xo / rw + yo / rh) / 2);
                var tileZ = Math.floor((mouseX / rw + mouseY / rh - xo / rw - yo / rh) / 2);
                if (selected.start.x === -1 && tileX >= 0 && tileX < grid.length && tileZ >= 0 && tileZ < grid[0].length) {
                    selected.start = {
                        x: tileX,
                        z: tileZ
                    };
                }
                selected.stop = {
                    x: Math.max(Math.min(tileX, grid.length - 1), 0),
                    z: Math.max(Math.min(tileZ, grid[0].length - 1), 0)
                };
                // Move when on edge
                if (mouseX >= width - 50) {
                    cam.x += (10 - (width - mouseX) / 5) / (tileSize * 2 * sqrt2 * cam.zoom);
                    cam.z += (10 - (width - mouseX) / 5) / (tileSize * 2 * sqrt2 * cam.zoom);
                }
                if (mouseX <= 50) {
                    cam.x -= (10 - mouseX / 5) / (tileSize * 2 * sqrt2 * cam.zoom);
                    cam.z -= (10 - mouseX / 5) / (tileSize * 2 * sqrt2 * cam.zoom);
                }
                if (mouseY >= height - 50) {
                    cam.x += -(10 - (height - mouseY) / 5) / (tileSize * 2 * sqrt2 * Math.sin(cam.a * Math.PI / 180) * cam.zoom);
                    cam.z += (10 - (height - mouseY) / 5) / (tileSize * 2 * sqrt2 * Math.sin(cam.a * Math.PI / 180) * cam.zoom);
                }
                if (mouseY <= 50) {
                    cam.x -= -(10 - mouseY / 5) / (tileSize * 2 * sqrt2 * Math.sin(cam.a * Math.PI / 180) * cam.zoom);
                    cam.z -= (10 - mouseY / 5) / (tileSize * 2 * sqrt2 * Math.sin(cam.a * Math.PI / 180) * cam.zoom);
                }
                cam.x = Math.max(Math.min(cam.x, grid.length - 1), 0);
                cam.z = Math.max(Math.min(cam.z, grid[0].length - 1), 0);
            break;
            case "Merge":
                var rw = tileSize * cam.zoom * sqrt2;
                var rh = rw * Math.sin(cam.a * Math.PI / 180);
                var xo = width / 2 - (cam.x + cam.z) * rw - rw;
                var yo = height / 2 + cam.x * rh - cam.z * rh;
                var tileX = Math.floor((mouseX / rw - mouseY / rh - xo / rw + yo / rh) / 2);
                var tileZ = Math.floor((mouseX / rw + mouseY / rh - xo / rw - yo / rh) / 2);
                if (tileX >= 0 && tileX < grid.length && tileZ >= 0 && tileZ < grid[0].length) {
                    // Remove last selection from the group:
                    if (selected.group.length > 1 && selected.group.lastIndexOf(tileX + "," + tileZ) === selected.group.length - 2) {
                        selected.group.pop();
                    }
                    // Add a new selection to the group:
                    if ((selected.group.lastIndexOf(tileX + "," + tileZ) === 0 || selected.group.indexOf(tileX + "," + tileZ) === -1) && (selected.group.length === 0 || abs(tileX - selected.group[selected.group.length - 1].split(",")[0]) === 1 && abs(tileZ - selected.group[selected.group.length - 1].split(",")[1]) === 0 || abs(tileX - selected.group[selected.group.length - 1].split(",")[0]) === 0 && abs(tileZ - selected.group[selected.group.length - 1].split(",")[1]) === 1)) {
                        selected.group.push(tileX + "," + tileZ);
                    }
                }
                // Move when on edge
                if (mouseX >= width - 50) {
                    cam.x += (10 - (width - mouseX) / 5) / (tileSize * 2 * sqrt2 * cam.zoom);
                    cam.z += (10 - (width - mouseX) / 5) / (tileSize * 2 * sqrt2 * cam.zoom);
                }
                if (mouseX <= 50) {
                    cam.x -= (10 - mouseX / 5) / (tileSize * 2 * sqrt2 * cam.zoom);
                    cam.z -= (10 - mouseX / 5) / (tileSize * 2 * sqrt2 * cam.zoom);
                }
                if (mouseY >= height - 50) {
                    cam.x += -(10 - (height - mouseY) / 5) / (tileSize * 2 * sqrt2 * Math.sin(cam.a * Math.PI / 180) * cam.zoom);
                    cam.z += (10 - (height - mouseY) / 5) / (tileSize * 2 * sqrt2 * Math.sin(cam.a * Math.PI / 180) * cam.zoom);
                }
                if (mouseY <= 50) {
                    cam.x -= -(10 - mouseY / 5) / (tileSize * 2 * sqrt2 * Math.sin(cam.a * Math.PI / 180) * cam.zoom);
                    cam.z -= (10 - mouseY / 5) / (tileSize * 2 * sqrt2 * Math.sin(cam.a * Math.PI / 180) * cam.zoom);
                }
                cam.x = Math.max(Math.min(cam.x, grid.length - 1), 0);
                cam.z = Math.max(Math.min(cam.z, grid[0].length - 1), 0);
            break;
        }
    } else {
        if (selected.start.x !== -1) {
            switch(options[selectedOption]) {
                case "Build":
                    for (var x = Math.min(selected.start.x, selected.stop.x); x <= Math.max(selected.start.x, selected.stop.x); x++) {
                        for (var z = Math.min(selected.start.z, selected.stop.z); z <= Math.max(selected.start.z, selected.stop.z); z++) {
                            if (grid[x][z][0].type === "empty") {
                                switch(buildings[selectedCategory].contents[selectedBuilding].type) {
                                    case "LD Residential":
                                    case "MD Residential":
                                    case "HD Residential":
                                    case "LD Commercial":
                                    case "MD Commercial":
                                    case "HD Commercial":
                                    case "LD Industrial":
                                    case "MD Industrial":
                                    case "HD Industrial":
                                        grid[x][z] = [{
                                            type: buildings[selectedCategory].contents[selectedBuilding].type.toLowerCase().split(" ").join("-"),
                                            ran: 0, // TODO: more house types
                                            rot: 0,
                                            built: 0,
                                            merged: []
                                        }];
                                    break;
                                    default:
                                        grid[x][z] = [{
                                            type: buildings[selectedCategory].contents[selectedBuilding].type.toLowerCase().split(" ").join("-"),
                                            ran: 0,
                                            rot: 0,
                                            built: 0,
                                            merged: []
                                        }];
                                    break;
                                }
                            }
                        }
                    }
                break;
                case "Demolish":
                    for (var x = Math.min(selected.start.x, selected.stop.x); x <= Math.max(selected.start.x, selected.stop.x); x++) {
                        for (var z = Math.min(selected.start.z, selected.stop.z); z <= Math.max(selected.start.z, selected.stop.z); z++) {
                            grid[x][z] = [{
                                type: "empty",
                                ran: 0,
                                rot: 0,
                                built: 0,
                                merged: []
                            }];
                        }
                    }
                break;
            }
            // Reset the selection:
            selected = {
                start: {
                    x: -1,
                    z: -1
                },
                stop: {
                    x: -1,
                    z: -1
                },
                group: []
            };
        }
        if (selected.group.length > 1) {
            // Check for eligibility:
            for (var i = 0; i < selected.group.length; i++) {
                var tileX = selected.group[i].split(",")[0];
                var tileZ = selected.group[i].split(",")[1];
                // IF not mergeable OR not built OR not same type as first block = NOT ELIGIBLE
                if (mergeable.indexOf(grid[tileX][tileZ][0].type) === -1 || grid[tileX][tileZ][0].built < 4 || grid[tileX][tileZ][0].type !== grid[selected.group[0].split(",")[0]][selected.group[0].split(",")[1]][0].type) {
                    selected.group = [];
                }
            }
            // Merge:
            for (var i = 0; i < selected.group.length - 1; i++) {
                var tileX = selected.group[i].split(",")[0];
                var tileZ = selected.group[i].split(",")[1];
                var tileXNext = selected.group[i + 1].split(",")[0];
                var tileZNext = selected.group[i + 1].split(",")[1];
                // TODO: y layer merging
                grid[tileX][tileZ][0].merged.push((tileXNext - tileX) + "," + (tileZNext - tileZ));
                grid[tileXNext][tileZNext][0].merged.push((tileX - tileXNext) + "," + (tileZ - tileZNext));
            }
        }
        selected.group = [];
    }
    mc = false;
    total += frameRate();
    frames++;
    fill(255);
    textSize(12);
    text(Math.round(total / frames * 100) / 100, width - 30, 20);
}
