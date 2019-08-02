var BHell = (function (my) {

    var BHell_Bomb_Gravity = my.BHell_Bomb_Gravity = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Bomb_Gravity.prototype = Object.create(my.BHell_Bomb_Base.prototype);
    BHell_Bomb_Gravity.prototype.constructor = BHell_Bomb_Gravity;

    BHell_Bomb_Gravity.prototype.initialize = function (parent, params, bulletList) {
        my.BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);
    };

    BHell_Bomb_Gravity.prototype.activate = function (x, y) {
        my.BHell_Bomb_Base.prototype.activate.call(this, x, y);

        if (my.controller != null && my.controller.enemies != null) {
            my.controller.enemies.forEach(e => {
                // We are using the ceil function to prevent enemies from dying when they have less than two hit points.
                var damage = Math.ceil(e.hp / 2);
                e.hp -= damage;
                if (e.boss) {
                    my.bossHp -= damage;
                }

                my.explosions.push(new my.BHell_Explosion(e.x, e.y, this.parent, my.explosions));
            });
        }

    };


    BHell_Bomb_Gravity.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i > 1200) {
                this.deactivate();
            }
        }
    };


    return my;
}(BHell || {}));