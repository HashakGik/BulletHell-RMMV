var BHell = (function (my) {

/**
 * Explosion class. It shows an animation moving vertically, then disappears.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Sprite
 */
var BHell_Explosion = my.BHell_Explosion = function() {
    this.initialize.apply(this, arguments);
};

BHell_Explosion.prototype = Object.create(my.BHell_Sprite.prototype);
BHell_Explosion.prototype.constructor = BHell_Explosion;

/**
 * Constructor. Creates the sprite and initialises the speed (which is handled by the controller) to 0.
 * @param x X coordinate.
 * @param y Y coordinate.
 * @param parent Container for the sprite.
 * @param explosionList Array in which this explosion is contained.
 */
BHell_Explosion.prototype.initialize = function (x, y, parent, explosionList) {
    var sprite = my.defaultExplosion;
    var index = 0;
    var direction = 2;
    var frame = 0;

    my.BHell_Sprite.prototype.initialize.call(this, sprite, index, direction, frame, true, 15);

    this.anchor.x = 0.5;
    this.anchor.y = 0.5;

    this.x = x;
    this.y = y;
    this.z = 10;

    this.speed = 0;

    this.j = 0;

    this.explosionList = explosionList;
    this.parent = parent;


    this.parent.addChild(this);
};

/**
 * Updates the explosion's sprite and position. After 45 frames, it destroys it.
 * @returns {boolean}
 */
BHell_Explosion.prototype.update = function () {
    my.BHell_Sprite.prototype.update.call(this);

    var ret = false;

    this.y += this.speed;

    this.j++;

    if (this.j === 45) {
        this.destroy();
        ret = true;
    }
    return ret;
};

/**
 * Removes the explosion from the screen and its container.
 */
BHell_Explosion.prototype.destroy = function() {
    if (this.parent != null) {
        this.parent.removeChild(this);
    }

    this.explosionList.splice(this.explosionList.indexOf(this), 1);
};

return my;
} (BHell || {}));