/**
 /**
 * @namespace BHell
 */
var BHell = (function (my) {

    /**
     * Player class.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Sprite
     */
    var BHell_Player = my.BHell_Player = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Player.prototype = Object.create(my.BHell_Sprite.prototype);
    BHell_Player.prototype.constructor = BHell_Player;

    /**
     * Constructor. Creates a player from the JSON configuration file.
     *
     * Parameters:
     *
     * - name: Player's name,
     * - sprite: Charset image,
     * - speed: Player's speed rank (D = 1, C = 2, B = 3, A = 4, S = 5. The actual speed is 2 * rank pixels per frame),
     * - rate: Player's rate of fire rank (D, C, B, A, S. {@see BHell.BHell_Emitter_Factory}).
     * - power: Player's power rank (D, C, B, A, S. {@see BHell.BHell_Emitter_Factory}),
     * - bombs: Player's initial stock of bombs (D = 1, C = 2, B = 3, A = 4, S = 5),
     * - autobombs: Player's autobomb rank (D = 0, C = 1, B = 2, A = 3, S = 4. If hit the player will automatically counterattacks with a bomb, up to rank times per life),
     * - unlocked: If true the player can be used on a stage,
     * - can_be_bought: If true the player can be bought at the shop,
     * - price: The player's price at the shop,
     * - hitbox_w: Width of the player's hitbox,
     * - hitbox_h: Height of the player's hitbox,
     * - index: Charset index,
     * - direction: Charset direction (note: lives will always use direction 2),
     * - frame: Initial charset frame index (0-2),
     * - animation_speed: Number of updates required for frame change,
     * - animated: If true the sprite will be animated,
     * - select_se: Sound effect played when selecting the player,
     * - spawn_se: Sound effect played when the player has spawned,
     * - death_se: Sound effect played on player's death,
     * - victory_se: Sound effect played on stage cleared,
     * - bomb: Bomb parameters (see {@link BHell.BHell_Bomb_Base} and derived classes),
     * - emitters: Array of emitters (see {@link BHell.BHell_Emitter_Base} and derived classes).
     *
     * @param id Id of the player to deserialize.
     * @param lives Initial number of lives (-1: unlimited).
     * @param bombs If true, the bombs are infinite.
     * @param parent Container for the sprites.
     */
    BHell_Player.prototype.initialize = function (id, lives, unlimitedBombs, parent) {
        var playerData = $dataBulletHell.players[id];
        var playerParams = Object.assign({}, $gamePlayer.bhellPlayers.filter(p => {
            return p.index === id;
        })[0]);

        ["speed", "bombs", "autobombs"].forEach(p => {
            switch (playerParams[p]) {
                case "D":
                    playerParams[p] = 1;
                    break;
                case "C":
                    playerParams[p] = 2;
                    break;
                case "B":
                    playerParams[p] = 3;
                    break;
                case "A":
                    playerParams[p] = 4;
                    break;
                case "S":
                    playerParams[p] = 5;
                    break;
                default:
                    playerParams[p] = 1;
                    break;
            }
        });

        my.BHell_Sprite.prototype.initialize.call(this, playerData.sprite, playerData.index, playerData.direction, playerData.frame, playerData.animated, playerData.animation_speed);

        this.parent = parent;
        this.parent.addChild(this);
        this.emitters = [];
        this.immortal = true;
        this.justSpawned = true;
        this.lives = lives;
        if (unlimitedBombs) {
            this.startingBombs = -1;
        }
        else {
            this.startingBombs = playerParams.bombs;
        }

        this.bombs = this.startingBombs;

        this.startingAutobombs = playerParams.autobombs - 1;
        this.autobombs = this.startingAutobombs;

        this.spawn_se = playerData.spawn_se;
        this.death_se = playerData.death_se;
        this.victory_se = playerData.victory;

        this.won = false;
        this.bonusLives = 0;

        this.hitboxW = my.parse(playerData.hitbox_w, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height);
        this.hitboxH = my.parse(playerData.hitbox_h, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height);

        this.speed = playerParams.speed * 2;

        playerData.emitters.forEach(e => {
            var emitter = my.BHell_Emitter_Factory.parseEmitter(e, this.x, this.y, this.patternWidth(), this.patternHeight(), playerParams.rate, playerParams.power, this.parent, my.friendlyBullets);
            if (emitter != null) {
                this.emitters.push(emitter);
                this.parent.addChild(emitter);
            }
        });

        if (playerData.bomb != null) {
            var regex = /BHell_Bomb_[A-Za-z0-9_]+/;
            if (regex.exec(playerData.bomb.class) != null) {
                var bombClass = eval("my." + playerData.bomb.class); // Safe-ish, since Only class names can be evaluated.
                this.bomb = new bombClass(this.parent, playerData.bomb, my.friendlyBullets);
            }
            else {
                this.bomb = new my.BHell_Bomb_Base(this.parent, playerData.bomb, my.friendlyBullets);
            }
        }

        this.dx = 0;
        this.dy = 0;
    };

    /**
     * Checks if the player collidesat given coordinates.
     * @param x X coordinate.
     * @param y Y coordinate.
     * @returns {boolean} True if (x, y) is inside the player's hitbox.
     */
    BHell_Player.prototype.checkCollision = function (x, y) {
        var dx = Math.abs(this.x - x);
        var dy = Math.abs(this.y - y);
        return (dx < this.hitboxW / 2 && dy < this.hitboxH / 2);
    };

    /**
     * Updates the player's sprite, position and bomb. Awards bonus lives if the score allows it.
     */
    BHell_Player.prototype.update = function () {
        my.BHell_Sprite.prototype.update.call(this);
        this.move();
        if (this.bomb != null) {
            this.bomb.update();
        }

        // Make the immortality last 5 seconds.
        if (this.immortal && this.immortalTimeout >= 0) {
            this.immortalTimeout++;

            if (this.immortalTimeout > 300) {
                this.immortal = false;
                this.immortalTimeout = -1;
                this.opacity = 255;
            }
        }

        this.updateBonusLives();
    };

    /**
     * Checks if the score has reached the plugin's life_bonus_first and life_bonus_next thresholds and awards
     * bonus lives accordingly.
     *
     * For example, if the bonus thresholds are set to 20000 and 50000, the player is awarded a life at: 20000 points,
     * 70000 (20000 + 50000), 120000 (20000 + 50000 + 50000), 170000, etc.
     */
    BHell_Player.prototype.updateBonusLives = function () {
        if (my.lifeBonusFirst > 0 && my.lifeBonusNext > 0) {
            if ($gameBHellResult.score >= this.bonusLives * my.lifeBonusNext + my.lifeBonusFirst) {
                this.bonusLives++;
                this.lives++;
            }
        }
    };


    /**
     * Sets a destination for the player.
     * @param x X coordinate of the destination.
     * @param y Y coordinate of the destination.
     */
    BHell_Player.prototype.moveTo = function (x, y) {
        this.dx = x - this.x;
        this.dy = y - this.y;
    };

    /**
     * Sets a destination in steps (multiples of this.speed).
     * @param h Horizontal number of steps.
     * @param v Vertical number of steps.
     */
    BHell_Player.prototype.step = function (h, v) {
        this.dx += h * this.speed;
        this.dy += v * this.speed;
    };

    /**
     * Moves the player and all its emitters.
     * If the player has just been spawned, moves it towards the starting position, otherwise towards its destination
     * (set with moveTo(x, y) and/or step(h, v) ).
     *
     * To avoid a death loop during a respawn, the player will wait until the enemy bullets have disappeared from screen
     * (eventually destroying them after a five seconds timeout).
     */
    BHell_Player.prototype.move = function () {
        // If the player has just been spawned (outside the screen), move to the starting position.
        if (this.justSpawned === true) {
            // Wait until the enemy bullets are cleared. If they are not cleared after five seconds, it destroys them.
            if (my.enemyBullets.length === 0) {
                var dy = Graphics.height * 0.9 - this.y;

                if (Math.abs(dy) <= this.speed * 0.3) {
                    this.y = Math.round(Graphics.height * 0.9);
                    this.immortalTimeout = 0;
                    my.controller.stopShooting = false;
                    this.justSpawned = false;
                    this.usingTouch = false;
                    this.dx = 0;
                    this.dy = 0;
                    if (this.spawn_se != null) {
                        AudioManager.playSe(this.spawn_se);
                    }
                }
                else {
                    this.y += Math.max(dy, -this.speed * 0.3);
                }
            }
            else {
                this.bulletTimeout++;
                if (this.bulletTimeout > 300) {
                    my.controller.destroyEnemyBullets();
                }
            }
        }
        else if (this.won === true) {
            var dx = Graphics.width / 2 - this.x;
            this.y -= this.speed;
            if (dx > 0) {
                this.x += Math.min(dx, this.speed);
            }
            else if (dx < 0) {
                this.x += Math.max(dx, -this.speed);
            }

            if (this.y < -this.height) {
                my.playing = false;
            }
        }
        else { // Otherwise move towards the destination.
            var angle = Math.atan2(this.dy, this.dx);

            if (this.dx > 0) {
                this.x += Math.min(this.dx, Math.cos(angle) * this.speed);
                this.dx -= Math.min(this.dx, Math.cos(angle) * this.speed);
            }
            else if (this.dx < 0) {
                this.x += Math.max(this.dx, Math.cos(angle) * this.speed);
                this.dx -= Math.max(this.dx, Math.cos(angle) * this.speed);
            }

            if (this.dy > 0) {
                this.y += Math.min(this.dy, Math.sin(angle) * this.speed);
                this.dy -= Math.min(this.dy, Math.sin(angle) * this.speed);
            }
            else if (this.dy < 0) {
                this.y += Math.max(this.dy, Math.sin(angle) * this.speed);
                this.dy -= Math.max(this.dy, Math.sin(angle) * this.speed);
            }

            // Prevent the player from leaving the screen.
            if (this.x < this.width / 2) {
                this.x = this.width / 2;
            }
            if (this.x > Graphics.width - this.width / 2) {
                this.x = Graphics.width - this.width / 2;
            }
            if (this.y < this.height / 2) {
                this.y = this.height / 2;
            }
            if (this.y > Graphics.height - this.height / 2) {
                this.y = Graphics.height - this.height / 2;
            }
        }

        // Move the emitters. A forEach can be used since the emitters' array won't change dynamically.
        this.emitters.forEach(e => {
            e.move(this.x, this.y);
        });
    };

    /**
     * Enables/disables shooting for each helper. If the player has just been spawned, shooting is disabled.
     * @param t True to enable shooting.
     */
    BHell_Player.prototype.shoot = function (t) {
        this.emitters.forEach(e => {
            e.shooting = t && this.justSpawned === false;
        });

    };

    /**
     * If there are bombs available, launch one.
     */
    BHell_Player.prototype.launchBomb = function () {
        if (!this.justSpawned && this.bombs !== 0 && !this.bomb.isActive()) {
            this.bombs--;
            $gameBHellResult.bombsUsed++;
            this.bomb.activate(this.x, this.y);
        }
    };

    /**
     * If the player is not immortal, destroy it and respawn it.
     * @param t If true, death was caused by a bullet, otherwise by a crash.
     */
    BHell_Player.prototype.die = function (t) {
        if (this.immortal === false) {
            if (t && this.autobombs > 0 && this.bombs > 0) { // If a bullet hits the player and there are autobombs available, launch one.
                this.launchBomb();
                this.autobombs--;
            }
            else {
                this.lives--;
                $gameBHellResult.livesLost++;
                my.controller.stopShooting = true;
                this.bombs = this.startingBombs;
                this.autobombs = this.startingAutobombs;
                this.bomb.deactivate();
                my.explosions.push(new my.BHell_Explosion(this.x, this.y, this.parent, my.explosions));
                if (this.death_se != null) {
                    AudioManager.playSe(this.death_se);
                }
                this.spawn();
            }
        }
    };

    /**
     * Plays the victory SE and moves the player to the top of the map.
     */
    BHell_Player.prototype.win = function () {
        if (this.won === false) {
            this.won = true;
            if (this.victory_se != null) {
                AudioManager.playSe(this.victory_se);
            }

            if (my.victoryMe != null) {
                AudioManager.playMe(my.victoryMe);
            }
        }
    };

    /**
     * Spawn the player outside the screen.
     */
    BHell_Player.prototype.spawn = function () {
        this.x = Math.round(Graphics.width / 2);
        this.y = Math.round(Graphics.height + this.height);
        this.justSpawned = true;
        this.bulletTimeout = 0;
        this.immortal = true;
        this.immortalTimeout = -1;
        this.opacity = 100;
    };

    return my;
}(BHell || {}));