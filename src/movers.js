var BHell = (function (my) {

    /**
     * Mover base class. Handles complex movements for other objects (mostly enemies).
     * @constructor
     * @memberOf BHell
     */
    var BHell_Mover_Base = my.BHell_Mover_Base = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Mover_Base.prototype = Object.create(Object.prototype);
    BHell_Mover_Base.prototype.constructor = BHell_Mover_Base;

    /**
     * Mover_Base constructor.
     */
    BHell_Mover_Base.prototype.initialize = function () {
    };

    /**
     * Determines the new coordinates of the owner. The base class simply moves downwards.
     * @param oldX Old x coordinate.
     * @param oldY Old y coordinate.
     * @param speed Movement speed (in pixels per frame).
     * @returns {Array} New coordinates ret[0]: x axis, ret[1]: y axis.
     */
    BHell_Mover_Base.prototype.move = function (oldX, oldY, speed) {
        var ret = [];
        ret.push(oldX);
        ret.push(oldY + speed);
        return ret;
    };

    /**
     * Chase movement class. Constantly follows the player.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Mover_Base
     */
    var BHell_Mover_Chase = my.BHell_Mover_Chase = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Mover_Chase.prototype = Object.create(BHell_Mover_Base.prototype);
    BHell_Mover_Chase.prototype.constructor = BHell_Mover_Chase;

    BHell_Mover_Chase.prototype.initialize = function () {
        BHell_Mover_Base.prototype.initialize.call(this);
    };

    /**
     * Chases the player at the given speed.
     * @param oldX
     * @param oldY
     * @param speed
     * @returns {Array}
     */
    BHell_Mover_Chase.prototype.move = function (oldX, oldY, speed) {
        var ret = [];

        if (my.player.justSpawned === false) {
            var dx = my.player.x - oldX;
            var dy = my.player.y - oldY;

            var angle = Math.atan2(dy, dx);

            ret.push(oldX + Math.cos(angle) * speed);
            ret.push(oldY + Math.sin(angle) * speed);
        }
        else {
            ret.push(oldX);
            ret.push(oldY);
        }

        return ret;
    };

    /**
     * Point movement class. Points in the player's general direction, then proceeds straight (even if the player moves away).
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Mover_Base
     */
    var BHell_Mover_Point = my.BHell_Mover_Point = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Mover_Point.prototype = Object.create(BHell_Mover_Base.prototype);
    BHell_Mover_Point.prototype.constructor = BHell_Mover_Point;

    /**
     * Initializes the movement's angle.
     * @param x Initial x coordinate.
     * @param y Initial y coordinate.
     */
    BHell_Mover_Point.prototype.initialize = function (x, y) {
        BHell_Mover_Base.prototype.initialize.call(this);
        var dx = my.player.x - x;
        var dy = my.player.y - y;
        this.angle = Math.atan2(dy, dx);
    };

    /**
     * Moves in a straight line, with the angle determined during initialisation.
     * @param oldX
     * @param oldY
     * @param speed
     * @returns {Array}
     */
    BHell_Mover_Point.prototype.move = function (oldX, oldY, speed) {
        var ret = [];

        ret.push(oldX + Math.cos(this.angle) * speed);
        ret.push(oldY + Math.sin(this.angle) * speed);
        return ret;
    };

    /**
     * Harmonic movement class. Moves in a straight line until a starting position is reached, then follows an harmonic
     * trajectory in the form:
     *
     * x(t) = A * cos(phi * t + alpha);
     *
     * y(t) = B * cos(theta * t + beta);
     *
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Mover_Base
     */
    var BHell_Mover_Harmonic = my.BHell_Mover_Harmonic = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Mover_Harmonic.prototype = Object.create(BHell_Mover_Base.prototype);
    BHell_Mover_Harmonic.prototype.constructor = BHell_Mover_Harmonic;

    /**
     * Constructor
     * @param x X coordinate of the movement's center.
     * @param y Y coordinate of the movement's center.
     * @param a Amplitude of the horizontal axis.
     * @param b Amplitude of the vertical axis.
     * @param phi Angular speed of the horizontal axis.
     * @param theta Angular speed of the vertical axis.
     * @param alpha Phase of the horizontal axis.
     * @param beta Phase of the vertical axis.
     */
    BHell_Mover_Harmonic.prototype.initialize = function (x, y, a, b, phi, theta, alpha, beta) {
        BHell_Mover_Base.prototype.initialize.call(this);

        this.inPosition = false;
        this.offX = x;
        this.offY = y;
        this.a = a;
        this.b = b;
        this.phi = phi;
        this.theta = theta;
        this.alpha = alpha;
        this.beta = beta;
        this.t = 0;
    };

    /**
     * Moves in a straight line until the starting position is reached, then follows the harmonic function defined.
     * @param oldX Old x coordinate.
     * @param oldY Old y coordinate.
     * @param speed Movement speed. In pixels per frame during the linear trajectory, in degrees per frame afterwards.
     * @returns {Array}
     */
    BHell_Mover_Harmonic.prototype.move = function (oldX, oldY, speed) {
        var ret = [];

        if (this.inPosition) {
            ret.push(oldX + this.a * Math.cos(this.alpha + this.t * this.phi));
            ret.push(oldY + this.b * Math.sin(this.beta + this.t * this.theta));
            this.t += speed * Math.PI / 360;
        }
        else {
            var dx = (this.a * Math.cos(this.alpha) + this.offX) - oldX;
            var dy = (this.b * Math.sin(this.beta) + this.offY) - oldY;
            if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) { // If the error is less than two pixels
                this.inPosition = true;
                ret.push(this.offX);
                ret.push(this.offY);
            }
            else {
                var angle = Math.atan2(dy, dx);
                ret.push(oldX + Math.cos(angle) * speed);
                ret.push(oldY + Math.sin(angle) * speed);
            }
        }
        return ret;
    };

    /**
     * Orbit movement class. Moves towards the player up to a given distance, then starts orbiting around it.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Mover_Base
     */
    var BHell_Mover_Orbit = my.BHell_Mover_Orbit = function () {
        this.initialize.apply(this, arguments);
    };
    BHell_Mover_Orbit.prototype = Object.create(BHell_Mover_Base.prototype);
    BHell_Mover_Orbit.prototype.constructor = BHell_Mover_Orbit;

    /**
     * Constructor.
     * @param radius Orbit distance from the player.
     */
    BHell_Mover_Orbit.prototype.initialize = function (radius) {
        BHell_Mover_Base.prototype.initialize.call(this);

        this.inPosition = false;
        this.radius = radius;
        this.t = 3 * Math.PI / 2;
    };

    /**
     * If the player is not ready yet (e.g. it's just been resurrected) remains still, otherwise chases the player until the set
     * radius is reached, then starts orbiting.
     * @param oldX Old x coordinate.
     * @param oldY Old y coordinate.
     * @param speed Movement speed (pixels per frame during the chase phase, degrees per frame during the orbiting phase).
     * @returns {Array}
     */
    BHell_Mover_Orbit.prototype.move = function (oldX, oldY, speed) {
        var ret = [];

        if (my.player.justSpawned) {
            this.inPosition = false;
            this.t = 3 * Math.PI / 2;
            ret.push(oldX);
            ret.push(oldY);
        }
        else {
            if (this.inPosition) {
                ret.push(my.player.x + this.radius * Math.cos(this.t));
                ret.push(my.player.y + this.radius * Math.sin(this.t));

                this.t += speed * Math.PI / 360;
                if (this.t > 2 * Math.PI) {
                    this.t -= 2 * Math.PI;
                }
            }
            else {
                var dx = my.player.x - oldX;
                var dy = my.player.y - oldY - this.radius;
                if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) { // If the error is less than two pixels
                    this.inPosition = true;
                    ret.push(dx + oldX);
                    ret.push(dy + oldY);
                }
                else {
                    var angle = Math.atan2(dy, dx);
                    ret.push(oldX + Math.cos(angle) * speed);
                    ret.push(oldY + Math.sin(angle) * speed);
                }
            }
        }

        return ret;
    };

    /**
     * Uniform Catmull-Rom spline movement class. Given four points, determines a smooth path which passes between the two innermost ones.
     *
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Mover_Base
     */
    var BHell_Mover_Spline = my.BHell_Mover_Spline = function () {
        this.initialize.apply(this, arguments);
    };
    BHell_Mover_Spline.prototype = Object.create(BHell_Mover_Base.prototype);
    BHell_Mover_Spline.prototype.constructor = BHell_Mover_Spline;

    /**
     * Sets up the four control points. Since the spline is uniform, no further parameters are needed.
     *
     * If P0 == P1 and P2 == P3, the trajectory is a straight line between P1 and P2, otherwise a curved path (passing
     * between P1 and P2) is determined by the relative position of P0 from P1 and P3 from P2 (e.g. if P0 is above-right of
     * P1 and P3 is below-left of P2, the overall trajectory will be an "S").
     * @param p0x X coordinate of the first point.
     * @param p0y Y coordinate of the first point.
     * @param p1x X coordinate of the second point. The movement starts from here.
     * @param p1y Y coordinate of the second point. The movement starts from here.
     * @param p2x X coordinate of the third point. The movement ends here.
     * @param p2y Y coordinate of the third point. The movement ends here.
     * @param p3x X coordinate of the last point.
     * @param p3y Y coordinate of the last point.
     */
    BHell_Mover_Spline.prototype.initialize = function (p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
        BHell_Mover_Base.prototype.initialize.call(this);
        this.t = 1;
        this.p0x = p0x;
        this.p0y = p0y;
        this.p1x = p1x;
        this.p1y = p1y;
        this.p2x = p2x;
        this.p2y = p2y;
        this.p3x = p3x;
        this.p3y = p3y;
    };

    /**
     * Moves along the initialised spline, unless P2 is already reached.
     * @param oldX Old x coordinate.
     * @param oldY Old y coordinate.
     * @param speed Movement speed (in thousandths of distance between P1 and P2 per frame).
     * @returns {Array}
     */
    BHell_Mover_Spline.prototype.move = function (oldX, oldY, speed) {
        var ret = [];

        if (this.t >= 2) {
            ret.push(oldX);
            ret.push(oldY);
        } else {
            var a1x = (1 - this.t) * this.p0x + this.t * this.p1x;
            var a2x = (2 - this.t) * this.p1x + (this.t - 1) * this.p2x;
            var a3x = (3 - this.t) * this.p2x + (this.t - 2) * this.p3x;
            var b1x = (2 - this.t) * a1x / 2 + this.t * a2x / 2;
            var b2x = (3 - this.t) * a2x / 2 + (this.t - 1) * a3x / 2;
            var a1y = (1 - this.t) * this.p0y + this.t * this.p1y;
            var a2y = (2 - this.t) * this.p1y + (this.t - 1) * this.p2y;
            var a3y = (3 - this.t) * this.p2y + (this.t - 2) * this.p3y;
            var b1y = (2 - this.t) * a1y / 2 + this.t * a2y / 2;
            var b2y = (3 - this.t) * a2y / 2 + (this.t - 1) * a3y / 2;
            var cx = (2 - this.t) * b1x + (this.t - 1) * b2x;
            var cy = (2 - this.t) * b1y + (this.t - 1) * b2y;

            ret.push(cx);
            ret.push(cy);

            this.t += speed / 1000;
        }

        return ret;
    };

    /**
     * Bounce movement class. Moves to the starting position, then moves in a straight line at a given angle,
     * bouncing on the screen's borders.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Mover_Base
     */
    var BHell_Mover_Bounce = my.BHell_Mover_Bounce = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Mover_Bounce.prototype = Object.create(BHell_Mover_Base.prototype);
    BHell_Mover_Bounce.prototype.constructor = BHell_Mover_Bounce;

    /**
     * Constructor
     * @param x X coordinate of the initial position.
     * @param y Y coordinate of the initial position.
     * @param angle Initial angle.
     * @param w Width of the object to move.
     * @param h Height of the object to move.
     */
    BHell_Mover_Bounce.prototype.initialize = function (x, y, angle, w, h) {
        BHell_Mover_Base.prototype.initialize.call(this);

        this.inPosition = false;
        this.initX = x;
        this.initY = y;
        this.signX = +1;
        this.signY = +1;
        this.angle = angle;
        this.w = w;
        this.h = h;
    };

    /**
     * Moves to the starting position, then moves at this.angle, bouncing on the screen's borders.
     * @param oldX Old x coordinate.
     * @param oldY Old y coordinate.
     * @param speed Movement speed. In pixels per frame.
     * @returns {Array}
     */
    BHell_Mover_Bounce.prototype.move = function (oldX, oldY, speed) {
        var ret = [];

        if (this.inPosition) {
            var destX = oldX + Math.cos(this.angle) * speed * this.signX;
            var destY = oldY + Math.sin(this.angle) * speed * this.signY;
            if (destX < this.w / 2) {
                destX = this.w / 2;
                this.signX = -this.signX;
            }
            else if (destX > Graphics.width - this.w / 2) {
                destX = Graphics.width - this.w / 2;
                this.signX = -this.signX;
            }

            if (destY < this.h / 2) {
                destY = this.h / 2;
                this.signY = -this.signY;
            }
            else if (destY > Graphics.height - this.h / 2) {
                destY = Graphics.height - this.h / 2;
                this.signY = -this.signY;
            }

            ret.push(destX);
            ret.push(destY);
        }
        else {
            var dx = this.initX - oldX;
            var dy = this.initY - oldY;
            if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) { // If the error is less than two pixels
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