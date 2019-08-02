Each player is equipped with a bomb, which can be fired manually or, if the `autobombs` rank allows it, automatically (see {@tutorial mechanics} for more details).

Any bomb destroys every enemy bullet on screen when fired, in addition, each bomb has an unique way of dealing enemies massive damage (it usually consists in a barrage of bullets, but you can make bombs which don't spawn bullets).

To configure a bomb, you need to fill in the players' `bomb` parameters. 

    "bomb": {
        (parameters)
    }

| Parameter | Effect |
|-----------|--------|
| sprite | The bullets' charset |
| index | The bullets' charset index |
| direction | The bullets' charset direction |
| frame | The bullets' charset frame |
| speed | The bullets' speed |
| icon | The iconset image |
| icon_index | The index for the icon displayed in the HUD |
| class | The bomb class (must be derived from {@link BHell_Bomb_Base}) |
| se | If not `null`, the sound effect to be played when the bomb is launched |

An example of configuration (using one of the bombs created in {@tutorial bombs_js}) is the following:

    "bomb": {
        "sprite": "$Bullets",
        "index": 0,
        "direction": 4,
        "frame": 1,
        "speed": 9,
        "icon": "IconSet",
        "icon_index": 66,
        "class": "BHell_Bomb_Thunder",
        "se": {
            "name": "Explosion2",
            "volume": 100,
            "pitch": 100,
            "pan": 0
        }
    }

There are four predefined bomb classes (if you want to create your own, see {@tutorial bombs_js}).

### {@link BHell.BHell_Bomb_Earth Earth}

Creates two protective rings of bullets around the player, lasting 10 seconds. The rings follow the player.

![Earth bomb](bomb_earth.gif)

### {@link BHell.BHell_Bomb_Ice Ice}

Creates a 25-pointed snowflake of bullets lasting 5 seconds. The snowflake doesn't follow the player.

![Ice bomb](bomb_ice.gif)

### {@link BHell.BHell_Bomb_Water Water}

Creates 5 rings of bullets rippling outwards. The rings don't follow the player.

![Water bomb](bomb_water.gif)

### {@link BHell.BHell_Bomb_Wind Wind}

Creates a whirlwind of bullets for 5 seconds. The whirlwind's eye is centered at the player.

![Wind bomb](bomb_wind.gif)