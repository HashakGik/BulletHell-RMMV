In this tutorial we are going to create two `bomb` classes.
The first one will be a simple object-oriented programming exercise (like {@tutorial enemies_js}, {@tutorial mover_js} and {@tutorial emitter_js}), the second one will exploit JavaScript's peculiar capability of redefining methods on an already instantiated object. 

### BHell_Bomb_Gravity

So far, no `bomb` relies on something different than spawning bullets.
We want to create a `BHell_Bomb_Gravity` class which simply will halve the hit points of every enemy on screen (and to prevent this bomb's abuse, we'll also want it to deactivate itself after 20 seconds), without spawning any bullet.

**Note**: Autobombing won't work during the entire time a bomb is active, so, although extremely powerful, this bomb may make the player more vulnerable.

Since no bullet will be spawned, we will hint the player that the bomb has fired by spawning an explosion on every enemy. 

Let's start by creating a new `bomb_gravity.js` file and reopening our `BHell` module:

    var BHell = (function (my) {    
        /* Our code will go here */
        
        return my;
    }(BHell || {}));
    
We can now create our `BHell_Bomb_Gravity` class:

    var BHell_Bomb_Gravity = my.BHell_Bomb_Gravity = function () {
        this.initialize.apply(this, arguments);
    };

    BHell_Bomb_Gravity.prototype = Object.create(my.BHell_Bomb_Base.prototype);
    BHell_Bomb_Gravity.prototype.constructor = BHell_Bomb_Gravity;

    BHell_Bomb_Gravity.prototype.initialize = function (parent, params, bulletList) {
        my.BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);
    };
    
The behaviour of `bomb` classes is handled entirely by the methods {@link BHell.BHell_Bomb_Base#activate}, {@link BHell.BHell_Bomb_Base#update} and {@link BHell.BHell_Bomb_Base#deactivate}.
In this example, our desired behaviour is something that happen only at the bomb's activation, so we will rewrite the `activate` method to suit our purposes.

Since the bomb will directly manipulate enemies parameters, we need to check that an enemy list is in fact available (there are no enemies on the preview window and that would cause an error).
We also need to deal with the bosses' bar, since it normally is updated only by {@link BHell.BHell_Enemy_Base#hit} (which we are not going to use):

    BHell_Bomb_Gravity.prototype.activate = function (x, y) {
        my.BHell_Bomb_Base.prototype.activate.call(this, x, y);

        if (my.controller != null && my.controller.enemies != null) {
            my.controller.enemies.forEach(e => {
                // We are using the ceil function to prevent enemies from dying when they have less than two hit points.
                var damage = Math.ceil(e.hp / 2);
                e.hp -= damage;
                if (e.boss) {
                    my.bossHp -= damage;
                }

                my.explosions.push(new my.BHell_Explosion(e.x, e.y, this.parent, my.explosions));
            });
        }
    };  

We decided to deactivate our bomb after 20 seconds (1200 frames), because it would be too easy for the player to use a bomb so powerful too often.
The default `update` behaviour sets a deactivation timeout of one seconds, so we need to rewrite that method as well:

    BHell_Bomb_Gravity.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i > 1200) {
                this.deactivate();
            }
        }
    };
    
Our complete `bomb_gravity.js` looks like this:

    var BHell = (function (my) {
    
        var BHell_Bomb_Gravity = my.BHell_Bomb_Gravity = function () {
            this.initialize.apply(this, arguments);
        };
    
        BHell_Bomb_Gravity.prototype = Object.create(my.BHell_Bomb_Base.prototype);
        BHell_Bomb_Gravity.prototype.constructor = BHell_Bomb_Gravity;
    
        BHell_Bomb_Gravity.prototype.initialize = function (parent, params, bulletList) {
            my.BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);
        };
    
        BHell_Bomb_Gravity.prototype.activate = function (x, y) {
            my.BHell_Bomb_Base.prototype.activate.call(this, x, y);
    
            if (my.controller != null && my.controller.enemies != null) {
                my.controller.enemies.forEach(e => {
                    // We are using the ceil function to prevent enemies from dying when they have less than two hit points.
                    var damage = Math.ceil(e.hp / 2);
                    e.hp -= damage;
                    if (e.boss) {
                        my.bossHp -= damage;
                    }
    
                    my.explosions.push(new my.BHell_Explosion(e.x, e.y, this.parent, my.explosions));
                });
            }
    
        };
    
    
        BHell_Bomb_Gravity.prototype.update = function () {
            if (this.active === true) {
                this.i++;
    
                if (this.i > 1200) {
                    this.deactivate();
                }
            }
        };
    
    
        return my;
    }(BHell || {}));
    
