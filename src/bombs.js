var BHell = (function (my) {

    /**
     * Bomb base class. It simply deletes every enemy bullet on screen.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Sprite
     */
    var BHell_Bomb_Base = my.BHell_Bomb_Base = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Bomb_Base.prototype = Object.create(Object.prototype);
    BHell_Bomb_Base.prototype.constructor = BHell_Bomb_Base;

    /**
     * Constructor.
     *
     * Parameters:
     *
     * - sprite: The bullets' charset file,
     * - index: The bullets' charset index,
     * - direction: The bullets' charset direction,
     * - frame: The bullets' charset frame,
     * - icon: The bomb's iconset,
     * - icon_index: The bomb's icon index,
     * - se: The sound effect to be played when launching a bomb.
     *
     * @param parent Container for the derived classes' effects.
     * @param params Bomb parameters.
     * @param bulletList Array in which the spawned bullets will be stored.
     */
    BHell_Bomb_Base.prototype.initialize = function (parent, params, bulletList) {
        this.i = 0;

        this.bulletList = bulletList;
        this.parent = parent;
        this.params = params;

        this.bulletParams = {};
        this.bulletParams.sprite = this.params.sprite;
        this.bulletParams.index = this.params.index;
        this.bulletParams.direction = this.params.direction;
        this.bulletParams.frame = this.params.frame;

        this.active = false;
    };

    /**
     * Checks if a bomb is currently active.
     * @returns {boolean} True if a bomb is active.
     */
    BHell_Bomb_Base.prototype.isActive = function () {
        return this.active;
    };

    /**
     * Activates a bomb. Makes every enemy bullet on screen explode.
     * @param x X activation coordinate.
     * @param y Y activaton coordinate.
     */
    BHell_Bomb_Base.prototype.activate = function (x, y) {
        if (this.active === false) {
            this.x = x;
            this.y = y;
            this.i = 0;
            if (this.params.se != null) {
                AudioManager.playSe(this.params.se);
            }

            this.active = true;

            if (my.controller != null) {
                my.controller.destroyEnemyBullets();
            }
        }
    };

    /**
     * Deactivates the bomb.
     */
    BHell_Bomb_Base.prototype.deactivate = function () {
        this.active = false;
    };

    /**
     * Updates the bomb. After one second it automatically deactivates it.
     */
    BHell_Bomb_Base.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i >= 60) {
                this.deactivate();
            }
        }
    };

    /**
     * Wind bomb class. Creates a whirlwind of bullets around the player. Lasts 5 seconds.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Bomb_Base
     */
    var BHell_Bomb_Wind = my.BHell_Bomb_Wind = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Bomb_Wind.prototype = Object.create(BHell_Bomb_Base.prototype);
    BHell_Bomb_Wind.prototype.constructor = BHell_Bomb_Wind;

    BHell_Bomb_Wind.prototype.initialize = function (parent, params, bulletList) {
        BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);
    };

    /**
     * Updates the bomb. For 5 seconds (300 frames) creates four bullets each frame.
     */
    BHell_Bomb_Wind.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i > 300) {
                this.deactivate();
            }
            else {
                for (var j = 0; j < 4; j++) {
                    var bullet = new my.BHell_Bullet(my.player.x, my.player.y, Math.PI / 180 * (j + this.i * 16), this.bulletParams, this.bulletList);

                    this.bulletList.push(bullet);
                    this.parent.addChild(bullet);
                }
            }
        }
    };

    /**
     * Water bomb class. Creates 5 concentric rings of bullets centered at the activation point. Lasts 5 seconds.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Bomb_Base
     */
    var BHell_Bomb_Water = my.BHell_Bomb_Water = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Bomb_Water.prototype = Object.create(BHell_Bomb_Base.prototype);
    BHell_Bomb_Water.prototype.constructor = BHell_Bomb_Water;

    BHell_Bomb_Water.prototype.initialize = function (parent, params, bulletList) {
        BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);
    };

    /**
     * Updates the bomb. Creates 360 bullets travelling radially from the spawn point every second (60 frames).
     */
    BHell_Bomb_Water.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i > 300) {
                this.deactivate();
            }
            else if (this.i % 60 === 0) {
                for (var j = 0; j < 360; j++) {
                    var bullet = new my.BHell_Bullet(this.x, this.y, Math.PI / 180 * j, this.bulletParams, this.bulletList);

                    this.bulletList.push(bullet);
                    this.parent.addChild(bullet);
                }
            }
        }
    };

    /**
     * Earth bomb class. Creates two protective rings around the player. Instead of travelling straight,
     * the bullets orbit the player. Lasts 10 seconds.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Bomb_Base
     */
    var BHell_Bomb_Earth = my.BHell_Bomb_Earth = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Bomb_Earth.prototype = Object.create(BHell_Bomb_Base.prototype);
    BHell_Bomb_Earth.prototype.constructor = BHell_Bomb_Earth;

    BHell_Bomb_Earth.prototype.initialize = function (parent, params, bulletList) {
        BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);

        this.bullets = [];
    };

    /**
     * Activates the bomb. Creates 50 bullets rotating (the default behaviour is overridden) counterclockwise at 200 pixels
     * from the player and 25 rotating clockwise at 100 pixels from the player. Bullets are stored in an internal array
     * for deactivation's sake.
     * @param x X activation coordinate.
     * @param y Y activation coordinate.
     */
    BHell_Bomb_Earth.prototype.activate = function (x, y) {
        BHell_Bomb_Base.prototype.activate.call(this, x, y);

        var j;
        var bullet;

        for (j = 0; j < 50; j++) {
            bullet = new my.BHell_Bullet(200 * Math.cos(2 * Math.PI / 50 * j) + my.player.x, 200 * Math.sin(2 * Math.PI / 50 * j) + my.player.y, 2 * Math.PI / 50 * j, this.bulletParams, this.bulletList);
            bullet.update = function () {
                this.x = 200 * Math.cos(this.angle) + my.player.x;
                this.y = 200 * Math.sin(this.angle) + my.player.y;
                this.angle += 0.1;
                if (this.angle >= Math.PI * 2) {
                    this.angle -= Math.PI * 2;
                }
            };

            this.bullets.push(bullet);
            this.bulletList.push(bullet);
            this.parent.addChild(bullet);
        }

        for (j = 0; j < 25; j++) {
            bullet = new my.BHell_Bullet(100 * Math.cos(2 * Math.PI / 25 * j) + my.player.x, 100 * Math.sin(2 * Math.PI / 25 * j) + my.player.y, 2 * Math.PI / 25 * j, this.bulletParams, this.bulletList);
            bullet.update = function () {
                this.x = 100 * Math.cos(this.angle) + my.player.x;
                this.y = 100 * Math.sin(this.angle) + my.player.y;
                this.angle -= 0.1;
                if (this.angle <= 0) {
                    this.angle += Math.PI * 2;
                }
            };

            this.bullets.push(bullet);
            this.bulletList.push(bullet);
            this.parent.addChild(bullet);
        }
    };

    /**
     * Updates the bomb. After 10 seconds it's deactivated.
     */
    BHell_Bomb_Earth.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i > 600) {
                this.deactivate();
            }
        }
    };

    /**
     * Deactivates the bomb. Destroyes every bullet left orbiting the player.
     */
    BHell_Bomb_Earth.prototype.deactivate = function () {
        BHell_Bomb_Base.prototype.deactivate.call(this);
        while (this.bullets.length > 0) {
            var bullet = this.bullets.pop();
            bullet.destroy();
        }

    };

    /**
     * Ice bomb class. Creates a 25 pointed star of bullets centered at the activation point. Lasts 5 seconds.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Bomb_Base
     */
    var BHell_Bomb_Ice = my.BHell_Bomb_Ice = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Bomb_Ice.prototype = Object.create(BHell_Bomb_Base.prototype);
    BHell_Bomb_Ice.prototype.constructor = BHell_Bomb_Ice;

    BHell_Bomb_Ice.prototype.initialize = function (parent, params, bulletList) {
        BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);
    };

    /**
     * Updates the bomb. Creates 25 bullets radially every 5 frames.
     */
    BHell_Bomb_Ice.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i > 300) {
                this.deactivate();
            }
            else if (this.i % 5 === 0) {
                for (var j = 0; j < 25; j++) {
                    var bullet = new my.BHell_Bullet(this.x, this.y, 2 * Math.PI / 25 * j, this.bulletParams, this.bulletList);

                    this.bulletList.push(bullet);
                    this.parent.addChild(bullet);
                }
            }
        }
    };

    return my;
}(BHell || {}));