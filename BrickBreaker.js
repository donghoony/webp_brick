
var game, mouseX;
const PI = Math.PI;

$(document).ready(function(){
	var context = document.getElementById("brick-board").getContext("2d");
	var life_context = document.getElementById("life").getContext("2d");	// life를 나타내는 캔버스
	var timelimit_context = document.getElementById("timelimit").getContext("2d");	// timelimit을 나타내는 캔버스
	$(document).mousemove(function(event){
		mouseX = event.pageX - $(window).width()/2 + 250;
	})
	$("#start").click(function() {
		$("#start, #option, #scoreboard").css("display", "none");
		// 게임을 시작합니다.
		// 다시 메인화면으로 돌아갈 떄 세 개의 버튼의 display 속성을 block으로 바꿔야 합니다.
	});
	$("#option").click(function() {
		$("#start, #option, #scoreboard").css("display", "none");
		// 환경설정으로 들어갑니다.
		// 다시 메인화면으로 돌아갈 떄 세 개의 버튼의 display 속성을 block으로 바꿔야 합니다.
	});
	$("#scoreboard").click(function() {
		$("#start, #option, #scoreboard").css("display", "none");
		// 지금까지의 스코어보드를 표시합니다.
		// 다시 메인화면으로 돌아갈 떄 세 개의 버튼의 display 속성을 block으로 바꿔야 합니다.
	});
	game = new Game(context, 3, "", "");
	game.run();
});

const NOT_RUNNING = 0;
const RUNNING = 1;



class Game{
	constructor(canvas, life, scoreboard, setting){
		this.canvas = canvas;
		this.life = life;
		this.scoreboard = scoreboard;
		this.setting = setting;
		this.fallingItems = [];
		this.bricks = [];
		this.balls = [];
		this.activeItems = [];
		this.paddle = new Paddle(225, 3, 150);
		this.status = NOT_RUNNING;
		this.gameLoop = null;
		this.currentLevel = -1;
		this.score = 0;
	}

	build(levelArray){
		let brickArray = levelArray[0];
		let itemArray = levelArray[1];

		for(let i = 0; i < brickArray.length; i++){
			for(let j = 0; j < brickArray[i].length; j++){
				let item = null;
				if (itemArray[i][j] !== 0){
					switch (itemArray[i][j]){
						case "D":
							item = new doubleBallItem(i, j, this.paddle);
							break;
						case "P":
						    item = new doublePaddleItem(i, j, this.paddle, 600);
						    break;
						case "S":
							item = new speedup(i, j, this.paddle, 500);
							break;
					}
				}
				this.bricks.push(new Brick(i, j, "green", item, brickArray[i][j]));
			}
		}
		this.bricks = this.bricks.filter(brick => !brick.isDestroyed);
	}

	drawBricks(){
		for(var i = 0; i < this.bricks.length; i++){
			if(!this.bricks[i].isDestroyed) this.bricks[i].draw(this.canvas);
		}
	}

	drawObjects(){
		// Brick 확인 (다 깼으면 클리어)
		if (this.bricks.length === 0){
			clearInterval(this.gameLoop);
			this.nextLevel();
		}

		// Ball 확인 (다 없으면 라이프 -)
		if (this.balls.length === 0){
			clearInterval(this.gameLoop);
		}

		this.canvas.clearRect(0, 0, 500, 800);
		this.drawBricks();

		this.paddle.calculate(this.canvas);
		this.paddle.draw(this.canvas);

		for(let i = 0; i < this.fallingItems.length; i++){
			this.fallingItems[i].calculate();
			this.fallingItems[i].draw(this.canvas);
			this.fallingItems[i].collision();
		}

		for(let i = 0; i < this.balls.length; i++) {
			this.balls[i].calculate();
			this.balls[i].draw(this.canvas);
			this.balls[i].checkPaddleCollision(this.canvas, this.paddle);
			this.balls[i].checkCollision(this.canvas, null);
			for(let j = 0; j < this.bricks.length; j++){
				this.balls[i].checkCollision(this.canvas, this.bricks[j]);
			}
		}
		// 아이템 제한시간 계산
		this.activeItems.forEach(item => {item.calculateDuration()});

		// this.bricks 중 isDestroyed가 False인 것만 모아 새로운 배열을 만듭니다
		this.activeItems = this.activeItems.filter(item => item.duration !== 0);
		this.bricks = this.bricks.filter(brick => !brick.isDestroyed);
		this.fallingItems = this.fallingItems.filter(item => item.isFalling);
		this.balls = this.balls.filter(ball => ball.y - ball.radius < 800);
	}

