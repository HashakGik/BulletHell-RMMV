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
        if (!my.controller.paused && !$gameMessage.isBusy()) {
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