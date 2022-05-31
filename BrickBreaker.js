var game, mouseX;
const PI = Math.PI;

$(document).ready(function(){
	var context = document.getElementById("brick-board").getContext("2d");
	game = new Game(context, 3);

	$(document).click(function(){
		console.log(game.status);
		switch(game.status){
			case NOT_RUNNING:
				break;
			case READY:
				game.status = RUNNING;
				game.balls[0].shoot();
				break;
			case RUNNING:
				// Ability
				break;
			case PRE_READY:
				game.status = READY;
				break;

		}
	});
	$("#option-btn").click(function(){
		$(".main-btn").css("display", "none");
		$("#settings").css("display", "flex");
		switch(game.settings.character){
			case redCharacter:
				$("#redbird").css("filter", "grayscale(0)");
				break
			case blueCharacter:
				$("#bluebird").css("filter", "grayscale(0)");
				break;
			case yellowCharacter:
				$("#yellowbird").css("filter", "grayscale(0)");
				break;
		}
	});
	$("#bgm-volume").on("input", function(){
		game.settings.bgVolume = $(this).val() * 0.007;
		game.runningBgm.volume = game.settings.bgVolume;
	})

	$("#sfx-volume").on("input", function(){
		game.settings.fxVolume = $(this).val() * 0.007;
	})
	$("#submit-setting").on("click", function(){
		$("#settings").hide();
		$(".main-btn").show();
	})

	$(document).mousemove(function(event){
		mouseX = event.pageX - $(window).width()/2 + 250;
	});

	$("#before-start").click(function(){
		$(this).hide();
		game.setBackgroundImage("시작화면3.png");
		game.drawBackgroundImage();
		$(".main-btn").show();
		game.playSound("시작화면.ogg",true);
	});

	$("#start-btn").click(function() {
		$(".main-btn").css("display", "none");
		$("#select-stage").css("display", "flex");
	});
	$("#stage1").click(function(){
		$("#select-stage").hide();
		game.runningBgm.pause();
		game.playSound("레벨1.ogg",true);
		// 게임을 시작합니다.
		game.startLevel(0);
	});
	$("#stage2").click(function(){
		$("#select-stage").hide();
		game.runningBgm.pause();
		game.playSound("레벨1.ogg",true);
		// 게임을 시작합니다.
		game.startLevel(1);
	});
	$("#stage3").click(function(){
		$("#select-stage").hide();
		game.runningBgm.pause();
		game.playSound("레벨1.ogg",true);
		// 게임을 시작합니다.
		game.startLevel(2);
	});

	$("#scoreboard-btn").click(function() {
		$(".main-btn").css("display", "none");
		$("#scoreboard").css("display", "flex");
	});

	$("#redbird").click(function(){
		game.settings.character = redCharacter;
		game.settings.characterNumber = 1;
		$(".bird").css("filter", "grayscale(100)");
		game.playSound("select1.ogg");
		$(this).css("filter", "grayscale(0)");
	});

	$("#bluebird").click(function(){
		game.settings.character = blueCharacter;
		game.settings.characterNumber = 2;
		$(".bird").css("filter", "grayscale(100)");
		game.playSound("select2.ogg");
		$(this).css("filter", "grayscale(0)");
	});

	$("#yellowbird").click(function(){
		game.settings.character = yellowCharacter;
		game.settings.characterNumber = 3;
		$(".bird").css("filter", "grayscale(100)");
		game.playSound("select3.ogg");
		$(this).css("filter", "grayscale(0)");
	});

	$("#restart").click(function(){
		$("#failure").hide();
		game.life = 3;
		game.run();
	});

	$("#goto-menu").click(function(){
		$("#failure").hide();
		$(".main-btn").show();
		game.setBackgroundImage("시작화면3.png");
		game.drawBackgroundImage();
	});
});

const NOT_RUNNING = 0;
const RUNNING = 1;
const READY = 2;
const PRE_READY = 3;

