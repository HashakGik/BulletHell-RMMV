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