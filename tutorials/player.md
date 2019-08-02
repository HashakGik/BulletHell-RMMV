Before playing a stage, you need to have at least one player configured in your JSON.

Players are defined in the JSON file in the array:

    "players": [
        (player definition 1),
        (player definition 2),
        etc.
    ]
    
Each player definition has the following structure:

    {
      "name": (name displayed in game),
      (player parameters),
      (sound effects),
      "bomb": (bomb parameters),
      "emitter: [
        (list of emitters)
      ]
    }

The player parameters are the following (each one of them is mandatory):

| Parameter | Effect |
|-----------|--------|
| sprite | Charset for the player |
| unlocked | If `true` the player can be used for a stage right away |
| can_be_bought | If `true` the player can be bought at the shop from the beginning |
| price | The player's price at the shop |
| hitbox_w | The player's hitbox width |
| hitbox_h | The player's hitbox height |
| index | The charset index for the player |
| direction | The charset direction for the player |
| frame | The charset initial frame |
| animation_speed | The number of updates required for a frame change |
| animated | If `true` animates the charset frames |
| speed | Initial speed rank |
| rate | Initial rate of fire rank |
| power | Initial power rank |
| bombs | Initial bombs rank |
| autobombs | Initial autobombs rank |

The five ranks can have one of the following values (from weakest to strongest): `"D"`, `"C"`, `"B"`, `"A"`, `"S"`.
If you want to know how each rank affects gameplay, read {@tutorial mechanics}.

Each parameter can be changed during the game by manipulating the object `$gamePlayer.bhellPlayers`.
For example if you want to set the fourth player's price to `42000G` you could call a script containing:
    
    // Remember the first element of an array is [0].
    $gamePlayer.bhellPlayers[3].price = 42000;
    
... or if you want the first player's speed to be upgraded to `"S"` (for example as a side quest's reward):
    
    $gamePlayer.bhellPlayers[3].speed = "S";    
    
**Note**: Since `$gamePlayer` is stored in the save file, you won't loose any change when you reload a game.

The sound effects are the following (if null, no sound effect is played):
- `select_se`: played when the player is selected before a stage is started, 
- `spawn_se`: played when the player is spawned on stage (at the beginning or after a life lost),
- `death_se`: played when the player is killed.

Like every other one in-game, these sound effect have the following structure:

    {
        "name": (file name),
        "volume": (volume),
        "pitch": (pitch),
        "pan": (pan)
    }
    
The bomb parameters are covered in depth in the tutorial {@tutorial bombs} and the emitter parameters in the tutorial {@tutorial emitters}.

A sample player configuration could be this:

    {
      "name": "Straight",
      "sprite": "Evil",
      "unlocked": true,
      "can_be_bought": false,
      "price": 0,
      "speed": "S",
      "rate": "D",
      "power": "D",
      "bombs": "C",
      "autobombs": "D",
      "hitbox_w": "w/2",
      "hitbox_h": "h/2",
      "index": 2,
      "direction": 8,
      "frame": 1,
      "animation_speed": 30,
      "animated": true,
      "select_se": {
        "name": "Sound1",
        "volume": 100,
        "pitch": 100,
        "pan": 0
      },
      "spawn_se": {
        "name": "Cat",
        "volume": 100,
        "pitch": 100,
        "pan": 0
      },
      "death_se": {
        "name": "Wolf",
        "volume": 100,
        "pitch": 100,
        "pan": 0
      },
      "bomb": {
        "sprite": "$Bullets",
        "index": 0,
        "direction": 2,
        "frame": 1,
        "icon": "IconSet",
        "icon_index": 67,
        "class": "BHell_Bomb_Water",
        "se": {
          "name": "Explosion2",
          "volume": 100,
          "pitch": 100,
          "pan": 0
        }
      },
      "emitters": [
        {
          "type": "base",
          "params": {
            "x": 0,
            "y": 0,
            "period": 25,
            "sprite": null,
            "ranks": ["D", "C", "B"],
            "index": 0,
            "direction": 2,
            "animated": false,
            "bullet": {
              "speed": 5,
              "sprite": "$Bullets",
              "index": 0,
              "direction": 2,
              "frame": 1,
              "animated": false
            }
          }
        },
        {
          "type": "base",
          "params": {
            "x": "-w/2",
            "y": 0,
            "period": 50,
            "ranks": ["C"],
            "sprite": null,
            "index": 0,
            "direction": 2,
            "animated": false,
            "bullet": {
              "sprite": "$Bullets",
              "index": 0,
              "direction": 4,
              "frame": 1,
              "animated": false
            }
          }
        },
        {
          "type": "base",
          "params": {
            "x": "w/2",
            "y": 0,
            "period": 50,
            "ranks": ["C"],
            "sprite": null,
            "index": 0,
            "direction": 2,
            "animated": false,
            "bullet": {
              "sprite": "$Bullets",
              "index": 0,
              "direction": 4,
              "frame": 1,
              "animated": false
            }
          }
        },
        {
          "type": "base",
          "params": {
            "x": "-w/2",
            "y": 0,
            "period": 25,
            "ranks": ["B"],
            "sprite": null,
            "index": 0,
            "direction": 2,
            "animated": false,
            "bullet": {
              "speed": 5,
              "sprite": "$Bullets",
              "index": 0,
              "direction": 4,
              "frame": 1,
              "animated": false
            }
          }
        },
        {
          "type": "base",
          "params": {
            "x": "w/2",
            "y": 0,
            "period": 25,
            "ranks": ["B"],
            "sprite": null,
            "index": 0,
            "direction": 2,
            "animated": false,
            "bullet": {
              "speed": 5,
              "sprite": "$Bullets",
              "index": 0,
              "direction": 4,
              "frame": 1,
              "animated": false
            }
          }
        },
        {
          "type": "spray",
          "params": {
            "x": 0,
            "y": 0,
            "a": "3 * pi / 2 - pi / 16",
            "b": "3 * pi / 2 + pi / 16",
            "n": 3,
            "period": 25,
            "sprite": null,
            "ranks": ["A"],
            "index": 0,
            "direction": 2,
            "animated": false,
            "bullet": {
              "speed": 5,
              "sprite": "$Bullets",
              "index": 0,
              "direction": 2,
              "frame": 1,
              "animated": false
            }
          }
        },
        {
          "type": "spray",
          "params": {
            "x": 0,
            "y": 0,
            "a": "3 * pi / 2 - pi / 16",
            "b": "3 * pi / 2 + pi / 16",
            "n": 5,
            "period": 25,
            "sprite": null,
            "ranks": ["S"],
            "index": 0,
            "direction": 2,
            "animated": false,
            "bullet": {
              "speed": 5,
              "sprite": "$Bullets",
              "index": 0,
              "direction": 2,
              "frame": 1,
              "animated": false
            }
          }
        }
      ]
    }
    
This player has a {@link BHell.BHell_Bomb_Water} bomb and seven emitters (enabled in increasing order of firepower).
In game, each power up of this player will look like this:

![Straight player](straight.gif)