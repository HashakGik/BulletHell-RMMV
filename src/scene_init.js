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
    else if ($dataBulletHell.players.filter(p => {return p.unlocked === true;}).length === 0) {
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
    if ($dataBulletHell.players.filter(p => {return p.unlocked === true;}).length === 0) {
        SceneManager.goto(Scene_Map);
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