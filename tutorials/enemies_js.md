In this tutorial we are going to create two new `Enemy` classes.
Just like creating a new `Emitter` (see {@tutorial emitter_js}) or `Mover` (see {@tutorial mover_js}), implementing a new `Enemy` is a simple exercise of object-oriented programming.

### Telefragger enemy
In this part of the tutorial we are going to create an enemy which is incapable of shooting, but which will try to kill the player by *telefragging* it (a term coined in the Doom series referring to the action of destroying something by teleporting on it).
Since instantly killing the player would not be fair, our enemy will wait for two seconds before teleporting itself.

In our {@tutorial mover_js} tutorial, we created a `BHell_Mover_Teleport` class which performs exactly the kind of movement we need, so let's start by loading that plugin:

![teleport](teleport_plugin.png)

Let's now create a new plugin called `telefragger.js` and let's reopen the `BHell` module in order to have access to all the engine's variables:

    var BHell = (function (my) {    
        /* Our code will go here */
        
        return my;
    }(BHell || {}));
    
Since we don't need any of the peculiarities of the already defined enemies (e.g. the shooting behaviour of a {@link BHell.BHell_Enemy_Gunner_Base} or the orbiting movement of a {@link BHell.BHell_Enemy_Orbiter}), our `BHell_Enemy_Telefragger` will extend {@link BHell.BHell_Enemy_Base}:
    
    var BHell_Enemy_Telefragger = my.BHell_Enemy_Telefragger = function() {
            this.initialize.apply(this, arguments);
        };
    
        BHell_Enemy_Telefragger.prototype = Object.create(my.BHell_Enemy_Base.prototype);
        BHell_Enemy_Telefragger.prototype.constructor = BHell_Enemy_Telefragger;
    
        BHell_Enemy_Telefragger.prototype.initialize = function(x, y, image, params, parent, enemyList) {
            my.BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);
        };

>**Important**: The game engine will consider enemies only classes called `BHell_Enemy_*`, so follow this convention.
    
Our enemy won't shoot and the default {@link BHell.BHell_Enemy_Base#update} (as well as every other method already defined) behaviour will work just fine for us, so we simply need to initialise our mover:

    BHell_Enemy_Telefragger.prototype.initialize = function(x, y, image, params, parent, enemyList) {
        my.BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

        this.mover = new my.BHell_Mover_Teleport(x, 20, 120);
    };
    
