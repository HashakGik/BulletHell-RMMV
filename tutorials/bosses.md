In this tutorial we are going to create two bosses: a simple `orbiter` enemy *promoted* to boss and a more complicated example.

The engine considers bosses every enemy spawned by a generator with the parameter flag `boss` set to `true`.
When one or more of these generators becomes active, an health bar will be shown on screen and will show the **total** health of the spawned enemies.

A boss generator doesn't have to set any of the `sync` or `stop` flags (see {@tutorial mechanics}), but it's usually a good idea to synchronise the stage.

For both bosses on this tutorial, we are going to use a custom charset. Each frame is 777x440 pixels, but the hitbox for each enemy will be smaller.

![Bosses charset]($Bosses.png)


### Upgrading an enemy
Let's start by creating a normal generator spawning a single `orbiter` enemy and let's set our custom charset.

![Orbiter enemy](orbiterboss1.png)

Since each of the charset's frames show different monsters, it's a good idea to disable the frame animation. We'll resize the hitbox as well in order to avoid hitting the enemy when shooting against transparent pixels of the frame.

![Orbiter enemy with hitbox](orbiterboss2.png)


So far, we've made a **normal** enemy with a big sprite: let's turn it into a boss.

![Orbiter boss](orbiterboss3.png)

Finally let's tweak some other parameters: we want our boss to have a decent amount of hit points after all, and maybe bullets different than normal enemies as well.

![Orbiter boss completed](orbiterboss.png)

Our complete boss will look like this.

![Orbiter boss on stage](orbiterboss.gif)

### Creating a custom boss
So far, we were just playing around. It's time to get serious, be aware that this part of the tutorial is not for the faint of heart.

