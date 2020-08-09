//=============================================================================
// BulletHell.js
//=============================================================================

/*:
@plugindesc Simple Bullet hell shoot 'em up engine.
@author Hash'ak'Gik

@param config
@desc Configuration file (in data).
@default BulletHell.json

@param resume
@desc Resume string.
@default Resume

@param retry
@desc Retry string.
@default Retry

@param deadzone
@desc Deadzone string.
@default Analog deadzone

@param speed_multiplier
@desc Speed multiplier string for analog sticks.
@default Analog scale

@param quit
@desc Quit string.
@default Quit

@param yes
@desc Yes string.
@default Yes

@param no
@desc No string.
@default No

@param speed
@desc Speed string.
@default Speed

@param rate
@desc Rate of fire string.
@default Rate

@param power
@desc Power string.
@default Power

@param bombs
@desc Bombs string.
@default Bombs

@param buy_players
@desc Buy new players string.
@default Players

@param buy_upgrade
@desc Buy upgrades string.
@default Upgrades

@param init_bgm
@desc BGM played during the player selection.
@default null

@param victory_me
@desc ME played on victory.
@default Victory1

@param bullet
@desc Default bullet sprite.
@default $Bullets

@param explosion
@desc Default explosion sprite.
@default $Explosions

@param grazing_score
@desc Bonus points awarded for grazing (a bullet moves close to the player, but doesn't hit it).
@default 50

@param bullet_timeout
@desc Timeout in frames after which the enemy bullets are destroyed while the player is dead.
@default 300

@param immortal_timeout
@desc Timeout in frames during which the player is immortal after a respawn.
@default 300

@param life_bonus_first
@desc Number of points required for the first life bonus.
@default 30000

@param life_bonus_next
@desc Number of points required for the following life bonuses.
@default 80000

@param DCprice
@desc Money required to buy a D -> C upgrade.
@default 5000

@param CBprice
@desc Money required to buy a C -> B upgrade.
@default 10000

@param BAprice
@desc Money required to buy a B -> A upgrade.
@default 50000

@param ASprice
@desc Money required to buy an A -> S upgrade.
@default 100000

@help
Plugin commands:
- Play a stage:
    Bullethell mapId [retry [quit]]
    For example:
    Bullethell 2: starts a stage on map 2 with retry and quit options enabled,
    Bullethell 5 false: starts a stage on map 5 with retry disabled and quit enabled,
    Bullethell 11 true false: starts a stage on map 11 with retry enabled and quit disabled.
- Lock a player:
    Bullethell lock playerId
    For example:
    Bullethell lock 2: The third player defined on the JSON can no longer be used. Note: at least one player must be enabled, so the plugin will prevent locking a player if there aren't any more left.
- Unlock a player:
    Bullethell unlock playerId
    For example:
    Bullethell unlock 5: The sixth player defined on the JSON can be used.
- Enable a player purchase:
    Bullethell canbuy playerId
    For example:
    Bullethell canbuy 3: The fourth player defined on the JSON can be purchased from now on.
- Disable a player purchase:
    Bullethell cannotbuy playerId
    For example:
    Bullethell canbuy 3: The fourth player defined on the JSON can no longer be bought.

- Open the powerup shop:
    Bullethell shop
*/


/**
 * Stores the stage's results.
 * @typedef $gameBHellResult
 * @type {Object}
 * @property {boolean} won True if the player has won.
 * @property {boolean} gaveUp True if the player gave up.
 * @property {number} retries Number of retries for the current stage.
 * @property {number} score Final score (reset at each retry).
 * @property {number} hitRatio % of bullets hitting a target (reset at each retry).
 * @property {number} enemiesKilled Number of enemies killed (reset at each retry).
 * @property {number} enemiesMissed Number of enemies escaped (reset at each retry).
 * @property {number} enemiesCrashed Number of enemies crashed against the player (reset at each retry).
 * @property {number} livesLost Number of lives lost (cumulated for all retries).
 * @property {number} bombsUsed Number of bombs used (cumulated for all retries).
 */
var $gameBHellResult;

/**
 * Stores the players' settings in $gamePlayer (which is persistently serialised in save files).
 *
 * Note: ranks are stored as letters: D (worst), C, B, A and S (best).
 *
 * @typedef bhellPlayers
 * @type {Array}
 * @property {number} index The player index in the JSON file.
 * @property {boolean} unlocked True if the player can be used.
 * @property {boolean} canBeBought True if the player can be bought at the shop.
 * @property {number} price Shop price for the player.
 * @property {string} speed Current speed rank (how fast the player can move).
 * @property {string} rate Current rate of fire rank (how fast bullets are shot).
 * @property {string} power Current power rank (how strong the emitters are).
 * @property {string} bombs Current bomb rank (how many bombs can be stored).
 */

/**
 * Stores the controller's speed multiplier setting in $gameSystem (which is persistently serialised in save files).
 * When moving the player using a controller, the actual speed will be scaled by this value.
 *
 * @typedef controllerSpeedMultiplier
 * @type {Number}
 */

/**
 * Stores the controller's deadzone setting in $gameSystem (which is persistently serialised in save files).
 *
 * Note: this value is not used outside the Bullet Hell engine and therefore does not interfere with the normal Input
 * class' (rpg_core.js) behaviour.
 *
 * @typedef deadzone
 * @type {Number}
 */

/**
 * @namespace BHell
 */
var BHell = (function (my) {


    var parameters = PluginManager.parameters('BulletHell');
    var BHellJSON = String(parameters['config'] || "BulletHell.json");

    my.initBgm = null;
    if (String(parameters['init_bgm']) !== "null") {
        my.initBgm = {name: String(parameters['init_bgm']), volume: 90, pitch: 100, pan: 0};
    }
    my.victoryMe = null;
    if (String(parameters['victory_me']) !== "null") {
        my.victoryMe = {name: String(parameters['victory_me']), volume: 90, pitch: 100, pan: 0};
    }
    my.defaultBullet = String(parameters['bullet'] || "$Bullets");
    my.defaultExplosion = String(parameters['explosion'] || "$Explosions");

    my.resume = String(parameters['resume'] || "Resume");
    my.retry = String(parameters['retry'] || "Retry");
    my.deadzone = String(parameters['deadzone'] || "Analog deadzone");
    my.speedMul = String(parameters['speed_multiplier'] || "Analog scale");
    my.quit = String(parameters['quit'] || "Quit");
    my.yes = String(parameters['yes'] || "Yes");
    my.no = String(parameters['no'] || "No");
    my.speed = String(parameters['speed'] || "Speed");
    my.rate = String(parameters['rate'] || "Rate");
    my.power = String(parameters['power'] || "Power");
    my.bombs = String(parameters['bombs'] || "Bombs");
    my.buyPlayers = String(parameters['buy_players'] || "Players");
    my.buyUpgrades = String(parameters['buy_upgrades'] || "Upgrades");

    my.grazingScore = Number(parameters['grazing_score'] || 50);
    my.bulletTimeout = Number(parameters['bullet_timeout'] || 300);
    my.immortalTimeout = Number(parameters['immortal_timeout'] || 300);
    my.lifeBonusFirst = Number(parameters['life_bonus_first'] || 30000);
    my.lifeBonusNext = Number(parameters['life_bonus_next'] || 80000);
    my.dcPrice = Number(parameters['DCprice'] || 5000);
    my.cbPrice = Number(parameters['CBprice'] || 10000);
    my.baPrice = Number(parameters['BAprice'] || 50000);
    my.asPrice = Number(parameters['ASprice'] || 100000);


    // Override Scene_Boot.create()
    var _Boot_create = Scene_Boot.prototype.create;
    Scene_Boot.prototype.create = function () {
        DataManager._databaseFiles.push({name: "$dataBulletHell", src: BHellJSON});
        _Boot_create.call(this);
    };

    var _Game_Interpreter_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'Bullethell') {
            // Set the default value for the player's speed multiplier when using a controller.
            $gameSystem.controllerSpeedMultiplier = $gameSystem.controllerSpeedMultiplier || 0.5;

            // Set the default value for the controller's analog deadzone.
            $gameSystem.controllerDeadzone = $gameSystem.controllerDeadzone || 0.25;

            // If the players' settings aren't loaded yet, load them from the JSON.
            $gamePlayer.bhellPlayers = $gamePlayer.bhellPlayers || [];
            for (var i = 0; i < $dataBulletHell.players.length; i++)
            {
                $gamePlayer.bhellPlayers[i] = $gamePlayer.bhellPlayers[i] || {};
                $gamePlayer.bhellPlayers[i].index = i;
                if ($gamePlayer.bhellPlayers[i].unlocked === undefined) {
                    $gamePlayer.bhellPlayers[i].unlocked = $gamePlayer.bhellPlayers[i].unlocked || $dataBulletHell.players[i].unlocked || false;
                }
                if ($gamePlayer.bhellPlayers[i].canBeBought !== false) {
                    $gamePlayer.bhellPlayers[i].canBeBought = $gamePlayer.bhellPlayers[i].canBeBought || $dataBulletHell.players[i].can_be_bought;
                }
                $gamePlayer.bhellPlayers[i].price = $gamePlayer.bhellPlayers[i].price || $dataBulletHell.players[i].price || 50000;
                $gamePlayer.bhellPlayers[i].speed = $gamePlayer.bhellPlayers[i].speed || $dataBulletHell.players[i].speed || 1;
                $gamePlayer.bhellPlayers[i].rate = $gamePlayer.bhellPlayers[i].rate || $dataBulletHell.players[i].rate || 1;
                $gamePlayer.bhellPlayers[i].power = $gamePlayer.bhellPlayers[i].power || $dataBulletHell.players[i].power || 1;
                $gamePlayer.bhellPlayers[i].bombs = $gamePlayer.bhellPlayers[i].bombs || $dataBulletHell.players[i].bombs || 1;
            }

            switch (args[0]) {
                case "lock":
                    if ($gamePlayer.bhellPlayers.filter(p => {
                        return p.unlocked === true;
                    }).length > 1) {
                        if (Number(args[1]) >= 0 && Number(args[1]) < $gamePlayer.bhellPlayers.length) {
                            $gamePlayer.bhellPlayers[Number(args[1])].unlocked = false;
                        }
                    }
                    break;
                case "unlock":
                    if (Number(args[1]) >= 0 && Number(args[1]) < $gamePlayer.bhellPlayers.length) {
                        $gamePlayer.bhellPlayers[Number(args[1])].unlocked = true;
                    }
                    break;
                case "canbuy":
                    if (Number(args[1]) >= 0 && Number(args[1]) < $gamePlayer.bhellPlayers.length) {
                        $gamePlayer.bhellPlayers[Number(args[1])].canBeBought = true;
                    }
                    break;
                case "cannotbuy":
                    if (Number(args[1]) >= 0 && Number(args[1]) < $gamePlayer.bhellPlayers.length) {
                        $gamePlayer.bhellPlayers[Number(args[1])].canBeBought = false;
                    }
                    break;
                case "shop":
                    $gameBHellResult = {};
                    $gameBHellResult.retries = 0;
                    $gameBHellResult.livesLost = 0;
                    $gameBHellResult.bombsUsed = 0;
                    $gameBHellResult.hitRatio = 0;
                    $gameBHellResult.enemiesKilled = 0;
                    $gameBHellResult.enemiesMissed = 0;
                    $gameBHellResult.enemiesCrashed = 0;
                    $gameBHellResult.score = 0;
                    $gameBHellResult.gaveUp = false;
                    $gameBHellResult.won = false;

                    SceneManager.push(my.Scene_BHell_Shop);
                    break;
                default:
                    if (Number(args[0]) >= 0) {
                        {
                            $gameBHellResult = {};
                            $gameBHellResult.retries = 0;
                            $gameBHellResult.livesLost = 0;
                            $gameBHellResult.bombsUsed = 0;
                            $gameBHellResult.hitRatio = 0;
                            $gameBHellResult.enemiesKilled = 0;
                            $gameBHellResult.enemiesMissed = 0;
                            $gameBHellResult.enemiesCrashed = 0;
                            $gameBHellResult.score = 0;
                            $gameBHellResult.gaveUp = false;
                            $gameBHellResult.won = false;

                            my.map = Number(args[0]);
                            my.canRetry = true;
                            my.canQuit = true;

                            if (args[1] != null) {
                                my.canRetry = args[1] !== "false";
                            }
                            if (args[2] != null) {
                                my.canQuit = args[2] !== "false";
                            }
                            SceneManager.push(my.Scene_BHell_Init);
                        }
                        break;
                    }
            }
        }
    };

    // Rewrite Input._updateGamepadState to include axes informations and whether the last input came from a gamepad or the keyboard.
    Input._updateGamepadState = function(gamepad) {
        var lastState = this._gamepadStates[gamepad.index] || [];
        var newState = [];
        var buttons = gamepad.buttons;
        var axes = gamepad.axes;
        var threshold = 0.5;
        newState[12] = false;
        newState[13] = false;
        newState[14] = false;
        newState[15] = false;
        for (var i = 0; i < buttons.length; i++) {
            newState[i] = buttons[i].pressed;
        }
        if (axes[1] < -threshold) {
            newState[12] = true;    // up
        } else if (axes[1] > threshold) {
            newState[13] = true;    // down
        }
        if (axes[0] < -threshold) {
            newState[14] = true;    // left
        } else if (axes[0] > threshold) {
            newState[15] = true;    // right
        }
        for (var j = 0; j < newState.length; j++) {
            if (newState[j] !== lastState[j]) {
                var buttonName = this.gamepadMapper[j];
                if (buttonName) {
                    this._currentState[buttonName] = newState[j];
                }
            }
        }
        this._gamepadStates[gamepad.index] = newState;
        this._axes = gamepad.axes;

        this._lastInputIsGamepad = newState.filter(b => {return b === true;}).length > 0;
    };

    // Rewrite Input._onKeyDown to include whether the last input came from a gamepad or the keyboard.
    Input._onKeyDown = function(event) {
        if (this._shouldPreventDefault(event.keyCode)) {
            event.preventDefault();
        }
        if (event.keyCode === 144) {    // Numlock
            this.clear();
        }
        var buttonName = this.keyMapper[event.keyCode];
        if (ResourceHandler.exists() && buttonName === 'ok') {
            ResourceHandler.retry();
        } else if (buttonName) {
            this._currentState[buttonName] = true;
        }
        this._lastInputIsGamepad = false;
    };

    // Checks where the last input came from.
    Input.isLastInputGamepad = function() {
        return !!this._lastInputIsGamepad;
    };

    // Returns the value for a given axis. If the value is below the deadzone it returns 0.
    Input.readAxis = function(axis, deadzone = 0.20) {
        var ret = 0;
        if (this._axes && Math.abs(this._axes[axis]) >= deadzone) {
            ret = this._axes[axis];
        }
        return ret;
    };

    var _ti_onTouchMove = TouchInput._onTouchMove;
    TouchInput._onTouchMove = function(event) {
        var oldX = this._x;
        var oldY = this._y;
        _ti_onTouchMove.call(this, event);

        this._dx = this._x - oldX;
        this._dy = this._y - oldY;
    };

    TouchInput.isLastInputTouch = function() {
        return this._screenPressed;
    };

    Object.defineProperty(TouchInput, 'dx', {
        get: function() {
            return this._dx;
        },
        configurable: true
    });

    Object.defineProperty(TouchInput, 'dy', {
        get: function() {
            return this._dy;
        },
        configurable: true
    });

    return my;
}(BHell || {}));

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

var BHell = (function (my) {

    /**
     * Bomb base class. It simply deletes every enemy bullet on screen.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Sprite
     */
    var BHell_Bomb_Base = my.BHell_Bomb_Base = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Bomb_Base.prototype = Object.create(Object.prototype);
    BHell_Bomb_Base.prototype.constructor = BHell_Bomb_Base;

    /**
     * Constructor.
     *
     * Parameters:
     *
     * - sprite: The bullets' charset file,
     * - index: The bullets' charset index,
     * - direction: The bullets' charset direction,
     * - frame: The bullets' charset frame,
     * - icon: The bomb's iconset,
     * - icon_index: The bomb's icon index,
     * - se: The sound effect to be played when launching a bomb.
     *
     * @param parent Container for the derived classes' effects.
     * @param params Bomb parameters.
     * @param bulletList Array in which the spawned bullets will be stored.
     */
    BHell_Bomb_Base.prototype.initialize = function (parent, params, bulletList) {
        this.i = 0;

        this.bulletList = bulletList;
        this.parent = parent;
        this.params = params;

        this.bulletParams = {};
        this.bulletParams.sprite = this.params.sprite;
        this.bulletParams.index = this.params.index;
        this.bulletParams.direction = this.params.direction;
        this.bulletParams.frame = this.params.frame;

        this.active = false;
    };

    /**
     * Checks if a bomb is currently active.
     * @returns {boolean} True if a bomb is active.
     */
    BHell_Bomb_Base.prototype.isActive = function () {
        return this.active;
    };

    /**
     * Activates a bomb. Makes every enemy bullet on screen explode.
     * @param x X activation coordinate.
     * @param y Y activaton coordinate.
     */
    BHell_Bomb_Base.prototype.activate = function (x, y) {
        if (this.active === false) {
            this.x = x;
            this.y = y;
            this.i = 0;
            if (this.params.se != null) {
                AudioManager.playSe(this.params.se);
            }

            this.active = true;

            if (my.controller != null) {
                my.controller.destroyEnemyBullets();
            }
        }
    };

    /**
     * Deactivates the bomb.
     */
    BHell_Bomb_Base.prototype.deactivate = function () {
        this.active = false;
    };

    /**
     * Updates the bomb. After one second it automatically deactivates it.
     */
    BHell_Bomb_Base.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i >= 60) {
                this.deactivate();
            }
        }
    };

    /**
     * Wind bomb class. Creates a whirlwind of bullets around the player. Lasts 5 seconds.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Bomb_Base
     */
    var BHell_Bomb_Wind = my.BHell_Bomb_Wind = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Bomb_Wind.prototype = Object.create(BHell_Bomb_Base.prototype);
    BHell_Bomb_Wind.prototype.constructor = BHell_Bomb_Wind;

    BHell_Bomb_Wind.prototype.initialize = function (parent, params, bulletList) {
        BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);
    };

    /**
     * Updates the bomb. For 5 seconds (300 frames) creates four bullets each frame.
     */
    BHell_Bomb_Wind.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i > 300) {
                this.deactivate();
            }
            else {
                for (var j = 0; j < 4; j++) {
                    var bullet = new my.BHell_Bullet(my.player.x, my.player.y, Math.PI / 180 * (j + this.i * 16), this.bulletParams, this.bulletList);

                    this.bulletList.push(bullet);
                    this.parent.addChild(bullet);
                }
            }
        }
    };

    /**
     * Water bomb class. Creates 5 concentric rings of bullets centered at the activation point. Lasts 5 seconds.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Bomb_Base
     */
    var BHell_Bomb_Water = my.BHell_Bomb_Water = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Bomb_Water.prototype = Object.create(BHell_Bomb_Base.prototype);
    BHell_Bomb_Water.prototype.constructor = BHell_Bomb_Water;

    BHell_Bomb_Water.prototype.initialize = function (parent, params, bulletList) {
        BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);
    };

    /**
     * Updates the bomb. Creates 360 bullets travelling radially from the spawn point every second (60 frames).
     */
    BHell_Bomb_Water.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i > 300) {
                this.deactivate();
            }
            else if (this.i % 60 === 0) {
                for (var j = 0; j < 360; j++) {
                    var bullet = new my.BHell_Bullet(this.x, this.y, Math.PI / 180 * j, this.bulletParams, this.bulletList);

                    this.bulletList.push(bullet);
                    this.parent.addChild(bullet);
                }
            }
        }
    };

    /**
     * Earth bomb class. Creates two protective rings around the player. Instead of travelling straight,
     * the bullets orbit the player. Lasts 10 seconds.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Bomb_Base
     */
    var BHell_Bomb_Earth = my.BHell_Bomb_Earth = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Bomb_Earth.prototype = Object.create(BHell_Bomb_Base.prototype);
    BHell_Bomb_Earth.prototype.constructor = BHell_Bomb_Earth;

    BHell_Bomb_Earth.prototype.initialize = function (parent, params, bulletList) {
        BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);

        this.bullets = [];
    };

    /**
     * Activates the bomb. Creates 50 bullets rotating (the default behaviour is overridden) counterclockwise at 200 pixels
     * from the player and 25 rotating clockwise at 100 pixels from the player. Bullets are stored in an internal array
     * for deactivation's sake.
     * @param x X activation coordinate.
     * @param y Y activation coordinate.
     */
    BHell_Bomb_Earth.prototype.activate = function (x, y) {
        BHell_Bomb_Base.prototype.activate.call(this, x, y);

        var j;
        var bullet;

        for (j = 0; j < 50; j++) {
            bullet = new my.BHell_Bullet(200 * Math.cos(2 * Math.PI / 50 * j) + my.player.x, 200 * Math.sin(2 * Math.PI / 50 * j) + my.player.y, 2 * Math.PI / 50 * j, this.bulletParams, this.bulletList);
            bullet.update = function () {
                this.x = 200 * Math.cos(this.angle) + my.player.x;
                this.y = 200 * Math.sin(this.angle) + my.player.y;
                this.angle += 0.1;
                if (this.angle >= Math.PI * 2) {
                    this.angle -= Math.PI * 2;
                }
            };

            this.bullets.push(bullet);
            this.bulletList.push(bullet);
            this.parent.addChild(bullet);
        }

        for (j = 0; j < 25; j++) {
            bullet = new my.BHell_Bullet(100 * Math.cos(2 * Math.PI / 25 * j) + my.player.x, 100 * Math.sin(2 * Math.PI / 25 * j) + my.player.y, 2 * Math.PI / 25 * j, this.bulletParams, this.bulletList);
            bullet.update = function () {
                this.x = 100 * Math.cos(this.angle) + my.player.x;
                this.y = 100 * Math.sin(this.angle) + my.player.y;
                this.angle -= 0.1;
                if (this.angle <= 0) {
                    this.angle += Math.PI * 2;
                }
            };

            this.bullets.push(bullet);
            this.bulletList.push(bullet);
            this.parent.addChild(bullet);
        }
    };

    /**
     * Updates the bomb. After 10 seconds it's deactivated.
     */
    BHell_Bomb_Earth.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i > 600) {
                this.deactivate();
            }
        }
    };

    /**
     * Deactivates the bomb. Destroyes every bullet left orbiting the player.
     */
    BHell_Bomb_Earth.prototype.deactivate = function () {
        BHell_Bomb_Base.prototype.deactivate.call(this);
        while (this.bullets.length > 0) {
            var bullet = this.bullets.pop();
            bullet.destroy();
        }

    };

    /**
     * Ice bomb class. Creates a 25 pointed star of bullets centered at the activation point. Lasts 5 seconds.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Bomb_Base
     */
    var BHell_Bomb_Ice = my.BHell_Bomb_Ice = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Bomb_Ice.prototype = Object.create(BHell_Bomb_Base.prototype);
    BHell_Bomb_Ice.prototype.constructor = BHell_Bomb_Ice;

    BHell_Bomb_Ice.prototype.initialize = function (parent, params, bulletList) {
        BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);
    };

    /**
     * Updates the bomb. Creates 25 bullets radially every 5 frames.
     */
    BHell_Bomb_Ice.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i > 300) {
                this.deactivate();
            }
            else if (this.i % 5 === 0) {
                for (var j = 0; j < 25; j++) {
                    var bullet = new my.BHell_Bullet(this.x, this.y, 2 * Math.PI / 25 * j, this.bulletParams, this.bulletList);

                    this.bulletList.push(bullet);
                    this.parent.addChild(bullet);
                }
            }
        }
    };

    return my;
}(BHell || {}));

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
    var animationSpeed = 15;
    var grazed = false;

    if (params != null) {
        speed = params.speed || speed;
        sprite = params.sprite || sprite;
        index = params.index || index;
        direction = params.direction || direction;
        frame = params.frame || frame;
        if (params.animated !== false) {
            animated = true;
        }
        animationSpeed = params.animation_speed || animationSpeed;
    }

    my.BHell_Sprite.prototype.initialize.call(this, sprite, index, direction, frame, animated, animationSpeed);

    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.rotation = angle + Math.PI / 2;

    this.x = x;
    this.y = y;
    this.z = 15;
    this.angle = angle;
    this.speed = speed;
    this.bulletList = bulletList;
    this.outsideMap = false;
};

