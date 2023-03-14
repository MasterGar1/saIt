const cvs = document.getElementById("canvas");
const ctx = cvs.getContext("2d");
const spawnBtn = document.getElementById("spawn");
const resetBtn = document.getElementById("reset");
const powerBtn = document.getElementById("power");
const playBtn = document.getElementById("play");
const textBox = [document.getElementById("line1"), document.getElementById("line2"), document.getElementById("line3"), document.getElementById("line4"), document.getElementById("line5"), document.getElementById("line6"), document.getElementById("line7")];

const tilesX = 22;
const tilesY = 16;
const tileSize = 32;
cvs.width = tilesX * tileSize;
cvs.height = tilesY * tileSize;
let clientX = 0;
let clientY = 0;
let enemyNum = 1;
let difficulty = 1;
let enemiesKilled = 0;
let spawnRate = 10;
let playing = false;

let heroImages = [];
let enemyImages = [];
let powerupImages = [];

loadImages();

class Hero {
	constructor(x, y, speed) {
		this.x = x;
		this.y = y;
		this.size = tileSize;
		this.speed = speed;
		this.img = new Image();
		this.img.src = "hero/00.png";

		this.up = false;
		this.down = false;
		this.left = false;
		this.right = false;
		this.direction = "down";
		this.spriteCounter = 0;
		this.sprite = 0;

		this.setupStats();
		this.mousePressed = false;
		this.attackToggle = false;
	}
	// залагаме началните статистики на героя
	setupStats() {
		this.health = 50;
		this.damage = 5;
		this.attackLength = 64;
		this.attackWidth = 32;
		this.attackCharge = 0;
		this.attackSpeed = 1.5;
	}
	// обновяване на всички събития, случили се на героя при всяко завъртане на играта
	update() {
		this.animate();
		this.move();
		if (this.mousePressed || this.attackToggle) {
			this.hit();
		}
	}
	// рисуваме героя и неговото поле за атака
	draw() {
		let attackPolygon = hero.attackRange();

		ctx.fillStyle = "red";
		ctx.beginPath();
		ctx.moveTo(attackPolygon[0][0], attackPolygon[0][1]);
		ctx.lineTo(attackPolygon[1][0], attackPolygon[1][1]);
		ctx.lineTo(attackPolygon[4][0], attackPolygon[4][1]);
		ctx.lineTo(attackPolygon[5][0], attackPolygon[5][1]);
		ctx.closePath();
		ctx.fill();

		ctx.beginPath();
		ctx.moveTo(attackPolygon[0][0], attackPolygon[0][1]);
		ctx.lineTo(attackPolygon[1][0], attackPolygon[1][1]);
		ctx.lineTo(attackPolygon[2][0], attackPolygon[2][1]);
		ctx.lineTo(attackPolygon[3][0], attackPolygon[3][1]);
		ctx.closePath();
		ctx.stroke();

		ctx.drawImage(this.img, this.x, this.y, tileSize, tileSize);
	}
	// движение според ъгъла, подаден чрез комбинация от клавиши
	move() {
		// според кои бутони са натиснати, намираме ъгъл, по който героят ще ходи
		// градусните мерки на ъглите са на обратно защото ординатната и абцисната ос на канваса са обърнати !!!
		let angle = 0;
		let keysPressed = 0;
		if (this.right) {
			angle += 0; // 0
			keysPressed++;
		}

		if (this.down) {
			angle += Math.PI / 2; // π/2
			keysPressed++;
		}

		if (this.left) {
			angle += Math.PI; // π
			keysPressed++;
		}

		if (this.up) {
			if (this.right) {
				angle += Math.PI / -2; // -π/2
			}
			else {
				angle += 3 * Math.PI / 2; // 3π/2
			}
			keysPressed++;
		}

		angle /= keysPressed;
		// като използваме дефиницията за тригономентичните функции, разбираме, че крайната точка в която ще е героя е с координати D(cos(angle);sin(angle))
		let dx = Math.cos(angle) * this.speed;
		let dy = Math.sin(angle) * this.speed;
		// проверка за краищата на картата
		if (this.x < -dx) {
			dx = 0;
		}

		if (this.x > cvs.width - tileSize - dx) {
			dx = 0;
		}

		if (this.y < -dy) {
			dy = 0;
		}

		if (this.y > cvs.height - tileSize - dy) {
			dy = 0;
		}
		// забрана за използване на противоположни посоки
		if ((this.up && this.down) || (this.right && this.left)) {
			dx = 0;
			dy = 0;
		}
		// добавяне на дистанцията
		if (this.left || this.right || this.up || this.down) {
			this.x += dx;
			this.y += dy;
		}
	}
	// сменяне на картинката на героя, в зависимост от какво действие прави
	animate() {
		if (this.left || this.right || this.up || this.down) {
			this.spriteCounter++;
			if (this.spriteCounter > 10) {
				if (this.sprite == 1 || this.sprite == 0) {
					this.sprite = 2;
				} else if (this.sprite == 2 || this.sprite == 0) {
					this.sprite = 1;
				}
				this.spriteCounter = 0;
			}
		} else {
			this.sprite = 0;
			this.spriteCounter = 0;
		}

		let t1 = 0;
		switch (this.direction) {
			case "down":
				t1 = 0;
				break;
			case "up":
				t1 = 1;
				break;
			case "left":
				t1 = 2;
				break;
			case "right":
				t1 = 3;
				break;
		}

		this.img = heroImages[t1][this.sprite];
	}
	// смятаме точките на полето за атака
	attackRange() {
		let hx = this.x + this.size / 2;
		let hy = this.y + this.size / 2;
		let dx = hx - clientX;
		let dy = hy - clientY;
		let distance = Math.sqrt(dx ** 2 + dy ** 2);
		let sin = dy / distance;
		let cos = dx / distance;

		let ax = hx + sin * this.attackWidth / 2;
		let ay = hy - cos * this.attackWidth / 2;
		let bx = 2 * hx - ax;
		let by = 2 * hy - ay;

		let cx = ax - this.attackLength * cos;
		let cy = ay - this.attackLength * sin;
		let fx = bx - this.attackLength * cos;
		let fy = by - this.attackLength * sin;

		let px = ax - this.attackLength * cos * (this.attackCharge / 100);
		let py = ay - this.attackLength * sin * (this.attackCharge / 100);
		let qx = bx - this.attackLength * cos * (this.attackCharge / 100);
		let qy = by - this.attackLength * sin * (this.attackCharge / 100);

		let polygon = [[ax, ay], [bx, by], [fx, fy], [cx, cy], [qx, qy], [px, py]];
		return polygon;
	}
	// проверява дали има противник в обхвата
	hit() {
		this.attackCharge += this.attackSpeed;
		if (this.attackCharge >= 100) {
			for (let enemy of enemies) {
				let hits = enemy.checkIntersection();
				if (hits) {
					enemy.health -= this.damage;
					if (enemy.health <= 0) {
						enemies.splice(enemies.indexOf(enemy), 1);
						enemiesKilled++;
						powerBtn.onclick();
					}
				}
			}
			this.attackCharge = 0;
		}
	}
	// взема предмета
	pickup(powerup) {
		let type = powerup.type;

		switch (type) {
			case 0:
				this.attackSpeed += ASincrease;
				break;
			case 1:
				this.damage += AtKincrease;
				break;
			case 2:
				this.health += HPincrease;
				break;
			case 3:
				this.attackLength += ALincrease;
				break;
			case 4:
				this.attackWidth += AWincrease;
				break;
		}

		powerups.splice(powerups.indexOf(powerup), 1);
	}
}

