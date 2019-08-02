While enemy emitters can't be configured directly (the emitter parameters are set from the enemy parameters), you can configure player emitters in the JSON file.

Each player has an array of emitters:

    "emitters": [
        {
          "type": (emitter type),
          "params": {
            (emitter parameters)
          }
        },
        etc.
    ]
    
Every emitter shares the following parameters:

| Parameter | Effect | Default value |
|-----------|--------|---------------|
| x | X offset from the player's center | must be explicitly defined |
| y | Y offset from the player's center | must be explicitly defined |
| period | Shooting period | must be explicitly defined |
| sprite | Emitter charset | null (the emitter is invisible) |
| index | Charset index | null |
| direction | Charset direction | null |
| animated | If `true` animates the sprite | false |
| animation_speed | Number of updates required for a frame change | null |  
| ranks | Power ranks in which the emitter is enabled | ["D", "C", "B", "A", "S"] |
| bullet | Bullet parameters | (default bullet parameters) |

The `ranks` parameter determines when the emitter will be enabled, for example:
- If `ranks: ["D", "C"]` and the player has a power rank of `"D"`, the emitter will shoot,
- If `ranks: ["D", "C"]` and the player has a power rank of `"B"`, the emitter will **not** shoot,
- If `ranks: ["S"]` the emitter will shoot only if the player has a power rank of `"S"`,
- If `ranks: ["D", "B", "S"]` the emitter will shoot only if the player has a power rank of `"D"`, `"B"` or `"S"`, but **not** if the rank is `"C"` or `"A"`.

You can increase a player's firepower by disabling weak emitters and enabling strong ones at higher ranks.

There are four types of emitters which can be configured for player's use (if you are interested in creating more, see {@tutorial emitters_js}).

**Note**: Each of the additional parameters must be explicitly defined.

### Base

The base emitter (`"type": "base"`) shoots a single bullet upwards.

![Base emitter](emitter_base.gif)

#### Additional parameters

None.

### Spray

The spray emitter (`"type": "spray"`) shoots an arc of bullets (like the {@link BHell.BHell_Enemy_Sprayer}).

![Spray emitter](emitter_spray.gif)

#### Additional parameters

| Parameter | Effect |
|-----------|--------|
| a | Initial angle for the arc |
| b | Final angle for the arc |
| n | Number of bullets to be fired |

### Burst

The burst emitter (`"type": "burst"`) shoots a burst of bullets (like the {@link BHell.BHell_Enemy_Burster}).

**Note**: Since this emitter fires many bullets at once, it can deal a big amount of damage. It would be wise to balance this perk with a long `period`. 

![Burst emitter](emitter_burst.gif)

#### Additional parameters

| Parameter | Effect |
|-----------|--------|
| dispersion | Radius of the dispersion circle |
| shots | Number of bullets to be fired |
| angle | Shot's angle |

### Rotate

The rotate emitter (`"type": "rotate"`) shoots a single bullet upwards, but orbits around the player.

**Note**: Since this emitter moves away from its starting position, it's highly suggested to always define a `sprite` for it, so the player knows where its bullets are being spawned from.

![Rotate emitter](emitter_rotate.gif)

#### Additional parameters

| Parameter | Effect |
|-----------|--------|
| theta | Initial phase of the emitter |
| radius | Rotation radius |
| dt | Rotation speed (in radians per frame) |
