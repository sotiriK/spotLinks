// [:. [CanvasLib]
// Supports all modern browsers, IE9 forward
// CanvasLib was created by Sotiri Karasoulos as an open source canvas framework (MIT License)
// For latest version, examples, and more information please visit http://canvaslib.com/
// Contribute at http://github.com/sot-dev/canvaslib/
// :.]
(function () {
    //
    //abort if browser not compatible 
    var mWin = window;
    var mDoc = mWin.document;
    if ((function () {
        var cnv = mDoc.createElement('canvas');
        return !(cnv.getContext && cnv.getContext('2d') && window.localStorage);
    })()) return;
    //
    //default and const values
    var val = {
        defaultFps: 30, defaultWidth: 600, defaultHeight: 480, maxFrames: 10, circlePolyPoints: 10, volume: 1,
        alignLeft: "left", alignRight: "right", alignTop: "top", alignBottom: "bottom", alignCenter: "center",
        cachePrefix: "cLibKey", configPrefix: "cLibConfig"
    };
    //
    //private
    var mLib = mWin.canvasLib || {};
    var mSprites = {}, mScripts = {}, mSounds = {};
    var mCanvas = null, mContext = null;
    var mBeforeFrame = null, mOnFrame = null, mAfterFrame = null, mOnLoaded = null;
    var mFpsInterval = null, mResetFrames = true, mCheckLoaded = false;
    var mLastFrame = 0, mLoadCount = 0, mFps = val.defaultFps;
    var mPreloads = [];
    //
    //private
    var mNumber = function (nInput, nCurrent) {
        nInput = String(nInput);
        return (!nInput || isNaN(nInput) ? nCurrent : Number(nInput));
    };
    var mNumberNatural = function (nInput, nCurrent) {
        nInput = String(nInput);
        return (!nInput || isNaN(nInput) || Number(nInput) <= 0 ? nCurrent : Number(nInput));
    };
    var mString = function (nInput, nCurrent) {
        nInput = String(nInput);
        return (!nInput || nInput === "null" || nInput === "undefined" ? nCurrent : nInput);
    };
    var mRadians = function (nDegrees) {
        return nDegrees * Math.PI / 180;
    };
    var mDegrees = function(nRadians) {
        return nRadians * 180 / Math.PI;
    };
    var mAngle180 = function (currAngle) {
        currAngle = currAngle % 360;
        if(currAngle > 180) currAngle -= 2 * 180;
        else if(currAngle < -180) currAngle += 2 * 180;
        return currAngle;
    };
    var mAngle360 = function(currAngle) {
        currAngle = mAngle180(currAngle);
        if(currAngle < 0) currAngle = 180 + (180-Math.abs(currAngle)); 
        return currAngle;
    };
    var mReset = function () {
        //Resets state except event handlers
        if (!mCanvas) return;
        if (mFpsInterval) clearInterval(mFpsInterval);
        mSprites = {};
        mScripts = {};
        mAudio = {};
        mContext = null;
        mCanvas = null;
        mFpsInterval = null;
        mResetFrames = true;
        mCheckLoaded = false;
        mLoadCount = 0;
    };
    var mLoaded = function () {
        //Batch 0 can only be set internally and means does not participate in onLoaded
        for (key in mSprites) { if (!mSprites[key].loaded && mSprites[key].batch !== 0) return false; }        
        for (key in mSounds) { if (!mSounds[key].loaded && mSounds[key].batch !== 0) return false; }
        for (key in mScripts) { if (!mScripts[key].loaded && mScripts[key].batch !== 0) return false; }
        return true;
    };
    var mNowMs = function () {
        var now = new Date();
        var mls = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        return mls;
    };
    var mSetStore = function (nKey, nValue, nPrefix) {
        nPrefix = mString(nPrefix, val.cachePrefix);
        try {
            localStorage.setItem(nPrefix + nKey, nValue);
        } catch (e) {
            try {
                mClearStore(); //clear internal only, default prefix
                localStorage.setItem(nPrefix + nKey, nValue);
            } catch (ex) { }
        }
    };
    var mGetStore = function (nKey, nPrefix) {
        nPrefix = mString(nPrefix, val.cachePrefix);
        return localStorage.getItem(nPrefix + nKey);
    };
    var mClearStore = function (nName, nPrefix) {
        //if nName provided removes one item only, otherwise removes all
        nPrefix = mString(nPrefix, val.cachePrefix);
        if (nName) { localStorage.removeItem(nPrefix + nName); return; }
        var i = 0;
        while (i < localStorage.length) {
            var nKey = localStorage.key(i);
            if (nKey.indexOf(nPrefix) == 0) {
                localStorage.removeItem(nKey);
            } else { i++; }
        }
    };
    //loop
    var mLoop = function () {
        if (mCheckLoaded) {
            mCheckLoaded = false; //set when mOnLoaded set and when any item finishes loading
            if (mOnLoaded && mLoaded()) {
                mLoadCount++;
                mOnLoaded(mLoadCount);
            }
        }
        if (!(mBeforeFrame || mOnFrame || mAfterFrame)) return;
        var count, mls = mNowMs();
        if (mResetFrames) {
            mResetFrames = false;
            mLastFrame = mls;
            count = 1;
        } else {
            var count = (mls - mLastFrame) / (1000 / mFps);
            if (isNaN(count) || count > val.maxFrames || count < 0)
                count = 1;
            mLastFrame = mls;
        }
        if (mBeforeFrame) mBeforeFrame(count);
        if (mOnFrame) mOnFrame(count);
        if (mAfterFrame) mAfterFrame(count);
    };
    //position helpers
    var mFill = function (nWh, sWh) {
        var ow = mNumber(nWh[0], 0), oh = mNumber(nWh[1], 0);
        var sw = mNumber(sWh[0], 0), sh = mNumber(sWh[1], 0);
        if (ow == 0 || oh == 0 || sw == 0 || sh == 0) return null;
        //fit
        if (ow > sw) { var f = sw / ow; ow = sw; oh *= f; }
        if (oh > sh) { var f = sh / oh; oh = sh; ow *= f; }
        //fill
        if (ow < sw) { var f = sw / ow; ow = sw; oh *= f; }
        if (oh < sh) { var f = sh / oh; oh = sh; ow *= f; }
        return [ow, oh];
    };
    var mFit = function (nWh, sWh) {
        var ow = mNumber(nWh[0], 0), oh = mNumber(nWh[1], 0);
        var sw = mNumber(sWh[0], 0), sh = mNumber(sWh[1], 0);
        if (ow == 0 || oh == 0 || sw == 0 || sh == 0) return null;
        //fill
        if (ow < sw) { var f = sw / ow; ow = sw; oh *= f; }
        if (oh < sh) { var f = sh / oh; oh = sh; ow *= f; }
        //fit
        if (ow > sw) { var f = sw / ow; ow = sw; oh *= f; }
        if (oh > sh) { var f = sh / oh; oh = sh; ow *= f; }
        return [ow, oh];
    };
    var mAlign = function (hAlign, vAlign, nXywh, sWh) {
        //x-axis, defaults left
        var x = mNumber(nXywh[0], 0);
        hAlign = mString(hAlign, val.alignLeft);
        if (hAlign === val.alignCenter) x -= (nXywh[2] - sWh[0]) / 2;
        else if (hAlign === val.alignRight) x -= (nXywh[2] - sWh[0]);
        //y-axis, defaults top
        var y = mNumber(nXywh[1], 0);
        vAlign = mString(vAlign, val.alignTop);
        if (vAlign === val.alignCenter) y -= (nXywh[3] - sWh[1]) / 2;
        else if (hAlign === val.alignRight) y -= (nXywh[3] - sWh[1]);
        return [x, y];
    };
    //draw helpers
    var mInvertX = function (pX) {
        mContext.translate(pX, 0); //move y-axis line
        mContext.scale(-1, 1); //flip
        mContext.translate(-pX, 0); //move y-axis line back
    };
    var mInvertY = function (pY) {
        mContext.translate(0, pY); //move x-axis line
        mContext.scale(1, -1); //flip
        mContext.translate(0, -pY); //move x-axis line back
    };
    var mInvertXY = function (pX, pY) {
        mContext.translate(pX, pY);
        mContext.scale(-1, -1);
        mContext.translate(-pX, -pY);
    };
    var mPivot = function (nXywh, nPivotX, nPivotY) {
        var x = nPivotX || nXywh[0] + nXywh[2] / 2;
        var y = nPivotY || nXywh[1] + nXywh[3] / 2;
        return [x, y];
    };
    var mRotate = function (nDegrees, pXy) {
        nDegrees = mNumber(nDegrees, 0);
        nDegrees = nDegrees % 360;
        mContext.translate(pXy[0], pXy[1]);
        mContext.rotate(mRadians(nDegrees));
        mContext.translate(-pXy[0], -pXy[1]);
    };
    var mDrawImage = function (nName, nXywh, nAlpha, nInvertX, nInvertY, nRxy, nClip) {
        mContext.save();
        mContext.globalAlpha = mNumber(nAlpha, 1); //0 to 1
        //invert
        if (nInvertX && nInvertY) mInvertXY(nXywh[0] + nXywh[2] / 2, nXywh[1] + nXywh[3] / 2);
        else if (nInvertX) mInvertX(nXywh[0] + nXywh[2] / 2);
        else if (nInvertY) mInvertY(nXywh[1] + nXywh[3] / 2);
        //rotate
        if (nRxy && nRxy[0]) mRotate(nRxy[0], mPivot(nXywh, nRxy[1], nRxy[2]));
        if (!nClip) {
            mContext.drawImage(mSprites[nName].image, nXywh[0], nXywh[1], nXywh[2], nXywh[3]);
        } else {
            var oW  = mSprites[nName].image.width
            var oH  = mSprites[nName].image.height;
            var x = nClip[0] * oW, y = nClip[1] * oH;
            var w = nClip[2] * oW - x, h = nClip[3] * oH - y;
            mContext.drawImage(mSprites[nName].image, x, y, w, h, nXywh[0], nXywh[1], nXywh[2], nXywh[3]);
        } 
        mContext.restore();
    };
    var mDrawShapePoly = function (nXyPoints, nXywhCoords, nSettings, nAlpha, nInvertX, nInvertY, nRxy, nColor) {
        mContext.save();        
        mContext.globalAlpha = mNumber(nAlpha, 1); //0 to 1
        //invert, rotate
        if (nInvertX || nInvertY || (nRxy && nRxy[0])) {
            if (!nXywhCoords) nXywhCoords = mLib.getPolyXywhCoords(nXyPoints);
            if (nInvertX && nInvertY) mInvertXY(nXywhCoords[0] + nXywhCoords[2] / 2, nXywhCoords[1] + nXywhCoords[3] / 2);
            else if (nInvertX) mInvertX(nXywhCoords[0] + nXywhCoords[2] / 2);
            else if (nInvertY) mInvertY(nXywhCoords[1] + nXywhCoords[3] / 2);
            if (nRxy && nRxy[0]) mRotate(nRxy[0], mPivot(nXywhCoords, nRxy[1], nRxy[2]));
        }
        //settings
        var fill = false, stroke = false;
        if (nSettings) {
            if (nSettings.fill) { mContext.fillStyle = nSettings.fill; fill = true; }
            if (nSettings.stroke) { mContext.strokeStyle = nSettings.stroke; stroke = true; }
            if (nSettings.line) mContext.lineWidth = nSettings.line;
        }
        if (!fill && !stroke) fill = true;
        //draw
        mContext.beginPath();
        mContext.moveTo(nXyPoints[0], nXyPoints[1]);
        for (i = 2; i < nXyPoints.length; i += 2) 
            mContext.lineTo(nXyPoints[i], nXyPoints[i + 1]);
        mContext.closePath();
        if (fill) mContext.fill();
        if (stroke) mContext.stroke();
        mContext.restore();
    };
    var mDrawShapeRect = function (nXywh, nSettings, nAlpha, nInvertX, nInvertY, nRxy, nColor) {
        mContext.save();
        mContext.globalAlpha = mNumber(nAlpha, 1); //0 to 1
        //invert, rotate
        if (nInvertX || nInvertY || (nRxy && nRxy[0])) {
            if (nInvertX && nInvertY) mInvertXY(nXywh[0] + nXywh[2] / 2, nXywh[1] + nXywh[3] / 2);
            else if (nInvertX) mInvertX(nXywh[0] + nXywh[2] / 2);
            else if (nInvertY) mInvertY(nXywh[1] + nXywh[3] / 2);
            if (nRxy && nRxy[0]) mRotate(nRxy[0], mPivot(nXywh, nRxy[1], nRxy[2]));
        }
        //settings
        var fill = false, stroke = false;
        if (nSettings) {
            if (nSettings.fill) { mContext.fillStyle = nSettings.fill; fill = true; }
            if (nSettings.stroke) { mContext.strokeStyle = nSettings.stroke; stroke = true; }
            if (nSettings.line) mContext.lineWidth = nSettings.line;
        }
        if (!fill && !stroke) fill = true;
        //draw        
        if (fill) mContext.fillRect(nXywh[0], nXywh[1], nXywh[2], nXywh[3]);
        if (stroke) mContext.strokeRect(nXywh[0], nXywh[1], nXywh[2], nXywh[3]);
        mContext.restore();
    };
    var mDrawShapeCircle = function (nXyr, nSettings, nAlpha, nInvertX, nInvertY, nRxy, nColor) {
        mContext.save();
        mContext.globalAlpha = mNumber(nAlpha, 1); //0 to 1
        //invert, rotate
        if (nInvertX || nInvertY || (nRxy && nRxy[0])) {
            if (nInvertX && nInvertY) mInvertXY(nXyr[0], nXyr[1]);
            else if (nInvertX) mInvertX(nXyr[0]);
            else if (nInvertY) mInvertY(nXyr[1]);
            if (nRxy && nRxy[0]) mRotate(nRxy[0], mPivot([nXyr[0]-nXyr[2], nXyr[1]-nXyr[2], nXyr[2]+nXyr[2], nXyr[2]+nXyr[2]], nRxy[1], nRxy[2]));
        }
        //settings
        var fill = false, stroke = false;
        if (nSettings) {
            if (nSettings.fill) { mContext.fillStyle = nSettings.fill; fill = true; }
            if (nSettings.stroke) { mContext.strokeStyle = nSettings.stroke; stroke = true; }
            if (nSettings.line) mContext.lineWidth = nSettings.line;
        } else { nSettings = {}; nSettings.start = 0; nSettings.end = 360; }
        if (!fill && !stroke) fill = true;
        //draw
        mContext.beginPath();
        mContext.arc(nXyr[0], nXyr[1], nXyr[2], mRadians(mNumber(nSettings.start, 0)), mRadians(mNumber(nSettings.end, 360)));
        if (fill) mContext.fill();
        if (stroke) mContext.stroke();
        mContext.restore();
    };
    var mDrawShapeLine = function (sXy, eXy, nSettings, nAlpha, nInvertX, nInvertY, nRxy, nColor) {
        mContext.save();
        mContext.globalAlpha = mNumber(nAlpha, 1); //0 to 1
        //invert, rotate
        if (nInvertX || nInvertY || (nRxy && nRxy[0])) {
            var coords = [sXy[0], sXy[1], eXy[0] - sXy[0], eXy[1] - sXy[1]];
            if (nInvertX && nInvertY) mInvertXY(coords[0] + coords[2] / 2, coords[1] + coords[3] / 2);
            else if (nInvertX) mInvertX(coords[0] + coords[2] / 2);
            else if (nInvertY) mInvertY(coords[1] + coords[3] / 2);
            if (nRxy && nRxy[0]) mRotate(nRxy[0], mPivot(coords, nRxy[1], nRxy[2]));
        }
        //settings
        if (nSettings) {
            if (nSettings.stroke) mContext.strokeStyle = nSettings.stroke;
            if (nSettings.line) mContext.lineWidth = nSettings.line;
            if (nSettings.cap) mContext.lineCap = nSettings.cap; //butt|round|square
        }
        //draw
        mContext.beginPath();
        mContext.moveTo(sXy[0], sXy[1]);
        mContext.lineTo(eXy[0], eXy[1]);
        mContext.stroke();
        mContext.restore();
    };
    //sprite draw base
    var mBaseDrawSprite = function (nName, nX, nY, nWidth, nHeight, nClip, nAlpha, nInvertX, nInvertY, nRotate, nPivotX, nPivotY) {
        //Draws a single sprite at a specified position
        nName = mString(nName, null);
        if (!mContext || !nName || !mSprites[nName] || !mSprites[nName].loaded) return;
        nWidth = mNumber(nWidth, 0); nHeight = mNumber(nHeight, 0);
        if (nHeight == 0 || nWidth == 0) return;
        mDrawImage(nName, [mNumber(nX, 0), mNumber(nY, 0), nWidth, nHeight], nAlpha, nInvertX, nInvertY, [nRotate, nPivotX, nPivotY], nClip);
    };
    var mBaseDrawSpriteFilled = function (nName, nX, nY, nWidth, nHeight, nSpaceW, nSpaceH, hAlign, vAlign, nClip, nAlpha, nInvertX, nInvertY) {
        //Fills the space proportionately
        //hAlign defaults to left, vAlign defaults top
        nName = mString(nName, null);
        if (!mContext || !nName || !mSprites[nName] || !mSprites[nName].loaded) return;
        var wh = mFill([nWidth, nHeight], [nSpaceW, nSpaceH]);
        if (!wh) return;
        var xy = mAlign(hAlign, vAlign, [nX, nY, wh[0], wh[1]], [nSpaceW, nSpaceH]);
        mDrawImage(nName, [xy[0], xy[1], wh[0], wh[1]], nAlpha, nInvertX, nInvertY, nClip);
    };
    var mBaseDrawSpriteFitted = function (nName, nX, nY, nWidth, nHeight, nSpaceW, nSpaceH, hAlign, vAlign, nClip, nAlpha, nInvertX, nInvertY) {
        //Fits into the space proportionately
        //hAlign defaults to left, vAlign defaults top
        nName = mString(nName, null);
        if (!mContext || !nName || !mSprites[nName] || !mSprites[nName].loaded) return;
        var wh = mFit([nWidth, nHeight], [nSpaceW, nSpaceH]);
        if (!wh) return;
        var xy = mAlign(hAlign, vAlign, [nX, nY, wh[0], wh[1]], [nSpaceW, nSpaceH]);
        if (nAlpha) mCanvas.globalAlpha = mNumber(nAlpha, 1);
        mDrawImage(nName, [xy[0], xy[1], wh[0], wh[1]], nAlpha, nInvertX, nInvertY, nClip);
    };
    //
    //public
    mLib.initialize = function (nCanvas, nWidth, nHeight, nFps) {
        //nCanvas is an existing canvas id or canvas element, required        
        //Size defaults to defaultWidth and defaultHeight
        //nFps is the desired frames per second, defaults to val.defaultFps
        mReset(); //clears mFpsInterval as well
        if (nCanvas && (typeof nCanvas === "string")) nCanvas = mDoc.getElementById(nCanvas);
        if (!(nCanvas && nCanvas.getContext && nCanvas.getContext("2d"))) return;
        mCanvas = nCanvas;
        mCanvas.width = mNumber(nWidth, val.defaultWidth);
        mCanvas.height = mNumber(nHeight, val.defaultHeight);
        mContext = mCanvas.getContext("2d");
        mCheckLoaded = true;
        //set frame loop
        mFps = mNumberNatural(nFps, val.defaultFps);        
        mFpsInterval = setInterval(mLoop, 1000 / mFps); //cleared in above mReset() call
        mLoop();
    };
    mLib.resize = function (nWidth, nHeight) {
        if (!mCanvas) return;
        mCanvas.width = mNumber(nWidth, val.defaultWidth);
        mCanvas.height = mNumber(nHeight, val.defaultHeight);
    };
    mLib.resetFrames = function () {
        //Next beforeFrame, onFrame, and afterFrame will contain 1 as frames argument
        mResetFrames = true;
    };
    mLib.resetLoadCount = function () {
        //Next mOnLoaded contain 1 as count argument
        mLoadCount = 0;
    };
    mLib.renderFrame = function () {
        if (mCanvas) mLoop();
    };
    mLib.clear = function () {
        if (!mContext) return;
        mContext.clearRect(0, 0, mCanvas.width, mCanvas.height);
    };
    mLib.clearArea = function (nX, nY, nWidth, nHeight) {
        if (!mContext) return;
        nX = mNumber(nX, 0);
        nY = mNumber(nY, 0);
        nWidth = mNumber(nWidth, mCanvas.width);
        nHeight = mNumber(nHeight, mCanvas.height);
        mContext.clearRect(nX, nY, nWidth, nHeight);
    };
    mLib.clearCache = function (nName) {
        mClearStore(mString(nName, null));
    };
    //sprites
    mLib.loadSprite = function (nName, nSource, nBatch, nSettings) {
        //Loads a single sprite
        //nSettings is object with arguments for additional parameters (colorRgba, cacheName)
        nName = mString(nName, null);
        nSource = mString(nSource, null);
        if (!nName || !nSource) return;
        var img = new Image();
        mSprites[nName] = { image: img, loaded: false, batch: mString(nBatch, null) };
        img.addEventListener("load", function () {
            if (!mSprites[nName] || mSprites[nName].loaded) return;
            mSprites[nName].loaded = true;
            if (nSettings) {
                mLib.colorSprite(nName, nSettings.colorRgba, nSettings.cacheName);
            }
            mCheckLoaded = true;
        });
        img.src = nSource;        
    };
    mLib.colorSprite = function (nName, nAddRgba, nCacheName) {
        //nName must be existing loaded sprite
        //nCacheName is optional, creates new sprite if differs from nName, if not provided replaces sprite with nName and does not cache
        //nAddRgba is an array, [255, 255, 255, 1] would turn all pixels white and totally 
        //-opaque, [-255, -255, -255, -0.5] would make them black and reduce opacity by 50 percent        
        if (!nAddRgba || !mString(nName, null)) return; 
        var img = mSprites[nName];
        if (!img || !img.loaded) return;

        img = img.image;
        nAddRgba[0] = mNumber(nAddRgba[0], 0);
        nAddRgba[1] = mNumber(nAddRgba[1], 0);
        nAddRgba[2] = mNumber(nAddRgba[2], 0);
        nAddRgba[3] = mNumber(nAddRgba[3], 0) * 255;
        nCacheName = mString(nCacheName, null);

        var dataUrl = "";
        var cached = nCacheName ? mGetStore(nCacheName) : null;
        if (cached) {
            dataUrl = cached;
        } else {
            var can = document.createElement("canvas");
            can.width = img.width;
            can.height = img.height;
            var ctx = can.getContext("2d");
            ctx.drawImage(img, 0, 0);

            var dat = ctx.getImageData(0, 0, can.width, can.height);
            var d = d = dat.data;
            var i = 0, j = d.length;
            while (i < j) {
                var k = 0;
                do {
                    var v = d[i] + nAddRgba[k];
                    d[i] = v > 255 ? 255 : (v < 0 ? 0 : v);
                    k++; i++;
                } while (k < 4);
            }

            ctx.putImageData(dat, 0, 0);
            dataUrl = can.toDataURL("image/png;base64");
            if(nCacheName) mSetStore(nCacheName, dataUrl);
        }
        if (nCacheName && nName != nCacheName) { img = new Image(); mSprites[nCacheName] = { image: img, loaded: true, batch: null }; }
        img.src = dataUrl;
    };
    mLib.saveSprite = function (nName, nCache) {
        //will save current canvas drawing as sprite
        //nCache is a boolean indicating if sprite should be cached (with same name)
        //Does not participate in onLoaded, use isSpriteLoaded
        if (!mCanvas) return;
        nName = mString(nName, null);
        if (!nName) return;
        var dataUrl = mCanvas.toDataURL("image/png;base64");
        var img = new Image();
        mSprites[nName] = { image: img, loaded: false, batch: 0 };
        img.addEventListener("load", function () {
            if (mSprites[nName]) 
                mSprites[nName].loaded = true;
        });
        img.src = dataUrl;        
        if (nCache) mSetStore(nName, dataUrl);
    };
    mLib.unloadSprite = function (nName) {
        nName = mString(nName, null);
        if (!nName || !mSprites[nName]) return;
        delete mSprites[nName];
    };
    mLib.preloadImage = function (nSource, nSpriteName) {
        //nSpriteName is optional, provide if a named sprite is desired
        nSource = mString(nSource, null);
        if (!nSource) return;
        var img = new Image();
        mPreloads[mPreloads.length] = img;
        nSpriteName = mString(nSpriteName, null);
        if (nSpriteName) {
            //Does not participate in onLoaded, use isSpriteLoaded
            mSprites[nSpriteName] = { image: img, loaded: false, batch: 0 };
            img.addEventListener("load", function () {
                if (mSprites[nSpriteName]) 
                    mSprites[nSpriteName].loaded = true;
            });
        }
        img.src = nSource;
    };
    //scripts
    mLib.loadScript = function (nName, nSource, nBatch) {
        //Loads a single script file
        nName = mString(nName, null);
        nSource = mString(nSource, null);
        if (!nName || !nSource) return;
        var s = document.createElement("script");
        s.src = nSource; 
        s.async = true;
        mScripts[nName] = { script: s, loaded: false, batch: mString(nBatch, null) };
        s.addEventListener("load", function () {
            if (!mScripts[nName] || mScripts[nName].loaded) return;
            mScripts[nName].loaded = true;
            mCheckLoaded = true;
        });
        document.getElementsByTagName("head")[0].appendChild(s);
    };
    mLib.unloadScript = function (nName) {
        nName = mString(nName, null);
        if (!nName || !mScripts[nName]) return;
        if (mScripts[nName].script.parentNode)
            mScripts[nName].script.parentNode.removeChild(mScripts[nName].script);
        delete mScripts[nName];
    };
    //sounds
    mLib.loadSound = function (nName, nSource, nBatch) {
        //Loads a single audio file
        nName = mString(nName, null);
        nSource = mString(nSource, null);
        if (!nName || !nSource) return;
        var snd = new Audio();
        mSounds[nName] = { sound: snd, loaded: false, batch: mString(nBatch, null) };
        snd.addEventListener("canplaythrough", function () {
            if (!mSounds[nName] || mSounds[nName].loaded) return;
            mSounds[nName].loaded = true;
            mCheckLoaded = true;
        });
        snd.autoplay = false;
        snd.volume = val.volume;
        snd.src = nSource;        
        snd.load();
    };
    mLib.unloadSound = function (nName) {
        nName = mString(nName, null);
        if (!nName || !mSounds[nName]) return;
        delete mSounds[nName];
    };
    mLib.playSound = function (nName, nLoop) {
        nName = mString(nName, null);
        if (!nName) return;
        var snd = mSounds[nName];
        if (!snd || !snd.loaded) return;
        snd = snd.sound;
        snd.loop = !!nLoop;
        if (!snd.paused) snd.currentTime = 0;
        if (val.volume > 0) snd.play();
    };
    mLib.stopSound = function (nName, nOnLoop) {
        nName = mString(nName, null);
        if (!nName) return;
        var snd = mSounds[nName];
        if (!snd || !snd.loaded) return;
        snd = snd.sound;
        snd.loop = false;
        if (!nOnLoop) { snd.pause(); snd.currentTime = 0; }
    };
    mLib.pauseSound = function (nName) {
        nName = mString(nName, null);
        if (!nName) return;
        var snd = mSounds[nName];
        if (!snd || !snd.loaded) return;
        snd.sound.pause();
    };
    mLib.setVolume = function (nVolume, nName) {
        //nVolume is 0.0 to 1.0, with 0.0 being mute, defaults to previously set or 1
        //nName is optional, if not provided sets all volume to nVolume
        nName = mString(nName, null);
        nVolume = mNumber(nVolume, val.volume);
        if (nVolume > 1) nVolume = 1; else if (nVolume < 0) nVolume = 0;
        if (nName && mSounds[nName]) {
            mSounds[nName].sound.volume = nVolume;
        } else {
            for (var key in mSounds) mSounds[key].sound.volume = nVolume;
            val.volume = nVolume;
        }
    };
    //draw
    mLib.drawSprite = function (nName, nX, nY, nWidth, nHeight, nExtra, nClip) {
        //nClip is an optional array containing clipping area from original size (factors, [0,0,1,1] is no clipping)
        //nExtra is object with arguments for additional parameters (alpha, invertX, invertY, rotate, pivotX, pivotY)
        if (!nExtra) { mBaseDrawSprite(nName, nX, nY, nWidth, nHeight, nClip); return; }
        mBaseDrawSprite(nName, nX, nY, nWidth, nHeight, nClip,
            nExtra.alpha, nExtra.invertX, nExtra.invertY, nExtra.rotate, nExtra.pivotX, nExtra.pivotY);
    };
    mLib.drawSpriteFilled = function (nName, nX, nY, nWidth, nHeight, nSpaceW, nSpaceH, hAlign, vAlign, nExtra, nClip) {
        //nClip is an optional array containing clipping area from original size (factors, [0,0,1,1] is no clipping)
        //nExtra is object with arguments for additional parameters  (alpha, invertX, invertY)
        if (!nExtra) { mBaseDrawSpriteFilled(nName, nX, nY, nWidth, nHeight, nSpaceW, nSpaceH, hAlign, vAlign, nClip); return; }
        mBaseDrawSpriteFilled(nName, nX, nY, nWidth, nHeight, nSpaceW, nSpaceH, hAlign, vAlign, nClip,
            nExtra.alpha, nExtra.invertX, nExtra.invertY);
    };
    mLib.drawSpriteFitted = function (nName, nX, nY, nWidth, nHeight, nSpaceW, nSpaceH, hAlign, vAlign, nExtra, nClip) {
        //nClip is an optional array containing clipping area from original size (factors, [0,0,1,1] is no clipping)
        //nExtra is object with arguments for additional parameters  (alpha, invertX, invertY)
        if (!nExtra) { mBaseDrawSpriteFitted(nName, nX, nY, nWidth, nHeight, nSpaceW, nSpaceH, hAlign, vAlign, nClip); return; }
        mBaseDrawSpriteFitted(nName, nX, nY, nWidth, nHeight, nSpaceW, nSpaceH, hAlign, vAlign, nClip,
            nExtra.alpha, nExtra.invertX, nExtra.invertY);
    };
    mLib.drawPoly = function (nXyPoints, nSettings, nExtra, nXywhCoords) {
        //nSettings is object with arguments for additional parameters (fill, stroke, line)
        //nExtra is object with arguments for additional parameters (alpha, invertX, invertY, rotate, pivotX, pivotY)        
        //nXywhCoords is optional but recommended
        if (!mContext || !nXyPoints || nXyPoints.length <= 2) return;

        if (!nExtra) { mDrawShapePoly(nXyPoints, nXywhCoords, nSettings); return; }
        mDrawShapePoly(nXyPoints, nXywhCoords, nSettings,
            nExtra.alpha, nExtra.invertX, nExtra.invertY, [nExtra.rotate, nExtra.pivotX, nExtra.pivotY]);
    };
    mLib.drawRect = function (nX, nY, nWidth, nHeight, nSettings, nExtra) {
        //nSettings is object with arguments for additional parameters (fill, stroke, line)
        //nExtra is object with arguments for additional parameters (alpha, invertX, invertY, rotate, pivotX, pivotY)        
        if (!mContext) return;
        nWidth = mNumber(nWidth, 0); nHeight = mNumber(nHeight, 0);
        if (nHeight == 0 || nWidth == 0) return;

        if (!nExtra) { mDrawShapeRect([mNumber(nX, 0), mNumber(nY, 0), nWidth, nHeight], nSettings); return; }
        mDrawShapeRect([mNumber(nX, 0), mNumber(nY, 0), nWidth, nHeight], nSettings,
            nExtra.alpha, nExtra.invertX, nExtra.invertY, [nExtra.rotate, nExtra.pivotX, nExtra.pivotY]);
    };
    mLib.drawCircle = function (nX, nY, nRadius, nSettings, nExtra) {
        //nSettings is object with arguments for additional parameters (fill, stroke, line, start, end)
        //nExtra is object with arguments for additional parameters (alpha, invertX, invertY, rotate, pivotX, pivotY)        
        if (!mContext) return;
        nRadius = mNumber(nRadius, 0);
        if (nRadius == 0) return;

        if (!nExtra) { mDrawShapeCircle([mNumber(nX, 0), mNumber(nY, 0), nRadius], nSettings); return; }
        mDrawShapeCircle([mNumber(nX, 0), mNumber(nY, 0), nRadius], nSettings,
            nExtra.alpha, nExtra.invertX, nExtra.invertY, [nExtra.rotate, nExtra.pivotX, nExtra.pivotY]);
    };
    mLib.drawLine = function (sXy, eXy, nSettings, nExtra) {
        //nSettings is object with arguments for additional parameters (stroke, line, cap)
        //nExtra is object with arguments for additional parameters (alpha, invertX, invertY, rotate, pivotX, pivotY)        
        if (!mContext) return;
        if (!nExtra) { mDrawShapeLine(sXy, eXy, nSettings); return; }
        mDrawShapeLine(sXy, eXy, nSettings,
            nExtra.alpha, nExtra.invertX, nExtra.invertY, [nExtra.rotate, nExtra.pivotX, nExtra.pivotY]);
    };
    //get
    mLib.getFitted = function (nX, nY, nWidth, nHeight, nSpaceW, nSpaceH, hAlign, vAlign) {
        var wh = mFit([nWidth, nHeight], [nSpaceW, nSpaceH]);
        if (!wh) return [0, 0, 0, 0];
        var xy = mAlign(hAlign, vAlign, [nX, nY, wh[0], wh[1]], [nSpaceW, nSpaceH]);
        return [xy[0], xy[1], wh[0], wh[1]];
    };
    mLib.getFilled = function (nX, nY, nWidth, nHeight, nSpaceW, nSpaceH, hAlign, vAlign) {
        var wh = mFill([nWidth, nHeight], [nSpaceW, nSpaceH]);
        if (!wh) return [0, 0, 0, 0];
        var xy = mAlign(hAlign, vAlign, [nX, nY, wh[0], wh[1]], [nSpaceW, nSpaceH]);
        return [xy[0], xy[1], wh[0], wh[1]];
    };
    mLib.isLoaded = function (nName) {
        //If nName specified and valid, will return flag indicating if item(s) finished loading
        //Otherwise will return value indicating if all items finished loading
        nName = mString(nName, null);
        if (nName && (mSprites[nName] || mSounds[nName] || mScripts[nName])) {
            if (mSprites[nName] && !mSprites[nName].loaded)
                return false;
            if (mSounds[nName] && !mSounds[nName].loaded) return false;
            if (mScripts[nName] && !mScripts[nName].loaded) return false;
            return true;
        }
        return mLoaded();
    };
    mLib.isSpriteLoaded = function (nName) {
        //Will return flag indicating if sprite finished loading
        nName = mString(nName, null);
        if (nName && mSprites[nName]) return mSprites[nName].loaded;
        return false;
    };
    mLib.isScriptLoaded = function (nName) {
        //Will return flag indicating if script finished loading
        nName = mString(nName, null);
        if (nName && mScripts[nName]) return mScripts[nName].loaded;
        return false;
    };
    mLib.isSoundLoaded = function (nName) {
        //Will return flag indicating if sound finished loading
        nName = mString(nName, null);
        if (nName && mSounds[nName]) return mSounds[nName].loaded;
        return false;
    };
    mLib.isBatchLoaded = function (nName) {
        //Will return flag indicating if batch finished loading
        nName = mString(nName, null);
        if (nName) {
            for (var key in mSounds) { if (mSounds[key].batch === nName && !mSounds[key].loaded) return false; }
            for (var key in mSprites) { if (mSprites[key].batch === nName && !mSprites[key].loaded) return false; }
            for (var key in mScripts) { if (mScripts[key].batch === nName && !mScripts[key].loaded) return false; }
            return true;
        }
        return false;
    };
    mLib.getSpriteWidth = function (nName) {
        if (nName && mSprites[nName])
            return mSprites[nName].image.width;
        return 0;
    };
    mLib.getSpriteHeight = function (nName) {
        if (nName && mSprites[nName])
            return mSprites[nName].image.height;
        return 0;
    };
    mLib.getSpriteSize = function (nName) {
        //returns [width,height]
        if (nName && mSprites[nName])
            return [mSprites[nName].image.width, mSprites[nName].image.height];
        return [0, 0];
    };
    mLib.getCanvasWidth = function() {
        if(!mCanvas) return 0;
        return mCanvas.width;
    };
    mLib.getCanvasHeight = function() {
        if(!mCanvas) return 0;
        return mCanvas.height;
    };
    mLib.getCanvasSize = function () {
        //returns [width,height]
        if (!mCanvas) return [0,0];
        return [mCanvas.width, mCanvas.height];
    };
    mLib.has = function (nName) {
        //If nName specified and valid, will return flag indicating if item(s) exist
        //Otherwise will return value indicating if any items exist
        nName = mString(nName, null);
        if (nName && (mSprites[nName] || mSounds[nName] || mScripts[nName])) 
            return true;
        return Object.keys(mSprites).length > 0 || Object.keys(mSounds).length > 0 || Object.keys(mScripts).length > 0;
    };
    mLib.hasSprite = function (nName) {
        //Will return flag indicating if sprite finished loading
        nName = mString(nName, null);
        return nName && mSprites[nName];
    };
    mLib.hasScript = function (nName) {
        //Will return flag indicating if script finished loading
        nName = mString(nName, null);
        return nName && mScripts[nName];
    };
    mLib.hasSound = function (nName) {
        //Will return flag indicating if sound finished loading
        nName = mString(nName, null);
        return nName && mSounds[nName];
    };
    mLib.getVolume = function (nName) {
        //nName is optional, if not provided returns previously set or default volume
        nName = mString(nName, null);
        if (!nName || !mSounds[nName]) return val.volume;
        return mSounds[nName].sound.volume;
    };
    mLib.isSoundPaused = function (nName) {
        //Returns pause state of sound nName
        nName = mString(nName, null);
        if (!nName || !mSounds[nName]) return true;
        return mSounds[nName].sound.paused;
    };
    //config
    mLib.setConfig = function (nKey, nValue) {
        mSetStore(nKey, nValue, val.cacheConfig);
    };
    mLib.getConfig = function (nKey) {
        return mGetStore(nKey, val.cacheConfig);
    };
    mLib.clearConfig = function (nName) {
        //if nName provided removes one item only, otherwise removes all
        mClearStore(nName, val.cacheConfig);
    };
    //random
    mLib.randomFactor = function () {
        //returns number between 0.0 to 1.0, exclusive
        var val = Math.random();
        if (val == 0) val += 0.00001; else if (val == 1) val -= 0.00001;
        return val;
    };
    mLib.randomSelect = function (nA, nB) {
        return mLib.randomFactor() < 0.5 ? nA : nB;
    };
    mLib.randomBool = function () {
        return mLib.randomSelect(true, false);
    };
    mLib.randomFlag = function (nOddsFactor) {
        //returns true if within odds, otherwise false
        return Math.random() <= nOddsFactor;
    };
    mLib.randomSign = function () {
        //returns 1 or -1
        return mLib.randomSelect(1, -1);
    };
    mLib.randomSignedFactor = function () {
        //returns number between 0.0 to 1.0, exclusive, with random sign
        return mLib.randomFactor() * mLib.randomSign();
    };    
    mLib.randomFloat = function (nMin, nMax) {
        //returns number between nMin (inclusive) to nMax (exclusive)
        //if only one argument specified it will be treaterd as max, min will be zero
        //if min greater than max they are swapped        
        if (!nMax) { nMax = nMin; nMin = 0; }
        if (nMin > nMax) { var t = nMin; nMin = nMax; nMax = t; }
        return nMin + mLib.randomFactor() * (nMax - nMin);
    };
    mLib.randomSignedFloat = function (nMin, nMax) {
        return mLib.randomFloat(nMin, nMax) * mLib.randomSign();
    };
    mLib.randomInt = function (nMin, nMax) {
        return Math.floor(mLib.randomFloat(nMin, nMax));
    };
    mLib.randomSignedInt = function (nMin, nMax) {
        return mLib.randomInt(nMin, nMax) * mLib.randomSign();
    };
    mLib.randomItem = function (nArray) {
        if (!nArray || !nArray.length) return null;
        return nArray[cLib.randomInt(0, nArray.length)];
    };
    //hit
    mLib.rectHitPoint = function (nX, nY, nWidth, nHeight, nPointX, nPointY) {
        if(nPointX >= nX && nPointX < nX+nWidth)
            if(nPointY >= nY && nPointY < nY+nHeight)
                return true;
        return false;
    };
    mLib.rectHitRect = function (nXywhA, nXywhB) {
        if(nXywhA[0] + nXywhA[2] > nXywhB[0] && nXywhA[0] < nXywhB[0]+nXywhB[2])
            if(nXywhA[1] + nXywhA[3] > nXywhB[1] && nXywhA[1] < nXywhB[1]+nXywhB[3])
                return true;
        return false;
    };
    mLib.rectHitRectY = function (nYhA, nYhB) {
        if(nYhA[0] + nYhA[1] > nYhB[0] && nYhA[0] < nYhB[0]+nYhB[1])
            return true;
        return false;
    };
    mLib.rectHitRectX = function (nXwA, nXwB) {
        if(nXwA[0] + nXwA[1] > nXwB[0] && nXwA[0] < nXwB[0]+nXwB[1])
            return true;
        return false;
    };
    mLib.circleHitPoint = function (nX, nY, nRadius, nPointX, nPointY) {
        //Check bounding box first
        if (mLib.rectHitPoint(nX-nRadius, nY-nRadius, nRadius+nRadius, nRadius+nRadius, nPointX, nPointY)) {
            if (mLib.getLineLengthActual([nX, nY], [nPointX, nPointY]) <= nRadius)
                return true;
        }
        return false;
    };
    mLib.circleHitCircle = function (nXyrA, nXyrB) {
        //Check bounding box first
        var r1 = nXyrA[2], y1 = nXyrA[1], x1 = nXyrA[0];
        var r2 = nXyrB[2], y2 = nXyrB[1], x2 = nXyrB[0];
        if(mLib.rectHitRect([x1-r1, y1-r1, r1+r1, r1+r1], [x2-r2, y2-r2, r2+r2, r2+r2])) {
            if(mLib.getLineLengthActual([x1, y1], [x2, y2]) <= r1+r2)
                return true;
        }
        return false;
    };
    mLib.polyHitPoint = function (nXyPoints, nPointX, nPointY, nXywhCoords) {        
        //nXywhCoords is optional but recommended
        //Check bounding rect first
        if (!nXywhCoords) nXywhCoords = mLib.getPolyXywhCoords(nXyPoints);
        if (mLib.rectHitPoint(nXywhCoords[0], nXywhCoords[1], nXywhCoords[2], nXywhCoords[3], nPointX, nPointY)) {
            var c = false;
            var xpi, ypi, xpj, ypj;
            var npol = nXyPoints.length;

            var i = 0, j = npol - 2;
            while (i < npol) {
                xpi = nXyPoints[i];
                ypi = nXyPoints[i + 1];
                xpj = nXyPoints[j];
                ypj = nXyPoints[j + 1];

                if ((((ypi <= nPointY) && (nPointY < ypj)) || ((ypj <= nPointY) && (nPointY < ypi))) && (nPointX < (xpj - xpi) * (nPointY - ypi) / (ypj - ypi) + xpi))
                    c = !c;

                j = i;
                i += 2;
            }
            return c;
        }
        return false;
    };
    mLib.polyHitPoly = function (nXyPointsA, nXyPointsB, nXywhCoordsA, nXywhCoordsB) {
        //nXywhCoordsA & nXywhCoordsB are optional but recommended
        //Check bounding rect first        
        if (!nXywhCoordsA) nXywhCoordsA = mLib.getPolyXywhCoords(nXyPointsA);
        if (!nXywhCoordsB) nXywhCoordsB = mLib.getPolyXywhCoords(nXyPointsB);
        if(!mLib.rectHitRect([nXywhCoordsA[0], nXywhCoordsA[1], nXywhCoordsA[2], nXywhCoordsA[3]], [nXywhCoordsB[0], nXywhCoordsB[1], nXywhCoordsB[2], nXywhCoordsB[3]])) return false;
        
        var z, j, i;
        var edgeX, edgeY, axisX, axisY, magnitude;
        var minA, minB, maxA, maxB, dotProduct, intervalDistance;
        var p1X, p1Y, p2X, p2Y;
		
        //Get Edges
        i = 0;
        var countA = nXyPointsA.length, countB = nXyPointsB.length;
        var edgesA = [], edgesB = [];        
        while(i < countA) {
            p1X = nXyPointsA[i]; p1Y = nXyPointsA[i+1]; 
            if(i + 2 >= countA) {
                p2X = nXyPointsA[0]; p2Y = nXyPointsA[1];
            } else {
                p2X = nXyPointsA[i+2]; p2Y = nXyPointsA[i+3];
            }
            edgesA[i] = p2X - p1X;
            edgesA[i+1] = p2Y - p1Y;
            i += 2;
        }
		
        i = 0;
        while(i < countB) {
            p1X = nXyPointsB[i]; p1Y = nXyPointsB[i+1]; 
            if(i + 2 >= countB) {
                p2X = nXyPointsB[0]; p2Y = nXyPointsB[1];
            } else {
                p2X = nXyPointsB[i+2]; p2Y = nXyPointsB[i+3];
            }
            edgesB[i] = p2X - p1X;
            edgesB[i+1] = p2Y - p1Y;
            i += 2;
        }
		
        //Loop through all the edges of both polygons
        i = 0;
        var c = countA, e = edgesA;		        
        while(i < 2) {
            j = 0;
            while(j < c) {
                edgeX = e[j];
                edgeY = e[j+1];
				
                //Find the axis perpendicular to the current edge
                axisX = -edgeY;
                axisY = edgeX;
				
                magnitude = axisX*axisX + axisY*axisY; 
                axisX = axisX / magnitude;
                axisY = axisY / magnitude;
				
                //Find the projection of the polygon on the current axis - To project a point on an axis use the dot product
                z = 0;
                minA = axisX * nXyPointsA[z] + axisY * nXyPointsA[z+1]; 
                maxA = minA; 
                z = 2; 
                while(z < countA) {
                    dotProduct = axisX * nXyPointsA[z] + axisY * nXyPointsA[z+1];
                    if(dotProduct < minA) minA = dotProduct;
                    if(dotProduct > maxA) maxA = dotProduct;
                    z+=2;
                }
				
                z = 0;
                minB = axisX * nXyPointsB[z] + axisY * nXyPointsB[z+1]; 
                maxB = minB; 
                z = 2; 
                while(z < countB) {
                    dotProduct = axisX * nXyPointsB[z] + axisY * nXyPointsB[z+1];
                    if(dotProduct < minB) minB = dotProduct;
                    if(dotProduct > maxB) maxB = dotProduct;
                    z+=2;
                }
				
                //Check if the polygon projections are currentlty intersecting
                intervalDistance = minA < minB ? minB - maxA : minA - maxB;
                if(intervalDistance > 0)
                    return false;
				
                j+=2;
            }
			
            e = edgesB;
            c = countB;
            i++;
        }
        return true;
    };
    //helpers
    mLib.isRoundEqual = function (nNumberA, nNumberB) {
        return Math.round(nNumberA) == Math.round(nNumberB);
    };
    mLib.getLineLengthActual = function (nXyA, nXyB) {
        //Used to retrieve the actual length of a line
        return Math.sqrt(Math.abs(nXyA[0]-nXyB[0]) * Math.abs(nXyA[0]-nXyB[0]) + Math.abs(nXyA[1]-nXyB[1]) * Math.abs(nXyA[1]-nXyB[1]));
    };
    mLib.getLineLengthCompare = function (nXyA, nXyB) {
        //Used only to compare line lengths
        return Math.abs(nXyA[0]-nXyB[0]) * Math.abs(nXyA[0]-nXyB[0]) + Math.abs(nXyA[1]-nXyB[1]) * Math.abs(nXyA[1]-nXyB[1]);
    };
    mLib.getPolyXywhCoords = function(nXyPoints) {
        var xywh = [0, 0, 0, 0];
        var j = nXyPoints.length;
        if(j > 1) {
            var minX = nXyPoints[0], minY = nXyPoints[1]; 
            var maxX = minX, maxY = minY; 		
            var i = 2;
            while (i < j) {
                if(nXyPoints[i] < minX) minX = nXyPoints[i];
                if(nXyPoints[i] > maxX) maxX = nXyPoints[i];
                if(nXyPoints[i+1] < minY) minY = nXyPoints[i+1];
                if(nXyPoints[i+1] > maxY) maxY = nXyPoints[i+1];
                i+=2;
            }	
            xywh[0] = minX; //X
            xywh[1] = minY; //Y
            xywh[2] = (maxX - minX); //Width
            xywh[3] = (maxY - minY); //Height            
        }
        return xywh;
    };
    mLib.getRectXyPolyPoints = function (nX, nY, nWidth, nHeight) {
        var abcdXy = [];
        var xo1 = nX, xo2 = nX + nWidth, xo3 = nX + nWidth, xo4 = nX;
        var yo1 = nY, yo2 = nY, yo3 = nY + nHeight, yo4 = nY + nHeight;
        abcdXy[0] = xo1; abcdXy[1] = yo1; //tl = a, tr = b, br = c, bl = d
        abcdXy[2] = xo2; abcdXy[3] = yo2; 
        abcdXy[4] = xo3; abcdXy[5] = yo3; 
        abcdXy[6] = xo4; abcdXy[7] = yo4; 
        return abcdXy;
    };
    mLib.getCircleXyPolyPoints = function (nX, nY, nRadius, nPointsCount) {
        //nPointsCount defaults to val.circlePolyPoints
        nPointsCount = mNumberNatural(nPointsCount, val.circlePolyPoints);
        var i = 0, j = 0;
        var points = [], jump = 360.0/nPointsCount;
        while(i < nPointsCount) {
            var xy = mLib.getCircleXy(nX, nY, nRadius, i * jump);
            points[j] = xy[0]; j++;
            points[j] = xy[1]; j++;
            i++;
        }
        return points;
    };
    mLib.getEllipseXyPolyPoints = function (nX, nY, nRadiusX, nRadiusY, nPointsCount) {
        //nPointsCount defaults to val.circlePolyPoints
        nPointsCount = mNumberNatural(nPointsCount, val.circlePolyPoints);
        var i = 0, j = 0;
        var points = [], jump = 360.0 / nPointsCount;
        while (i < nPointsCount) {
            var xy = mLib.getEllipseXy(nX, nY, nRadiusX, nRadiusY, i * jump);
            points[j] = xy[0]; j++;
            points[j] = xy[1]; j++;
            i++;
        }
        return points;
    };
    mLib.getRotatedXyPolyPoints = function (nXyPoints, nPivotX, nPivotY, nDegrees) {
        //Radians
        var r = mRadians(nDegrees);
        var cosR = Math.cos(r);
        var sinR = Math.sin(r);        
        //New Pivot
        var pX = (cosR * nPivotX - sinR * nPivotY);
        var pY = (sinR * nPivotX + cosR * nPivotY);        
        //Pivot Change
        pX = nPivotX - pX; 
        pY = nPivotY - pY;        
        //Move Points
        var i = 0, j = nXyPoints.length;
        var x1, y1, points = [];
        while(i < j) {
            x1 = (cosR * nXyPoints[i] - sinR * nXyPoints[i + 1]);
            y1 = (sinR * nXyPoints[i] + cosR * nXyPoints[i + 1]);
            points[i] = x1 + pX;
            points[i + 1] = y1 + pY;
            i += 2;
        }
        return points;
    }
    //angle    
    mLib.getAngle = function (nPointX, nPointY) {
        //returns the angle from origin
        var angle = mDegrees(Math.atan2(nPointY, nPointX));
        return mAngle180(angle);
    };
    mLib.getFaceAngle = function (nCurrX, nCurrY, nDestX, nDestY, nOrgFaceAngle) {
        //nOrgFaceAngle is the angle in which the object is pointing visually, in its original state, where right is zero
        var angle = mDegrees(Math.atan2(nDestY - nCurrY, nDestX - nCurrX)) - nOrgFaceAngle;
        return mAngle180(angle);
    };
    mLib.getCirclePointAngle = function(nCircleX, nCircleY, nPointX, nPointY) {
        //Gets the rotation on a circle using the point provided (nPointX, nPointY)
        var angle = mDegrees(Math.atan2(nPointY-nCircleY, nPointX-nCircleX));
        return mAngle180(angle);
    };
    mLib.getCircleXy = function (nCircleX, nCircleY, nRadius, nAngle) {
        //Gets the point on a circle using the rotation provided (nAngle)
        var r = mRadians(nAngle); 
        var x = nCircleX + Math.cos(r) * nRadius; 
        var y = nCircleY + Math.sin(r) * nRadius;
        return [x, y];
    };
    mLib.getEllipseXy = function (nCircleX, nCircleY, nRadiusX, nRadiusY, nAngle) {
        //Gets the point on an ellipse using the rotation provided (nAngle)
        var r = mRadians(nAngle);  
        var x = nCircleX + Math.cos(r) * nRadiusX; 
        var y = nCircleY + Math.sin(r) * nRadiusY;
        return [x, y];
    };
    mLib.getProjectedXY = function (nCurrX, nCurrY, nTravelDistance, nTravelAngle) {
        //Gets the end point of a line using the point, distance, and travel angle provided
        //Exists for contextual readability, same as getCircleXy()
        var r = mRadians(nTravelAngle); 
        var x = nCurrX + Math.cos(r) * nTravelDistance; 
        var y = nCurrY + Math.sin(r) * nTravelDistance;
        return [x, y];
    };
    mLib.getRotateSign = function (nCurrAngle, nDestAngle) {
        //returns the fastest rotation direction, 1 or -1
        var test = mAngle180(nDestAngle) - mAngle180(nCurrAngle);
        if (test > 180) test -= 2 * 180;
        else if (test < -180) test += 2 * 180;
        return test > 0 ? 1 : -1;
    };
    mLib.getAngleSpan = function (nAngleA, nAngleB) {
        //returns the shortest distance between two angles
        nAngleA = mAngle360(nAngleA);
        nAngleB = mAngle360(nAngleB);	
        var angle = Math.abs(nAngleA - nAngleB) % 360;
        if(angle > 180) angle = 360 - angle;
        return angle;	
    };
    //events
    mLib.onLoaded = function (nHandler) {
        //nHandler is a function with one parameter:
        //-count: the number of times the event occured
        //Loading new items will re-trigger event (fires on first frame after triggered)
        //If nothing to load still fires once, on first frame after initialize and this handler is set (count = 1)
        if (!nHandler) { mOnLoaded = null; return; }
        if (typeof nHandler === "function") { mOnLoaded = nHandler; mCheckLoaded = true; }
    };
    mLib.beforeFrame = function (nHandler) {
        //nHandler is a function with one parameter:
        //-frames: the number of frames that passed since the last, e.g. 1.2, 2.0, etc...
        if (!nHandler) { mBeforeFrame = null; return; }
        if (typeof nHandler === "function") mBeforeFrame = nHandler;
    };
    mLib.onFrame = function (nHandler) {
        //nHandler is a function with one parameter:
        //-frames: the number of frames that passed since the last, e.g. 1.2, 2.0, etc...
        if (!nHandler) { mOnFrame = null; return; }
        if (typeof nHandler === "function") mOnFrame = nHandler;
    };
    mLib.afterFrame = function (nHandler) {
        //nHandler is a function with one parameter:
        //-frames: the number of frames that passed since the last, e.g. 1.2, 2.0, etc...
        if (!nHandler) { mAfterFrame = null; return; }
        if (typeof nHandler === "function") mAfterFrame = nHandler;
    };
    //
    //Add extension classes and expose canvasLib and cLib to the global object    
    //Expose canvasLib and cLib to the global object    
    mWin.canvasLib = mWin.cLib = mLib;
    //controlled anime
    var canvasAnime = (function () {
        function canvasAnime() {
            var vars = { sprites: null, count: 0, delay: 1, delayReturn: 1, backPlay: false, repeat: false, repeatCount: Infinity, on: false, onBack: false, index: 0 };            
            this.get = vars;
            this.checkOn = function () {
                if (!vars.repeat) { vars.on = false; }
                else if (vars.repeatCount != Infinity) { vars.repeatCount--; if (vars.repeatCount < 0) vars.on = false; }
            };            
        }

        canvasAnime.prototype.isStopped = function () { return !this.get.on; };
        canvasAnime.prototype.stopRepeat = function () { this.get.repeat = false; };
        canvasAnime.prototype.stop = function () { this.get.on = false; };                
        canvasAnime.prototype.changeDelay = function (nDelay) { this.get.delay = mNumberNatural(nDelay, 1); this.get.delayReturn = this.get.delay; };

        canvasAnime.prototype.spriteCount = function () { return this.get.count; };
        canvasAnime.prototype.getSprite = function () { return this.get.sprites && this.get.index < this.get.sprites.length ? this.get.sprites[this.get.index] : null; };        
        canvasAnime.prototype.getWidth = function () { return mLib.getSpriteWidth(this.getSprite()); };
        canvasAnime.prototype.getHeight = function () { return mLib.getSpriteHeight(this.getSprite()); };
        canvasAnime.prototype.getSize = function () { return mLib.getSpriteSize(this.getSprite()); };

        canvasAnime.prototype.restart = function (nRepeat, nRepeatCount) {
            this.get.on = !!this.get.sprites;
            if (!this.get.on) return;
            this.get.repeat = !!nRepeat;
            this.get.repeatCount = mNumber(nRepeatCount, -1) >= 0 ? nRepeatCount : Infinity;
            this.get.delay = this.get.delayReturn;
            this.get.index = 0;
        };

        canvasAnime.prototype.begin = function (nSprites, nDelay, nBackplay, nRepeat, nRepeatCount) {
            //nSprites is an array of sprite names, required
            //nDelay is number of frames to wait before flip sprite, defaults to 1
            //nBackplay is boolean indicating if frames should run bacwards at end of sprites, defaults to false
            //nRepeat is boolean indicating if anime should loop, defaults to false
            //nRepeatCount is number indication number of loops before stop, defaults to Infinity    
            if (!nSprites || !nSprites.length || nSprites.length <= 0) return;

            this.get.sprites = nSprites.slice(0);
            this.get.delay = mNumberNatural(nDelay, 1);            
            this.get.repeat = !!nRepeat;
            this.get.repeatCount = mNumber(nRepeatCount, -1) >= 0 ? nRepeatCount : Infinity;
            this.get.on = true;
            this.get.delayReturn = this.get.delay;
            this.get.count = nSprites.length;
            this.get.backPlay = this.spriteCount() <= 2 ? false : !!nBackplay;
        };

        canvasAnime.prototype.advance = function (nFrames) {
            if (!this.get.on) return;
            this.get.delay -= nFrames || 1;
            while (this.get.delay <= 0) {
                this.get.delay = this.get.delayReturn + this.get.delay;
                if (this.get.onBack) {
                    this.get.index--;
                    if (this.get.index < 0) { this.get.index = 1; this.get.onBack = false; this.checkOn(); }
                } else {
                    this.get.index++;
                    if (this.get.index >= this.spriteCount()) {
                        if (!this.get.backPlay) { this.get.index = 0; this.checkOn(); }
                        else { this.get.onBack = true; this.get.index = this.spriteCount() - 2; }
                    }
                }
            }
        };

        return canvasAnime;
    })();
    //looping anime
    var canvasLoop = (function (parent) {
        canvasLoop.prototype = new canvasAnime();
        canvasLoop.prototype.constructor = canvasLoop;

        function canvasLoop(nSprites, nDelay, nBackplay) {
            parent.call(this);
            this.mBeginLoop = function () { parent.prototype.begin.call(this, nSprites, nDelay, nBackplay, true); };
        }

        canvasLoop.prototype.begin = function () { this.mBeginLoop(); };
        return canvasLoop;
    })(canvasAnime);
    //controlled anime sprite sheet
    var canvasAnimeSheet = (function (parent) {
        canvasAnimeSheet.prototype = new canvasAnime();
        canvasAnimeSheet.prototype.constructor = canvasAnimeSheet;

        function canvasAnimeSheet() {
            var vars = { cols: 1, rows: 1, cellW: 0, cellH: 0, factorW: 0, factorH: 0, count: 0 };
            this.map = vars;
            parent.call(this);
        }

        canvasAnimeSheet.prototype.spriteCount = function () { return this.map.count; };
        canvasAnimeSheet.prototype.getSprite = function () { return this.get.sprites ? this.get.sprites[0] : null; };        
        canvasAnimeSheet.prototype.getWidth = function () { return this.map.cellW; };
        canvasAnimeSheet.prototype.getHeight = function () { return this.map.cellH; };
        canvasAnimeSheet.prototype.getSize = function () { return [this.map.cellW, this.map.cellH]; };

        canvasAnimeSheet.prototype.begin = function (nSpriteSheet, nColumns, nRows, nDelay, nBackplay, nRepeat, nRepeatCount) {
            //nSpriteSheet overrides nSprites, required
            if (!nSpriteSheet) return;

            var wh = mLib.getSpriteSize(nSpriteSheet);
            this.map.cols = Math.floor(mNumberNatural(nColumns, 1));
            this.map.rows = Math.floor(mNumberNatural(nRows, 1));
            this.map.cellW = wh[0] / this.map.cols;
            this.map.cellH = wh[1] / this.map.rows;
            this.map.factorW = wh[0] == 0 ? 0 : this.map.cellW / wh[0];
            this.map.factorH = wh[1] == 0 ? 0 : this.map.cellH / wh[1];
            this.map.count = this.map.cols * this.map.rows; //parent may use this via spriteCount()

            parent.prototype.begin.call(this, [nSpriteSheet], nDelay, nBackplay, nRepeat, nRepeatCount);
        };

        canvasAnimeSheet.prototype.getClip = function () {
            var s = this.getSprite(); if (!s) return [0, 0, 0, 0];
            var r = Math.floor(this.get.index / this.map.cols);
            var c = this.get.index - (r * this.map.cols);            
            return [this.map.factorW * c, this.map.factorH * r, this.map.factorW * c + this.map.factorW, this.map.factorH * r + this.map.factorH];
        };

        canvasAnimeSheet.prototype.getClipForCell = function (nColumn, nRow) {
            var s = this.getSprite(); if (!s) return [0, 0, 0, 0];
            var r = (nRow < 0 || nRow >= this.map.rows) ? 0 : nRow;
            var c = (nColumn < 0 || nColumn >= this.map.cols) ? 0 : nColumn;
            return [this.map.factorW * c, this.map.factorH * r, this.map.factorW * c + this.map.factorW, this.map.factorH * r + this.map.factorH];
        };

        canvasAnimeSheet.prototype.getClipForIndex = function (nIndex) {
            var s = this.getSprite(); if (!s) return [0, 0, 0, 0];
            var i = (nIndex >= this.map.count) ? 0 : nIndex;
            var r = Math.floor(i / this.map.cols);
            var c = i - (r * this.map.cols);
            return [this.map.factorW * c, this.map.factorH * r, this.map.factorW * c + this.map.factorW, this.map.factorH * r + this.map.factorH];
        };

        canvasAnimeSheet.prototype.getCell = function (nIndex) {
            var s = this.getSprite(); if (!s) return [0, 0];
            var i = (nIndex >= this.map.count) ? 0 : nIndex;
            var r = Math.floor(i / this.map.cols);
            var c = i - (r * this.map.cols);
            return [c, r];
        };

        return canvasAnimeSheet;
    })(canvasAnime);
    //looping anime sprite sheet
    var canvasLoopSheet = (function (parent) {
        canvasLoopSheet.prototype = new canvasAnimeSheet();
        canvasLoopSheet.prototype.constructor = canvasLoopSheet;

        function canvasLoopSheet(nSpriteSheet, nColumns, nRows, nDelay, nBackplay) {
            parent.call(this);
            this.mBeginLoop = function () { parent.prototype.begin.call(this, nSpriteSheet, nColumns, nRows, nDelay, nBackplay, true); };
        }

        canvasLoopSheet.prototype.begin = function () { this.mBeginLoop(); };
        return canvasLoopSheet;
    })(canvasAnimeSheet);
    //particles object
    var partObject = (function () {
        function partObject(nOriginX, nOriginY, nInvert, nSettings) {            
            //nSettings is object with arguments for additional parameters (minStartAngle, maxEndAngle, maxRadiusX, maxRadiusY, pathCount, maxParticles, jumpAngleFactor, jumpRadiusFactor)
            if (!nSettings) nSettings = {};
            nSettings.minStartAngle = mNumber(nSettings.minStartAngle, 0);
            nSettings.maxEndAngle = mNumber(nSettings.maxEndAngle, 360);
            nSettings.maxRadiusX = Math.abs(mNumber(nSettings.maxRadiusX, 128));
            nSettings.maxRadiusY = Math.abs(mNumber(nSettings.maxRadiusY, 128));
            nSettings.pathCount = mNumberNatural(nSettings.pathCount, 36);
            nSettings.maxParticles = mNumberNatural(nSettings.maxParticles, 144);
            nSettings.jumpAngleFactor = Math.abs(mNumber(nSettings.jumpAngleFactor, 0.01));
            nSettings.jumpRadiusFactor = Math.abs(mNumber(nSettings.jumpRadiusFactor, 0.01));
            if (nSettings.minStartAngle > nSettings.maxEndAngle) { 
                var t = nSettings.minStartAngle; nSettings.minStartAngle = nSettings.maxEndAngle; nSettings.maxEndAngle = t;
            }
            //center of source of particles
            nOriginX = mNumber(nOriginX, 0);
            nOriginY = mNumber(nOriginY, 0);
            nInvert  = !!nInvert;                        
            //pre-generates particle paths
            var pnts = []; //[[[x,y]]] 
            var prts = []; //[{pathIndex, pointIndex, tag}]
            var i = 0;
            while (i < nSettings.pathCount) {
                var ang = mLib.randomFloat(nSettings.minStartAngle, nSettings.maxEndAngle);
                var maxRx = mLib.randomFloat(nSettings.maxRadiusX);
                var maxRy = mLib.randomFloat(nSettings.maxRadiusY);

                var sSpan = mLib.getAngleSpan(nSettings.minStartAngle, ang);
                var eSpan = mLib.getAngleSpan(ang, nSettings.maxEndAngle);
                var dir = sSpan < eSpan || nInvert ? -1 : 1; 
                var aSpan = dir == -1 ? sSpan : eSpan;

                var j = 0, rX = 0, rY = 0, a = ang, p = [];
                do {
                    p[j] = mLib.getEllipseXy(nOriginX, nOriginY, rX, rY, a);
                    a += aSpan * nSettings.jumpAngleFactor * dir;
                    if (rX < maxRx) rX += nSettings.jumpRadiusFactor * maxRx;
                    if (rY < maxRy) rY += nSettings.jumpRadiusFactor * maxRy;
                    j++;
                } while (rX < maxRx || rY < maxRy);
                pnts[i] = p;
                i++;
            }
            var vars = { on: false, points: pnts, parts: prts, maxParts:nSettings.maxParticles, drawCallback: null, tagsArray: null };
            this.get = vars; 
        }

        partObject.prototype.isComplete = function () { return !this.get.on && this.get.parts.length == 0; };
        partObject.prototype.isStopped = function () { return !this.get.on; };
        partObject.prototype.stop = function () { this.get.on = false; };
        partObject.prototype.resume = function () { this.get.on = true; };

        partObject.prototype.begin = function (nDrawCallback, nTagsArray) {
            //nDrawCallback is a function with six parameters:
            //-caller: the particles object
            //-x: the center x position to draw the particle
            //-y: the center y position to draw the particle
            //-factor: the completion factor, 0.0 to 1.0
            //-tag: a tag from nTagsArray assigned to each particle (randomly assigned at creation of particle)
            //-data: an argument passed to central draw() method 
            if (!nDrawCallback) { this.get.drawCallback = null; this.get.tagsArray = null; return; }
            if (typeof nDrawCallback === "function") this.get.drawCallback = nDrawCallback;
            this.get.tagsArray = nTagsArray || null;
            this.get.on = true;
        };

        partObject.prototype.draw = function (nData) {
            if (!this.get.drawCallback || this.get.parts.length == 0) return;
            var i = 0, j = this.get.parts.length;
            while (i < j) {
                var part = this.get.parts[i];
                var path = this.get.points[part.pathIndex];
                this.get.drawCallback(this, path[part.pointIndex][0], path[part.pointIndex][1], (part.pointIndex + 1) / path.length, part.tag, nData);
                i++;
            }
        };

        partObject.prototype.advance = function (nFrames) {
            if (!this.get.on && this.get.parts.length == 0) return;
            var jump = Math.round(mNumberNatural(nFrames, 1));
            var i = 0, parts = this.get.parts, paths = this.get.points;
            while (i < parts.length) {
                var part = parts[i];
                part.pointIndex += jump;
                if (part.pointIndex >= paths[part.pathIndex].length)
                    parts.splice(i, 1);
                else i++;
            }
            if (this.get.on && parts.length < this.get.maxParts) {
                var path = mLib.randomInt(paths.length);
                parts.push({ pathIndex: path, pointIndex: 0, tag: mLib.randomItem(this.get.tagsArray) });
            }
        };

        return partObject;
    })();
    //base game object
    var objectBase = (function () {
        function objectBase(nX, nY, nWidth, nHeight) {
            var vars = { x: mNumber(nX, 0), y: mNumber(nY, 0), width: mNumber(nWidth, 0), height: mNumber(nHeight, 0) };
            this.get = vars;
        }

        objectBase.prototype.setX = function (nX) { this.get.x = mNumber(nX, 0); };
        objectBase.prototype.setY = function (nY) { this.get.y = mNumber(nY, 0); };
        objectBase.prototype.setWidth = function (nWidth) { this.get.width = mNumber(nWidth, 0); };
        objectBase.prototype.setHeight = function (nHeight) { this.get.height = mNumber(nHeight, 0); };
        objectBase.prototype.setPosition = function (nX, nY) {
            this.get.x = mNumber(nX, 0);
            this.get.y = mNumber(nY, 0);
        };
        objectBase.prototype.setSize = function (nWidth, nHeight) {
            this.get.width = mNumber(nWidth, 0);
            this.get.height = mNumber(nHeight, 0);
        };
        objectBase.prototype.setCoords = function (nX, nY, nWidth, nHeight) {
            this.get.x = mNumber(nX, 0);
            this.get.y = mNumber(nY, 0);
            this.get.width = mNumber(nWidth, 0);
            this.get.height = mNumber(nHeight, 0);
        };

        objectBase.prototype.getX = function () { return this.get.x; };
        objectBase.prototype.getY = function () { return this.get.y; };
        objectBase.prototype.getWidth = function () { return this.get.width; };
        objectBase.prototype.getHeight = function () { return this.get.height; };
        objectBase.prototype.getPosition = function () { return [this.get.x, this.get.y]; };
        objectBase.prototype.getSize = function () { return [this.get.width, this.get.height]; };
        objectBase.prototype.getCoords = function () { return [this.get.x, this.get.y, this.get.width, this.get.height]; };

        return objectBase;
    })();
    //Add extension classes
    mWin.canvasLib.anime = canvasAnime;
    mWin.canvasLib.loop = canvasLoop;
    mWin.canvasLib.animeSheet = canvasAnimeSheet;
    mWin.canvasLib.loopSheet = canvasLoopSheet;
    mWin.canvasLib.particles = partObject;
    mWin.canvasLib.gameObject = objectBase;
})();
