In this tutorial we are going to implement two `emitter` classes, one for exclusive use by the players, the other one for enemies.
The code for the two differs slightly, due to the fact that player's emitters need an additional layer (the {@link BHell.BHell_Emitter_Factory} methods) in order to be configured in a general way (while each `enemy` class can initialise them according to their specific needs).  

For player's use we will create an emitter which moves randomly within a radius around the player and then shoots aiming automatically at enemies.
For enemies' sake, we will create an emitter shooting a series of equally spaced arcs forming a *circle* with "spaces" the player can use to dodge the attack.  

### BHell_Emitter_Probe

The `probe` enemies can arguably be considered the most annoying ones: they move very quickly in an unpredictable fashion and (with default parameters) shoot aiming at the player.
We want to cast the same nightmare upon the enemies, so we want to create an emitter which will automatically aim at enemies and move randomly around the player.

![Emitter Probe](emitter_probe.gif) 


More precisely we want to implement this two-phases behaviour:
- If in shooting phase, create a bullet for each enemy on screen (aimed at them) and don't move,
- If at the beginning of the moving phase, pick a new destination within a given `radius` from the player position,
- During the moving phase, move towards the destination and don't shoot.  

In terms of configuration we need our emitter to accept the following parameters:
- `radius`: the maximum distance from the player allowed when picking a new destination,  
- `speed`: the moving speed of the emitter,
- `shooting_frames`: the number of frames the emitter should stop and shoot.

Let's start by creating an `emitter_probe.js` plugin and by reopening our `BHell` module:

    var BHell = (function (my) {    
        /* Our code will go here */
        
        return my;
    }(BHell || {}));
    
We are going to create a new class extending {@link BHell.BHell_Emitter_Base} (since none of the predefined emitters provide something useful for our needs):

    var BHell_Emitter_Probe = my.BHell_Emitter_Probe = function () {
            this.initialize.apply(this, arguments);
        };
    
        BHell_Emitter_Probe.prototype = Object.create(my.BHell_Emitter_Base.prototype);
        BHell_Emitter_Probe.prototype.constructor = BHell_Emitter_Probe;
    
    
        BHell_Emitter_Probe.prototype.initialize = function (x, y, params, parent, bulletList) {
            my.BHell_Emitter_Base.prototype.initialize.call(this, x, y, params, parent, bulletList);
        };
        
Let's initialise our class, we need to retrieve the parameters and initialise the following properties:
- position and destination should be set to the player's position (plus the specified offset),
- the initial phase should be set to moving (we define a `stopped` flag set to `false` when moving and to `true` when shooting, since a `shooting` flag is already defined and used by {@link BHell.BHell_Emitter_Base}),
- we also need a frame counter for our shooting phase.


    BHell_Emitter_Probe.prototype.initialize = function (x, y, params, parent, bulletList) {
        my.BHell_Emitter_Base.prototype.initialize.call(this, x, y, params, parent, bulletList);
        this.radius = 20;
        this.speed = 5;
        this.shootingFrames = 60;
    
        if (params != null) {
            this.radius = params.radius || this.radius;
            this.speed = params.speed || this.speed;
            this.shootingFrames = params.shootingFrames || this.shootingFrames;
        }
    
        this.x = my.player.x + this.offsetX;
        this.y = my.player.y + this.offsetY;
        this.destX = this.x;
        this.destY = this.y;
        this.stopped = false;
        this.k = 0;
    };

