//HTML5 (IE 9+) compatibility check
var gVal;
if (!window.jAbsolute || !window.canvasLib) {
    document.getElementById("noJabs").style.display = "block";
} else {
    gVal = {
        refWidth: 1920, refHeight: 1080, cellSize: 32, cellSizeMin: 8,
        cnvRefSize: 960, cnvFps: 30,
        cnvCenter: 480, titleBot: 460, loadingCenterY: 562, playTop: 500,
        stateSetupGame: 0, stateLoading: 1, stateSetupMenu: 2, stateMenu: 3, stateSetupPlay: 4, statePlay: 5, stateSetupOver: 6, stateOver: 7,
        stateDelegates: [handleSetupGame, handleLoading, handleSetupMenu, handleMenu, handleSetupPlay, handlePlay, handleSetupOver, handleOver],        
        musicFade: 0.01, landIcoSz: 4, portIcoSz: 7.1112,
        freeHints: 3, freeTime: 3, addTime: 450, maxTime: 2700, linkPoints: 20,

        currSoundOn: false, canLoadSound: false, loopPlay: false,
        currCnvSz: 960, currCnvX: 480, currCnvY: 60, 
        currLevel: 1, currScore: 0, currTime: 2700, currFreeHint: 3, currFreeTime: 3,
        frames: 1, state: 0, objects: {title:null, loading:null, play:null, board:null}
    };
    setupPage();
}

