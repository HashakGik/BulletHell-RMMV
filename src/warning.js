var BHell = (function (my) {

    /**
     * Warning sign class. Creates a warning on screen before each boss encounter and then melts it with a DOOM-like effect.
     * If a SE is specified, it's played as well.
     *
     * @constructor
     * @memberOf BHell
     * @extends Sprite_Base
     */
    var BHell_Warning = my.BHell_Warning = function() {
        this.initialize.apply(this, arguments);
    };

    BHell_Warning.prototype = Object.create(Sprite_Base.prototype);
    BHell_Warning.prototype.constructor = BHell_Warning;

    /**
     * Constructor. Creates the sprite and plays the SE.
     *
     * @param warningImg Picture to display.
     * @param warningDuration Duration of the warning in frames.
     * @param warningSE SE to be played.
     * @param parent Container for the sprite.
     */
    BHell_Warning.prototype.initialize = function (warningImg, warningDuration, warningSE, parent) {
        Sprite_Base.prototype.initialize.call(this);

        this.warning = ImageManager.loadPicture(warningImg, 0);
        this._bitmap = new Bitmap(Graphics.width, Graphics.height);
        this.setFrame(0, 0, Graphics.width, Graphics.height);

        this.x = 0;
        this.y = 0;
        this.z = 100;
        this.opacity = 0;
        this.i = 0;

        this.anchor.x = 0;
        this.anchor.y = 0;

        this.heights = [];
        this.heights.push(-Math.floor(Math.random() * 100));
        for (var i = 1; i < 250; i++) {
            var tmp = Math.floor(Math.random() * 50) - 25 + this.heights[this.heights.length - 1];
            if (tmp > 0) {
                tmp = 0;
            }
            this.heights.push(tmp);
        }

        this.warningDuration = warningDuration;
        if (warningSE !== "") {
            AudioManager.playSe({"name": warningSE, "pan": 0, "pitch": 100, "volume": 90});
        }

        my.displayWarning = true;
        this.parent = parent;
        this.parent.addChild(this);
    };

    /**
     * Updates the warning image. For the first half of the animation it fades in, for the second half it melts down.
     */
    BHell_Warning.prototype.update = function () {
        Sprite_Base.prototype.update.call(this);

        if (ImageManager.isReady()) {
            this.visible = true;

            var w = Math.ceil(this.warning.width / 250);
            var h = this.warning.height;
            var dx = (Graphics.width - this. warning.width) / 2;
            var dy = (Graphics.height - this. warning.height) / 2;


            this._bitmap.clear();

            if (this.i < this.warningDuration / 2) {
                this.opacity += 255 / this.warningDuration * 2;
                this._bitmap.blt(this.warning, 0, 0, this.warning.width, h, dx, dy, this.warning.width, h);
            }
            else {
                this.opacity = 255;
                my.displayWarning = false;
                for (var i = 0; i < 250; i++) {
                    this.heights[i] += Math.floor(this._bitmap.height / this.warningDuration * 2);
                    my.displayWarning |= this.heights[i] <= this._bitmap.height;
                }

                for (var i = 0; i < 250; i++) {
                    var dh = (this.heights[i] < 0) ? 0 : this.heights[i];

                    this._bitmap.blt(this.warning, i * w, 0, w, h, i * w + dx, dh + dy, w, h);
                }
            }
        }

        if (!my.displayWarning) {
            this.destroy();
        }

        this.i++;
    };

    /**
     * Removes the warning from screen.
     */
    BHell_Warning.prototype.destroy = function() {
        if (this.parent != null) {
            this.parent.removeChild(this);
        }

        my.warningSign = null;
    };

    return my;
} (BHell || {}));