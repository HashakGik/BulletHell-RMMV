var BHell = (function (my) {

    var BHell_Enemy_Darklord = my.BHell_Enemy_Darklord = function() {
        this.initialize.apply(this, arguments);
    };

    BHell_Enemy_Darklord.prototype = Object.create(my.BHell_Enemy_Base.prototype);
    BHell_Enemy_Darklord.prototype.constructor = BHell_Enemy_Darklord;

    BHell_Enemy_Darklord.prototype.initialize = function(x, y, image, params, parent, enemyList) {
        params.hp = 10000;
        params.speed = 0.3;
        params.hitbox_w = 399;
        params.hitbox_h = 350;
        params.animated = false;
        my.BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

        this.initializeForehead();
        this.initializeHands(parent);
        this.initializeClaws(parent);
        this.initializeWings(parent);

        this.j = 0;
        this.state = "started";
        this.receivedDamage = 0;

        this.mover = new my.BHell_Mover_Bounce(Graphics.width / 2, 200, 0, this.hitboxW, this.hitboxH);
    };

    BHell_Enemy_Darklord.prototype.initializeForehead = function () {
        this.foreheadCounter = 0;
    };

    BHell_Enemy_Darklord.prototype.initializeHands = function (parent) {
        var handsParams = {};
        handsParams.bullet = {};
        handsParams.bullet.speed = 0.5;
        handsParams.bullet.index = 0;
        handsParams.bullet.frame = 0;
        handsParams.bullet.direction = 2;
        handsParams.period = 300;
        handsParams.a = 0;
        handsParams.b = 2 * Math.PI;
        handsParams.n = 45;
        this.handsEmitters = [];
        this.handsEmitters.push(new my.BHell_Emitter_Spray(0, 0, handsParams, parent, my.enemyBullets));
        this.handsEmitters.push(new my.BHell_Emitter_Spray(0, 0, handsParams, parent, my.enemyBullets));
        this.handsEmitters[0].offsetX = -46;
        this.handsEmitters[0].offsetY = -68;
        this.handsEmitters[1].offsetX = 100;
        this.handsEmitters[1].offsetY = -60;
    };

    BHell_Enemy_Darklord.prototype.initializeClaws = function (parent) {
        var clawsParams = {};
        clawsParams.bullet = {};
        clawsParams.bullet.speed = 1;
        clawsParams.bullet.index = 0;
        clawsParams.bullet.frame = 2;
        clawsParams.bullet.direction = 2;
        clawsParams.period = 5;
        clawsParams.a = Math.PI;
        clawsParams.b = 3 * Math.PI;
        clawsParams.n = 5;

        this.clawsEmitters = [];
        this.clawsEmitters.push(new my.BHell_Emitter_Spray(0, 0, clawsParams, parent, my.enemyBullets));
        this.clawsEmitters.push(new my.BHell_Emitter_Spray(0, 0, clawsParams, parent, my.enemyBullets));
        this.clawsEmitters[0].offsetX = -98;
        this.clawsEmitters[0].offsetY = 100;
        this.clawsEmitters[1].offsetX = 127;
        this.clawsEmitters[1].offsetY = 106;
        this.clawsCounter = 0;
    };

    BHell_Enemy_Darklord.prototype.initializeWings = function (parent) {
        var wingsParams = {};
        wingsParams.bullet = {};
        wingsParams.bullet.speed = 1;
        wingsParams.bullet.index = 0;
        wingsParams.bullet.frame = 2;
        wingsParams.bullet.direction = 8;
        wingsParams.period = 5;
        wingsParams.alwaysAim = true;
        wingsParams.aim = true;
        this.wingsEmitters = [];
        this.wingsEmitters.push(new my.BHell_Emitter_Angle(0, 0, wingsParams, parent, my.enemyBullets));
        this.wingsEmitters.push(new my.BHell_Emitter_Angle(0, 0, wingsParams, parent, my.enemyBullets));
        this.wingsEmitters[0].offsetX = 152;
        this.wingsEmitters[0].offsetY = -134;
        this.wingsEmitters[1].offsetX = -160;
        this.wingsEmitters[1].offsetY = -118;
        this.wingsEmitters[0].aimX = 100;
        this.wingsEmitters[0].alwaysAim = true;
        this.wingsEmitters[1].alwaysAim = true;
        this.wingsEmitters[1].aimX = -100;
    };


    BHell_Enemy_Darklord.prototype.update = function () {
        my.BHell_Sprite.prototype.update.call(this);

        if (this.state !== "dying" && this.state !== "stunned") {
            this.move();
        }

        if (this.receivedDamage > 100 && this.mover.inPosition === true) {
            my.explosions.push(new my.BHell_Explosion(this.lastX, this.lastY, this.parent, my.explosions));
            this.changeState("stunned");
            my.controller.destroyEnemyBullets();
        }

        switch (this.state) {
            case "started":
                if (this.mover.inPosition === true) {
                    AudioManager.playSe({name: "Monster5", volume: 100, pitch: 100, pan: 0});
                    this.changeState("pattern 1");
                }
                break;
            case "pattern 1": // Shoots from the hands and the claws for 10 seconds, then switches to pattern 2
                if (this.j > 600) {
                    this.changeState("pattern 2");
                } else {
                    this.updateClaws();
                    this.updateHands();
                }

                break;
            case "pattern 2": // Shoots from the hands and the wings for 10 seconds, then switches randomly to pattern 1 or 3
                if (this.j > 600) {
                    if (Math.random() > 0.7) {
                        this.changeState("pattern 3");
                    }
                    else {
                        this.changeState("pattern 1");
                    }
                } else {
                    this.updateWings();
                    this.updateHands();
                }
                break;
            case "pattern 3": // Spawns some probe enemies until the player dies or for 10 seconds.
                if (my.player.justSpawned || this.j > 600) {
                    this.changeState("waiting");
                }
                else {
                    this.updateForehead();
                }

                break;
            case "waiting": // Waits until there are no more enemies on screen.
                if (my.controller.enemies.length === 1) {
                    this.changeState("pattern 1");
                }
                break;
            case "stunned": // Does nothing for 10 seconds.
                if (this.j > 600) {
                    this.changeState("pattern 1");
                }
                break;
            case "dying": // Spawns explosions for 5 seconds, then dies.
                if (this.j > 300) {
                    this.destroy();
                }
                else if (this.j % 10 === 0) {
                    my.explosions.push(new my.BHell_Explosion(Math.floor(Math.random() * this.hitboxW) + this.x - this.hitboxW / 2, Math.floor(Math.random() * this.hitboxH) + this.y - this.hitboxH / 2, this.parent, my.explosions));
                }
                break;
            case "changing": // Wait 3 seconds without shooting before actually changing to the scheduled state.
                if (this.j > 180) {
                    this.changeState(this.scheduledState);
                }
                break;
        }

        this.clawsEmitters.forEach(e => {
            e.update();
        });
        this.handsEmitters.forEach(e => {
            e.update();
        });
        this.wingsEmitters.forEach(e => {
            e.update();
        });

        // Update the received damage counter for the stunned state.
        if (this.j % 60 == 0) {
            this.receivedDamage = 0;
        }

        // Update the time counter and reset it every 20 seconds.
        this.j = (this.j + 1) % 1200;
    };

    BHell_Enemy_Darklord.prototype.updateForehead = function() {
        // Spawn a probe enemy every 3 seconds.
        this.foreheadCounter = (this.foreheadCounter + 1) % 180;

        if (this.foreheadCounter === 0) {
            var image = {"characterName":"Evil","direction":2,"pattern":0,"characterIndex":6};
            var params = {};
            params.animated = true;
            params.aim = true;
            params.bullet = {};
            params.bullet.frame = 2;
            my.controller.enemies.push(new my.BHell_Enemy_Probe(this.x + 42, this.y - 82, image, params, this.parent, my.controller.enemies));
        }
    };

    BHell_Enemy_Darklord.prototype.updateHands = function() {
        this.shoot(this.handsEmitters, true);
    };

    BHell_Enemy_Darklord.prototype.updateWings = function() {
        this.shoot(this.wingsEmitters,true);
    };


    BHell_Enemy_Darklord.prototype.updateClaws = function() {
        if (this.clawsCounter === 0) {
            this.clawsEmitters[0].a = Math.PI;
            this.clawsEmitters[0].b = 3 * Math.PI;
            this.clawsEmitters[1].a = 0;
            this.clawsEmitters[1].b = 2 * Math.PI;
        }
        this.shoot(this.clawsEmitters, this.clawsCounter < 180);

        this.clawsEmitters[0].a += 0.004;
        this.clawsEmitters[0].b += 0.004;
        this.clawsEmitters[1].a -= 0.004;
        this.clawsEmitters[1].b -= 0.004;

        this.clawsCounter = (this.clawsCounter + 1) % 300;
    };

    BHell_Enemy_Darklord.prototype.move = function () {
        if (this.mover != null) {
            var p = this.mover.move(this.x, this.y, this.speed);
            this.x = p[0];
            this.y = p[1];
        }

        this.clawsEmitters.forEach(e => {
            e.move(this.x, this.y);
        });
        this.handsEmitters.forEach(e => {
            e.move(this.x, this.y);
        });
        this.wingsEmitters.forEach(e => {
            e.move(this.x, this.y);
        });
    };


    BHell_Enemy_Darklord.prototype.shoot = function(emitters, t) {
        // Replaces BHell_Enemy_Base.shoot(t). It enables only SOME emitters at the time (not all of them).
        emitters.forEach(e => {
            e.shooting = t && !my.player.justSpawned;
        });
    };

    BHell_Enemy_Darklord.prototype.changeState = function(s) {
        if (this.state === "changing") {
            this.state = s;
        }
        else {
            this.scheduledState = s;
            this.state = "changing";
        }

        this.shoot(this.clawsEmitters, false);
        this.shoot(this.handsEmitters, false);
        this.shoot(this.wingsEmitters, false);

        this.j = 0;
    };

    BHell_Enemy_Darklord.prototype.hit = function () {
        if (this.state !== "dying") {
            my.BHell_Enemy_Base.prototype.hit.call(this);

            if (this.state != "stunned") {
                this.receivedDamage++;
            }
        }
    };

    BHell_Enemy_Darklord.prototype.die = function() {
        $gameBHellResult.score += this.killScore;
        AudioManager.playSe({name:"Collapse4", volume:100, pitch:100, pan:0});
        this.changeState("dying");

        my.controller.destroyEnemyBullets();
    };

    return my;
} (BHell || {}));