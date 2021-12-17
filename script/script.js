var canvas = document.getElementById("game");
canvas.style.height = canvas.clientWidth / 2;
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientWidth / 2;
var factor = canvas.clientWidth / 800;

function topWall(obj) {
  return obj.y;
}
function bottomWall(obj) {
  return obj.y + obj.height;
}
function leftWall(obj) {
  return obj.x;
}
function rightWall(obj) {
  return obj.x + obj.width;
}

let variation = 0;
// DINOSAUR
function Dinosaur(x, dividerY) {
  this.width = 120 * factor;
  this.height = 71 * factor;
  this.x = x;
  this.y = dividerY - this.height;
  this.vy = 0;
  this.jumpVelocity = -20 * factor;
}
Dinosaur.prototype.draw = function (context, paused) {
  variation++;
  if (variation > 15 || paused) {
    if (variation > 30) {
      variation = 0;
    }
    var santa = new Image(); // Create new img element
    santa.src = "assets/1.svg"; // Set source path
  } else if (!paused) {
    var santa = new Image(); // Create new img element
    santa.src = "assets/3.svg"; // Set source path
  }
  var oldFill = context.fillStyle;
  context.clearRect(this.x, this.y, this.width, this.height);

  let pattern = context.createPattern(santa, "no-repeat");
  context.fillStyle = pattern;
  context.drawImage(santa, this.x, this.y, this.width, this.height);
  context.fillStyle = oldFill;
};
Dinosaur.prototype.jump = function () {
  this.vy = this.jumpVelocity;
};
Dinosaur.prototype.update = function (divider, gravity) {
  this.y += this.vy;
  this.vy += gravity;
  if (bottomWall(this) > topWall(divider) && this.vy > 0) {
    this.y = topWall(divider) - this.height;
    this.vy = 0;
    return;
  }
};
// ----------
// DIVIDER
function Divider(gameWidth, gameHeight) {
  this.width = gameWidth;
  this.height = 4 * factor;
  this.x = 0;
  this.y = gameHeight - this.height - Math.floor(0.2 * gameHeight);
}
Divider.prototype.draw = function (context) {
  context.fillRect(this.x, this.y, this.width, this.height);
};
// ----------

// ----------
// CACTUS
function Cactus(gameWidth, groundY) {
  this.width = 30 * factor;
  this.height = 50 * factor;
  this.x = gameWidth;

  this.x = gameWidth; // spawn cactus at screen end
  this.y = groundY - this.height;
}

Cactus.prototype.draw = function (context) {
  var oldFill = context.fillStyle;

  context.clearRect(this.x, this.y, this.width, this.height);

  var tree = new Image(); // Create new img element
  tree.src = "assets/tree.png"; // Set source path
  let pattern = context.createPattern(tree, "no-repeat");
  context.fillStyle = pattern;
  context.drawImage(tree, this.x, this.y, this.width, this.height);
  context.fillStyle = oldFill;
};

// ----------
// GAME
function Game() {
  var canvas = document.getElementById("game");
  this.width = canvas.width;
  this.height = canvas.height;
  this.context = canvas.getContext("2d");
  this.context.fillStyle = "brown";
  document.spacePressed = false;
  document.addEventListener("touchstart", function (e) {
    this.spacePressed = true;
  });
  document.addEventListener("touchend", function (e) {
    this.spacePressed = false;
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === " ") this.spacePressed = true;
  });
  document.addEventListener("keyup", function (e) {
    if (e.key === " ") this.spacePressed = false;
  });
  this.gravity = 1.5 * factor;
  this.divider = new Divider(this.width, this.height);
  this.dino = new Dinosaur(Math.floor(0.1 * this.width), this.divider.y);
  this.cacti = [];

  this.runSpeed = -10 * factor;
  this.paused = true;
  this.noOfFrames = 0;
  this.score = 0;
  this.high = 0;
  this.firstTime = true;

  canvas.addEventListener("click", function (event) {
    if (game.paused) {
      game.paused = false;
      game.cacti = [];
      game.noOfFrames = 0;
      game.firstTime = false;
    }
  });
}