class Enemy {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.speed = 2;
		this.img = new Image();
		this.img.src = "enemy/00.png";
		this.generateStats(enemyNum);
		this.direction = "down";
		this.spriteCounter = 0;
		this.sprite = 0;
		this.size = tileSize;
		this.currentCooldown = 0;
		this.attackCooldown = 180;
	}
	// генерира статистики
	generateStats(enemyNum) {
		this.maxHealth = Math.floor(enemyNum * Math.random() * 1.5 + 20);
		this.health = this.maxHealth;
		this.damage = Math.floor(enemyNum * Math.random() + 2);
		this.speed += Math.floor(Math.random() * this.speed);
	}
	// обновяване на всички събития, случили се на противника при всяко завъртане на играта
	update() {
		this.animate();
		this.follow();
		if (this.currentCooldown == 0) {
			this.hit();
		} else {
			this.currentCooldown--;
		}
	}
	// рисуваме противника
	draw() {
		ctx.drawImage(this.img, this.x, this.y, tileSize, tileSize);

		let percent = this.health / this.maxHealth;
		ctx.fillStyle = "red";
		ctx.fillRect(this.x, this.y - 5, this.size * percent, 5);
		ctx.strokeRect(this.x, this.y - 5, this.size, 5);
	}
	// преследва героя
	follow() {
		let dx = hero.x - this.x;
		let dy = hero.y - this.y;
		let distance = Math.sqrt(dx ** 2 + dy ** 2);
		let x = this.speed * (dx / distance);
		let y = this.speed * (dy / distance);

		if (Math.abs(dx) > Math.abs(dy)) {
			if (dx > 0) {
				this.direction = "right";
			} else {
				this.direction = "left";
			}
		} else {
			if (dy > 0) {
				this.direction = "down";
			} else {
				this.direction = "up";
			}
		}

		this.x += x;
		this.y += y;
	}
	// сменяне на картинката на противника, в зависимост от какво действие прави
	animate() {
		this.spriteCounter++;
		if (this.spriteCounter > 10) {
			if (this.sprite == 1 || this.sprite == 0) {
				this.sprite = 2;
			} else if (this.sprite == 2 || this.sprite == 0) {
				this.sprite = 1;
			}
			this.spriteCounter = 0;
		}

		let t1 = 0;
		switch (this.direction) {
			case "down":
				t1 = 0;
				break;
			case "up":
				t1 = 1;
				break;
			case "left":
				t1 = 2;
				break;
			case "right":
				t1 = 3;
				break;
		}

		this.img = enemyImages[t1][this.sprite];
	}
	// проверява дали противника е върху героя
	hit() {
		if (intersectionRect([this.x, this.y, this.size], [hero.x, hero.y, hero.size])) {
			hero.health -= this.damage;
			this.currentCooldown += this.attackCooldown;
			if (hero.health <= 0) {
				resetGame();
			}
		}
	}
	// проверява дали противника е в обхвата на героя
	checkIntersection() {
		let a = [this.x, this.y];
		let b = [this.x + this.size, this.y];
		let c = [this.x, this.y + this.size];
		let d = [this.x + this.size, this.y + this.size];
		let range = hero.attackRange();
		let intersects = false;

		if (PointInPoly(a, range) || PointInPoly(b, range) || PointInPoly(c, range) || PointInPoly(d, range)) {
			intersects = !intersects;
		}

		return intersects;
	}
}