/**
 * Updates the bullet's position. If it leaves the screen, it's destroyed.
 */
BHell_Bullet.prototype.update = function () {
    my.BHell_Sprite.prototype.update.call(this);

    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    if (this.y < -this.height || this.y > Graphics.height + this.height || this.x < -this.width || this.x > Graphics.width + this.width) {
        this.outsideMap = true;
    }
};

BHell_Bullet.prototype.isOutsideMap = function () {
    return this.outsideMap;
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

var BHell = (function (my) {

    /**
     * Controller class. Handles the game mechanics.
     *
     * Note: Generators in a map with negative scroll speed are still placed bottom-to-top, only the in-game scrolling is affected (ie. the map will scroll top-to-bottom).
     *
     * @constructor
     * @memberOf BHell
     */
    var BHell_Controller = my.BHell_Controller = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Controller.prototype = Object.create(Object.prototype);
    BHell_Controller.prototype.constructor = BHell_Controller;

    /**
     * Constructor. Creates player and generators.
     * @param stage Map id for the stage.
     * @param playerId Id of the player which will be created.
     * @param lives Initial lives for the player (-1: infinite).
     * @param parent Container for the sprites.
     */
    BHell_Controller.prototype.initialize = function (stage, playerId, lives, parent) {
        my.friendlyBullets = [];
        my.enemyBullets = [];

        my.bulletsHit = 0;
        my.bulletsLost = 0;

        this.enemies = [];
        my.explosions = [];

        this.parent = parent;
        this.stage = stage;
        my.player = new my.BHell_Player(playerId, lives, false, this.parent, this);
        my.player.spawn();

        this.generators = [];
        this.activeGenerators = [];

        my.bossMaxHp = 0;
        my.bossHp = 0;
        my.bossOnScreen = false;

        this.messages = [];

        // Create the generators from the map's events.
        this.stage.events().forEach(e => {
            var regex = /<(.+):([0-9]+):([0-9]+):((?:true)|(?:false))(?::((?:true)|(?:false)))?>/i;

            var comments = "";
            e.event().pages[0].list.filter(l => {
                return l.code === 108 || l.code === 408;
            }).forEach(l => {
                comments += l.parameters[0] + " ";
            });

            // If an event has some message, store it in the messages array.
            var list = e.event().pages[0].list.filter(l => {
                return l.code === 101 || l.code === 401;
            });

            var indexes = [];
            for (var i = 0; i < list.length; i++) {
                if (list[i].code === 101) {
                    indexes.push(i);
                }
            }

            for (var i = 0; i < indexes.length; i++) {
                var message = {};
                message.y = e.event().y;
                if (i < indexes.length - 1) {
                    message.list = list.slice(indexes[i], indexes[i + 1]);
                }
                else {
                    message.list = list.slice(indexes[i]);
                }

                this.messages.push(message);
            }

            var grps = regex.exec(e.event().note);
            if (grps != null) {
                this.generators.push(new my.BHell_Generator(e.event().x * this.stage.tileWidth(), e.event().y, e.event().pages[0].image, grps[1], Number(grps[2]), Number(grps[3]), (grps[4] === "true"), (grps[5] === "true"), comments, this.enemies, this.parent));
            }
        });

        var regex = /<bhell:(-?[0-9]+(?:\.[0-9]*))>/i;
        var grps = regex.exec($dataMap.note);
        this.scrollSpeed = 0;
        this.stageY = this.stage.height();

        if (grps != null) {
            this.scrollSpeed = Number(grps[1]);
        }
        else {
            this.scrollSpeed = 0.1;
            console.warn("This map doesn't have a <bhell:speed> note. Setting default speed to 0.1.");
        }

        this.paused = false;
        my.playing = true;

        $gameBHellResult = $gameBHellResult || {};
        $gameBHellResult.retries = $gameBHellResult.retries || 0;
        $gameBHellResult.livesLost = $gameBHellResult.livesLost || 0;
        $gameBHellResult.bombsUsed = $gameBHellResult.bombsUsed || 0;
        $gameBHellResult.hitRatio = 0;
        $gameBHellResult.enemiesKilled = 0;
        $gameBHellResult.enemiesMissed = 0;
        $gameBHellResult.enemiesCrashed = 0;
        $gameBHellResult.score = 0;
        $gameBHellResult.gaveUp = false;
        $gameBHellResult.won = false;
    };

    /**
     * Updates the game's loop until all generators are cleared or until the player looses all its lives.
     */
    BHell_Controller.prototype.update = function () {
        var i;
        var g;
        var e;
        var b;
        var m;

        if (this.generators.length === 0 && this.activeGenerators.length === 0 && this.enemies.length === 0) {
            // Victory.
            $gameBHellResult.won = true;
            my.player.win();
        }
        else if (my.player.lives === 0) {
            // Defeat.
            $gameBHellResult.won = false;
            my.playing = false;
        }
        else if (my.playing && !this.paused && !$gameMessage.isBusy()) { // Main update loop.
            // Scroll the stage if there are no stopping generators.
            if (this.activeGenerators.filter(g => {
                return g.stop === true;
            }).length === 0) {
                this.stage.scrollUp(this.scrollSpeed);
            }

            // If the player can move and there are no active generators to synchronize, update the stage's progression.
            if (my.player.justSpawned === false) {
                if (this.activeGenerators.filter(g => {
                    return g.sync === true;
                }).length === 0) {
                    this.stageY -= Math.abs(this.scrollSpeed); // Design choice: a negative scrollSpeed still requires generators to be placed from bottom to top.
                }

                var bossGenerators = this.activeGenerators.filter(g => {
                    return g.bossGenerator === true;
                });

                my.bossOnScreen = bossGenerators.length > 0;
                if (!my.bossOnScreen) {
                    my.bossMaxHp = 0;
                    my.bossHp = 0;
                }

                // If it's time to activate a generator, move it from the stage array to the active array.
                for (i = 0; i < this.generators.length; i++) {
                    g = this.generators[i];
                    if (g.y >= this.stageY) {
                        this.activeGenerators.push(g);

                        // If the BGM needs to be changed, save the old one and play the new one.
                        if (g.bossBgm !== null) {
                            if (g.resumeBgm) {
                                my.prevBossBgm = AudioManager.saveBgm();
                            }

                            my.bgm = my.bgm || {"name": "", "pan": 0, "pitch": 100, "volume": 90};
                            my.bgm.name = g.bossBgm;

                            AudioManager.fadeOutBgm(1);
                            AudioManager.playBgm(my.bgm);
                            AudioManager.fadeInBgm(1);
                        }

                        this.generators.splice(this.generators.indexOf(g), 1);
                        i--;
                    }
                }

                // If it's time to show a message, display it and remove it from the message list.
                var msg = this.messages.filter(m => {
                    return m.y >= this.stageY;
                });

                if (!$gameMessage.isBusy()) {
                    if (msg.length > 0) {
                        m = msg[0];
                        while (m.list.length > 0) {
                            var l = m.list[0];
                            if (l.code === 101) {
                                $gameMessage.newPage();
                                $gameMessage.setFaceImage(l.parameters[0], l.parameters[1]);
                                $gameMessage.setBackground(l.parameters[2]);
                                $gameMessage.setPositionType(l.parameters[3]);
                            }
                            else {
                                $gameMessage.add(l.parameters[0]);
                            }
                            m.list.splice(0, 1);
                        }
                        this.messages.splice(this.messages.indexOf(m), 1);
                    }
                }

                // Update the active generators. If a generator is synchronized, wait until there are no more enemies to remove it.
                for (i = 0; i < this.activeGenerators.length; i++) {
                    g = this.activeGenerators[i];
                    g.update();
                    if (g.n === 0) {
                        if (g.sync === false || this.enemies.length === 0) {
                            this.activeGenerators.splice(this.activeGenerators.indexOf(g), 1);
                            i--;

                            // If the BGM needs to be restored to the previous one, do it.
                            if (g.bossBgm !== null && g.resumeBgm) {
                                if (my.prevBossBgm.name !== "") {
                                    my.bgm = my.prevBossBgm;
                                    AudioManager.fadeOutBgm(1);
                                    AudioManager.playBgm(my.bgm);
                                    AudioManager.fadeInBgm(1);
                                }
                                else {
                                    AudioManager.fadeOutBgm(1);
                                }
                            }
                        }
                    }
                }
            }

            // Update the enemies.
            for (i = 0; i < this.enemies.length; i++) {
                if (i >= 0) {
                    e = this.enemies[i];

                    if (e.isOutsideMap()) {
                        e.destroy();
                        i--;
                        $gameBHellResult.enemiesMissed++;
                    }

                    if (e.hasCrashed(my.player)) {
                        my.player.die(false);
                        e.crash();
                        i--;
                    }
                }
            }

            // Update the player's bullets.
            for (i = 0; i < my.friendlyBullets.length; i++) {
                b = my.friendlyBullets[i];
                if (b.isOutsideMap()) {
                    b.destroy();
                    my.bulletsLost++;
                    i--;
                } else {
                    var enemiesHit = this.enemies.filter(e => {
                        return e.checkCollision(b.x, b.y);
                    });

                    if (enemiesHit.length > 0) {
                        my.bulletsHit++;
                        b.destroy();
                        i--;
                        enemiesHit[0].hit(); // Each bullet hits only ONE enemy.
                    }
                }
            }

            this.playerHit = false;

            // Update the enemy bullets.
            for (i = 0; i < my.enemyBullets.length; i++) {
                b = my.enemyBullets[i];
                if (b.isOutsideMap()) {
                    b.destroy();
                    i--;
                }
                if (!this.playerHit && my.player.checkCollision(b.x, b.y)) {
                    this.playerHit = true; // If a bullet has already hit the player during this frame, ignore every other collision (because the player is either dead or has thrown an autobomb).
                    b.destroy();
                    my.player.die(true);
                    i--;
                } else if (!b.grazed && my.player.checkGrazing(b.x, b.y)) {
                    b.grazed = true; // Avoid grazing the same bullet multiple times.
                    $gameBHellResult.score += my.grazingScore;
                }
            }

            // Update explosions. If the stage is scrolling, move the explosions with it.
            for (i = 0; i < my.explosions.length; i++) {
                e = my.explosions[i];
                if (this.stage.isLoopVertical() || this.stage._displayY !== 0) {
                    e.speed = this.scrollSpeed * this.stage.tileHeight();
                }
                else {
                    e.speed = 0;
                }
            }
        }
    };

    /**
     * Pushes a new message on the message list.
     * @param face Faceset.
     * @param index Index of the face to display.
     * @param background Background window format (0: window, 1: shadow, 2: transparent).
     * @param position Window position (0: bottom, 1: middle, 2: top).
     * @param lines Array of lines to display with the given settings.
     */
    BHell_Controller.prototype.pushMessage = function (face, index, background, position, lines) {
        for (var i = 0; i < lines.length / 4; i++) {
            var msg = {};
            msg.list = [];
            var tmp = {};
            tmp.code = 101;
            tmp.parameters = [face, index, background, position];
            msg.list.push(tmp);

            for (var j = 0; j < 4; j++) {
                if (i * 4 + j < lines.length) {
                    tmp = {};
                    tmp.code = 401;
                    tmp.parameters = [lines[i * 4 + j]];
                    msg.list.push(tmp);
                }
            }

            msg.y = this.stageY;
            this.messages.push(msg);
        }
    };

    /**
     * Destroys every enemy bullet on screen.
     */
    BHell_Controller.prototype.destroyEnemyBullets = function () {
        while (my.enemyBullets.length > 0) {
            var b = my.enemyBullets[0];
            my.explosions.push(new my.BHell_Explosion(b.x, b.y, this.parent, my.explosions));
            b.destroy();
        }
    };

    return my;
}(BHell || {}));

var BHell = (function (my) {

    /**
     * Pseudo FactoryMethod pattern for the emitters usable by the player.
     * @constructor
     * @memberOf BHell
     */
    var BHell_Emitter_Factory = my.BHell_Emitter_Factory = function () {
    };

    /**
     * Returns a new emitter suitable for the player (i.e. not aiming at it) with given parameters.
     * The emitters' JSON description has the following fields:
     *
     * - type: string identifying the emitter class (@see BHell.BHell_Emitter_Factory#create),
     * - params: parameters for the emitter (see {@link BHell.BHell_Emitter_Base} and derived classes for its content).
     *
     * @param emitter JSON description for the emitter.
     * @param x X coordinate for the parser.
     * @param y Y spawning coordinate for the parser.
     * @param w Width for the parser.
     * @param h Height for the parser.
     * @param rate Rate of fire rank for the emitter (D = 1, C = 2, B = 3, A = 4, S = 5), it multiplies the emitter's period.
     * @param power Fire power rank for the emitter (D, C, B, A, S), enables some emitters instead of others.
     * @param parent Sprites container.
     * @param bulletList Array in which the bullets will be pushed.
     * @returns {*} An instance of the requested emitter if emitter.params.ranks contains power, null otherwise.
     */
    BHell_Emitter_Factory.parseEmitter = function (emitter, x, y, w, h, rate, power, parent, bulletList) {
        var ret = null;

        var params = Object.assign({}, emitter.params);

        params.ranks = params.ranks || ["D", "C", "B", "A", "S"];

        switch (rate) {
            case "D":
                rate = 1;
                break;
            case "C":
                rate = 2;
                break;
            case "B":
                rate = 3;
                break;
            case "A":
                rate = 4;
                break;
            case "S":
                rate = 5;
                break;
            default:
                rate = 1;
                break;
        }

        if (params.ranks.indexOf(power) !== -1) {
            params.x = my.parse(emitter.params.x, x, y, w, h, Graphics.width, Graphics.height);
            params.y = my.parse(emitter.params.y, x, y, w, h, Graphics.width, Graphics.height);
            params.period = Math.round(my.parse(emitter.params.period, x, y, w, h, Graphics.width, Graphics.height) / rate);
            if (params.period === 0) {
                params.period = 1;
            }

            ret = BHell_Emitter_Factory.create(emitter, x, y, w, h, params, parent, bulletList);
        }

        return ret;
    };


    /**
     * Parses emitter.type and creates a new emitter accordingly.
     *
     * Implemented types are: "base", "spray", "rotate" and "burst".
     *
     * @param emitter JSON description of the emitter
     * @param x X coordinate for the parser.
     * @param y Y spawning coordinate for the parser.
     * @param w Width for the parser.
     * @param h Height for the parser.
     * @param params Parameters for the emitter.
     * @param parent Sprites container.
     * @param bulletList Array in which the bullets will be pushed.
     * @returns {*} An instance of the requested emitter if emitter.type could be parsed, null otherwise.
     */
    BHell_Emitter_Factory.create = function (emitter, x, y, w, h, params, parent, bulletList) {
        var ret = null;

        switch (emitter.type) {
            case "base":
                ret = new BHell_Emitter_Base(x, y, params, parent, bulletList);
                break;
            case "angle":
                params.angle = my.parse(emitter.params.angle, x, y, w, h, Graphics.width, Graphics.height);
                ret = new BHell_Emitter_Angle(x, y, params, parent, bulletList);
                break;
            case "spray":
                params.a = my.parse(emitter.params.a, x, y, w, h, Graphics.width, Graphics.height);
                params.b = my.parse(emitter.params.b, x, y, w, h, Graphics.width, Graphics.height);
                params.n = my.parse(emitter.params.n, x, y, w, h, Graphics.width, Graphics.height);
                ret = new BHell_Emitter_Spray(x, y, params, parent, bulletList);
                break;
            case "spray_random":
                params.a = my.parse(emitter.params.a, x, y, w, h, Graphics.width, Graphics.height);
                params.b = my.parse(emitter.params.b, x, y, w, h, Graphics.width, Graphics.height);
                params.n = my.parse(emitter.params.n, x, y, w, h, Graphics.width, Graphics.height);
                params.min_speed = my.parse(emitter.params.min_speed, x, y, w, h, Graphics.width, Graphics.height);
                params.max_speed = my.parse(emitter.params.max_speed, x, y, w, h, Graphics.width, Graphics.height);
                ret = new BHell_Emitter_Spray_Rnd(x, y, params, parent, bulletList);
                break;
            case "spray_alternate":
                params.a = my.parse(emitter.params.a, x, y, w, h, Graphics.width, Graphics.height);
                params.b = my.parse(emitter.params.b, x, y, w, h, Graphics.width, Graphics.height);
                params.n1 = my.parse(emitter.params.n1, x, y, w, h, Graphics.width, Graphics.height);
                params.n2 = my.parse(emitter.params.n2, x, y, w, h, Graphics.width, Graphics.height);
                ret = new BHell_Emitter_Spray_Alt(x, y, params, parent, bulletList);
                break;
            case "rotate":
                params.theta = my.parse(emitter.params.theta, x, y, w, h, Graphics.width, Graphics.height);
                params.radius = my.parse(emitter.params.radius, x, y, w, h, Graphics.width, Graphics.height);
                params.dt = my.parse(emitter.params.dt, x, y, w, h, Graphics.width, Graphics.height);
                ret = new BHell_Emitter_Rotate(x, y, params, parent, bulletList);
                break;
            case "burst":
                params.dispersion = my.parse(emitter.params.dispersion, x, y, w, h, Graphics.width, Graphics.height);
                params.shots = my.parse(emitter.params.shots, x, y, w, h, Graphics.width, Graphics.height);
                params.angle = my.parse(emitter.params.angle, x, y, w, h, Graphics.width, Graphics.height);
                ret = new BHell_Emitter_Burst(x, y, params, parent, bulletList);
                break;
        }

        return ret;
    };

    /**
     * Emitter base class. Spawns a bullet at a given frequency.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Sprite
     */
    var BHell_Emitter_Base = my.BHell_Emitter_Base = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Emitter_Base.prototype = Object.create(my.BHell_Sprite.prototype);
    BHell_Emitter_Base.prototype.constructor = BHell_Emitter_Base;

    /**
     * Constructor.
     * Emitter parameters:
     *
     * - x: X offset for the emitter's movement,
     * - y: Y offset for the emitter's movement,
     * - period: shooting period,
     * - charset: Character set for the emitter (null if the emitter should be invisible),
     * - index: Character index for the emitter (ignored if charset is null, or a big character),
     * - direction: Character direction for the emitter (Uses RPGMaker's 2-4-6-8 convention),
     * - frame: Initial character frame for the emitter (0-2),
     * - animated: True if the Sprite should dynamically change over time,
     * - animation_speed: Frames after which the character frame is updated,
     * - bullet: bullet parameters (see {@link BHell.BHell_Bullet} for its content).
     *
     * @param x X coordinate of the emitter.
     * @param y Y coordinate of the emitter.
     * @param params Parameters for the emitter and the spawned bullets.
     * @param parent Container for the emitter's and bullets' sprites.
     * @param bulletList Array in which the bullets will be pushed.
     */
    BHell_Emitter_Base.prototype.initialize = function (x, y, params, parent, bulletList) {
        // Set the default parameters.
        this.offsetX = 0;
        this.offsetY = 0;
        this.period = 1;
        var charset = null;
        var index = 0;
        var direction = 2;
        var frame = 0;
        var animated = false;
        var animationSpeed = 25;

        // Override default parameters with values taken from params.
        if (params != null) {
            this.offsetX = params.x || 0;
            this.offsetY = params.y || 0;
            this.period = (params.period > 0) ? params.period : 1;
            this.bulletParams = params.bullet;

            charset = params.sprite;
            index = params.index || index;
            direction = params.direction || direction;
            frame = params.frame || frame;
            animated = params.animated || animated;
            animationSpeed = params.animation_speed || animationSpeed;
        }

        // Initialize the emitter.
        my.BHell_Sprite.prototype.initialize.call(this, charset, index, direction, frame, animated, animationSpeed);
        this.parent = parent;
        this.shooting = false; // Every emitter is a finite-state machine, this parameter switches between shooting and non-shooting states.
        this.oldShooting = false; // Previous shooting state.
        this.j = 0; // Frame counter. Used for state switching.
        this.bulletList = bulletList;
        this.x = x;
        this.y = y;
    };

    /**
     * Updates the emitter's sprite and state. Called every frame. Shoots if in shooting state.
     */
    BHell_Emitter_Base.prototype.update = function () {
        my.BHell_Sprite.prototype.update.call(this);

        if (this.shooting === true) {
            if (this.j === 0) {
                this.shoot();
            }

            this.j = (this.j + 1) % this.period;
        }
        else {
            this.j = 0;
        }

        this.oldShooting = this.shooting;
    };

    /**
     * Spawns a single bullet moving upwards. Bullet's speed and appearance are determined by this.bulletParams.
     */
    BHell_Emitter_Base.prototype.shoot = function () {
        var bullet = new my.BHell_Bullet(this.x, this.y, 3 * Math.PI / 2, this.bulletParams, this.bulletList);
        this.parent.addChild(bullet);
        this.bulletList.push(bullet);
    };

    /**
     * Moves the emitter, relative to the initialised offset.
     * @param x New x coordinate.
     * @param y New y coordinate.
     */
    BHell_Emitter_Base.prototype.move = function (x, y) {
        this.x = x + this.offsetX;
        this.y = y + this.offsetY;
    };


    /**
     * Rotating emitter. It spawns a single bullet moving upwards, while moving in a circular pattern.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Emitter_Base
     */
    var BHell_Emitter_Rotate = my.BHell_Emitter_Rotate = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Emitter_Rotate.prototype = Object.create(BHell_Emitter_Base.prototype);
    BHell_Emitter_Rotate.prototype.constructor = BHell_Emitter_Rotate;

    /**
     * Constructor.
     * Additional parameters:
     *
     * - dt: rotation speed (in radians per frame),
     * - theta: initial angle (in radians),
     * - radius: rotation radius around the pivot.
     *
     * @param x X coordinate of the rotation pivot.
     * @param y Y coordinate of the rotation pivot.
     * @param params Emitter's and bullets' parameters.
     * @param parent Container for the sprites.
     * @param bulletList Array in which the bullets will be pushed.
     */
    BHell_Emitter_Rotate.prototype.initialize = function (x, y, params, parent, bulletList) {
        BHell_Emitter_Base.prototype.initialize.call(this, x, y, params, parent, bulletList);
        this.dt = 0;
        this.radius = 0;
        this.theta = 0;

        if (params != null) {
            this.dt = params.dt || this.dt;
            this.radius = params.radius || this.radius;
            this.theta = params.theta || this.theta;
        }
    };

    /**
     * Rotates the emitter around the pivot.
     * @param x Pivot's new x coordinate.
     * @param y Pivot's new y coordinate.
     */
    BHell_Emitter_Rotate.prototype.move = function (x, y) {
        this.theta += this.dt;
        if (this.theta > 2 * Math.PI)
            this.theta -= 2 * Math.PI;

        this.x = Math.cos(this.theta) * this.radius + x + this.offsetX;
        this.y = Math.sin(this.theta) * this.radius + y + this.offsetY;
    };

    /**
     * Spraying emitter. Creates a series of bullets spreading in an arc from the initial position.
     * Optionally aims towards the player.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Emitter_Base
     */
    var BHell_Emitter_Spray = my.BHell_Emitter_Spray = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Emitter_Spray.prototype = Object.create(BHell_Emitter_Base.prototype);
    BHell_Emitter_Spray.prototype.constructor = BHell_Emitter_Spray;

    /**
     * Constructor.
     * Additional parameters:
     *
     * - n: Number of bullets to be spawned for each shot,
     * - a: Arc's initial angle (in radians),
     * - b: Arc's final angle (in radians),
     * - aim: if true the arc is rotated to point towards the player,
     * - always_aim: if false (and aim = true) aiming only occours when there is a raising edge (shoot(false) -> shoot(true)),
     * - aim_x aiming horizontal offset (used only if aim = true),
     * - aim_y: aiming vertical offset (used only if aim = true).
     *
     * @param x
     * @param y
     * @param params
     * @param parent
     * @param bulletList
     */
    BHell_Emitter_Spray.prototype.initialize = function (x, y, params, parent, bulletList) {
        BHell_Emitter_Base.prototype.initialize.call(this, x, y, params, parent, bulletList);
        this.n = 1;
        this.a = 0;
        this.b = 0;
        this.aim = false;
        this.alwaysAim = false;
        this.aimX = 0;
        this.aimY = 0;

        this.aimingAngle = 0;

        if (params != null) {
            this.n = params.n || this.n;
            this.a = params.a || this.a;
            this.b = params.b || this.b;
            this.aim = params.aim || this.aim;
            this.alwaysAim = params.always_aim || this.alwaysAim;
            this.aimX = params.aim_x || this.aimX;
            this.aimY = params.aim_y || this.aimY;
        }
    };

    /**
     * Spawns this.n bullets spreading in an arc. If this.aim is true, the arc is centered on the player.
     */
    BHell_Emitter_Spray.prototype.shoot = function () {
        for (var k = 0; k < this.n; k++) {
            var bullet;
            if (this.aim) {
                if (this.alwaysAim || this.oldShooting === false) {
                    var dx = my.player.x - this.x + this.aimX;
                    var dy = my.player.y - this.y + this.aimY;
                    this.aimingAngle = Math.atan2(dy, dx);
                }

                bullet = new my.BHell_Bullet(this.x, this.y, this.aimingAngle - (this.b - this.a) / 2 + (this.b - this.a) / this.n * (k + 0.5), this.bulletParams, this.bulletList);
            }
            else {
                bullet = new my.BHell_Bullet(this.x, this.y, this.a + (this.b - this.a) / this.n * (k + 0.5), this.bulletParams, this.bulletList);
            }

            this.parent.addChild(bullet);
            this.bulletList.push(bullet);
        }
    };

    /**
     * Alternating spraying emitter. Creates a series of bullets spreading in an arc from the initial position, alternating between two sets of bullets.
     * Optionally aims towards the player.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Emitter_Spray
     */
    var BHell_Emitter_Spray_Alt = my.BHell_Emitter_Spray_Alt = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Emitter_Spray_Alt.prototype = Object.create(BHell_Emitter_Spray.prototype);
    BHell_Emitter_Spray_Alt.prototype.constructor = BHell_Emitter_Spray_Alt;

    /**
     * Constructor.
     * Additional parameters:
     *
     * - n1: Number of bullets to be spawned for odd shots,
     * - n2: Number of bullets to be spawned for even shots.
     *
     * @param x
     * @param y
     * @param params
     * @param parent
     * @param bulletList
     */
    BHell_Emitter_Spray_Alt.prototype.initialize = function (x, y, params, parent, bulletList) {

        this.n1 = 3;
        this.n2 = 2;
        this.odd = true;

        if (params != null) {
            this.n1 = params.n1 || this.n1;
            this.n2 = params.n2 || this.n2;
        }
        params.n = this.n1;
        BHell_Emitter_Spray.prototype.initialize.call(this, x, y, params, parent, bulletList);
    };

    BHell_Emitter_Spray_Alt.prototype.shoot = function () {
        if (this.odd) {
            this.n = this.n1;
        }
        else {
            this.n = this.n2;
        }

        BHell_Emitter_Spray.prototype.shoot.call(this);

        this.odd = !this.odd;
    };

    /**
     * Random emitter. Creates a series of random bullets inside an arc from the initial position.
     * Optionally aims towards the player.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Emitter_Spray
     */
    var BHell_Emitter_Spray_Rnd = my.BHell_Emitter_Spray_Rnd = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Emitter_Spray_Rnd.prototype = Object.create(BHell_Emitter_Spray.prototype);
    BHell_Emitter_Spray_Rnd.prototype.constructor = BHell_Emitter_Spray_Rnd;

    /**
     * Constructor.
     * Additional parameters:
     *
     * - min_speed: Minimum random speed for bullets,
     * - max_speed: Maximum random speed for bullets.
     *
     * @param x
     * @param y
     * @param params
     * @param parent
     * @param bulletList
     */
    BHell_Emitter_Spray_Rnd.prototype.initialize = function (x, y, params, parent, bulletList) {
        this.min_speed = 3;
        this.max_speed = 4;

        if (params != null) {
            this.min_speed = params.min_speed || this.min_speed;
            this.max_speed = params.max_speed || this.max_speed;
        }

        BHell_Emitter_Spray.prototype.initialize.call(this, x, y, params, parent, bulletList);
    };

    BHell_Emitter_Spray_Rnd.prototype.shoot = function () {
        for (var k = 0; k < this.n; k++) {
            var bullet;
            var randomAngle = Math.random() * (this.b - this.a);
            var randomSpeed = Math.random() * (this.max_speed - this.min_speed) + this.min_speed;
            if (this.aim) {
                if (this.alwaysAim || this.oldShooting === false) {
                    var dx = my.player.x - this.x + this.aimX;
                    var dy = my.player.y - this.y + this.aimY;
                    this.aimingAngle = Math.atan2(dy, dx);
                }

                bullet = new my.BHell_Bullet(this.x, this.y, this.aimingAngle + this.a - (this.b - this.a) / 2 + randomAngle, this.bulletParams, this.bulletList);
            }
            else {
                bullet = new my.BHell_Bullet(this.x, this.y, this.a + randomAngle, this.bulletParams, this.bulletList);
            }

            bullet.speed = randomSpeed;
            this.parent.addChild(bullet);
            this.bulletList.push(bullet);
        }
    };

    /**
     * Overcoming bullets emitter. Creates a series of bullets spreading in an arc from the initial position, with the later bullets faster than the earlier ones.
     * Optionally aims towards the player.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Emitter_Spray
     */
    var BHell_Emitter_Overcome = my.BHell_Emitter_Overcome = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Emitter_Overcome.prototype = Object.create(BHell_Emitter_Spray.prototype);
    BHell_Emitter_Overcome.prototype.constructor = BHell_Emitter_Overcome;

    /**
     * Constructor.
     * Additional parameters:
     *
     * - min_speed: Speed for the bullets in the first wave,
     * - max_speed: Speed for the bullets in the last wave,
     * - waves: Number of waves to shoot.
     *
     * @param x
     * @param y
     * @param params
     * @param parent
     * @param bulletList
     */
    BHell_Emitter_Overcome.prototype.initialize = function (x, y, params, parent, bulletList) {

        this.min_speed = 3;
        this.max_speed = 4;
        this.waves = 4;

        if (params != null) {
            this.min_speed = params.min_speed || this.min_speed;
            this.max_speed = params.max_speed || this.max_speed;
            this.waves = params.waves || this.waves;
        }

        this.d_speed = (this.max_speed - this.min_speed) / this.waves;
        this.current_wave = 0;
        params.bullet.speed = this.min_speed;
        BHell_Emitter_Spray.prototype.initialize.call(this, x, y, params, parent, bulletList);
    };

    BHell_Emitter_Overcome.prototype.shoot = function () {
        BHell_Emitter_Spray.prototype.shoot.call(this);
        if (!this.oldShooting) {
            this.bulletParams.speed = this.min_speed;
            this.current_wave = 0;
        }
        this.bulletParams.speed = this.min_speed + this.current_wave * this.d_speed;

        this.current_wave = (this.current_wave + 1) % this.waves;
    };

    /**
     * Fanning bullets emitter. Creates a series of bullets spreading in an arc from the initial position, rotating like a fan.
     * Optionally aims towards the player.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Emitter_Overcome
     */
    var BHell_Emitter_Fan = my.BHell_Emitter_Fan = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Emitter_Fan.prototype = Object.create(BHell_Emitter_Overcome.prototype);
    BHell_Emitter_Fan.prototype.constructor = BHell_Emitter_Fan;

    /**
     * Constructor.
     * Additional parameters:
     *
     * - rotation_angle: Rotation angle between each wave.
     *
     * @param x
     * @param y
     * @param params
     * @param parent
     * @param bulletList
     */
    BHell_Emitter_Fan.prototype.initialize = function (x, y, params, parent, bulletList) {
        this.rotation_angle = 0.05;

        if (params != null) {
            this.rotation_angle = params.rotation_angle || this.rotation_angle;
        }

        BHell_Emitter_Overcome.prototype.initialize.call(this, x, y, params, parent, bulletList);
    };

    BHell_Emitter_Fan.prototype.shoot = function () {
        if (!this.oldShooting) {
            this.bulletParams.speed = this.min_speed;
            this.current_wave = 0;
        }

        this.bulletParams.speed = this.min_speed + this.current_wave * this.d_speed;
        for (var k = 0; k < this.n; k++) {
            var bullet;

            if (this.aim) {
                if (this.alwaysAim || this.oldShooting === false) {
                    var dx = my.player.x - this.x + this.aimX;
                    var dy = my.player.y - this.y + this.aimY;
                    this.aimingAngle = Math.atan2(dy, dx);
                }

                bullet = new my.BHell_Bullet(this.x, this.y, this.aimingAngle + this.rotation_angle * this.current_wave - (this.b - this.a) / 2 + (this.b - this.a) / this.n * (k + 0.5), this.bulletParams, this.bulletList);
            }
            else {
                bullet = new my.BHell_Bullet(this.x, this.y, this.a + this.rotation_angle * this.current_wave + (this.b - this.a) / this.n * (k + 0.5), this.bulletParams, this.bulletList);
            }

            this.parent.addChild(bullet);
            this.bulletList.push(bullet);
        }

        this.current_wave = (this.current_wave + 1) % this.waves;
    };

    /**
     * Angle emitter. Creates a single bullet traveling at an angle. Optionally aims at the player.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Emitter_Base
     */
    var BHell_Emitter_Angle = my.BHell_Emitter_Angle = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Emitter_Angle.prototype = Object.create(BHell_Emitter_Base.prototype);
    BHell_Emitter_Angle.prototype.constructor = BHell_Emitter_Angle;

    /**
     * Constructor.
     * Additional parameters:
     *
     * - angle: the bullets' traveling angle. If aiming, it will be used as an offset for the angle between the emitter and the player,
     * - aim: if true the angle is relative to the player's position (i.e. angle = 0 and aim = true: the bullets will point
     *        towards the player, angle = 0.1 and aim = true: the bullets will be shot at 0.1 radians counterclockwise, from the player's direction)
     * - always_aim: if false (and aim = true) aiming only occours when there is a raising edge (shoot(false) -> shoot(true)),
     * - aim_x aiming horizontal offset (used only if aim = true),
     * - aim_y: aiming vertical offset (used only if aim = true).
     *
     * @param x
     * @param y
     * @param params
     * @param parent
     * @param bulletList
     */
    BHell_Emitter_Angle.prototype.initialize = function (x, y, params, parent, bulletList) {
        BHell_Emitter_Base.prototype.initialize.call(this, x, y, params, parent, bulletList);

        this.angle = 0;
        this.aim = false;
        this.alwaysAim = false;
        this.aimX = 0;
        this.aimY = 0;

        this.aimingAngle = 0;

        if (params != null) {
            this.angle = params.angle || this.angle;
            this.aim = params.aim || this.aim;
            this.alwaysAim = params.always_aim || this.alwaysAim;
            this.aimX = params.aim_x || this.aimX;
            this.aimY = params.aim_y || this.aimY;
        }
    };

    /**
     * Shoots a single bullet towards this.angle or this.angle + angle between player and emitter.
     */
    BHell_Emitter_Angle.prototype.shoot = function () {
        var bullet;
        if (this.aim) {
            if (this.alwaysAim || this.oldShooting === false) {
                var dx = my.player.x - this.x + this.aimX;
                var dy = my.player.y - this.y + this.aimY;
                this.aimingAngle = Math.atan2(dy, dx);
            }

            bullet = new my.BHell_Bullet(this.x, this.y, this.aimingAngle, this.bulletParams, this.bulletList);
        }
        else {
            bullet = new my.BHell_Bullet(this.x, this.y, this.angle, this.bulletParams, this.bulletList);
        }

        this.parent.addChild(bullet);
        this.bulletList.push(bullet);
    };

    /**
     * Burst emitter. Creates many bullets packed randomly inside a dispersion circle.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Emitter_Base
     */
    var BHell_Emitter_Burst = my.BHell_Emitter_Burst = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Emitter_Burst.prototype = Object.create(BHell_Emitter_Base.prototype);
    BHell_Emitter_Burst.prototype.constructor = BHell_Emitter_Burst;

    /**
     * Constructor.
     * Additional parameters:
     *
     * - angle: Angle at which the bullets will be shot,
     * - shots: Number of bullets which will be shot,
     * - dispersion: Diameter of the dispersion circle,
     * - aim: If true the shooting angle is determined like Emitter_Angle with aim = true,
     * - always_aim: if false (and aim = true) aiming only occours when there is a raising edge (shoot(false) -> shoot(true)),
     * - aim_x aiming horizontal offset (used only if aim = true),
     * - aim_y: aiming vertical offset (used only if aim = true).
     * @param x
     * @param y
     * @param params
     * @param parent
     * @param bulletList
     */
    BHell_Emitter_Burst.prototype.initialize = function (x, y, params, parent, bulletList) {
        BHell_Emitter_Base.prototype.initialize.call(this, x, y, params, parent, bulletList);

        this.angle = 0;
        this.shots = 1;
        this.dispersion = 0;
        this.aim = false;
        this.alwaysAim = false;
        this.aimX = 0;
        this.aimY = 0;
        this.aimingAngle = 0;

        if (params != null) {
            this.angle = params.angle || this.angle;
            this.shots = params.shots || this.shots;
            this.dispersion = params.dispersion || this.dispersion;
            this.aim = params.aim || this.aim;
            this.alwaysAim = params.always_aim || this.alwaysAim;
            this.aimX = params.aim_x || this.aimX;
            this.aimY = params.aim_y || this.aimY;
        }
    };

    /**
     * Creates this.shots bullets randomly inside a circle with this.dispersion diameter.
     */
    BHell_Emitter_Burst.prototype.shoot = function () {
        var offX = 0;
        var offY = 0;

        for (var k = 0; k < this.shots; k++) {
            // Create a shot randomly inside the dispersion circle.
            var r = Math.random() * this.dispersion / 2;
            var phi = Math.random() * 2 * Math.PI;
            offX = r * Math.cos(phi);
            offY = r * Math.sin(phi);
            var bullet;
            if (this.aim) {
                if (this.alwaysAim || this.oldShooting === false) {
                    var dx = my.player.x - this.x + this.aimX;
                    var dy = my.player.y - this.y + this.aimY;
                    this.aimingAngle = Math.atan2(dy, dx);
                }
                bullet = new my.BHell_Bullet(this.x + offX, this.y + offY, this.aimingAngle, this.bulletParams, this.bulletList);
            }
            else {
                bullet = new my.BHell_Bullet(this.x + offX, this.y + offY, this.angle, this.bulletParams, this.bulletList);
            }
            this.parent.addChild(bullet);
            this.bulletList.push(bullet);
        }
    };

    return my;
}(BHell || {}));

var BHell = (function (my) {

/**
 * Enemy base class. Each enemy's behaviour is controlled by a mover, an array of emitters and a parameter object, but
 * this modularity can be overridden in derived classes.
 *
 * Parameters shared between all enemies:
 *
 * - hp: Hitpoints of the enemy,
 * - speed: Movement's speed (the unit is determined by the specific mover used),
 * - period: Emitters' period,
 * - hitbox_w: Width of the hitbox used for collisions with bullets and the player,
 * - hitbox_h: Height of the hitbox,
 * - angle: Shooting angle,
 * - aim: Aim parameter for the emitters,
 * - always_aim: Always_aim parameter for the emitters,
 * - rnd: If the emitters aren't aimed at the player and rnd = true, every shot's direction is randomized,
 * - score: Score points awarded for each successful bullet hit,
 * - kill_score: Score points awarded on enemy's death,
 * - boss: If true, an hp bar will be shown,
 * - boss_bgm: If defined, plays this BGM instead of the one defined on the map,
 * - resume_bgm: If true, when the monster is defeated, resumes the previous BGM,
 * - bullet: bullet parameters (see {@link BHell.BHell_Bullet}).
 *
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Sprite
 */
var BHell_Enemy_Base = my.BHell_Enemy_Base = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Base.prototype = Object.create(my.BHell_Sprite.prototype);
BHell_Enemy_Base.prototype.constructor = BHell_Enemy_Base;

/**
 * Constructor. Sets the parameters shared between all classes.
 *
 * @param x X spawning coordinate.
 * @param y Y spawning coordinate.
 * @param image Enemy sprite.
 * @param params Setup parameters.
 * @param parent Container for the enemy's, emitters' and bullets' sprites.
 * @param enemyList Array in which the enemy will be pushed.
 */
BHell_Enemy_Base.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    my.BHell_Sprite.prototype.initialize.call(this, image.characterName, image.characterIndex, image.direction, image.pattern, ((params.animated != null)? params.animated: true), params.animation_speed || 25);

    this.parent = parent;
    this.parent.addChild(this);
    this.enemyList = enemyList;
    this.emitters = [];

    this.x = x;
    this.y = y;

    this.hasAppeared = false;

    // Set default parameters.
    this.hp = 1;
    this.speed = 3;
    this.period = 60;
    this.hitboxW = this.width;
    this.hitboxH = this.height;
    this.angle = Math.PI / 2;
    this.aim = false;
    this.alwaysAim = false;
    this.aimX = 0;
    this.aimY = 0;
    this.rnd = false;
    this.score = 10;
    this.killScore = 100;
    this.boss = false;

    // Overrides default parameters with params content.
    if (params != null) {
        var tmp;

        tmp = my.parse(params.hp, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp > 0) {
            this.hp = Math.round(tmp);
        }
        tmp = my.parse(params.speed, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp < 10 && tmp > 0) {
            this.speed = tmp;
        }
        tmp = my.parse(params.period, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp > 0) {
            this.period = tmp;
        }
        tmp = my.parse(params.hitbox_w, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp > 0) {
            this.hitboxW = tmp;
        }
        tmp = my.parse(params.hitbox_h, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp > 0) {
            this.hitboxH = tmp;
        }
        tmp = my.parse(params.angle, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.angle = tmp;
        }

        tmp = my.parse(params.aim, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.aim = tmp;
        }

        tmp = my.parse(params.always_aim, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.alwaysAim = tmp;
        }

        tmp = my.parse(params.aim_x, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.aimX = tmp;
        }

        tmp = my.parse(params.aim_y, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.aimY = tmp;
        }

        tmp = my.parse(params.rnd, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.rnd = tmp;
        }

        tmp = my.parse(params.score, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.score = tmp;
        }

        tmp = my.parse(params.kill_score, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.killScore = tmp;
        }

        tmp = my.parse(params.boss, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp !== null) {
            this.boss = tmp;
        }

        if (params.bullet != null) {
            this.bullet = Object.assign({}, params.bullet);
        }
    }

    if (this.boss) {
        my.bossMaxHp += this.hp;
        my.bossHp += this.hp;
    }
};

/**
 * Checks if the given coordinates are inside the enemy's hitbox.
 * In case of collision, stores the coordinates into this.lastX and this.lastY (useful for spawning explosions, for example).
 * @param x X coordinate.
 * @param y Y coordinate.
 * @returns {boolean} true if (x, y) is inside the hitbox.
 */
BHell_Enemy_Base.prototype.checkCollision = function (x, y) {
    var dx = Math.abs(this.x - x);
    var dy = Math.abs(this.y - y);

    if (dx < this.hitboxW / 2 && dy < this.hitboxH / 2) {
        this.lastX = x;
        this.lastY = y;
    }

    return (dx < this.hitboxW / 2 && dy < this.hitboxH / 2);
};

/**
 * Update function, called every frame.
 */
BHell_Enemy_Base.prototype.update = function () {
    my.BHell_Sprite.prototype.update.call(this);
    this.move();
    this.shoot(true);

    this.emitters.forEach(e => { // If not shooting, change the angle
        if (this.aim === false && this.rnd === true) {
            e.angle = Math.random() * 2 * Math.PI;
        }

        e.update();
    });
};

/**
 * Moves the enemy and all its emitters, delegating the calculations to its mover.
 */
BHell_Enemy_Base.prototype.move = function () {
    if (this.mover != null) {
        var p = this.mover.move(this.x, this.y, this.speed);
        this.x = p[0];
        this.y = p[1];
    }

    this.emitters.forEach(e => {
        e.move(this.x, this.y);
    });
};

/**
 * Enables/disables shooting for every emitter (but only if the player is ready to move).
 * @param t True to enable shooting, false otherwise.
 */
BHell_Enemy_Base.prototype.shoot = function (t) {
    this.emitters.forEach(e => {
        e.shooting = t && !my.player.justSpawned;
    });
};


/**
 * Makes the enemy lose one hit point, possibly killing it.
 */
BHell_Enemy_Base.prototype.hit = function () {
    this.hp--;
    $gameBHellResult.score += this.score;

    if (this.boss) {
        my.bossHp--;
    }

    if (this.hp <= 0) {
        this.die();
        $gameBHellResult.enemiesKilled++;
    }
};

/**
 * Checks if the enemy has left the map, but only after it has appeared on screen to avoid triggering the enemy's
 * destruction when it's just spawned.
 *
 * The controller relies on this method to destroy enemies, so enemies which shouldn't be destroyed when leaving the map
 * should always return false.
 * @returns {boolean} True if the enemy has appeared on the screen and is currently outside the screen.
 */
BHell_Enemy_Base.prototype.isOutsideMap = function () {
    var outside = (this.x < -this.width / 2) || (this.x > Graphics.width + this.width / 2) || (this.y >= Graphics.height + this.height / 2) || (this.y < -this.height / 2);
    var ret = this.hasAppeared && outside;

    this.hasAppeared |= !outside;

    return ret;
};

/**
 * Checks if the enemy has collided with the player.
 * @param player Player object.
 * @returns {boolean} True if there is a collision.
 */
BHell_Enemy_Base.prototype.hasCrashed = function(player) {
    var dx = Math.abs(this.x - player.x);
    var dy = Math.abs(this.y - player.y);
    var hitW = (this.hitboxW + player.hitboxW) / 2 ;
    var hitH = (this.hitboxH + player.hitboxH) / 2;

    return dx < hitW && dy < hitH && !player.immortal;
};

/**
 * Crashes the enemy, destroying it.
 * @returns {boolean} True if the crash has succeded (e.g. bosses immune to crashing will return false).
 */
BHell_Enemy_Base.prototype.crash = function() {
    if (this.boss !== true) {
        my.explosions.push(new my.BHell_Explosion(this.x, this.y, this.parent, my.explosions));
        this.destroy();
    }
    $gameBHellResult.enemiesCrashed++;

    return true;
};

/**
 * Awards the killing score and destroys the enemy.
 */
BHell_Enemy_Base.prototype.die = function() {
    $gameBHellResult.score += this.killScore;
    my.explosions.push(new my.BHell_Explosion(this.x, this.y, this.parent, my.explosions));

    this.destroy();
};

/**
 * Destroys the enemy sprite and removes it from the controller's array of enemies.
 */
BHell_Enemy_Base.prototype.destroy = function() {
    if (this.parent != null) {
        this.parent.removeChild(this);
    }
    this.enemyList.splice(this.enemyList.indexOf(this), 1);
};


/**
 * Suicide enemy class. Chases the player until they crash, it never shoots.
 *
 * No additional parameters are defined.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Base
 */
var BHell_Enemy_Suicide = my.BHell_Enemy_Suicide = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Suicide.prototype = Object.create(BHell_Enemy_Base.prototype);
BHell_Enemy_Suicide.prototype.constructor = BHell_Enemy_Suicide;

BHell_Enemy_Suicide.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);
    this.mover = new my.BHell_Mover_Chase();
};

    /**
     * Orbiter enemy class. Orbits around the player and shoots toward it once in a while. It is never destroyed outside the map.
     *
     * Additional parameters:
     *
     * - radius: distance from the player.
     * - counterclockwise: if true orbits counterclockwise.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Enemy_Base
     */
    var BHell_Enemy_Orbiter = my.BHell_Enemy_Orbiter = function() {
        this.initialize.apply(this, arguments);
    };

    BHell_Enemy_Orbiter.prototype = Object.create(BHell_Enemy_Base.prototype);
    BHell_Enemy_Orbiter.prototype.constructor = BHell_Enemy_Orbiter;

    BHell_Enemy_Orbiter.prototype.initialize = function (x, y, image, params, parent, enemyList) {
        BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

        // Set default parameters for this class:
        this.radius = 250;
        this.counterclockwise = false;

        // Overrides default parameters:
        if (params != null) {
            var tmp;

            tmp = my.parse(params.radius, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
            if (tmp > 0) {
                this.radius = Math.round(tmp);
            }

            tmp = my.parse(params.counterclockwise, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
            if (tmp !== null) {
                this.counterclockwise = tmp;
            }
        }

        var emitterParams = {};
        emitterParams.x = 0;
        emitterParams.y = 0;
        emitterParams.period = this.period;
        emitterParams.angle = 0;
        emitterParams.aim = true;
        emitterParams.always_aim = true;
        emitterParams.bullet = Object.assign({}, this.bullet);

        this.mover = new my.BHell_Mover_Orbit(this.radius, this.counterclockwise);
        this.emitters.push(new my.BHell_Emitter_Angle(this.x, this.y, emitterParams, parent, my.enemyBullets));
    };

    BHell_Enemy_Orbiter.prototype.isOutsideMap = function () {
        return false;
    };

/**
 * Probe enemy class. Switches between two states: moving and shooting. In the first state it moves in a straight line
 * towards a random point on screen and never shoots, in the second state it shoots without moving.
 * Due to the moving behavior, it's impossible for it to leave the screen.
 *
 * Additional parameters:
 *
 * - shooting: length (in frames) of the shooting phase (the moving phase length depends on the distance from the
 *           randomly chosen point).
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Base
 */
var BHell_Enemy_Probe = my.BHell_Enemy_Probe = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Probe.prototype = Object.create(BHell_Enemy_Base.prototype);
BHell_Enemy_Probe.prototype.constructor = BHell_Enemy_Probe;

BHell_Enemy_Probe.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.shooting = 120;

    if (params != null) {
        var tmp = my.parse(params.shooting, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp > 0) {
            this.shooting = tmp;
        }
    }

    this.destX = Math.random() * Graphics.width;
    this.destY = Math.random() * Graphics.height;
    this.j = 0;

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.period = this.period;
    emitterParams.angle = 0;
    emitterParams.aim = this.aim;
    emitterParams.always_aim = this.alwaysAim;
    emitterParams.aim_x = this.aimX;
    emitterParams.aim_y = this.aimY;
    emitterParams.rnd = this.rnd;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.moving = true;
    this.emitters.push(new my.BHell_Emitter_Angle(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Update method. Since no mover is used, the entire moving behaviour is handled here.
 */
BHell_Enemy_Probe.prototype.update = function () {
    my.BHell_Sprite.prototype.update.call(this);

    if (this.moving) {
        var dx = this.destX - this.x;
        var dy = this.destY - this.y;
        var angle = Math.atan2(dy, dx);

        if (dx > 0) {
            this.x += Math.min(dx, Math.cos(angle) * this.speed);
        }
        else if (dx < 0) {
            this.x += Math.max(dx, Math.cos(angle) * this.speed);
        }

        if (dy > 0) {
            this.y += Math.min(dy, Math.sin(angle) * this.speed);
        }
        else if (dy < 0) {
            this.y += Math.max(dy, Math.sin(angle) * this.speed);
        }

        var shootingAngle = 0;
        if (this.aim === false && this.rnd === true) {
            shootingAngle = Math.random() * 2 * Math.PI;
        }
        this.emitters.forEach(e => {
            e.move(this.x, this.y);
            e.angle = shootingAngle;
            e.update();
        });
        if (Math.abs(dx) < 2 && Math.abs(dx) < 2) {
            this.destX = Math.random() * Graphics.width;
            this.destY = Math.random() * Graphics.height;
            this.moving = false;
        }
    }
    else {
        this.j = (this.j + 1) % this.shooting;
        this.shoot(true);
        this.emitters.forEach(e => {
            e.update();
        });
        if (this.j === 0) {
            this.moving = true;
            this.shoot(false);
        }
    }
};

/**
 * Blocker enemy class. It moves horizontally trying to stop the player (as long as its speed can keep up) and slowly
 *  creeps towards the bottom, shooting downwards.
 *
 * Added parameters:
 *
 * - vspeed: vertical speed (in pixels per frame).
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Base
 */
var BHell_Enemy_Blocker = my.BHell_Enemy_Blocker = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Blocker.prototype = Object.create(BHell_Enemy_Base.prototype);
BHell_Enemy_Blocker.prototype.constructor = BHell_Enemy_Blocker;

BHell_Enemy_Blocker.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.vspeed = 0.2;

    if (params != null) {
        var tmp = my.parse(params.vspeed, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height, Graphics.width, Graphics.height);
        if (tmp > 0) {
            this.vspeed = tmp;
        }
    }

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.period = this.period;
    emitterParams.angle = Math.PI / 2;
    emitterParams.aim = false;
    emitterParams.always_aim = false;
    emitterParams.rnd = false;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.emitters.push(new my.BHell_Emitter_Angle(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Move method. Instead of using a mover, the behaviour is entirely handled here.
 */
BHell_Enemy_Blocker.prototype.move = function () {
    var dx = my.player.x - this.x;

    if (dx > 0) {
        this.x += Math.min(dx, this.speed);
    }
    else if (dx < 0) {
        this.x += Math.max(dx, -this.speed);
    }

    this.y += this.vspeed;

    this.emitters.forEach(e => {
        e.move(this.x, this.y);
    });
};

/**
 * Spline-based enemy base class. Sets up the moving behavior for every enemy moving in a spline pattern.
 *
 * Additional parameters:
 *
 * - A {x, y}: First spline point,
 * - B {x, y}: Second spline point,
 * - C {x, y}: Third spline point,
 * - D {x, y}: Fourth spline point.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Base
 */
var BHell_Enemy_Spline = my.BHell_Enemy_Spline = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Spline.prototype = Object.create(BHell_Enemy_Base.prototype);
BHell_Enemy_Spline.prototype.constructor = BHell_Enemy_Spline;

BHell_Enemy_Spline.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    var A = {x: x, y: y - this.height};
    var B = {x: x, y: y - this.height};
    var C = {x: x, y: Graphics.height + this.height};
    var D = {x: x, y: Graphics.height + this.height};

    if (params != null) {
        if (params.A != null) {
            A.x = my.parse(params.A.x, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || A.x;
            A.y = my.parse(params.A.y, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || A.y;
        }
        if (params.B != null) {
            B.x = my.parse(params.B.x, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || B.x;
            B.y = my.parse(params.B.y, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || B.y;
        }
        if (params.C != null) {
            C.x = my.parse(params.C.x, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || C.x;
            C.y = my.parse(params.C.y, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || C.y;
        }
        if (params.D != null) {
            D.x = my.parse(params.D.x, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || D.x;
            D.y = my.parse(params.D.y, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height) || D.y;
        }
    }

    this.mover = new my.BHell_Mover_Spline(A.x, A.y, B.x, B.y, C.x, C.y, D.x, D.y);
};

/**
 * Small fry enemy class. Shoots with an angle emitter.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Spline
 */
var BHell_Enemy_Smallfry = my.BHell_Enemy_Smallfry = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Smallfry.prototype = Object.create(BHell_Enemy_Spline.prototype);
BHell_Enemy_Smallfry.prototype.constructor = BHell_Enemy_Smallfry;

BHell_Enemy_Smallfry.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Spline.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.period = this.period;
    emitterParams.angle = this.angle;
    emitterParams.aim = this.aim;
    emitterParams.aim_x = this.aimX;
    emitterParams.aim_y = this.aimY;
    emitterParams.rnd = this.rnd;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.emitters.push(new my.BHell_Emitter_Angle(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Gunner enemy base class. Alternates two states: shooting and cooling down (during which
 * it can't shoot).
 *
 * Additional parameters:
 *
 * - cooldown: Length (in frames) of the cooldown phase,
 * - shooting: Length (in frames) of the shooting phase,
 * - stop_on_shooting: if true the enemy halts its movements while shooting.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Spline
 */
var BHell_Enemy_Gunner_Base = my.BHell_Enemy_Gunner_Base = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Gunner_Base.prototype = Object.create(BHell_Enemy_Spline.prototype);
BHell_Enemy_Gunner_Base.prototype.constructor = BHell_Enemy_Gunner_Base;

BHell_Enemy_Gunner_Base.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Spline.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.cooldown = 60;
    this.shooting = 60;
    this.stopOnShooting = false;

    if (params != null) {
        this.cooldown = params.cooldown || this.cooldown;
        this.shooting = params.shooting || this.shooting;
        this.stopOnShooting = params.stop_on_shooting || this.stopOnShooting;
    }

    this.j = 1;
    this.coolingDown = true;
};

/**
 * Update method. Alternates between shooting and cooling down phases. If rnd = true, the shooting angle is changed only
 * during cooldown.
 */
BHell_Enemy_Gunner_Base.prototype.update = function () {
    my.BHell_Sprite.prototype.update.call(this);
    if (this.stopOnShooting === false) {
        this.move();
    }

    if (this.coolingDown) {
        this.j = (this.j + 1) % this.cooldown;
        this.shoot(false);
        if (this.stopOnShooting === true) {
            this.move();
        }
        this.emitters.forEach(e => { // If not shooting, change the angle
            if (this.aim === false && this.rnd === true) {
                e.angle = Math.random() * 2 * Math.PI;
            }

            e.update();
        });
        if (this.j === 0) {
            this.coolingDown = false;
        }
    }
    else {
        this.j = (this.j + 1) % this.shooting;
        this.shoot(true);
        this.emitters.forEach(e => { // If shooting, keep the aim steady
            e.update();
        });
        if (this.j === 0) {
            this.coolingDown = true;
        }
    }
};

// Gunner enemy: shoots a series of bullets.
/**
 * Gunner enemy class. Gunner with an Angle emitter.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Gunner_Base
 */
var BHell_Enemy_Gunner = my.BHell_Enemy_Gunner = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Gunner.prototype = Object.create(BHell_Enemy_Gunner_Base.prototype);
BHell_Enemy_Gunner.prototype.constructor = BHell_Enemy_Gunner;

BHell_Enemy_Gunner.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Gunner_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.aim = this.aim;
    emitterParams.always_aim = this.alwaysAim;
    emitterParams.aim_x = this.aimX;
    emitterParams.aim_y = this.aimY;
    emitterParams.period = this.period;
    emitterParams.angle = this.angle;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.emitters.push(new my.BHell_Emitter_Angle(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Sprayer enemy class. Gunner with a Spray emitter.
 *
 * Additional parameters:
 *
 * - a: initial angle for the spray arc,
 * - b: final angle for the spray arc,
 * - n: number of bullets to shot.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Gunner_Base
 */
var BHell_Enemy_Sprayer = my.BHell_Enemy_Sprayer = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Sprayer.prototype = Object.create(BHell_Enemy_Gunner_Base.prototype);
BHell_Enemy_Sprayer.prototype.constructor = BHell_Enemy_Sprayer;

BHell_Enemy_Sprayer.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Gunner_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.a = Math.PI / 2 - Math.PI / 16;
    this.b = Math.PI / 2 + Math.PI / 16;
    this.n = 10;

    if(params != null) {
        this.a = params.a || this.a;
        this.b = params.b || this.b;
        this.n = params.n || this.n;
    }

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.period = this.period;
    emitterParams.angle = this.angle;
    emitterParams.aim_x = this.aimX;
    emitterParams.aim_y = this.aimY;
    emitterParams.a = this.a;
    emitterParams.b = this.b;
    emitterParams.n = this.n;
    emitterParams.aim = this.aim;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.emitters.push(new my.BHell_Emitter_Spray(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Burster enemy class. Gunner with a Burst emitter.
 *
 * Additional parameters:
 *
 * - shots: number of bullets to fire in one burst,
 * - dispersion: radius of the dispersion circle.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Gunner_Base
 */
var BHell_Enemy_Burster = my.BHell_Enemy_Burster = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Burster.prototype = Object.create(BHell_Enemy_Gunner_Base.prototype);
BHell_Enemy_Burster.prototype.constructor = BHell_Enemy_Burster;

BHell_Enemy_Burster.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Gunner_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.shots = 30;
    this.dispersion = 50;

    if (params != null) {
        this.shots = params.shots || this.shots;
        this.dispersion = params.dispersion || this.dispersion;
    }

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.period = this.period;
    emitterParams.aim = this.aim;
    emitterParams.angle = this.angle;
    emitterParams.aim_x = this.aimX;
    emitterParams.aim_y = this.aimY;
    emitterParams.shots = this.shots;
    emitterParams.dispersion = this.dispersion;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.emitters.push(new my.BHell_Emitter_Burst(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Starshooter enemy class. Gunner with a star pattern (360 degrees Spray emitter).
 *
 * Additional parameters:
 *
 * - n: number of points for the star.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Gunner_Base
 */
var BHell_Enemy_Starshooter = my.BHell_Enemy_Starshooter = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Starshooter.prototype = Object.create(BHell_Enemy_Gunner_Base.prototype);
BHell_Enemy_Starshooter.prototype.constructor = BHell_Enemy_Starshooter;

BHell_Enemy_Starshooter.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Gunner_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.n = 5;

    if (params != null) {
        this.shots = params.shots || this.shots;
        this.n = params.n || this.n;
    }

    var emitterParams = {};
    emitterParams.x = 0;
    emitterParams.y = 0;
    emitterParams.period = this.period;
    emitterParams.angle = this.angle;
    emitterParams.aim_x = this.aimX;
    emitterParams.aim_y = this.aimY;
    emitterParams.aim = this.aim;
    emitterParams.always_aim = this.alwaysAim;
    emitterParams.a = 0;
    emitterParams.b = 2 * Math.PI;
    emitterParams.n = this.n;
    emitterParams.bullet = Object.assign({}, this.bullet);

    this.emitters.push(new my.BHell_Emitter_Spray(this.x, this.y, emitterParams, parent, my.enemyBullets));
};

/**
 * Swirler enemy class. Starshooter with slowly rotating angle.
 *
 * Additional parameters:
 *
 * - rotation_angle: rotation speed (in radians per frame) of the bullets' swirl.
 * @constructor
 * @memberOf BHell
 * @extends BHell.BHell_Enemy_Starshooter
 */
var BHell_Enemy_Swirler = my.BHell_Enemy_Swirler = function() {
    this.initialize.apply(this, arguments);
};

BHell_Enemy_Swirler.prototype = Object.create(BHell_Enemy_Starshooter.prototype);
BHell_Enemy_Swirler.prototype.constructor = BHell_Enemy_Swirler;

BHell_Enemy_Swirler.prototype.initialize = function (x, y, image, params, parent, enemyList) {
    BHell_Enemy_Starshooter.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

    this.rotation_angle = 0.01;

    if (params != null) {
        this.rotation_angle = params.rotation_angle || this.rotation_angle;
    }
};

BHell_Enemy_Swirler.prototype.update = function () {
    this.emitters.forEach(e => {
        e.a += this.rotation_angle;
        e.b += this.rotation_angle;
    });

    BHell_Enemy_Starshooter.prototype.update.call(this);
};

return my;
} (BHell || {}));

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

var BHell = (function (my) {

/**
 * Enemy generator class. Periodically spawns an enemy.
 * @constructor
 * @memberOf BHell
 */
var BHell_Generator = my.BHell_Generator = function() {
    this.initialize.apply(this, arguments);
};

BHell_Generator.prototype = Object.create(Object.prototype);
BHell_Generator.prototype.constructor = BHell_Generator;

/**
 * Constructor. The enemy parameters are defined at three different levels:
 *
 * 1. Enemy class default values,
 * 2. JSON configuration file,
 * 3. Game Event's comments.
 *
 * Each level overrides the previous one, allowing a fine grained control over each generator.
 * @param x X spawning coordinate.
 * @param y Y spawning coordinate.
 * @param image Sprite for the spawned enemies.
 * @param name Enemy name (from the JSON configuration file).
 * @param n Number of enemies to be generated.
 * @param period Spawn period in frames (i.e. 60 generates an enemy every second).
 * @param sync True if the stage must wait for every enemy of this generator to be spawned.
 * @param stop True if the map should stop when this generator is active.
 * @param comments RPGMaker's Comment string containing overridden parameters for the enemies.
 * @param enemies Array where the enemies will be pushed.
 * @param parent Container for the Sprite objects.
 */
BHell_Generator.prototype.initialize = function (x, y, image, name, n, period, sync, stop, comments, enemies, parent) {
    this.x = x;
    this.y = y;
    this.image = image;
    this.n = n;
    this.i = 0;
    this.period = period;
    this.sync = sync;
    this.stop = stop;
    this.enemies = enemies;
    this.parent = parent;
    this.params = {};
    this.enemyClass = null;

    // Fetch the correct enemy class from the JSON file.
    var tmp = $dataBulletHell.enemies.filter(e => {
        return e.name === name;
    });
    if (tmp.length > 0) {
        var enemy = tmp[0];
        var regex = /BHell_Enemy_[A-Za-z0-9_]+/;
        if (regex.exec(enemy.class) != null) {
            this.enemyClass = eval("my." + enemy.class); // Safe-ish, since Only class names can be evaluated.
            this.params = Object.assign({}, enemy.params);
        }
    }

    // If there are overriding comments, parse them and replace every redefined property in this.params.
    if (comments != null && comments !== "") {
        var str = "{" + comments.replace(/\s/g, "") + "}";
        try {
            var obj = JSON.parse(str);
            this.params = this.params || {};

            var dummyEnemy = new my.BHell_Sprite(image.characterName, image.characterIndex, image.direction, image.pattern, true);

            for (var k in obj) {
                switch (k) {
                    case "A": case "B": case "C": case "D":
                    this.params[k] = {};
                    this.params[k].x = my.parse(obj[k].x, this.x, this.y, dummyEnemy.patternWidth(), dummyEnemy.patternHeight(), Graphics.width, Graphics.height);
                    this.params[k].y = my.parse(obj[k].y, this.x, this.y, dummyEnemy.patternWidth(), dummyEnemy.patternHeight(), Graphics.width, Graphics.height);
                        break;
                    case "bullet":
                        this.params[k] = {};
                        this.params[k].speed = obj[k].speed || this.params[k].speed || null;
                        this.params[k].sprite = obj[k].sprite || this.params[k].sprite || null;
                        this.params[k].direction = obj[k].direction || this.params[k].direction || null;
                        this.params[k].frame = obj[k].frame || this.params[k].frame || null;
                        this.params[k].index = obj[k].index || this.params[k].index || null;
                        this.params[k].animated = obj[k].animated || this.params[k].animated || null;
                        this.params[k].animation_speed = obj[k].animation_speed || this.params[k].animation_speed || null;
                        break;
                    default:
                        if (k !== "boss_bgm") {
                            this.params[k] = my.parse(obj[k], this.x, this.y, dummyEnemy.patternWidth(), dummyEnemy.patternHeight(), Graphics.width, Graphics.height);
                        }
                        else {
                            this.params[k] = obj[k];
                        }
                        break;
                }
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    this.bossGenerator = this.params.boss || false;


    this.bossBgm = this.params.boss_bgm || null;

    if (this.params.resume_bgm === false || this.params.resume_bgm === "false") {
        this.resumeBgm = false;
    }
    else {
        this.resumeBgm = true;
    }
};

/**
 * Updates the generator (called every frame). If there are enemies left to be spawned, spawn one every this.period frames.
 */
BHell_Generator.prototype.update = function () {
    if (this.enemyClass != null) {
        if (this.i === 0 && this.n > 0) {
            this.n--;
            this.enemies.push(new this.enemyClass(this.x, -50, this.image, this.params, this.parent, this.enemies));
        }
        this.i = (this.i + 1) % this.period;
    }
    else {
        this.n = 0;
    }
};

return my;
} (BHell || {}));

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
     * @param counterclockwise If true orbits in the counterclockwise direction.
     */
    BHell_Mover_Orbit.prototype.initialize = function (radius, counterclockwise) {
        BHell_Mover_Base.prototype.initialize.call(this);

        this.inPosition = false;
        this.radius = radius;
        this.counterclockwise = counterclockwise;
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

                if (this.counterclockwise) {
                    this.t -= speed * Math.PI / 360;
                }
                else {
                    this.t += speed * Math.PI / 360;
                }
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

var BHell = (function (my) {

/**
 * Parser function. Takes a string and evaluates it as an arithmetic expression after replacing the following placeholders:
 *
 * - pi: 3.14...,
 * - x: x coordinate of something,
 * - y: y coordinate of something,
 * - w: width of something,
 * - h: height of something,
 * - sw: screen width,
 * - sh: screen height.
 *
 * @param str String to be parsed.
 * @param x number with which "x" will be replaced on the expression.
 * @param y number with which "y" will be replaced on the expression.
 * @param w number with which "w" will be replaced on the expression.
 * @param h number with which "h" will be replaced on the expression.
 * @param sw number with which "sw" will be replaced on the expression.
 * @param sh number with which "sh" will be replaced on the expression.
 * @returns {*} true/false or a number if the string could be parsed correctly, null otherwise.
 * @memberOf BHell
 */
    my.parse = function(str, x, y, w, h, sw, sh) {
    var ret = null;
    var regex = /[0-9.+\-*/()]+/;

    if (typeof(str) === "number" || typeof(str) === "boolean") {
        ret = str;
    }
    else if (typeof(str) === "string") {
        if (str === "true") {
            ret = true;
        }
        else if (str === "false") {
            ret = false;
        }
        else {
            str = str.replace(/pi/g, String(Math.PI));
            str = str.replace(/x/g, String(x));
            str = str.replace(/y/g, String(y));
            str = str.replace(/sw/g, String(sw));
            str = str.replace(/sh/g, String(sh));
            str = str.replace(/w/g, String(w));
            str = str.replace(/h/g, String(h));
            str = str.replace(/ */g, "");

            // Since all the characters in the string should be at this point digits, operators and parentheses, eval should be safe.
            if (regex.exec(str) != null) {
                ret = eval("Number(" + str + ")");
            }
        }
    }

    return ret;
};

return my;
} (BHell || {}));

var BHell = (function (my) {

    /**
     * Player class.
     * @constructor
     * @memberOf BHell
     * @extends BHell.BHell_Sprite
     */
    var BHell_Player = my.BHell_Player = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Player.prototype = Object.create(my.BHell_Sprite.prototype);
    BHell_Player.prototype.constructor = BHell_Player;

    /**
     * Constructor. Creates a player from the JSON configuration file.
     *
     * Parameters:
     *
     * - name: Player's name,
     * - sprite: Charset image,
     * - speed: Player's speed rank (D = 1, C = 2, B = 3, A = 4, S = 5. The actual speed is 2 * rank pixels per frame),
     * - rate: Player's rate of fire rank (D, C, B, A, S. See {@link BHell.BHell_Emitter_Factory}).
     * - power: Player's power rank (D, C, B, A, S. See {@link BHell.BHell_Emitter_Factory}),
     * - bombs: Player's initial stock of bombs (D = 1, C = 2, B = 3, A = 4, S = 5),
     * - unlocked: If true the player can be used on a stage,
     * - can_be_bought: If true the player can be bought at the shop,
     * - price: The player's price at the shop,
     * - hitbox_w: Width of the player's hitbox,
     * - hitbox_h: Height of the player's hitbox,
     * - index: Charset index,
     * - direction: Charset direction (note: lives displayed on the HUD will always use direction 2),
     * - frame: Initial charset frame index (0-2),
     * - animation_speed: Number of updates required for frame change,
     * - animated: If true the sprite will be animated,
     * - select_se: Sound effect played when selecting the player,
     * - spawn_se: Sound effect played when the player has spawned,
     * - death_se: Sound effect played on player's death,
     * - victory_se: Sound effect played on stage cleared,
     * - bomb: Bomb parameters (see {@link BHell.BHell_Bomb_Base} and derived classes),
     * - emitters: Array of emitters (see {@link BHell.BHell_Emitter_Base} and derived classes).
     *
     * @param id Id of the player to create.
     * @param lives Initial number of lives (-1: unlimited).
     * @param unlimitedBombs If true, the bombs are infinite.
     * @param parent Container for the sprites.
     */
    BHell_Player.prototype.initialize = function (id, lives, unlimitedBombs, parent) {
        var playerData = $dataBulletHell.players[id];
        var playerParams = Object.assign({}, $gamePlayer.bhellPlayers.filter(p => {
            return p.index === id;
        })[0]);

        ["speed", "bombs"].forEach(p => {
            switch (playerParams[p]) {
                case "D":
                    playerParams[p] = 1;
                    break;
                case "C":
                    playerParams[p] = 2;
                    break;
                case "B":
                    playerParams[p] = 3;
                    break;
                case "A":
                    playerParams[p] = 4;
                    break;
                case "S":
                    playerParams[p] = 5;
                    break;
                default:
                    playerParams[p] = 1;
                    break;
            }
        });

        my.BHell_Sprite.prototype.initialize.call(this, playerData.sprite, playerData.index, playerData.direction, playerData.frame, playerData.animated, playerData.animation_speed);

        this.parent = parent;
        this.parent.addChild(this);
        this.emitters = [];
        this.immortal = true;
        this.justSpawned = true;
        this.lives = lives;
        if (unlimitedBombs) {
            this.startingBombs = -1;
        }
        else {
            this.startingBombs = playerParams.bombs;
        }

        this.bombs = this.startingBombs;

        this.spawn_se = playerData.spawn_se;
        this.death_se = playerData.death_se;
        this.victory_se = playerData.victory;

        this.won = false;
        this.bonusLives = 0;

        this.hitboxW = my.parse(playerData.hitbox_w, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height);
        this.hitboxH = my.parse(playerData.hitbox_h, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height);
        this.grazingRadius = my.parse(playerData.grazing_radius, this.x, this.y, this.patternWidth(), this.patternHeight(), Graphics.width, Graphics.height);

        this.speed = playerParams.speed * 2;

        playerData.emitters.forEach(e => {
            var emitter = my.BHell_Emitter_Factory.parseEmitter(e, this.x, this.y, this.patternWidth(), this.patternHeight(), playerParams.rate, playerParams.power, this.parent, my.friendlyBullets);
            if (emitter != null) {
                this.emitters.push(emitter);
                this.parent.addChild(emitter);
            }
        });

        if (playerData.bomb != null) {
            var regex = /BHell_Bomb_[A-Za-z0-9_]+/;
            if (regex.exec(playerData.bomb.class) != null) {
                var bombClass = eval("my." + playerData.bomb.class); // Safe-ish, since Only class names can be evaluated.
                this.bomb = new bombClass(this.parent, playerData.bomb, my.friendlyBullets);
            }
            else {
                this.bomb = new my.BHell_Bomb_Base(this.parent, playerData.bomb, my.friendlyBullets);
            }
        }

        this.dx = 0;
        this.dy = 0;
    };

    /**
     * Checks if the player collides at given coordinates.
     * @param x X coordinate.
     * @param y Y coordinate.
     * @returns {boolean} True if (x, y) is inside the player's hitbox.
     */
    BHell_Player.prototype.checkCollision = function (x, y) {
        var dx = Math.abs(this.x - x);
        var dy = Math.abs(this.y - y);
        return (dx < this.hitboxW / 2 && dy < this.hitboxH / 2);
    };

    /**
     * Checks if the player collides at given coordinates.
     * @param x X coordinate.
     * @param y Y coordinate.
     * @returns {boolean} True if (x, y) is inside the player's hitbox.
     */
    BHell_Player.prototype.checkGrazing = function (x, y) {
        var dx = Math.abs(this.x - x);
        var dy = Math.abs(this.y - y);
        return (dx * dx + dy * dy < this.grazingRadius * this.grazingRadius);
    };

    /**
     * Updates the player's sprite, position and bomb. Awards bonus lives if the score allows it.
     */
    BHell_Player.prototype.update = function () {
        my.BHell_Sprite.prototype.update.call(this);
        this.move();
        if (this.bomb != null) {
            this.bomb.update();
        }

        // Make the immortality last 5 seconds.
        if (this.immortal && this.immortalTimeout >= 0) {
            this.immortalTimeout++;

            if (this.immortalTimeout > my.immortalTimeout) {
                this.immortal = false;
                this.immortalTimeout = -1;
                this.opacity = 255;
            }
        }

        this.updateBonusLives();
    };

    /**
     * Checks if the score has reached the plugin's life_bonus_first and life_bonus_next thresholds and awards
     * bonus lives accordingly.
     *
     * For example, if the bonus thresholds are set to 20000 and 50000, the player is awarded a life at: 20000 points,
     * 70000 (20000 + 50000), 120000 (20000 + 50000 + 50000), 170000, etc.
     */
    BHell_Player.prototype.updateBonusLives = function () {
        if (my.lifeBonusFirst > 0 && my.lifeBonusNext > 0) {
            if ($gameBHellResult.score >= this.bonusLives * my.lifeBonusNext + my.lifeBonusFirst) {
                this.bonusLives++;
                this.lives++;
            }
        }
    };

    /**
     * Sets a destination for the player.
     * @param x X coordinate of the destination.
     * @param y Y coordinate of the destination.
     */
    BHell_Player.prototype.moveTo = function (x, y) {
        this.dx = x - this.x;
        this.dy = y - this.y;
    };

    /**
     * Sets a relative destination for the player.
     * @param dx Relative x coordinate of the destination.
     * @param dy Relative y coordinate of the destination.
     */
    BHell_Player.prototype.deltaTo = function (dx, dy) {
        this.dx = dx;
        this.dy = dy;
    };

    /**
     * Sets a destination in steps (multiples of this.speed).
     * @param h Horizontal number of steps.
     * @param v Vertical number of steps.
     */
    BHell_Player.prototype.step = function (h, v) {
        this.dx += h * this.speed;
        this.dy += v * this.speed;
    };

    /**
     * Moves the player and all its emitters.
     * If the player has just been spawned, moves it towards the starting position, otherwise towards its destination
     * (set with moveTo(x, y) and/or step(h, v) ).
     *
     * To avoid a death loop during a respawn, the player will wait until the enemy bullets have disappeared from screen
     * (eventually destroying them after a five seconds timeout).
     */
    BHell_Player.prototype.move = function () {
        // If the player has just been spawned (outside the screen), move to the starting position.
        if (this.justSpawned === true) {
            // Wait until the enemy bullets are cleared. If they are not cleared after five seconds, it destroys them.
            if (my.enemyBullets.length === 0) {
                var dy = Graphics.height * 0.9 - this.y;

                if (Math.abs(dy) <= this.speed * 0.3) {
                    this.y = Math.round(Graphics.height * 0.9);
                    this.immortalTimeout = 0;
                    my.controller.stopShooting = false;
                    this.justSpawned = false;
                    this.usingTouch = false;
                    this.dx = 0;
                    this.dy = 0;
                    if (this.spawn_se != null) {
                        AudioManager.playSe(this.spawn_se);
                    }
                }
                else {
                    this.y += Math.max(dy, -this.speed * 0.3);
                }
            }
            else {
                this.bulletTimeout++;
                if (this.bulletTimeout > my.bulletTimeout) {
                    my.controller.destroyEnemyBullets();
                }
            }
        }
        else if (this.won === true) {
            var dx = Graphics.width / 2 - this.x;
            this.y -= this.speed;
            if (dx > 0) {
                this.x += Math.min(dx, this.speed);
            }
            else if (dx < 0) {
                this.x += Math.max(dx, -this.speed);
            }

            if (this.y < -this.height) {
                my.playing = false;
                if (this.victory_se != null) {
                 my.playing |= AudioManager._seBuffers != null && AudioManager._seBuffers.filter(function(audio) {
                     return audio.isPlaying();
                 }).length !== 0;
                }
                if (my.victoryMe != null) {
                    my.playing |= AudioManager._meBuffer != null && AudioManager._meBuffer.isPlaying();
                }
            }
        }
        else { // Otherwise move towards the destination.
            var angle = Math.atan2(this.dy, this.dx);

            if (this.dx > 0) {
                this.x += Math.min(this.dx, Math.cos(angle) * this.speed);
                this.dx -= Math.min(this.dx, Math.cos(angle) * this.speed);
            }
            else if (this.dx < 0) {
                this.x += Math.max(this.dx, Math.cos(angle) * this.speed);
                this.dx -= Math.max(this.dx, Math.cos(angle) * this.speed);
            }

            if (this.dy > 0) {
                this.y += Math.min(this.dy, Math.sin(angle) * this.speed);
                this.dy -= Math.min(this.dy, Math.sin(angle) * this.speed);
            }
            else if (this.dy < 0) {
                this.y += Math.max(this.dy, Math.sin(angle) * this.speed);
                this.dy -= Math.max(this.dy, Math.sin(angle) * this.speed);
            }

            // Prevent the player from leaving the screen.
            if (this.x < this.width / 2) {
                this.x = this.width / 2;
            }
            if (this.x > Graphics.width - this.width / 2) {
                this.x = Graphics.width - this.width / 2;
            }
            if (this.y < this.height / 2) {
                this.y = this.height / 2;
            }
            if (this.y > Graphics.height - this.height / 2) {
                this.y = Graphics.height - this.height / 2;
            }
        }

        // Move the emitters. A forEach can be used since the emitters' array won't change dynamically.
        this.emitters.forEach(e => {
            e.move(this.x, this.y);
        });
    };

    /**
     * Enables/disables shooting for each helper. If the player has just been spawned, shooting is disabled.
     * @param t True to enable shooting.
     */
    BHell_Player.prototype.shoot = function (t) {
        this.emitters.forEach(e => {
            e.shooting = t && this.justSpawned === false;
        });
    };

    /**
     * If there are bombs available, launch one.
     */
    BHell_Player.prototype.launchBomb = function () {
        if (!this.justSpawned && this.bombs !== 0 && !this.bomb.isActive()) {
            this.bombs--;
            $gameBHellResult.bombsUsed++;
            this.bomb.activate(this.x, this.y);
        }
    };

    /**
     * If the player is not immortal, destroy it and respawn it.
     * @param t If true, death was caused by a bullet, otherwise by a crash.
     */
    BHell_Player.prototype.die = function (t) {
        if (this.immortal === false) {
            if (t && this.bombs > 0) { // If a bullet hits the player and there are bombs available, launch one, but waste all of them.
                this.launchBomb();
                this.bombs = 0;
            }
            else {
                this.lives--;
                $gameBHellResult.livesLost++;
                my.controller.stopShooting = true;
                this.bombs = this.startingBombs;
                this.bomb.deactivate();
                my.explosions.push(new my.BHell_Explosion(this.x, this.y, this.parent, my.explosions));
                if (this.death_se != null) {
                    AudioManager.playSe(this.death_se);
                }
                this.spawn();
            }
        }
    };

    /**
     * Plays the victory SE and moves the player to the top of the map.
     */
    BHell_Player.prototype.win = function () {
        if (this.won === false) {
            this.won = true;
            if (this.victory_se != null) {
                AudioManager.playSe(this.victory_se);
            }

            if (my.victoryMe != null) {
                AudioManager.playMe(my.victoryMe);
            }
        }
    };

    /**
     * Spawn the player outside the screen.
     */
    BHell_Player.prototype.spawn = function () {
        this.x = Math.round(Graphics.width / 2);
        this.y = Math.round(Graphics.height + this.height);
        this.justSpawned = true;
        this.bulletTimeout = 0;
        this.immortal = true;
        this.immortalTimeout = -1;
        this.opacity = 100;
    };

    return my;
}(BHell || {}));

var BHell = (function (my) {

/**
 * Initial scene for the bullet hell minigame. Allows to choose a player, displaying its shooting and bombing patterns.
 * @constructor
 * @memberOf BHell
 */
var Scene_BHell_Init = my.Scene_BHell_Init = function() {
    this.initialize.apply(this, arguments);
};

Scene_BHell_Init.prototype = Object.create(Scene_Base.prototype);
Scene_BHell_Init.prototype.constructor = Scene_BHell_Init;

/**
 * Constructor. Caches all the sprites related to the player and its bullets.
 */
Scene_BHell_Init.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);

    if ($dataBulletHell.players.length === 0) {
        var error = "No player defined in the JSON file.";
        console.error(error);
        Graphics.printError("Error", error);
    }
    else if ($gamePlayer.bhellPlayers.filter(p => {return p.unlocked === true;}).length === 0) {
        console.warn("No player available. Returning to Scene_Map.");
    }



    var regex = /"(?:bullet_)?sprite":(?:null|"([^"]*)")/g;
    var grps = null;
    do {
        grps = regex.exec(JSON.stringify($dataBulletHell));
        if (grps != null && grps[1] != null) {
            ImageManager.loadCharacter(grps[1], 0);
        }
    }
    while (grps != null);

    regex = /"icon":(?:null|"([^"]*)")/g;
    grps = null;
    do {
        grps = regex.exec(JSON.stringify($dataBulletHell));
        if (grps != null && grps[1] != null) {
            ImageManager.loadSystem(grps[1], 0);
        }
    }
    while (grps != null);

    this.j = -1;
    this.i = 0;
};

Scene_BHell_Init.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    this.createWindowLayer();
    this.createPlayersWindow();
};

/**
 * Starts the scene. Saves the previous BGM and BGS, and plays my.initBgm.
 */
Scene_BHell_Init.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    SceneManager.clearStack();
    this.startFadeIn(this.fadeSpeed(), false);

    my.prevBgm = AudioManager.saveBgm();
    my.prevBgs = AudioManager.saveBgs();
    if (my.initBgm != null) {
        AudioManager.fadeOutBgs(1);
        AudioManager.playBgm(my.initBgm);
        AudioManager.fadeInBgm(1);
    }

};

/**
 * Updates the scene. Every 5 seconds, the player stops shooting and throws a bomb.
 * If a different player is selected, displays the new one.
 */
Scene_BHell_Init.prototype.update = function() {
    if ($gamePlayer.bhellPlayers.filter(p => {return p.unlocked === true;}).length === 0) {
        SceneManager.goto(Scene_Map);
    }
    else if ($gamePlayer.bhellPlayers.filter(p => {return p.unlocked === true;}).length === 1) {
        my.playerId = $gamePlayer.bhellPlayers.findIndex(p => {return p.unlocked === true;});
        SceneManager.goto(my.Scene_BHell);
    }

    if (!this.isBusy()) {
        this.playersWindow.open();

        if (this.playersWindow.index() !== this.j) {
            this.removeChildren();
            my.friendlyBullets = [];
            my.enemyBullets = [];
            this.addChild(this.playersWindow);
            this.addChild(this.statusWindow);
            this.statusWindow.open();

            var index = $gamePlayer.bhellPlayers.filter(p => {
                return p.unlocked === true;
            })[this.playersWindow.index()].index;

            this.statusWindow.selectPlayer(index);

            my.player = new my.BHell_Player(index, 0, true, this);
            my.player.justSpawned = false;
            my.player.opacity = 255;
            my.player.x = Graphics.width / 2;
            my.player.y = Graphics.height / 2;

            this.i = 0;
            this.j = this.playersWindow.index();
        }

        if (!my.player.bomb.isActive()) {
            this.i = (this.i + 1) % 300;
            if (this.i === 0) {
                my.player.launchBomb();
            }
            else {
                my.player.shoot(true);
            }
        }
        else {
            my.player.shoot(false);
        }

        for (i = 0; i < my.friendlyBullets.length; i++) {
            b = my.friendlyBullets[i];
            if (b.x < 0 || b.y < 0 || b.x > Graphics.width || b.y > Graphics.height) {
                b.destroy();
                i--;
            }
        }
    }
    Scene_Base.prototype.update.call(this);
};

/**
 * Overrides Scene_Base.updateChildren, since the forEach caused some graphical bugs due to children removing
 * themselves during an update.
 */
Scene_BHell_Init.prototype.updateChildren = function () {
    // Replaces the base class' forEach.
    for (var i = 0; i < this.children.length; i++) {
        var tmpChild = this.children[i];
        if (this.children[i].update) {
            this.children[i].update();

            if (tmpChild !== this.children[i]) { // If the child has detached itself, don't skip the next one.
                i--;
            }
        }
    }
};

Scene_BHell_Init.prototype.isBusy = function() {
    return this.playersWindow.isClosing() || Scene_Base.prototype.isBusy.call(this);
};

Scene_BHell_Init.prototype.terminate = function() {
    Scene_Base.prototype.terminate.call(this);
    SceneManager.snapForBackground();
};

/**
 * Creates the players' window and adds an entry for each of the available players.
 */
Scene_BHell_Init.prototype.createPlayersWindow = function() {
    this.playersWindow = new my.BHell_Window_Players();

    this.statusWindow = new my.BHell_Window_Status();

    for (var i = 0; i < $dataBulletHell.players.length; i++) {
        if ($gamePlayer.bhellPlayers[i].unlocked === true) {
            this.playersWindow.setHandler(String(i),  this.selectPlayer.bind(this, i));
        }
    }
    this.addWindow(this.playersWindow);
    this.addWindow(this.statusWindow);
};

/**
 * Player selection callback. Starts the minigame with the selected player.
 * @param i The selected player's id.
 */
Scene_BHell_Init.prototype.selectPlayer = function(i) {
    this.playersWindow.close();
    this.fadeOutAll();
    my.playerId = i;
    if ($dataBulletHell.players[i].select_se != null) {
        AudioManager.playSe($dataBulletHell.players[i].select_se);
    }
    SceneManager.goto(my.Scene_BHell);
};

return my;
} (BHell || {}));

var BHell = (function (my) {

    /**
     * Bullet hell minigame main scene class. Handles the user input and displays every minigame's object on screen.
     * @constructor
     * @memberOf BHell
     */
    var Scene_BHell = my.Scene_BHell = function () {
        this.initialize.apply(this, arguments);
    };

    Scene_BHell.prototype = Object.create(Scene_Base.prototype);
    Scene_BHell.prototype.constructor = Scene_BHell;

    Scene_BHell.prototype.initialize = function () {
        Scene_Base.prototype.initialize.call(this);
    };

    Scene_BHell.prototype.create = function () {
        Scene_Base.prototype.create.call(this);
        this.loadMap();
        this.createWindowLayer();
    };

    /**
     * Caches all the sprites required for the stage.
     */
    Scene_BHell.prototype.cacheSprites = function () {
        var regex = /"sprite":(?:null|"([^"]*)")/g;
        var grps = null;
        do {
            grps = regex.exec(JSON.stringify($dataBulletHell));
            if (grps != null && grps[1] != null) {
                ImageManager.loadCharacter(grps[1], 0);
            }
        }
        while (grps != null);

        regex = /"icon":(?:null|"([^"]*)")/g;
        grps = null;
        do {
            grps = regex.exec(JSON.stringify($dataBulletHell));
            if (grps != null && grps[1] != null) {
                ImageManager.loadSystem(grps[1], 0);
            }
        }
        while (grps != null);

        ImageManager.loadCharacter(my.explosion, 0);

        $dataMap.events.forEach(e => {
            if (e != null) {
                ImageManager.loadCharacter(e.pages[0].image.characterName, 0);
            }
        });
    };

    /**
     * Fetches the map's data.
     */
    Scene_BHell.prototype.loadMap = function () {
        if (my.map >= 0) {
            DataManager.loadMapData(my.map);
            my.stage = new Game_Map();
        }
    };

    /**
     * Checks if the scene is ready to run and executes the callbacks.
     * @returns {boolean|Boolean} True if the map was loaded and the sprites were cached.
     */
    Scene_BHell.prototype.isReady = function () {
        if (!this._mapLoaded && DataManager.isMapLoaded()) {
            this.onMapLoaded();
            this._mapLoaded = true;
        }
        if (this._mapLoaded && ImageManager.isReady()) {
            this.cacheSprites();
            this._spritesLoaded = true;
        }
        return this._spritesLoaded && Scene_Base.prototype.isReady.call(this);
    };

    /**
     * Callback executed on map loaded. Sets up the spriteset, the controller, the windows and the HUD.
     */
    Scene_BHell.prototype.onMapLoaded = function () {

        my.stage.setup(Scene_BHell.level);
        my.stage._displayX = 0;
        my.stage._displayY = my.stage.height() - my.stage.screenTileY();

        this._spriteset = new my.BHell_Spriteset();
        this.addChild(this._spriteset);

        my.controller = new my.BHell_Controller(my.stage, my.playerId, 3, this._spriteset._tilemap);

        if ($dataMap.autoplayBgm) {
            my.bgm = $dataMap.bgm;
            AudioManager.playBgm(my.bgm);
        }
        if ($dataMap.autoplayBgs) {
            AudioManager.playBgs($dataMap.bgs);
        }

        this.createHUD();
        this.createWindows();
    };

    Scene_BHell.prototype.start = function () {
        Scene_Base.prototype.start.call(this);
        SceneManager.clearStack();

        this.startFadeIn(this.fadeSpeed(), false);

        window.addEventListener("blur", this.onBlur.bind(this));
        document.addEventListener("touchstart", this.onTouchOutside.bind(this));
    };

    /**
     * Updates the scene. If the game is playing, it checks the user inputs and updates the controller and the HUD,
     * otherwise it terminates the minigame, returning to Scene_Map.
     */
    Scene_BHell.prototype.update = function () {
        if (!this.isBusy()) {
            if (my.playing) {
                this.updateInput();
                my.controller.update();
                this.updateHUD();
            }
            else {
                if (my.bulletsHit + my.bulletsLost > 0) {
                    $gameBHellResult.hitRatio = my.bulletsHit / (my.bulletsHit + my.bulletsLost) * 100;
                }
                this.fadeOutAll();
                AudioManager.stopBgm();
                AudioManager.stopBgs();
                if (my.prevBgm != null) {
                    AudioManager.replayBgm(my.prevBgm);
                }
                if (my.prevBgs != null) {
                    AudioManager.replayBgs(my.prevBgs);
                }
                TouchInput.clear();
                SceneManager.goto(Scene_Map);
            }
        }
        Scene_Base.prototype.update.call(this);
    };

    Scene_BHell.prototype.isBusy = function () {
        return ((this.messageWindow && this.messageWindow.isClosing()) ||
            Scene_Base.prototype.isBusy.call(this));
    };

    Scene_BHell.prototype.updateMain = function () {
        var active = this.isActive();
        my.stage.update(active);
        $gameTimer.update(active);
        $gameScreen.update();
    };


    Scene_BHell.prototype.terminate = function () {
        Scene_Base.prototype.terminate.call(this);
        SceneManager.snapForBackground();
        window.removeEventListener("blur", this.onBlur.bind(this));
        document.removeEventListener("touchstart", this.onTouchOutside.bind(this));
    };

    /**
     * Stops the gameplay and opens the pause window.
     */
    Scene_BHell.prototype.pause = function () {
        if (!my.controller.paused) {
            my.controller.paused = true;
            my.bgm = AudioManager.saveBgm();
            AudioManager.stopBgm();
            this.pauseWindow.open();
            this.pauseWindow.activate();
        }
    };

    /**
     * On blur event handler. If the window looses focus, pause the game.
     * @param event Blur event.
     */
    Scene_BHell.prototype.onBlur = function (event) {
        this.pause();
    };

    /**
     * On touch start event handler. If a touch begins outside the game canvas, pause the game.
     * @param event TouchEvent.
     */
    Scene_BHell.prototype.onTouchOutside = function(event) {
        for (var i = 0; i < event.changedTouches.length; i++) {
            var touch = event.changedTouches[i];
            var x = Graphics.pageToCanvasX(touch.pageX);
            var y = Graphics.pageToCanvasY(touch.pageY);
            if (!Graphics.isInsideCanvas(x, y)) {
                this.pause();
            }
        }
    };



    /**
     * Handles the user input.
     * Left mouse or "ok" button: shoot,
     * Right mouse or "shift" button: launch bomb,
     * Any click (left or right) or arrow keys: move the player,
     * "Escape" button: toggle pause.
     */
    Scene_BHell.prototype.updateInput = function () {
        if (!my.controller.paused && !$gameMessage.isBusy()) {
            if (Input.isTriggered('escape')) {
                this.pause();
            }
            else {
                if (this.messageWindow.isOpening()) {
                    TouchInput.clear();
                    Input.clear();
                }
                else {
                    if (this.usingTouch === "touch") {
                        my.player.deltaTo(TouchInput.dx, TouchInput.dy);
                    }
                    else if (this.usingTouch === "mouse") {
                        my.player.moveTo(TouchInput.x, TouchInput.y);
                    }

                    if (Input.isLastInputGamepad()) {
                        var dx = Input.readAxis(0, $gameSystem.controllerDeadzone);
                        var dy = Input.readAxis(1, $gameSystem.controllerDeadzone);

                        dx *= $gameSystem.controllerSpeedMultiplier;
                        dy *= $gameSystem.controllerSpeedMultiplier;

                        my.player.step(dx, dy);

                    }
                    else {
                        if (Input.isPressed('up')) {
                            my.player.step(0, -1);
                        }
                        if (Input.isPressed('down')) {
                            my.player.step(0, +1);
                        }
                        if (Input.isPressed('left')) {
                            my.player.step(-1, 0);
                        }
                        if (Input.isPressed('right')) {
                            my.player.step(+1, 0);
                        }
                    }

                    if (TouchInput.isPressed()) {
                        if (TouchInput._screenPressed) {
                            this.usingTouch = "touch";
                        }
                        else {
                            this.usingTouch = "mouse";
                        }
                    }
                    else {
                        this.usingTouch = "no";
                    }

                    if (TouchInput.isPressed() || Input.isPressed('ok')) {
                        my.player.shoot(true);
                    }
                    else {
                        my.player.shoot(false);
                    }

                    if (TouchInput.isCancelled() || Input.isPressed('shift')) {
                        my.player.launchBomb();
                    }
                }
            }
        }
    };

    /**
     * Updates the HUD (number of lives, number of bombs and score).
     * For a more dynamic "effect", the score is added "slowly" with small increments.
     */
    Scene_BHell.prototype.updateHUD = function () {
        this.hud.bitmap.clear();

        var player = $dataBulletHell.players[my.playerId];

        var x;
        var y;
        var i;

        // Update lives:
        var w = this.life.patternWidth();
        var h = this.life.patternHeight();
        var sx = (this.life.characterBlockX() + this.life.characterPatternX()) * w;
        var sy = (this.life.characterBlockY() + this.life.characterPatternY()) * h;
        for (i = 0; i < my.player.lives; i++) {
            x = i * w / 2 + 10;
            y = Graphics.height - h - 10;
            this.hud.bitmap.blt(this.life.bitmap, sx, sy, w, h, x, y, w, h);
        }

        sx = this.bomb.width / 16 * (player.bomb.icon_index % 16);
        sy = this.bomb.height / 20 * Math.floor(player.bomb.icon_index / 16);
        w = this.bomb.width / 16;
        h = this.bomb.height / 20;
        for (i = 0; i < my.player.bombs; i++) {
            x = i * w + 10;
            y = Graphics.height - h - 10 - this.life.height;
            this.hud.bitmap.blt(this.bomb, sx, sy, w, h, x, y, w, h);
        }

        // Update score: Graphic effect for score accumulation.
        var delta = $gameBHellResult.score - my.scoreAccumulator;
        if (delta !== 0 && !my.controller.paused) {
            my.scoreAccumulator += delta / 10;
        }


        this.hud.bitmap.drawText(Number(Math.round(my.scoreAccumulator)), 10, 10, Graphics.width - 20, 36, "right");

        if (my.bossOnScreen === true) {
            this.hud.bitmap._context.lineWidth = 1;
            this.hud.bitmap._context.strokeStyle = "rgba(0, 0, 0, 0.8)";
            this.hud.bitmap._context.strokeRect(10, 3, Graphics.width - 20, 10);
            if (my.bossMaxHp !== 0) {
                var red = Math.round(255 * my.bossHp / my.bossMaxHp);
                var green = 255 - red;
                this.hud.bitmap.fillRect(11, 4, (Graphics.width - 22) * my.bossHp / my.bossMaxHp, 8, "rgba(" + red + ", " + green + ", 0, 0.8)");
            }
        }
    };

    /**
     * Creates the HUD (the score sprite and a life template).
     */
    Scene_BHell.prototype.createHUD = function () {
        var player = $dataBulletHell.players[my.playerId];
        this.life = new my.BHell_Sprite(player.sprite, player.index, 2, player.frame, false, 0);
        this.bomb = ImageManager.loadSystem(player.bomb.icon, 0);

        my.scoreAccumulator = 0;
        this.hud = new Sprite(new Bitmap(Graphics.width, Graphics.height));
        this.addChild(this.hud);
    };

    /**
     * Creates the windows displayed on pause.
     */
    Scene_BHell.prototype.createWindows = function () {
        this.messageWindow = new Window_Message();
        this.addWindow(this.messageWindow);
        this.messageWindow.subWindows().forEach(function (window) {
            this.addWindow(window);
        }, this);

        if (this.pauseWindow == null) {
            this.pauseWindow = new my.BHell_Window_Pause();
            this.pauseWindow.setHandler("cancel", this.resume.bind(this));
            this.pauseWindow.setHandler("retry", this.retry.bind(this));
            this.pauseWindow.setHandler("deadzone", this.setDeadzone.bind(this));
            this.pauseWindow.setHandler("speed", this.setSpeed.bind(this));
            this.pauseWindow.setHandler("quit", this.quit.bind(this));
        }

        if (this.confirmWindow == null) {
            this.confirmWindow = new my.BHell_Window_Confirm();
            this.confirmWindow.x = this.pauseWindow.x + this.pauseWindow.windowWidth();
        }

        this.addWindow(this.pauseWindow);
        this.addWindow(this.confirmWindow);
        this.addChild(this.messageWindow);
        this.addChild(this.pauseWindow);
        this.addChild(this.confirmWindow);
    };

    /**
     * Resume command, invoked by the pause window's first option. Resumes the game.
     */
    Scene_BHell.prototype.resume = function () {
        this.pauseWindow.close();
        this.pauseWindow.deactivate();
        this.usingTouch = false;
        TouchInput.clear();
        my.controller.paused = false;
        my.bgm = my.bgm || $dataMap.bgm;
        AudioManager.replayBgm(my.bgm);
    };

    /**
     * Retry command, invoked by the pause window's second option. Asks for confirmation.
     */
    Scene_BHell.prototype.retry = function () {
        this.pauseWindow.deactivate();
        this.confirmWindow.y = this.pauseWindow.itemHeight() + this.pauseWindow.y;
        this.confirmWindow.setHandler("accept", this.acceptSelection.bind(this, "retry"));
        this.confirmWindow.setHandler("cancel", this.undo.bind(this));
        this.confirmWindow.open();
        this.confirmWindow.selectSymbol("cancel");
        this.confirmWindow.activate();
    };

    /**
     * Deadzone command, invoked by the pause window's third option.
     */
    Scene_BHell.prototype.setDeadzone = function () {
        $gameSystem.controllerDeadzone += 0.05;
        if ($gameSystem.controllerDeadzone >= 1) {
            $gameSystem.controllerDeadzone = 0;
        }
        this.pauseWindow.activate();
        this.pauseWindow.refresh();
    };


    /**
     * Speed command, invoked by the pause window's fourth option.
     */
    Scene_BHell.prototype.setSpeed = function () {
        $gameSystem.controllerSpeedMultiplier += 0.05;
        if ($gameSystem.controllerSpeedMultiplier >= 1.05) {
            $gameSystem.controllerSpeedMultiplier = 0.1;
        }
        this.pauseWindow.activate();
        this.pauseWindow.refresh();
    };


    /**
     * Quit command, invoked by the pause window's fifth option. Asks for confirmation.
     */
    Scene_BHell.prototype.quit = function () {
        this.pauseWindow.deactivate();
        this.confirmWindow.y = this.pauseWindow.itemHeight() * 2 + this.pauseWindow.y;
        this.confirmWindow.setHandler("accept", this.acceptSelection.bind(this, "quit"));
        this.confirmWindow.setHandler("cancel", this.undo.bind(this));
        this.confirmWindow.open();
        this.confirmWindow.selectSymbol("cancel");
        this.confirmWindow.activate();
    };

    /**
     * Undo command, invoked by the confirmation window's "no" option.
     */
    Scene_BHell.prototype.undo = function () {
        this.confirmWindow.close();
        this.confirmWindow.deactivate();
        this.pauseWindow.activate();
    };

    /**
     * Accept command, invoked by the confirmation window's "yes" option.
     * @param cmd The command to be confirmed ("retry" or "quit").
     */
    Scene_BHell.prototype.acceptSelection = function (cmd) {
        this.confirmWindow.close();
        this.confirmWindow.deactivate();
        this.pauseWindow.close();

        switch (cmd) {
            case "retry":
                $gameBHellResult.retries++;

                SceneManager.goto(my.Scene_BHell_Init);
                break;
            case "quit":
                $gameBHellResult.gaveUp = true;

                my.playing = false;
                break;
        }
    };

    return my;
}(BHell || {}));

var BHell = (function (my) {

    /**
     * Shop scene for the bullet hell minigame. Allows to buy new players and upgrade existing ones.
     * @constructor
     * @memberOf BHell
     */
    var Scene_BHell_Shop = my.Scene_BHell_Shop = function () {
        this.initialize.apply(this, arguments);
    };

    Scene_BHell_Shop.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_BHell_Shop.prototype.constructor = Scene_BHell_Shop;

    /**
     * Constructor. Caches all the sprites required for the preview.
     */
    Scene_BHell_Shop.prototype.initialize = function () {
        Scene_MenuBase.prototype.initialize.call(this);

        this.cacheSprites();
    };

    /**
     * Creates the menu windows.
     */
    Scene_BHell_Shop.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        this.createGoldWindow();
        this.createCommandWindow();
        this.createDummyWindow();
        this.createPreviewWindow();
        this.createStatusWindow();
        this.createBuyPlayersWindow();
        this.createPlayerSelectWindow();
        this.createBuyUpgradesWindow();
    };


    /**
     * Caches all the sprites required for the preview.
     */
    Scene_BHell_Shop.prototype.cacheSprites = function () {
        var regex = /"sprite":(?:null|"([^"]*)")/g;
        var grps = null;
        do {
            grps = regex.exec(JSON.stringify($dataBulletHell));
            if (grps != null && grps[1] != null) {
                ImageManager.loadCharacter(grps[1], 0);
            }
        }
        while (grps != null);

        regex = /"icon":(?:null|"([^"]*)")/g;
        grps = null;
        do {
            grps = regex.exec(JSON.stringify($dataBulletHell));
            if (grps != null && grps[1] != null) {
                ImageManager.loadSystem(grps[1], 0);
            }
        }
        while (grps != null);

        ImageManager.loadCharacter(my.explosion, 0);

        $dataMap.events.forEach(e => {
            if (e != null) {
                ImageManager.loadCharacter(e.pages[0].image.characterName, 0);
            }
        });
    };

    /**
     * Creates the gold window.
     */
    Scene_BHell_Shop.prototype.createGoldWindow = function () {
        this.goldWindow = new Window_Gold(0, 0);
        this.goldWindow.x = Graphics.boxWidth - this.goldWindow.width;
        this.addWindow(this.goldWindow);
    };

    /**
     * Creates the command window and attaches the handlers.
     */
    Scene_BHell_Shop.prototype.createCommandWindow = function () {
        this.commandWindow = new my.BHell_Window_ShopCommand(this.goldWindow.x);
        this.commandWindow.y = 0;
        this.commandWindow.setHandler('players', this.commandBuyPlayers.bind(this));
        this.commandWindow.setHandler('upgrades', this.commandBuyUpgrades.bind(this));
        this.commandWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this.commandWindow);
    };

    /**
     * Creates a dummy window filling the empty space left before choosing a command.
     */
    Scene_BHell_Shop.prototype.createDummyWindow = function () {
        var wy = this.commandWindow.y + this.commandWindow.height;
        var wh = Graphics.boxHeight - wy;
        this.dummyWindow = new Window_Base(0, wy, Graphics.boxWidth, wh);
        this.addWindow(this.dummyWindow);
    };

    /**
     * Creates the preview window, which shows the selected player's behaviour.
     */
    Scene_BHell_Shop.prototype.createPreviewWindow = function () {
        var wx = 456;
        var wy = this.dummyWindow.y;
        var ww = Graphics.boxWidth - wx;
        var wh = this.dummyWindow.height;
        this.previewWindow = new my.BHell_Window_Preview(wx, wy, ww, wh);
        this.previewWindow.hide();
        this.addWindow(this.previewWindow);
    };

    /**
     * Creates the player selection window for the "buy upgrades" command and attaches the command handlers and the preview window.
     */
    Scene_BHell_Shop.prototype.createPlayerSelectWindow = function () {
        var wy = this.dummyWindow.y;
        var wh = this.dummyWindow.height;
        this.selectPlayerWindow = new my.BHell_Window_SelectPlayer(0, wy, wh);
        this.selectPlayerWindow.setPreviewWindow(this.previewWindow);
        this.selectPlayerWindow.hide();

        this.selectPlayerWindow.setHandler('ok', this.onSelectPlayerOk.bind(this));
        this.selectPlayerWindow.setHandler('cancel', this.onSelectPlayerCancel.bind(this));
        this.addWindow(this.selectPlayerWindow);
    };

    /**
     * Creates the players' purchase window and attaches the command handlers, and the preview and status windows.
     */
    Scene_BHell_Shop.prototype.createBuyPlayersWindow = function () {
        var wy = this.dummyWindow.y;
        var wh = this.dummyWindow.height / 2;
        this.buyPlayersWindow = new my.BHell_Window_BuyPlayers(0, wy, wh);
        this.buyPlayersWindow.setPreviewWindow(this.previewWindow);
        this.buyPlayersWindow.setStatusWindow(this.statusWindow);

        // Deselects the parameters from the status window.
        this.statusWindow.setParam(-1);
        this.buyPlayersWindow.hide();

        this.buyPlayersWindow.setHandler('ok', this.onBuyPlayersOk.bind(this));
        this.buyPlayersWindow.setHandler('cancel', this.onBuyPlayersCancel.bind(this));
        this.addWindow(this.buyPlayersWindow);
    };

    /**
     * Creates the status window.
     */
    Scene_BHell_Shop.prototype.createStatusWindow = function () {
        var wy = this.dummyWindow.y + this.dummyWindow.height / 2;
        var wh = this.dummyWindow.height / 2;
        this.statusWindow = new my.BHell_Window_Ranks(0, wy, wh);
        this.statusWindow.hide();

        this.addWindow(this.statusWindow);
    };

    /**
     * Creates the upgrades list window and attaches the command handlers and the status window.
     */
    Scene_BHell_Shop.prototype.createBuyUpgradesWindow = function () {
        var wy = this.dummyWindow.y;
        var wh = this.dummyWindow.height / 2;
        this.buyUpgradesWindow = new my.BHell_Window_BuyUpgrades(0, wy, wh, this._goods);
        this.buyUpgradesWindow.setStatusWindow(this.statusWindow);
        this.buyUpgradesWindow.hide();

        this.buyUpgradesWindow.setHandler('ok', this.onBuyUpgradesOk.bind(this));
        this.buyUpgradesWindow.setHandler('cancel', this.onBuyUpgradesCancel.bind(this));
        this.addWindow(this.buyUpgradesWindow);
    };


    /**
     * Activates and shows the windows related to players' purchases.
     */
    Scene_BHell_Shop.prototype.activateBuyPlayersWindow = function () {
        this.buyPlayersWindow.setMoney(this.money());
        this.buyPlayersWindow.show();
        this.previewWindow.show();
        this.statusWindow.show();
        this.buyPlayersWindow.activate();
    };

    /**
     * Activates and shows the windows related to upgrades' purchases.
     */
    Scene_BHell_Shop.prototype.activateBuyUpgradesWindow = function () {
        this.buyUpgradesWindow.setMoney(this.money());
        this.buyUpgradesWindow.makeItemList();
        this.buyUpgradesWindow.show();
        this.statusWindow.show();
        this.previewWindow.show();
        this.selectPlayerWindow.hide();
        this.previewWindow.refresh();
        this.buyUpgradesWindow.activate();
    };

    /**
     * Activates and shows the windows related to player selection (prior to purchasing upgrades).
     */
    Scene_BHell_Shop.prototype.activateSelectPlayerWindow = function () {
        this.selectPlayerWindow.refresh();
        this.previewWindow.refresh();
        this.selectPlayerWindow.show();
        this.previewWindow.refresh();
        this.previewWindow.show();
        this.selectPlayerWindow.activate();
        this.buyUpgradesWindow.hide();
        this.statusWindow.hide();
    };


    /**
     * Callback for the "Buy players" command.
     */
    Scene_BHell_Shop.prototype.commandBuyPlayers = function () {
        this.dummyWindow.hide();
        this.activateBuyPlayersWindow();
    };

    /**
     * Callback for the "Buy upgrades" command.
     */
    Scene_BHell_Shop.prototype.commandBuyUpgrades = function () {
        this.dummyWindow.hide();
        this.activateSelectPlayerWindow();
    };

    /**
     * Callback for player purchase in the "Buy players" menu.
     */
    Scene_BHell_Shop.prototype.onBuyPlayersOk = function () {
        SoundManager.playShop();
        this._item = this.buyPlayersWindow.item();
        this.doBuyPlayer();
        this.activateBuyPlayersWindow();

        if (this.buyPlayersWindow.index() >= this.buyPlayersWindow.playersList.length) {
            this.buyPlayersWindow.select(this.buyPlayersWindow.playersList.length - 1);
        }
    };

    /**
     * Callback for cancel operation in the "Buy players" menu.
     */
    Scene_BHell_Shop.prototype.onBuyPlayersCancel = function () {
        SoundManager.playCancel();
        this.commandWindow.activate();
        this.dummyWindow.show();
        this.buyPlayersWindow.hide();
        this.statusWindow.hide();
        this.previewWindow.hide();
        this.previewWindow.setPlayer(null);
    };

    /**
     * Callback for player selection in the "Buy upgrades" menu.
     */
    Scene_BHell_Shop.prototype.onSelectPlayerOk = function () {
        this._item = this.selectPlayerWindow.item();
        this.statusWindow.setPlayer(this._item.index);
        this.previewWindow.setPlayer(this._item.index);
        this.buyUpgradesWindow.setPlayer(this._item.index);
        this.activateBuyUpgradesWindow();
    };

    /**
     * Callback for cancel operation in the player selection submenu.
     */
    Scene_BHell_Shop.prototype.onSelectPlayerCancel = function () {
        SoundManager.playCancel();
        this.commandWindow.activate();
        this.dummyWindow.show();
        this.selectPlayerWindow.hide();
        this.previewWindow.hide();
    };

    /**
     * Callback for upgrade purchase in the "Buy upgrades" menu.
     */
    Scene_BHell_Shop.prototype.onBuyUpgradesOk = function () {
        SoundManager.playShop();
        this._item = this.buyUpgradesWindow.item();
        this.doBuyUpgrade();
        this.activateBuyUpgradesWindow();
    };

    /**
     * Callback for cancel operation in the "Buy upgrades" menu.
     */
    Scene_BHell_Shop.prototype.onBuyUpgradesCancel = function () {
        SoundManager.playCancel();
        this.previewWindow.setPlayer(null);
        this.activateSelectPlayerWindow();
    };

    /**
     * Performs a player purchase.
     */
    Scene_BHell_Shop.prototype.doBuyPlayer = function () {
        $gameParty.loseGold(this.buyingPlayerPrice());

        // Since this._item is a reference to $gamePlayer.bhellPlayers[?], setting the unlocked flag to true is enough.
        this._item.unlocked = true;

        this.goldWindow.refresh();
        this.previewWindow.refresh();
    };

    /**
     * Performs an upgrade purchase.
     */
    Scene_BHell_Shop.prototype.doBuyUpgrade = function () {
        $gameParty.loseGold(this.buyingUpgradePrice());

        var player = $gamePlayer.bhellPlayers[this.buyUpgradesWindow.playerId];

        // The parameters ranks are stored as strings, so each rank must be upgraded manually.
        switch (player[this._item.param]) {
            case "D":
                player[this._item.param] = "C";
                break;
            case "C":
                player[this._item.param] = "B";
                break;
            case "B":
                player[this._item.param] = "A";
                break;
            case "A":
                player[this._item.param] = "S";
                break;
        }

        this.goldWindow.refresh();
        this.previewWindow.refresh();
        this.buyUpgradesWindow.refresh();
        this.statusWindow.refresh();
    };

    Scene_BHell_Shop.prototype.money = function () {
        return this.goldWindow.value();
    };

    Scene_BHell_Shop.prototype.buyingPlayerPrice = function () {
        return this.buyPlayersWindow.price(this._item);
    };

    Scene_BHell_Shop.prototype.buyingUpgradePrice = function () {
        return this.buyUpgradesWindow.price(this._item);
    };


    return my;
}(BHell || {}));

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

var BHell = (function (my) {

    /**
     * Player selection window. Lists the available players.
     * @constructor
     * @memberOf BHell
     */
    var BHell_Window_Players = my.BHell_Window_Players = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Window_Players.prototype = Object.create(Window_Command.prototype);
    BHell_Window_Players.prototype.constructor = BHell_Window_Players;

    BHell_Window_Players.prototype.initialize = function () {
        Window_Command.prototype.initialize.call(this, 0, 0);
        this.updatePlacement();
        this.openness = 0;
    };

    BHell_Window_Players.prototype.windowWidth = function () {
        return 240;
    };

    BHell_Window_Players.prototype.updatePlacement = function () {
        this.x = (Graphics.boxWidth - this.width) / 2;
        this.y = Graphics.boxHeight - this.height;
    };

    BHell_Window_Players.prototype.makeCommandList = function () {
        for (var i = 0; i < $dataBulletHell.players.length; i++) {
            if ($gamePlayer.bhellPlayers[i].unlocked === true) {
                this.addCommand($dataBulletHell.players[i].name, String(i), true);
            }
        }
    };

    /**
     * Player status window. Displays the player's characteristics.
     * @constructor
     * @memberOf BHell
     */
    var BHell_Window_Status = my.BHell_Window_Status = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Window_Status.prototype = Object.create(Window_Base.prototype);
    BHell_Window_Status.prototype.constructor = BHell_Window_Status;

    BHell_Window_Status.prototype.initialize = function () {
        Window_Base.prototype.initialize.call(this, 0, 0, this.windowWidth(), this.windowHeight());
        this.updatePlacement();
        this.openness = 0;
    };

    BHell_Window_Status.prototype.windowWidth = function () {
        return 240;
    };

    BHell_Window_Status.prototype.windowHeight = function () {
        return 176;
    };


    BHell_Window_Status.prototype.updatePlacement = function () {
        this.x = (Graphics.boxWidth - this.width) / 2 + this.windowWidth();
        this.y = (Graphics.boxHeight - this.height) / 2;
    };

    /**
     * Displays the current player's ranks for each parameter. Ranks A and S are coloured.
     */
    BHell_Window_Status.prototype.update = function () {
        Window_Base.prototype.update.call(this);
        var x = this.textPadding();
        var width = this.contents.width - this.textPadding() * 2;

        var str = my.speed + "\n" + my.rate + "\n" + my.power + "\n" + my.bombs;
        this.contents.clear();
        this.contents.context.textAlign = "left";
        this.drawTextEx(str, x, 0);

        if (this.currentPlayer != null) {
            this.contents.context.textAlign = "right";
            str = "";
            ["speed", "rate", "power", "bombs"].forEach(p => {
                switch (this.currentPlayer[p]) {
                    case "D":
                        str += "\\c[0]D\n";
                        break;
                    case "C":
                        str += "\\c[0]C\n";
                        break;
                    case "B":
                        str += "\\c[0]B\n";
                        break;
                    case "A":
                        str += "\\c[2]A\n";
                        break;
                    case "S":
                        str += "\\c[17]S\n";
                        break;
                }
            });

            this.drawTextEx(str, width, 0);
        }
    };

    /**
     * Changes the player which owns the displayed ranks.
     * @param playerId Index of the player
     */
    BHell_Window_Status.prototype.selectPlayer = function (playerId) {
        this.currentPlayer = $gamePlayer.bhellPlayers[playerId];
        this.update();
    };


    /**
     * Pause window. Displays "Resume", "Retry" and "Quit" commands.
     * my.canRetry and my.canQuit determine if either command should be enabled.
     * @constructor
     * @memberOf BHell
     */
    var BHell_Window_Pause = my.BHell_Window_Pause = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Window_Pause.prototype = Object.create(Window_Command.prototype);
    BHell_Window_Pause.prototype.constructor = BHell_Window_Pause;

    BHell_Window_Pause.prototype.initialize = function () {
        Window_Command.prototype.initialize.call(this, 0, 0);
        this.updatePlacement();
        this.openness = 0;
    };

    BHell_Window_Pause.prototype.windowWidth = function () {
        return 360;
    };

    BHell_Window_Pause.prototype.updatePlacement = function () {
        this.x = (Graphics.boxWidth - this.width) / 2;
        this.y = (Graphics.boxHeight - this.height) / 2;
    };

    BHell_Window_Pause.prototype.makeCommandList = function () {
        this.addCommand(my.resume, "cancel", true);
        this.addCommand(my.retry, "retry", my.canRetry);
        this.addCommand(my.deadzone, "deadzone", true);
        this.addCommand(my.speedMul, "speed", true);
        this.addCommand(my.quit, "quit", my.canQuit);
    };

    BHell_Window_Pause.prototype.drawItem = function (index) {
        var rect = this.itemRectForText(index);
        var statusWidth = 120;
        var titleWidth = rect.width - statusWidth;
        var str;
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));
        this.drawText(this.commandName(index), rect.x, rect.y, titleWidth, 'left');
        if (this.commandSymbol(index) === "deadzone") {
            str = ($gameSystem.controllerDeadzone * 100).toFixed(0) + "%";
            this.drawText(str, titleWidth, rect.y, statusWidth, 'right');
        }
        if (this.commandSymbol(index) === "speed") {
            str = ($gameSystem.controllerSpeedMultiplier * 100).toFixed(0) + "%"
            this.drawText(str, titleWidth, rect.y, statusWidth, 'right');
        }
    };

    /**
     * Simple confirmation (Yes/No) window.
     * @constructor
     * @memberOf BHell
     */
    var BHell_Window_Confirm = my.BHell_Window_Confirm = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Window_Confirm.prototype = Object.create(Window_HorzCommand.prototype);
    BHell_Window_Confirm.prototype.constructor = BHell_Window_Confirm;

    BHell_Window_Confirm.prototype.initialize = function () {
        Window_HorzCommand.prototype.initialize.call(this, 0, 0);
        this.updatePlacement();
        this.openness = 0;
    };

    BHell_Window_Confirm.prototype.windowWidth = function () {
        return 150;
    };

    BHell_Window_Confirm.prototype.updatePlacement = function () {
        this.x = (Graphics.boxWidth - this.width) / 2;
        this.y = (Graphics.boxHeight - this.height) / 2;
    };

    BHell_Window_Confirm.prototype.maxCols = function () {
        return 2;
    };

    BHell_Window_Confirm.prototype.makeCommandList = function () {
        this.addCommand(my.yes, "accept", true);
        this.addCommand(my.no, "cancel", true);
    };


    /**
     * Command window for the shop.
     * @constructor
     * @memberOf BHell
     */
    var BHell_Window_ShopCommand = my.BHell_Window_ShopCommand = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Window_ShopCommand.prototype = Object.create(Window_HorzCommand.prototype);
    BHell_Window_ShopCommand.prototype.constructor = BHell_Window_ShopCommand;

    BHell_Window_ShopCommand.prototype.initialize = function (width) {
        this._windowWidth = width;
        Window_HorzCommand.prototype.initialize.call(this, 0, 0);
    };

    BHell_Window_ShopCommand.prototype.windowWidth = function () {
        return this._windowWidth;
    };

    BHell_Window_ShopCommand.prototype.maxCols = function () {
        return 3;
    };

    BHell_Window_ShopCommand.prototype.makeCommandList = function () {
        this.addCommand(my.buyPlayers, 'players');
        this.addCommand(my.buyUpgrades, 'upgrades',);
        this.addCommand(TextManager.cancel, 'cancel');
    };


    /**
     * Player purchase window for the shop.
     * @constructor
     * @memberOf BHell
     */
    var BHell_Window_BuyPlayers = my.BHell_Window_BuyPlayers = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Window_BuyPlayers.prototype = Object.create(Window_Selectable.prototype);
    BHell_Window_BuyPlayers.prototype.constructor = BHell_Window_BuyPlayers;

    BHell_Window_BuyPlayers.prototype.initialize = function (x, y, height) {
        var width = this.windowWidth();
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this.money = 0;
        this.refresh();
        this.select(0);
    };

    BHell_Window_BuyPlayers.prototype.windowWidth = function () {
        return 456;
    };

    BHell_Window_BuyPlayers.prototype.maxItems = function () {
        return this.playersList ? this.playersList.length : 1;
    };

    BHell_Window_BuyPlayers.prototype.item = function () {
        return this.playersList[this.index()];
    };

    BHell_Window_BuyPlayers.prototype.setMoney = function (money) {
        this.money = money;
        this.refresh();
    };

    BHell_Window_BuyPlayers.prototype.isCurrentItemEnabled = function () {
        return this.isEnabled(this.playersList[this.index()]);
    };

    BHell_Window_BuyPlayers.prototype.price = function (player) {
        return this._price[this.playersList.indexOf(player)] || 0;
    };

    BHell_Window_BuyPlayers.prototype.isEnabled = function (player) {
        return (player && this.price(player) <= this.money);
    };

    BHell_Window_BuyPlayers.prototype.refresh = function () {
        this.makeItemList();
        this.createContents();
        this.drawAllItems();
    };

    /**
     * Lists only the purchasable players which aren't already unlocked.
     */
    BHell_Window_BuyPlayers.prototype.makeItemList = function () {
        this.playersList = [];
        this._price = [];

        var players = $gamePlayer.bhellPlayers.filter(p => {
            return p.canBeBought && !p.unlocked;
        }).forEach(p => {
            this.playersList.push(p);
            this._price.push($dataBulletHell.players[p.index].price);
        });
    };

    BHell_Window_BuyPlayers.prototype.drawItem = function (index) {
        var item = this.playersList[index];
        var rect = this.itemRect(index);
        var priceWidth = 96;
        rect.width -= this.textPadding();
        this.changePaintOpacity(this.isEnabled(item));
        this.drawItemName($dataBulletHell.players[item.index], rect.x, rect.y, rect.width - priceWidth);
        this.drawText(this.price(item), rect.x + rect.width - priceWidth,
            rect.y, priceWidth, 'right');
        this.changePaintOpacity(true);
    };

    BHell_Window_BuyPlayers.prototype.setPreviewWindow = function (previewWindow) {
        this.previewWindow = previewWindow;
    };

    BHell_Window_BuyPlayers.prototype.setStatusWindow = function (statusWindow) {
        this.statusWindow = statusWindow;
    };

    /**
     * Updates the selected item and refreshes the preview and status windows accordingly.
     * @param index Index of the new selected item.
     */
    BHell_Window_BuyPlayers.prototype.select = function (index) {
        Window_Selectable.prototype.select.call(this, index);

        if (index >= 0 && index < this.playersList.length) {
            if (this.previewWindow) {
                this.previewWindow.setPlayer(this.item().index);
            }
            if (this.statusWindow) {
                this.statusWindow.setPlayer(this.item().index);
                this.statusWindow.setParam(-1);
            }
        }
        else {
            if (this.statusWindow) {
                this.statusWindow.setPlayer(-1);
            }
            if (this.previewWindow) {
                this.previewWindow.setPlayer(-1);
            }
        }
    };

    /**
     * Player selection window ("Buy upgrades" submenu) for the shop.
     * @constructor
     * @memberOf BHell
     */
    var BHell_Window_SelectPlayer = my.BHell_Window_SelectPlayer = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Window_SelectPlayer.prototype = Object.create(Window_Selectable.prototype);
    BHell_Window_SelectPlayer.prototype.constructor = BHell_Window_SelectPlayer;

    BHell_Window_SelectPlayer.prototype.initialize = function (x, y, height) {
        var width = this.windowWidth();
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this.refresh();
        this.select(0);
    };

    BHell_Window_SelectPlayer.prototype.windowWidth = function () {
        return 456;
    };

    BHell_Window_SelectPlayer.prototype.maxItems = function () {
        return this._data ? this._data.length : 1;
    };

    BHell_Window_SelectPlayer.prototype.item = function () {
        return this._data[this.index()];
    };

    BHell_Window_SelectPlayer.prototype.refresh = function () {
        this.makeItemList();
        this.createContents();
        this.drawAllItems();
    };

    /**
     * Lists only the players already unlocked.
     */
    BHell_Window_SelectPlayer.prototype.makeItemList = function () {
        this._data = [];

        var players = $gamePlayer.bhellPlayers.filter(p => {
            return p.unlocked;
        });
        players.forEach(p => {
            this._data.push(p);
        });
    };

    BHell_Window_SelectPlayer.prototype.drawItem = function (index) {
        var item = this._data[index];
        var rect = this.itemRect(index);
        rect.width -= this.textPadding();
        this.changePaintOpacity(true);
        this.drawItemName($dataBulletHell.players[item.index], rect.x, rect.y, rect.width);
    };


    BHell_Window_SelectPlayer.prototype.setPreviewWindow = function (previewWindow) {
        this.previewWindow = previewWindow;
    };

    /**
     * Updates the selected item and refreshes the preview window accordingly.
     * @param index Index of the new selected item.
     */
    BHell_Window_SelectPlayer.prototype.select = function (index) {
        Window_Selectable.prototype.select.call(this, index);

        if (index !== -1) {
            if (this.previewWindow) {
                this.previewWindow.setPlayer(this.item().index);
            }
        }
    };


    /**
     * Upgrade purchase window for the shop.
     * @constructor
     * @memberOf BHell
     */
    var BHell_Window_BuyUpgrades = my.BHell_Window_BuyUpgrades = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Window_BuyUpgrades.prototype = Object.create(Window_Selectable.prototype);
    BHell_Window_BuyUpgrades.prototype.constructor = BHell_Window_BuyUpgrades;

    BHell_Window_BuyUpgrades.prototype.initialize = function (x, y, height, playerId) {
        var width = this.windowWidth();
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this.playerId = playerId;
        this.money = 0;
        this.refresh();
        this.select(0);
    };

    BHell_Window_BuyUpgrades.prototype.windowWidth = function () {
        return 456;
    };

    BHell_Window_BuyUpgrades.prototype.maxItems = function () {
        return this._data ? this._data.length : 1;
    };

    BHell_Window_BuyUpgrades.prototype.item = function () {
        return this._data[this.index()];
    };

    BHell_Window_BuyUpgrades.prototype.setMoney = function (money) {
        this.money = money;
        this.refresh();
    };

    BHell_Window_BuyUpgrades.prototype.isCurrentItemEnabled = function () {
        return this.isEnabled(this._data[this.index()]);
    };

    BHell_Window_BuyUpgrades.prototype.price = function (item) {
        return this._price[this._data.indexOf(item)] || 0;
    };

    BHell_Window_BuyUpgrades.prototype.isEnabled = function (item) {
        return (item && this.price(item) <= this.money && item.rank !== "S");
    };

    BHell_Window_BuyUpgrades.prototype.refresh = function () {
        this.makeItemList();
        this.createContents();
        this.drawAllItems();
    };

    /**
     * Lists the four parameters (speed, rate of fire, power and number of bombs) and determines the price for each upgrade from the plugin's parameters.
     */
    BHell_Window_BuyUpgrades.prototype.makeItemList = function () {
        this._data = [];
        this._price = [];

        if (this.playerId != null) {

            ["speed", "rate", "power", "bombs"].forEach(p => {
                this._data.push({name: my[p], param: p, rank: $gamePlayer.bhellPlayers[this.playerId][p]});

                switch ($gamePlayer.bhellPlayers[this.playerId][p]) {
                    case "D":
                        this._price.push(my.dcPrice);
                        break;
                    case "C":
                        this._price.push(my.cbPrice);
                        break;
                    case "B":
                        this._price.push(my.baPrice);
                        break;
                    case "A":
                        this._price.push(my.asPrice);
                        break;
                    default:
                        this._price.push(null);
                        break;
                }
            });
        }

    };

    BHell_Window_BuyUpgrades.prototype.drawItem = function (index) {
        var item = this._data[index];
        var rect = this.itemRect(index);
        var priceWidth = 96;
        rect.width -= this.textPadding();
        this.changePaintOpacity(this.isEnabled(item));
        this.drawText(item.name, rect.x, rect.y, rect.width - priceWidth);
        this.drawText(this.price(item), rect.x + rect.width - priceWidth,
            rect.y, priceWidth, 'right');
        this.changePaintOpacity(true);
    };

    BHell_Window_BuyUpgrades.prototype.setStatusWindow = function (statusWindow) {
        this.statusWindow = statusWindow;
    };

    /**
     * Updates the selected item and refreshes the status window accordingly.
     * @param index Index of the new selected item.
     */
    BHell_Window_BuyUpgrades.prototype.select = function (index) {
        Window_Selectable.prototype.select.call(this, index);

        if (this.statusWindow) {
            this.statusWindow.setParam(index);
        }
    };


    /**
     * Sets the player to be upgraded.
     * @param id Index of the player.
     */
    BHell_Window_BuyUpgrades.prototype.setPlayer = function (id) {
        this.playerId = id;
        this.makeItemList();
        this.drawAllItems();
    };


    /**
     * Player preview window for the shop. The preview behaves like {@link BHell.Scene_BHell_Init}.
     * @constructor
     * @memberOf BHell
     */
    var BHell_Window_Preview = my.BHell_Window_Preview = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Window_Preview.prototype = Object.create(Window_Base.prototype);
    BHell_Window_Preview.prototype.constructor = BHell_Window_Preview;

    BHell_Window_Preview.prototype.initialize = function (x, y, width, height) {
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.playerId = null;

        this.refresh();
    };

    /**
     * Creates a new player to be displayed.
     */
    BHell_Window_Preview.prototype.refresh = function () {
        if (this.playerId != null) {
            this.contents.clear();

            this.children[2].removeChildren();

            my.friendlyBullets = [];
            my.enemyBullets = [];

            if (this.playerId !== -1) {
                my.player = new my.BHell_Player(this.playerId, 0, true, this.children[2]);
                my.player.justSpawned = false;
                my.player.opacity = 255;
                my.player.x = this.width / 2;
                my.player.y = this.height / 2;
            }

            this.i = 0;
        }
    };

    /**
     * Selects the player to be displayed.
     * @param playerId Id of the player to be displayed.
     */
    BHell_Window_Preview.prototype.setPlayer = function (playerId) {
        if (playerId != null) {
            this.playerId = playerId;
        }

        this.refresh();
    };


    /**
     * Updates the player See {@see BHell.Scene_BHell_Init#update}.
     */
    BHell_Window_Preview.prototype.update = function () {
        Window_Base.prototype.update.call(this);

        if (my.player != null) {
            if (!my.player.bomb.isActive()) {
                this.i = (this.i + 1) % 300;
                if (this.i === 0) {
                    my.player.launchBomb();
                }
                else {
                    my.player.shoot(true);
                }
            }
            else {
                my.player.shoot(false);
            }

            for (i = 0; i < my.friendlyBullets.length; i++) {
                b = my.friendlyBullets[i];
                if (b.x < 0 || b.y < 0 || b.x > this.width || b.y > this.height) {
                    b.destroy();
                    i--;
                }
            }
        }
    };


    /**
     * Rank window for the shop. Displays the values for each player parameter and, optionally, how one of them will be upgraded.
     * @constructor
     * @memberOf BHell
     */
    var BHell_Window_Ranks = my.BHell_Window_Ranks = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Window_Ranks.prototype = Object.create(Window_Base.prototype);
    BHell_Window_Ranks.prototype.constructor = BHell_Window_Ranks;

    BHell_Window_Ranks.prototype.initialize = function (x, y, height) {
        var width = this.windowWidth();
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.param = 0;
        this.refresh();
    };

    BHell_Window_Ranks.prototype.windowWidth = function () {
        return 456;
    };

    /**
     * Displays the player's parameters. If one of them is selected, it also displays an arrow and the next rank.
     */
    BHell_Window_Ranks.prototype.refresh = function () {
        this.contents.clear();
        if (this.playerId != null && this.playerId !== -1) {

            var x = this.textPadding();
            var width = this.contents.width - this.textPadding() * 2;

            var str = my.speed + "\n" + my.rate + "\n" + my.power + "\n" + my.bombs;
            this.contents.context.textAlign = "left";
            this.drawTextEx(str, x, 0);

            this.contents.context.textAlign = "right";
            str = "";

            var stats = ["speed", "rate", "power", "bombs"];

            for (var i = 0; i < stats.length; i++) {
                var p = stats[i];

                if (i === this.param) {
                    switch ($gamePlayer.bhellPlayers[this.playerId][p]) {
                        case "D":
                            str += "\\c[0]D  \\c[0]\u2192\\c[0]C\n";
                            break;
                        case "C":
                            str += "\\c[0]C  \\c[0]\u2192\\c[0]B\n";
                            break;
                        case "B":
                            str += "\\c[0]B  \\c[0]\u2192\\c[2]A\n";
                            break;
                        case "A":
                            str += "\\c[2]A  \\c[0]\u2192\\c[17]S\n";
                            break;
                        case "S":
                            str += "\\c[17]S\n"; // No upgrade is available after the S rank.
                            break;
                    }
                }
                else {
                    switch ($gamePlayer.bhellPlayers[this.playerId][p]) {
                        case "D":
                            str += "\\c[0]D\n";
                            break;
                        case "C":
                            str += "\\c[0]C\n";
                            break;
                        case "B":
                            str += "\\c[0]B\n";
                            break;
                        case "A":
                            str += "\\c[2]A\n";
                            break;
                        case "S":
                            str += "\\c[17]S\n";
                            break;
                    }
                }
                this.drawTextEx(str, width - 70, 0);
            }
        }
    };

    /**
     * Selects which parameter will be displayed together with its upgraded value.
     * @param param Parameter index (0-4).
     */
    BHell_Window_Ranks.prototype.setParam = function (param) {
        if (param != null) {
            this.param = param;
        }

        this.refresh();
    };

    /**
     * Selects which player's parameters are displayed.
     * @param playerId Index of the player.
     */
    BHell_Window_Ranks.prototype.setPlayer = function (playerId) {
        if (playerId != null) {
            this.playerId = playerId;
        }

        this.refresh();
    };


    return my;
}(BHell || {}));