	startLevel(level){
		// 게임을 시작하기 위한 메서드 묶음입니다

		// 현재 진행중인 Interval 제거
		clearInterval(this.gameLoop);
		// 레벨 설정
		this.currentLevel = level;
		// 공 전부 지우기
		this.balls = [];
		// 현재 발동중인 아이템 상태 지우기
		this.activeItems.forEach(item=>{item.deactivate();});
		this.activeItems = [];
		// 현재 떨어지는 아이템 지우기
		this.fallingItems = [];
		// 레벨 작성
		this.build(levels[level]);
		// 처음에는 공이 패들과 붙어 있고, 사용자가 클릭 시 위로 나아감
		var initBall = new Ball(0, 0, Math.random() * PI / 2 + 1.25*PI, 5, 8,  false);
		$(document).click(function(){initBall.shoot();});
		this.balls.push(initBall);
		this.gameLoop = setInterval(()=>{this.drawObjects()}, 10);
	}

	nextLevel(){
		this.startLevel(++this.currentLevel);
	}

	run(){
		this.startLevel(0);
	}

	addScore(score){
		this.score += score;
		console.log(this.score);
	}
}


class Ball{
	constructor(x, y, angle, speed, radius, running, imgSource){
		this.x = x;
		this.y = y;
		this.angle = angle;
		this.radius = radius;
		this.speed = speed;
		this.running = running;

		this.rotateAngle = 0;
		this.deltaRotateAngle = Math.random() * 0.04 + 0.04;
		this.birdImg = new Image();
		this.birdImg.src = "src/red.png";
	}

	draw(canvas){
		canvas.save();
		canvas.translate(this.x, this.y);
		if(this.running)
			canvas.rotate(this.rotateAngle += this.deltaRotateAngle);
		canvas.drawImage(this.birdImg, -this.radius, -this.radius, this.radius*2, this.radius*2);
		canvas.restore();
		// canvas.arc(this.x, this.y, this.radius, 0, PI * 2, true);
		// canvas.fill();
	}

	shoot(){
		this.running = true;
	}

	checkCollision(canvas, brick){
		// 공이 바깥으로 나가거나, Brick에 닿을 경우 check하는 함수입니다
		// 옆면에 닿을 경우 verticalCollision()을, 위/아래에 닿을 경우 horizontalCollision()를 실행해 주세요, angle을 각각 뒤집어주는 함수입니다
		// 만약 brick과 닿은 경우, brick.collision()을 실행해 주세요 -> Brick의 count를 1 줄이는 함수입니다
		// 벽면
		if(this.x - this.radius < 0) {
			this.verticalCollision();
		}
		else if(this.x + this.radius >= 500){
			this.verticalCollision();
		}
		else if(this.y - this.radius < 0){
			this.horizontalCollision();
		}
		// else if (this.y + this.radius >= 800){
		// 	// 튕겨나오게 만들었지만, 이후에 라이프를 1 줄이는 함수를 실행할 예정입니다
		// 	this.horizontalCollision();
		// }
		if (brick === null) return;

		let topBorder = brick.y;
		let bottomBorder = brick.y + brick.height;
		let leftBorder = brick.x;
		let rightBorder = brick.x + brick.width;

		let new_y = this.y + Math.sin(this.angle) * this.speed;
		let new_x = this.x + Math.cos(this.angle) * this.speed;

		var ccw = (x1, y1, x2, y2, x3, y3) => {
			let ans = (x2-x1) * (y3-y1) - (y2-y1) * (x3-x1);
			if (ans < 0) return -1;
			else if (ans > 0) return 1;
			else return 0;
		};
		var cross = (x1, y1, x2, y2, x3, y3, x4, y4) => {
			return (ccw(x1, y1, x2, y2, x3, y3) * ccw(x1, y1, x2, y2, x4, y4) <= 0) &&
				(ccw(x3, y3, x4, y4, x1, y1) * ccw(x3, y3, x4, y4, x2, y2) <= 0);
		}

		if (cross(this.x, this.y, new_x, new_y, leftBorder - this.radius, topBorder-this.radius, rightBorder + this.radius, topBorder - this.radius)){
			this.horizontalCollision();
			brick.collision();
		}
		if (cross(this.x, this.y, new_x, new_y, leftBorder - this.radius, bottomBorder + this.radius, rightBorder + this.radius, bottomBorder + this.radius)){
			this.horizontalCollision();
			brick.collision();
		}
		if (cross(this.x, this.y, new_x, new_y, leftBorder - this.radius, topBorder - this.radius, leftBorder - this.radius, bottomBorder + this.radius)){
			this.verticalCollision();
			brick.collision();
		}
		if (cross(this.x, this.y, new_x, new_y, rightBorder + this.radius, topBorder - this.radius, rightBorder + this.radius, bottomBorder + this.radius)){
			this.verticalCollision();
			brick.collision();
		}

	}

