In this tutorial we are going to create a new `Mover` class which will allow an enemy to *teleport* at the player's position.
Just like creating a new `Emitter` (see {@tutorial emitter_js}) or `Enemy` (see {@tutorial enemies_js}), implementing a new `Mover` is a simple exercise of object-oriented programming.

Let's start by creating a new plugin called `teleport.js` and let's reopen the `BHell` module in order to have access to all the engine's variables:

    var BHell = (function (my) {    
        /* Our code will go here */
        
        return my;
    }(BHell || {}));

Inside our module, we'll create a new class, extending `BHell_Mover_Base`:

    var BHell_Mover_Teleport = my.BHell_Mover_Teleport = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Mover_Teleport.prototype = Object.create(my.BHell_Mover_Base.prototype);
    BHell_Mover_Teleport.prototype.constructor = BHell_Mover_Teleport;

    BHell_Mover_Teleport.prototype.initialize = function () {
        my.BHell_Mover_Base.prototype.initialize.call(this);
    };
    
Now it's time to think about our class' behaviour: we want to move our enemy *on a straight line* until a starting position is reached, and then we want to teleport it to the player's position, giving it enough time to avoid being killed.

We can summarise this behaviour in the following way: 
* If the enemy has not reached the initial position yet, move towards it;
* Otherwise:
    * Memorise the player's position;
    * Wait some time;
    * Teleport to the memorised position.
    
In order to implement this behaviour, we need to initialise some parameters:
* Initial x position;
* Initial y position;
* Delay between memorisation and teleportation;
* If the enemy has reached its initial position;
* A frame counter for time keeping.

Our `initialize` method will therefore set the initial value for these (three of which should be passed):

    BHell_Mover_Teleport.prototype.initialize = function (x, y, delay) {
        my.BHell_Mover_Base.prototype.initialize.call(this);

        this.initX = x;
        this.initY = y;
        this.delay = delay;
        this.inPosition = false;
        this.i = 0;
    };

From {@link BHell.BHell_Mover_Base#move}, you can see that a `Mover` returns the new set of coordinates into a new array, based on the old ones and the speed.

Let's try to divide our behaviour into smaller steps:
* If the enemy has not reached the initial position yet, move towards it (i.e. determine the angle between the old position and the destination and move a step towards it, no farther than what is allowed by the defined speed):

        var dx = this.initX - oldX;
        var dy = this.initY - oldY;

        // If the error is less than two pixels, consider it in place.
        if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) {
            this.inPosition = true;
            ret.push(this.initX);
            ret.push(this.initY);
        }
        else {
            var angle = Math.atan2(dy, dx);
            ret.push(oldX + Math.cos(angle) * speed);
            ret.push(oldY + Math.sin(angle) * speed);
        }
        
* Otherwise:
    * Memorise the player's position:
    
            if (this.i === 0) {        
                this.destX = my.player.x;
                this.destY = my.player.y;
                // Since no movement is required yet, return the old coordinates.
                ret.push(oldX);
                ret.push(oldY);
            }    

    * Wait `delay` frames:
            
            if (this.i === this.delay - 1) {
                /* do something */
            }
            else {
                // Don't move.
                ret.push(oldX);
                ret.push(oldY);
            }
            
            this.i = (this.i + 1) % this.delay;
    
    * Teleport to the memorised position:
    
            if (this.i === this.delay - 1) {
                ret.push(this.destX);
                ret.push(this.destY);
            }
            
Let's put the pieces together:

    BHell_Mover_Teleport.prototype.move = function (oldX, oldY, speed) {
        var ret = [];
        if (this.inPosition) {
            if (this.i === 0) {
                this.destX = my.player.x;
                this.destY = my.player.y;

                ret.push(oldX);
                ret.push(oldY);
            }
            else if (this.i === this.delay - 1) {
                ret.push(this.destX);
                ret.push(this.destY);
            }
            else {
                ret.push(oldX);
                ret.push(oldY);
            }

            this.i = (this.i + 1) % this.delay;
        }
        else {
            var dx = this.initX - oldX;
            var dy = this.initY - oldY;

            if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) {
                this.inPosition = true;
                ret.push(this.initX);
                ret.push(this.initY);
            }
            else {
                var angle = Math.atan2(dy, dx);
                ret.push(oldX + Math.cos(angle) * speed);
                ret.push(oldY + Math.sin(angle) * speed);
            }
        }

        return ret;
    };

            
Our `BHell_Mover_Teleport` is now complete (if you want to push it on the `master` branch don't forget the JSDoc documentation!):

    var BHell = (function (my) {
    
        var BHell_Mover_Teleport = my.BHell_Mover_Teleport = function () {
            this.initialize.apply(this, arguments);
        };
    
        BHell_Mover_Teleport.prototype = Object.create(my.BHell_Mover_Base.prototype);
        BHell_Mover_Teleport.prototype.constructor = BHell_Mover_Teleport;
    
        BHell_Mover_Teleport.prototype.initialize = function (x, y, delay) {
            my.BHell_Mover_Base.prototype.initialize.call(this);
    
            this.initX = x;
            this.initY = y;
            this.delay = delay;
            this.inPosition = false;
            this.i = 0;
        };
    
        BHell_Mover_Teleport.prototype.move = function (oldX, oldY, speed) {
            var ret = [];
            if (this.inPosition) {
                if (this.i === 0) {
                    this.destX = my.player.x;
                    this.destY = my.player.y;
    
                    ret.push(oldX);
                    ret.push(oldY);
                }
                else if (this.i === this.delay - 1) {
                    ret.push(this.destX);
                    ret.push(this.destY);
                }
                else {
                    ret.push(oldX);
                    ret.push(oldY);
                }
    
                this.i = (this.i + 1) % this.delay;
            }
            else {
                var dx = this.initX - oldX;
                var dy = this.initY - oldY;
    
                if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) {
                    this.inPosition = true;
                    ret.push(this.initX);
                    ret.push(this.initY);
                }
                else {
                    var angle = Math.atan2(dy, dx);
                    ret.push(oldX + Math.cos(angle) * speed);
                    ret.push(oldY + Math.sin(angle) * speed);
                }
            }
    
            return ret;
        };
    
        return my;
    }(BHell || {}));

We can finally import our class as a plugin on RPG Maker MV.

![teleport](teleport_plugin.png)