//Setup page using jAbsolute and CanvasLib
function setupPage() {
    jAbs.size(gVal.cellSize, gVal.refWidth, gVal.cellSizeMin, gVal.cellSize);
    jAbs.setWindowColor("#f0f9fc");

    //Background
    var landH = 16, portH = 28.4448;
    jAbs.definePortrait("divClouds", "left", "top", "stretch", portH);
    jAbs.definePortrait("divMountains", "left", "end:divHills:-17.778", "stretch", portH);
    jAbs.definePortrait("divHills", "left", "bottom", "stretch", portH);
    jAbs.defineLandscape("divClouds", "left", "top", "stretch", landH);
    jAbs.defineLandscape("divMountains", "left", "end:divHills:-10", "stretch", landH);
    jAbs.defineLandscape("divHills", "left", "bottom", "stretch", landH);

    //Canvas        
    var percent = (gVal.cnvRefSize / gVal.refHeight) * 100;
    jAbs.definePortrait("cnv", "center", "center", "percent:" + percent + ":-7.1112", "width");
    jAbs.defineLandscape("cnv", "center", "center", "height", "percent:" + percent + ":-4");
    cLib.initialize(jAbs.get("cnv"), gVal.currCnvSz, gVal.currCnvSz, gVal.cnvFps);

    //Labels and buttons   
    var portSz = gVal.portIcoSz, landSz = gVal.landIcoSz;
    jAbs.definePortrait("divScore", "equal:divTime:1", "before:cnv:-0.5", "percent:cnv:60", "flow");
    jAbs.definePortrait("divLevel", "end:cnv:-0.5", "between:divScore", "percent:cnv:40", "flow");
    jAbs.definePortrait("divTime", "before:cnv:-1.7778", "equal:cnv", portSz, "equal:cnv");
    jAbs.definePortrait("divIcoTime", "equal:divTime", "after:cnv:1.7778", portSz, portSz);
    jAbs.definePortrait("divIcoHint", "equal:cnv", "after:cnv:1.7778", portSz, portSz);
    jAbs.definePortrait("divIcoExit", "end:cnv", "after:cnv:1.7778", portSz, portSz);
    jAbs.definePortrait("divIcoReset", "before:divIcoExit:-1.7778", "after:cnv:1.7778", portSz, portSz);
    jAbs.definePortrait("divIcoSound", "before:divIcoReset:-1.7778", "after:cnv:1.7778", portSz, portSz);

    jAbs.defineLandscape("divScore", "equal:divTime:0.56249", "before:cnv:-0.28125", "percent:cnv:60", "flow");
    jAbs.defineLandscape("divLevel", "end:divIcoExit:-0.28125", "between:divScore", "percent:cnv:40", "flow");
    jAbs.defineLandscape("divTime", "before:cnv:-1", "equal:cnv", landSz, "equal:cnv:-" + (landSz+1));
    jAbs.defineLandscape("divIcoTime", "equal:divTime", "after:divTime:1", landSz, landSz);
    jAbs.defineLandscape("divIcoHint", "after:cnv:1:", "end:cnv", landSz, landSz);
    jAbs.defineLandscape("divIcoExit", "after:cnv:1", "equal:cnv", landSz, landSz);
    jAbs.defineLandscape("divIcoReset", "after:cnv:1", "after:divIcoExit:1", landSz, landSz);
    jAbs.defineLandscape("divIcoSound", "after:cnv:1", "after:divIcoReset:1", landSz, landSz);
    hideGameUi();

    //Cover layers
    jAbs.defineLayer("over");    
    jAbs.define("divOver", "equal:cnv", "equal:cnv", "equal:cnv", "equal:cnv", "over");
    jAbs.classLayer("layerOver", "over");
    jAbs.hideLayer("over");

    jAbs.defineLayer("msg");
    jAbs.define("divMsg", "equal:cnv", "equal:cnv", "equal:cnv", "equal:cnv", "msg");
    jAbs.classLayer("layerMsg", "msg");
    jAbs.hideLayer("msg");

    jAbs.defineLayer("snd");
    jAbs.define("divSnd", "equal:cnv", "equal:cnv", "equal:cnv", "equal:cnv", "snd");
    jAbs.classLayer("layerSnd", "snd");
    jAbs.hideLayer("snd");

    //Page containers
    jAbs.class("jabs");
    jAbs.classLayerLandscape("jabsLand");
    jAbs.classLayerPortrait("jabsPort");
    jAbs.update();
    sizeCanvas();

    //Preload hidden non-wait assets
    cLib.preloadImage("Images/Help.png");
    cLib.preloadImage("Images/Mute.png");
    cLib.preloadImage("Images/Sound.png");    
    cLib.preloadImage("Images/Exit.png");
    cLib.preloadImage("Images/Hint.png");
    cLib.preloadImage("Images/Reset.png");
    cLib.preloadImage("Images/Time.png");
    cLib.preloadImage("Images/Menu.png");
    cLib.preloadImage("Images/Okay.png");    

    //Load and wait for initial assets    
    cLib.loadSprite("title", "Images/Title.png");
    cLib.loadSprite("loading", "Images/Loading.png");
    cLib.loadScript("classes", "Scripts/PrimaryClasses.js");

    //On document ready
    jAbs.onReady(function () {        
        //CanvasLib handlers
        cLib.onLoaded(function (count) {
            if (count === 1) {
                //load more assets
                cLib.loadSprite("cards", "Images/Cards.png");
                cLib.loadSprite("play", "Images/Play.png");
                cLib.loadSprite("level", "Images/Level.png");
                //Frame callbacks
                cLib.beforeFrame(function (f) { gVal.frames = f; });
                cLib.onFrame(function () { cLib.clear(); gVal.stateDelegates[gVal.state](); });
                cLib.renderFrame();
            } else if (count === 2) {
                //Loaded assets, proceed to menu 
                gVal.state = gVal.stateSetupMenu;
                cLib.onLoaded(function () {
                    //IE will not download sound file if no audio device to play it, thus [canplaythrough] event never fires (tested IE 11)
                    //Current solution is to try loading a sound after vital resources downloaded, in this case loading [tick] will fire this event
                    gVal.canLoadSound = true;
                    gVal.currSoundOn = true;
                    icoSoundOn();
                    cLib.onLoaded(null);
                    cLib.loadSound("loop", "Sounds/Loop.mp3");
                    cLib.loadSound("bad", "Sounds/Bad.mp3");
                    cLib.loadSound("good", "Sounds/Good.mp3");
                    cLib.loadSound("level", "Sounds/Level.mp3");
                    cLib.loadSound("over", "Sounds/Over.mp3");
                    cLib.loadSound("pop", "Sounds/Pop.mp3");
                    cLib.loadSound("time", "Sounds/Time.mp3"); 
                });
                //[tick] is the first sound used, when user hits [play]
                cLib.loadSound("tick", "Sounds/Tick.mp3");                
            }
        });
        sizeCanvas();

        //jAbsolute handlers
        jAbs.onResize(function () {
            sizeCanvas();
            cLib.renderFrame();
        });
    });
}

