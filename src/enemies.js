var BHell = (function (my) {

/**
 * Enemy base class. Each enemy's behaviour is controlled by a mover, an array of emitters and a parameter object, but
 * this modularity can be overridden in derived classes.
 *
 * Parameters shared between all enemies:
 *
 * - hp: Hitpoints of the enemy,
 * - speed: Movement's speed (the unit is determined by the specific mover used),
 * - period: Emitters' period,
 * - hitbox_w: Width of the hitbox used for collisions with bullets and the player,
 * - hitbox_h: Height of the hitbox,
 * - angle: Shooting angle,
 * - aim: Aim parameter for the emitters,
 * - always_aim: Always_aim parameter for the emitters,
 * - rnd: If the emitters aren't aimed at the player and rnd = true, every shot's direction is randomized,
 * - score: Score points awarded for each successful bullet hit,
 * - kill_score: Score points awarded on enemy's death,
 * - boss: If true, an hp bar will be shown,
 * - boss_bgm: If defined, plays this BGM instead of the one defined on the map,
 * - suppress_warning: If true (together with boss), doesn't show the warning sign,
 * - resume_bgm: If true, when the monster is defeated, resumes the previous BGM,
 * - bullet: bullet parameters (see {@link BHell.BHell_Bullet}).
 *
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Sprite
 */
var BHell_Enemy_Base = my.BHell_Enemy_Base = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Base.prototype = Object.create(my.BHell_Sprite.prototype);
BHell_Enemy_Base.prototype.constructor = BHell_Enemy_Base;

/**
 * Constructor. Sets the parameters shared between all classes.
 *
 * @param x X spawning coordinate.
 * @param y Y spawning coordinate.
 * @param image Enemy sprite.
 * @param params Setup parameters.
 * @param parent Container for the enemy's, emitters' and bullets' sprites.
 * @param enemyList Array in which the enemy will be pushed.
 */
BHell_Enemy_Base.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    my.BHell_Sprite.prototype.initialize.call(this, image.characterName, image.characterIndex, image.direction, image.pattern, ((params.animated != null)? params.animated: true), params.animation_speed || 25);

    this.parent = parent;
    this.parent.addChild(this);
    this.enemyList = enemyList;
    this.emitters = [];

    this.x = x;
    this.y = y;

    this.hasAppeared = false;

    // Set default parameters.
    this.hp = 1;
    this.speed = 3;
    this.period = 60;
    this.hitboxW = this.width;
    this.hitboxH = this.height;
    this.angle = Math.PI / 2;
    this.aim = false;
    this.alwaysAim = false;
    this.aimX = 0;
    this.aimY = 0;
    this.rnd = false;
    this.score = 10;
    this.killScore = 100;
    this.boss = false;
    this.suppressWarning = false;

    // Overrides default parameters with params content.
    if (params != null) {
        var tmp;

        tmp = my.parse(params.hp, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp > 0) {
            this.hp = Math.round(tmp);
        }
        tmp = my.parse(params.speed, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp < 10 && tmp > 0) {
            this.speed = tmp;
        }
        tmp = my.parse(params.period, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp > 0) {
            this.period = tmp;
        }
        tmp = my.parse(params.hitbox_w, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp > 0) {
            this.hitboxW = tmp;
        }
        tmp = my.parse(params.hitbox_h, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp > 0) {
            this.hitboxH = tmp;
        }
        tmp = my.parse(params.angle, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.angle = tmp;
        }

        tmp = my.parse(params.aim, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.aim = tmp;
        }

        tmp = my.parse(params.always_aim, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.alwaysAim = tmp;
        }

        tmp = my.parse(params.aim_x, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.aimX = tmp;
        }

        tmp = my.parse(params.aim_y, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.aimY = tmp;
        }

        tmp = my.parse(params.rnd, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.rnd = tmp;
        }

        tmp = my.parse(params.score, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.score = tmp;
        }

        tmp = my.parse(params.kill_score, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.killScore = tmp;
        }

        tmp = my.parse(params.boss, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.boss = tmp;
        }

        tmp = my.parse(params.suppress_warning, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.suppressWarning = tmp;
        }

        if (params.bullet != null) {
            this.bullet = Object.assign({}, params.bullet);
        }
    }

    if (this.boss) {
        my.bossMaxHp += this.hp;
        my.bossHp += this.hp;
    }
};

/**
 * Checks if the given coordinates are inside the enemy's hitbox.
 * In case of collision, stores the coordinates into this.lastX and this.lastY (useful for spawning explosions, for example).
 * @param x X coordinate.
 * @param y Y coordinate.
 * @returns {boolean} true if (x, y) is inside the hitbox.
 */
BHell_Enemy_Base.prototype.checkCollision = function (x, y) {
    var dx = Math.abs(this.x - x);
    var dy = Math.abs(this.y - y);

    if (dx < this.hitboxW / 2 && dy < this.hitboxH / 2) {
        this.lastX = x;
        this.lastY = y;
    }

    return (dx < this.hitboxW / 2 && dy < this.hitboxH / 2);
};

/**
 * Update function, called every frame.
 */
BHell_Enemy_Base.prototype.update = function () {
    my.BHell_Sprite.prototype.update.call(this);
    this.move();
    this.shoot(true);

    this.emitters.forEach(e => { // If not shooting, change the angle
        if (this.aim === false && this.rnd === true) {
            e.angle = Math.random() * 2 * Math.PI;
        }

        e.update();
    });
};

/**
 * Moves the enemy and all its emitters, delegating the calculations to its mover.
 */
BHell_Enemy_Base.prototype.move = function () {
    if (this.mover != null) {
        var p = this.mover.move(this.x, this.y, this.speed);
        this.x = p[0];
        this.y = p[1];
    }

    this.emitters.forEach(e => {
        e.move(this.x, this.y);
    });
};

/**
 * Enables/disables shooting for every emitter (but only if the player is ready to move).
 * @param t True to enable shooting, false otherwise.
 */
BHell_Enemy_Base.prototype.shoot = function (t) {
    this.emitters.forEach(e => {
        e.shooting = t && !my.player.justSpawned;
    });
};


/**
 * Makes the enemy lose one hit point, possibly killing it.
 */
BHell_Enemy_Base.prototype.hit = function () {
    this.hp--;
    $gameBHellResult.score += this.score;

    if (this.boss) {
        my.bossHp--;
    }

    if (this.hp <= 0) {
        this.die();
        $gameBHellResult.enemiesKilled++;
    }
};

/**
 * Checks if the enemy has left the map, but only after it has appeared on screen to avoid triggering the enemy's
 * destruction when it's just spawned.
 *
 * The controller relies on this method to destroy enemies, so enemies which shouldn't be destroyed when leaving the map
 * should always return false.
 * @returns {boolean} True if the enemy has appeared on the screen and is currently outside the screen.
 */
BHell_Enemy_Base.prototype.isOutsideMap = function () {
    var outside = (this.x < -this.width / 2) || (this.x > Graphics.width + this.width / 2) || (this.y >= Graphics.height + this.height / 2) || (this.y < -this.height / 2);
    var ret = this.hasAppeared && outside;

    this.hasAppeared |= !outside;

    return ret;
};

/**
 * Checks if the enemy has collided with the player.
 * @param player Player object.
 * @returns {boolean} True if there is a collision.
 */
BHell_Enemy_Base.prototype.hasCrashed = function(player) {
    var dx = Math.abs(this.x - player.x);
    var dy = Math.abs(this.y - player.y);
    var hitW = (this.hitboxW + player.hitboxW) / 2 ;
    var hitH = (this.hitboxH + player.hitboxH) / 2;

    return dx < hitW && dy < hitH && !player.immortal;
};

/**
 * Crashes the enemy, destroying it.
 * @returns {boolean} True if the crash has succeded (e.g. bosses immune to crashing will return false).
 */
BHell_Enemy_Base.prototype.crash = function() {
    if (this.boss !== true) {
        my.explosions.push(new my.BHell_Explosion(this.x, this.y, this.parent, my.explosions));
        this.destroy();
    }
    $gameBHellResult.enemiesCrashed++;

    return true;
};

/**
 * Awards the killing score and destroys the enemy.
 */
BHell_Enemy_Base.prototype.die = function() {
    $gameBHellResult.score += this.killScore;
    my.explosions.push(new my.BHell_Explosion(this.x, this.y, this.parent, my.explosions));

    this.destroy();
};

/**
 * Destroys the enemy sprite and removes it from the controller's array of enemies.
 */
BHell_Enemy_Base.prototype.destroy = function() {
    if (this.parent != null) {
        this.parent.removeChild(this);
    }
    this.enemyList.splice(this.enemyList.indexOf(this), 1);
};


/**
 * Suicide enemy class. Chases the player until they crash, it never shoots.
 *
 * No additional parameters are defined.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Base
 */
var BHell_Enemy_Suicide = my.BHell_Enemy_Suicide = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Suicide.prototype = Object.create(BHell_Enemy_Base.prototype);
BHell_Enemy_Suicide.prototype.constructor = BHell_Enemy_Suicide;

BHell_Enemy_Suicide.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);
    this.mover = new my.BHell_Mover_Chase();
};

    /**
     * Orbiter enemy class. Orbits around the player and shoots toward it once in a while. It is never destroyed outside the map.
     *
     * Additional parameters:
     *
     * - radius: distance from the player.
     * - counterclockwise: if true orbits counterclockwise.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Enemy_Base
     */
    var BHell_Enemy_Orbiter = my.BHell_Enemy_Orbiter = function() {
        this.initialize.apply(this, arguments);
    };

    BHell_Enemy_Orbiter.prototype = Object.create(BHell_Enemy_Base.prototype);
    BHell_Enemy_Orbiter.prototype.constructor = BHell_Enemy_Orbiter;

    BHell_Enemy_Orbiter.prototype.initialize = function (x, y, image, params, parent, enemyList) {
        BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

        // Set default parameters for this class:
        this.radius = 250;
        this.counterclockwise = false;

        // Overrides default parameters:
        if (params != null) {
            var tmp;

            tmp = my.parse(params.radius, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
            if (tmp > 0) {
                this.radius = Math.round(tmp);
            }

            tmp = my.parse(params.counterclockwise, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
            if (tmp !== null) {
                this.counterclockwise = tmp;
            }
        }

        var emitterParams = {};
        emitterParams.x = 0;
        emitterParams.y = 0;
        emitterParams.period = this.period;
        emitterParams.angle = 0;
        emitterParams.aim = true;
        emitterParams.always_aim = true;
        emitterParams.bullet = Object.assign({}, this.bullet);

        this.mover = new my.BHell_Mover_Orbit(this.radius, this.counterclockwise);
        this.emitters.push(new my.BHell_Emitter_Angle(this.x, this.y, emitterParams, parent, my.enemyBullets));
    };

    BHell_Enemy_Orbiter.prototype.isOutsideMap = function () {
        return false;
    };

/**
 * Probe enemy class. Switches between two states: moving and shooting. In the first state it moves in a straight line
 * towards a random point on screen and never shoots, in the second state it shoots without moving.
 * Due to the moving behavior, it's impossible for it to leave the screen.
 *
 * Additional parameters:
 *
 * - shooting: length (in frames) of the shooting phase (the moving phase length depends on the distance from the
 *           randomly chosen point).
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Base
 */
var BHell_Enemy_Probe = my.BHell_Enemy_Probe = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Probe.prototype = Object.create(BHell_Enemy_Base.prototype);
BHell_Enemy_Probe.prototype.constructor = BHell_Enemy_Probe;

BHell_Enemy_Probe.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.shooting = 120;

    if (params != null) {
        var tmp = my.parse(params.shooting, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp > 0) {
            this.shooting = tmp;
        }
    }

    this.destX = Math.random() * Graphics.width;
    this.destY = Math.random() * Graphics.height;
    this.j = 0;

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.period = this.period;
    emitterParams.angle = 0;
    emitterParams.aim = this.aim;
    emitterParams.always_aim = this.alwaysAim;
    emitterParams.aim_x = this.aimX;
    emitterParams.aim_y = this.aimY;
    emitterParams.rnd = this.rnd;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.moving = true;
    this.emitters.push(new my.BHell_Emitter_Angle(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Update method. Since no mover is used, the entire moving behaviour is handled here.
 */
BHell_Enemy_Probe.prototype.update = function () {
    my.BHell_Sprite.prototype.update.call(this);

    if (this.moving) {
        var dx = this.destX - this.x;
        var dy = this.destY - this.y;
        var angle = Math.atan2(dy, dx);

        if (dx > 0) {
            this.x += Math.min(dx, Math.cos(angle) * this.speed);
        }
        else if (dx < 0) {
            this.x += Math.max(dx, Math.cos(angle) * this.speed);
        }

        if (dy > 0) {
            this.y += Math.min(dy, Math.sin(angle) * this.speed);
        }
        else if (dy < 0) {
            this.y += Math.max(dy, Math.sin(angle) * this.speed);
        }

        var shootingAngle = 0;
        if (this.aim === false && this.rnd === true) {
            shootingAngle = Math.random() * 2 * Math.PI;
        }
        this.emitters.forEach(e => {
            e.move(this.x, this.y);
            e.angle = shootingAngle;
            e.update();
        });
        if (Math.abs(dx) < 2 && Math.abs(dx) < 2) {
            this.destX = Math.random() * Graphics.width;
            this.destY = Math.random() * Graphics.height;
            this.moving = false;
        }
    }
    else {
        this.j = (this.j + 1) % this.shooting;
        this.shoot(true);
        this.emitters.forEach(e => {
            e.update();
        });
        if (this.j === 0) {
            this.moving = true;
            this.shoot(false);
        }
    }
};

/**
 * Blocker enemy class. It moves horizontally trying to stop the player (as long as its speed can keep up) and slowly
 *  creeps towards the bottom, shooting downwards.
 *
 * Added parameters:
 *
 * - vspeed: vertical speed (in pixels per frame).
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Base
 */
var BHell_Enemy_Blocker = my.BHell_Enemy_Blocker = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Blocker.prototype = Object.create(BHell_Enemy_Base.prototype);
BHell_Enemy_Blocker.prototype.constructor = BHell_Enemy_Blocker;

BHell_Enemy_Blocker.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.vspeed = 0.2;

    if (params != null) {
        var tmp = my.parse(params.vspeed, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp > 0) {
            this.vspeed = tmp;
        }
    }

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.period = this.period;
    emitterParams.angle = Math.PI / 2;
    emitterParams.aim = false;
    emitterParams.always_aim = false;
    emitterParams.rnd = false;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.emitters.push(new my.BHell_Emitter_Angle(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Move method. Instead of using a mover, the behaviour is entirely handled here.
 */
BHell_Enemy_Blocker.prototype.move = function () {
    var dx = my.player.x - this.x;

    if (dx > 0) {
        this.x += Math.min(dx, this.speed);
    }
    else if (dx < 0) {
        this.x += Math.max(dx, -this.speed);
    }

    this.y += this.vspeed;

    this.emitters.forEach(e => {
        e.move(this.x, this.y);
    });
};

/**
 * Spline-based enemy base class. Sets up the moving behavior for every enemy moving in a spline pattern.
 *
 * Additional parameters:
 *
 * - A {x, y}: First spline point,
 * - B {x, y}: Second spline point,
 * - C {x, y}: Third spline point,
 * - D {x, y}: Fourth spline point.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Base
 */
var BHell_Enemy_Spline = my.BHell_Enemy_Spline = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Spline.prototype = Object.create(BHell_Enemy_Base.prototype);
BHell_Enemy_Spline.prototype.constructor = BHell_Enemy_Spline;

BHell_Enemy_Spline.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    var A = {x: x, y: y - this.height};
    var B = {x: x, y: y - this.height};
    var C = {x: x, y: Graphics.height + this.height};
    var D = {x: x, y: Graphics.height + this.height};

    if (params != null) {
        if (params.A != null) {
            A.x = my.parse(params.A.x, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || A.x;
            A.y = my.parse(params.A.y, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || A.y;
        }
        if (params.B != null) {
            B.x = my.parse(params.B.x, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || B.x;
            B.y = my.parse(params.B.y, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || B.y;
        }
        if (params.C != null) {
            C.x = my.parse(params.C.x, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || C.x;
            C.y = my.parse(params.C.y, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || C.y;
        }
        if (params.D != null) {
            D.x = my.parse(params.D.x, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || D.x;
            D.y = my.parse(params.D.y, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || D.y;
        }
    }

    this.mover = new my.BHell_Mover_Spline(A.x, A.y, B.x, B.y, C.x, C.y, D.x, D.y);
};

/**
 * Small fry enemy class. Shoots with an angle emitter.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Spline
 */
var BHell_Enemy_Smallfry = my.BHell_Enemy_Smallfry = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Smallfry.prototype = Object.create(BHell_Enemy_Spline.prototype);
BHell_Enemy_Smallfry.prototype.constructor = BHell_Enemy_Smallfry;

BHell_Enemy_Smallfry.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Spline.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.period = this.period;
    emitterParams.angle = this.angle;
    emitterParams.aim = this.aim;
    emitterParams.aim_x = this.aimX;
    emitterParams.aim_y = this.aimY;
    emitterParams.rnd = this.rnd;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.emitters.push(new my.BHell_Emitter_Angle(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Gunner enemy base class. Alternates two states: shooting and cooling down (during which
 * it can't shoot).
 *
 * Additional parameters:
 *
 * - cooldown: Length (in frames) of the cooldown phase,
 * - shooting: Length (in frames) of the shooting phase,
 * - stop_on_shooting: if true the enemy halts its movements while shooting.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Spline
 */
var BHell_Enemy_Gunner_Base = my.BHell_Enemy_Gunner_Base = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Gunner_Base.prototype = Object.create(BHell_Enemy_Spline.prototype);
BHell_Enemy_Gunner_Base.prototype.constructor = BHell_Enemy_Gunner_Base;

BHell_Enemy_Gunner_Base.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Spline.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.cooldown = 60;
    this.shooting = 60;
    this.stopOnShooting = false;

    if (params != null) {
        this.cooldown = params.cooldown || this.cooldown;
        this.shooting = params.shooting || this.shooting;
        this.stopOnShooting = params.stop_on_shooting || this.stopOnShooting;
    }

    this.j = 1;
    this.coolingDown = true;
};

/**
 * Update method. Alternates between shooting and cooling down phases. If rnd = true, the shooting angle is changed only
 * during cooldown.
 */
BHell_Enemy_Gunner_Base.prototype.update = function () {
    my.BHell_Sprite.prototype.update.call(this);
    if (this.stopOnShooting === false) {
        this.move();
    }

    if (this.coolingDown) {
        this.j = (this.j + 1) % this.cooldown;
        this.shoot(false);
        if (this.stopOnShooting === true) {
            this.move();
        }
        this.emitters.forEach(e => { // If not shooting, change the angle
            if (this.aim === false && this.rnd === true) {
                e.angle = Math.random() * 2 * Math.PI;
            }

            e.update();
        });
        if (this.j === 0) {
            this.coolingDown = false;
        }
    }
    else {
        this.j = (this.j + 1) % this.shooting;
        this.shoot(true);
        this.emitters.forEach(e => { // If shooting, keep the aim steady
            e.update();
        });
        if (this.j === 0) {
            this.coolingDown = true;
        }
    }
};

// Gunner enemy: shoots a series of bullets.
/**
 * Gunner enemy class. Gunner with an Angle emitter.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Gunner_Base
 */
var BHell_Enemy_Gunner = my.BHell_Enemy_Gunner = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Gunner.prototype = Object.create(BHell_Enemy_Gunner_Base.prototype);
BHell_Enemy_Gunner.prototype.constructor = BHell_Enemy_Gunner;

BHell_Enemy_Gunner.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Gunner_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.aim = this.aim;
    emitterParams.always_aim = this.alwaysAim;
    emitterParams.aim_x = this.aimX;
    emitterParams.aim_y = this.aimY;
    emitterParams.period = this.period;
    emitterParams.angle = this.angle;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.emitters.push(new my.BHell_Emitter_Angle(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Sprayer enemy class. Gunner with a Spray emitter.
 *
 * Additional parameters:
 *
 * - a: initial angle for the spray arc,
 * - b: final angle for the spray arc,
 * - n: number of bullets to shot.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Gunner_Base
 */
var BHell_Enemy_Sprayer = my.BHell_Enemy_Sprayer = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Sprayer.prototype = Object.create(BHell_Enemy_Gunner_Base.prototype);
BHell_Enemy_Sprayer.prototype.constructor = BHell_Enemy_Sprayer;

BHell_Enemy_Sprayer.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Gunner_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.a = Math.PI / 2 - Math.PI / 16;
    this.b = Math.PI / 2 + Math.PI / 16;
    this.n = 10;

    if(params != null) {
        this.a = params.a || this.a;
        this.b = params.b || this.b;
        this.n = params.n || this.n;
    }

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.period = this.period;
    emitterParams.angle = this.angle;
    emitterParams.aim_x = this.aimX;
    emitterParams.aim_y = this.aimY;
    emitterParams.a = this.a;
    emitterParams.b = this.b;
    emitterParams.n = this.n;
    emitterParams.aim = this.aim;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.emitters.push(new my.BHell_Emitter_Spray(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Burster enemy class. Gunner with a Burst emitter.
 *
 * Additional parameters:
 *
 * - shots: number of bullets to fire in one burst,
 * - dispersion: radius of the dispersion circle.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Gunner_Base
 */
var BHell_Enemy_Burster = my.BHell_Enemy_Burster = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Burster.prototype = Object.create(BHell_Enemy_Gunner_Base.prototype);
BHell_Enemy_Burster.prototype.constructor = BHell_Enemy_Burster;

BHell_Enemy_Burster.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Gunner_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.shots = 30;
    this.dispersion = 50;

    if (params != null) {
        this.shots = params.shots || this.shots;
        this.dispersion = params.dispersion || this.dispersion;
    }

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.period = this.period;
    emitterParams.aim = this.aim;
    emitterParams.angle = this.angle;
    emitterParams.aim_x = this.aimX;
    emitterParams.aim_y = this.aimY;
    emitterParams.shots = this.shots;
    emitterParams.dispersion = this.dispersion;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.emitters.push(new my.BHell_Emitter_Burst(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Starshooter enemy class. Gunner with a star pattern (360 degrees Spray emitter).
 *
 * Additional parameters:
 *
 * - n: number of points for the star.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Gunner_Base
 */
var BHell_Enemy_Starshooter = my.BHell_Enemy_Starshooter = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Starshooter.prototype = Object.create(BHell_Enemy_Gunner_Base.prototype);
BHell_Enemy_Starshooter.prototype.constructor = BHell_Enemy_Starshooter;

BHell_Enemy_Starshooter.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Gunner_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.n = 5;

    if (params != null) {
        this.shots = params.shots || this.shots;
        this.n = params.n || this.n;
    }

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.period = this.period;
    emitterParams.angle = this.angle;
    emitterParams.aim_x = this.aimX;
    emitterParams.aim_y = this.aimY;
    emitterParams.aim = this.aim;
    emitterParams.always_aim = this.alwaysAim;
    emitterParams.a = 0;
    emitterParams.b = 2 * Math.PI;
    emitterParams.n = this.n;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.emitters.push(new my.BHell_Emitter_Spray(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Swirler enemy class. Starshooter with slowly rotating angle.
 *
 * Additional parameters:
 *
 * - rotation_angle: rotation speed (in radians per frame) of the bullets' swirl.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Starshooter
 */
var BHell_Enemy_Swirler = my.BHell_Enemy_Swirler = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Swirler.prototype = Object.create(BHell_Enemy_Starshooter.prototype);
BHell_Enemy_Swirler.prototype.constructor = BHell_Enemy_Swirler;

BHell_Enemy_Swirler.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Starshooter.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.rotation_angle = 0.01;

    if (params != null) {
        this.rotation_angle = params.rotation_angle || this.rotation_angle;
    }
};

BHell_Enemy_Swirler.prototype.update = function () {
    this.emitters.forEach(e => {
        e.a += this.rotation_angle;
        e.b += this.rotation_angle;
    });

    BHell_Enemy_Starshooter.prototype.update.call(this);
};

return my;
} (BHell || {}));