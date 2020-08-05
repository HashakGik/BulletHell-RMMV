var BHell = (function (my) {

    var _Emitter_Factory_Create = my.BHell_Emitter_Factory.create;
    my.BHell_Emitter_Factory.create = function (emitter, x, y, w, h, params, parent, bulletList) {
        var ret = _Emitter_Factory_Create.call(this, emitter, x, y, w, h, params, parent, bulletList);

        if (ret == null && emitter.type === "probe") {
            params.speed = my.parse(emitter.params.speed, x, y, w, h, Graphics.width, Graphics.height);
            params.radius = my.parse(emitter.params.radius, x, y, w, h, Graphics.width, Graphics.height);
            params.shootingFrames = my.parse(emitter.params.shooting_frames, x, y, w, h, Graphics.width, Graphics.height);
            ret = new my.BHell_Emitter_Probe(x, y, params, parent, bulletList);
        }

        return ret;
    };

    var BHell_Emitter_Probe = my.BHell_Emitter_Probe = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Emitter_Probe.prototype = Object.create(my.BHell_Emitter_Base.prototype);
    BHell_Emitter_Probe.prototype.constructor = BHell_Emitter_Probe;


    BHell_Emitter_Probe.prototype.initialize = function (x, y, params, parent, bulletList) {
        my.BHell_Emitter_Base.prototype.initialize.call(this, x, y, params, parent, bulletList);
        this.radius = 20;
        this.speed = 5;
        this.shootingFrames = 60;

        if (params != null) {
            this.radius = params.radius || this.radius;
            this.speed = params.speed || this.speed;
            this.shootingFrames = params.shootingFrames || this.shootingFrames;
        }

        if (my.player) {
            this.x = my.player.x + this.offsetX;
            this.y = my.player.y + this.offsetY;
        }
        else {
            this.x = 0;
            this.y = 0;
        }

        this.destX = this.x;
        this.destY = this.y;
        this.stopped = false;
        this.k = 0;
    };

    BHell_Emitter_Probe.prototype.update = function () {
        my.BHell_Sprite.prototype.update.call(this);

        if (this.stopped) {
            if (this.shooting === true) {
                if (this.j === 0) {
                    this.shoot();
                }
                this.j = (this.j + 1) % this.period;
            }

            this.oldShooting = this.shooting;

            this.k = (this.k + 1) % this.shootingFrames;
            if (this.k === 0) {
                this.stopped = false;
            }
        }
    };

    BHell_Emitter_Probe.prototype.move = function (x, y) {

        if (my.player.justSpawned) {
            this.x = my.player.x + this.offsetX;
            this.y = my.player.y + this.offsetY;
            this.destX = my.player.x + this.offsetX;
            this.destY = my.player.y + this.offsetY;
        }

        if (!this.stopped) {
            var dx = this.destX - this.x;
            var dy = this.destY - this.y;

            if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
                var phi = Math.random() * 2 * Math.PI;
                var r = Math.random() * this.radius;

                this.destX = x + Math.round(Math.cos(phi) * r) + this.offsetX;
                this.destY = y + Math.round(Math.sin(phi) * r) + this.offsetY;
                this.stopped = true;
            }
            else {
                var angle = Math.atan2(dy, dx);

                if (dx > 0) {
                    this.x += Math.cos(angle) * Math.min(dx, this.speed);
                }
                else if (dx < 0) {
                    this.x += Math.cos(angle) * Math.max(dx, this.speed);
                }

                if (dy > 0) {
                    this.y += Math.sin(angle) * Math.min(dy, this.speed);
                }
                else if (dy < 0) {
                    this.y += Math.sin(angle) * Math.max(dy, this.speed);
                }
            }
        }
    };

    BHell_Emitter_Probe.prototype.shoot = function () {
        if (this.stopped) {
            if (my.controller != null && my.controller.enemies != null) {
                for (var l = 0; l < my.controller.enemies.length; l++) {
                    var enemy = my.controller.enemies[l];
                    var angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                    var bullet = new my.BHell_Bullet(this.x, this.y, angle, this.bulletParams, this.bulletList);

                    this.parent.addChild(bullet);
                    this.bulletList.push(bullet);
                }
            }
            else {
                var angle = Math.random() * 2 * Math.PI;
                var bullet = new my.BHell_Bullet(this.x, this.y, angle, this.bulletParams, this.bulletList);

                this.parent.addChild(bullet);
                this.bulletList.push(bullet);
            }
        }
    };

    return my;
}(BHell || {}));