//Game loop
function handleSetupGame() {
    gVal.objects.title = new Title(gVal.cnvCenter, gVal.titleBot, gVal.cnvRefSize);
    gVal.objects.loading = new Loading(gVal.cnvCenter, gVal.loadingCenterY, gVal.cnvRefSize);

    jAbs.get("cnv").addEventListener("click", canvasClick);
    jAbs.get("divOverReset").addEventListener("click", resetClick);
    jAbs.get("divOverExit").addEventListener("click", exitClick);
    jAbs.get("divIcoSound").addEventListener("click", soundClick);    
    jAbs.get("divIcoReset").addEventListener("click", resetClick);
    jAbs.get("divIcoExit").addEventListener("click", exitClick);
    jAbs.get("divIcoHint").addEventListener("click", hintClick);
    jAbs.get("divIcoTime").addEventListener("click", timeClick);
    jAbs.get("divMsg").addEventListener("click", okayClick);
    jAbs.get("divSndOkay").addEventListener("click", okayClick);

    gVal.state = gVal.stateLoading;
    handleLoading();
}

function handleLoading() {
    gVal.objects.title.advance(gVal.frames);
    gVal.objects.loading.advance(gVal.frames);

    gVal.objects.title.draw(gVal.currCnvSz);
    gVal.objects.loading.draw(gVal.currCnvSz);
}

function handleSetupMenu() {
    handleLoading();
    if (!gVal.objects.loading.isComplete()) return;
    gVal.objects.play = new Button(gVal.cnvCenter, gVal.playTop, gVal.cnvRefSize, "play");
    gVal.state = gVal.stateMenu;
}

function handleMenu() {
    processMusicLoop();
    gVal.objects.title.advance(gVal.frames);
    gVal.objects.title.draw(gVal.currCnvSz);
    gVal.objects.play.draw(gVal.currCnvSz);
}

function handleSetupPlay() {
    //coming from menu, gameover, or level-up
    gVal.currTime = gVal.maxTime;
    fillTime(0);

    gVal.objects.board = new Board(matchHandler, clearHandler, gVal.currLevel);
    showGameUi();    
    
    gVal.loopPlay = true;
    if (cLib.isSoundPaused("loop")) {
        if (!(jAbs.isHiddenLayer("msg") && jAbs.isHiddenLayer("snd"))) 
            processMusicLoop(); //Mobile audio trigger during click event
    }
    gVal.state = gVal.statePlay;
    handlePlay();
}

function handlePlay() {
    var isOver = false;
    if (jAbs.isHiddenLayer("msg") && jAbs.isHiddenLayer("snd")) {
        processMusicLoop();
        gVal.objects.board.advance(gVal.frames);
        isOver = processTime();
    }
    gVal.objects.board.draw(gVal.currCnvSz);
    if (isOver) gVal.state = gVal.stateSetupOver;
}

function handleSetupOver() {
    cLib.playSound("over");    
    jAbs.showLayer("over");

    gVal.loopPlay = false;
    gVal.state = gVal.stateOver;
    handleOver();
}

function handleOver() {
    processMusicLoop();
    gVal.objects.board.draw(gVal.currCnvSz);
}

//Board handlers
function matchHandler() {
    gVal.currScore += gVal.linkPoints;
    updateLabels();
}

function clearHandler() {
    gVal.currLevel++; //level pass
    gVal.currFreeHint++; //extra hint item for level pass
    gVal.currFreeTime++; //extra time item for level pass
    gVal.state = gVal.stateSetupPlay;
    updateLabels();
}

//Ui handlers
function hintClick() {
    if (gVal.currFreeHint > 0 && gVal.objects.board.giveHint()) {
        gVal.currFreeHint--;
        cLib.playSound("tick");
        updateLabels();
        return;
    }
    cLib.playSound("bad");
}

function timeClick() {
    if (gVal.currFreeTime > 0 && gVal.currTime < gVal.maxTime) {
        gVal.currTime += gVal.addTime;
        if (gVal.currTime > gVal.maxTime)
            gVal.currTime = gVal.maxTime;
        gVal.currFreeTime--;        
        cLib.playSound("time");
        updateLabels();
        return;
    }
    cLib.playSound("bad");
}

function resetClick() {
    gVal.currLevel = 1;
    gVal.currScore = 0;
    gVal.currFreeHint = gVal.freeHints;
    gVal.currFreeTime = gVal.freeTime;
    updateLabels();
    cLib.playSound("tick");

    gVal.state = gVal.stateSetupPlay;
    jAbs.hideLayer("over");    
    cLib.renderFrame();
}

