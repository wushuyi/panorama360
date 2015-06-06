function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
}
animate();
var transform = getStyleProperty('transform');
var cache = {
    imgW: 5100,
    imgH: 852,
    panOffsetX: 0,
    ring: 0,
    deg: 0,
    runDeg: 0,
    minOffsetDeg: 8,
    rotationOffsetDeg: 0,
    onceRotationOffsetDeg: 0,
    nowOffset: 0,
    len: 0,
    touchLock: false,
    timer: null
};
var util = {
    setTranslateX: function setTranslateX(el, num) {
        el.style[transform] = "translate3d(" + num + "px,0,0)";
    }
};
var initPanoramaBox = function initPanoramaBox($el, opts) {
    var elH = $el.height();
    var elW = $el.width();
    var $panoramaBox = $('<div class="panorama-box">' +
        '<div class="panorama-item"></div>' +
        '<div class="panorama-item"></div>' +
        '</div>');
    var $panoramaItem = $('.panorama-item', $panoramaBox);
    var scal = elH / opts.height;
    $panoramaItem.css({
        width: opts.width,
        height: opts.height
    });
    $panoramaBox.css({
        width: elW / scal,
        height: opts.height,
        transform: 'scale3d(' + scal + ',' + scal + ',' + scal + ')',
        'transform-origin': '0 0'
    });
    util.setTranslateX($panoramaItem.get(0), 0);
    util.setTranslateX($panoramaItem.get(1), -opts.width);
    $el.append($panoramaBox);
    var offset = function offset(num) {
        var width = opts.width;
        var num1 = num % opts.width;
        var num2;
        if (num1 < -width / 2) {
            num2 = width + num1 - 2;
        } else {
            num2 = -width + num1 + 2;
        }
        util.setTranslateX($panoramaItem.get(0), num1);
        util.setTranslateX($panoramaItem.get(1), num2);
    };
    var run = function (subBox1, subBox2, width) {
        return function offset(num) {
            num = parseInt(num);
            cache.len = num;
            var num1 = num % width;
            var num2;
            if (num1 < -width / 2) {
                num2 = width + num1 - 1;
            } else {
                num2 = -width + num1 + 1;
            }
            util.setTranslateX(subBox1, num1 - 1);
            util.setTranslateX(subBox2, num2);
        };
    };
    return run($panoramaItem.get(0), $panoramaItem.get(1), opts.width);
};
var animObj = {
    x: 0
};

var $el = {};
$el.main = $('.wrapper');

var offset = initPanoramaBox($el.main, {
    width: cache.imgW,
    height: cache.imgH
});

var mc = new Hammer.Manager($el.main.get(0));
var pan = new Hammer.Pan();
$el.main.on('touchstart', function (evt) {
    if (cache.timer) {
        clearTimeout(cache.timer);
        cache.timer = null;
    }
    cache.touchLock = true;
});
$el.main.on('touchend', function (evt) {
    cache.timer = setTimeout(function () {
        cache.onceRotationOffsetDeg = cache.deg - cache.runDeg;
        cache.runDeg = cache.deg + cache.onceRotationOffsetDeg;
        cache.rotationOffsetDeg = cache.rotationOffsetDeg + cache.onceRotationOffsetDeg;
        cache.touchLock = false;
    }, 1000);
});
mc.add(pan);
mc.on('pan', function (evt) {
    offset(cache.nowOffset + evt.deltaX);
});
mc.on('panend', function (evt) {
    cache.nowOffset = cache.nowOffset + evt.deltaX;
    cache.panOffsetX = cache.panOffsetX + evt.deltaX;
});
var tween;
var animOffset = function animOffset(length){
    if(tween){
        tween.stop();
    }
    tween = new TWEEN.Tween({x: cache.len});
    tween.to({x: length}, 400);
    tween.onUpdate(function(){
        offset(this.x);
    });
    tween.start();
};
tween = new TWEEN.Tween({x: 0});
tween.to({x: -6000}, 10000);
tween.onUpdate(function(){
    offset(this.x);
});
tween.start();
var promise = FULLTILT.getDeviceOrientation({'type': 'world'});
promise.then(function (orientationControl) {
    var orientationFunc = function orientationFunc() {
        var screenAdjustedEvent = orientationControl.getScreenAdjustedEuler();
        cache.navDeg = 360 - screenAdjustedEvent.alpha;
        if (cache.navDeg > 270 && cache.navOldDeg < 90) {
            cache.ring -= 1;
        } else if (cache.navDeg < 90 && cache.navOldDeg > 270) {
            cache.ring += 1;
        }
        cache.navOldDeg = cache.navDeg;
        cache.oldDeg = cache.deg;
        cache.deg = cache.ring * 360 + cache.navDeg;
        var offsetDeg = cache.deg - cache.runDeg;
        if (!cache.touchLock &&
            (Math.abs(offsetDeg) > cache.minOffsetDeg)) {
            var length = cache.imgW / 360 * -(cache.deg - cache.rotationOffsetDeg) + cache.panOffsetX;
            cache.runDeg = cache.deg;
            cache.nowOffset = length;
            animOffset(length);
        }
    };
    orientationControl.listen(orientationFunc);
});