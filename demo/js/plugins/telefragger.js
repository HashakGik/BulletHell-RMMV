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