/**
 * @namespace BHell
 */
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
        return 220;
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

        var str = my.speed + "\n" + my.rate + "\n" + my.power + "\n" + my.bombs + "\n" + my.autobombs;
        this.contents.clear();
        this.contents.context.textAlign = "left";
        this.drawTextEx(str, x, 0);

        if (this.currentPlayer != null) {
            this.contents.context.textAlign = "right";
            str = "";
            ["speed", "rate", "power", "bombs", "autobombs"].forEach(p => {
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
        return 240;
    };

    BHell_Window_Pause.prototype.updatePlacement = function () {
        this.x = (Graphics.boxWidth - this.width) / 2;
        this.y = (Graphics.boxHeight - this.height) / 2;
    };

    BHell_Window_Pause.prototype.makeCommandList = function () {
        this.addCommand(my.resume, "cancel", true);
        this.addCommand(my.retry, "retry", my.canRetry);
        this.addCommand(my.quit, "quit", my.canQuit);
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
     * Command window for the bullet hell shop.
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
     * Player purchase window for the bullet hell shop.
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
     * Player selection window ("Buy upgrades" submenu) for the bullet hell shop.
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
     * Upgrades purchase window for the bullet hell shop.
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
     * Lists the five parameters (speed, rate of fire, power, number of bombs and autobombs) and determines the price for each upgrade from the plugin's parameters.
     */
    BHell_Window_BuyUpgrades.prototype.makeItemList = function () {
        this._data = [];
        this._price = [];

        if (this.playerId != null) {

            ["speed", "rate", "power", "bombs", "autobombs"].forEach(p => {
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
     * Player preview window for the bullet hell shop. The preview behaves like {@see BHell.Scene_BHell_Init}.
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
     * @param playerId
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
        }
    };


    /**
     * Ranks window for the bullet hell shop. Displays the values for each player parameter and, optionally, how one of them will be upgraded.
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

            var str = my.speed + "\n" + my.rate + "\n" + my.power + "\n" + my.bombs + "\n" + my.autobombs;
            this.contents.context.textAlign = "left";
            this.drawTextEx(str, x, 0);

            this.contents.context.textAlign = "right";
            str = "";

            var stats = ["speed", "rate", "power", "bombs", "autobombs"];

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