The default {@link BHell.BHell_Emitter_Base#update} implementation updates the shooting state every frame, but we want our emitter not to shoot when it's moving, so we need to reimplement it:

    BHell_Emitter_Probe.prototype.update = function () {
        // Don't forget to update the sprite!
        my.BHell_Sprite.prototype.update.call(this);

        if (this.stopped) {
            if (this.shooting === true) {
                if (this.j === 0) {
                    this.shoot();
                }
                this.j = (this.j + 1) % this.period;
            }

            this.oldShooting = this.shooting;

            this.k = (this.k + 1) % this.shootingFrames;
            if (this.k === 0) {
                this.stopped = false;
            }
        }
    };

Our `move` method will need to deal with a complex behaviour:
- if the player has just spawned follow it (taking the offset into account),
- otherwise if the emitter is **not** shooting:
    - if the emitter is *close enough* (i.e. two pixels) to the destination, pick a new destination and start shooting,
    - otherwise move towards the destination (limiting the space traveled each frame by the emitter's speed).


    BHell_Emitter_Probe.prototype.move = function (x, y) {
    
            if (my.player.justSpawned) {
                this.x = my.player.x + this.offsetX;
                this.y = my.player.y + this.offsetY;
                this.destX = my.player.x + this.offsetX;
                this.destY = my.player.y + this.offsetY;
            }
    
            if (!this.stopped) {
                var dx = this.destX - this.x;
                var dy = this.destY - this.y;
    
                if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
                    var phi = Math.random() * 2 * Math.PI;
                    var r = Math.random() * this.radius;
    
                    this.destX = x + Math.round(Math.cos(phi) * r) + this.offsetX;
                    this.destY = y + Math.round(Math.sin(phi) * r) + this.offsetY;
                    this.stopped = true;
                }
                else {
                    var angle = Math.atan2(dy, dx);
    
                    if (dx > 0) {
                        this.x += Math.cos(angle) * Math.min(dx, this.speed);
                    }
                    else if (dx < 0) {
                        this.x += Math.cos(angle) * Math.max(dx, this.speed);
                    }
    
                    if (dy > 0) {
                        this.y += Math.sin(angle) * Math.min(dy, this.speed);
                    }
                    else if (dy < 0) {
                        this.y += Math.sin(angle) * Math.max(dy, this.speed);
                    }
                }
            }
        };

The shooting behaviour (enabled only when the emitter is not moving) is the following:
- if there are enemies on screen spawn a bullet aimed at every one of them,
- otherwise (there are no enemies on stage or we are previewing the player in the shop or player selection screens), spawn a bullet aimed at a random direction.


    BHell_Emitter_Probe.prototype.shoot = function () {
        if (this.stopped) {
            if (my.controller != null && my.controller.enemies != null) {
                for (var l = 0; l < my.controller.enemies.length; l++) {
                    var enemy = my.controller.enemies[l];
                    var angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                    var bullet = new my.BHell_Bullet(this.x, this.y, angle, this.bulletParams, this.bulletList);

                    this.parent.addChild(bullet);
                    this.bulletList.push(bullet);
                }
            }
            else {
                var angle = Math.random() * 2 * Math.PI;
                var bullet = new my.BHell_Bullet(this.x, this.y, angle, this.bulletParams, this.bulletList);

                this.parent.addChild(bullet);
                this.bulletList.push(bullet);
            }
        }
    };
    
If we were dealing with an enemy emitter, we could stop here and equip an enemy class with it, but for player's use we need to do something more.
Player's emitters are parsed by {@link BHell.BHell_Emitter_Factory}, which takes care of properly parsing parameters and, most importantly, to implement the ranking mechanics for the emitters (i.e. the `rate` rank will modify the emitter's `period`, while the `power` rank will determine if the emitter should be created or not).

To allow our players to use our `BHell_Emitter_Probe`, we need to extend {@link BHell.BHell_Emitter_Factory.create} so that it will return an instance of our emitter when it receives a `emitter.type` parameter equal to `"probe"`.
Since this method is static, we need to extend it by saving the previous implementation in a variable and then call it from the new method:

    var _Emitter_Factory_Create = my.BHell_Emitter_Factory.create;
    my.BHell_Emitter_Factory.create = function (emitter, x, y, w, h, params, parent, bulletList) {
        var ret = _Emitter_Factory_Create.call(this, emitter, x, y, w, h, params, parent, bulletList);

        if (ret == null && emitter.type === "probe") {
            params.speed = my.parse(emitter.params.speed, x, y, w, h, Graphics.width, Graphics.height);
            params.radius = my.parse(emitter.params.radius, x, y, w, h, Graphics.width, Graphics.height);
            params.shootingFrames = my.parse(emitter.params.shooting_frames, x, y, w, h, Graphics.width, Graphics.height);
            ret = new my.BHell_Emitter_Probe(x, y, params, parent, bulletList);
        }

        return ret;
    };