All we need to do now is to import the plugin and assign this bomb to a player, by adding the following parameter to its configuration in the JSON file.
While we are at it, we'll also customise the icon index and the sound effect.

    "bomb": {
        "sprite": "$Bullets",
        "index": 0,
        "direction": 2,
        "frame": 1,
        "icon": "IconSet",
        "icon_index": 161,
        "class": "BHell_Bomb_Gravity",
        "se": {
            "name": "Collapse4",
            "volume": 100,
            "pitch": 100,
            "pan": 0
        }
    }


### BHell_Bomb_Thunder

Most of the predefined bombs simply behave like emitters, spawning a barrage of bullets filling the screen.
In this section we want to create a `BHell_Bomb_Thunder` class which will spawn 200 bullets moving erratically across the screen for ten seconds.
In order to do so, we can't rely on the default {@link BHell.BHell_Bullet#update} method and we could be tempted to proceed (in the object-oriented way) by creating a derived class from {@link BHell.BHell_Bullet}, but JavaScript allows to achieve the same result (more quickly) by *replacing* a function definition in an already instantiated object. 

This is what was done with {@link BHell.BHell_Bomb_Earth}, which makes the bullets rotate around the player, instead of moving in a straight line.

Lets' create our `bomb_thunder.js` plugin in the usual way:

    var BHell = (function (my) {
    
        var BHell_Bomb_Thunder = my.BHell_Bomb_Thunder = function () {
            this.initialize.apply(this, arguments);
        };
    
        BHell_Bomb_Thunder.prototype = Object.create(my.BHell_Bomb_Base.prototype);
        BHell_Bomb_Thunder.prototype.constructor = BHell_Bomb_Thunder;
    
        BHell_Bomb_Thunder.prototype.initialize = function (parent, params, bulletList) {
            my.BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);
        };
    
        return my;
    }(BHell || {})); 
    
Since we are going to use bullets which most likely will never leave the screen, we need to store them on a separate array, so we can destroy them during the bomb's deactivation. Let's start by initialise it:

    BHell_Bomb_Thunder.prototype.initialize = function (parent, params, bulletList) {
        my.BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);

        this.bullets = [];
    };

And let's destroy every bullet:

    BHell_Bomb_Thunder.prototype.deactivate = function () {
        my.BHell_Bomb_Base.prototype.deactivate.call(this);
        while (this.bullets.length > 0) {
            var bullet = this.bullets.pop();
            bullet.destroy();
        }
    };
    