function exitClick() {
    gVal.currLevel = 1;
    gVal.currScore = 0;
    gVal.currFreeHint = gVal.freeHints;
    gVal.currFreeTime = gVal.freeTime;
    //updateLabels() on showGameUi() again
    cLib.playSound("tick");

    gVal.loopPlay = false;
    gVal.state = gVal.stateMenu;    
    jAbs.hideLayer("over");    
    hideGameUi();
    cLib.renderFrame();
}

function soundClick() {
    if (gVal.currSoundOn) {
        gVal.currSoundOn = false;
        cLib.setVolume(0);
        icoSoundOff();
    } else if (gVal.canLoadSound) {
        gVal.currSoundOn = true;
        cLib.setVolume(1);
        icoSoundOn();
        cLib.playSound("tick");
    } else {
        jAbs.showLayer("snd");
    }
}

function okayClick() {
    jAbs.hideLayer("msg");
    jAbs.hideLayer("snd");
    cLib.playSound("tick");
}

function canvasClick(nEvent) {
    if (gVal.state !== gVal.statePlay && gVal.state !== gVal.stateMenu)
        return;
    var x = nEvent.pageX - gVal.currCnvX;
    var y = nEvent.pageY - gVal.currCnvY;
    if (gVal.state === gVal.statePlay) {
        gVal.objects.board.clickEvent(x, y, gVal.currCnvSz);
    } else if (gVal.objects.play.hitTest(x, y, gVal.currCnvSz)) { //gVal.stateMenu
        cLib.playSound("tick");
        jAbs.showLayer("msg"); //only show help when entering from menu
        gVal.state = gVal.stateSetupPlay;
        cLib.renderFrame();
    }
}

//Game helpers
function sizeCanvas() {
    var rect = jAbs.getRectPx("cnv");
    gVal.currCnvSz = rect[2];
    gVal.currCnvX = rect[0];
    gVal.currCnvY = rect[1];
    cLib.resize(gVal.currCnvSz, gVal.currCnvSz);
}

function processTime() {
    gVal.currTime -= gVal.frames;
    if (gVal.currTime < 0) gVal.currTime = 0;

    fillTime((1 - gVal.currTime / gVal.maxTime) * 100);
    return gVal.currTime == 0;
}

function processMusicLoop() {
    var id = "loop";
    if (gVal.loopPlay && gVal.currSoundOn) {
        if (cLib.isSoundPaused(id)) {
            cLib.setVolume(0, id);
            cLib.playSound(id, true);
        } else {
            var v = cLib.getVolume(id);
            if (v < 1) v += gVal.musicFade;
            cLib.setVolume((v > 1 ? 1 : v), id);
        }
    } else {
        if (!cLib.isSoundPaused(id)) {
            var v = cLib.getVolume(id);
            if (v > 0) v -= gVal.musicFade;
            cLib.setVolume((v < 0 ? 0 : v), id);
        }
    }
}

function hideGameUi() {
    jAbs.hide("divScore");
    jAbs.hide("divLevel");
    jAbs.hide("divTime");
    jAbs.hide("divIcoTime");
    jAbs.hide("divIcoHint");
    jAbs.hide("divIcoExit");
    jAbs.hide("divIcoReset");
    jAbs.hide("divIcoSound");
    jAbs.changePortraitLeft("cnv", "center");
    jAbs.update();
    sizeCanvas();
}

function showGameUi() {
    jAbs.changePortraitLeft("cnv", "center:" + (gVal.portIcoSz / 2));
    jAbs.update();
    sizeCanvas();
    updateLabels();
    jAbs.show("divScore");
    jAbs.show("divLevel");
    jAbs.show("divTime");
    jAbs.show("divIcoTime");
    jAbs.show("divIcoHint");
    jAbs.show("divIcoExit");
    jAbs.show("divIcoReset");
    jAbs.show("divIcoSound");
}

//css and html alterations
function fillTime(percent) {
    jAbs.get("divTimeFill").style.top = percent + "%";
}

function icoSoundOff() {
    jAbs.get("divIcoSound").className = "off";
}

function icoSoundOn() {
    jAbs.get("divIcoSound").className = "on";
}

function updateLabels() {
    jAbs.get("divScore").textContent = gVal.currScore;
    jAbs.get("spanLevel").textContent = gVal.currLevel;
    jAbs.get("spanPowHint").textContent = gVal.currFreeHint;
    jAbs.get("spanPowTime").textContent = gVal.currFreeTime;
}