We are going to create a `Darklord` boss with three different shooting patterns and a complex behaviour.
We are, conceptually, going to create a new enemy (in the same way as {@tutorial enemies_js}), but the {@link BHell.BHell_Enemy_Base#update} method (as well as some others) will be heavily modified. 

Since handling the boss' behaviour is a complicated process, we will use a *divide et impera* approach and tackle one aspect of the behaviour at the time, putting everything together at the end.

#### Movement
Let's say we want our boss to slowly move left and right without leaving the screen.
To achieve this behaviour, we can use either {@link BHell.BHell_Mover_Bounce} or {@link BHell.BHell_Mover_Harmonic}, by carefully choosing the right values for their parameters.

Since `Bounce` requires fewer parameters, we will choose it.

We want our boss to start moving from the center of the screen and at a height of 200 pixels, so it's entirely on screen.
We also want it not to leave the screen, so the mover's `width` and `height` parameters will be set to the boss' hitbox.
Finally we want it to move only along the horizontal axis, so we will set the `angle` parameter to either 0 (initial movement to the right) or `Math.PI / 2` (initial movement to the left).

    this.mover = new my.BHell_Mover_Bounce(Graphics.width / 2, 200, 0, this.hitboxW, this.hitboxH);

#### Emitters
Unlike normal enemies, this boss' sprite is huge, so it's a good idea **not** to spawn bullets from the center.

For this tutorial, let's say we want our boss to shoot from these positions:

![Darklord emitters](darklord_emitters.png)

The coordinates (referred to the boss' center) are the following:
- Left wing: `-160, -118`
- Right wing:  `152, -134`
- Left hand: `-46, -68`
- Right hand: `100, -68`
- Left claw: `-98, 100`
- Right claw: `127, 106`
- Forehead:  `42, -82`

For simplicity's sake let's say we want our emitters to be symmetric, so let's establish the following:
- Left and right wing will fire streaks of bullets to the side of the player, preventing it to escape:

![Darklord wings](darklord_wings.gif)

- Left and right hands will fire circles of bullets which will fill the screen:

![Darklord hands](darklord_hands.gif)

- Left and right claws will fire swirls rotating in opposite directions:

![Darklord claws](darklord_claws.gif)

- The forehead won't shoot any bullet, instead it will spawn some `Probe` enemies:

![Darklord forehead](darklord_forehead.gif)


Let's consider each of these four as if they were each a single enemy.

##### Forehead

We are going to make our forehead spawn a new `Probe` enemy every three seconds (180 frames).
In order to do so, we need a frame counter.

    BHell_Enemy_Darklord.prototype.initializeForehead = function () {
        this.foreheadCounter = 0;
    };

Since we are not using any generator, we need to manually set each of the enemy parameter by hand.
Since our forehead "emitter" is located at `42, -82`, our enemy will be spawned at `this.x + 42, this.y - 82`.

**Important**: remember that the JSON parameters are read only by {@link BHell.BHell_Generator}, so if you omit some parameter, the default value will be the one set inside the `BHell_Enemy_*` class we are using ({@link BHell.BHell_Enemy_Probe} in this case), **not** the one in the JSON. 

    BHell_Enemy_Darklord.prototype.updateForehead = function() {
        // Spawn a probe enemy every 3 seconds.
        this.foreheadCounter = (this.foreheadCounter + 1) % 180;

        if (this.foreheadCounter === 0) {
            // Since no generator is used, we need to set the image parameters by hand as well.
            var image = {"characterName":"Evil","direction":2,"pattern":0,"characterIndex":6};
            var params = {};
            params.animated = true;
            params.aim = true;
            params.bullet = {};
            params.bullet.frame = 2;
            my.controller.enemies.push(new my.BHell_Enemy_Probe(this.x + 42, this.y - 82, image, params, this.parent, my.controller.enemies));
        }
    };

##### Hands
Our boss' hands will spawn a circle of bullets every five seconds.
To achieve this behaviour, all we need to do is to create a {@link BHell.BHell_Emitter_Spray} covering a full circle and with a period of `300`.

Once everything is done, we can tweak the other parameters in order to adjust the dodging difficulty of the pattern.
For the time being, let's assume `n = 45` and `bullet.speed = 0.5`.

    BHell_Enemy_Darklord.prototype.initializeHands = function (parent) {
        var handsParams = {};
        handsParams.bullet = {};
        handsParams.bullet.speed = 0.5;
        handsParams.bullet.index = 0;
        handsParams.bullet.frame = 0;
        handsParams.bullet.direction = 2;
        handsParams.period = 300;
        handsParams.a = 0;
        handsParams.b = 2 * Math.PI;
        handsParams.n = 45;
        this.handsEmitters = [];
        this.handsEmitters.push(new my.BHell_Emitter_Spray(0, 0, handsParams, parent, my.enemyBullets));
        this.handsEmitters.push(new my.BHell_Emitter_Spray(0, 0, handsParams, parent, my.enemyBullets));
        this.handsEmitters[0].offsetX = -46;
        this.handsEmitters[0].offsetY = -68;
        this.handsEmitters[1].offsetX = 100;
        this.handsEmitters[1].offsetY = -60;
    };
    
Since everything is handled by the emitter (we want our hands to shoot periodically, not any strange stuff, like the boss' forehead behaviour), the `update` method is trivial:

    BHell_Enemy_Darklord.prototype.updateHands = function() {
        this.shoot(this.handsEmitters, true);
    };

##### Claws
We want our claws to shoot some rotating bullets, but since a continuous streak would be undodgeable, we want to alternate between three seconds of shooting and two seconds of waiting (for a total of five seconds, or 300 frames).

The implementation of rotating bullets is the same as {@link BHell.BHell_Enemy_Swirler}: a {@link BHell.Bhell_Emitter_Spray} will shoot constantly, but between each shot the `angle` parameter will be updated.

To implement the on and off behaviour we need a time counter, the emitters have a very low `period` in order to achieve a continuous streak.

    BHell_Enemy_Darklord.prototype.initializeClaws = function (parent) {
        var clawsParams = {};
        clawsParams.bullet = {};
        clawsParams.bullet.speed = 1;
        clawsParams.bullet.index = 0;
        clawsParams.bullet.frame = 2;
        clawsParams.bullet.direction = 2;
        clawsParams.period = 5;
        clawsParams.a = Math.PI;
        clawsParams.b = 3 * Math.PI;
        clawsParams.n = 5;
        
        this.clawsEmitters = [];
        this.clawsEmitters.push(new my.BHell_Emitter_Spray(0, 0, clawsParams, parent, my.enemyBullets));
        this.clawsEmitters.push(new my.BHell_Emitter_Spray(0, 0, clawsParams, parent, my.enemyBullets));
        this.clawsEmitters[0].offsetX = -98;
        this.clawsEmitters[0].offsetY = 100;
        this.clawsEmitters[1].offsetX = 127;
        this.clawsEmitters[1].offsetY = 106;
        this.clawsCounter = 0;
    };
    
Unlike our boss' hands, the `update` method will be slightly more complicated:
- our counter should reset every five seconds (300 frames),
- the emitters should shoot for the first three seconds (180 frames) of the counter,
- when the counter is reset we want to reset the rotation angles as well (in order to make the pattern more predictable),
- we want our left claw to swirl clockwise and our right one to swirl counterclockwise.


    BHell_Enemy_Darklord.prototype.updateClaws = function() {
        if (this.clawsCounter === 0) {
            this.clawsEmitters[0].a = Math.PI;
            this.clawsEmitters[0].b = 3 * Math.PI;
            this.clawsEmitters[1].a = 0;
            this.clawsEmitters[1].b = 2 * Math.PI;
        }
        this.shoot(this.clawsEmitters, this.clawsCounter < 180);

        this.clawsEmitters[0].a += 0.004;
        this.clawsEmitters[0].b += 0.004;
        this.clawsEmitters[1].a -= 0.004;
        this.clawsEmitters[1].b -= 0.004;

        this.clawsCounter = (this.clawsCounter + 1) % 300;
    };

##### Wings
Our wings should shoot a continuous streak of bullets, aimed left (for the left wing) and right (for the right wing) of the player, in order to limit its movements.

In order to achieve this, we are going to use two {@link BHell.BHell_Emitter_Angle} with the `aim` and `alwaysAim` parameters set to true and the `aimX` parameter set to 100 pixels (with a different sign for each emitter).

If the bullet speed were too fast, we would never be able to confine the player (since the aiming would be fast enough to follow every movement). In order to *lag* the aiming behaviour, all we need to do is to set `bullet.speed` to a reasonably low value (e.g. one pixel per frame).  


    BHell_Enemy_Darklord.prototype.initializeWings = function (parent) {
        var wingsParams = {};
        wingsParams.bullet = {};
        wingsParams.bullet.speed = 1;
        wingsParams.bullet.index = 0;
        wingsParams.bullet.frame = 2;
        wingsParams.bullet.direction = 8;
        wingsParams.period = 5;
        wingsParams.alwaysAim = true;
        wingsParams.aim = true;
        this.wingsEmitters = [];
        this.wingsEmitters.push(new my.BHell_Emitter_Angle(0, 0, wingsParams, parent, my.enemyBullets));
        this.wingsEmitters.push(new my.BHell_Emitter_Angle(0, 0, wingsParams, parent, my.enemyBullets));
        this.wingsEmitters[0].offsetX = 152;
        this.wingsEmitters[0].offsetY = -134;
        this.wingsEmitters[1].offsetX = -160;
        this.wingsEmitters[1].offsetY = -118;
        this.wingsEmitters[0].aimX = 100;
        this.wingsEmitters[0].alwaysAim = true;
        this.wingsEmitters[1].alwaysAim = true;
        this.wingsEmitters[1].aimX = -100;
    };
    
Just like our boss' hands, updating our wings is a trivial matter:

    BHell_Enemy_Darklord.prototype.updateWings = function() {
        this.shoot(this.wingsEmitters,true);
    };    

#### Finite state machine
If our boss were to shoot from all of its emitters at once we would incur into two main problems:
- The bullet patterns would be too chaotic and make it difficult for the player to dodge them,
-  The boss would lack *character* and look just like an overpowered, but still boring, enemy.

To solve these problems we simply need to *change* our boss' behaviour from time to time, allowing it to perform not a single, complicated and almost undodgeable, shooting pattern, but to choose from many different (and way more dodgeable) ones.

A {@link http://en.wikipedia.org/wiki/Finite_state_machine finite state machine} is an entity that can be in one of many *states* (which determine its behaviour) and can *transit* from one state to another in response to stimuli (either internal or external).

Many everyday "things" are finite state machines, allow me to use a vending machine to better exemplify the concept. We can consider a vending machine as something with the following states:
1. Waiting for a coin: in this state none of the buttons work and no item is delivered to the user,
2. Waiting for input: in this state the buttons are enabled, but no item is delivered yet,
3. Delivering: in this state buttons are disabled again and the selected item is being delivered.

The *transitions* between these states are the following:
- If the machine is in state 1 and a coin is inserted (external stimulus), go to state 2,
- If the machine is in state 2 and a button is pressed (external stimulus), go to state 3,
- If the machine is in state 2 and a timeout (internal stimulus) expires (because the user didn't press any button), go to state 1 (and possibly return the coin),
- If the machine is in state 3 and the item is delivered (internal stimulus), go to state 1.

From the example above, we can see the *future* state (or behaviour) of our system depends on two things:
1. The *current* state (behaviour),
2. The stimulus which the system receives.

Let's return to our boss, some of the internal stimuli it can receive and an example of associated behaviour could be:
- Time: after ten seconds the boss could change its shooting pattern,
- Current hit points: if its life is low it may shoot more aggressively,
- A combination of time and hit points: if it looses too many hit points too quickly, it may become stunned,
- Position: for example, if it's outside the screen it won't shoot,
- etc.

Some of the external stimuli, on the other hand, might be:
- Player position: if the player is directly below, the boss may try to ram it,
- Player attacks: if the player is throwing a bomb, the boss may become invincible,
- Player death: the boss might laugh,
- Number of other enemies on screen: the boss might decide not to shoot until the other enemies are dispatched,
- etc.

**Note**: In this tutorial we will focus on the *shooting behaviour* (and some fancy stuff like sound effects and explosions), but you can customise every aspect of your bosses (including movement and appearance).

For our boss we want to implement the following behaviours:
- `started`: the boss won't shoot,
- `pattern 1`: the boss will shoot from hands and claws,
- `pattern 2`: the boss will shoot from hands and wings,
- `pattern 3`: the boss will spawn `probes` from the forehead,
- `stunned`: the boss won't shoot nor move,
- `waiting`: the boss won't shoot,
- `dying`: the boss won't shoot nor move and will spawn multiple explosions before disappearing.

We also want the following transitions from one state to another:
- `started > pattern 1`: when the boss reaches its starting position (we also want it to play a growling sound effect),
- `pattern 1 > pattern 2`: after 10 seconds,
- `pattern 2 > pattern 1`: after 10 seconds, with a 70% chance,
- `pattern 2 > pattern 3`: after 10 seconds, with a 30% chance,
- `pattern 3 > waiting`: after 10 seconds or if the player is killed,
- `waiting > pattern 1`: if there is only one (the boss itself) enemy on screen,
- `stunned > pattern 1`: after 10 seconds,
- `dying > (destroyed)`: after 5 seconds (we also want to play a dying sound effect),

and the following transitions which will ignore the current state:
- `(any) > stunned`: the player has dealt at least 100 hit points of damage in a single second (we also want every enemy bullet on screen to disappear),
- `(any) > dying`: the current hit points are 0 (we also want to destroy the enemy bullets).

Finally we want to *delay* our state change for three seconds (so the bullets have some time to leave the screen), so we will add a fake `changing` state which behaves like this:
- `(any) > changing`: the boss will save the scheduled future state and won't shoot,
- `changing > (scheduled state)`: the boss will actually perform the state change.  



**Note**: the stunning condition we defined is simple to implement but not fair, some players will never be able to fire that many bullets in a short period of time (never triggering the `stunned` state), while others will be so fast the boss might become a sitting duck.

In general, one of the simplest ways to create a finite state machine is to use the `switch` construct in the following way:

    var update = function () {
        // update the time counter and other stimuli
        
        // Check for stimuli which will change the state ignoring the current one
        // (for example the "dying" state should be triggered when hp === 0,
        //  no matter which state is the current one).
        if (stimulus 0 is received) {
            // change to state "state 4"
        }
    
        // Handle each state.
        switch (this.state) {
            case "state 1":
                // Behaviour corresponding to state 1
                
                // Check for stimuli which must be handled only when on state 1
                if (stimulus 1 is received) {
                    // change state to "state 2"
                }
                else if (stimulus 2 is received) {
                    // change state to "state 3"
                }
            break;
            case "state 2":
                // Behaviour corresponding to state 2
                
                // Check for stimuli which must be handled only when on state 2
                if (stimulus 3 is received) {
                    // change state to "state 1"
                }
                // etc.
            break;
            // etc.
         }
         
         // update logic common to each state (e.g. update the sprites or the position).
    };

Let's apply this scheme to our update method (which will completely replace {@link BHell.BHell_Enemy_Base#update}, and therefore call only {@link BHell.BHell_Sprite#update}):

    BHell_Enemy_Darklord.prototype.update = function () {
        my.BHell_Sprite.prototype.update.call(this);

        if (this.state !== "dying" && this.state !== "stunned") {
            this.move();
        }

        if (this.receivedDamage > 100 && this.mover.inPosition === true) {
            my.explosions.push(new my.BHell_Explosion(this.lastX, this.lastY, this.parent, my.explosions));
            this.changeState("stunned");
            my.controller.destroyEnemyBullets();
        }

        switch (this.state) {
            case "started":
                if (this.mover.inPosition === true) {
                    AudioManager.playSe({name: "Monster5", volume: 100, pitch: 100, pan: 0});
                    this.changeState("pattern 1");
                }
                break;
            case "pattern 1": // Shoots from the hands and the claws for 10 seconds, then switches to pattern 2
                if (this.j > 600) {
                    this.changeState("pattern 2");
                } else {
                    this.updateClaws();
                    this.updateHands();
                }

                break;
            case "pattern 2": // Shoots from the hands and the wings for 10 seconds, then switches randomly to pattern 1 or 3
                if (this.j > 600) {
                    if (Math.random() > 0.7) {
                        this.changeState("pattern 3");
                    }
                    else {
                        this.changeState("pattern 1");
                    }
                } else {
                    this.updateWings();
                    this.updateHands();
                }
                break;
            case "pattern 3": // Spawns some probe enemies until the player dies or for 10 seconds.
                if (my.player.justSpawned || this.j > 600) {
                    this.changeState("waiting");
                }
                else {
                    this.updateForehead();
                }

                break;
            case "waiting": // Waits until there are no more enemies on screen.
                if (my.controller.enemies.length === 1) {
                    this.changeState("pattern 1");
                }
                break;
            case "stunned": // Does nothing for 10 seconds.
                if (this.j > 600) {
                    this.changeState("pattern 1");
                }
                break;
            case "dying": // Spawns explosions for 5 seconds, then dies.
                if (this.j > 300) {
                    this.destroy();
                }
                else if (this.j % 10 === 0) {
                    my.explosions.push(new my.BHell_Explosion(Math.floor(Math.random() * this.hitboxW) + this.x - this.hitboxW / 2, Math.floor(Math.random() * this.hitboxH) + this.y - this.hitboxH / 2, this.parent, my.explosions));
                }

                break;
            case "changing": // Wait 3 seconds without shooting before actually changing to the scheduled state.
                if (this.j > 180) {
                    this.changeState(this.scheduledState);
                }
                break;
        }

        // Don't forget to update every emitter (including those not currently active),
        // otherwise they won't move with the boss!
        this.clawsEmitters.forEach(e => {
            e.update();
        });
        this.handsEmitters.forEach(e => {
            e.update();
        });
        this.wingsEmitters.forEach(e => {
            e.update();
        });

        // Update the received damage counter for the stunned state.
        if (this.j % 60 == 0) {
            this.receivedDamage = 0;
        }

        // Update the time counter and reset it every 20 seconds.
        this.j = (this.j + 1) % 1200;
    };

The `update` method doesn't set the `dying` state, that's because we already have a method which is automatically invoked when the hit points reach zero.
Let's override our {@link BHell.BHell_Enemy_Base#die} method to change our boss' state:

    BHell_Enemy_Darklord.prototype.die = function() {
        $gameBHellResult.score += this.killScore;
        AudioManager.playSe({name:"Collapse4", volume:100, pitch:100, pan:0});
        this.changeState("dying");

        my.controller.destroyEnemyBullets();
    };
    
There is one final problem we need to deal with: our `stunned` state is triggered when `receivedDamage` reaches 100, but no method is currently updating that variable.
Let's override {@link BHell.BHell_Enemy_Base#hit} (and while we are at it, let's make sure our boss won't receive any damage when it's `dying`):

    BHell_Enemy_Darklord.prototype.hit = function () {
        if (this.state !== "dying") {
            my.BHell_Enemy_Base.prototype.hit.call(this);

            if (this.state != "stunned") {
                this.receivedDamage++;
            }
        }
    };

The `changeState` function takes care of correctly switching between states by turning off every emitter and resetting the time counter.
If the current state is `changing` it actually performs the state change, otherwise it stores the future state and then switches to `changing`.
    
    BHell_Enemy_Darklord.prototype.changeState = function(s) {
        if (this.state === "changing") {
            this.state = s;
        }
        else {
            this.scheduledState = s;
            this.state = "changing";
        }

        this.shoot(this.clawsEmitters, false);
        this.shoot(this.handsEmitters, false);
        this.shoot(this.wingsEmitters, false);

        this.j = 0;
        };

You may now understand why we implemented the emitters separately: by doing so, we only have to turn on the ones required for the current state, leaving every other one off, but if you carefully inspected the code, you noticed something odd about the `shoot` function: its signature ({@link BHell.BHell_Enemy_Base#shoot}) takes only one parameter!

The truth is that the `shoot` function implemented in `BHell_Enemy_Base` would fire from every emitter, something we don't want to happen, so let's reimplement it allowing us to choose from which emitter we want to shoot:

    BHell_Enemy_Darklord.prototype.shoot = function(emitters, t) {
        // Replaces BHell_Enemy_Base.shoot(t). It enables only SOME emitters at the time (not all of them).
        emitters.forEach(e => {
            e.shooting = t && !my.player.justSpawned;
        });
    }; 

#### Putting the pieces together

As usual, let's start by creating a new `darklord.js` plugin and by opening our `BHell` module:

    var BHell = (function (my) {    
        /* Our code will go here */
        
        return my;
    }(BHell || {}));

And let's create a `BHell_Enemy_Darklord` class extending {@link BHell.BHell_Enemy_Base}:

    var BHell_Enemy_Darklord = my.BHell_Enemy_Darklord = function() {
        this.initialize.apply(this, arguments);
    };

    BHell_Enemy_Darklord.prototype = Object.create(my.BHell_Enemy_Base.prototype);
    BHell_Enemy_Darklord.prototype.constructor = BHell_Enemy_Darklord;

    BHell_Enemy_Darklord.prototype.initialize = function(x, y, image, params, parent, enemyList) {
        my.BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);
    };
    
We already wrote our `update` method, which handles our states in the way we want, and our auxiliary methods which are tailored for our needs.
All we need to do now is to initialise our boss. We have to:
- set some default parameters (for example hit points and speed),
- initialise our emitters,
- set the initial state,
- set the mover.


    BHell_Enemy_Darklord.prototype.initialize = function(x, y, image, params, parent, enemyList) {
        params.hp = 10000;
        params.speed = 0.3;
        params.hitbox_w = 399;
        params.hitbox_h = 350;
        params.animated = false;
        my.BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

        this.initializeForehead();
        this.initializeHands(parent);
        this.initializeClaws(parent);
        this.initializeWings(parent);

        this.j = 0;
        this.state = "started";
        this.receivedDamage = 0;

        this.mover = new my.BHell_Mover_Bounce(Graphics.width / 2, 200, 0, this.hitboxW, this.hitboxH);
    };

It looks like we have finished, but there is still one problem: if we test our class now, the emitters won't move with the boss!

By inspecting {@link BHell.BHell_Enemy_Base#move} we can easily spot the problem: that method moves only the emitters contained in `this.emitters`, but our emitters are divided into three arrays.
Let's fix this problem by rewriting the `move` method:

    BHell_Enemy_Darklord.prototype.move = function () {
        if (this.mover != null) {
            var p = this.mover.move(this.x, this.y, this.speed);
            this.x = p[0];
            this.y = p[1];
        }

        this.clawsEmitters.forEach(e => {
            e.move(this.x, this.y);
        });
        this.handsEmitters.forEach(e => {
            e.move(this.x, this.y);
        });
        this.wingsEmitters.forEach(e => {
            e.move(this.x, this.y);
        });
    };

#### The complete boss

Our complete `BHell_Enemy_Darklord` class will look like this:

    var BHell = (function (my) {
    
        var BHell_Enemy_Darklord = my.BHell_Enemy_Darklord = function() {
            this.initialize.apply(this, arguments);
        };
    
        BHell_Enemy_Darklord.prototype = Object.create(my.BHell_Enemy_Base.prototype);
        BHell_Enemy_Darklord.prototype.constructor = BHell_Enemy_Darklord;
    
        BHell_Enemy_Darklord.prototype.initialize = function(x, y, image, params, parent, enemyList) {
            params.hp = 10000;
            params.speed = 0.3;
            params.hitbox_w = 399;
            params.hitbox_h = 350;
            params.animated = false;
            my.BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);
    
            this.initializeForehead();
            this.initializeHands(parent);
            this.initializeClaws(parent);
            this.initializeWings(parent);
    
            this.j = 0;
            this.state = "started";
            this.receivedDamage = 0;
    
            this.mover = new my.BHell_Mover_Bounce(Graphics.width / 2, 200, 0, this.hitboxW, this.hitboxH);
        };
    
        BHell_Enemy_Darklord.prototype.initializeForehead = function () {
            this.foreheadCounter = 0;
        };
    
        BHell_Enemy_Darklord.prototype.initializeHands = function (parent) {
            var handsParams = {};
            handsParams.bullet = {};
            handsParams.bullet.speed = 0.5;
            handsParams.bullet.index = 0;
            handsParams.bullet.frame = 0;
            handsParams.bullet.direction = 2;
            handsParams.period = 300;
            handsParams.a = 0;
            handsParams.b = 2 * Math.PI;
            handsParams.n = 45;
            this.handsEmitters = [];
            this.handsEmitters.push(new my.BHell_Emitter_Spray(0, 0, handsParams, parent, my.enemyBullets));
            this.handsEmitters.push(new my.BHell_Emitter_Spray(0, 0, handsParams, parent, my.enemyBullets));
            this.handsEmitters[0].offsetX = -46;
            this.handsEmitters[0].offsetY = -68;
            this.handsEmitters[1].offsetX = 100;
            this.handsEmitters[1].offsetY = -60;
        };
    
        BHell_Enemy_Darklord.prototype.initializeClaws = function (parent) {
            var clawsParams = {};
            clawsParams.bullet = {};
            clawsParams.bullet.speed = 1;
            clawsParams.bullet.index = 0;
            clawsParams.bullet.frame = 2;
            clawsParams.bullet.direction = 2;
            clawsParams.period = 5;
            clawsParams.a = Math.PI;
            clawsParams.b = 3 * Math.PI;
            clawsParams.n = 5;
    
            this.clawsEmitters = [];
            this.clawsEmitters.push(new my.BHell_Emitter_Spray(0, 0, clawsParams, parent, my.enemyBullets));
            this.clawsEmitters.push(new my.BHell_Emitter_Spray(0, 0, clawsParams, parent, my.enemyBullets));
            this.clawsEmitters[0].offsetX = -98;
            this.clawsEmitters[0].offsetY = 100;
            this.clawsEmitters[1].offsetX = 127;
            this.clawsEmitters[1].offsetY = 106;
            this.clawsCounter = 0;
        };
    
        BHell_Enemy_Darklord.prototype.initializeWings = function (parent) {
            var wingsParams = {};
            wingsParams.bullet = {};
            wingsParams.bullet.speed = 1;
            wingsParams.bullet.index = 0;
            wingsParams.bullet.frame = 2;
            wingsParams.bullet.direction = 8;
            wingsParams.period = 5;
            wingsParams.alwaysAim = true;
            wingsParams.aim = true;
            this.wingsEmitters = [];
            this.wingsEmitters.push(new my.BHell_Emitter_Angle(0, 0, wingsParams, parent, my.enemyBullets));
            this.wingsEmitters.push(new my.BHell_Emitter_Angle(0, 0, wingsParams, parent, my.enemyBullets));
            this.wingsEmitters[0].offsetX = 152;
            this.wingsEmitters[0].offsetY = -134;
            this.wingsEmitters[1].offsetX = -160;
            this.wingsEmitters[1].offsetY = -118;
            this.wingsEmitters[0].aimX = 100;
            this.wingsEmitters[0].alwaysAim = true;
            this.wingsEmitters[1].alwaysAim = true;
            this.wingsEmitters[1].aimX = -100;
        };
    
    
        BHell_Enemy_Darklord.prototype.update = function () {
            my.BHell_Sprite.prototype.update.call(this);
    
            if (this.state !== "dying" && this.state !== "stunned") {
                this.move();
            }
    
            if (this.receivedDamage > 100 && this.mover.inPosition === true) {
                my.explosions.push(new my.BHell_Explosion(this.lastX, this.lastY, this.parent, my.explosions));
                this.changeState("stunned");
                my.controller.destroyEnemyBullets();
            }
    
            switch (this.state) {
                case "started":
                    if (this.mover.inPosition === true) {
                        AudioManager.playSe({name: "Monster5", volume: 100, pitch: 100, pan: 0});
                        this.changeState("pattern 1");
                    }
                    break;
                case "pattern 1": // Shoots from the hands and the claws for 10 seconds, then switches to pattern 2
                    if (this.j > 600) {
                        this.changeState("pattern 2");
                    } else {
                        this.updateClaws();
                        this.updateHands();
                    }
    
                    break;
                case "pattern 2": // Shoots from the hands and the wings for 10 seconds, then switches randomly to pattern 1 or 3
                    if (this.j > 600) {
                        if (Math.random() > 0.7) {
                            this.changeState("pattern 3");
                        }
                        else {
                            this.changeState("pattern 1");
                        }
                    } else {
                        this.updateWings();
                        this.updateHands();
                    }
                    break;
                case "pattern 3": // Spawns some probe enemies until the player dies or for 10 seconds.
                    if (my.player.justSpawned || this.j > 600) {
                        this.changeState("waiting");
                    }
                    else {
                        this.updateForehead();
                    }
    
                    break;
                case "waiting": // Waits until there are no more enemies on screen.
                    if (my.controller.enemies.length === 1) {
                        this.changeState("pattern 1");
                    }
                    break;
                case "stunned": // Does nothing for 10 seconds.
                    if (this.j > 600) {
                        this.changeState("pattern 1");
                    }
                    break;
                case "dying": // Spawns explosions for 5 seconds, then dies.
                    if (this.j > 300) {
                        this.destroy();
                    }
                    else if (this.j % 10 === 0) {
                        my.explosions.push(new my.BHell_Explosion(Math.floor(Math.random() * this.hitboxW) + this.x - this.hitboxW / 2, Math.floor(Math.random() * this.hitboxH) + this.y - this.hitboxH / 2, this.parent, my.explosions));
                    }
                    break;
                case "changing": // Wait 3 seconds without shooting before actually changing to the scheduled state.
                    if (this.j > 180) {
                        this.changeState(this.scheduledState);
                    }
                    break;
            }
    
            this.clawsEmitters.forEach(e => {
                e.update();
            });
            this.handsEmitters.forEach(e => {
                e.update();
            });
            this.wingsEmitters.forEach(e => {
                e.update();
            });
    
            // Update the received damage counter for the stunned state.
            if (this.j % 60 == 0) {
                this.receivedDamage = 0;
            }
    
            // Update the time counter and reset it every 20 seconds.
            this.j = (this.j + 1) % 1200;
        };
    
        BHell_Enemy_Darklord.prototype.updateForehead = function() {
            // Spawn a probe enemy every 3 seconds.
            this.foreheadCounter = (this.foreheadCounter + 1) % 180;
    
            if (this.foreheadCounter === 0) {
                var image = {"characterName":"Evil","direction":2,"pattern":0,"characterIndex":6};
                var params = {};
                params.animated = true;
                params.aim = true;
                params.bullet = {};
                params.bullet.frame = 2;
                my.controller.enemies.push(new my.BHell_Enemy_Probe(this.x + 42, this.y - 82, image, params, this.parent, my.controller.enemies));
            }
        };
    
        BHell_Enemy_Darklord.prototype.updateHands = function() {
            this.shoot(this.handsEmitters, true);
        };
    
        BHell_Enemy_Darklord.prototype.updateWings = function() {
            this.shoot(this.wingsEmitters,true);
        };
    
    
        BHell_Enemy_Darklord.prototype.updateClaws = function() {
            if (this.clawsCounter === 0) {
                this.clawsEmitters[0].a = Math.PI;
                this.clawsEmitters[0].b = 3 * Math.PI;
                this.clawsEmitters[1].a = 0;
                this.clawsEmitters[1].b = 2 * Math.PI;
            }
            this.shoot(this.clawsEmitters, this.clawsCounter < 180);
    
            this.clawsEmitters[0].a += 0.004;
            this.clawsEmitters[0].b += 0.004;
            this.clawsEmitters[1].a -= 0.004;
            this.clawsEmitters[1].b -= 0.004;
    
            this.clawsCounter = (this.clawsCounter + 1) % 300;
        };
    
        BHell_Enemy_Darklord.prototype.move = function () {
            if (this.mover != null) {
                var p = this.mover.move(this.x, this.y, this.speed);
                this.x = p[0];
                this.y = p[1];
            }
    
            this.clawsEmitters.forEach(e => {
                e.move(this.x, this.y);
            });
            this.handsEmitters.forEach(e => {
                e.move(this.x, this.y);
            });
            this.wingsEmitters.forEach(e => {
                e.move(this.x, this.y);
            });
        };
    
    
        BHell_Enemy_Darklord.prototype.shoot = function(emitters, t) {
            // Replaces BHell_Enemy_Base.shoot(t). It enables only SOME emitters at the time (not all of them).
            emitters.forEach(e => {
                e.shooting = t && !my.player.justSpawned;
            });
        };
    
        BHell_Enemy_Darklord.prototype.changeState = function(s) {
            if (this.state === "changing") {
                this.state = s;
            }
            else {
                this.scheduledState = s;
                this.state = "changing";
            }
    
            this.shoot(this.clawsEmitters, false);
            this.shoot(this.handsEmitters, false);
            this.shoot(this.wingsEmitters, false);
    
            this.j = 0;
        };
    
        BHell_Enemy_Darklord.prototype.hit = function () {
            if (this.state !== "dying") {
                my.BHell_Enemy_Base.prototype.hit.call(this);
    
                if (this.state != "stunned") {
                    this.receivedDamage++;
                }
            }
        };
    
        BHell_Enemy_Darklord.prototype.die = function() {
            $gameBHellResult.score += this.killScore;
            AudioManager.playSe({name:"Collapse4", volume:100, pitch:100, pan:0});
            this.changeState("dying");
    
            my.controller.destroyEnemyBullets();
        };
    
        return my;
    } (BHell || {}));
    
**Note**: we didn't set anywhere in the code the `boss` flag, that's because the engine reads that flag from a **generator**, not a single enemy.

Like every other enemy, let's write the JSON entry:

    {
      "name": "darklord",
      "class": "BHell_Enemy_Darklord",
      "params": {
        "boss": true
      }
    }
    
And finally let's create a generator for our boss:

![Darklord generator](darklord_generator.png)

**Important**: Remember that we positioned our emitters at coordinates corresponding to a very specific frame in our charset! If you plan to use this boss with a different appearance, you should change the emitter's coordinates as well.  