**Important**: If you are familiar with the {@link http://en.wikipedia.org/wiki/Iterator_pattern Iterator design pattern}, you already know that using a `forEach` here would be a big mistake and would most certainly cause an hard to find bug.
For those of you who aren't aware, the `forEach` construct relies on "moving" from one element to the *next* one in a list, but when you dynamically change the list's content while iterating over it (as in this case, since we are popping elements from it), the iterator's state (usually a simple index variable) will desynchronise: upon deletion we might skip some elements, while on insertion we might iterate over some elements more than once. 

Just like our `BHell_Bomb_Gravity`, we want to deactivate our bomb after some time other than the default one second timeout, we'll rewrite our `update` method accordingly:

    BHell_Bomb_Thunder.prototype.update = function () {
        if (this.active === true) {
            this.i++;

            if (this.i > 600) {
                this.deactivate();
            }
        }
    };

Finally, we can focus on the most important part of this bomb: its activation.

If we were simply to spawn 200 bullets at the player's coordinates, our `update` method would look like this:

    BHell_Bomb_Thunder.prototype.activate = function (x, y) {
        my.BHell_Bomb_Base.prototype.activate.call(this, x, y);

        var j;
        var bullet;

        for (j = 0; j < 200; j++) {
            bullet = new my.BHell_Bullet(my.player.x, my.player.y, 0, this.bulletParams, this.bulletList);

            this.bullets.push(bullet);
            this.bulletList.push(bullet);
            this.parent.addChild(bullet);
        }
    };
    
And in fact if we were to create a derived class (let's say for example `BHell_Bullet_Erratic`), we would simply need to replace the constructor.
But since we want to replace our bullet's behaviour on a per-instance basis, we are going to do something like this:

    BHell_Bomb_Thunder.prototype.activate = function (x, y) {
        my.BHell_Bomb_Base.prototype.activate.call(this, x, y);

        var j;
        var bullet;

        for (j = 0; j < 200; j++) {
            bullet = new my.BHell_Bullet(my.player.x, my.player.y, 0, this.bulletParams, this.bulletList);

            // Create new properties for the bullet
            bullet.destX = my.player.x;
            bullet.destY = my.player.y;

            bullet.update = function () {
                var dx = this.destX - this.x;
                var dy = this.destY - this.y;

                if (Math.abs(dx) < this.speed && Math.abs(dy) < this.speed) {
                    this.destX = Math.round(Math.random() * Graphics.width);
                    this.destY = Math.round(Math.random() * Graphics.height);
                }
                else {
                    this.angle = Math.atan2(dy, dx);
                }

                my.BHell_Bullet.prototype.update.call(this);
            };

            this.bullets.push(bullet);
            this.bulletList.push(bullet);
            this.parent.addChild(bullet);
        }
    };

Our complete class looks like this:

    var BHell = (function (my) {
    
        var BHell_Bomb_Thunder = my.BHell_Bomb_Thunder = function () {
            this.initialize.apply(this, arguments);
        };
    
        BHell_Bomb_Thunder.prototype = Object.create(my.BHell_Bomb_Base.prototype);
        BHell_Bomb_Thunder.prototype.constructor = BHell_Bomb_Thunder;
    
        BHell_Bomb_Thunder.prototype.initialize = function (parent, params, bulletList) {
            my.BHell_Bomb_Base.prototype.initialize.call(this, parent, params, bulletList);
    
            this.bullets = [];
        };
    
        BHell_Bomb_Thunder.prototype.activate = function (x, y) {
            my.BHell_Bomb_Base.prototype.activate.call(this, x, y);
    
            var j;
            var bullet;
    
            for (j = 0; j < 200; j++) {
                bullet = new my.BHell_Bullet(my.player.x, my.player.y, 0, this.bulletParams, this.bulletList);
    
                // Create new properties for the bullet
                bullet.destX = my.player.x;
                bullet.destY = my.player.y;
    
                bullet.update = function () {
                    var dx = this.destX - this.x;
                    var dy = this.destY - this.y;
    
                    if (Math.abs(dx) < this.speed && Math.abs(dy) < this.speed) {
                        this.destX = Math.round(Math.random() * Graphics.width);
                        this.destY = Math.round(Math.random() * Graphics.height);
                    }
                    else {
                        this.angle = Math.atan2(dy, dx);
                    }
    
                    my.BHell_Bullet.prototype.update.call(this);
                };
    
                this.bullets.push(bullet);
                this.bulletList.push(bullet);
                this.parent.addChild(bullet);
            }
        };
    
        BHell_Bomb_Thunder.prototype.update = function () {
            if (this.active === true) {
                this.i++;
    
                if (this.i > 600) {
                    this.deactivate();
                }
            }
        };
    
        BHell_Bomb_Thunder.prototype.deactivate = function () {
            my.BHell_Bomb_Base.prototype.deactivate.call(this);
            while (this.bullets.length > 0) {
                var bullet = this.bullets.pop();
                bullet.destroy();
            }
        };
    
        return my;
    }(BHell || {}));

We can now import it and configure a player to use our new `BHell_Bomb_Thunder`:

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