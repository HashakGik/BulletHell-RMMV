/**
 * @namespace BHell
 */
var BHell = (function (my) {

/**
 * Enemy generator class. Periodically spawns an enemy.
 * @constructor
 * @memberOf BHell
 */
var BHell_Generator = my.BHell_Generator = function() {
    this.initialize.apply(this, arguments);
};

BHell_Generator.prototype = Object.create(Object.prototype);
BHell_Generator.prototype.constructor = BHell_Generator;

/**
 * Constructor. The enemy parameters are defined at three different levels:
 *
 * 1. Enemy class default values,
 * 2. JSON configuration file,
 * 3. Game Event's comments.
 *
 * Each level overrides the previous one, to allow a fine grained control over each generator.
 * @param x X spawning coordinate.
 * @param y Y spawning coordinate.
 * @param image Sprite for the spawned enemies.
 * @param name Enemy name (from the JSON configuration file).
 * @param n Number of enemies to be generated.
 * @param period Spawn period in frames (i.e. 60 generates an enemy every second).
 * @param sync True if the stage must wait for every enemy of this generator to be spawned.
 * @param stop True if the map should stop when this generator is active.
 * @param comments RPGMaker's Comment string containing overridden parameters for the enemies.
 * @param enemies Array where the enemies will be pushed.
 * @param parent Container for the Sprite objects.
 */
BHell_Generator.prototype.initialize = function (x, y, image, name, n, period, sync, stop, comments, enemies, parent) {
    this.x = x;
    this.y = y;
    this.image = image;
    this.n = n;
    this.i = 0;
    this.period = period;
    this.sync = sync;
    this.stop = stop;
    this.enemies = enemies;
    this.parent = parent;
    this.params = null;
    this.enemyClass = null;

    // Fetch the correct enemy class from the JSON file.
    var tmp = $dataBulletHell.enemies.filter(e => {
        return e.name === name;
    });
    if (tmp.length > 0) {
        var enemy = tmp[0];
        var regex = /BHell_Enemy_[A-Za-z0-9_]+/;
        if (regex.exec(enemy.class) != null) {
            this.enemyClass = eval("my." + enemy.class); // Safe-ish, since Only class names can be evaluated.
            this.params = Object.assign({}, enemy.params);
        }
    }

    // If there are overriding comments, parse them and replace every redefined property in this.params.
    if (comments != null && comments !== "") {
        var str = "{" + comments.replace(/\s/g, "") + "}";
        try {
            var obj = JSON.parse(str);
            this.params = this.params || {};

            var dummyEnemy = new my.BHell_Sprite(image.characterName, image.characterIndex, image.direction, image.pattern, true);

            for (var k in obj) {
                switch (k) {
                    case "A": case "B": case "C": case "D":
                    this.params[k] = {};
                    this.params[k].x = my.parse(obj[k].x, this.x, this.y, dummyEnemy.patternWidth(), dummyEnemy.patternHeight(), Graphics.width, Graphics.height);
                    this.params[k].y = my.parse(obj[k].y, this.x, this.y, dummyEnemy.patternWidth(), dummyEnemy.patternHeight(), Graphics.width, Graphics.height);
                        break;
                    case "bullet":
                        this.params[k] = {};
                        this.params[k].speed = obj[k].speed || this.params[k].speed || null;
                        this.params[k].sprite = obj[k].sprite || this.params[k].sprite || null;
                        this.params[k].direction = obj[k].direction || this.params[k].direction || null;
                        this.params[k].frame = obj[k].frame || this.params[k].frame || null;
                        this.params[k].index = obj[k].index || this.params[k].index || null;
                        this.params[k].animated = obj[k].animated || this.params[k].animated || null;
                        this.params[k].animation_speed = obj[k].animation_speed || this.params[k].animation_speed || null;
                        break;
                    default:
                        this.params[k] = my.parse(obj[k], this.x, this.y, dummyEnemy.patternWidth(), dummyEnemy.patternHeight(), Graphics.width, Graphics.height);
                        break;
                }
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    this.bossGenerator = this.params.boss || false;
};

/**
 * Updates the generator (called every frame). If there are enemies left to be spawned, spawn one every this.period frames.
 */
BHell_Generator.prototype.update = function () {
    if (this.enemyClass != null) {
        if (this.i === 0 && this.n > 0) {
            this.n--;
            this.enemies.push(new this.enemyClass(this.x, -50, this.image, this.params, this.parent, this.enemies));
        }
        this.i = (this.i + 1) % this.period;
    }
    else {
        this.n = 0;
    }
};

return my;
} (BHell || {}));