var BHell = (function (my) {

    /**
     * Controller class. Handles the game mechanics.
     * @constructor
     * @memberOf BHell
     */
    var BHell_Controller = my.BHell_Controller = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Controller.prototype = Object.create(Object.prototype);
    BHell_Controller.prototype.constructor = BHell_Controller;

    /**
     * Constructor. Creates player and generators.
     * @param stage Map id for the stage.
     * @param playerId Id of the player which will be created.
     * @param lives Initial lives for the player (-1: infinite).
     * @param parent Container for the sprites.
     */
    BHell_Controller.prototype.initialize = function (stage, playerId, lives, parent) {
        my.friendlyBullets = [];
        my.enemyBullets = [];

        my.bulletsHit = 0;
        my.bulletsLost = 0;

        this.enemies = [];
        my.explosions = [];

        this.parent = parent;
        this.stage = stage;
        my.player = new my.BHell_Player(playerId, lives, false, this.parent, this);
        my.player.spawn();

        this.generators = [];
        this.activeGenerators = [];

        my.bossMaxHp = 0;
        my.bossHp = 0;
        my.bossOnScreen = false;

        this.messages = [];

        // Create the generators from the map's events.
        this.stage.events().forEach(e => {
            var regex = /<(.+):([0-9]+):([0-9]+):((?:true)|(?:false))(?::((?:true)|(?:false)))?>/i;

            var comments = "";
            e.event().pages[0].list.filter(l => {
                return l.code === 108 || l.code === 408;
            }).forEach(l => {
                comments += l.parameters[0] + " ";
            });

            // If an event has some message, store it in the messages array.
            var message = {};
            message.list = e.event().pages[0].list.filter(l => {
                return l.code === 101 || l.code === 401;
            });
            message.y = e.event().y;

            this.messages.push(message);

            var grps = regex.exec(e.event().note);
            if (grps != null) {
                this.generators.push(new my.BHell_Generator(e.event().x * this.stage.tileWidth(), e.event().y, e.event().pages[0].image, grps[1], Number(grps[2]), Number(grps[3]), (grps[4] === "true"), (grps[5] === "true"), comments, this.enemies, this.parent));
            }
        });

        var regex = /<bhell:([0-9]+(?:\.[0-9])*)>/i;
        var grps = regex.exec($dataMap.note);
        this.scrollSpeed = 0;
        this.stageY = this.stage.height();

        if (grps != null) {
            this.scrollSpeed = Number(grps[1]);
        }
        else {
            this.scrollSpeed = 0.1;
            console.warn("This map doesn't have a <bhell:speed> note. Setting default speed to 0.1.");
        }

        this.paused = false;
        my.playing = true;

        $gameBHellResult = $gameBHellResult || {};
        $gameBHellResult.retries = $gameBHellResult.retries || 0;
        $gameBHellResult.livesLost = $gameBHellResult.livesLost || 0;
        $gameBHellResult.bombsUsed = $gameBHellResult.bombsUsed || 0;
        $gameBHellResult.hitRatio = 0;
        $gameBHellResult.enemiesKilled = 0;
        $gameBHellResult.enemiesMissed = 0;
        $gameBHellResult.enemiesCrashed = 0;
        $gameBHellResult.score = 0;
        $gameBHellResult.gaveUp = false;
        $gameBHellResult.won = false;
    };

    /**
     * Updates the game's loop until all generators are cleared or until the player looses all its lives.
     */
    BHell_Controller.prototype.update = function () {
        var i;
        var g;
        var e;
        var b;
        var m;

        if (this.generators.length === 0 && this.activeGenerators.length === 0 && this.enemies.length === 0) {
            // Victory.
            $gameBHellResult.won = true;
            my.player.win();
        }
        else if (my.player.lives === 0) {
            // Defeat.
            $gameBHellResult.won = false;
            my.playing = false;
        }
        else if (my.playing && !this.paused && !$gameMessage.isBusy()) { // Main update loop.
            // Scroll the stage if there are no stopping generators.
            if (this.activeGenerators.filter(g => {
                return g.stop === true;
            }).length === 0) {
                this.stage.scrollUp(this.scrollSpeed);
            }

            // If the player can move and there are no active generators to synchronize, update the stage's progression.
            if (my.player.justSpawned === false) {
                if (this.activeGenerators.filter(g => {
                    return g.sync === true;
                }).length === 0) {
                    this.stageY -= this.scrollSpeed;
                }

                var bossGenerators = this.activeGenerators.filter(g => {
                    return g.bossGenerator === true;
                });

                my.bossOnScreen = bossGenerators.length > 0;
                if (!my.bossOnScreen) {
                    my.bossMaxHp = 0;
                    my.bossHp = 0;
                }

                // If it's time to activate a generator, move it from the stage array to the active array.
                for (i = 0; i < this.generators.length; i++) {
                    g = this.generators[i];
                    if (g.y >= this.stageY) {
                        this.activeGenerators.push(g);
                        this.generators.splice(this.generators.indexOf(g), 1);
                        i--;
                    }
                }

                // If it's time to show a message, display it and remove it from the message list.
                var msg = this.messages.filter(m => {
                    return m.y >= this.stageY;
                });

                if (!$gameMessage.isBusy()) {
                    if (msg.length > 0) {
                        m = msg[0];
                        while (m.list.length > 0) {
                            var l = m.list[0];
                            if (l.code === 101) {
                                $gameMessage.newPage();
                                $gameMessage.setFaceImage(l.parameters[0], l.parameters[1]);
                                $gameMessage.setBackground(l.parameters[2]);
                                $gameMessage.setPositionType(l.parameters[3]);
                            }
                            else {
                                $gameMessage.add(l.parameters[0]);
                            }
                            m.list.splice(0, 1);
                        }
                        this.messages.splice(this.messages.indexOf(m), 1);
                    }
                }

                // Update the active generators. If a generator is synchronized, wait until there are no more enemies to remove it.
                for (i = 0; i < this.activeGenerators.length; i++) {
                    g = this.activeGenerators[i];
                    g.update();
                    if (g.n === 0) {
                        if (g.sync === false || this.enemies.length === 0) {
                            this.activeGenerators.splice(this.activeGenerators.indexOf(g), 1);
                            i--;
                        }
                    }
                }
            }

            // Update the enemies.
            for (i = 0; i < this.enemies.length; i++) {
                if (i >= 0) {
                    e = this.enemies[i];

                    if (e.isOutsideMap()) {
                        e.destroy();
                        i--;
                        $gameBHellResult.enemiesMissed++;
                    }

                    if (e.hasCrashed(my.player)) {
                        my.player.die(false);
                        e.crash();
                        i--;
                    }
                }
            }

            // Update the player's bullets.
            for (i = 0; i < my.friendlyBullets.length; i++) {
                b = my.friendlyBullets[i];
                if (b.isOutsideMap()) {
                    b.destroy();
                    my.bulletsLost++;
                    i--;
                } else {
                    var enemiesHit = this.enemies.filter(e => {
                        return e.checkCollision(b.x, b.y);
                    });

                    if (enemiesHit.length > 0) {
                        my.bulletsHit++;
                        b.destroy();
                        i--;
                        enemiesHit[0].hit(); // Each bullet hits only ONE enemy.
                    }
                }
            }

            this.playerHit = false;

            // Update the enemy bullets.
            for (i = 0; i < my.enemyBullets.length; i++) {
                b = my.enemyBullets[i];
                if (b.isOutsideMap()) {
                    b.destroy();
                    i--;
                }
                if (!this.playerHit && my.player.checkCollision(b.x, b.y)) {
                    this.playerHit = true; // If a bullet has already hit the player during this frame, ignore every other collision (because the player is either dead or has thrown an autobomb).
                    b.destroy();
                    my.player.die(true);
                    i--;
                }
            }

            // Update explosions. If the stage is scrolling, move the explosions with it.
            for (i = 0; i < my.explosions.length; i++) {
                e = my.explosions[i];
                if (this.stage.isLoopVertical() || this.stage._displayY !== 0) {
                    e.speed = this.scrollSpeed * this.stage.tileHeight();
                }
                else {
                    e.speed = 0;
                }
            }
        }
    };

    /**
     * Pushes a new message on the message list.
     * @param face Faceset.
     * @param index Index of the face to display.
     * @param background Background window format (0: window, 1: shadow, 2: transparent).
     * @param position Window position (0: bottom, 1: middle, 2: top).
     * @param lines Array of lines to display with the given settings.
     */
    BHell_Controller.prototype.pushMessage = function (face, index, background, position, lines) {
        for (var i = 0; i < lines.length / 4; i++) {
            var msg = {};
            msg.list = [];
            var tmp = {};
            tmp.code = 101;
            tmp.parameters = [face, index, background, position];
            msg.list.push(tmp);

            for (var j = 0; j < 4; j++) {
                if (i * 4 + j < lines.length) {
                    tmp = {};
                    tmp.code = 401;
                    tmp.parameters = [lines[i * 4 + j]];
                    msg.list.push(tmp);
                }
            }

            msg.y = this.stageY;
            this.messages.push(msg);
        }
    };

    /**
     * Destroys every enemy bullet on screen.
     */
    BHell_Controller.prototype.destroyEnemyBullets = function () {
        while (my.enemyBullets.length > 0) {
            var b = my.enemyBullets[0];
            my.explosions.push(new my.BHell_Explosion(b.x, b.y, this.parent, my.explosions));
            b.destroy();
        }
    };

    return my;
}(BHell || {}));