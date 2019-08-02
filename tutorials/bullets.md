Bullets' appearance can be customised in the JSON file, both for player's emitters (each one of them can use different bullets) and for enemies (only one kind of bullet can be configured for the default enemies, but new classes, especially bosses, can have multiple kinds).

    "bullet": {
      (parameters)
    }
    
The available parameters are the following:

| Parameter | Effect | Default value |
|-----------|--------|---------------|
| speed | Speed of the bullet in pixels per frame | 3 |
| sprite | Bullet charset | (Plugin parameter) |
| index | Charset index (ignored if the charset begins with $) | 0 | 
| direction | Charset direction (2-4-6-8) | 2 |
| frame | Charset initial frame (0-1-2) | 0 |
| animated | If `true` the frame will be updated (in the order 1-2-3-2) | false |
| animation_speed | Number of updates required for a frame change | 25 |

When a bullet is spawned, it's shooting angle also determines the sprite's `rotation`, so the charset should show bullets traveling at an angle of 0 radians (i.e. pointing to the right), like the following:

![Bullet charset]($Bullets.png)

**Important**: Since this is a Bullet Hell, there are going to be many bullets on screen, you must keep in mind two golden rules when designing your game:
1. The player must always be able to distinguish between its and the enemies' bullets: use different colors;
2. Enemy bullets must always be easy to see, no matter what background they are placed in: use bright colors with an high contrast on the stage's background.