	checkPaddleCollision(canvas, paddle){
		// 공이 패들과 닿았을 때, angle도 바뀌어야 합니다
		// 공의 angle을 -> 가장 왼쪽과 닿았을 경우 3/2*PI, 가장 오른쪽이 닿았을 때 2*PI의 값을 가지도록 (선형) 완성해 주세요
		if(this.y + this.radius > paddle.y) {
			if(this.x > paddle.x && this.x < (paddle.x + paddle.size)) {
				this.angle = 1.25*PI + (PI/2 * (this.x - paddle.x) / paddle.size);
			}
		}
	}

	calculate(){
		if(!this.running) {
			this.x = game.paddle.x + game.paddle.size / 2;
			this.y = game.paddle.y - this.radius;
			return;
		}
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed;
	}

	verticalCollision(){
		if (this.angle <= PI){
			this.angle = PI - this.angle;
		}
		else{
			this.angle = 2*PI - (this.angle - PI);
		}
		this.calculate();
	}

	horizontalCollision(){
		if (this.angle <= PI/2 || this.angle >= (PI * 3/2)){
			this.angle = 2*PI - this.angle;
		}
		else{
			this.angle = 3/2*PI - (this.angle - PI/2);
		}
		this.calculate();
	}
}

class Paddle{
	constructor(x, speed, size){
		this.x = x;
		this.y = 780;
		this.height = 3;
		this.speed = speed;
		this.size = size;
	}

	draw(canvas){
		canvas.beginPath();
		canvas.fillStyle = "red";
		canvas.fillRect(this.x, this.y, this.size, this.height);
	}

	calculate(){
		// 마우스의 위치에 따라 패들의 x좌표를 변경해 주세요
		// 변경은 speed값만큼 변합니다, 현재 마우스 좌표는 전역변수 mouseX에 저장돼 있습니다. mouseX는 캔버스 좌표로 변환돼 있습니다!
		if (this.x + this.size/2 > mouseX && this.x > 0)
			this.x -= Math.min(this.speed, this.x + this.size/2 - mouseX);
		else if (this.x + this.size/2 < mouseX && this.x < 500 - this.size)
			this.x += Math.min(this.speed, mouseX - this.x);
	}
}

class Brick {
	constructor(yIndex, xIndex, borderColor, item, count){
		this.width = 44;
		this.height = 20;
		this.yIndex = yIndex;
		this.xIndex = xIndex;
		this.y = this.yIndex * (this.height + 7) + 30;
		this.x = this.xIndex * (this.width + 5.5) + 30;

		this.borderColor = borderColor;
		this.item = item;
		this.count = count;
		this.isDestroyed = this.count === 0;

		this.img = new Image();
		this.img.src = "src/brick1.png";
		this.blinkDuration = Math.random() * 400 + 350;
	}

	blink(){
		this.blinkDuration--;
		if (this.blinkDuration > 0) return;

		if (this.img.src.endsWith("brick1.png")){
			this.img.src = "src/brick2.png";
			this.blinkDuration = 30;
		}
		else{
			this.img.src = "src/brick1.png";
			this.blinkDuration = Math.random() * 400 + 350;
		}
	}


	draw(canvas){
		// brick 하나를 그리는 함수를 작성해 주세요.
		// brick.yIndex, brick.xIndex를 통해 접근할 수 있습니다. yIndex는 가장 위가 0입니다.
		// xIndex는 0 ~ 9로 한 줄에 10개의 블럭이 있습니다
		this.blink();
		canvas.beginPath();
		canvas.strokeStyle = this.borderColor;
		canvas.drawImage(this.img, this.x, this.y, this.width, this.height);

		canvas.strokeRect(this.x,this.y,this.width,this.height);
		if (this.item != null) this.item.draw(canvas);
	}

