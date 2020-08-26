//=============================================================================
// rammer.js
//=============================================================================

/*:
@plugindesc Example of extension for the Bullet Hell plugin. It defines a new enemy.
@author Hash'ak'Gik

*/

var BHell = (function (my) {

    var BHell_Enemy_Rammer = my.BHell_Enemy_Rammer = function() {
        this.initialize.apply(this, arguments);
    };

    BHell_Enemy_Rammer.prototype = Object.create(my.BHell_Enemy_Burster.prototype);
    BHell_Enemy_Rammer.prototype.constructor = BHell_Enemy_Rammer;

    BHell_Enemy_Rammer.prototype.initialize = function(x, y, image, params, parent, enemyList) {
        my.BHell_Enemy_Burster.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

        this.dyingSe = params.dying_se;

        // Aim the burst towards the player.
        this.emitters[0].angle = Math.atan2(my.player.y - this.y, my.player.x - this.x);

        // Replace the mover.
        this.mover = new my.BHell_Mover_Point(this.x, this.y);
    };

    BHell_Enemy_Rammer.prototype.die = function () {
        my.BHell_Enemy_Burster.prototype.die.call(this);

        if (this.dyingSe !== null) {
            AudioManager.playSe({name: this.dyingSe, volume: 100, pitch: 100, pan: 0});
        }
    };

    return my;
} (BHell || {}));