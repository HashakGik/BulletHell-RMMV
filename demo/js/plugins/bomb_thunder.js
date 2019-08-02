var BHell = (function (my) {

    var BHell_Bomb_Thunder = my.BHell_Bomb_Thunder = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Bomb_Thunder.prototype = Object.create(my.BHell_Bomb_Base.prototype);
    BHell_Bomb_Thunder.prototype.constructor = BHell_Bomb_Thunder;

    BHell_Bomb_Thunder.prototype.initialize = function (parent, params, bulletList) {
        my.BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);

        this.bullets = [];
    };

    BHell_Bomb_Thunder.prototype.activate = function (x, y) {
        my.BHell_Bomb_Base.prototype.activate.call(this, x, y);

        var j;
        var bullet;

        for (j = 0; j < 200; j++) {
            bullet = new my.BHell_Bullet(my.player.x, my.player.y, 0, this.bulletParams, this.bulletList);

            // Create new properties for the bullet
            bullet.destX = my.player.x;
            bullet.destY = my.player.y;

            bullet.update = function () {
                var dx = this.destX - this.x;
                var dy = this.destY - this.y;

                if (Math.abs(dx) < this.speed && Math.abs(dy) < this.speed) {
                    this.destX = Math.round(Math.random() * Graphics.width);
                    this.destY = Math.round(Math.random() * Graphics.height);
                }
                else {
                    this.angle = Math.atan2(dy, dx);
                }

                my.BHell_Bullet.prototype.update.call(this);
            };

            this.bullets.push(bullet);
            this.bulletList.push(bullet);
            this.parent.addChild(bullet);
        }
    };

    BHell_Bomb_Thunder.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i > 600) {
                this.deactivate();
            }
        }
    };

    BHell_Bomb_Thunder.prototype.deactivate = function () {
        my.BHell_Bomb_Base.prototype.deactivate.call(this);
        while (this.bullets.length > 0) {
            var bullet = this.bullets.pop();
            bullet.destroy();
        }
    };

    return my;
}(BHell || {}));