Game.prototype.spawnCactus = function (
  probability //Spawns a new cactus depending upon the probability
) {
  if (Math.random() <= probability) {
    this.cacti.push(new Cactus(this.width, this.divider.y));
  }
};

Game.prototype.update = function () {
  // Dinosaur jump start

  if (this.paused) {
    return;
  }
  if (
    document.spacePressed == true &&
    bottomWall(this.dino) >= topWall(this.divider)
  ) {
    this.dino.jump();
  }
  this.dino.update(this.divider, this.gravity);

  // Removing old cacti that cross the eft border of the screen
  if (this.cacti.length > 0 && rightWall(this.cacti[0]) < 0) {
    this.cacti.shift();
  }

  // Spawning new cacti
  //Case 1: There are no cacti on the screen
  if (this.cacti.length == 0) {
    //Spawn a cactus with high probability
    this.spawnCactus(0.5);
  }
  //Case 2: There is atleast one cactus
  else if (
    this.cacti.length > 0 &&
    this.width - leftWall(this.cacti[this.cacti.length - 1]) >
      this.jumpDistance + 150 * factor
  ) {
    this.spawnCactus(0.05);
  }

  // Moving the cacti
  for (i = 0; i < this.cacti.length; i++) {
    this.cacti[i].x += this.runSpeed;
  }

  //Collision Detection

  for (i = 0; i < this.cacti.length; i++) {
    if (
      rightWall(this.dino) - 2 >= leftWall(this.cacti[i]) &&
      leftWall(this.dino) + 2 <= rightWall(this.cacti[i]) &&
      bottomWall(this.dino) - 2 >= topWall(this.cacti[i])
    ) {
      // COLLISION OCCURED
      this.paused = true;
    }
    this.noOfFrames++;
    this.score = Math.floor(this.noOfFrames / 10);
    if (this.score > this.high) this.high = this.score;
  }

  //Jump Distance of the Dinosaur
  // This is a CONSTANT in this game because run speed is constant
  //Equations: time = t * 2 * v / g where v is the jump velocity
  // Horizontal ditance s = vx * t where vx is the run speed
  this.jumpDistance = Math.floor(
    (this.runSpeed * (2 * this.dino.jumpVelocity)) / this.gravity
  );
  // Math.floor() because we only use integer value.
};
Game.prototype.draw = function () {
  // clear rectangle of game
  this.context.clearRect(0, 0, this.width, this.height);
  // draw divider line
  //this.divider.draw(this.context);
  // draw the dinosaur
  this.dino.draw(this.context, this.paused);
  //drawing the cactii
  for (i = 0; i < this.cacti.length; i++) {
    this.cacti[i].draw(this.context);
  }

  var oldFill = this.context.fillStyle;
  this.context.fillStyle = "#FCF7F8";
  this.context.font = "20px sans-serif";
  this.context
    .fillText("score: " + this.score, this.width - 120, 30 * factor);
	this.context
	  .fillText("high: " + this.high, this.width - 110, 60 * factor);

  if (this.paused) {
    if (game.firstTime) {
      var start = new Image(); // Create new img element
      start.src = "assets/start.png"; // Set source path
      let pattern = this.context.createPattern(start, "no-repeat");
      this.context.fillStyle = pattern;
      this.context.drawImage(start, 330 * factor, 75 * factor);
    } else {
      var restart = new Image(); // Create new img element
      restart.src = "assets/restart.png"; // Set source path
      let pattern = this.context.createPattern(restart, "no-repeat");
      this.context.fillStyle = pattern;
      this.context.drawImage(restart, 330 * factor, 75 * factor);
    }
  }
  this.context.fillStyle = oldFill;
};

var game = new Game();
function main(timeStamp) {
  game.update();
  game.draw();
  window.requestAnimationFrame(main);
}
var startGame = window.requestAnimationFrame(main);