	collision(){
		this.isDestroyed = --this.count <= 0;
		if (this.isDestroyed){
			if (this.item != null) {
				this.item.isFalling = true;
				game.fallingItems.push(this.item);
			}
			game.addScore(100);
		}
	}
}

class Item{
	constructor(yIndex, xIndex, collisionObject, duration) {
		this.xIndex = xIndex;
		this.yIndex = yIndex;
		this.x = this.xIndex * 49.5 + 30 + 22;
		this.y = this.yIndex * 27 + 30 + 10;
		this.dy = 3;
		this.radius = 10;
		this.isFalling = false;
		this.collisionObject = collisionObject;
		this.duration = duration;

		this.image = new Image();
	}

	draw(canvas){
		if(this.isFalling) {
			canvas.drawImage(this.image, this.x-this.radius, this.y-this.radius, this.radius*1.5, this.radius*2);
			// canvas.beginPath();
			// canvas.fillStyle = "red";
			// canvas.arc(this.x, this.y, this.radius, 0, 2 * PI, true);
			// canvas.fill();
		}
	}

	calculate(){
		this.y += this.dy;
		if (this.y >= 800) this.isFalling = false;
	}

	paddleCollision(){
		return (this.collisionObject.x <= this.x && this.x <= this.collisionObject.x + this.collisionObject.size &&
			this.y + this.radius >= this.collisionObject.y);
	}

	calculateDuration(){
		if (--this.duration <= 0) {
			this.duration = 0;
			this.deactivate();
		}
	}

	collision() {
		// Effect condition: Ball collision
		if (this.paddleCollision())
		{
			this.activate();
			game.activeItems.push(this);
			this.isFalling = false;
		}
	}
	// Abstract Methods
	activate(){};
	deactivate(){};
}

class doubleBallItem extends Item{
	constructor(yIndex, xIndex, paddle) {
		super(yIndex, xIndex, paddle);
		this.image.src = "src/egg1.png";
	}
	activate() {
		let ballLength = game.balls.length;
		for(var i = 0; i < ballLength; i++){
			var ball = game.balls[i];
			var newAngle = Math.random() * PI + (ball.angle - PI/2);
			game.balls.push(
				new Ball(ball.x, ball.y, newAngle, ball.speed, ball.radius, true)
			);
		}
	}
}


class doublePaddleItem extends Item{
	constructor(yIndex, xIndex, paddle,duration){
		super(yIndex, xIndex, paddle,duration);
		this.image.src = "src/egg2.png";
	}
	activate(){
		game.paddle.size += 25;
	}
	deactivate(){
		game.paddle.size -= 25;
	}
}

class speedup extends Item{
	constructor(yIndex, xIndex, paddle, duration){
		super(yIndex, xIndex, paddle, duration);
	}
	activate(){
		game.paddle.speed += 15;
	}
	deactivate(){
		game.paddle.speed -= 15;
	}
}

const levels =[
	// Level 1
	[
		[ // Level
			[1, 1, 1, 1, 1, 1, 1, 1, 1],
			[1, 1, 1, 1, 1, 1, 1, 1, 1],
			[1, 1, 1, 1, 1, 1, 1, 1, 1],
		],
		[ // Item
			[0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0],
			["P", "P", "D", "D", "D", "D", "D", "P", "P"]

		]
	],

	// Level 2
	[
		[
			[0, 0, 0, 1, 1, 1, 0, 0, 0],
			[0, 0, 0, 1, 1, 1, 0, 0, 0],
			[0, 0, 0, 1, 1, 1, 0, 0, 0],
			[0, 0, 0, 1, 1, 1, 0, 0, 0],
		],
		[
			[0, 0, 0, "D", "D", "D", 0, 0, 0],
			[0, 0, 0, "D", "D", "D", 0, 0, 0],
			[0, 0, 0, "D", "D", "D", 0, 0, 0],
			[0, 0, 0, "D", "D", "D", 0, 0, 0],
		]
	],

	// Level 3
	[
		[

		],
		[

		]
	]
];
