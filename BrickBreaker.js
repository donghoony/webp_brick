var game, mouseX;
$(document).ready(function(){
	var context = document.getElementById("brick-board").getContext("2d");
	$(document).mousemove(function(event){
		mouseX = event.pageX - $(window).width()/2 + 250;
	})

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
		this.bricks = [];
		this.balls = [];
		this.paddle = new Paddle(225, 3, 50);
		this.status = NOT_RUNNING;
		this.gameLoop = null;
	}

	build(levelArray){
		for(let i = 0; i < levelArray.length; i++){
			for(let j = 0; j < levelArray[i].length; j++){
				this.bricks.push(new Brick(i, j, "yellow", "green", " ", levelArray[i][j]));
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
		this.canvas.clearRect(0, 0, 500, 800);
		this.drawBricks();
		this.paddle.calculate(this.canvas);
		this.paddle.draw(this.canvas);

		for(let i = 0; i < this.balls.length; i++) {
			this.balls[i].calculate();
			this.balls[i].draw(this.canvas);
			this.balls[i].checkPaddleCollision(this.canvas, this.paddle);
			this.balls[i].checkCollision(this.canvas, null);
			for(let j = 0; j < this.bricks.length; j++){
				this.balls[i].checkCollision(this.canvas, this.bricks[j]);
			}
		}
		// this.bricks 중 isDestroyed가 False인 것만 모아 새로운 배열을 만듭니다
		this.bricks = this.bricks.filter(brick => !brick.isDestroyed);
	}

	run(){
		clearInterval(this.gameLoop);
		this.build(levels[0]);
		this.balls.push(new Ball(225, 600, Math.random() * Math.PI * 2, 6, 5, "orange"));
		this.gameLoop = setInterval(()=>{this.drawObjects()}, 10);
	}
}

class Ball{
	constructor(x, y, angle, speed, radius, color){
		this.x = x;
		this.y = y;
		this.angle = angle;
		this.radius = radius;
		this.speed = speed;
		this.color = color;
	}

	draw(canvas){
		canvas.beginPath();
		canvas.fillStyle = this.color;
		canvas.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
		canvas.fill();
	}

	checkCollision(canvas, brick){
		// 공이 바깥으로 나가거나, Brick에 닿을 경우 check하는 함수입니다
		// 옆면에 닿을 경우 verticalCollision()을, 위/아래에 닿을 경우 horizontalCollision()를 실행해 주세요, angle을 각각 뒤집어주는 함수입니다
		// 만약 brick과 닿은 경우, brick.collision()을 실행해 주세요 -> Brick의 count를 1 줄이는 함수입니다
		// brick === null 인 경우, 벽돌이 없이 벽과의 충돌만 계산합니다
	}

	checkPaddleCollision(canvas, paddle){
		// 공이 패들과 닿았을 때, 패들에 닿은 위치에 따라 다른 방향으로 튀어야 합니다.
		// 공의 angle을 -> 가장 왼쪽과 닿았을 경우 3/2*PI, 가장 오른쪽이 닿았을 때 2*PI의 값을 가지도록 (선형) 완성해 주세요
		if(this.y + this.radius > paddle.y) {
			if(this.x > paddle.x && this.x < (paddle.x + paddle.size)) {
				this.angle = 2*PI -(PI * (paddle.x + paddle.size - this.x) / paddle.size);
			}
		}
	}

	calculate(){
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed;
	}

	verticalCollision(){
		var PI = Math.PI
		if (this.angle <= PI){
			this.angle = PI - this.angle;
		}
		else{
			this.angle = 2*PI - (this.angle - PI);
		}
		this.calculate();
	}

	horizontalCollision(){
		var PI = Math.PI;
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
		canvas.fillStyle = "red";
		canvas.fillRect(this.x, this.y, this.size, this.height);
	}

	calculate(){
		// 마우스의 위치에 따라 패들의 x좌표를 변경해 주세요
		// 변경은 speed값만큼 변합니다, 현재 마우스 좌표는 전역변수 mouseX에 저장돼 있습니다. mouseX는 캔버스 좌표로 변환돼 있습니다!

	}
}

class Brick {
	constructor(yIndex, xIndex, color, borderColor, item, count){
		this.width = 50;
		this.height = 25;
		this.yIndex = yIndex;
		this.xIndex = xIndex;
		this.y = this.yIndex * this.height;
		this.x = this.xIndex * this.width;
		this.color = color;
		this.borderColor=borderColor;
		this.item = item;
		this.count = count;
		this.isDestroyed = this.count === 0;
	}

	draw(canvas){
		// brick 하나를 그리는 함수를 작성해 주세요.
		// brick.yIndex, brick.xIndex를 통해 접근할 수 있습니다. yIndex는 가장 위가 0입니다.
		// xIndex는 0 ~ 9로 한 줄에 10개의 블럭이 있습니다

		canvas.strokeStyle=this.borderColor;
		canvas.fillStyle=this.color;

		canvas.strokeRect(this.x,this.y,this.width,this.height);
		canvas.fillRect(this.x,this.y,this.width,this.height);

	}

	collision(){
		this.isDestroyed = --this.count === 0;
	}
}

const levels =[
	[
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
	],
];
