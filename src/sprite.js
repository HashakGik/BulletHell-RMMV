/**
 * @namespace BHell
 */
var BHell = (function (my) {

/**
 * Sprite class for the bullet hell engine. Similar to a character sprite.
 * @constructor
 * @memberOf BHell
 */
var BHell_Sprite = my.BHell_Sprite = function() {
    this.initialize.apply(this, arguments);
};

BHell_Sprite.prototype = Object.create(Sprite_Base.prototype);
BHell_Sprite.prototype.constructor = BHell_Sprite;

/**
 * Constructor. Centers the coordinates to the sprite's center.
 * @param sprite Charset image.
 * @param index Charset index, ignored if the charset is "Big" (filename starting with a $).
 * @param direction Charset direction (uses RPG Maker's 2-4-6-8 convention).
 * @param frame Initial frame index (0-2).
 * @param animated If true animates the sprite by cycling the frames in the order 0-1-2-1.
 * @param animationSpeed Number of updates required for frame change.
 */
BHell_Sprite.prototype.initialize = function (sprite, index, direction, frame, animated, animationSpeed) {
    Sprite_Base.prototype.initialize.call(this);

    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.z = 10;
    this.characterIndex = index;
    this.direction = direction;
    this.animated = animated;
    this.animationSpeed = animationSpeed;
    this.animationAscending = true;
    this.frame = frame;
    this.i = 0;
    if (sprite != null) {
        this._bitmap = ImageManager.loadCharacter(sprite);
        this._isBigCharacter = ImageManager.isBigCharacter(sprite);
        this.updateCharacterFrame();
    }
    else
        this._bitmap = new Bitmap(1, 1);
};

/**
 * Updates the sprite on screen. Changes the displayed frame every this.animationSpeed calls.
 */
BHell_Sprite.prototype.update = function () {
    Sprite_Base.prototype.update.call(this);

    if (ImageManager.isReady()) {
        this.visible = true;
    }

    if (this.animationSpeed > 0) {
        this.i = (this.i + 1) % this.animationSpeed;
        if (this.i === 0 && this.animated === true) {
            if (this.animationAscending) {
                this.frame = (this.frame + 1) % 3;
                this.animationAscending = this.frame !== 2;
            }
            else {
                this.frame = (this.frame + 2) % 3;
                this.animationAscending = this.frame === 0;
            }
            this.updateCharacterFrame();
        }
    }
};

/**
 * Updates the charset frame, calculating the correct offsets.
 */
BHell_Sprite.prototype.updateCharacterFrame = function() {
    var pw = this.patternWidth();
    var ph = this.patternHeight();
    var sx = (this.characterBlockX() + this.characterPatternX()) * pw;
    var sy = (this.characterBlockY() + this.characterPatternY()) * ph;
    this.setFrame(sx, sy, pw, ph);
};

BHell_Sprite.prototype.characterBlockX = function() {
    if (this._isBigCharacter) {
        return 0;
    } else {
        return this.characterIndex % 4 * 3;
    }
};

BHell_Sprite.prototype.characterBlockY = function() {
    if (this._isBigCharacter) {
        return 0;
    } else {
        return Math.floor(this.characterIndex / 4) * 4;
    }
};

BHell_Sprite.prototype.characterPatternX = function() {
    return this.frame;
};

BHell_Sprite.prototype.characterPatternY = function() {
    return (this.direction - 2) / 2;
};

BHell_Sprite.prototype.patternWidth = function() {
    if (this._isBigCharacter) {
        return this.bitmap.width / 3;
    } else {
        return this.bitmap.width / 12;
    }
};

BHell_Sprite.prototype.patternHeight = function() {
    if (this._isBigCharacter) {
        return this.bitmap.height / 4;
    } else {
        return this.bitmap.height / 8;
    }
};

return my;
} (BHell || {}));