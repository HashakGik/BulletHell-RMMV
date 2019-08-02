### General configuration

The JSON configuration file contains an array of enemies which needs to be filled in before you can create a stage.

    "enemies": [
        {
            "name": (enemy name),
              "class": (enemy class),
              "params": {
                (parameters)
              }
        },
        etc.
    ]
    
Each entry of the array has three fields:
- `name`: the name which will be used in the map editor to create a generator (see {@tutorial mechanics}) for this enemy,
- `class`: the class associated with this enemy entry,
- `params`: the default value for the enemy parameters.

Every enemy shares the following parameters (defined in {@link BHell.BHell_Enemy_Base}):
- `hp`: hit points,
- `speed`: moving speed (in pixels per frame),
- `period`: shooting period (see {@tutorial emitters}),
- `hitbox_w`: width of the hitbox,
- `hitbox_h`: height of the hitbox,
- `angle`: shooting angle (ignored if `aim` or `rnd` are `true`),
- `aim`: if `true`, the enemy will aim at the player,
- `always_aim`: if `true`, the enemy will constantly adjust the aim,
- `aim_x`: the enemy will shift the aim horizontally by `aim_x` pixels from the player,
 - `aim_y`: the enemy will shift the aim vertically by `aim_y` pixels from the player,
- `rnd`: if `true`, the shooting angle will be random,
- `score`: score awarded on each successful shot,
- `kill_score`: score awarded on kill,
- `boss`: if `true` displays a boss bar on stage, 
- `bullet`: bullet parameters (see {@tutorial bullets}).

Every class sets a default value for each of these parameters, so the JSON can contain only the values you actually want to cutomise.

| Parameter | Default value |
|-----------|---------------|
| hp | 1 |
| speed | 3 |
| period | 60 |
| hitbox_w | (sprite width) |
| hitbox_h | (sprite height) |
| angle | PI / 2 |
| aim | false |
| always_aim | false |
| aim_x | 0 |
| aim_y | 0 |
| rnd | false |
| score | 10 |
| kill_score | 100 |
| boss | false |

Other than {@link BHell.BHell_Enemy_Base}, there are other abstract classes which set some additional parameters for their derived classes. 

#### {@link BHell.BHell_Enemy_Spline}

This class adds parameters related to the spline movement (see {@tutorial spline}).

| Parameter | Default value |
|-----------|---------------|
| A | (x, y - sprite height) |
| B | (x, y - sprite height) |
| C | (x, screen height + sprite height) |
| D | (x, screen height + sprite height) |


#### {@link BHell.BHell_Enemy_Gunner_Base}

This class inherits parameters from {@link BHell.BHell_Enemy_Spline} and adds parameters related to the shooting behaviour:
- `cooldown`: number of frames the enemy won't be able to shoot,
- `shooting`: number of frames the enemy will shoot,
- `stop_on_shooting`: if `true`, during the shooting phase the enemy will stop moving.

| Parameter | Default value |
|-----------|---------------|
| cooldown | 60 |
| shooting | 60 |
| stop_on_shooting | false |

### Predefined enemies

These are the predefined nine enemy types, if you are interested in creating more of them, see {@tutorial enemies_js}, if you want to create a boss see {@tutorial bosses}.

#### {@link BHell.BHell_Enemy_Smallfry Small fry}
Small fries move along a fixed path and shoot once in a while.

![Smallfry](smallfry.gif)

##### Additional parameters

Smallfries inherit their parameters from {@link BHell.BHell_Enemy_Spline}.


##### Strategy
Although weak and predictable (both in shooting and moving patterns), small fries tend to appear in groups. Should they overwhelm you, it could be wise to let them escape or obliterate all of them at once with a bomb.

#### {@link BHell.BHell_Enemy_Suicide Suicide}
Suicide enemies move towards the player until they crash.

![Suicide](suicide.gif) 

##### Additional parameters
None.

##### Strategy
Suicide enemies are not capable of shooting and usually have very little health, however they tend to follow you and catch up very quickly. When there is many of them, your best bet is to maneuver them into your firing range while keeping your distance. If everything else fails, a bomb might come in handy.  


#### {@link BHell.BHell_Enemy_Orbiter Orbiter}
Orbiters approach the player and then orbit around it, shooting once in a while aiming at the player.

![Orbiter](orbiter.gif)

##### Additional parameters

| Parameter | Effect | Default value |
|-----------|--------|---------------|
| radius | Orbiter distance from the player (in pixel) | 250 |

