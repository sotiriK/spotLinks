// [:. {j:Abs}
// Supports all modern browsers, IE9 forward
// Where not supported will not interfere with page
// jAbsolute was created by Sotiri Karasoulos as an open source layout framework (MIT License)
// For latest version, examples, and more information please visit http://jabsolute.com/
// Contribute at http://github.com/sot-dev/jabsolute/
// :.]
(function () {
    //
    //abort if browser not compatible 
    var mWin = window;
    var mDoc = mWin.document;
    var mSvgNs = "http://www.w3.org/2000/svg";
    if ((function () {
        //IE9, Opera7, and Others 1.0
        if (!mWin.addEventListener) return true;
        var d = mDoc.createElement("div"); d.setAttribute("style", "font-size:1rem;");
        //IE9, Chrome4, Firefox 3.6, Safari 4.1, Opera 11.6
        if (d.style.fontSize !== "1rem") return true;
        //Chrome4, IE9, Firefox3, Safari 3.2, Opera 10.1
        if (!mDoc.createElementNS || !mDoc.createElementNS(mSvgNs, 'svg').createSVGRect) return true;
        return false;
    })()) return;
    //
    //object properties
    var prop = {
        landDefined: "jLandDefined", landLayer: "jLandLayer", landColumn: "jLandColumn", landRow: "jLandRow", landWidth: "jLandWidth", landHeight: "jLandHeight", landScrollY: "jLandScrollY", landScrollX: "jLandScrollX", landClass: "jLandClass",
        portDefined: "jPortDefined", portLayer: "jPortLayer", portColumn: "jPortColumn", portRow: "jPortRow", portWidth: "jPortWidth", portHeight: "jPortHeight", portScrollY: "jPortScrollY", portScrollX: "jPortScrollX", portClass: "jPortClass",
        renderColumn: "jRenderColumn", renderRow: "jRenderRow", renderWidth: "jRenderWidth", renderHeight: "jRenderHeight", savedColumn: "jSavedColumn", savedRow: "jSavedRow", hasFrame : "jHasFrame", 
        scrollColor: "jScrollColor", innerHolder: "jInnerHolder",
        scrollContextY: "jScrollContextY", scrollContextX: "jScrollContextX",
        scrollerY: "jScrollerY", scrollBarY: "jScrollBarY", topCircY: "jTopCircY", topRectY: "jTopRectY", barRectY: "jBarRectY", bakRectY: "jBakRectY", botCircY: "jBotCircY", botRectY: "jBotRectY",
        scrollerX: "jScrollerX", scrollBarX: "jScrollBarX", topCircX: "jTopCircX", topRectX: "jTopRectX", barRectX: "jBarRectX", bakRectX: "jBakRectX", botCircX: "jBotCircX", botRectX: "jBotRectX",
        activateScrollY: "jActivateScrollY", activateTouchY: "jActivateTouchY",
        activateScrollX: "jActivateScrollX", activateTouchX: "jActivateTouchX",
        contain: "jContain"
    };
    var val = {
        layoutSecureMs: (1000 / 2), resizeDelayMs: (1000 / 30), wheelDelayMs: (1000 / 15),
        windowColor: "#ffffff", scrollColor: "#000000",
        scrollAutoSeconds: 2, scrollFps: 15, scrollCells: 2.0, scrollMinCells: 4.125, scrollSmallMinCells: 2.125,
        scrollRounded: true, scrollOutlined: false, scrollWidth: 0.75, scrollOpacity: 0.25, scrollBackOpacity: 0.125,        
        scrollDisabled: "disabled", scrollAuto: "auto", scrollVisible: "visible", scrollHidden: "hidden",
        columnLeft: "left", columnRight: "right", columnCenter: "center", columnBefore: "before", columnAfter: "after", columnEqual: "equal", columnEnd: "end", columnBetween: "between", columnPercent: "percent",
        rowTop: "top", rowBottom: "bottom", rowCenter: "center", rowBefore: "before", rowAfter: "after", rowEqual: "equal", rowEnd: "end", rowBetween: "between", rowPercent: "percent",
        widthStretch: "stretch", widthEqual: "equal", widthPercent: "percent", widthSpan: "span", widthWindow: "window", widthEqHeight: "height",
        heightStretch: "stretch", heightEqual: "equal", heightPercent: "percent", heightSpan: "span", heightWindow: "window", heightFlow: "flow", heightEqWidth:"width",
        axisVertical: "y", axisHorizontal: "x"
    };
    //
    //private
    var mGrid = mWin.jAbsolute || {};
    var mOrgCellSizePx = 16, mRefWidthPx = 960, mMinCellSizePx = 14, mMaxCellSizePx = 18, mCurrCellSizePx = 0;
    var mMinLandColumns = 0, mMinLandRows = 0, mMinPortColumns = 0, mMinPortRows = 0;
    var mHasTouch = false, mResizeTimeout = null, mLastWheelMs = null;
    var mColumnsCount = 0, mRowsCount = 0, mWaiting = false, mLandscape = true, mReady = false;
    var mOnScroll = null, mOnResize = null, mOnBeforeResize = null, mOnReady = null;
    var mElements = [], mHolders = [], mLayers = {}, mElementById = {};
    var mScrollStateY = { holder: null, inner: null, bar: null, bak: null, interval: null, timeout: null, down: false, pos: 0 };
    var mScrollStateX = { holder: null, inner: null, bar: null, bak: null, interval: null, timeout: null, down: false, pos: 0 };
    var mDebugState = { on: false, rw: 0 };
    //
    //setup     
    mDoc.documentElement.setAttribute("style", "display:block; height:100%; width:100%; margin:0; padding:0; border:none; overflow:hidden; position:fixed; top:0; left:0;");
    mDoc.addEventListener("DOMContentLoaded", function () {
        mDoc.body.setAttribute("style", "display:block; height:100%; width:100%; margin:0; padding:0; border:none; overflow:hidden; position:absolute; top:0; left:0;");
        mDoc.body.style.backgroundColor = val.windowColor;
        mDoc.body.appendChild(jWindow);
        mReady = true;
        mGrid.update();
        if (mOnReady) mOnReady(mCurrCellSizePx, mColumnsCount, mRowsCount);
        mWin.setTimeout(function () {
            if (mOnBeforeResize) mOnBeforeResize(mCurrCellSizePx, mColumnsCount, mRowsCount);
            mGrid.update();
            if (mOnResize) mOnResize(mCurrCellSizePx, mColumnsCount, mRowsCount);
        }, val.layoutSecureMs); //Size corrections, initial onBeforeResize and onResize
    });
    //singletons
    var jWindow = (function () {
        var d = mDoc.createElement("div");
        d.setAttribute("style", "display:block; height:100%; width:100%; margin:0; padding:0; border:none; overflow:hidden; position:absolute; top:0; left:0;");
        d.style.backgroundColor = val.windowColor;
        return d;
    })();
    var jPage = (function () {
        var d = mDoc.createElement("div");
        d.setAttribute("style", "display:block; height:100%; width:100%; margin:0; padding:0; border:none; overflow:hidden; position:absolute; top:0; left:0;");
        return d;
    })();
    //factories
    var mCreateLayer = function () {
        var d = mDoc.createElement("div");
        d.setAttribute("style", "display:block; height:100%; width:100%; margin:0; padding:0; border:none; position:absolute; top:0; left:0;");
        return d;
    };
    var mCreateHolder = function () {
        var d = mDoc.createElement("div");
        d.setAttribute("style", "display:block; margin:0; padding:0; border:none; overflow:hidden; position:absolute;");
        return d;
    };
    var mCreateInner = function (nHolder) {
        var d = mDoc.createElement("div");
        d.setAttribute("style", "display:block; margin:0; padding:0; border:none; position:absolute; top:0; left:0;");
        return d;
    };
    var mCreateScrollY = function (nHolder) {
        var d = mDoc.createElement("div");
        d.setAttribute("style", "display:block; margin:0; padding:0; border:none; overflow:hidden; position:absolute; top:0; right:0; opacity:0; visibility:hidden; transition:opacity 250ms steps(25);");
        return d;
    };
    var mCreateScrollX = function (nHolder) {
        var d = mDoc.createElement("div");
        d.setAttribute("style", "display:block; margin:0; padding:0; border:none; overflow:hidden; position:absolute; bottom:0; left:0; opacity:0; visibility:hidden; transition:opacity 250ms steps(25);");
        return d;
    };
    //
    //private
    var mPixels = function (nCells, nFactor) {
        return Number((nCells * mCurrCellSizePx * (nFactor || 1)).toFixed(2));
    };
    var mCells = function (nPixels) {
        return nPixels / mCurrCellSizePx;
    };
    var mNumber = function (nInput, nCurrent) {
        nInput = String(nInput);
        return (!nInput || isNaN(nInput) ? nCurrent : Number(nInput));
    };
    var mNumberNatural = function (nInput, nCurrent) {
        nInput = String(nInput);
        return (!nInput || isNaN(nInput) || Number(nInput) <= 0 ? nCurrent : Number(nInput));
    };
    var mString = function (nInput, nCurrent, nRemove) {
        nInput = String(nInput);
        return (!nInput || nInput === "null" || nInput === "undefined" ? nCurrent : (nRemove ? nInput.replace(nRemove, "") : nInput));
    };    
    var mLayer = function (nLayerId, nCreate) {
        //returns existing or new layer with id == nId, or jPage if no id specified
        if (mString(nLayerId, null) == null || (!nCreate && !mLayers[nLayerId])) return jPage;
        var l = mLayers[nLayerId];
        if (!l) { l = mCreateLayer(); mLayers[nLayerId] = l; }
        return l;
    };
    var mHolderLayer = function(nHolder) {
        var id = nHolder[mLandscape?prop.landLayer:prop.portLayer];
        return mLayer(id);
    };
    var mHolder = function (nObject, nDefined, nCreate) {
        //nObject is element object, required
        if (!nObject) return null;
        var h = null, i = mElements.indexOf(nObject);
        //return existing OR create and return OR not found
        if (i != -1) { h = mHolders[i]; }
        else if (nCreate) { h = mCreateHolder(); mElements.push(nObject); mHolders.push(h); if (nObject.id) mElementById[nObject.id] = nObject; }
        else { return null; }
        //return even if not define
        if (!nDefined) return h;
        //return only if defined
        if (h[mLandscape ? prop.landDefined : prop.portDefined]) return h;
        return null;
    };
    var mElement = function (nElement, nDebugOverride) {
        //nElement is element object or id, returns element object
        var e = nElement;
        if (e && (typeof e === "string")) e = mElementById[e] || mDoc.getElementById(e);
        if (mDebugState.on && !e && !nDebugOverride) mErrorElement(nElement);
        return e;
    };
    var mHolderElement = function (nHolder) {
        var i = mHolders.indexOf(nHolder);
        if(i == -1) return null;
        return mElements[i];
    };
    var mHolderElementId = function (nHolder) {
        var e = mHolderElement(nHolder);
        if (e && e.id) return e.id;
        return null;
    };
    var mHolderElementIdOrElement = function (nHolder) {
        var e = mHolderElement(nHolder);
        if (e && e.id) return e.id;
        return e || null;
    };
    var mDetachChild = function (nChild) {
        if (nChild && nChild.parentNode) nChild.parentNode.removeChild(nChild);
    };
    //
    //scrolling
    var mScSysClearSelectXY = function () {
        try {
            mWin.getSelection().removeAllRanges();
        } catch (e) { }
    };
    var mScSysActionBarMoveXY = function (nEvent) {
        mScSysActionBarMoveY(nEvent); 
        mScSysActionBarMoveX(nEvent); 
    };
    var mScSysActionTouchMoveXY = function (nEvent) {
        mScSysActionTouchMoveY(nEvent);
        mScSysActionTouchMoveX(nEvent);
    };
    var mScSysIntervalClearXY = function () {
        mScSysIntervalClearY();
        mScSysIntervalClearX();
    };
    var mScSysActionWheelXY = function (nEvent) {
        mScSysActionWheelY(nEvent);
        mScSysActionWheelX(nEvent);
    };
    var mScSysActionKeyXY = function (nEvent) {
        var prev = false;
        var key = nEvent.which ? nEvent.which : nEvent.keyCode;
        switch (key) {
            case 37: prev = mScSysActionX(1); break; //left
            case 38: prev = mScSysActionY(1); break; //up            
            case 39: prev = mScSysActionX(-1); break; //right
            case 40: prev = mScSysActionY(-1); break; //down
        }
        if (prev) nEvent.preventDefault();
    };
    //
    //y-scrolling 
    var mScSysKillScrollY = function () {
        mScrollStateY.holder = null; mScrollStateY.inner = null; mScrollStateY.bar = null; mScrollStateY.bak = null;
        if (mScrollStateY.interval != null) { clearInterval(mScrollStateY.interval); mScrollStateY.interval = null; }
    };
    var mScSysCanScrollY = function (nHolder, nInner) {
        return mScSysSpaceY(nHolder, nInner) > 0;
    };
    var mScSysHasAxisY = function (nHolder, nContext) {
        //although hidden can use the wheel or touch, it doesn't render and will return false unless specified in nContext
        var pY = mLandscape ? prop.landScrollY : prop.portScrollY;
        if(!nContext) return nHolder[pY] === val.scrollAuto || nHolder[pY] === val.scrollVisible;
        return nHolder[pY] == nContext;
    };
    var mScSysShowY = function (nObject) {
        if (!nObject) return;
        var sY = nObject[prop.scrollerY];
        if (sY) { sY.style.visibility = "visible"; sY.style.opacity = "1"; } 
    };
    var mScSysHideY = function (nObject) {
        if (!nObject) return;
        var sY = nObject[prop.scrollerY];
        if (sY) sY.style.opacity = "0"; 
    };
    var mScSysRelinquishY = function () {
        if (mScrollStateY.holder == jWindow) return;
        var ih = jWindow[prop.innerHolder], br = jWindow[prop.barRectY], bk = jWindow[prop.bakRectY];
        mScSysActivateY(jWindow, ih, br, bk);
    };
    var mScSysActivateY = function (nHolder, nInner, nBar, nBak) {
        if (!(nHolder && nInner && nBar && nBak)) return;
        //hide old if auto
        if (mScrollStateY.holder && nHolder != mScrollStateY.holder && mScrollStateY.holder[prop.scrollContextY] === val.scrollAuto) mScSysTimeoutClearY();
        //visibility         
        if (nHolder[prop.scrollContextY] === val.scrollAuto) { if (mScSysCanScrollY(nHolder, nInner)) mScSysTimeoutY(); else return; }
        //activate new
        mScrollStateY.holder = nHolder; mScrollStateY.inner = nInner; mScrollStateY.bar = nBar; mScrollStateY.bak = nBak;
        if (mScrollStateY.interval != null) { clearInterval(mScrollStateY.interval); mScrollStateY.interval = null; }
        //kill x if not on same holder
        if (mScrollStateX.holder != mScrollStateY.holder) mScSysKillScrollX();
    };
    var mScSysUserActionY = function () {
        if (mScrollStateY.holder == null)
            mScSysActivateY(jWindow, jWindow[prop.innerHolder], jWindow[prop.barRectY], jWindow[prop.bakRectY]);
        if (mScrollStateY.holder == null) return;
        if (mScrollStateY.holder[prop.scrollContextY] === val.scrollAuto && mScSysCanScrollY(mScrollStateY.holder, mScrollStateY.inner))
            mScSysTimeoutY(mScrollStateY.holder);
    };
    var mScSysTimeoutY = function (nHolder) {
        mScSysTimeoutClearY();
        mScSysShowY(nHolder); 
        mScrollStateY.timeout = setTimeout(function () { mScSysHideY(nHolder); mScrollStateY.timeout = null; }, 1000 * val.scrollAutoSeconds);
    };
    var mScSysTimeoutClearY = function () {
        mScSysHideY(mScrollStateY.holder);
        if (mScrollStateY.timeout) { clearTimeout(mScrollStateY.timeout); mScrollStateY.timeout = null; }
    };
    var mScSysIntervalClearY = function () {
        mScrollStateY.down = false;
        if (mScrollStateY.interval != null) { clearInterval(mScrollStateY.interval); mScrollStateY.interval = null; }
    };
    //y-scroll-positioning
    var mScSysBoxY = function (nBox) {
        return mNumber(mString(nBox.style.top, "0", "px"), 0);
    };
    var mScSysPlaceY = function (nScroller, nBox, nMove) {
        var preTop = mScSysBoxY(nBox);
        var min = -mScSysSpaceY(nScroller, nBox);
        var top = preTop + nMove; if (top > 0) top = 0; if (top < min) top = min;
        nBox.style.top = top + "px";
        return top;
    };
    var mScSysSpaceY = function (nScroller, nBox) {
        var max = mNumber(nBox == jPage ? mString(nBox.style.height, "0", "px") : nBox.clientHeight, 0) - mNumber(mString(nScroller.style.height, "0", "px"), 0);
        return max > 0 ? max : 0;
    };
    //y-scroll-axis
    var mScSysActionWheelY = function (nEvent) {
        if (mScrollStateY.holder == null) mScSysUserActionY();
        if (mScrollStateY.holder == null) return;
        if (!mScSysCanScrollY(mScrollStateY.holder, mScrollStateY.inner)) return; //y only, x may need wheel (mLastWheelMs)
        nEvent.preventDefault(); //prevent browser scroll
        //equalize scroll wheel data from various systems
        var now = new Date();
        var mls = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        if (mLastWheelMs && mls - mLastWheelMs < val.wheelDelayMs) return;
        mLastWheelMs = mls;
        //move
        var dir = (nEvent.detail < 0 || nEvent.wheelDelta > 0) ? 1 : -1;
        mScSysActionY(dir);
    };
    var mScSysActionBarMoveY = function (nEvent) {
        if (mHasTouch) return;
        if (!mScrollStateY.down) { mScSysUserActionY(); return; } //mousemove, oddly happens on iOS touch (click an anchor with javascript: for href)...
        nEvent.preventDefault(); //prevent drag
        mScSysActionBarY(nEvent);
    };
    var mScSysActionBarY = function (nEvent) {
        if (mScrollStateY.holder == null) return;        
        var bakH = Number(mScrollStateY.bak.getAttribute("height"));
        var barY = Number(mScrollStateY.bar.getAttribute("y"));
        var bakY = Number(mScrollStateY.bak.getAttribute("y"));
        var boxY = mScrollStateY.inner == jPage ? 0 : mScSysBoxY(jPage);
        var holderY = mPixels(mNumber(mScrollStateY.holder[prop.renderRow], 0)) + boxY;
        //scroll amount
        var preTop = mScSysBoxY(mScrollStateY.inner);
        var p = nEvent.pageY - (holderY + barY);
        var b = bakH - (barY - bakY) * 2;
        var m = (p / b) * mScSysSpaceY(mScrollStateY.holder, mScrollStateY.inner);
        mScSysActionY(1, -m - preTop); //-m = new top
        mScrollStateY.down = true;
    };
    var mScSysActionTouchY = function (nEvent) {
        if (mScrollStateY.holder == null) return;
        mScrollStateY.down = true;
        mScrollStateY.pos = nEvent.targetTouches[0].clientY; 
    };
    var mScSysActionTouchMoveY = function (nEvent) {
        if (!mScrollStateY.down) { mScSysUserActionY(); return; }
        var n = nEvent.targetTouches[0].clientY;
        var m = n - mScrollStateY.pos;
        mScrollStateY.pos = n;
        mScSysActionY(1, m);
    };
    var mScSysActionMinusY = function () {
        if (mScrollStateY.holder == null) return;
        mScSysActionY(-1);
        mScSysIntervalClearY();
        mScrollStateY.interval = setInterval(function () { mScSysActionY(-1); }, 1000 / val.scrollFps);
    };
    var mScSysActionPlusY = function () {
        if (mScrollStateY.holder == null) return;
        mScSysActionY(1);
        mScSysIntervalClearY();
        mScrollStateY.interval = setInterval(function () { mScSysActionY(1); }, 1000 / val.scrollFps);
    };    
    var mScSysActionY = function (nDir, nPixels, nLoading) {        
        if (mScrollStateY.holder == null) return false;
        var bakH = Number(mScrollStateY.bak.getAttribute("height"));
        var barY = Number(mScrollStateY.bar.getAttribute("y"));
        var bakY = Number(mScrollStateY.bak.getAttribute("y"));
        //set jPage top
        var preTop = mScSysBoxY(mScrollStateY.inner);
        var move = mNumber(nPixels, mCurrCellSizePx * val.scrollCells) * nDir;
        var top = mScSysPlaceY(mScrollStateY.holder, mScrollStateY.inner, move);
        //set bar height
        var min = -mScSysSpaceY(mScrollStateY.holder, mScrollStateY.inner);
        var fullH = bakH - (barY - bakY) * 2;
        var newH = min - top == 0 ? fullH : ((top / min) * fullH);
        var sW = mCurrCellSizePx * val.scrollWidth / 2; //min bar height
        mScrollStateY.bar.setAttribute("height", (newH > sW ? newH : sW));
        //disable directions
        if (mScrollStateY.holder[prop.botCircY])
            mScrollStateY.holder[prop.botCircY].setAttribute("fill-opacity", newH == fullH ? val.scrollBackOpacity : val.scrollOpacity);
        if (mScrollStateY.holder[prop.topCircY])
            mScrollStateY.holder[prop.topCircY].setAttribute("fill-opacity", top == 0 ? val.scrollBackOpacity : val.scrollOpacity);
        //show bar, fire event        
        if (!nLoading) mScSysUserActionY(); else return false;
        if (mScrollStateY.down) mScSysClearSelectXY();
        if (mOnScroll) mOnScroll(mHolderElementIdOrElement(mScrollStateY.holder), val.axisVertical, newH / fullH, (preTop > top ? -1 : 1));
        return true;
    };
    var mScSysInsertY = function (nHolder, innerHolder, nContext, nH) {
        var sW = mPixels(val.scrollWidth), sC = mString(nHolder[prop.scrollColor], val.scrollColor), sv = mSvgNs;
        var sW2 = mPixels(val.scrollWidth, 0.5), sW3 = mPixels(val.scrollWidth, 0.3333), sW4 = mPixels(val.scrollWidth, 0.25), sW10 = mPixels(val.scrollWidth, 0.1);
        if (mScSysHasAxisX(nHolder) && (mScSysCanScrollX(nHolder, innerHolder) || mScSysHasAxisX(nHolder, val.scrollVisible))) nH -= sW + sW4; //only Y, shorten if x also in use
        //elements
        var divScroller = nHolder[prop.scrollerY] || mCreateScrollY(nHolder);
        var scrollbar = nHolder[prop.scrollBarY] || mDoc.createElementNS(sv, "svg");
        var topCirc = nHolder[prop.topCircY] || mDoc.createElementNS(sv, (val.scrollRounded ? "circle" : "rect"));
        var topRect = nHolder[prop.topRectY] || mDoc.createElementNS(sv, "rect");
        var barRect = nHolder[prop.barRectY] || mDoc.createElementNS(sv, "rect");
        var bakRect = nHolder[prop.bakRectY] || mDoc.createElementNS(sv, "rect");
        var botCirc = nHolder[prop.botCircY] || mDoc.createElementNS(sv, (val.scrollRounded ? "circle" : "rect"));
        var botRect = nHolder[prop.botRectY] || mDoc.createElementNS(sv, "rect");
        //save    
        nHolder[prop.innerHolder] = innerHolder;
        nHolder[prop.scrollerY] = divScroller;
        nHolder[prop.scrollBarY] = scrollbar;
        nHolder[prop.topCircY] = topCirc;
        nHolder[prop.topRectY] = topRect;
        nHolder[prop.barRectY] = barRect;
        nHolder[prop.bakRectY] = bakRect;
        nHolder[prop.botCircY] = botCirc;
        nHolder[prop.botRectY] = botRect;
        nHolder[prop.scrollContextY] = nContext;
        //svg scrollbar        
        divScroller.style.width = sW + "px";
        divScroller.style.height = nH + "px";
        scrollbar.setAttribute("width", sW);
        scrollbar.setAttribute("height", nH);
        scrollbar.style.position = "absolute";
        scrollbar.style.left = "0";
        //up visual
        if (val.scrollRounded) {
            topCirc.setAttribute("cx", sW2);
            topCirc.setAttribute("cy", sW2);
            topCirc.setAttribute("r", sW4);
        } else {
            topCirc.setAttribute("width", sW2);
            topCirc.setAttribute("height", sW2);
            topCirc.setAttribute("x", sW4);
            topCirc.setAttribute("y", sW4);
        }
        topCirc.setAttribute("fill", sC);
        topCirc.setAttribute("fill-opacity", val.scrollOpacity);        
        //up button
        topRect.setAttribute("width", sW);
        topRect.setAttribute("height", sW);
        topRect.setAttribute("x", "0");
        topRect.setAttribute("y", "0");
        topRect.setAttribute("fill", sC);
        topRect.setAttribute("fill-opacity", val.scrollBackOpacity);
        //bar visual        
        barRect.setAttribute("width", sW2);
        barRect.setAttribute("height", sW2);
        barRect.setAttribute("x", sW4);
        barRect.setAttribute("y", sW + sW2);
        barRect.setAttribute("fill", sC);
        barRect.setAttribute("fill-opacity", val.scrollOpacity);        
        //bar button        
        bakRect.setAttribute("width", sW);
        bakRect.setAttribute("height", nH - (sW + sW4) * 2);
        bakRect.setAttribute("x", "0");
        bakRect.setAttribute("y", sW + sW4);
        bakRect.setAttribute("fill", sC);
        bakRect.setAttribute("fill-opacity", val.scrollBackOpacity);
        //down visual        
        if (val.scrollRounded) {
            botCirc.setAttribute("cx", sW2);
            botCirc.setAttribute("cy", nH - sW2);
            botCirc.setAttribute("r", sW4);
        } else {            
            botCirc.setAttribute("height", sW2);
            botCirc.setAttribute("width", sW2);
            botCirc.setAttribute("x", sW4);
            botCirc.setAttribute("y", nH - sW + sW4);
        }
        botCirc.setAttribute("fill", sC);
        botCirc.setAttribute("fill-opacity", val.scrollOpacity);
        //down button        
        botRect.setAttribute("width", sW);
        botRect.setAttribute("height", sW);
        botRect.setAttribute("x", "0");
        botRect.setAttribute("y", nH - sW);
        botRect.setAttribute("fill", sC);
        botRect.setAttribute("fill-opacity", val.scrollBackOpacity);
        if (val.scrollRounded) {
            topRect.setAttribute("rx", sW4);
            topRect.setAttribute("ry", sW4);
            barRect.setAttribute("rx", sW4);
            barRect.setAttribute("ry", sW4);
            bakRect.setAttribute("rx", sW3);
            bakRect.setAttribute("ry", sW3);
            botRect.setAttribute("rx", sW4);
            botRect.setAttribute("ry", nH - sW4);
        }
        if (val.scrollOutlined) {
            topRect.setAttribute("stroke", sC);
            topRect.setAttribute("stroke-opacity", val.scrollBackOpacity);
            topRect.setAttribute("stroke-width", sW10);
            bakRect.setAttribute("stroke", sC);
            bakRect.setAttribute("stroke-opacity", val.scrollBackOpacity);
            bakRect.setAttribute("stroke-width", sW10);
            botRect.setAttribute("stroke", sC);
            botRect.setAttribute("stroke-opacity", val.scrollBackOpacity);
            botRect.setAttribute("stroke-width", sW10);
        }
        //place 
        scrollbar.appendChild(topCirc);
        scrollbar.appendChild(topRect);
        if (nH >= sW * val.scrollMinCells) { scrollbar.appendChild(barRect); scrollbar.appendChild(bakRect); }
        else { mDetachChild(barRect); mDetachChild(bakRect); }
        scrollbar.appendChild(botCirc);
        scrollbar.appendChild(botRect);
        if (nH >= sW * val.scrollSmallMinCells) { divScroller.appendChild(scrollbar); }
        else { mDetachChild(scrollbar); }
        nHolder.appendChild(divScroller);
        //initial        
        mScrollStateY.holder = nHolder;
        mScrollStateY.inner = innerHolder;
        mScrollStateY.bar = barRect;
        mScrollStateY.bak = bakRect;
        mScSysActionY(1, 0, true);
        mScrollStateY.holder = null;
        mScrollStateY.down = false;
        //visibility
        if (nContext === val.scrollVisible) mScSysShowY(nHolder); else mScSysHideY(nHolder);
        //state
        if (!nHolder[prop.activateScrollY]) nHolder[prop.activateScrollY] = function () { mScSysActivateY(nHolder, innerHolder, barRect, bakRect); };
        nHolder.addEventListener("mouseenter", nHolder[prop.activateScrollY]);
        nHolder.addEventListener("mouseleave", mScSysRelinquishY);
        //bar
        bakRect.addEventListener("mousedown", mScSysActionBarY);
        //buttons
        topRect.addEventListener("mousedown", mScSysActionPlusY);
        botRect.addEventListener("mousedown", mScSysActionMinusY);
        //touch for swipe            
        if (!bakRect[prop.activateTouchY]) bakRect[prop.activateTouchY] = function (e) { e.preventDefault(); mScSysActivateY(nHolder, innerHolder, barRect, bakRect); mScSysActionBarY({ pageY: e.targetTouches[0].clientY }); };
        bakRect.addEventListener("touchstart", bakRect[prop.activateTouchY]);
        if (!nHolder[prop.activateTouchY]) nHolder[prop.activateTouchY] = function (e) { mScSysActivateY(nHolder, innerHolder, barRect, bakRect); mScSysActionTouchY(e); };
        nHolder.addEventListener("touchstart", nHolder[prop.activateTouchY], true);
        //touch for buttons //prevent default click-like behaviour
        if (!topRect[prop.activateTouchY]) topRect[prop.activateTouchY] = function (e) { e.preventDefault(); mScSysActivateY(nHolder, innerHolder, barRect, bakRect); mScSysActionPlusY(); };
        topRect.addEventListener("touchstart", topRect[prop.activateTouchY]);
        if (!botRect[prop.activateTouchY]) botRect[prop.activateTouchY] = function (e) { e.preventDefault(); mScSysActivateY(nHolder, innerHolder, barRect, bakRect); mScSysActionMinusY(); };
        botRect.addEventListener("touchstart", botRect[prop.activateTouchY]);
    };
    var mScSysRemoveY = function (nHolder) {
        //reset
        if (!nHolder[prop.scrollerX]) nHolder[prop.innerHolder] = null; //If not needed by scrollerX
        //remove
        nHolder.removeEventListener("mouseleave", mScSysRelinquishY);
        if (nHolder[prop.activateScrollY]) nHolder.removeEventListener("mouseenter", nHolder[prop.activateScrollY]); 
        if (nHolder[prop.activateTouchY]) nHolder.removeEventListener("touchstart", nHolder[prop.activateTouchY], true); 
        //clear
        nHolder[prop.scrollerY] = null;
        nHolder[prop.scrollBarY] = null;
        nHolder[prop.topCircY] = null;
        nHolder[prop.topRectY] = null;
        nHolder[prop.barRectY] = null;
        nHolder[prop.bakRectY] = null;
        nHolder[prop.botCircY] = null;
        nHolder[prop.botRectY] = null;
        nHolder[prop.activateScrollY] = null;
        nHolder[prop.activateTouchY] = null;
        //off
        mScrollStateY.down = false;
        mScrollStateY.holder = null;
    };
    var mScSysIncludeY = function (nHolder, nContext) {
        var element = mHolderElement(nHolder); if (!element) return;
        var innerHolder = nHolder[prop.innerHolder] || mCreateInner(nHolder);        
        innerHolder.appendChild(element);
        nHolder.appendChild(innerHolder);
        mScSysInsertY(nHolder, innerHolder, nContext, mString(nHolder.style.height, 0, "px"));
    };    
    var mScSysPageIncludeY = function (nContext) {
        mScSysInsertY(jWindow, jPage, nContext, mString(jWindow.style.height, 0, "px"));
    };
    //
    //x-scrolling  
    var mScSysKillScrollX = function () {
        mScrollStateX.holder = null; mScrollStateX.inner = null; mScrollStateX.bar = null; mScrollStateX.bak = null;
        if (mScrollStateX.interval != null) { clearInterval(mScrollStateX.interval); mScrollStateX.interval = null; }
    };
    var mScSysCanScrollX = function (nHolder, nInner) {
        return mScSysSpaceX(nHolder, nInner) > 0;
    };
    var mScSysHasAxisX = function (nHolder, nContext) {
        //although hidden can use the wheel or touch, it doesn't render and will return false unless specified in nContext
        var pX = mLandscape ? prop.landScrollX : prop.portScrollX;
        if(!nContext) return nHolder[pX] === val.scrollAuto || nHolder[pX] === val.scrollVisible;
        return nHolder[pX] == nContext;
    };
    var mScSysShowX = function (nObject) {
        if (!nObject) return;
        var sX = nObject[prop.scrollerX];
        if (sX) { sX.style.visibility = "visible"; sX.style.opacity = "1"; }
    };
    var mScSysHideX = function (nObject) {
        if (!nObject) return;
        var sX = nObject[prop.scrollerX];
        if (sX) sX.style.opacity = "0";
    };
    var mScSysRelinquishX = function () {
        if (mScrollStateX.holder == jWindow) return;
        var ih = jWindow[prop.innerHolder], br = jWindow[prop.barRectX], bk = jWindow[prop.bakRectX];
        mScSysActivateX(jWindow, ih, br, bk);
    };
    var mScSysActivateX = function (nHolder, nInner, nBar, nBak) {        
        if (!(nHolder && nInner && nBar && nBak)) return;
        //hide old if auto
        if (mScrollStateX.holder && nHolder != mScrollStateX.holder && mScrollStateX.holder[prop.scrollContextX] === val.scrollAuto) mScSysTimeoutClearX();
        //visibility 
        if (nHolder[prop.scrollContextX] === val.scrollAuto) { if (mScSysCanScrollX(nHolder, nInner)) mScSysTimeoutX(); else return; }
        //activate new
        mScrollStateX.holder = nHolder; mScrollStateX.inner = nInner; mScrollStateX.bar = nBar; mScrollStateX.bak = nBak;
        if (mScrollStateX.interval != null) { clearInterval(mScrollStateX.interval); mScrollStateX.interval = null; }
        //kill y if not on same holder
        if (mScrollStateY.holder != mScrollStateX.holder) mScSysKillScrollY();
    };
    var mScSysUserActionX = function () {
        if (mScrollStateX.holder == null)
            mScSysActivateX(jWindow, jWindow[prop.innerHolder], jWindow[prop.barRectX], jWindow[prop.bakRectX]);
        if (mScrollStateX.holder == null) return;
        if (mScrollStateX.holder[prop.scrollContextX] === val.scrollAuto && mScSysCanScrollX(mScrollStateX.holder, mScrollStateX.inner))
            mScSysTimeoutX(mScrollStateX.holder);
    };
    var mScSysTimeoutX = function (nHolder) {
        mScSysTimeoutClearX();
        mScSysShowX(nHolder);
        mScrollStateX.timeout = setTimeout(function () { mScSysHideX(nHolder); mScrollStateX.timeout = null; }, 1000 * val.scrollAutoSeconds);
    };
    var mScSysTimeoutClearX = function () {
        mScSysHideX(mScrollStateX.holder);
        if (mScrollStateX.timeout) { clearTimeout(mScrollStateX.timeout); mScrollStateX.timeout = null; }
    };
    var mScSysIntervalClearX = function () {
        mScrollStateX.down = false;
        if (mScrollStateX.interval != null) { clearInterval(mScrollStateX.interval); mScrollStateX.interval = null; }
    };
    //x-scroll-positioning
    var mScSysBoxX = function (nBox) {
        return mNumber(mString(nBox.style.left, "0", "px"), 0);
    };
    var mScSysPlaceX = function (nScroller, nBox, nMove) {
        var preLeft = mScSysBoxX(nBox);
        var min = -mScSysSpaceX(nScroller, nBox);
        var left = preLeft + nMove; if (left > 0) left = 0; if (left < min) left = min;
        nBox.style.left = left + "px";
        return left;
    };
    var mScSysSpaceX = function (nScroller, nBox) {
        var max = mNumber(nBox == jPage ? mString(nBox.style.width, "0", "px") : nBox.clientWidth, 0) - mNumber(mString(nScroller.style.width, "0", "px"), 0);
        return max > 0 ? max : 0;
    };
    //x-scroll-axis    
    var mScSysActionWheelX = function (nEvent) {
        if (mScrollStateX.holder == null) mScSysUserActionX();
        if (mScrollStateX.holder == null) return;
        if ((mScSysHasAxisY(mScrollStateX.holder) || mScSysHasAxisY(mScrollStateX.holder, val.scrollHidden))
            && (mScSysCanScrollY(mScrollStateX.holder, mScrollStateX.inner))) return; //only X, suppress wheel if y using it
        nEvent.preventDefault(); //prevent page scroll
        //equalize scroll wheel data from various systems
        var now = new Date();
        var mls = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        if (mLastWheelMs && mls - mLastWheelMs < val.wheelDelayMs) return;
        mLastWheelMs = mls;
        //move
        var dir = (nEvent.detail < 0 || nEvent.wheelDelta > 0) ? 1 : -1;
        mScSysActionX(dir);
    };
    var mScSysActionBarMoveX = function (nEvent) { 
        if (mHasTouch) return;
        if (!mScrollStateX.down) { mScSysUserActionX(); return; } //mousemove, oddly happens on iOS touch (click an anchor with javascript: for href)...
        nEvent.preventDefault(); //prevent drag
        mScSysActionBarX(nEvent);
    };
    var mScSysActionBarX = function (nEvent) { 
        if (mScrollStateX.holder == null) return;
        var bakW = Number(mScrollStateX.bak.getAttribute("width"));
        var barX = Number(mScrollStateX.bar.getAttribute("x"));
        var bakX = Number(mScrollStateX.bak.getAttribute("x"));
        var boxX = mScrollStateX.inner == jPage ? 0 : mScSysBoxX(jPage);
        var holderX = mPixels(mNumber(mScrollStateX.holder[prop.renderColumn], 0)) + boxX;
        //scroll amount
        var preLeft = mScSysBoxX(mScrollStateX.inner);
        var p = nEvent.pageX - (holderX + barX);
        var b = bakW - (barX - bakX) * 2;
        var m = (p / b) * mScSysSpaceX(mScrollStateX.holder, mScrollStateX.inner);
        mScSysActionX(1, -m - preLeft); //-m = new left
        mScrollStateX.down = true;
    };
    var mScSysActionTouchX = function (nEvent) {
        if (mScrollStateX.holder == null) return;
        mScrollStateX.down = true;
        mScrollStateX.pos = nEvent.targetTouches[0].clientX;
    };
    var mScSysActionTouchMoveX = function (nEvent) {
        if (!mScrollStateX.down) { mScSysUserActionX(); return; }
        var n = nEvent.targetTouches[0].clientX;
        var m = n - mScrollStateX.pos;
        mScrollStateX.pos = n;
        mScSysActionX(1, m);
    };
    var mScSysActionMinusX = function () {
        if (mScrollStateX.holder == null) return;
        mScSysActionX(-1);
        mScSysIntervalClearX();
        mScrollStateX.interval = setInterval(function () { mScSysActionX(-1); }, 1000 / val.scrollFps);
    };
    var mScSysActionPlusX = function () {
        if (mScrollStateX.holder == null) return;
        mScSysActionX(1);
        mScSysIntervalClearX();
        mScrollStateX.interval = setInterval(function () { mScSysActionX(1); }, 1000 / val.scrollFps);
    };
    var mScSysActionX = function (nDir, nPixels, nLoading) {
        if (mScrollStateX.holder == null) return false;
        var bakW = Number(mScrollStateX.bak.getAttribute("width"));
        var barX = Number(mScrollStateX.bar.getAttribute("x"));
        var bakX = Number(mScrollStateX.bak.getAttribute("x"));
        //set jPage left
        var preLeft = mScSysBoxX(mScrollStateX.inner);
        var move = mNumber(nPixels, mCurrCellSizePx * val.scrollCells) * nDir;
        var left = mScSysPlaceX(mScrollStateX.holder, mScrollStateX.inner, move);
        //set bar width
        var min = -mScSysSpaceX(mScrollStateX.holder, mScrollStateX.inner);
        var fullW = bakW - (barX - bakX) * 2;
        var newW = min - left == 0 ? fullW : ((left / min) * fullW);
        var sW = mCurrCellSizePx * val.scrollWidth / 2; //min bar width
        mScrollStateX.bar.setAttribute("width", (newW > sW ? newW : sW));
        //disable directions
        if (mScrollStateX.holder[prop.botCircX])
            mScrollStateX.holder[prop.botCircX].setAttribute("fill-opacity", newW == fullW ? val.scrollBackOpacity : val.scrollOpacity);
        if (mScrollStateX.holder[prop.topCircX])
            mScrollStateX.holder[prop.topCircX].setAttribute("fill-opacity", left == 0 ? val.scrollBackOpacity : val.scrollOpacity);
        //show bar, fire event        
        if (!nLoading) mScSysUserActionX(); else return false;
        if (mScrollStateX.down) mScSysClearSelectXY();
        if (mOnScroll) mOnScroll(mHolderElementIdOrElement(mScrollStateX.holder), val.axisHorizontal, newW / fullW, (preLeft > left ? -1 : 1));
        return true;
    };
    var mScSysInsertX = function (nHolder, innerHolder, nContext, nW) { 
        var sW = mPixels(val.scrollWidth), sC = mString(nHolder[prop.scrollColor], val.scrollColor), sv = mSvgNs;
        var sW2 = mPixels(val.scrollWidth, 0.5), sW3 = mPixels(val.scrollWidth, 0.3333), sW4 = mPixels(val.scrollWidth, 0.25), sW10 = mPixels(val.scrollWidth, 0.1);
        //elements
        var divScroller = nHolder[prop.scrollerX] || mCreateScrollX(nHolder);
        var scrollbar = nHolder[prop.scrollBarX] || mDoc.createElementNS(sv, "svg");
        var topCirc = nHolder[prop.topCircX] || mDoc.createElementNS(sv, (val.scrollRounded ? "circle" : "rect"));
        var topRect = nHolder[prop.topRectX] || mDoc.createElementNS(sv, "rect");
        var barRect = nHolder[prop.barRectX] || mDoc.createElementNS(sv, "rect");
        var bakRect = nHolder[prop.bakRectX] || mDoc.createElementNS(sv, "rect");
        var botCirc = nHolder[prop.botCircX] || mDoc.createElementNS(sv, (val.scrollRounded ? "circle" : "rect"));
        var botRect = nHolder[prop.botRectX] || mDoc.createElementNS(sv, "rect");
        //save    
        nHolder[prop.innerHolder] = innerHolder;
        nHolder[prop.scrollerX] = divScroller;
        nHolder[prop.scrollBarX] = scrollbar;
        nHolder[prop.topCircX] = topCirc;
        nHolder[prop.topRectX] = topRect;
        nHolder[prop.barRectX] = barRect;
        nHolder[prop.bakRectX] = bakRect;
        nHolder[prop.botCircX] = botCirc;
        nHolder[prop.botRectX] = botRect;
        nHolder[prop.scrollContextX] = nContext;
        //svg scrollbar        
        divScroller.style.height = sW + "px";
        divScroller.style.width = nW + "px";
        scrollbar.setAttribute("height", sW);
        scrollbar.setAttribute("width", nW);
        scrollbar.style.position = "absolute";
        scrollbar.style.top = "0";
        //up visual
        if (val.scrollRounded) {
            topCirc.setAttribute("cy", sW2);
            topCirc.setAttribute("cx", sW2);
            topCirc.setAttribute("r", sW4);
        } else {
            topCirc.setAttribute("height", sW2);
            topCirc.setAttribute("width", sW2);
            topCirc.setAttribute("y", sW4);
            topCirc.setAttribute("x", sW4);
        }
        topCirc.setAttribute("fill", sC);
        topCirc.setAttribute("fill-opacity", val.scrollOpacity);
        //up button
        topRect.setAttribute("height", sW);
        topRect.setAttribute("width", sW);
        topRect.setAttribute("y", "0");
        topRect.setAttribute("x", "0");
        topRect.setAttribute("fill", sC);
        topRect.setAttribute("fill-opacity", val.scrollBackOpacity);
        //bar visual        
        barRect.setAttribute("height", sW2);
        barRect.setAttribute("width", sW2);
        barRect.setAttribute("y", sW4);
        barRect.setAttribute("x", sW + sW2);
        barRect.setAttribute("fill", sC);
        barRect.setAttribute("fill-opacity", val.scrollOpacity);
        //bar button
        bakRect.setAttribute("height", sW);
        bakRect.setAttribute("width", nW - (sW + sW4) * 2);        
        bakRect.setAttribute("y", "0");
        bakRect.setAttribute("x", sW + sW4);
        bakRect.setAttribute("fill", sC);
        bakRect.setAttribute("fill-opacity", val.scrollBackOpacity);
        //down visual        
        if (val.scrollRounded) {
            botCirc.setAttribute("cy", sW2);
            botCirc.setAttribute("cx", nW - sW2);
            botCirc.setAttribute("r", sW4);
        } else {
            botCirc.setAttribute("height", sW2);
            botCirc.setAttribute("width", sW2);
            botCirc.setAttribute("y", sW4);
            botCirc.setAttribute("x", nW - sW + sW4);
        }
        botCirc.setAttribute("fill", sC);
        botCirc.setAttribute("fill-opacity", val.scrollOpacity);
        //down button        
        botRect.setAttribute("height", sW);
        botRect.setAttribute("width", sW);
        botRect.setAttribute("y", "0");
        botRect.setAttribute("x", nW - sW);
        botRect.setAttribute("fill", sC);
        botRect.setAttribute("fill-opacity", val.scrollBackOpacity);
        if (val.scrollRounded) {
            topRect.setAttribute("ry", sW4);
            topRect.setAttribute("rx", sW4);
            barRect.setAttribute("ry", sW4);
            barRect.setAttribute("rx", sW4);
            bakRect.setAttribute("ry", sW3);
            bakRect.setAttribute("rx", sW3);
            botRect.setAttribute("ry", sW4);
            botRect.setAttribute("rx", nW - sW4);
        }
        if (val.scrollOutlined) {
            topRect.setAttribute("stroke", sC);
            topRect.setAttribute("stroke-opacity", val.scrollBackOpacity);
            topRect.setAttribute("stroke-width", sW10);
            bakRect.setAttribute("stroke", sC);
            bakRect.setAttribute("stroke-opacity", val.scrollBackOpacity);
            bakRect.setAttribute("stroke-width", sW10);
            botRect.setAttribute("stroke", sC);
            botRect.setAttribute("stroke-opacity", val.scrollBackOpacity);
            botRect.setAttribute("stroke-width", sW10);
        }
        //place 
        scrollbar.appendChild(topCirc);
        scrollbar.appendChild(topRect);
        if (nW >= sW * val.scrollMinCells) { scrollbar.appendChild(barRect); scrollbar.appendChild(bakRect); }
        else { mDetachChild(barRect); mDetachChild(bakRect); }
        scrollbar.appendChild(botCirc);
        scrollbar.appendChild(botRect);
        if (nW >= sW * val.scrollSmallMinCells) { divScroller.appendChild(scrollbar); }
        else { mDetachChild(scrollbar); }
        nHolder.appendChild(divScroller);
        //initial        
        mScrollStateX.holder = nHolder;
        mScrollStateX.inner = innerHolder;
        mScrollStateX.bar = barRect;
        mScrollStateX.bak = bakRect;
        mScSysActionX(1, 0, true);
        mScrollStateX.holder = null;
        mScrollStateX.down = false;
        //visibility
        if (nContext === val.scrollVisible) mScSysShowX(nHolder); else mScSysHideX(nHolder);
        //state
        if (!nHolder[prop.activateScrollX]) nHolder[prop.activateScrollX] = function () { mScSysActivateX(nHolder, innerHolder, barRect, bakRect); };
        nHolder.addEventListener("mouseenter", nHolder[prop.activateScrollX]);
        nHolder.addEventListener("mouseleave", mScSysRelinquishX);
        //bar
        bakRect.addEventListener("mousedown", mScSysActionBarX);
        //buttons
        topRect.addEventListener("mousedown", mScSysActionPlusX);
        botRect.addEventListener("mousedown", mScSysActionMinusX);
        //touch for swipe            
        if (!bakRect[prop.activateTouchX]) bakRect[prop.activateTouchX] = function (e) { e.preventDefault(); mScSysActivateX(nHolder, innerHolder, barRect, bakRect); mScSysActionBarX({ pageX: e.targetTouches[0].clientX }); };
        bakRect.addEventListener("touchstart", bakRect[prop.activateTouchX]);
        if (!nHolder[prop.activateTouchX]) nHolder[prop.activateTouchX] = function (e) { mScSysActivateX(nHolder, innerHolder, barRect, bakRect); mScSysActionTouchX(e); };
        nHolder.addEventListener("touchstart", nHolder[prop.activateTouchX], true);
        //touch for buttons //prevent default click-like behaviour
        if (!topRect[prop.activateTouchX]) topRect[prop.activateTouchX] = function (e) { e.preventDefault(); mScSysActivateX(nHolder, innerHolder, barRect, bakRect); mScSysActionPlusX(); };
        topRect.addEventListener("touchstart", topRect[prop.activateTouchX]);
        if (!botRect[prop.activateTouchX]) botRect[prop.activateTouchX] = function (e) { e.preventDefault(); mScSysActivateX(nHolder, innerHolder, barRect, bakRect); mScSysActionMinusX(); };
        botRect.addEventListener("touchstart", botRect[prop.activateTouchX]);
    };
    var mScSysRemoveX = function (nHolder) {
        //reset
        if (!nHolder[prop.scrollerY]) nHolder[prop.innerHolder] = null; //If not needed by scrollerY
        //remove
        nHolder.removeEventListener("mouseleave", mScSysRelinquishX);
        if (nHolder[prop.activateScrollX]) nHolder.removeEventListener("mouseenter", nHolder[prop.activateScrollX]);
        if (nHolder[prop.activateTouchX]) nHolder.removeEventListener("touchstart", nHolder[prop.activateTouchX], true);
        //clear
        nHolder[prop.scrollerX] = null;
        nHolder[prop.scrollBarX] = null;
        nHolder[prop.topCircX] = null;
        nHolder[prop.topRectX] = null;
        nHolder[prop.barRectX] = null;
        nHolder[prop.bakRectX] = null;
        nHolder[prop.botCircX] = null;
        nHolder[prop.botRectX] = null;
        nHolder[prop.activateScrollX] = null;
        nHolder[prop.activateTouchX] = null;
        //off
        mScrollStateX.down = false;
        mScrollStateX.holder = null;
    };
    var mScSysIncludeX = function (nHolder, nContext) { 
        var element = mHolderElement(nHolder); if (!element) return;
        var innerHolder = nHolder[prop.innerHolder] || mCreateInner(nHolder);
        if (!mScSysHasAxisY(nHolder)) { //x only, y may have already inserted innerHolder
            innerHolder.appendChild(element);
            nHolder.appendChild(innerHolder);
        }
        mScSysInsertX(nHolder, innerHolder, nContext, mString(nHolder.style.width, 0, "px"));
    };
    var mScSysPageIncludeX = function (nContext) { 
        mScSysInsertX(jWindow, jPage, nContext, mString(jWindow.style.width, 0, "px"));
    };
    //
    //positioning
    var mNameValue = function (nString) {
        var a = mString(nString, "").split(":");
        return [a[0].trim().toLowerCase(), mString(a[1], "").trim(), mString(a[2], "").trim(), mString(a[3], "").trim()];
    };
    var mFieldValues = function (nHolder, nField) {
        var v = nHolder ? nHolder[nField] : "";
        return mNameValue(v);
    };
    var mHasDependent = function (nId, nField, nStartHolder, nIdsArray) {
        //checks for id in nStartHolder's nField and it's dependencies
        if (!nId || !nField || !nStartHolder) return false;
        var ids = nIdsArray || [];
        var a = mFieldValues(nStartHolder, nField);
        if (a[1] == nId || a[2] == nId) { if (mDebugState.on) mErrorReference(nId, nField); return true; }
        if (a[1]) {
            if (ids.indexOf(a[1]) == -1) ids.push(a[1]); else return false; //prevent infinite recursion, wait on a[1] holder
            if (mHasDependent(nId, nField, mHolder(mElement(a[1], true)), ids)) { if (mDebugState.on) mErrorReference(nId, nField); return true; }
        }
        if (a[2]) {
            if (ids.indexOf(a[2]) == -1) ids.push(a[2]); else return false; //prevent infinite recursion, wait on a[2] holder
            if (mHasDependent(nId, nField, mHolder(mElement(a[2], true)), ids)) { if (mDebugState.on) mErrorReference(nId, nField); return true; }
        }
        return false;
    };
    var mCalcSize = function () {
        //sets mLandscape, mCurrCellSizePx, and base fontSize
        mLandscape = mWin.innerWidth > mWin.innerHeight;
        mCurrCellSizePx = mOrgCellSizePx * (mWin.innerWidth / mRefWidthPx);
        if (mCurrCellSizePx < mMinCellSizePx) mCurrCellSizePx = mMinCellSizePx;
        if (mCurrCellSizePx > mMaxCellSizePx) mCurrCellSizePx = mMaxCellSizePx;
        mDoc.documentElement.style.fontSize = mCurrCellSizePx + "px";
    };
    var mPageStartWidthPx = function () {
        var min = mPixels(mLandscape ? mMinLandColumns : mMinPortColumns);
        return mWin.innerWidth > min ? mWin.innerWidth : min;
    };
    var mPageStartHeightPx = function () {
        var min = mPixels(mLandscape ? mMinLandRows : mMinPortRows);
        return mWin.innerHeight > min ? mWin.innerHeight : min;
    };
    //static
    var mDimensionsStatic = function (nHolder) {
        var w = mFieldValues(nHolder, mLandscape ? prop.landWidth : prop.portWidth);
        var h = mFieldValues(nHolder, mLandscape ? prop.landHeight : prop.portHeight);
        if (isFinite(w[0])) { //Empty string qualifies as zero
            var v = Number(w[0]);
            nHolder[prop.renderWidth] = v;
            nHolder.style.width = mPixels(v) + "px";
        }
        if (isFinite(h[0])) {
            var v = Number(h[0]);
            nHolder[prop.renderHeight] = v;
            nHolder.style.height = mPixels(v) + "px";
        }
    };
    var mPositionStatic = function (nHolder) {
        var c = mFieldValues(nHolder, mLandscape ? prop.landColumn : prop.portColumn);
        var r = mFieldValues(nHolder, mLandscape ? prop.landRow : prop.portRow);
        if (isFinite(c[0])) { //Empty string qualifies as zero
            var v = Number(c[0]);
            nHolder[prop.renderColumn] = v;
            nHolder.style.left = mPixels(v) + "px";
        }
        if (isFinite(r[0])) {
            var v = Number(r[0]);
            nHolder[prop.renderRow] = v;
            nHolder.style.top = mPixels(v) + "px";
        }
        //pinned
        if (nHolder.style.position === "fixed") nHolder.style.left = mPixels(nHolder[prop.savedColumn]) + "px";
        if (nHolder.style.position === "fixed") nHolder.style.top = mPixels(nHolder[prop.savedRow]) + "px";
    };
    //dependent
    var mPositionDynamic = function (nHolder) {
        if (nHolder[prop.renderColumn] == null) mPositionColumn(nHolder, mLandscape ? prop.landColumn : prop.portColumn);
        if (nHolder[prop.renderRow] == null) mPositionRow(nHolder, mLandscape ? prop.landRow : prop.portRow);
        //pinned
        if (nHolder.style.position === "fixed") nHolder.style.left = mPixels(nHolder[prop.savedColumn]) + "px";
        if (nHolder.style.position === "fixed") nHolder.style.top = mPixels(nHolder[prop.savedRow]) + "px";
    };
    var mDimensionsDynamic = function (nHolder) {
        if (nHolder[prop.renderWidth] == null) mSizeWidth(nHolder, mLandscape ? prop.landWidth : prop.portWidth);
        if (nHolder[prop.renderHeight] == null) mSizeHeight(nHolder, mLandscape ? prop.landHeight : prop.portHeight);
    };
    //width
    var mSizeWidth = function (nHolder, nField) {
        var wt = mFieldValues(nHolder, nField);
        switch (wt[0]) {
            case val.widthEqual: mSizeWidthEqual(nHolder, nField, wt); break;
            case val.widthPercent: mSizeWidthPercent(nHolder, nField, wt); break;
            case val.widthStretch: mSizeWidthStretch(nHolder, nField, wt); break;
            case val.widthSpan: mSizeWidthSpan(nHolder, nField, wt); break;
            case val.widthWindow: mSizeWidthWindow(nHolder, nField, wt); break;
            case val.widthEqHeight: mSizeWidthEqHeight(nHolder, nField, wt); break;
            default: nHolder[nField] = val.widthStretch; mWaiting = true; break; 
        }
    };
    var mSizeWidthEqual = function (nHolder, nField, wt) {
        //optional wt[2] is offset cells
        var h = mHolder(mElement(wt[1]), true);
        //check for width dependent
        if (!h || mHasDependent(mHolderElementId(nHolder), nField, h)) { nHolder[nField] = val.widthStretch; mWaiting = true; return; }
        //equal to derived width
        var dw = h[prop.renderWidth]; if (dw == null) { mWaiting = true; return; }
        var v = dw + mNumber(wt[2], 0);
        nHolder.style.width = mPixels(v) + "px";
        nHolder[prop.renderWidth] = v;
    };
    var mSizeWidthPercent = function (nHolder, nField, wt) {
        //optional wt[3] is offset cells (can use wt[2] when second element not specified) 
        //optional wt[1] is second element, if not specified percent is of page
        var h = mHolder(mElement(wt[1], true), true); if (!h) h = jPage;
        //check for width dependent
        if (h != jPage && mHasDependent(mHolderElementId(nHolder), nField, h)) { nHolder[nField] = val.widthStretch; mWaiting = true; return; }
        //percent of derived width
        var dw = (h == jPage ? mColumnsCount : h[prop.renderWidth]); if (dw == null) { mWaiting = true; return; }
        var factor = mNumber((h == jPage ? wt[1] : wt[2]), 100) / 100;
        var v = dw * (factor < 0 || factor > 1 ? 1 : factor) + mNumber((h == jPage ? wt[2] : wt[3]), 0);
        nHolder.style.width = mPixels(v) + "px";
        nHolder[prop.renderWidth] = v;
    };
    var mSizeWidthStretch = function (nHolder, nField, wt) {
        //optional wt[1] is offset cells
        var cv = nHolder[prop.renderColumn]; if (cv == null) { mWaiting = true; return; }
        //stretch to end
        var v = mColumnsCount - cv + mNumber(wt[1], 0);
        nHolder.style.width = mPixels(v) + "px";
        nHolder[prop.renderWidth] = v;
    };
    var mSizeWidthSpan = function (nHolder, nField, wt) {
        //optional wt[3] is offset cells
        var h = mHolder(mElement(wt[1]), true);
        var h2 = mHolder(mElement(wt[2]), true);
        //check for column dependent
        var id = mHolderElementId(nHolder), dep = mLandscape ? prop.landColumn : prop.portColumn;
        if (!h || !h2 || mHasDependent(id, dep, h) || mHasDependent(id, dep, h2)) { nHolder[nField] = val.widthStretch; mWaiting = true; return; }
        //between two derived elements
        if (h[prop.renderColumn] == null) { mWaiting = true; return; }
        if (h2[prop.renderColumn] == null) { mWaiting = true; return; }
        var dc, dw;       
        if (h[prop.renderColumn] > h2[prop.renderColumn]) {
            //check for width dependent
            if (mHasDependent(id, nField, h)) { nHolder[nField] = val.widthStretch; mWaiting = true; return; }
            //get width
            if (h[prop.renderWidth] == null) { mWaiting = true; return; }
            dc = h[prop.renderColumn] + h[prop.renderWidth];
            dw = dc - h2[prop.renderColumn];
        } else {
            //check for width dependent
            if (mHasDependent(id, nField, h2)) { nHolder[nField] = val.widthStretch; mWaiting = true; return; }
            //get width
            if (h2[prop.renderWidth] == null) { mWaiting = true; return; }
            dc = h2[prop.renderColumn] + h2[prop.renderWidth];
            dw = dc - h[prop.renderColumn];
        }
        var v = dw + mNumber(wt[3], 0);
        nHolder.style.width = mPixels(v) + "px";
        nHolder[prop.renderWidth] = v;
    };
    var mSizeWidthWindow = function (nHolder, nField, wt) {
        //optional wt[1] is offset cells
        var v = mCells(mPageStartWidthPx()) + mNumber(wt[1], 0);
        nHolder.style.width = mPixels(v) + "px";
        nHolder[prop.renderWidth] = v;
    };
    var mSizeWidthEqHeight = function (nHolder, nField, wt) {
        //optional wt[1] is offset cells
        var p = mLandscape ? prop.landHeight : prop.portHeight;
        if (nHolder[p] === val.heightEqWidth) {
            if (mDebugState.on) mErrorReference(mHolderElementId(nHolder), nField);
            nHolder[nField] = val.widthStretch; mWaiting = true; return;
        }
        var dw = nHolder[prop.renderHeight]; if (dw == null) { mWaiting = true; return; }
        var v = dw + mNumber(wt[1], 0);
        nHolder.style.width = mPixels(v) + "px";
        nHolder[prop.renderWidth] = v;
    };
    //height
    var mSizeHeight = function (nHolder, nField) {
        var ht = mFieldValues(nHolder, nField);
        switch (ht[0]) {
            case val.heightEqual: mSizeHeightEqual(nHolder, nField, ht); break;
            case val.heightPercent: mSizeHeightPercent(nHolder, nField, ht); break;
            case val.heightStretch: mSizeHeightStretch(nHolder, nField, ht); break;
            case val.heightSpan: mSizeHeightSpan(nHolder, nField, ht); break;
            case val.heightWindow: mSizeHeightWindow(nHolder, nField, ht); break;
            case val.heightFlow: mSizeHeightFlow(nHolder, nField, ht); break;
            case val.heightEqWidth: mSizeHeightEqWidth(nHolder, nField, ht); break;
            default: nHolder[nField] = val.heightFlow; mWaiting = true; break;
        }
    };
    var mSizeHeightEqual = function (nHolder, nField, ht) {
        //optional ht[2] is offset cells
        var h = mHolder(mElement(ht[1]), true);
        //check for width dependent
        if (!h || mHasDependent(mHolderElementId(nHolder), nField, h)) { nHolder[nField] = val.heightFlow; mWaiting = true; return; }
        //equal to derived height
        var dh = h[prop.renderHeight]; if (dh == null) { mWaiting = true; return; }
        var v = dh + mNumber(ht[2], 0);
        nHolder.style.height = mPixels(v) + "px";
        nHolder[prop.renderHeight] = v;
    };
    var mSizeHeightPercent = function (nHolder, nField, ht) {
        //optional ht[3] is offset cells (can use ht[2] when second element not specified) 
        //optional ht[1] is second element, if not specified percent is of page
        var h = mHolder(mElement(ht[1], true), true); if (!h) h = jPage;
        //check for height dependent
        if (h != jPage && mHasDependent(mHolderElementId(nHolder), nField, h)) { nHolder[nField] = val.heightFlow; mWaiting = true; return; }
        //percent of derived height
        var dh = (h == jPage ? mRowsCount : h[prop.renderHeight]); if (dh == null) { mWaiting = true; return; }
        var factor = mNumber((h == jPage ? ht[1] : ht[2]), 100) / 100;
        var v = dh * (factor < 0 || factor > 1 ? 1 : factor) + mNumber((h == jPage ? ht[2] : ht[3]), 0);
        nHolder.style.height = mPixels(v) + "px";
        nHolder[prop.renderHeight] = v;
    };
    var mSizeHeightStretch = function (nHolder, nField, ht) {
        //optional ht[1] is offset cells
        var rv = nHolder[prop.renderRow]; if (rv == null) { mWaiting = true; return; }
        //stretch to end
        var v = mRowsCount - rv + mNumber(ht[1], 0);
        nHolder.style.height = mPixels(v) + "px";
        nHolder[prop.renderHeight] = v;
    };
    var mSizeHeightSpan = function (nHolder, nField, ht) {
        //optional ht[3] is offset cells
        var h = mHolder(mElement(ht[1]), true);
        var h2 = mHolder(mElement(ht[2]), true);
        //check for row dependent 
        var id = mHolderElementId(nHolder), dep = mLandscape ? prop.landRow : prop.portRow;
        if (!h || !h2 || mHasDependent(id, dep, h) || mHasDependent(id, dep, h2)) { nHolder[nField] = val.heightFlow; mWaiting = true; return; }
        //between two derived elements
        if (h[prop.renderRow] == null) { mWaiting = true; return; }
        if (h2[prop.renderRow] == null) { mWaiting = true; return; }
        var dr, dh;
        if (h[prop.renderRow] > h2[prop.renderRow]) {
            //check for height dependent
            if (mHasDependent(id, nField, h)) { nHolder[nField] = val.heightFlow; mWaiting = true; return; }
            //get height
            if (h[prop.renderHeight] == null) { mWaiting = true; return; }
            dr = h[prop.renderRow] + h[prop.renderHeight];
            dh = dr - h2[prop.renderRow];
        } else {
            //check for height dependent
            if (mHasDependent(id, nField, h2)) { nHolder[nField] = val.heightFlow; mWaiting = true; return; }
            //get height
            if (h2[prop.renderHeight] == null) { mWaiting = true; return; }
            dr = h2[prop.renderRow] + h2[prop.renderHeight];
            dh = dr - h[prop.renderRow];
        }
        var v = dh + mNumber(ht[3], 0);
        nHolder.style.height = mPixels(v) + "px";
        nHolder[prop.renderHeight] = v;
    };
    var mSizeHeightFlow = function (nHolder, nField, ht) {
        //width must be set to get proper flow height
        //optional ht[1] is offset cells
        if (nHolder[prop.renderWidth] == null) { mWaiting = true; return; }
        nHolder.style.height = "";
        var v = mCells(nHolder.clientHeight) + mNumber(ht[1], 0);
        nHolder.style.height = mPixels(v) + "px";
        nHolder[prop.renderHeight] = v;
    };
    var mSizeHeightWindow = function (nHolder, nField, ht) {
        //optional ht[1] is offset cell
        var v = mCells(mPageStartHeightPx()) + mNumber(ht[1], 0);
        nHolder.style.height = mPixels(v) + "px";
        nHolder[prop.renderHeight] = v;
    };
    var mSizeHeightEqWidth = function (nHolder, nField, ht) {
        //optional ht[1] is offset cells
        var p = mLandscape ? prop.landWidth : prop.portWidth;
        if (nHolder[p] === val.widthEqHeight) {
            if (mDebugState.on) mErrorReference(mHolderElementId(nHolder), nField);
            nHolder[nField] = val.heightFlow; mWaiting = true; return;
        }
        var dh = nHolder[prop.renderWidth]; if (dh == null) { mWaiting = true; return; }
        var v = dh + mNumber(ht[1], 0);
        nHolder.style.height = mPixels(v) + "px";
        nHolder[prop.renderHeight] = v;
    };
    //column
    var mPositionColumn = function (nHolder, nField) {
        var ct = mFieldValues(nHolder, nField);
        switch (ct[0]) {
            case val.columnLeft: mPositionColumnLeft(nHolder, nField, ct); break;
            case val.columnCenter: mPositionColumnCenter(nHolder, nField, ct); break;
            case val.columnRight: mPositionColumnRight(nHolder, nField, ct); break;
            case val.columnBefore: mPositionColumnBefore(nHolder, nField, ct); break;
            case val.columnAfter: mPositionColumnAfter(nHolder, nField, ct); break;
            case val.columnEqual: mPositionColumnEqual(nHolder, nField, ct); break;
            case val.columnEnd: mPositionColumnEnd(nHolder, nField, ct); break;
            case val.columnBetween: mPositionColumnBetween(nHolder, nField, ct); break;
            case val.columnPercent: mPositionColumnPercent(nHolder, nField, ct); break;
            default: nHolder.style.left = "0"; nHolder[prop.renderColumn] = 0; break;
        }
    };
    var mPositionColumnLeft = function (nHolder, nField, ct) {
        //optional ct[1] is offset cells
        var v = mNumber(ct[1], 0);
        nHolder.style.left = mPixels(v) + "px";
        nHolder[prop.renderColumn] = v;
    };
    var mPositionColumnCenter = function (nHolder, nField, ct) {        
        //optional ct[1] is offset cells
        //if self width type is stretch, set it along with column
        var wv = nHolder[prop.renderWidth];        
        if (wv == null) {            
            var wt = mFieldValues(nHolder, mLandscape ? prop.landWidth : prop.portWidth);
            if (wt[0] != val.widthStretch) { mWaiting = true; return; }
            else { wv = mColumnsCount + mNumber(wt[1], 0); nHolder.style.width = mPixels(wv) + "px"; nHolder[prop.renderWidth] = wv; }
        }
        var v = mColumnsCount / 2 - wv / 2 + mNumber(ct[1], 0);
        nHolder.style.left = mPixels(v) + "px";
        nHolder[prop.renderColumn] = v;
    };
    var mPositionColumnRight = function (nHolder, nField, ct) {        
        //optional ct[1] is offset cells
        //if self width type is stretch, set it along with column
        var wv = nHolder[prop.renderWidth];
        if (wv == null) {            
            var wt = mFieldValues(nHolder, mLandscape ? prop.landWidth : prop.portWidth);
            if (wt[0] != val.widthStretch) { mWaiting = true; return; }
            else { wv = mColumnsCount + mNumber(wt[1], 0); nHolder.style.width = mPixels(wv) + "px"; nHolder[prop.renderWidth] = wv; }
        }
        var v = mColumnsCount - wv + mNumber(ct[1], 0);
        nHolder.style.left = mPixels(v) + "px";
        nHolder[prop.renderColumn] = v;
    };
    var mPositionColumnBefore = function (nHolder, nField, ct) {
        //optional ct[2] is offset cells
        var h = mHolder(mElement(ct[1]), true);
       //check for column dependent
        if (!h || mHasDependent(mHolderElementId(nHolder), nField, h)) { nHolder[nField] = 0; mWaiting = true; return; }
        //before derived column
        var dc = h[prop.renderColumn]; if (dc == null) { mWaiting = true; return; }
        //if self width type is stretch, width should go from page start to start of derived element
        var wv = nHolder[prop.renderWidth];
        if (wv == null) {
            var wt = mFieldValues(nHolder, mLandscape ? prop.landWidth : prop.portWidth);
            if (wt[0] != val.widthStretch) { mWaiting = true; return; }
            else { wv = dc + mNumber(wt[1], 0); nHolder.style.width = mPixels(wv) + "px"; nHolder[prop.renderWidth] = wv; }
        }
        var v = dc - wv + mNumber(ct[2], 0);
        nHolder.style.left = mPixels(v) + "px";
        nHolder[prop.renderColumn] = v;
    };
    var mPositionColumnAfter = function (nHolder, nField, ct) {
        //optional ct[2] is offset cells
        var h = mHolder(mElement(ct[1]), true);
        //check for column or width dependent
        var id = mHolderElementId(nHolder), dep = mLandscape ? prop.landWidth : prop.portWidth;
        if (!h || mHasDependent(id, nField, h) || mHasDependent(id, dep, h)) { nHolder[nField] = 0; mWaiting = true; return; }
        //after derived column
        var dc = h[prop.renderColumn]; if (dc == null) { mWaiting = true; return; }
        //derived width
        var dw = h[prop.renderWidth]; if (dw == null) { mWaiting = true; return; }        
        var v = dc + dw + mNumber(ct[2], 0);
        nHolder.style.left = mPixels(v) + "px";
        nHolder[prop.renderColumn] = v;
    };
    var mPositionColumnEqual = function (nHolder, nField, ct) {
        //optional ct[2] is offset cells
        var h = mHolder(mElement(ct[1]), true);
        //check for column dependent
        if (!h || mHasDependent(mHolderElementId(nHolder), nField, h)) { nHolder[nField] = 0; mWaiting = true; return; }
        //equal to derived column
        var dc = h[prop.renderColumn]; if (dc == null) { mWaiting = true; return; }
        var v = dc + mNumber(ct[2], 0);
        nHolder.style.left = mPixels(v) + "px";
        nHolder[prop.renderColumn] = v;
    };
    var mPositionColumnEnd = function (nHolder, nField, ct) {
        //optional ct[2] is offset cells
        var h = mHolder(mElement(ct[1]), true);
        //check for column or width dependent
        var id = mHolderElementId(nHolder), dep = mLandscape ? prop.landWidth : prop.portWidth; 
        if (!h || mHasDependent(id, nField, h) || mHasDependent(id, dep, h)) { nHolder[nField] = 0; mWaiting = true; return; }
        //align with end of derived
        var dc = h[prop.renderColumn]; if (dc == null) { mWaiting = true; return; }
        var dw = h[prop.renderWidth]; if (dw == null) { mWaiting = true; return; }
        //if self width type is stretch, width should equal end of derived
        var wv = nHolder[prop.renderWidth];        
        if (wv == null) {            
            var wt = mFieldValues(nHolder, mLandscape ? prop.landWidth : prop.portWidth);
            if (wt[0] != val.widthStretch) { mWaiting = true; return; }
            else { wv = mColumnsCount - (mColumnsCount - (dc + dw)) + mNumber(wt[1], 0); nHolder.style.width = mPixels(wv) + "px"; nHolder[prop.renderWidth] = wv; }
        }
        var v = dc + dw - wv + mNumber(ct[2], 0);
        nHolder.style.left = mPixels(v) + "px";
        nHolder[prop.renderColumn] = v;
    };
    var mPositionColumnBetween = function (nHolder, nField, ct) {
        //optional ct[3] is offset cells (can use ct[2] when second element not specified) 
        //optional ct[2] is second element, if not specified centers on fist only
        var h = mHolder(mElement(ct[1]), true);
        var h2 = mHolder(mElement(ct[2], true), true); if (!h2) h2 = h; 
        //check for column dependent
        var id = mHolderElementId(nHolder);
        if (!h || !h2 || mHasDependent(id, nField, h) || mHasDependent(id, nField, h2)) { nHolder[nField] = 0; mWaiting = true; return; }
        //between two derived elements
        if (h[prop.renderColumn] == null) { mWaiting = true; return; }
        if (h2[prop.renderColumn] == null) { mWaiting = true; return; }
        var dc, dw;
        var hId = mHolderElementId(nHolder), dep = mLandscape ? prop.landWidth : prop.portWidth;
        if (h[prop.renderColumn] < h2[prop.renderColumn]) {
            //check for width dependent
            var dep = mLandscape ? prop.landWidth : prop.portWidth;
            if (mHasDependent(id, dep, h)) { nHolder[nField] = 0; mWaiting = true; return; }
            //get center
            if (h[prop.renderWidth] == null) { mWaiting = true; return; }
            dc = h[prop.renderColumn] + h[prop.renderWidth];
            dw = h2[prop.renderColumn] - dc;
            dc += dw / 2;
        } else {
            //check for width dependent
            var dep = mLandscape ? prop.landWidth : prop.portWidth;
            if (mHasDependent(id, dep, h2)) { nHolder[nField] = 0; mWaiting = true; return; }
            //get center
            if (h2[prop.renderWidth] == null) { mWaiting = true; return; }
            dc = h2[prop.renderColumn] + h2[prop.renderWidth];
            dw = h[prop.renderColumn] - dc;
            dc += dw / 2;
        }
        //if self width type is stretch, width should go from end of left to start of right elements (unless same elements)
        var wv = nHolder[prop.renderWidth];
        if (wv == null) {
            var wt = mFieldValues(nHolder, mLandscape ? prop.landWidth : prop.portWidth);
            if (wt[0] != val.widthStretch) { mWaiting = true; return; }
            else if (h == h2) { wv = mColumnsCount + mNumber(wt[1], 0); }
            else { wv = dw + mNumber(wt[1], 0); }
            nHolder.style.width = mPixels(wv) + "px"; nHolder[prop.renderWidth] = wv;
        }
        var o = (h2 == h ? (mNumber(ct[2], 0) || mNumber(ct[3], 0)) : mNumber(ct[3], 0));
        var v = dc - wv / 2 + o;
        nHolder.style.left = mPixels(v) + "px";
        nHolder[prop.renderColumn] = v;
    };
    var mPositionColumnPercent = function (nHolder, nField, ct) {
        //optional ct[3] is offset cells (can use ct[2] when second element not specified) 
        //optional ct[1] is second element, if not specified percent is of page
        var h = mHolder(mElement(ct[1]), true);
        //check for column or width dependent
        var id = mHolderElementId(nHolder), dep = mLandscape ? prop.landWidth : prop.portWidth;
        if (!h || mHasDependent(id, nField, h) || mHasDependent(id, dep, h)) { nHolder[nField] = 0; mWaiting = true; return; }
        //after derived column
        var dc = h[prop.renderColumn]; if (dc == null) { mWaiting = true; return; }
        //derived width
        var dw = (h == jPage ? mColumnsCount : h[prop.renderWidth]); if (dw == null) { mWaiting = true; return; }
        var factor = mNumber((h == jPage ? ct[1] : ct[2]), 100) / 100;
        var v = dc + (dw * (factor < 0 || factor > 1 ? 1 : factor)) + mNumber((h == jPage ? ct[2] : ct[3]), 0);
        nHolder.style.left = mPixels(v) + "px";
        nHolder[prop.renderColumn] = v;
    };
    //row
    var mPositionRow = function (nHolder, nField) {
        var rt = mFieldValues(nHolder, nField);
        switch (rt[0]) {
            case val.rowTop: mPositionRowTop(nHolder, nField, rt); break;
            case val.rowCenter: mPositionRowCenter(nHolder, nField, rt); break;
            case val.rowBottom: mPositionRowBottom(nHolder, nField, rt); break;
            case val.rowBefore: mPositionRowBefore(nHolder, nField, rt); break;
            case val.rowAfter: mPositionRowAfter(nHolder, nField, rt); break;
            case val.rowEqual: mPositionRowEqual(nHolder, nField, rt); break;
            case val.rowEnd: mPositionRowEnd(nHolder, nField, rt); break;
            case val.rowBetween: mPositionRowBetween(nHolder, nField, rt); break;
            case val.rowPercent: mPositionRowPercent(nHolder, nField, rt); break;
            default: nHolder.style.top = "0"; nHolder[prop.renderRow] = 0; break;
        }        
    };
    var mPositionRowTop = function (nHolder, nField, rt) {
        //optional rt[1] is offset cells
        var v = mNumber(rt[1], 0);
        nHolder.style.top = mPixels(v) + "px";
        nHolder[prop.renderRow] = v;
    };
    var mPositionRowCenter = function (nHolder, nField, rt) {        
        //optional rt[1] is offset cells
        //if self height type is stretch, set it along with row
        var hv = nHolder[prop.renderHeight];        
        if (hv == null) {            
            var ht = mFieldValues(nHolder, mLandscape ? prop.landHeight : prop.portHeight);
            if (ht[0] != val.heightStretch) { mWaiting = true; return; }
            else { hv = mColumnsCount; nHolder.style.height = mPixels(hv) + "px"; nHolder[prop.renderHeight] = hv; }
        }
        var v = mRowsCount / 2 - hv / 2 + mNumber(rt[1], 0);
        nHolder.style.top = mPixels(v) + "px";
        nHolder[prop.renderRow] = v;
    };
    var mPositionRowBottom = function (nHolder, nField, rt) {        
        //optional rt[1] is offset cells
        //if self height type is stretch, set it along with row
        var hv = nHolder[prop.renderHeight];
        if (hv == null) {            
            var ht = mFieldValues(nHolder, mLandscape ? prop.landHeight : prop.portHeight);
            if (ht[0] != val.heightStretch) { mWaiting = true; return; }
            else { hv = mRowsCount + mNumber(ht[1], 0); nHolder.style.height = mPixels(hv) + "px"; nHolder[prop.renderHeight] = hv; }
        }
        var v = mRowsCount - hv + mNumber(rt[1], 0);
        nHolder.style.top = mPixels(v) + "px";
        nHolder[prop.renderRow] = v;
    };
    var mPositionRowBefore = function (nHolder, nField, rt) {
        //optional rt[2] is offset cells
        var h = mHolder(mElement(rt[1]), true);
        //check for row dependent
        if (!h || mHasDependent(mHolderElementId(nHolder), nField, h)) { nHolder[nField] = 0; mWaiting = true; return; }
        //before derived row
        var dr = h[prop.renderRow]; if (dr == null) { mWaiting = true; return; }
        //if self height type is stretch, height should go from page start to start of derived element
        var hv = nHolder[prop.renderHeight];
        if (hv == null) {
            var ht = mFieldValues(nHolder, mLandscape ? prop.landHeight : prop.portHeight);
            if (ht[0] != val.heightStretch) { mWaiting = true; return; }
            else { hv = dr + mNumber(ht[1], 0); nHolder.style.height = mPixels(hv) + "px"; nHolder[prop.renderHeight] = hv; }
        }
        var v = dr - hv + mNumber(rt[2], 0);
        nHolder.style.top = mPixels(v) + "px";
        nHolder[prop.renderRow] = v;
    };
    var mPositionRowAfter = function (nHolder, nField, rt) {
        //optional rt[2] is offset cells
        var h = mHolder(mElement(rt[1]), true);
        //check for row or height dependent
        var id = mHolderElementId(nHolder), dep = mLandscape ? prop.landHeight : prop.portHeight;
        if (!h || mHasDependent(id, nField, h) || mHasDependent(id, dep, h)) { nHolder[nField] = 0; mWaiting = true; return; }
        //after derived row
        var dr = h[prop.renderRow]; if (dr == null) { mWaiting = true; return; }
        //derived height
        var dh = h[prop.renderHeight]; if (dh == null) { mWaiting = true; return; }
        var v = dr + dh + mNumber(rt[2], 0);
        nHolder.style.top = mPixels(v) + "px";
        nHolder[prop.renderRow] = v;
    };
    var mPositionRowEqual = function (nHolder, nField, rt) {
        //optional rt[2] is offset cells
        var h = mHolder(mElement(rt[1]), true);
        //check for row dependent
        if (!h || mHasDependent(mHolderElementId(nHolder), nField, h)) { nHolder[nField] = 0; mWaiting = true; return; }
        //equal to derived row
        var dr = h[prop.renderRow]; if (dr == null) { mWaiting = true; return; }
        var v = dr + mNumber(rt[2], 0);
        nHolder.style.top = mPixels(v) + "px";
        nHolder[prop.renderRow] = v;
    };
    var mPositionRowEnd = function (nHolder, nField, rt) {
        //optional rt[2] is offset cells
        var h = mHolder(mElement(rt[1]), true);
        //check for row or height dependent
        var id = mHolderElementId(nHolder), dep = mLandscape ? prop.landHeight : prop.portHeight;
        if (!h || mHasDependent(id, nField, h) || mHasDependent(id, dep, h)) { nHolder[nField] = 0; mWaiting = true; return; }
        //align with end of derived
        var dr = h[prop.renderRow]; if (dr == null) { mWaiting = true; return; }
        var dh = h[prop.renderHeight]; if (dh == null) { mWaiting = true; return; }
        //if self height type is stretch, height should equal end of derived
        var hv = nHolder[prop.renderHeight];
        if (hv == null) {            
            var ht = mFieldValues(nHolder, mLandscape ? prop.landHeight : prop.portHeight);
            if (ht[0] != val.heightStretch) { mWaiting = true; return; }
            else { hv = mRowsCount - (mRowsCount - (dr + dh)) + mNumber(ht[1], 0); nHolder.style.height = mPixels(hv) + "px"; nHolder[prop.renderHeight] = hv; }
        }
        var v = dr + dh - hv + mNumber(rt[2], 0);
        nHolder.style.top = mPixels(v) + "px";
        nHolder[prop.renderRow] = v;
    };
    var mPositionRowBetween = function (nHolder, nField, rt) {
        //optional rt[3] is offset cells (can use rt[2] when second element not specified) 
        //optional rt[2] is second element, if not specified centers on fist only
        var h = mHolder(mElement(rt[1]), true);
        var h2 = mHolder(mElement(rt[2], true), true); if (!h2) h2 = h;
        //check for row dependent
        var id = mHolderElementId(nHolder);
        if (!h || !h2 || mHasDependent(id, nField, h) || mHasDependent(id, nField, h2)) { nHolder[nField] = 0; mWaiting = true; return; }
        //between two derived elements
        if (h[prop.renderRow] == null) { mWaiting = true; return; }
        if (h2[prop.renderRow] == null) { mWaiting = true; return; }
        var dr, dh;
        var dep = mLandscape ? prop.landHeight : prop.portHeight;
        if (h[prop.renderRow] < h2[prop.renderRow]) {
            //check for height dependent
            if (mHasDependent(id, dep, h)) { nHolder[nField] = 0; mWaiting = true; return; } 
            //get center
            if (h[prop.renderHeight] == null) { mWaiting = true; return; }
            dr = h[prop.renderRow] + h[prop.renderHeight];
            dh = h2[prop.renderRow] - dr;
            dr += dh / 2;
        } else {
            //check for height dependent
            if (mHasDependent(id, dep, h2)) { nHolder[nField] = 0; mWaiting = true; return; }
            //get center
            if (h2[prop.renderHeight] == null) { mWaiting = true; return; }
            dr = h2[prop.renderRow] + h2[prop.renderHeight];
            dh = h[prop.renderRow] - dr;
            dr += dh / 2;
        }
        //if self height type is stretch, width should go from end of top to start of bottom elements (unless same elements)
        var hv = nHolder[prop.renderHeight];
        if (hv == null) {
            var ht = mFieldValues(nHolder, mLandscape ? prop.landHeight : prop.portHeight);
            if (ht[0] != val.heightStretch) { mWaiting = true; return; }
            else if (h == h2) { hv = mRowsCount + mNumber(ht[1], 0); }
            else { hv = dh + mNumber(ht[1], 0); }
            nHolder.style.height = mPixels(hv) + "px"; nHolder[prop.renderHeight] = hv;
        }
        var o = (h2 == h ? (mNumber(rt[2], 0) || mNumber(rt[3], 0)) : mNumber(rt[3], 0));
        var v = dr - hv / 2 + o;
        nHolder.style.top = mPixels(v) + "px";
        nHolder[prop.renderRow] = v;
    };
    var mPositionRowPercent = function (nHolder, nField, rt) {
        //optional rt[3] is offset cells (can use rt[2] when second element not specified) 
        //optional rt[1] is second element, if not specified percent is of page
        var h = mHolder(mElement(rt[1]), true);
        //check for row or height dependent
        var id = mHolderElementId(nHolder), dep = mLandscape ? prop.landHeight : prop.portHeight;
        if (!h || mHasDependent(id, nField, h) || mHasDependent(id, dep, h)) { nHolder[nField] = 0; mWaiting = true; return; }
        //after derived row
        var dr = h[prop.renderRow]; if (dr == null) { mWaiting = true; return; }
        //derived height
        var dh = (h == jPage ? mRowsCount : h[prop.renderHeight]); if (dh == null) { mWaiting = true; return; }
        var factor = mNumber((h == jPage ? rt[1] : rt[2]), 100) / 100;
        var v = dr + (dh * (factor < 0 || factor > 1 ? 1 : factor)) + mNumber((h == jPage ? rt[2] : rt[3]), 0);
        nHolder.style.top = mPixels(v) + "px";
        nHolder[prop.renderRow] = v;
    };
    //interface
    var mPlace = function () {
        //places holders according to defines                
        var aLayer, aDefined, aClass;
        if (mLandscape) { aLayer = prop.landLayer; aDefined = prop.landDefined; aClass = prop.landClass; }
        else { aLayer = prop.portLayer; aDefined = prop.portDefined; aClass = prop.portClass; }
        //insert elements into holders and holders into layers (or jPage)
        mHolders.forEach(function (h, i) {
            if (h[aDefined]) {
                var e = mElements[i];
                if (!h[prop.hasFrame]) h.appendChild(e); else if (e.parentNode) e.parentNode.removeChild(e); //see includeFrame()
                h.setAttribute("class", mString(h[aClass], "")); mLayer(h[aLayer]).appendChild(h); //set class and put holder in layer
            } else if (h.parentNode) { h.parentNode.removeChild(h); }
        });
        for (var k in mLayers) { var l = mLayers[k]; l.setAttribute("class", mString(l[aClass], "")); jPage.appendChild(l); }
        //don't put jPage on page if page not ready
        if (!mReady) return;
        jPage.setAttribute("class", mString(jPage[aClass], ""));
        jWindow.setAttribute("class", mString(jWindow[aClass], ""));
        jWindow.appendChild(jPage);
        //process
        mHolders.forEach(function (h) { h[prop.renderColumn] = null; h[prop.renderRow] = null; h[prop.renderWidth] = null; h[prop.renderHeight] = null; });
        mHolders.forEach(function (h) { if (h[aDefined]) mDimensionsStatic(h); });
        mHolders.forEach(function (h) { if (h[aDefined]) mPositionStatic(h); });
        do {
            mWaiting = false;
            mHolders.forEach(function (h, i, a) { if (h[aDefined]) mPositionDynamic(h); });
            mHolders.forEach(function (h, i, a) { if (h[aDefined]) mDimensionsDynamic(h); });
        } while (mWaiting);
    };
    var mPlaceScroll = function () {
        //place or remove scrollbars 
        var aScrollY, aScrollX, aDefined;
        if (mLandscape) { aScrollY = prop.landScrollY; aScrollX = prop.landScrollX; aDefined = prop.landDefined; }
        else { aScrollY = prop.portScrollY; aScrollX = prop.portScrollX; aDefined = prop.portDefined; }
        var dis = val.scrollDisabled;
        mHolders.forEach(function (h, i, a) {            
            var cnxY = mString(h[aScrollY], dis);
            var cnxX = mString(h[aScrollX], dis);
            if (cnxY == dis && cnxX == dis) {
                //no scroll
                mDetachChild(h[prop.innerHolder]);
                mDetachChild(h[prop.scrollerY]);
                mDetachChild(h[prop.scrollerX]);
                mScSysRemoveY(h);
                mScSysRemoveX(h);
            } else if (cnxX == dis) {
                //scroll y only
                mDetachChild(h[prop.scrollerX]);
                mScSysRemoveX(h);
                if (h[aDefined]) mScSysIncludeY(h, cnxY);
            } else if (cnxY == dis) {
                //scroll x only
                mDetachChild(h[prop.scrollerY]);
                mScSysRemoveY(h);
                if (h[aDefined]) mScSysIncludeX(h, cnxX);
            } else if (h[aDefined]) {
                //scroll both
                mScSysIncludeY(h, cnxY); //place y first when shared
                mScSysIncludeX(h, cnxX); //and then x
            }
        });
        //window
        (function () {
            var h = jWindow;             
            var cnxY = mString(h[aScrollY], dis);
            var cnxX = mString(h[aScrollX], dis);
            //custom scroll position or alignment with elements can be achieved by passing a handler to onResize()
            if (cnxY == dis && cnxX == dis) {
                //no scroll
                mDetachChild(h[prop.scrollerY]);
                mDetachChild(h[prop.scrollerX]);
                mScSysRemoveY(h);
                mScSysRemoveX(h);
            } else if (cnxX == dis) {
                //scroll y only
                mDetachChild(h[prop.scrollerX]);
                mScSysRemoveX(h);
                mScSysPageIncludeY(cnxY);
            } else if (cnxY == dis) {
                //scroll x only
                mDetachChild(h[prop.scrollerY]);
                mScSysRemoveY(h);
                mScSysPageIncludeX(cnxX);
            } else {
                //scroll both
                mScSysPageIncludeY(cnxY); //place y first when shared
                mScSysPageIncludeX(cnxX); //and then x
            }
        })();
    };
    var mSizePage = function () {
        var wh = mWin.innerHeight, bh = mPixels(mRowsCount);
        jWindow.style.height = wh + "px";
        jPage.style.height = (bh > wh ? bh : wh) + "px";
        var ww = mWin.innerWidth, bw = mPixels(mColumnsCount);
        jWindow.style.width = ww + "px";
        jPage.style.width = (bw > ww ? bw : ww) + "px";
    };
    //
    //debug
    var mErrorReference = function (nId, nField) {
        var msg = "circular reference exists for '" + nId + "' on field " + nField;
        throw new Error(msg);
    };
    var mErrorElement = function (nElement) {
        var msg = "element '" + (nElement || "unknown") + "' not found";
        throw new Error(msg);
    };
    //
    //public 
    mGrid.debug = function (nCellSizePx, nRefWidthPx, nMinCellSizePx, nMaxCellSizePx) {
        //when in debug mode the specified nRefWidthPx in a screen call will return true
        //additionally, errors will be thrown on circular references and undefined elements, initialized in define() and processed in update() and mElement()
        //if arguments not passed into parameters, defaults will be used and debug will still be turned on
        mGrid.size(nCellSizePx, nRefWidthPx, nMinCellSizePx, nMaxCellSizePx);
        mDebugState.on = true;
        mDebugState.rw = mRefWidthPx;
    };
    mGrid.screen = function (nCellSizePx, nRefWidthPx, nMinCellSizePx, nMaxCellSizePx) {
        //if in debug return true for this screen, size set in mGrid.debug()
        if (mDebugState.on) return nRefWidthPx == mDebugState.rw;
        //define a reference size, return bool indicates if screen is equal or greater than ref size 
        mGrid.size(nCellSizePx, nRefWidthPx, nMinCellSizePx, nMaxCellSizePx);
        //if page is in an iframe the frame is treated as the screen, return true if width of screen is >= to ref width
        var w = (mWin.self == mWin.top ? screen.availWidth : mWin.innerWidth);
        return (w >= mRefWidthPx);
    };
    mGrid.size = function (nCellSizePx, nRefWidthPx, nMinCellSizePx, nMaxCellSizePx) {
        //cell size for reference size
        var cellPx = mNumberNatural(nCellSizePx, mOrgCellSizePx);
        mRefWidthPx = mNumberNatural(nRefWidthPx, mRefWidthPx);
        mMinCellSizePx = mNumberNatural(nMinCellSizePx, mMinCellSizePx * (cellPx / mOrgCellSizePx));
        mMaxCellSizePx = mNumberNatural(nMaxCellSizePx, mMaxCellSizePx * (cellPx / mOrgCellSizePx));
        if (mMaxCellSizePx < mMinCellSizePx) { var t = mMaxCellSizePx; mMaxCellSizePx = mMinCellSizePx; mMinCellSizePx = t; }
        mOrgCellSizePx = cellPx;
        mCalcSize();
    };
    mGrid.isScreen = function (nRefWidthPx) {
        if (mDebugState.on) return nRefWidthPx == mDebugState.rw;
        //if page is in an iframe the frame is treated as the screen, return true if width of screen is >= to ref width
        var w = (mWin.self == mWin.top ? screen.availWidth : mWin.innerWidth);
        return (w >= mNumber(nRefWidthPx, mRefWidthPx));
    };
    //main    
    mGrid.min = function (nColumns, nRows) {
        mGrid.minLandscape(nColumns, nRows);
        mGrid.minPortrait(nColumns, nRows);
    };
    mGrid.define = function (nElement, nColumn, nRow, nWidth, nHeight, nLayerId) {
        //nElement is element object or id, required        
        //nLayerId is id for existing layer, defaults to jPage 
        //Circular references will cause first encountered item to drop its setting to default. For example, if (a) 
        //specifies a column of before:(b) and (b) specifies a column of after:(a), (a) will adopt the default column.
        mGrid.defineLandscape(nElement, nColumn, nRow, nWidth, nHeight, nLayerId);
        mGrid.definePortrait(nElement, nColumn, nRow, nWidth, nHeight, nLayerId);
    };
    mGrid.defineLayer = function (nId) {
        mLayer(nId, true);
    };
    mGrid.contain = function (nElement, nRemove) {
        //Will prevent element from changing the page size
        //If true, nRemove returns element to default behaviour
        var h = mHolder(mElement(nElement)); if (!h) return;
        h[prop.contain] = !nRemove;
    };
    mGrid.class = function (nClass, nElement) {
        //nElement is element object or id, if not specified then it is jWindow
        //nClass is a css class to be applied to element object's holder 
        mGrid.classLandscape(nClass, nElement);
        mGrid.classPortrait(nClass, nElement);
    };
    mGrid.classLayer = function (nClass, nLayerId) {
        //nLayerId equals existing, otherwise jPage 
        //nClass is a css class to be applied to layer 
        mGrid.classLayerLandscape(nClass, nLayerId);
        mGrid.classLayerPortrait(nClass, nLayerId);
    };        
    mGrid.changeLeft = function (nElement, nLeft) {
        mGrid.changeLandscapeLeft(nElement, nLeft);
        mGrid.changePortraitLeft(nElement, nLeft);
    };
    mGrid.changeTop = function (nElement, nTop) {
        mGrid.changeLandscapeTop(nElement, nTop);
        mGrid.changePortraitTop(nElement, nTop);
    };
    mGrid.changeWidth = function (nElement, nWidth) {
        mGrid.changeLandscapeWidth(nElement, nWidth);
        mGrid.changePortraitWidth(nElement, nWidth);
    };
    mGrid.changeHeight = function (nElement, nHeight) {
        mGrid.changeLandscapeHeight(nElement, nHeight);
        mGrid.changePortraitHeight(nElement, nHeight);
    };
    mGrid.changeLayer = function (nElement, nLayerId) {
        mGrid.changeLandscapeLayer(nElement, nLayerId);
        mGrid.changePortraitLayer(nElement, nLayerId);
    };
    mGrid.setScroll = function (nContext, nElement) {
        //nContext initially disabled, if not specified defaults to auto, unknown values will behave as hidden
        //nElement is element object or id, if not specified defaults to jPage 
        //Where scrollbars will appear define must have min cells or greater, otherwise functional only with wheel/touch (hidden)
        mGrid.setLandscapeScroll(nContext, nElement);
        mGrid.setPortraitScroll(nContext, nElement);
    };
    mGrid.setScrollColor = function (nColor, nElement) {
        //nColor is any valid css color string, otherwise default
        //nElement is element object or id, if not specified defaults to jPage 
        var h = mHolder(mElement(nElement)); if (!h) h = jWindow;
        h[prop.scrollColor] = mString(nColor, val.scrollColor).trim();
    };
    mGrid.update = function () {
        var scY = { holder: mScrollStateY.holder, inner: mScrollStateY.inner, bar: mScrollStateY.bar, bak: mScrollStateY.bak };
        var scX = { holder: mScrollStateX.holder, inner: mScrollStateX.inner, bar: mScrollStateX.bar, bak: mScrollStateX.bak };
        //clear
        mScSysTimeoutClearY();
        mDetachChild(jPage);
        while (jPage.firstChild) jPage.removeChild(jPage.firstChild);
        jPage.style.height = "100%"; jPage.style.width = "100%";
        //initial placements
        mCalcSize();
        mColumnsCount = mCells(mPageStartWidthPx());
        mRowsCount = mCells(mPageStartHeightPx());
        mPlace();
        //mPlace() will not put jPage on page if !mReady
        if (!mReady) return;
        //anchor corrections
        mHolders.forEach(function (h) {
            if (!h[prop.contain]) {
                var eR = h[prop.renderRow] + h[prop.renderHeight]; if (eR > mRowsCount) mRowsCount = eR;
                var eC = h[prop.renderColumn] + h[prop.renderWidth]; if (eC > mColumnsCount) mColumnsCount = eC;
            }
        });
        mSizePage();
        mPlace();
        //scroll
        mPlaceScroll();
        mScSysActivateY(scY.holder, scY.inner, scY.bar, scY.bak);
        mScSysActivateX(scX.holder, scX.inner, scX.bar, scX.bak);
        mScSysActionY(0);
        mScSysActionX(0);
    };
    mGrid.reset = function () {
        //reset will remove all items and place them into the document body
        if (mReady) mElements.forEach(function (e) { mDoc.body.appendChild(e); });
        mElements = []; mHolders = []; mLayers = {}; mElementById = {};
        jPage.style.top = "0"; jPage.style.left = "0";
        mGrid.setScroll(val.scrollDisabled);
        mGrid.update();
    };
    //context    
    mGrid.minLandscape = function (nColumns, nRows) {
        mMinLandColumns = mNumber(nColumns, mMinLandColumns);
        mMinLandRows = mNumber(nRows, mMinLandRows);
    };
    mGrid.minPortrait = function (nColumns, nRows) {
        mMinPortColumns = mNumber(nColumns, mMinPortColumns);
        mMinPortRows = mNumber(nRows, mMinPortRows);
    };
    mGrid.defineLandscape = function (nElement, nColumn, nRow, nWidth, nHeight, nLayerId) {
        var e = mElement(nElement);
        var h = mHolder(e, false, true); if (!h) return;
        h[prop.landColumn] = mString(nColumn, mString(h[prop.renderColumn], "0"));
        h[prop.landRow] = mString(nRow, mString(h[prop.renderRow], "0"));
        h[prop.landWidth] = mString(nWidth, mString(h[prop.renderWidth], val.widthStretch));
        h[prop.landHeight] = mString(nHeight, mString(h[prop.renderHeight], val.heightFlow));
        h[prop.landLayer] = mString(nLayerId, "");
        h[prop.landDefined] = true;
        //see includeFrame()
        var eTag = e.tagName.toLowerCase().trim();
        if (eTag === "iframe") h[prop.hasFrame] = true;
    };
    mGrid.definePortrait = function (nElement, nColumn, nRow, nWidth, nHeight, nLayerId) {
        var e = mElement(nElement);
        var h = mHolder(e, false, true); if (!h) return;
        h[prop.portColumn] = mString(nColumn, mString(h[prop.renderColumn], "0"));
        h[prop.portRow] = mString(nRow, mString(h[prop.renderRow], "0"));
        h[prop.portWidth] = mString(nWidth, mString(h[prop.renderWidth], val.widthStretch));
        h[prop.portHeight] = mString(nHeight, mString(h[prop.renderHeight], val.heightFlow));
        h[prop.portLayer] = mString(nLayerId, "");
        h[prop.portDefined] = true;
        //see includeFrame()
        var eTag = e.tagName.toLowerCase().trim();
        if (eTag === "iframe") h[prop.hasFrame] = true;
    };
    mGrid.classLandscape = function (nClass, nElement) {
        var e = mElement(nElement, !nElement);
        var h = e ? mHolder(e) : jWindow;
        var c = mString(nClass, mString(h[prop.landClass], ""));
        h[prop.landClass] = c;
    };
    mGrid.classPortrait = function (nClass, nElement) {
        var e = mElement(nElement, !nElement);
        var h = e ? mHolder(e) : jWindow;
        var c = mString(nClass, mString(h[prop.portClass], ""));
        h[prop.portClass] = c;
    };
    mGrid.classLayerLandscape = function (nClass, nLayerId) {
        var l = mLayer(nLayerId);
        var c = mString(nClass, mString(l[prop.landClass], ""));
        l[prop.landClass] = c;
    };
    mGrid.classLayerPortrait = function (nClass, nLayerId) {
        var l = mLayer(nLayerId);
        var c = mString(nClass, mString(l[prop.portClass], ""));
        l[prop.portClass] = c;
    };    
    mGrid.changeLandscapeLeft = function (nElement, nLeft) {
        var e = mElement(nElement);
        var h = mHolder(e, true); if (!h) return;
        h[prop.landColumn] = mString(nLeft, mString(h[prop.renderColumn], "0"));
    };
    mGrid.changeLandscapeTop = function (nElement, nTop) {
        var e = mElement(nElement);
        var h = mHolder(e, true); if (!h) return;
        h[prop.landRow] = mString(nTop, mString(h[prop.renderRow], "0"));
    };
    mGrid.changeLandscapeWidth = function (nElement, nWidth) {
        var e = mElement(nElement);
        var h = mHolder(e, true); if (!h) return;
        h[prop.landWidth] = mString(nWidth, mString(h[prop.renderWidth], val.widthStretch));
    };
    mGrid.changeLandscapeHeight = function (nElement, nHeight) {
        var e = mElement(nElement);
        var h = mHolder(e, true); if (!h) return;
        h[prop.landHeight] = mString(nHeight, mString(h[prop.renderHeight], val.heightFlow));
    };
    mGrid.changeLandscapeLayer = function (nElement, nLayerId) {
        var e = mElement(nElement);
        var h = mHolder(e, true); if (!h) return;
        h[prop.landLayer] = mString(nLayerId, "");
    };
    mGrid.changePortraitLeft = function (nElement, nLeft) {
        var e = mElement(nElement);
        var h = mHolder(e, true); if (!h) return;
        h[prop.portColumn] = mString(nLeft, mString(h[prop.renderColumn], "0"));
    };
    mGrid.changePortraitTop = function (nElement, nTop) {
        var e = mElement(nElement);
        var h = mHolder(e, true); if (!h) return;
        h[prop.portRow] = mString(nTop, mString(h[prop.renderRow], "0"));
    };
    mGrid.changePortraitWidth = function (nElement, nWidth) {
        var e = mElement(nElement);
        var h = mHolder(e, true); if (!h) return;
        h[prop.portWidth] = mString(nWidth, mString(h[prop.renderWidth], val.widthStretch));
    };
    mGrid.changePortraitHeight = function (nElement, nHeight) {
        var e = mElement(nElement);
        var h = mHolder(e, true); if (!h) return;
        h[prop.portHeight] = mString(nHeight, mString(h[prop.renderHeight], val.heightFlow));
    };
    mGrid.changePortraitLayer = function (nElement, nLayerId) {
        var e = mElement(nElement);
        var h = mHolder(e, true); if (!h) return;
        h[prop.portLayer] = mString(nLayerId, "");
    };
    mGrid.setScrollX = function (nContext, nElement) {
        mGrid.setLandscapeScrollX(nContext, nElement);
        mGrid.setPortraitScrollX(nContext, nElement);
    };
    mGrid.setScrollY = function (nContext, nElement) {
        mGrid.setLandscapeScrollY(nContext, nElement);
        mGrid.setPortraitScrollY(nContext, nElement);
    };
    mGrid.setLandscapeScroll = function (nContext, nElement) {
        mGrid.setLandscapeScrollY(nContext, nElement);
        mGrid.setLandscapeScrollX(nContext, nElement);
    };
    mGrid.setPortraitScroll = function (nContext, nElement) {
        mGrid.setPortraitScrollY(nContext, nElement);
        mGrid.setPortraitScrollX(nContext, nElement);
    };    
    //sub-context
    mGrid.setLandscapeScrollY = function (nContext, nElement) {
        var h = mHolder(mElement(nElement)); if(!h) h = jWindow;
        h[prop.landScrollY] = mString(nContext, val.scrollAuto).trim().toLowerCase();
        if (mLandscape && mScrollStateY.holder == h) mScSysKillScrollY();
    };
    mGrid.setLandscapeScrollX = function (nContext, nElement) {
        var h = mHolder(mElement(nElement)); if (!h) h = jWindow;
        h[prop.landScrollX] = mString(nContext, val.scrollAuto).trim().toLowerCase();
        if (mLandscape && mScrollStateX.holder == h) mScSysKillScrollX();
    };
    mGrid.setPortraitScrollX = function (nContext, nElement) {        
        var h = mHolder(mElement(nElement)); if (!h) h = jWindow;
        h[prop.portScrollX] = mString(nContext, val.scrollAuto).trim().toLowerCase();
        if (!mLandscape && mScrollStateX.holder == h) mScSysKillScrollX();
    };    
    mGrid.setPortraitScrollY = function (nContext, nElement) {
        var h = mHolder(mElement(nElement)); if (!h) h = jWindow;
        h[prop.portScrollY] = mString(nContext, val.scrollAuto).trim().toLowerCase();
        if (!mLandscape && mScrollStateY.holder == h) mScSysKillScrollY();
    };
    //visibility - auto update
    mGrid.hide = function (nElement) {
        var h = mHolder(mElement(nElement, true)); if (!h) h = jWindow;
        h.style.visibility = "hidden";
    };
    mGrid.show = function (nElement) {
        var h = mHolder(mElement(nElement, true)); if (!h) h = jWindow;
        h.style.visibility = "visible";
    };
    mGrid.toggle = function (nElement) {
        var h = mHolder(mElement(nElement, true)); if (!h) h = jWindow;
        h.style.visibility = (h.style.visibility !== "hidden" ? "hidden" : "visible");
    };
    mGrid.isHidden = function (nElement) {
        var h = mHolder(mElement(nElement, true)); if (!h) h = jWindow;
        return (h.style.visibility === "hidden");
    };
    mGrid.hideLayer = function (nLayerId) {
        var l = mLayer(nLayerId); //jPage in invalid
        l.style.visibility = "hidden";
    };
    mGrid.showLayer = function (nLayerId) {
        var l = mLayer(nLayerId); 
        l.style.visibility = "visible";
    };
    mGrid.toggleLayer = function (nLayerId) {
        var l = mLayer(nLayerId); 
        l.style.visibility = (l.style.visibility !== "hidden" ? "hidden" : "visible");
    };
    mGrid.isHiddenLayer = function (nLayerId) {
        var l = mLayer(nLayerId); 
        return (l.style.visibility === "hidden");
    };
    //pin - auto update - defined
    mGrid.pin = function (nElement, nColumn, nRow) {
        var h = mHolder(mElement(nElement), true);
        if (!h) return;
        //pin, at specified position relative to window 
        var c = mNumber(nColumn, 0), r = mNumber(nRow, 0);
        h.style.left = mPixels(c) + "px";
        h.style.top = mPixels(r) + "px";
        h.style.position = "fixed";
        h[prop.savedColumn] = c; h[prop.savedRow] = r; 
    };
    mGrid.unpin = function (nElement) {
        //put back in layer/jPage
        var h = mHolder(mElement(nElement), true); 
        if (!h || h.style.position !== "fixed") return;
        //reload org column/row
        var c = mNumber(h[prop.renderColumn], 0), r = mNumber(h[prop.renderRow], 0);
        h.style.left = mPixels(c) + "px";
        h.style.top = mPixels(r) + "px";
        h.style.position = "absolute";
    };
    mGrid.pinnedColumn = function (nElement) {
        var h = mHolder(mElement(nElement), true);
        if (!h || h.style.position !== "fixed") return 0;
        return mCells(mScSysBoxX(h));
    };
    mGrid.pinnedRow = function (nElement) {
        var h = mHolder(mElement(nElement), true);
        if (!h || h.style.position !== "fixed") return 0;
        return mCells(mScSysBoxY(h));
    };
    mGrid.isPinned = function (nElement) {
        var h = mHolder(mElement(nElement), true); 
        return (h && h.style.position === "fixed");
    };
    mGrid.pinLayer = function (nLayerId, nColumn, nRow) {
        //jPage cannot be pinned
        var l = mLayer(nLayerId); if (l == jPage) return;
        //pin, at specified position relative to window  
        var c = mNumber(nColumn, 0), r = mNumber(nRow, 0);
        l.style.left = mPixels(c) + "px";
        l.style.top = mPixels(r) + "px";
        l.style.position = "fixed";
    };
    mGrid.unpinLayer = function (nLayerId) {
        //jPage cannot be pinned
        var l = mLayer(nLayerId); 
        if (l != jPage && l.style.position !== "fixed") return;
        //unpin, back to original position
        l.style.top = "0";
        l.style.left = "0";
        l.style.position = "absolute";
    };
    mGrid.pinnedLayerColumn = function (nLayerId) {
        var l = mLayer(nLayerId); 
        if (l.style.position !== "fixed") return 0;
        return mCells(mScSysBoxX(l));
    };
    mGrid.pinnedLayerRow = function (nLayerId) {
        var l = mLayer(nLayerId); 
        if (l.style.position !== "fixed") return 0;
        return mCells(mScSysBoxY(l));
    };
    mGrid.isPinnedLayer = function (nLayerId) {
        var l = mLayer(nLayerId);
        return (l.style.position === "fixed");
    };
    //get element data
    mGrid.get = function (nElement) {
        //input element or id, output element object
        return mElement(nElement);
    };
    mGrid.getDefined = function (nElement) {
        //input element or id, output element object if defined, otherwise null
        var h = mHolder(mElement(nElement), true);
        return h ? mHolderElement(h) : null;
    };
    mGrid.getLayer = function (nElement) {
        var h = mHolder(mElement(nElement), true); if (!h) return "";
        return mString(h[mLandscape ? prop.landLayer : prop.portLayer], "");
    };
    mGrid.getTop = function (nElement) {
        var h = mHolder(mElement(nElement), true); if (!h) return 0;
        return mNumber(h[prop.renderRow], 0);
    };
    mGrid.getLeft = function (nElement) {
        var h = mHolder(mElement(nElement), true); if (!h) return 0;
        return mNumber(h[prop.renderColumn], 0);
    };
    mGrid.getWidth = function (nElement) {
        var h = mHolder(mElement(nElement), true); if (!h) return 0;
        return mNumber(h[prop.renderWidth], 0);
    };
    mGrid.getHeight = function (nElement) {
        var h = mHolder(mElement(nElement), true); if (!h) return 0;
        return mNumber(h[prop.renderHeight], 0);
    };
    mGrid.getRect = function (nElement) {
        var h = mHolder(mElement(nElement), true); if (!h) return [0, 0, 0, 0];
        return [mNumber(h[prop.renderColumn], 0), mNumber(h[prop.renderRow], 0), mNumber(h[prop.renderWidth], 0), mNumber(h[prop.renderHeight], 0)];
    };
    mGrid.getRectPx = function (nElement) {
        var h = mHolder(mElement(nElement), true); if (!h) return [0, 0, 0, 0];
        return [mPixels(mNumber(h[prop.renderColumn], 0)), mPixels(mNumber(h[prop.renderRow], 0)), mPixels(mNumber(h[prop.renderWidth], 0)), mPixels(mNumber(h[prop.renderHeight], 0))];
    };
    mGrid.getPosition = function (nElement) {
        var h = mHolder(mElement(nElement), true); if (!h) return [0, 0];
        return [mNumber(h[prop.renderColumn], 0), mNumber(h[prop.renderRow], 0)];
    };
    mGrid.getPositionPx = function (nElement) {
        var h = mHolder(mElement(nElement), true); if (!h) return [0, 0];
        return [mPixels(mNumber(h[prop.renderColumn], 0)), mPixels(mNumber(h[prop.renderRow], 0))];
    };
    mGrid.getSize = function (nElement) {
        var h = mHolder(mElement(nElement), true); if (!h) return [0, 0];
        return [mNumber(h[prop.renderWidth], 0), mNumber(h[prop.renderHeight], 0)];
    };
    mGrid.getSizePx = function (nElement) {
        var h = mHolder(mElement(nElement), true); if (!h) return [0, 0];
        return [mPixels(mNumber(h[prop.renderWidth], 0)), mPixels(mNumber(h[prop.renderHeight], 0))];
    };
    mGrid.getClass = function (nElement) {
        var e = mElement(nElement, !nElement);
        var h = e ? mHolder(e) : jWindow;
        return mString(h[mLandscape ? prop.landClass : prop.portClass], "")
    };
    mGrid.getClassLayer = function (nLayerId) {
        var l = mLayer(nLayerId); 
        return mString(l[mLandscape ? prop.landClass : prop.portClass], "")
    };
    //get page data
    mGrid.getPageTop = function () {
        return mCells(mScSysBoxY(jPage));
    };
    mGrid.getPageLeft = function () {
        return mCells(mScSysBoxX(jPage));
    };    
    mGrid.getPageWidth = function () {
        return mColumnsCount; 
    };
    mGrid.getPageHeight = function () {
        return mRowsCount; 
    };
    //get window data
    mGrid.getWindowWidth = function () {
        return mCells(mWin.innerWidth);
    };
    mGrid.getWindowHeight = function () {
        return mCells(mWin.innerHeight);
    };
    mGrid.isLandscape = function () {
        return mWin.innerWidth > mWin.innerHeight;
    };
    //get screen data
    mGrid.getScreenWidth = function () {
        return mCells(screen.availWidth);
    };
    mGrid.getScreenHeight = function () {
        return mCells(screen.availHeight);
    };
    mGrid.getScreenWidthPx = function () {
        return screen.availWidth;
    };
    mGrid.getScreenHeightPx = function () {
        return screen.availHeight;
    };
    //get cell data
    mGrid.getOrgCellSizePx = function () {
        return mOrgCellSizePx;
    };
    mGrid.getCurrCellSizePx = function () {
        return mCurrCellSizePx;
    };
    mGrid.getCurrCellSizeFactor = function () {
        return mCurrCellSizePx / mOrgCellSizePx;
    };
    mGrid.pixels = function (nCells) {
        return mPixels(nCells);
    };
    mGrid.cells = function (nPixels) {
        return mCells(nPixels);
    };
    //set global values
    mGrid.setWindowColor = function (nColor) {
        val.windowColor = mString(nColor, val.windowColor).trim();
        jWindow.style.backgroundColor = val.windowColor;
    };
    mGrid.setGlobalScrollTimers = function (nAutoHideSeconds, nScrollsPerSecond, nScrollCells) {
        //nAutoHideSeconds is number of inactivity seconds before auto-appearing scrollbar disappears  
        //nScrollsPerSecond is the number of times per second the scroll action occurs when user holds plus/minus buttons
        //nScrollCells is the number of cells to scroll per action (scroll speed)
        nAutoHideSeconds = mNumber(nAutoHideSeconds, 0);
        nScrollsPerSecond = mNumber(nAutoHideSeconds, 0);
        nScrollCells = mNumber(nScrollCells, 0);
        if (nAutoHideSeconds > 0) val.scrollAutoSeconds = nAutoHideSeconds;
        if (nScrollsPerSecond > 0) val.scrollFps = nScrollsPerSecond;
        if (nScrollCells > 0) val.scrollCells = nScrollCells;
    };
    mGrid.setGlobalScrollStyle = function (nDefaultColor, nRounded, nOutlined, nOpacity) {
        //parameters retain previous values if arguments not valid        
        //color, shape, and outline
        val.scrollColor = mString(nDefaultColor, val.scrollColor).trim();
        if (typeof nRounded === "boolean") val.scrollRounded = nRounded;
        if (typeof nOutlined === "boolean") val.scrollOutlined = nOutlined;
        //opacity, back opacity is always half of opacity
        nOpacity = mNumber(nOpacity, 0);        
        if (nOpacity >= 0.25 && nOpacity <= 1) val.scrollOpacity = nOpacity; //must be from 0.25 to 1, inclusive
        val.scrollBackOpacity = nBackOpacity = val.scrollOpacity / 2;
    };
    mGrid.setGlobalScrollWidth = function (nWidth) {
        //half cell min, otherwise retains previous value
        nWidth = mNumber(nWidth, 0);
        if (nWidth >= 0.5) val.scrollWidth = nWidth; 
    };
    mGrid.setReadyMilliseconds = function (nTime) {
        val.layoutSecureMs = mNumberNatural(nTime, val.layoutSecureMs);
    };
    //scroll
    mGrid.pageScrollX = function (nCells, nElement) {
        //if !nElement moves nCells from current position, otherwise moves to nElement + nCells
        nCells = mNumber(nCells, 0);
        if (!nElement) { mScSysPlaceX(jWindow, jPage, mPixels(nCells)); return; };
        var l = -mGrid.getLeft(nElement), preLeft = mCells(mScSysBoxX(jPage));
        mScSysPlaceX(jWindow, jPage, mPixels(l - preLeft + nCells));
    };
    mGrid.pageScrollY = function (nCells, nElement) {
        //if !nElement moves nCells from current position, otherwise moves to nElement top + nCells
        nCells = mNumber(nCells, 0);
        if (!nElement) { mScSysPlaceY(jWindow, jPage, mPixels(nCells)); return; };
        var t = -mGrid.getTop(nElement), preTop = mCells(mScSysBoxY(jPage));
        mScSysPlaceY(jWindow, jPage, mPixels(t - preTop + nCells));
    };
    mGrid.scrollY = function (nElement, nCells) {
        //Scrolls nElement by nCells from current position
        var h = mHolder(mElement(nElement));
        if (!h || !h[prop.innerHolder]) return;
        mScSysPlaceY(h, h[prop.innerHolder], mPixels(nCells));
    };
    mGrid.scrollX = function (nElement, nCells) {
        //Scrolls nElement by nCells from current position
        var h = mHolder(mElement(nElement));
        if (!h || !h[prop.innerHolder]) return;
        mScSysPlaceX(h, h[prop.innerHolder], mPixels(nCells));
    };
    mGrid.getScrollTop = function (nElement) {
        //returns top of scroll content, nElement defaults to jPage with jWindow as holder
        var h = mHolder(mElement(nElement, true)); if (!h) h = jWindow;
        var b = h[prop.innerHolder]; if (!b) return 0;
        return mCells(mScSysBoxY(b));
    };
    mGrid.getScrollLeft = function (nElement) {
        //returns left of scroll content, nElement defaults to jPage with jWindow as holder
        var h = mHolder(mElement(nElement, true)); if (!h) h = jWindow;
        var b = h[prop.innerHolder]; if (!b) return 0;
        return mCells(mScSysBoxX(b));
    };
    mGrid.getScrollTopEnd = function (nElement) {
        //returns top boundry of scroll content, nElement defaults to jPage with jWindow as holder
        var h = mHolder(mElement(nElement, true)); if (!h) h = jWindow;
        var b = h[prop.innerHolder]; if (!b) return 0;
        return -mCells(mScSysSpaceY(h, b));
    };
    mGrid.getScrollLeftEnd = function (nElement) {
        //returns left boundry of scroll content, nElement defaults to jPage with jWindow as holder
        var h = mHolder(mElement(nElement, true)); if (!h) h = jWindow;
        var b = h[prop.innerHolder]; if (!b) return 0;
        return -mCells(mScSysSpaceX(h, b));
    };
    mGrid.relinquishScroll = function () {
        mScSysKillScrollX();
        mScSysKillScrollY();
    };
    //iframes
    mGrid.hasFrame = function (nElement, nFlag) {        
        //Treats the element as it would an iframe, see includeFrame()
        //nFlag is optional, defaults to true
        var e = mElement(nElement); var h = mHolder(e); if (!h) return; 
        if (typeof nFlag !== "boolean") nFlag = true;
        h[prop.hasFrame] = nFlag;
    };
    mGrid.includeFrame = function (nElement) {
        //nElement is element object or id, required and must be an iFrame
        //Normally elements are included via mPlace(), iFrames are not as they would reload on every resize
        //includeFrame() must be called on every resize if including the iFrame is desired
        var e = mElement(nElement); var h = mHolder(e); if (!h) return;
        if (h[prop.hasFrame]) h.appendChild(e); //holder already in layer, see mPlace()
    };
    //events
    mGrid.onReady = function (nHandler) {
        //nHandler is a function, passed three arguments 
        //-cellSizePx: the new cell size in pixels, calculated using original cell size to ref width factor 
        //-columns: the new width in cells
        //-rows: the new height in cells
        if (!nHandler) { mOnReady = null; return; }
        if (typeof nHandler === "function") mOnReady = nHandler;
    };
    mGrid.onScroll = function (nHandler) {
        //nHandler is a function, passed four arguments 
        //-element: which is an id if it has one, otherwise the element itself, null if scroll is for page
        //-axis: string x or y
        //-factor: factor of scroll completeion (0.0 to 1.0, where 1.0 is at bottom)
        //-direction: the direction page content last moved (-1 or 1)
        if (!nHandler) { mOnScroll = null; return; }
        if (typeof nHandler === "function") mOnScroll = nHandler;
    };
    mGrid.onResize = function (nHandler) {
        //nHandler is a function, passed three arguments 
        //-cellSizePx: the new cell size in pixels, calculated using original cell size to ref width factor 
        //-columns: the new width in cells
        //-rows: the new height in cells
        if (!nHandler) { mOnResize = null; return; }
        if (typeof nHandler === "function") mOnResize = nHandler;
    };
    mGrid.onBeforeResize = function (nHandler) {
        //nHandler is a function, passed three arguments 
        //-cellSizePx: the old cell size in pixels, calculated using original cell size to ref width factor 
        //-columns: the old width in cells
        //-rows: the old height in cells
        if (!nHandler) { mOnBeforeResize = null; return; }
        if (typeof nHandler === "function") mOnBeforeResize = nHandler;
    };
    //
    //Add handlers and expose jAbsolute and jAbs to the global object    
    var fixBounce = function () {
        try {
            mDoc.body.scrollTop = 0; mDoc.body.scrollLeft = 0;
            mDoc.body.clientHeight = mWin.innerHeight; mDoc.body.clientWidth = mWin.innerWidth;
        } catch (e) { }
    };
    var detectTouch = function () { mHasTouch = true; mWin.removeEventListener("touchstart", detectTouch); };
    mWin.addEventListener("touchstart", detectTouch);
    //mousewheel for IE9, Chrome, Safari, Opera //DOMMouseScroll for Firefox            
    mWin.addEventListener("mousewheel", mScSysActionWheelXY); 
    mWin.addEventListener("DOMMouseScroll", mScSysActionWheelXY);
    mWin.addEventListener("keydown", mScSysActionKeyXY);
    mWin.addEventListener("mousemove", mScSysActionBarMoveXY);
    mWin.addEventListener("mouseup", mScSysIntervalClearXY);    
    mWin.addEventListener("touchmove", function (e) { e.preventDefault(); fixBounce(); mScSysActionTouchMoveXY(e); }, true);
    mWin.addEventListener("touchend", function () { fixBounce(); mScSysIntervalClearXY(); });
    mWin.addEventListener("resize", function () {
        if (mResizeTimeout) { clearTimeout(mResizeTimeout); mResizeTimeout = null; }
        mResizeTimeout = setTimeout(function () {
            mResizeTimeout = null;
            if (mOnBeforeResize) mOnBeforeResize(mCurrCellSizePx, mColumnsCount, mRowsCount);
            mGrid.update();
            if (mOnResize) mOnResize(mCurrCellSizePx, mColumnsCount, mRowsCount);
        }, val.resizeDelayMs);
    });
    //Firefox needs dragend handler to kill scrolling properly, svg related
    mWin.addEventListener("dragend", mScSysIntervalClearXY);
    //IE fails to kill selection in mScSysClearSelectXY() without a handler, svg related
    mDoc.addEventListener("selectstart", function (nEvent) { if (mScrollStateY.down || mScrollStateX.down) nEvent.preventDefault(); });
    //Expose jAbsolute and jAbs to the global object    
    mWin.jAbsolute = mWin.jAbs = mGrid;
})();
