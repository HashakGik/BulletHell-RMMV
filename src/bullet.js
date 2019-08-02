/**
 * @namespace BHell
 */
var BHell = (function (my) {

/**
 * Bullet class. Represents a single bullet moving straight on the map.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Sprite
 */
var BHell_Bullet = my.BHell_Bullet = function() {
    this.initialize.apply(this, arguments);
};

BHell_Bullet.prototype = Object.create(my.BHell_Sprite.prototype);
BHell_Bullet.prototype.constructor = BHell_Bullet;

/**
 * Constructor.
 * Parameters:
 *
 * - speed: Moving speed (in pixels per frame),
 * - sprite: Bullet's charset,
 * - index: Charset index,
 * - direction: Charset direction,
 * - frame: Initial charset frame,
 * - animated: If true, the bullet's sprite will be animated,
 * - animation_speed: Number of updates required for frame change.
 *
 * @param x Initial x coordinate.
 * @param y Initial y coordinate.
 * @param angle Moving angle.
 * @param params Parameters object.
 * @param bulletList Array in which this bullet is contained.
 */
BHell_Bullet.prototype.initialize = function (x, y, angle, params, bulletList) {
    var speed = 3;
    var sprite = my.defaultBullet;
    var index = 0;
    var direction = 2;
    var frame = 0;
    var animated = false;
    var animationSpeed = 25;

    if (params != null) {
        speed = params.speed || speed;
        sprite = params.sprite || sprite;
        index = params.index || index;
        direction = params.direction || direction;
        frame = params.frame || frame;
        animated = params.animated || animated;
        animationSpeed = params.animation_speed || animationSpeed;
    }

    my.BHell_Sprite.prototype.initialize.call(this, sprite, index, direction, frame, animated, animationSpeed);

    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.rotation = angle;

    this.x = x;
    this.y = y;
    this.z = 15;
    this.angle = angle;
    this.speed = speed;
    this.bulletList = bulletList;
};

/**
 * Updates the bullet's position. If it leaves the screen, it's destroyed.
 * @returns {boolean} True if the bullet has left the screen, false otherwise.
 */
BHell_Bullet.prototype.update = function () {
    my.BHell_Sprite.prototype.update.call(this);

   var ret = false;

    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    if (this.y < -this.height || this.y > Graphics.height + this.height || this.x < -this.width || this.x > Graphics.width + this.width) {
        this.destroy();
        ret = true;
    }

    return ret;
};

/**
 * Removes the bullet from the screen and from its container.
 */
BHell_Bullet.prototype.destroy = function() {
    if (this.parent != null) {
        this.parent.removeChild(this);
    }
    this.bulletList.splice(this.bulletList.indexOf(this), 1);
};

return my;
} (BHell || {}));