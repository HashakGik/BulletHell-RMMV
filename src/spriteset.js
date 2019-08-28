var BHell = (function (my) {

/**
 * Spriteset class. Stores and updates every non-HUD related sprite. A slight modification of Spriteset_Map.
 * @constructor
 * @memberOf BHell
 */
var BHell_Spriteset = my.BHell_Spriteset = function() {
    this.initialize.apply(this, arguments);
};

BHell_Spriteset.prototype = Object.create(Spriteset_Base.prototype);
BHell_Spriteset.prototype.constructor = BHell_Spriteset;

BHell_Spriteset.prototype.initialize = function () {
    Spriteset_Base.prototype.initialize.call(this);
};

BHell_Spriteset.prototype.createLowerLayer = function () {
    Spriteset_Base.prototype.createLowerLayer.call(this);
    this.createParallax();
    this.createTilemap();
};

/**
 * If the game is not paused, updates all its children and the screen.
 * Since the implementation of Sprite.update was unsuitable, the base classes' behaviour is rewritten.
 */
BHell_Spriteset.prototype.update = function () {
    if (my.controller != null && !my.controller.paused && !$gameMessage.isBusy()) {
        // Reimplementation of Sprite.update(), since the forEach wouldn't work.
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            var prevChild = child;
            if (child.update) {
                child.update();
                if (prevChild !== this.children[i]) {
                    i--;
                }
            }
        }

        this.updateScreenSprites();
        this.updateToneChanger();
        this.updatePosition();

        this.updateTileset();
        this.updateParallax();
        this.updateTilemap();
    }
};

BHell_Spriteset.prototype.createParallax = function () {
    this._parallax = new TilingSprite();
    this._parallax.move(0, 0, Graphics.width, Graphics.height);
    this._baseSprite.addChild(this._parallax);
};

BHell_Spriteset.prototype.createTilemap = function () {
    this._tilemap = new Tilemap();
    this._tilemap.tileWidth = my.stage.tileWidth();
    this._tilemap.tileHeight = my.stage.tileHeight();
    this._tilemap.setData(my.stage.width(), my.stage.height(), my.stage.data());
    this._tilemap.horizontalWrap = my.stage.isLoopHorizontal();
    this._tilemap.verticalWrap = my.stage.isLoopVertical();
    this.loadTileset();
    this._baseSprite.addChild(this._tilemap);
};

BHell_Spriteset.prototype.loadTileset = function () {
    this._tileset = my.stage.tileset();
    if (this._tileset) {
        var tilesetNames = this._tileset.tilesetNames;
        for (var i = 0; i < tilesetNames.length; i++) {
            this._tilemap.bitmaps[i] = ImageManager.loadTileset(tilesetNames[i]);
        }
        this._tilemap.flags = my.stage.tilesetFlags();
        this._tilemap.refresh();
    }
};

BHell_Spriteset.prototype.updateTileset = function () {
    if (this._tileset !== my.stage.tileset()) {
        this.loadTileset();
    }
};

BHell_Spriteset.prototype.updateParallax = function () {
    if (this._parallaxName !== my.stage.parallaxName()) {
        this._parallaxName = my.stage.parallaxName();
        this._parallax.bitmap = ImageManager.loadParallax(this._parallaxName);
    }
    if (this._parallax.bitmap) {
        this._parallax.origin.x = my.stage.parallaxOx();
        this._parallax.origin.y = my.stage.parallaxOy();
    }
};

BHell_Spriteset.prototype.updateTilemap = function () {
    this._tilemap.origin.x = my.stage.displayX() * my.stage.tileWidth();
    this._tilemap.origin.y = my.stage.displayY() * my.stage.tileHeight();
};

return my;
} (BHell || {}));