Our `BHell_Enemy_Telefragger` is now complete (don't forget the JSDoc!):

    var BHell = (function (my) {

        var BHell_Enemy_Telefragger = my.BHell_Enemy_Telefragger = function() {
            this.initialize.apply(this, arguments);
        };
    
        BHell_Enemy_Telefragger.prototype = Object.create(my.BHell_Enemy_Base.prototype);
        BHell_Enemy_Telefragger.prototype.constructor = BHell_Enemy_Telefragger;
    
        BHell_Enemy_Telefragger.prototype.initialize = function(x, y, image, params, parent, enemyList) {
            my.BHell_Enemy_Base.prototype.initialize.call(this, x, y, image, params, parent, enemyList);
    
            this.mover = new my.BHell_Mover_Teleport(x, 20, 120);
        };

        return my;
    } (BHell || {}));
    
That's all! Now we simply add a new entry on our plugin's JSON file:

    {
      "name": "telefragger",
      "class": "BHell_Enemy_Telefragger",
      "params": null
    }

And finally (after importing our `telefragger.js` plugin) we can create a new enemy:

![telefragger generator](telefragger.png)

![telefragger](telefragger.gif) 

### Rammer enemy

In this part of the tutorial we are going to create a slightly more complicated enemy.
We want to create an enemy capable of running very fast towards the player, without the ability to steer if the player moves away. We also want our enemy to shoot quick bursts of bullets ahead of itself and, just for fun, to play a sound effect upon death. 
Unlike our `BHell_Enemy_Telefragger` we also want to customize it a little, so we are going to define new JSON parameters as well.

Let's start, as usual, by creating a `rammer.js` plugin and by reopening our `BHell` module:

    var BHell = (function (my) {    
        /* Our code will go here */
        
        return my;
    }(BHell || {}));
    
Now we can create our `BHell_Enemy_Rammer` class, since we want it to behave similarly to {@link BHell.BHell_Enemy_Burster}, we are going to extend that class:
    
    var BHell_Enemy_Rammer = my.BHell_Enemy_Rammer = function() {
        this.initialize.apply(this, arguments);
    };

    BHell_Enemy_Rammer.prototype = Object.create(my.BHell_Enemy_Burster.prototype);
    BHell_Enemy_Rammer.prototype.constructor = BHell_Enemy_Rammer;

    BHell_Enemy_Rammer.prototype.initialize = function(x, y, image, params, parent, enemyList) {
        my.BHell_Enemy_Burster.prototype.initialize.call(this, x, y, image, params, parent, enemyList);
    };

Among the `Mover` classes there is {@link BHell.BHell_Mover_Point}, which stores the initial direction between the player and the enemy and then travels along a straight line, we will use that class for our enemy.

    this.mover = new my.BHell_Mover_Point(this.x, this.y);

Since the emitters are already handled by the base class (`BHell_Enemy_Burster`), we simply need to tweak the shooting angle for our needs:
    
    this.emitters[0].angle = Math.atan2(my.player.y - this.y, my.player.x - this.x);

And finally we want to store the dying SE in the JSON as `dying_se`:

    this.dyingSe = params.dying_se;

Our complete initialisation method becomes:

    BHell_Enemy_Rammer.prototype.initialize = function(x, y, image, params, parent, enemyList) {
        my.BHell_Enemy_Burster.prototype.initialize.call(this, x, y, image, params, parent, enemyList);

        this.dyingSe = params.dying_se;

        // Aim the burst towards the player.
        this.emitters[0].angle = Math.atan2(my.player.y - this.y, my.player.x - this.x);

        // Replace the mover.
        this.mover = new my.BHell_Mover_Point(this.x, this.y);
    };

The implementation of {@link BHell.BHell_Enemy_Burster#update} does what we need, so there is no need to rewrite it.
On the other hand, since we want to play our SE on death, we need to override the {@link BHell.BHell_Enemy_Burster#die} method:

    BHell_Enemy_Rammer.prototype.die = function () {
        my.BHell_Enemy_Burster.prototype.die.call(this);

        if (this.dyingSe !== null) {
            AudioManager.playSe({name: this.dyingSe, volume: 100, pitch: 100, pan: 0});
        }
    };

We've just finished implementing our `BHell_Enemy_Rammer`:

    var BHell = (function (my) {
    
        var BHell_Enemy_Rammer = my.BHell_Enemy_Rammer = function() {
            this.initialize.apply(this, arguments);
        };
    
        BHell_Enemy_Rammer.prototype = Object.create(my.BHell_Enemy_Burster.prototype);
        BHell_Enemy_Rammer.prototype.constructor = BHell_Enemy_Rammer;
    
        BHell_Enemy_Rammer.prototype.initialize = function(x, y, image, params, parent, enemyList) {
            my.BHell_Enemy_Burster.prototype.initialize.call(this, x, y, image, params, parent, enemyList);
    
            this.dyingSe = params.dying_se;
    
            // Aim the burst towards the player.
            this.emitters[0].angle = Math.atan2(my.player.y - this.y, my.player.x - this.x);
    
            // Replace the mover.
            this.mover = new my.BHell_Mover_Point(this.x, this.y);
        };
    
        BHell_Enemy_Rammer.prototype.die = function () {
            my.BHell_Enemy_Burster.prototype.die.call(this);
    
            if (this.dyingSe !== null) {
                AudioManager.playSe({name: this.dyingSe, volume: 100, pitch: 100, pan: 0});
            }
        };
    
        return my;
    } (BHell || {}));
    
Let's move on to the JSON entry:

    {
      "name": "rammer",
      "class": "BHell_Enemy_Rammer",
      "params": null
    }
    
Since we have defined a `dying_se` parameter, we can set one in our JSON.
Let's take this chance to customise some other parameters as well:

    {
      "name": "rammer",
      "class": "BHell_Enemy_Rammer",
      "params": {
        "dispersion": 20,
        "shots": 50,
        "bullet": {
          "speed": 6
        },
        "period": 30,
        "speed": 5,
        "dying_se": "Cow"
      }
    }  

All we need to do now is to import our `rammer.js` plugin and create a new enemy (maybe overriding some other parameters):

![rammer generator](rammer.png)

![rammer](rammer.gif)