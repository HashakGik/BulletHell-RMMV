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

@param warning_img
@desc Picture for the warning sign. NOTE: It's a PICTURE, not a charset.
@default

@param warning_duration
@desc Length of warning animation.
@default 120

@param warning_se
@desc Sound effect for warning.
@default

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

    my.warningImg = String(parameters['warning_img'] || "");
    my.warningDuration = Number(parameters['warning_duration'] || 120);
    my.warningSE = String(parameters['warning_se'] || "");


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