class Game{
	constructor(canvas, life){
		this.canvas = canvas;
		this.lifeCanvas = $("#life").get(0).getContext("2d");
		this.itemCanvas = $("#item-duration").get(0).getContext("2d");
		this.life = life;
		this.scoreboard = [];
		this.settings = new Settings();
		this.fallingItems = [];
		this.bricks = [];
		this.balls = [];
		this.activeItems = [];
		this.paddle = new Paddle(225, 3, 150);
		this.status = NOT_RUNNING;
		this.gameLoop = null;
		this.currentLevel = -1;
		this.score = 0;
		this.runningBgm = null;
		this.currentBackgroundImage=null;
		this.drawBackgroundImage(this.canvas,"시작화면2.jpg");
		this.multiply = 1.0;

		this.heartImage = new Image();
		this.heartImage.src = "src/heart.png";

		this.activateAbility = this.settings.character.activate;
		this.deactivateAbility = this.settings.character.deactivate;
		this.initAbilityCooldown = 1000;
		this.abilityCooldown = 1000;
	}

	setBackgroundImage(source){
		var bgI=new Image();
		bgI.src="src/backgroundimg/"+source;
		bgI.onload=function(){
			game.drawBackgroundImage();
		}
		this.currentBackgroundImage=bgI;
	}

	drawBackgroundImage(){
		if(this.currentBackgroundImage!=null)
			this.canvas.drawImage(this.currentBackgroundImage,0,0,500,800);
	}

	drawActiveItemDuration(){
		this.itemCanvas.clearRect(0, 0, 250, 40);
		for(var i = 0; i < this.activeItems.length; i++){
			this.itemCanvas.globalAlpha = (this.activeItems[i].duration / this.activeItems[i].initDuration);
			this.itemCanvas.drawImage(this.activeItems[i].image, 10 + 30 * i, 5, 25, 30);
		}
	}