Our `emitter_probe.js` is now complete:

    var BHell = (function (my) {
        
        var _Emitter_Factory_Create = my.BHell_Emitter_Factory.create;
        my.BHell_Emitter_Factory.create = function (emitter, x, y, w, h, params, parent, bulletList) {
            var ret = _Emitter_Factory_Create.call(this, emitter, x, y, w, h, params, parent, bulletList);
    
            if (ret == null && emitter.type === "probe") {
                params.speed = my.parse(emitter.params.speed, x, y, w, h, Graphics.width, Graphics.height);
                params.radius = my.parse(emitter.params.radius, x, y, w, h, Graphics.width, Graphics.height);
                params.shootingFrames = my.parse(emitter.params.shooting_frames, x, y, w, h, Graphics.width, Graphics.height);
                ret = new my.BHell_Emitter_Probe(x, y, params, parent, bulletList);
            }
    
            return ret;
        };
    
        var BHell_Emitter_Probe = my.BHell_Emitter_Probe = function () {
            this.initialize.apply(this, arguments);
        };
    
        BHell_Emitter_Probe.prototype = Object.create(my.BHell_Emitter_Base.prototype);
        BHell_Emitter_Probe.prototype.constructor = BHell_Emitter_Probe;
    
    
        BHell_Emitter_Probe.prototype.initialize = function (x, y, params, parent, bulletList) {
            my.BHell_Emitter_Base.prototype.initialize.call(this, x, y, params, parent, bulletList);
            this.radius = 20;
            this.speed = 5;
            this.shootingFrames = 60;
    
            if (params != null) {
                this.radius = params.radius || this.radius;
                this.speed = params.speed || this.speed;
                this.shootingFrames = params.shootingFrames || this.shootingFrames;
            }
    
            this.x = my.player.x + this.offsetX;
            this.y = my.player.y + this.offsetY;
            this.destX = this.x;
            this.destY = this.y;
            this.stopped = false;
            this.k = 0;
        };
    
        BHell_Emitter_Probe.prototype.update = function () {
            my.BHell_Sprite.prototype.update.call(this);
    
            if (this.stopped) {
                if (this.shooting === true) {
                    if (this.j === 0) {
                        this.shoot();
                    }
                    this.j = (this.j + 1) % this.period;
                }
    
                this.oldShooting = this.shooting;
    
                this.k = (this.k + 1) % this.shootingFrames;
                if (this.k === 0) {
                    this.stopped = false;
                }
            }
        };
    
        BHell_Emitter_Probe.prototype.move = function (x, y) {
    
            if (my.player.justSpawned) {
                this.x = my.player.x + this.offsetX;
                this.y = my.player.y + this.offsetY;
                this.destX = my.player.x + this.offsetX;
                this.destY = my.player.y + this.offsetY;
            }
    
            if (!this.stopped) {
                var dx = this.destX - this.x;
                var dy = this.destY - this.y;
    
                if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
                    var phi = Math.random() * 2 * Math.PI;
                    var r = Math.random() * this.radius;
    
                    this.destX = x + Math.round(Math.cos(phi) * r) + this.offsetX;
                    this.destY = y + Math.round(Math.sin(phi) * r) + this.offsetY;
                    this.stopped = true;
                }
                else {
                    var angle = Math.atan2(dy, dx);
    
                    if (dx > 0) {
                        this.x += Math.cos(angle) * Math.min(dx, this.speed);
                    }
                    else if (dx < 0) {
                        this.x += Math.cos(angle) * Math.max(dx, this.speed);
                    }
    
                    if (dy > 0) {
                        this.y += Math.sin(angle) * Math.min(dy, this.speed);
                    }
                    else if (dy < 0) {
                        this.y += Math.sin(angle) * Math.max(dy, this.speed);
                    }
                }
            }
        };
    
        BHell_Emitter_Probe.prototype.shoot = function () {
            if (this.stopped) {
                if (my.controller != null && my.controller.enemies != null) {
                    for (var l = 0; l < my.controller.enemies.length; l++) {
                        var enemy = my.controller.enemies[l];
                        var angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                        var bullet = new my.BHell_Bullet(this.x, this.y, angle, this.bulletParams, this.bulletList);
    
                        this.parent.addChild(bullet);
                        this.bulletList.push(bullet);
                    }
                }
                else {
                    var angle = Math.random() * 2 * Math.PI;
                    var bullet = new my.BHell_Bullet(this.x, this.y, angle, this.bulletParams, this.bulletList);
    
                    this.parent.addChild(bullet);
                    this.bulletList.push(bullet);
                }
            }
        };
    
        return my;
    }(BHell || {}));


We are now ready to attach this emitter to a player in our JSON:

    {
      "type": "probe",
      "params": {
        "x": 0,
        "y": -50,
        "period": 120,
        "radius": 50,
        "ranks": ["S"],
        "shooting_frames": 60,
        "speed": 4,
        "sprite": "$Helpers",
        "index": 0,
        "direction": 2,
        "animated": false,
        "bullet": {
          "sprite": "$Bullets",
          "index": 0,
          "direction": 2,
          "frame": 1,
          "speed": 9,
          "animated": false
        }
      }
    }

**Note**: Due to its random movements, it's highly recommended to always use this emitter with a sprite, so the player will always know where the emitter is.

**Important**: This emitter aims at the enemies, it would be therefore stupid to equip an enemy with it (unless you are planning on creating a `BHell_Enemy_Traitor` class).

### BHell_Emitter_Circle

