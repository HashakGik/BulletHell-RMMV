In order to use this plugin, you must first get a copy of it.
You can either download a stable release, or compile your own from the latest source files available on [GitHub](http://github.com/HashakGik/BulletHell-RMMV).

Then you can import it in your RPG Maker MV projects.

![Plugin](plugin.png)

### Configuring the plugin's parameters

Don't be afraid of the high number of parameters, most of them are just localisation strings which will allow you to translate the plugin in any language.

| Parameter | Description | Default value |
|-----------|-------------|---------------|
| config | Configuration file (to be saved in data/) | BulletHell.json |
| resume | Resume string (pause menu) | Resume |
| retry | Retry string (pause menu) | Retry |
| quit | Quit string (pause menu) | Quit |
| yes | Yes string (pause menu) | Yes |
| no | No string (pause menu) | No |
| speed | Speed rank string (shop and player selection) | Speed |
| rate | Rate of fire rank string (shop and player selection) | Rate |
| power | Fire power rank string (shop and player selection) | Power |
| bombs | Bombs rank string (shop and player selection) | Bombs |
| Autobombs | Autobombs rank string (shop and player selection) | Autobombs |
| buy_player | Buy players command string (shop) | Players |
| buy_upgrade | Buy upgrades command string (shop) | Upgrades |
| init_bgm | BGM played during player selection | null |
| victory_me | ME played when winning a stage | Victory1 |
| bullet | Bullets' default charset | $Bullets |
| explosion | Explosions' charset | $Explosions |
| life_bonus_first | Score at which the first bonus life is awarded | 30000 |
| life_bonus_next | Score at multiples of which the following bonus lives are awarded | 80000 |
| DCprice | Price (in G) for a D > C upgrade | 5000 |
| CBprice | Price (in G) for a C > B upgrade | 10000 |
| BAprice | Price (in G) for a B > A upgrade | 50000 |
| ASprice | Price (in G) for an A > S upgrade | 100000 | 

### Using the plugin

The plugin provides the following commands.

#### Starting a stage

Start a new stage at a specified `map_id`:

    Bullethell map_id
    
For example, the following will start a stage using map 3: 

    Bullethell 3
    
Start a new stage and set the `retries_enabled` flag:

    Bullethell map_id retries_enabled
    
For example, the following will disable the "retry" option from the menu:

    Bullethell 3 false
    
Start a new stage and set the `quit_enabled` flag:

    Bullethell map_id retries_enabled quit_enabled
    
For example, the following will keep the "retry" option on the menu, but will disable the "quit" option:

    Bullethell 3 true false
    
#### Opening the shop

    Bullethell shop
    
#### Unlocking a player

    Bullethell unlock player_id
    
For example, if you want to unlock the second player (remember arrays start at 0!):

    Bullethell unlock 1
    
An unlocked player can be used on stages.

#### Locking a player

    Bullethell lock player_id
    
A locked player can no longer be used on stages (but if it can be bought it will appear at the shop).

#### Enabling a player's purchase

    Bullethell canbuy player_id
    
A purchasable player appears on sale at the shop (as long as it's not already unlocked).

#### Disabling a player's purchase

    Bullethell cannotbuy player_id
    
A player which no longer appears on sale can still be used (if it's  unlocked) on stage.


### Global variables

Normally access to the engine's code is restricted (if you intend to extend it, read {@tutorial advanced}), but there are two global variables you can access.

#### $gameBHellResult

At the end of each stage, this variable will hold the stage results, you can inspect it to check wheter the player has won or abandoned the stage, their score, etc.

See {@tutorial mechanics} for more details.

#### $gamePlayer.bhellPlayers 

Each player's state is stored in this array, so that every upgrade is saved on save files.
You can modify this array if you want to give a player some free upgrades/downgrades or a price discount, but otherwise you shouldn't really tamper with it.

For example, if you want to change the fourth player's price you could call a script with:

    $gamePlayer.bhellPlayers[3].price = 42000;
    
...or if you want to set the second player's bomb rank to `"A"`, you could use:

    $gamePlayer.bhellPlayers[1].bombs = "A"; 