	build(levelArray){
		let brickArray = levelArray[0];
		let itemArray = levelArray[1];
		this.bricks = [];
		for(let i = 0; i < brickArray.length; i++){
			for(let j = 0; j < brickArray[i].length; j++){
				let item = null;
				if (itemArray[i][j] !== 0){
					switch (itemArray[i][j]){
						case "D":
							item = new doubleBallItem(i, j, this.paddle);
							break;
						case "P":
							item = new doublePaddleItem(i, j, this.paddle);
							break;
						case "PO":
							item = new powerBall(i, j, this.paddle);
							break;
						case "S12":
							item = new Score12(i, j, this.paddle);
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
		this.abilityCooldown--;
		if (this.bricks.length === 0){
			clearInterval(this.gameLoop);
			if (this.currentLevel === 3){
				// CLEAR
			}
			else
				this.nextLevel();
		}

		// Ball 확인 (다 없으면 라이프 -)
		if (this.balls.length === 0){
			if (--this.life === 0){
				// FAIL
				clearInterval(this.gameLoop);
				game.runningBgm.pause();
				this.status = NOT_RUNNING;
				game.playSound("레벨실패.ogg",false);
				$("#failure").css("display", "flex");
			}
			else{
				this.activeItems.forEach(item=>{item.deactivate();});
				this.activeItems = [];
				this.fallingItems = [];
				this.status = READY;
				this.balls.push(new this.settings.character(0, 0, Math.random() * PI / 2 + 1.25 * PI, 5, 12, false));
			}
		}
		this.drawLife();
		this.drawActiveItemDuration();
		this.canvas.clearRect(0, 0, 500, 800);
		this.drawBackgroundImage();
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
		this.status = PRE_READY;
		// 게임을 시작하기 위한 메서드 묶음입니다
		// 현재 진행중인 Interval 제거
		clearInterval(this.gameLoop);
		// 레벨 설정
		this.currentLevel = level;
		// 공 전부 지우기
		this.life = 3;
		this.balls = [];
		// 현재 발동중인 아이템 상태 지우기
		this.activeItems.forEach(item=>{item.deactivate();});
		this.activeItems = [];
		// 현재 떨어지는 아이템 지우기
		this.fallingItems = [];
		// 레벨 작성
		this.build(levels[level]);
		// 처음에는 공이 패들과 붙어 있고, 사용자가 클릭 시 위로 나아감
		this.setBackgroundImage("배경화면1.png");

		var initBall = new this.settings.character(0, 0, Math.random() * PI / 2 + 1.25 * PI, 5, 12, false);
		this.balls.push(initBall);
		this.gameLoop = setInterval(()=>{this.drawObjects()}, 10);

	}

	nextLevel(){
		this.status = NOT_RUNNING;
		this.startLevel(++this.currentLevel);
		game.playSound("레벨성공.ogg",false);
	}

	run(){
		this.startLevel(0);
		this.status = PRE_READY;
	}

	addScore(score){
		this.score += score*game.multiply;
    $("#score").text(this.score);
	}

	playSound(source, loop){
		var audio = new Audio();
		audio.src = "src/audio/" + source;
		audio.loop = loop;
		if(loop){
			audio.volume = this.settings.bgVolume;
			this.runningBgm = audio;
		}
		else{
			audio.volume = this.settings.fxVolume;
		}
		audio.play();
	}

	drawLife() {
		this.lifeCanvas.clearRect(0, 0, 250, 40);
		for(var i = 0; i < this.life; i++){
			this.lifeCanvas.drawImage(this.heartImage, 20 + 40 * i, 0, 40, 40);
		}
	}

}


class Ball{
	constructor(x, y, angle, speed, radius, running, imgSource){
		this.x = x;
		this.y = y;
		this.angle = angle;
		this.radius = radius;
		this.speed = speed;
		this.isPower = false;
		this.running = running;
		this.rotateAngle = 0;
		this.deltaRotateAngle = Math.random() * 0.04 + 0.04;
		this.birdImg = new Image();
		this.birdImg.src = "src/" + imgSource;

	}

	draw(canvas){
		canvas.save();
		canvas.translate(this.x, this.y);
		if(this.running)
			canvas.rotate(this.rotateAngle += this.deltaRotateAngle);
		canvas.drawImage(this.birdImg, -this.radius, -this.radius, this.radius*2, this.radius*2);
		canvas.restore();
	}

	shoot(){
		game.playSound("start" + game.settings.characterNumber + ".ogg", false);
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
			if(!this.isPower) this.horizontalCollision();
			brick.collision();
		}
		if (cross(this.x, this.y, new_x, new_y, leftBorder - this.radius, bottomBorder + this.radius, rightBorder + this.radius, bottomBorder + this.radius)){
			if(!this.isPower) this.horizontalCollision();
			brick.collision();
		}
		if (cross(this.x, this.y, new_x, new_y, leftBorder - this.radius, topBorder - this.radius, leftBorder - this.radius, bottomBorder + this.radius)){
			if(!this.isPower) this.horizontalCollision();
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
				game.playSound("ball_bounce.ogg",false);
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
		game.playSound(game.settings.characterNumber + "-" + Math.floor(Math.random() * 4 + 1) + ".ogg", false);
		this.calculate();
	}

	horizontalCollision(){
		if (this.angle <= PI/2 || this.angle >= (PI * 3/2)){
			this.angle = 2*PI - this.angle;
		}
		else{
			this.angle = 3/2*PI - (this.angle - PI/2);
		}
		game.playSound(game.settings.characterNumber + "-" + Math.floor(Math.random() * 4 + 1) + ".ogg", false);
		this.calculate();
	}
}

class redCharacter extends Ball {
	constructor(x, y, angle, speed, radius, running){
		super(x, y, angle, speed, radius, running, "red.png");
	}
}

class blueCharacter extends Ball {
	constructor(x, y, angle, speed, radius, running,){
		super(x, y, angle, speed, radius, running, "blue.png");
	}
	activate() {
		let ballLength = game.balls.length + 1;
		$("#brick-board").click(function() {
			for(var i = 0; i < ballLength; i++) {
				var ball = game.balls[i];
				var angle1 = ball.angle - (PI / 6);
				var angle2 = ball.angle + (PI / 6);
				game.balls.push(
					new blueCharacter(ball.x, ball.y, angle1, ball.speed, ball.radius, true, "blue.png")
				);
				game.balls.push(
					new blueCharacter(ball.x, ball.y, angle2, ball.speed, ball.radius, true, "blue.png")
				);
			}
		});
	}
}	// blue는 특정 조건을 만족하면 세 마리로 분열된다.

class yellowCharacter extends Ball {
	constructor(x, y, angle, speed, radius, running) {
		super(x, y, angle, speed, radius, running, "yellow.png");
		//this.duration = duration;
	}
	static activate() {
		$("#brick-board").click(function() {
			this.speed += 10;
		});
	}
	static deactivate() {
		this.speed -= 10;
	}
}	// yellow는 특정 조건을 만족하면 속도가 빨라진다.

class Paddle{
	constructor(x, speed, size){
		this.x = x;
		this.y = 780;
		this.height = 10;
		this.speed = speed;
		this.size = size;
		this.image = new Image();
		this.image.src = "src/paddle.png";
	}

	draw(canvas){
		canvas.drawImage(this.image, this.x, this.y, this.size, this.height);
	}

	calculate(){
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
			game.playSound("damage" + (Math.floor(Math.random() * 8) + 1) + ".ogg",false);
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
		this.initDuration = duration;
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
			game.playSound("big_bird.ogg",false);
		}
	}
	// Abstract Methods
	activate(){};
	deactivate(){};
}

class doubleBallItem extends Item{
	constructor(yIndex, xIndex, paddle) {
		super(yIndex, xIndex, paddle, 0);
		this.image.src = "src/egg1.png";
	}
	activate() {
		let ballLength = game.balls.length;
		for(var i = 0; i < ballLength; i++){
			var ball = game.balls[i];
			var newAngle = Math.random() * PI + (ball.angle - PI/2);
			game.balls.push(
				new game.settings.character(ball.x, ball.y, newAngle, ball.speed, ball.radius, true)
			);
		}
	}
}

class doublePaddleItem extends Item{
	constructor(yIndex, xIndex, paddle){
		super(yIndex, xIndex, paddle, 600);
		this.image.src = "src/egg2.png";
	}
	activate(){
		game.paddle.size += 25;
	}
	deactivate(){
		game.paddle.size -= 25;
		game.playSound("padd.ogg",false);
	}
}

class speedup extends Item{
	constructor(yIndex, xIndex, paddle){
		super(yIndex, xIndex, paddle, 300);
	}
	activate(){
		game.paddle.speed += 15;
	}
	deactivate(){
		game.paddle.speed -= 15;
		game.playSound("padd-.ogg",false);
	}
}

class Score12 extends Item{
	constructor(yIndex, xIndex, paddle){
		super(yIndex, xIndex, paddle, 400);
		this.image.src = "src/egg2.png";
	}
	activate(){
		game.multiply += 0.2;
	}
	deactivate(){
		game.multiply -= 0.2;
		game.playSound("padd-.ogg",false);
	}
}

class Settings{
	constructor() {
		this.character = redCharacter;
		this.characterNumber = 1;
		this.fxVolume = 1;
		this.bgVolume = 1;
	}
}

class powerBall extends Item{
	constructor(yIndex, xIndex, paddle){
		super(yIndex, xIndex, paddle, 200);
		this.image.src = "src/egg4.png";
	}
	activate(){
		for(let i=0;i<game.balls.length;i++)
			game.balls[i].isPower = true;

	}
	deactivate(){
		for(let i=0;i<game.balls.length;i++)
			game.balls[i].isPower = false;
	}

}

const levels =[
	// Level 1 역기모양
	[
		[ // Level
			[1, 1, 1, 1, 1, 1, 1, 1, 1],
			[1, 1, 1, 1, 1, 1, 1, 1, 1],
			[0, 0, 0, 0, 1, 0, 0, 0, 0],
			[1, 1, 1, 1, 1, 1, 1, 1, 1],
			[1, 1, 1, 1, 1, 1, 1, 1, 1],
			[1, 0, 0, 0, 1, 0, 0, 0, 1],
		],
		[ // Item
			[0, "S12", 0, 0, "P", 0, "D", 0, 0],
			[0, 0, "S12", "P", 0, 0, 0, "D", 0],
			[0, "D", "P", 0, "S12", 0, 0, 0, 0],
			[0, "P", 0, "PO", 0, "S12", 0, "D", 0],
			["P", "P", "S12", 0, "D", "PO", "S12", "P", "P"],
			[0, "D", "P", 0, "S12", 0, 0, 0, 0]
		]
	],

	// Level 2 다이아모양
	[
		[
		   [0, 0, 0, 0, 1, 0, 0, 0, 0],
		   [0, 0, 0, 1, 1, 1, 0, 0, 0],
		   [0, 0, 1, 1, 1, 1, 1, 0, 0],
		   [0, 1, 1, 1, 1, 1, 1, 1, 0],
		   [1, 1, 1, 1, 1, 1, 1, 1, 1],
		   [0, 1, 1, 1, 1, 1, 1, 1, 0],
		   [0, 0, 1, 1, 1, 1, 1, 0, 0],
		   [0, 0, 0, 1, 1, 1, 0, 0, 0],
		   [0, 0, 0, 0, 1, 0, 0, 0, 0]
		],
		[
		   [0, 0, 0, 0, 1, 0, 0, 0, 0],
		   [0, 0, 0, 1, "P", 1, 0, 0, 0],
		   [0, 0, 1, 1, "P", 1, 1, 0, 0],
		   [0, 1, "S12", 1, "D", 1, 1, 1, 0],
		   [1,"P", 1,"D", "PO", "D", 1, "P", 1],
		   [0, 1, 1, "PO", "D", "PO", 1, 1, 0],
		   [0, 0, "S12", 1, 1, 1, "S12", 0, 0],
		   [0, 0, 0, 1, "S12", 1, 0, 0, 0],
		   [0, 0, 0, 0, 1, 0, 0, 0, 0]
			
		]
	],

	// Level 3 하트모양
	[
		[
		    [1, 0, 0, 0, 0, 0, 0, 0, 1],
			[1, 1, 0, 0, 0, 0, 0, 1, 1],
			[1, 1, 1, 1, 0, 1, 1, 1, 1],
			[0, 1, 1, 1, 1, 1, 1, 1, 0],
			[0, 1, 1, 1, 1, 1, 1, 1, 0],
			[0, 0, 1, 1, 1, 1, 1, 0, 0],
			[0, 0, 0, 1, 1, 1, 0, 0, 0],
			[0, 0, 0, 0, 1, 0, 0, 0, 0],
		],
		[
		    ["P", 0, 0, 0, 0, 0, 0, 0,"P"],
			[0, "S12", 0, 0, 0, 0, 0, "S12", 0],
			["S12", 0, "P", 0, 0, 0, "P", 0, "S12"],
			[0, "S12", 0, 0, "D", 0, 0, "S12", 0],
			[0, 0, "PO", 0, "D", 0, "PO", 0, 0],
			[0, 0, 0, "PO", "D", "PO", 0, 0, 0],
			[0, 0, 0, 0, "D", 0, 0, 0, 0],
			[0, 0, 0, 0, "D", 0, 0, 0, 0]

		]
	]
];
