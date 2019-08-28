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
            AudioManager.playBgm($dataMap.bgm);
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
    };

    /**
     * Handles the user input.
     * Left mouse or "ok" button: shoot,
     * Right mouse or "shift" button: launch bomb,
     * Any click (left or right) or arrow keys: move the player,
     * "Escape" button: toggle pause.
     */
    Scene_BHell.prototype.updateInput = function () {
        if (!my.controller.paused) {
            if (Input.isTriggered('escape')) {
                my.controller.paused = true;
                this.bgm = AudioManager.saveBgm();
                AudioManager.stopBgm();
                this.pauseWindow.open();
                this.pauseWindow.activate();
            }
            else {
                if (this.messageWindow.isOpening()) {
                    TouchInput.clear();
                    Input.clear();
                }
                else {
                    if (this.usingTouch) {
                        my.player.moveTo(TouchInput.x, TouchInput.y);
                    }

                    if (Input.isPressed('up')) {
                        this.usingTouch = false;
                        my.player.step(0, -1);
                    }
                    if (Input.isPressed('down')) {
                        this.usingTouch = false;
                        my.player.step(0, +1);
                    }
                    if (Input.isPressed('left')) {
                        this.usingTouch = false;
                        my.player.step(-1, 0);
                    }
                    if (Input.isPressed('right')) {
                        this.usingTouch = false;
                        my.player.step(+1, 0);
                    }

                    if (TouchInput.isPressed()) {
                        this.usingTouch = true;
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
        var player = $dataBulletHell.players[my.playerId];
        // Update lives:
        if (my.player.lives !== -1 && my.player.lives > this.lives.length) { // Some lives were earned
            var life = new my.BHell_Sprite(player.sprite, player.index, 2, player.frame, false, 0);
            life.y = Graphics.height - life.height / 2 - 10;
            life.x = this.lives.length * (life.width / 2) + life.width / 2;
            this.lives.push(life);
            this.addChild(life);
        }
        if (my.player.lives !== -1 && my.player.lives < this.lives.length) { // Some lives were lost
            this.removeChild(this.lives.pop());
        }

        if (my.player.bombs !== -1 && my.player.bombs > this.bombs.length) { // Some bombs were added
            var bomb = new Sprite_Base();

            bomb.bitmap = ImageManager.loadSystem(player.bomb.icon, 0);
            bomb.anchor.x = 0.5;
            bomb.anchor.y = 0.5;
            bomb.setFrame(bomb.width / 16 * (player.bomb.icon_index % 16), bomb.height / 20 * Math.floor(player.bomb.icon_index / 16), bomb.width / 16, bomb.height / 20);
            bomb.y = Graphics.height - bomb.height - this.lifeH;
            bomb.x = this.bombs.length * (bomb.width) + this.lifeW / 2;

            this.bombs.push(bomb);
            this.addChild(bomb);
        }
        if (my.player.bombs !== -1 && my.player.bombs < this.bombs.length) { // Some bombs were used
            this.removeChild(this.bombs.pop());
        }

        // Update score: Graphic effect for score accumulation.
        var delta = $gameBHellResult.score - my.scoreAccumulator;
        if (delta !== 0 && !my.controller.paused) {
            my.scoreAccumulator += delta / 10;
        }

        my.scoreSprite.bitmap.clear();
        my.scoreSprite.bitmap.drawText(Number(Math.round(my.scoreAccumulator)), 10, 10, Graphics.width - 20, 36, "right");

        my.bossLife.bitmap.clear();
        if (my.bossOnScreen === true) {
            my.bossLife.bitmap.fillRect(0, 0, my.bossLife.width, my.bossLife.height, "rgba(0, 0,0, 0.8)");
            my.bossLife.bitmap.clearRect(1, 1, my.bossLife.width - 2, my.bossLife.height - 2);
            if (my.bossMaxHp !== 0) {
                var red = Math.round(255 * my.bossHp / my.bossMaxHp);
                var green = 255 - red;
                my.bossLife.bitmap.fillRect(1, 1, (my.bossLife.width - 2) * my.bossHp / my.bossMaxHp, my.bossLife.height - 2, "rgba(" + red + ", " + green + ", 0, 0.8)");
            }
        }

    };

    /**
     * Creates the HUD (the score sprite and a life template).
     */
    Scene_BHell.prototype.createHUD = function () {
        this.lives = [];
        this.bombs = [];

        var player = $dataBulletHell.players[my.playerId];
        var life = new my.BHell_Sprite(player.sprite, player.index, 2, player.frame, false, 0);
        this.lifeW = life.width;
        this.lifeH = life.height;
        my.scoreSprite = new Sprite(new Bitmap(Graphics.width, 46));
        my.scoreSprite.x = 0;
        my.scoreSprite.y = 0;
        my.scoreAccumulator = 0;
        this.addChild(my.scoreSprite);

        my.bossLife = new Sprite(new Bitmap(Graphics.width - 20, 10));
        my.bossLife.x = 10;
        my.bossLife.y = 3;
        this.addChild(my.bossLife);
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
        this.bgm = this.bgm || $dataMap.bgm;
        AudioManager.replayBgm(this.bgm);
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
     * Quit command, invoked by the pause window's third option. Asks for confirmation.
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