##### Strategy
Orbiters never give up. Once they start orbiting around you, there is no other way out but killing them. Try to synchronise your shooting with their position. If you are equipped with a bomb which doesn't follow the player, try to force orbiters to run straight into the bomb's position.


#### {@link BHell.BHell_Enemy_Probe Probe}
Probes move quickly in a random direction, stop and then shoot.

![Probe](probe.gif)

##### Additional parameters

| Parameter | Effect | Default value |
|-----------|--------|---------------|
| shooting | number of frames of the shooting phase | 120 |

##### Strategy
Probes are absolutely unpredictable. They move very fast and there is no way to know where they want to go, but they need to stop before shooting you: that's your chance to get rid of them for good. When they are moving, try to stay as far away as possible, so you can dodge them, should they decide to move in your general direction. 


#### {@link BHell.BHell_Enemy_Blocker Blocker}
Blockers try to block the player and slowly advance towards the bottom of the screen, shooting downwards.

![Blocker](blocker.gif)

##### Additional parameters

| Parameter | Effect | Default value |
|-----------|--------|---------------|
| vspeed | Vertical moving speed | 0.2 |

##### Strategy
If their speed matches yours, you have no choice but to destroy blockers before they trap you at the bottom of the screen, resulting in certain death. You should ignore other enemies on screen and focus on blockers. On occasions (or if your speed rank is insanely high), you might be able to actually dodge a blocker: since it only shoots downwards, you can safely ignore it until it leaves the screen.  


#### {@link BHell.BHell_Enemy_Gunner Gunner}
Gunners move along a fixed path and shoot a streak of bullets.

![Gunner](gunner.gif)

##### Additional parameters

Gunners inherit their parameters from {@link BHell.BHell_Enemy_Gunner_Base}.

##### Strategy
You'll encounter many gunners along your path and they can be categorised in three groups: those which shoot at a fixed angle, those which shoot randomly and those which aim at you. Despite this variance in behaviour, they all need to stop shooting once in a while to reload and that's your chance to get them!  


#### {@link BHell.BHell_Enemy_Burster Burster}
Bursters move along a fixed path and shoot a burst of densely packed bullets.

![Burster](burster.gif)

##### Additional parameters

Bursters inherit their parameters from {@link BHell.BHell_Enemy_Gunner_Base} and define the following:

| Parameter | Effect | Default value |
|-----------|--------|---------------|
| shots | number of bullets to be fired at once | 30 |
| dispersion | radius of the dispersion circle | 50 |


##### Strategy
Bursters are just like gunners with shotguns, treat them as such.


#### {@link BHell.BHell_Enemy_Sprayer Sprayer}
Sprayers move along a fixed path and shoot an arc of bullets.

![Sprayer](sprayer.gif)

##### Additional parameters

Sprayers inherit their parameters from {@link BHell.BHell_Enemy_Gunner_Base} and define the following:

| Parameter | Effect | Default value |
|-----------|--------|---------------|
| a | initial angle for the arc | PI / 2 - PI / 16 |
| b | final angle for the arc | PI / 2 + PI / 16 |
| n | number of bullets to be fired | 10 |

##### Strategy
Sprayers' shots can be dangerously wide and you might not have enough space to dodge them. If you are with your back on the wall remember you can rely on your bombs.


#### {@link BHell.BHell_Enemy_Starshooter Starshooter}
Starshooters move along a fixed path and shoot many streaks of bullets radially.

![Starshooter](starshooter.gif)

##### Additional parameters

Starshooters inherit their parameters from {@link BHell.BHell_Enemy_Gunner_Base} and define the following:

| Parameter | Effect | Default value |
|-----------|--------|---------------|
| n | number of streaks to shoot | 5 |


##### Strategy
These guys are gunners with a thing for shooting in many directions at once. Remember that they eventually need to stop shooting, until that time try to stay between two of their streaks. 


#### {@link BHell.BHell_Enemy_Swirler Swirler}
Swirlers move along a fixed path and shoot many streaks of bullets slowly rotating.

![Swirler](swirler.gif) 

##### Additional parameters

Swirlers inherit their parameters from {@link BHell.BHell_Enemy_Starshooter} and define the following:

| Parameter | Effect | Default value |
|-----------|--------|---------------|
| rotation | rotation speed (in radians per frame) of the streaks | 0.01 |


##### Strategy
Swirlers are starshooters with a fetish for vortexes, you need to keep yourself between two streaks and rotate along them until they drop their guards to reload.