class PowerUp {
	constructor(x, y) {
		this.type = Math.floor(Math.random() * 5);
		this.x = x;
		this.y = y;
		this.size = tileSize;
		this.image = powerupImages[this.type];
	}
	// обновяване на всички събития, случили се на предмета при всяко завъртане на играта
	update() {
		if (intersectionRect([this.x * this.size, this.y * this.size, this.size], [hero.x, hero.y, hero.size])) {
			hero.pickup(this);
		}
	}
	// рисуваме предмета
	draw() {
		ctx.drawImage(this.image, this.x * this.size, this.y * this.size);
	}
}

let hero = new Hero(10, 10, 5);

let enemies = [];

let powerups = [];

window.requestAnimationFrame(gameLoop);

let secondsPassed;
let oldTimeStamp;
let fps;
let totalSeconds = 0;
let seconds = 0;
// върти играта (game loop)
function gameLoop(timeStamp) {
	// сметки за fps
	totalSeconds++;
	secondsPassed = (timeStamp - oldTimeStamp) / 1000;
	oldTimeStamp = timeStamp;
	fps = Math.round(1 / secondsPassed);

	if (playing) {
		seconds = totalSeconds / 60;
		if (seconds % 10 == 0) {
			let spawNum = Math.floor(Math.random() * 3 + 1) * difficulty;
			for(let i = 0; i < spawNum; i++){
				spawnBtn.onclick();
			}
		}
	}

	hero.update();

	for (let enemy of enemies) {
		enemy.update();
	}

	for (let power of powerups) {
		power.update();
	}

	setText();

	draw();
	window.requestAnimationFrame(gameLoop);
}
// рисуване
function draw() {
	ctx.strokeStyle = "black";
	// изтриване на полето
	ctx.clearRect(0, 0, cvs.width, cvs.height);

	// карта
	ctx.strokeRect(0, 0, cvs.width, cvs.height);

	// powers
	for (let power of powerups) {
		power.draw();
	}

	// противници
	for (let enemy of enemies) {
		enemy.draw();
	}

	// герой
	hero.draw();
}
// команди от клавиши
document.onkeydown = function (e) {
	let key = e.key.toLowerCase();

	switch (key) {
		case 'w':
			hero.up = true;
			hero.direction = "up";
			break;
		case 's':
			hero.down = true;
			hero.direction = "down";
			break;
		case 'a':
			hero.left = true;
			hero.direction = "left";
			break;
		case 'd':
			hero.right = true;
			hero.direction = "right";
			break;
		case 'r':
			hero.attackToggle = !hero.attackToggle;
			break;
	}
}
// спиране на движение
document.onkeyup = function (e) {
	let key = e.key.toLowerCase();

	switch (key) {
		case 'a':
			hero.left = false;
			break;
		case 'd':
			hero.right = false;
			break;
		case 'w':
			hero.up = false;
			break;
		case 's':
			hero.down = false;
			break;
	}
}
// проверява натискане на мишката
cvs.onmousedown = function (e) {
	hero.mousePressed = true;
}
// проверява отпускане на мишката
cvs.onmouseup = function (e) {
	hero.mousePressed = false;
	hero.attackCharge = 0;
}
// засича къде се намира мишката
document.onmousemove = function (e) {
	clientX = e.clientX;
	clientY = e.clientY - 70;
}
// проверява дали два правоъгълника се пресичат
function intersectionRect(a, b) {
	if (b[0] > a[0] + a[2] || a[0] > b[0] + b[2]) {
		return false;
	}
	if (b[1] > a[1] + a[2] || a[1] > b[1] + b[2]) {
		return false;
	}

	return true;
}
// проверява дали дадена точка е в многоъгълник
function PointInPoly(point, poly) {
	let x = point[0];
	let y = point[1];
	poly.pop();
	poly.pop();

	let isInside = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		let xi = poly[i][0];
		let yi = poly[i][1];
		let xj = poly[j][0];
		let yj = poly[j][1];

		if (((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
			isInside = !isInside;
			break;
		}
	}

	return isInside;
}
// призовава противник
spawnBtn.onclick = function () {
	let x = Math.floor(Math.random() * tilesX) * tileSize;
	let y = Math.floor(Math.random() * tilesY) * tileSize;
	let noSpawn = tileSize * 3;

	while ((x > hero.x - noSpawn && x < hero.x + noSpawn) && (y > hero.y - noSpawn && y < hero.y + noSpawn)) {
		x = Math.floor(Math.random() * tilesX) * tileSize;
		y = Math.floor(Math.random() * tilesY) * tileSize;
	}

	enemies.push(new Enemy(x, y));
	enemyNum++;
}
// поставя powerup на картата
powerBtn.onclick = function () {
	let x = Math.floor(Math.random() * tilesX);
	let y = Math.floor(Math.random() * tilesY);

	for (let power of powerups) {
		if (power.x == x && power.y == y) {
			x = Math.floor(Math.random() * tilesX);
			y = Math.floor(Math.random() * tilesY);
			continue;
		}
	}

	powerups.push(new PowerUp(x, y));
}
// премахва вдички обекти от картата
resetBtn.onclick = function () {
	resetGame();
}
// стартира или спира играта
playBtn.onclick = function () {
	if (playing) {
		playBtn.textContent = "Start";
	} else {
		playBtn.textContent = "Stop";
	}

	playing = !playing;
	totalSeconds = 0;
}
// повишава трудноста
function updateDifficulty() {
	if (enemyNum >= difficulty * 10) {
		difficulty += 1;
		spawnRate = 10 - (difficulty < 10 ? difficulty - 1 : 9);
	}
}
// рестартира играта
function resetGame(){
	hero = new Hero(10, 10, 5);
	enemies = [];
	powerups = [];
	difficulty = 1;
	enemyNum = 0;
}
// поставя статистиките на героя
function setText() {
	textBox[0].textContent = "Health: " + hero.health;
	textBox[1].textContent = "Attack: " + hero.damage;
	textBox[2].textContent = "Attack Speed: " + hero.attackSpeed;
	textBox[3].textContent = "Attack Width: " + hero.attackWidth;
	textBox[4].textContent = "Attack Length: " + hero.attackLength;
	textBox[5].textContent = "Enemies Killed: " + enemiesKilled;
	textBox[6].textContent = "Time to next spawn: " + Math.floor(spawnRate - (seconds % 10));
}
// зарежда снимките за да върви по-бързо играта
function loadImages() {
	powerupImages = [new Image(), new Image(), new Image(), new Image(), new Image()];
	powerupImages[0].src = "powerups/aspeed.png";
	powerupImages[1].src = "powerups/attack.png";
	powerupImages[2].src = "powerups/health.png";
	powerupImages[3].src = "powerups/length.png";
	powerupImages[4].src = "powerups/width.png";

	heroImages = [];
	for (let i = 0; i < 4; i++) {
		let images = [new Image(), new Image(), new Image()];
		for (let j = 0; j < images.length; j++) {
			images[j].src = "hero/" + i + "" + j + ".png";
		}
		heroImages.push(images);
	}

	enemyImages = [];
	for (let i = 0; i < 4; i++) {
		let images = [new Image(), new Image(), new Image()];
		for (let j = 0; j < images.length; j++) {
			images[j].src = "enemy/" + i + "" + j + ".png";
		}
		enemyImages.push(images);
	}
}