In this part of the tutorial we want to create a `BHell_Emitter_Circle`, capable of shooting a ring of bullets. To make the ring dodgeable, we want it to alternate arcs with actual bullets and empty arcs, like the following:

![Emitter Circle with default parameters (20 pulses, 25% duty cycle)](emitter_circle.gif)

We also want our emitter to be customisable in terms of how wide our arcs are and how many of them are going to be shot.

To achieve this result, let's divide our circle into `pulses`. Unlike the previous image (which had 20 `pulses`), the following has only 5:

![Emitter Circle with 5 pulses](emitter_circle_pulses.gif)

Another parameter we can customise is the `duty_cycle`, intended as the percentage of pulse which should have bullets in it. The following image has a 0.8 `duty_cycle` (80%), instead of 0.25 of the first image (while they both have 20 `pulses` each):

![Emitter Circle with 80% duty cycle](emitter_circle_duty.gif)

What we are going to do is to divide each pulse into two parts:
- the first one being filled with bullets (let's call it the `on` part),
- the latter being empty (let's call it the `off` part).

When the `aim` flag is set to `true`, we want the `on` part of the first pulse to be centered at the player's position.
Just like {@link BHell.BHell_Emitter_Angle}, {@link BHell.BHell_Emitter_Spray} and {@link BHell.BHell_Emitter_Burst}, we also want to define the parameters `always_aim`, `aim_x` and `aim_y` which work in a similar fashion:
- `always_aim`: if `true` keeps aiming at the player at every shot (if `false` aiming is done only when an enemy calls {@link BHell.BHell_Enemy_Base#shoot} with `false`, followed by a call with `true`),
- `aim_x`: moves the aim x coordinate away from the player,
- `aim_y`: moves the aim y coordinate away from the player.

Finally we want an additional flag, which we'll call `invert`, capable of inverting the other parameter's behaviour (e.g. if we are aiming towards the player, the `off` part will be centered and the actual duty cycle will be `1 - duty_cycle`).

Let's now create an `emitter_circle.js` plugin, with our `BHell_Emitter_Circle` class:

    var BHell = (function (my) {
    
        var BHell_Emitter_Circle = my.BHell_Emitter_Circle = function () {
            this.initialize.apply(this, arguments);
        };
    
        BHell_Emitter_Circle.prototype = Object.create(my.BHell_Emitter_Base.prototype);
        BHell_Emitter_Circle.prototype.constructor = BHell_Emitter_Circle;
    
    
        BHell_Emitter_Circle.prototype.initialize = function (x, y, params, parent, bulletList) {
            my.BHell_Emitter_Base.prototype.initialize.call(this, x, y, params, parent, bulletList);
        };
    
        return my;
    }(BHell || {})); 

We need to initialise our parameters, and an additional variable, required for aiming purposes:
- `n`: the number of bullets we want to spawn in our circle,
- `duty_cycle`: the percentage of circle which will be filled with bullets,
- `pulses`: how many arcs should the circle be divided into,
- `invert`: whether the `on` and `off` parts of each pulse should be inverted,
- `aim`: if `true` aims towards the player,
- `always_aim`: if `true` recalculates the aiming angle every time,
- `aim_x`: aiming x offset,
- `aim_y`: aiming y offset,
- `aimingAngle`: required for storing the angle between shots if `aim` is set to `true` but `always_aim` is set to `false`.


    BHell_Emitter_Circle.prototype.initialize = function (x, y, params, parent, bulletList) {
        my.BHell_Emitter_Base.prototype.initialize.call(this, x, y, params, parent, bulletList);
        this.n = 360;
        this.dutyCycle = 0.25;
        this.pulses = 20;
        this.invert = false;

        this.aim = false;
        this.alwaysAim = false;
        this.aimX = 0;
        this.aimY = 0;

        this.aimingAngle = 0;

        if (params != null) {
            this.n = params.n || this.n;
            this.dutyCycle = params.duty_cycle || this.dutyCycle;
            this.pulses = params.pulses || this.pulses;
            this.invert = params.invert || this.invert;
            this.aim = params.aim || this.aim;
            this.alwaysAim = params.always_aim || this.alwaysAim;
            this.aimX = params.aim_x || this.aimX;
            this.aimY = params.aim_y || this.aimY;
        }
    };
    
If we are shooting with `duty_cycle = 1` (100%), our circle will contain exactly `n` bullets, fired with a `2 * Math.PI / n` angle between each other.

To achieve a different duty cycle, we need to "erase" some of those bullets (and obtaining an actual number of bullets on screen less than `n`, e.g. for a 40% duty cycle we would have `n * 0.4` bullets and `n * 0.6` "empty spaces").

Since we want our bullets to be evenly spaced, we divide our `on` and `off` areas into `pulses`, each one containing `pulseWidth = n / pulses` "slots", with only `dutyCount = pulseWidth * dutyCycle` bullets in them (and therefore `pulseWidth - dutyCount` "empty spaces" after the bullets).

If the `invert` flag is not set, we want the **first** part (following our arc in a clockwise fashion) of each pulse to contain our bullets, otherwise (if the `invert` flag is set), we want the **second** part. The `xor` (`^`) operator can allow us to shorten our condition a little.

To "center" our ring in the middle of the `on` part of the first pulse, we need to rotate *counterclockwise* every angle by `2 * Math.PI / (dutyCount / 2)`.

    BHell_Emitter_Circle.prototype.shoot = function () {
        var pulseWidth = Math.round(this.n / this.pulses);
        var dutyCount = Math.round(this.dutyCycle * pulseWidth);

        for (var k = 0; k < this.n; k++) {

            if (((k % pulseWidth) < dutyCount) ^ this.invert) {
                var bullet;
                if (this.aim) {
                    if (this.alwaysAim || this.oldShooting === false) {
                        var dx = my.player.x - this.x + this.aimX;
                        var dy = my.player.y - this.y + this.aimY;
                        this.aimingAngle = Math.atan2(dy, dx);
                    }

                    bullet = new my.BHell_Bullet(this.x, this.y, this.aimingAngle - Math.PI + 2 * Math.PI / this.n * (k - dutyCount / 2), this.bulletParams, this.bulletList);
                }
                else {
                    bullet = new my.BHell_Bullet(this.x, this.y, 2 * Math.PI / this.n * (k - dutyCount / 2), this.bulletParams, this.bulletList);
                }

                this.parent.addChild(bullet);
                this.bulletList.push(bullet);
            }
        }
    };  

Our complete `BHell_Emitter_Circle` looks like this:

    var BHell = (function (my) {
    
    
        var BHell_Emitter_Circle = my.BHell_Emitter_Circle = function () {
            this.initialize.apply(this, arguments);
        };
    
        BHell_Emitter_Circle.prototype = Object.create(my.BHell_Emitter_Base.prototype);
        BHell_Emitter_Circle.prototype.constructor = BHell_Emitter_Circle;
    
    
        BHell_Emitter_Circle.prototype.initialize = function (x, y, params, parent, bulletList) {
            my.BHell_Emitter_Base.prototype.initialize.call(this, x, y, params, parent, bulletList);
            this.n = 360;
            this.dutyCycle = 0.25;
            this.pulses = 20;
            this.invert = false;
    
            this.aim = false;
            this.alwaysAim = false;
            this.aimX = 0;
            this.aimY = 0;
    
            this.aimingAngle = 0;
    
            if (params != null) {
                this.n = params.n || this.n;
                this.dutyCycle = params.duty_cycle || this.dutyCycle;
                this.pulses = params.pulses || this.pulses;
                this.invert = params.invert || this.invert;
                this.aim = params.aim || this.aim;
                this.alwaysAim = params.always_aim || this.alwaysAim;
                this.aimX = params.aim_x || this.aimX;
                this.aimY = params.aim_y || this.aimY;
            }
        };
    
        BHell_Emitter_Circle.prototype.shoot = function () {
            var pulseWidth = Math.round(this.n / this.pulses);
            var dutyCount = Math.round(this.dutyCycle * pulseWidth);
    
            for (var k = 0; k < this.n; k++) {
    
                if (((k % pulseWidth) < dutyCount) ^ this.invert) {
                    var bullet;
                    if (this.aim) {
                        if (this.alwaysAim || this.oldShooting === false) {
                            var dx = my.player.x - this.x + this.aimX;
                            var dy = my.player.y - this.y + this.aimY;
                            this.aimingAngle = Math.atan2(dy, dx);
                        }
    
                        bullet = new my.BHell_Bullet(this.x, this.y, this.aimingAngle - Math.PI + 2 * Math.PI / this.n * (k - dutyCount / 2), this.bulletParams, this.bulletList);
                    }
                    else {
                        bullet = new my.BHell_Bullet(this.x, this.y, 2 * Math.PI / this.n * (k - dutyCount / 2), this.bulletParams, this.bulletList);
                    }
    
                    this.parent.addChild(bullet);
                    this.bulletList.push(bullet);
                }
            }
        };
    
        return my;
    }(BHell || {}));

**Note**: If we wanted, we could make this emitter available for the player as well. To achieve this, we simply need to extend {@link BHell.BHell_Emitter_Factory.create} like we did in the previous example.