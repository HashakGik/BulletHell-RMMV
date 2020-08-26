//=============================================================================
// teleport.js
//=============================================================================

/*:
@plugindesc Example of extension for the Bullet Hell plugin. It defines a new mover which teleports an enemy on top of the player.
@author Hash'ak'Gik

*/

/**
 * @namespace BHell
 */
var BHell = (function (my) {

    var BHell_Mover_Teleport = my.BHell_Mover_Teleport = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Mover_Teleport.prototype = Object.create(my.BHell_Mover_Base.prototype);
    BHell_Mover_Teleport.prototype.constructor = BHell_Mover_Teleport;

    BHell_Mover_Teleport.prototype.initialize = function (x, y, delay) {
        my.BHell_Mover_Base.prototype.initialize.call(this);

        this.initX = x;
        this.initY = y;
        this.delay = delay;
        this.inPosition = false;
        this.i = 0;
    };

    BHell_Mover_Teleport.prototype.move = function (oldX, oldY, speed) {
        var ret = [];
        if (this.inPosition) {
            if (this.i === 0) {
                this.destX = my.player.x;
                this.destY = my.player.y;

                ret.push(oldX);
                ret.push(oldY);
            }
            else if (this.i === this.delay - 1) {
                ret.push(this.destX);
                ret.push(this.destY);
            }
            else {
                ret.push(oldX);
                ret.push(oldY);
            }

            this.i = (this.i + 1) % this.delay;
        }
        else {
            var dx = this.initX - oldX;
            var dy = this.initY - oldY;

            if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) {
                this.inPosition = true;
                ret.push(this.initX);
                ret.push(this.initY);
            }
            else {
                var angle = Math.atan2(dy, dx);
                ret.push(oldX + Math.cos(angle) * speed);
                ret.push(oldY + Math.sin(angle) * speed);
            }
        }

        return ret;
    };

    return my;
}(BHell || {}));