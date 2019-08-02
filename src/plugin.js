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

@param autobombs
@desc Autobombs string.
@default Autobombs

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
 * @property {number} score Final score (reset for each retry).
 * @property {number} hitRatio % of bullets hitting a target (reset for each retry).
 * @property {number} enemiesKilled Number of enemies killed (reset for each retry).
 * @property {number} enemiesMissed Number of enemies escaped (reset for each retry).
 * @property {number} enemiesCrashed Number of enemies crashed against the player (reset for each retry).
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
 * @property {string} power Current power rank (how strong the helpers are).
 * @property {string} bombs Current bomb rank (how many bombs can be stored).
 * @property {string} autobombs Current autobombs rank (how many times a panic attack can be performed).
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
    my.quit = String(parameters['quit'] || "Quit");
    my.yes = String(parameters['yes'] || "Yes");
    my.no = String(parameters['no'] || "No");
    my.speed = String(parameters['speed'] || "Speed");
    my.rate = String(parameters['rate'] || "Rate");
    my.power = String(parameters['power'] || "Power");
    my.bombs = String(parameters['bombs'] || "Bombs");
    my.autobombs = String(parameters['autobombs'] || "Autobombs");
    my.buyPlayers = String(parameters['buy_players'] || "Players");
    my.buyUpgrades = String(parameters['buy_upgrades'] || "Upgrades");

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

            // If the players' settings aren't loaded yet, load them from the JSON.
            $gamePlayer.bhellPlayers = $gamePlayer.bhellPlayers || [];
            for (var i = 0; i < $dataBulletHell.players.length; i++)
            {
                $gamePlayer.bhellPlayers[i] = $gamePlayer.bhellPlayers[i] || {};
                $gamePlayer.bhellPlayers[i].index = i;
                $gamePlayer.bhellPlayers[i].unlocked = $gamePlayer.bhellPlayers[i].unlocked || $dataBulletHell.players[i].unlocked || false;
                if ($gamePlayer.bhellPlayers[i].canBeBought !== false) {
                    $gamePlayer.bhellPlayers[i].canBeBought = true && ($gamePlayer.bhellPlayers[i].canBeBought || $dataBulletHell.players[i].can_be_bought);
                }
                $gamePlayer.bhellPlayers[i].price = $gamePlayer.bhellPlayers[i].price || $dataBulletHell.players[i].price || 50000;
                $gamePlayer.bhellPlayers[i].speed = $gamePlayer.bhellPlayers[i].speed || $dataBulletHell.players[i].speed || 1;
                $gamePlayer.bhellPlayers[i].rate = $gamePlayer.bhellPlayers[i].rate || $dataBulletHell.players[i].rate || 1;
                $gamePlayer.bhellPlayers[i].power = $gamePlayer.bhellPlayers[i].power || $dataBulletHell.players[i].power || 1;
                $gamePlayer.bhellPlayers[i].bombs = $gamePlayer.bhellPlayers[i].bombs || $dataBulletHell.players[i].bombs || 1;
                $gamePlayer.bhellPlayers[i].autobombs = $gamePlayer.bhellPlayers[i].autobombs || $dataBulletHell.players[i].autobombs || 1;
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

    return my;
}(BHell || {}));