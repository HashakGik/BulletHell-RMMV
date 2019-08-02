Enemy classes' behaviour can be overridden in two ways.
- By customising the JSON file,
- By adding comments to a generator event.

The first method has a global scope, but if you need to create many enemies with the same parameters across many stages it will allow you to reduce the amount of copy-pasting.

The second method overrides parameters only for the enemies spawned by a specific generator and is therefore very useful for unique behaviour aspects (like the enemies' path).

### Add more entries to the JSON file

Let's say we want to create two `blocker` enemies. Both will share the {@link BHell.BHell_Enemy_Blocker} class, but one (which we'll call `fast_blocker`) will be able to move faster, and the other (which we'll call `purple_blocker`) will shoot purple bullets instead of orange ones.

All we need to do is to add two new entries in our JSON's `enemies` array:

    {
      "name": "purple_blocker",
      "class": "BHell_Enemy_Blocker",
      "params": {
        "bullet": {
          "frame": 2
        }
      }
    },
    {
      "name": "fast_blocker",
      "class": "BHell_Enemy_Blocker",
      "params": {
        "speed": 9,
        "vspeed": 2
      }
    }

That's it! We need to replace only the parameters we want to change (for a list of default values see {@tutorial enemies}), and to create our generators the usual way:

![Fast blocker](fast_blocker.png)

![Purple blocker](purple_blocker.png)

#### Parsing

The JSON file is parsed  so that you can use *arithmetic expressions* instead of fixed numbers. Every time you insert an expression between quotes, the following constants will be replaced automatically:
- `x`: the x coordinate of the "item" which owns the property you are setting,
- `y`: the y coordinate of your "item",
- `w`: the width of the sprite of your "item",
- `h`: the height of the sprite your "item",
- `sw`: the screen width,
- `sh`: the screen height,
- `pi`: 3.14...

So, for example, if you want an emitter to shoot upwards you can define its `angle` like this:

    "angle":  4.712389‬‬
    
... Or like any of these (the first two being the most reasonable ones):

    "angle": "3 / 2 * pi"
    "angle": "1.5 * pi"
    "angle": "(1+1+1) * pi + 0.5 * pi"
    "angle": "3.712389‬‬ + 1"
    
Likewise, if you want an emitter to be placed on the left at half width of the player's sprite you could choose either of the following (assuming your sprite is 48 pixels wide):

    "emitters": [
       {
         "x": -24
       }
     ]
    
    "emitters": [
       {
         "x": "-w / 2"
       }
     ] 

### Use the generator's comments

The other way we can override our enemies' default behaviour is to add a `comment` to our generator's event page.

For example, the following is a {@link BHell.BHell_Enemy_Gunner} with some custom parameters (including it's path):

![Edited gunner](gunner_comments.png)

**Note**: RPG Maker limits each comment to six lines, if you need more space you can use multiple comments (like the picture above).

**Important**: The engine parses each comment as a JSON file (excluding the leading `{` and trailing `}`), so remember to add a comma between parameters!