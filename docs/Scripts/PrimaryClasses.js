(function (nWin) {
    //Static helpers
    function getRectCnvCoords(nX, nY, nW, nH, nRefSz) {
        return [nX/nRefSz, nY/nRefSz, nW/nRefSz, nH/nRefSz];
    }

    function getSpriteCnvCoords(nX, nY, nSprite, nRefSz) {
        var wh = cLib.getSpriteSize(nSprite);
        return getRectCnvCoords(nX, nY, wh[0], wh[1], nRefSz);
    }

    ///////////////////////////////////////////////////
    //Title class
    nWin.Title = (function (parent) {
        Title.prototype = new cLib.gameObject();
        Title.prototype.constructor = Title;

        //static
        var val = {
            flyMax: 0.005, flyInc: 0.0005
        };
        function Title(cX, bY, nRefSz) {
            var xywh = getSpriteCnvCoords(cX, bY, "title", nRefSz);
            parent.call(this, xywh[0]-xywh[2]/2, xywh[1]-xywh[3], xywh[2], xywh[3]);
            //members
            this.mFly = 0;
            this.mDir = 1;
        }

        Title.prototype.draw = function (cnvSz) {
            var c = this.getCoords();
            cLib.drawSprite("title", c[0]*cnvSz, (c[1] + this.mFly)*cnvSz, c[2]*cnvSz, c[3]*cnvSz);
        };
        Title.prototype.advance = function (frames) {
            this.mFly += val.flyInc * frames * this.mDir;
            if ((this.mDir === -1 && this.mFly < -val.flyMax) || this.mDir === 1 && this.mFly > val.flyMax)
                this.mDir *= -1;
        };

        return Title;
    })(cLib.gameObject);
    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    //Button class
    nWin.Button = (function (parent) {
        Button.prototype = new cLib.gameObject();
        Button.prototype.constructor = Button;

        //static
        function Button(cX, tY, nRefSz, nSprite) {
            var xywh = getSpriteCnvCoords(cX, tY, nSprite, nRefSz);
            parent.call(this, xywh[0]-xywh[2]/2, xywh[1], xywh[2], xywh[3]);
            //members
            this.mSprite = nSprite;
        }

        Button.prototype.draw = function (cnvSz) {
            var c = this.getCoords();
            cLib.drawSprite(this.mSprite, c[0]*cnvSz, c[1]*cnvSz, c[2]*cnvSz, c[3]*cnvSz); 
        };        
        Button.prototype.hitTest = function (nX, nY, cnvSz) {
            var rect = this.getCoords();
            return cLib.rectHitPoint(rect[0]*cnvSz, rect[1]*cnvSz, rect[2]*cnvSz, rect[3]*cnvSz, nX, nY);
        };

        return Button;
    })(cLib.gameObject);
    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    //Loading class
    nWin.Loading = (function (parent) {
        Loading.prototype = new cLib.gameObject();
        Loading.prototype.constructor = Loading;

        //static
        var val = {
            rotSpeed: 16
        };
        function Loading(cX, cY, nRefSz) {
            var xywh = getSpriteCnvCoords(cX, cY, "loading", nRefSz);
            parent.call(this, xywh[0]-xywh[2]/2, xywh[1]-xywh[3]/2, xywh[2], xywh[3]);
            //members
            this.mAngle = 0;
            this.mComplete = false;
        }

        Loading.prototype.draw = function (cnvSz) {
            var c = this.getCoords();
            var x = c[0] * cnvSz, y = c[1] * cnvSz;
            var w = c[2] * cnvSz, h = c[3] * cnvSz;
            var pY = y + w / 1.75;
            cLib.drawSprite("loading", x+w/2, y, w, h, { rotate: this.mAngle, pivotY:pY  });
            cLib.drawSprite("loading", x-w/2, y, w, h, { rotate: -this.mAngle, pivotY:pY });
        };
        Loading.prototype.advance = function (frames) {
            this.mAngle += val.rotSpeed * frames;
            if (this.mAngle >= 360) { this.mAngle -= 360; this.mComplete = true; }
        };
        Loading.prototype.isComplete = function () {
            //just a stall so loading shows for at least one spin, prevents flicker
            return this.mComplete;
        };

        return Loading;
    })(cLib.gameObject);
    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    //Private pop class
    var Pop = (function (parent) {
        Pop.prototype = new cLib.gameObject();
        Pop.prototype.constructor = Pop;

        //static
        var val = {
            fallSpeed: 0.02, fallInc: 0.01
        };
        function Pop(col, row, sz, refSz, mapCol, mapRow, ang) {
            var xywh = getRectCnvCoords(col*sz, row*sz, sz, sz, refSz);
            parent.call(this, xywh[0], xywh[1], xywh[2], xywh[3]);
            //members
            this.mSpeed = -val.fallSpeed;
            this.mComplete = false;
            this.mAngle = ang;
            this.mMapCell = [mapCol, mapRow];
        }

        Pop.prototype.draw = function (cnvSz, sheet) {
            var c = this.getCoords();
            var clip = sheet.getClipForCell(this.mMapCell[0], this.mMapCell[1]);            
            cLib.drawSprite(sheet.getSprite(), c[0]*cnvSz, c[1]*cnvSz, c[2]*cnvSz, c[3]*cnvSz, {rotate: this.mAngle}, clip);
        };
        Pop.prototype.advance = function (frames) {
            if (this.mComplete) return;
            this.get.y += this.mSpeed * frames;
            this.mSpeed += val.fallInc * frames; 
            if (this.get.y >= 1.5) this.mComplete = true;
        };
        Pop.prototype.isComplete = function () {
            return this.mComplete;
        };

        return Pop;
    })(cLib.gameObject);
    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    //Private level-up class
    var Level = (function (parent) {
        Level.prototype = new cLib.gameObject();
        Level.prototype.constructor = Level;

        //static
        var val = {
            flySpeed: 0.02, flyInc: 0.01,
            delayPos: 0.4, delayCenter: 20, maxPop: 0.05
        };
        function Level() {
            var wh = cLib.getSpriteSize("level");
            parent.call(this, 0.5, 1, 1, wh[1]/wh[0]); //wh[0] is refSz (spans canvas)
            //members
            this.mSpeed = -val.flySpeed;
            this.mDelay = 0;
            this.mPop = 0;
            this.mComplete = false;
            //single run
            cLib.playSound("level");
        }

        Level.prototype.draw = function (cnvSz) {
            if (this.mComplete) return;
            var c = this.getCoords();
            var w = (c[2] + this.mPop) * cnvSz;
            var h = (c[3] + (this.mPop * (c[3] / c[2]))) * cnvSz;
            cLib.drawSprite("level", c[0]*cnvSz-w/2, c[1]*cnvSz, w, h);
        };
        Level.prototype.advance = function (frames) {
            if (this.mComplete) return;            
            if (this.get.y < val.delayPos && this.mDelay < val.delayCenter) {
                this.mDelay += frames;
                this.mPop = cLib.randomFloat(val.maxPop);
            } else {
                this.get.y -= this.mSpeed * frames;
                this.mSpeed += val.flyInc * frames;
                if (this.get.y < -this.get.height) this.mComplete = true;
            }
        };
        Level.prototype.isComplete = function () {
            return this.mComplete;
        };

        return Level;
    })(cLib.gameObject);
    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    //Private card class 
    var Card = (function (parent) {
        Card.prototype = new cLib.gameObject();
        Card.prototype.constructor = Card;

        //static
        var val = {
            lineWidth: 0.00209, strokeColor: "#aaaaff", 
            fillColor: "#8989cc", backAlpha: 0.5, alphaInc: 0.05, maxAngle: 36
        };
        function Card(col, row, sz, refSz) {
            var xywh = getRectCnvCoords(col*sz, row*sz, sz, sz, refSz);
            parent.call(this, xywh[0], xywh[1], xywh[2], xywh[3]);
            //members
            this.mMapCell = null;
            this.mActive = false;
            this.mCell = [col, row];
            this.mTwin = null;
            this.mShake = false;
            this.mAngle = 0;
            this.mAlpha = 0;
        }

        Card.prototype.drawBack = function (cnvSz, sheet) {
            var c = this.getCoords();
            c = [c[0]*cnvSz, c[1]*cnvSz, c[2]*cnvSz, c[3]*cnvSz];
            if (this.mAlpha !== 0)
                cLib.drawRect(c[0], c[1], c[2], c[3], { fill: val.fillColor }, { alpha: this.mAlpha });
            cLib.drawRect(c[0], c[1], c[2], c[3], { line: val.lineWidth*cnvSz, stroke: val.strokeColor }, { alpha: val.backAlpha });
        };
        Card.prototype.drawFront = function (cnvSz, sheet) {
            if (!this.mMapCell) return;
            var c = this.getCoords();
            var clip = sheet.getClipForCell(this.mMapCell[0], this.mMapCell[1]);            
            cLib.drawSprite(sheet.getSprite(), c[0]*cnvSz, c[1]*cnvSz, c[2]*cnvSz, c[3]*cnvSz, null, clip);
        };
        Card.prototype.draw = function (cnvSz, sheet) {
            this.drawBack(cnvSz, sheet);
            if (this.mShake)
                this.drawSpecial(cnvSz, sheet)
            else this.drawFront(cnvSz, sheet);
        };
        Card.prototype.drawSpecial = function (cnvSz, sheet) {
            if (!this.mMapCell) return;
            var c = this.getCoords();
            var clip = sheet.getClipForCell(this.mMapCell[0], this.mMapCell[1]);            
            cLib.drawSprite(sheet.getSprite(), c[0]*cnvSz, c[1]*cnvSz, c[2]*cnvSz, c[3]*cnvSz, { rotate: this.mAngle }, clip);
        };
        Card.prototype.advance = function (frames) {
            //fade back
            if (this.mActive) {
                if (this.mAlpha < val.backAlpha) {
                    this.mAlpha += val.alphaInc * frames;
                    if (this.mAlpha > val.backAlpha) this.mAlpha = val.backAlpha;
                }
            } else {
                if (this.mAlpha > 0) {
                    this.mAlpha -= val.alphaInc * frames;
                    if (this.mAlpha < 0) this.mAlpha = 0;
                }
            }
            //shake
            if (!this.mShake) return;
            this.mAngle = cLib.randomSignedInt(val.maxAngle);            
        };
        Card.prototype.hitTest = function (nX, nY, cnvSz) {
            var rect = this.getCoords();
            return cLib.rectHitPoint(rect[0]*cnvSz, rect[1]*cnvSz, rect[2]*cnvSz, rect[3]*cnvSz, nX, nY);
        };
        Card.prototype.getCol = function () {
            return this.mCell[0];
        };
        Card.prototype.getRow = function () {
            return this.mCell[1];
        };
        Card.prototype.getCell = function () {
            return this.mCell;
        };        
        Card.prototype.setMapCell = function (c, r) {
            return this.mMapCell = [c, r];
        };
        Card.prototype.setActive = function (on, fade) {
            this.mActive = on;
            if (on) this.mAlpha = (fade ? 0 : val.backAlpha);
            else this.mAlpha = (fade ? val.backAlpha : 0);
        };
        Card.prototype.getActive = function () {
            return this.mActive;
        };        
        Card.prototype.setTwin = function (nCard) {
            this.mTwin = nCard;
        };
        Card.prototype.getTwin = function () {
            return this.mTwin;
        };
        Card.prototype.getShake = function () {
            return this.mShake;
        };
        Card.prototype.startShake = function () {
            this.mShake = true;
        };
        Card.prototype.pop = function (sz, refSz) {
            this.mAlpha = 0;
            this.mActive = false;
            this.mShake = false;            
            this.mTwin = null;
            if (!this.mMapCell) return null;            
            var pop = new Pop(this.mCell[0], this.mCell[1], sz, refSz, this.mMapCell[0], this.mMapCell[1], this.mAngle);
            this.mMapCell = null;
            return pop;
        };
        Card.prototype.getCenterPosPx = function (cnvSz) {
            var xy = this.getPosition(), sz = this.get.height;
            xy[0] += sz / 2;
            xy[1] += sz / 2;
            return [xy[0]*cnvSz, xy[1]*cnvSz];
        };
        Card.prototype.isEmpty = function () {
            return !this.mMapCell;
        };        

        return Card;
    })(cLib.gameObject);
    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    //Board class
    nWin.Board = (function (parent) {
        Board.prototype = new cLib.gameObject();
        Board.prototype.constructor = Board;

        //static
        var val = {
            fillColor: "#ffffff", backAlpha: 0.5, lineWidth: 0.00418, borderWidth: 0.00836, strokeColor: "#8989cc",
            sqCells: 10, cardCols: 5, cardRows: 8, connectDelay: 10,
            baseMaxCards: 36, levelAddCards: 4, maxCards: 80, allowTurns: 2
        };
        function Board(matchCallBack, clearCallback, level) {            
            parent.call(this, 0, 0, 1, 1);
            //members
            this.mCardsSheet = new cLib.animeSheet();
            this.mMatchCallback = matchCallBack;
            this.mClearCallback = clearCallback;
            this.mCards = [];
            this.mPops = [];
            this.mCard1 = null;
            this.mCard2 = null;
            this.mConnects = null;
            this.mLevel = level > 1 ? (new Level()) : null;
            this.mDelay = 0;
            //setup
            this.mCardsSheet.begin("cards", val.cardCols, val.cardRows);
            var cH = cLib.getCanvasHeight();
            var sz = cH / val.sqCells;
            for (var c = 0; c < val.sqCells; c++) {
                this.mCards[c] = [];
                for (var r = 0; r < val.sqCells; r++)
                    this.mCards[c][r] = new Card(c, r, sz, cH);
            }
            placeCards.call(this, level);
        }        

        Board.prototype.draw = function (cnvSz) {
            //draw panel
            cLib.drawRect(0, 0, cnvSz, cnvSz, { fill: val.fillColor }, { alpha: val.backAlpha });                        
            //draw card slots
            if (!this.mConnects) {
                for (var c = 0; c < val.sqCells; c++)
                    for (var r = 0; r < val.sqCells; r++)
                        this.mCards[c][r].draw(cnvSz, this.mCardsSheet);
                this.mPops.forEach(function (p) { p.draw(cnvSz, this.mCardsSheet); }.bind(this)); //pops
                if (this.mLevel) this.mLevel.draw(cnvSz); //level-up
                cLib.drawRect(0, 0, cnvSz, cnvSz, { stroke: val.strokeColor, line: val.borderWidth * cnvSz }); //border
                return;
            }
            for (var c = 0; c < val.sqCells; c++) {
                for (var r = 0; r < val.sqCells; r++) {
                    var card = this.mCards[c][r];
                    if (card !== this.mCard1 && card !== this.mCard2)
                        card.draw(cnvSz, this.mCardsSheet);
                    else card.drawBack(cnvSz, this.mCardsSheet);
                }
            }
            //draw connection
            var xy = this.mCard1.getCenterPosPx(cnvSz), goXy;
            var ar = this.mConnects;
            for (var i = 0; i < ar.length; i++) {
                goXy = ar[i].getCenterPosPx(cnvSz);
                cLib.drawLine(xy, goXy, { line: val.lineWidth*cnvSz, stroke: val.strokeColor, cap:"square" });
                xy = goXy;
            }
            goXy = this.mCard2.getCenterPosPx(cnvSz);
            cLib.drawLine(xy, goXy, { line: val.lineWidth*cnvSz, stroke: val.strokeColor, cap:"square" });
            this.mCard1.drawSpecial(cnvSz, this.mCardsSheet);
            this.mCard2.drawSpecial(cnvSz, this.mCardsSheet);
            this.mPops.forEach(function (p) { p.draw(cnvSz, this.mCardsSheet); }.bind(this)); //pops
            if (this.mLevel) this.mLevel.draw(cnvSz); //level-up
            cLib.drawRect(0, 0, cnvSz, cnvSz, { stroke: val.strokeColor, line: val.borderWidth * cnvSz }); //border
        };
        Board.prototype.advance = function (frames) {
            //advance card slots
            for (var c = 0; c < val.sqCells; c++)
                for (var r = 0; r < val.sqCells; r++)
                    this.mCards[c][r].advance(frames);
            if (this.mLevel) {
                this.mLevel.advance(frames);
                if (this.mLevel.isComplete())
                    this.mLevel = null;
            }
            //drop matched cards            
            var i = 0, ar = this.mPops;
            while (i < ar.length) {
                ar[i].advance(frames);
                if (!ar[i].isComplete()) {
                    i++;
                } else {
                    ar.splice(i, 1);
                    if (ar.length === 0 && isComplete.call(this)) this.mClearCallback();
                }                
            }
            //show connection
            if (!this.mConnects) return;
            this.mCard1.advance(frames);
            this.mCard2.advance(frames);
            //process connection hide delay
            this.mDelay += frames;
            if (this.mDelay >= val.connectDelay) {
                this.mDelay = 0;
                this.mConnects = null;
                var cH = cLib.getCanvasHeight();
                var sz = cH / val.sqCells;                                
                this.mPops.push(this.mCard1.pop(sz, cH));
                this.mPops.push(this.mCard2.pop(sz, cH));
                this.mCard1 = null;
                this.mCard2 = null;
                cLib.playSound("pop");
            }
        };
        Board.prototype.clickEvent = function (x, y, cnvSz) {
            for (var c = 0; c < val.sqCells; c++) {
                for (var r = 0; r < val.sqCells; r++) {
                    var card = this.mCards[c][r];
                    if (card.hitTest(x, y, cnvSz)) {
                        processHit.call(this, card); 
                        break;
                    }
                }
            }
        };
        Board.prototype.giveHint = function () {
            for (var c = 0; c < val.sqCells; c++) {
                for (var r = 0; r < val.sqCells; r++) {
                    var card = this.mCards[c][r];
                    if (card.isEmpty() || card.getShake())
                        continue;
                    var between = posConnects.call(this, card, card.getTwin());
                    if (between) {
                        card.startShake();
                        card.getTwin().startShake();
                        return true;
                    }
                }
            }
            return false;
        };

        //Helpers
        function processHit(card) {
            if (this.mConnects) return; //processing a match
            if (card.isEmpty()) return; //selection was empty
            //set cards
            if (!this.mCard1) {
                card.setActive(true);
                this.mCard1 = card;
                cLib.playSound("tick");
            } else if (!this.mCard2) {
                card.setActive(true);
                this.mCard2 = card;
            }
            //process match
            if (!this.mCard1 || !this.mCard2) return;
            if (this.mCard1 == this.mCard2) {
                cLib.playSound("tick");
                this.mCard1.setActive(false, true);
                this.mCard1 = null;
                this.mCard2 = null;
                return;
            }
            if (this.mCard1.getTwin() == this.mCard2) {
                var between = posConnects.call(this, this.mCard1, this.mCard2);
                if (between) {
                    cLib.playSound("good");
                    this.mConnects = between;
                    this.mCard1.setActive(false);
                    this.mCard2.setActive(false);
                    this.mCard1.startShake();
                    this.mCard2.startShake();
                    this.mMatchCallback();
                    return;
                }
            }
            cLib.playSound("bad");
            this.mCard1.setActive(false, true);
            this.mCard2.setActive(false, true);
            this.mCard1 = null;
            this.mCard2 = null;            
        }

        function isComplete() {
            for (var c = 0; c < val.sqCells; c++)
                for (var r = 0; r < val.sqCells; r++)
                    if (!this.mCards[c][r].isEmpty()) return false;
            return true;
        }

        function placeCards(nLevel) {
            var maxCards = val.baseMaxCards + nLevel * val.levelAddCards;
            var occupied = 0;
            var c = 0;
            while (c < val.cardCols) {
                var r = 0;
                while (r < val.cardRows) {
                    //Get space
                    var sqC = cLib.randomInt(1, val.sqCells - 2);
                    var sqR = cLib.randomInt(1, val.sqCells - 2);
                    var card = this.mCards[sqC][sqR];
                    if (!card.isEmpty()) {
                        var card = nextBlankCard.call(this);
                        if (!card) return; //abort, additional connection impossible
                    }
                    //Get connect space                                                                      
                    var conCard = getConnectCard.call(this, card, nLevel);
                    if (!conCard) return; //abort, additional connection impossible
                    //Place cards
                    card.setMapCell(c, r);
                    conCard.setMapCell(c, r);
                    card.setTwin(conCard);
                    conCard.setTwin(card);
                    occupied += 2;
                    if (occupied >= maxCards) return; //abort, max cards placed
                    r++;
                }
                c++;
            }
        }

        //get setup positions
        function nextBlankCard() {
            if (cLib.randomBool()) {
                //from left-top
                var start = 1, edge = val.sqCells - 2;
                for (var r = start; r <= edge; r++)
                    for (var c = start; c <= edge; c++)
                        if (this.mCards[c][r].isEmpty()) return this.mCards[c][r];
            } else {
                //from right-bottom
                var finish = 1, edge = val.sqCells - 2;
                for (var r = edge; r >= finish; r--)
                    for (var c = edge; c >= finish; c--)
                        if (this.mCards[c][r].isEmpty()) return this.mCards[c][r];
            }
            return null;
        }        

        function getConnectCard(card, randAttempts) {                                                
            //level-based difficulty (randAttempts)        
            var spc, a = 0;
            do {
                var c = cLib.randomInt(1, val.sqCells - 2);
                var r = cLib.randomInt(1, val.sqCells - 2);
                spc = this.mCards[c][r];
                if (!spc.isEmpty() || !posConnects.call(this, card, spc)) spc = null;
                a++;
            } while (!spc && a < randAttempts);
            if (spc) return spc;
            //Walk through to get connect space, first walk direction is random
            var dir = [connectSpaceUp.bind(this), connectSpaceDown.bind(this), connectSpaceLeft.bind(this), connectSpaceRight.bind(this)];
            var rand = cLib.randomInt(0, dir.length);
            var cr = card.getCell();
            spc = dir[rand](cr[0], cr[1], 0, cLib.randomFlag(randAttempts));
            if (spc) return spc;
            for (var i = 0; i < dir.length; i++) {
                if (i != rand) {
                    cr = card.getCell();
                    spc = dir[i](cr[0], cr[1], 0, cLib.randomFlag(randAttempts));
                    if (spc) break;
                }
            }
            return spc;
        }

        //walk-through placement discovery
        function connectSpaceUp(fromC, fromR, turnCount, takeTurn) {
            //if cell not at edge proceed
            var r = fromR-1, edge = 1;
            if (r < edge) return null;
            //find furthest empty space
            var lastSpc = null;
            while (r >= edge) {
                var card = this.mCards[fromC][r];
                if (card.isEmpty()) lastSpc = card;
                else break;
                r--;
            }
            //level-based difficulty (takeTurn)
            if (lastSpc && !takeTurn) return lastSpc;
            //if already did max turns return
            turnCount++;
            if (turnCount > val.allowTurns)
                return null;
            //otherwise proceed with turn
            r = lastSpc ? lastSpc.getCell()[1]+1 : edge;
            var spc = connectSpaceLeft.call(this, fromC, r, turnCount);
            if (!spc) return connectSpaceRight.call(this, fromC, r, turnCount);
            return spc;
        }

        function connectSpaceDown(fromC, fromR, turnCount, takeTurn) {
            //if cell not at edge proceed
            var r = fromR+1, edge = val.sqCells-2;
            if (r > edge) return null;
            //find furthest empty space
            var lastSpc = null;
            while (r <= edge) {
                var card = this.mCards[fromC][r];
                if (card.isEmpty()) lastSpc = card;
                else break;
                r++;
            }
            //level-based difficulty (takeTurn)
            if (lastSpc && !takeTurn) return lastSpc;
            //if already did max turns return
            turnCount++;
            if (turnCount > val.allowTurns)
                return null;
            //otherwise proceed with turn
            r = lastSpc ? lastSpc.getCell()[1]-1 : edge;
            var spc = connectSpaceRight.call(this, fromC, r, turnCount);
            if (!spc) return connectSpaceLeft.call(this, fromC, r, turnCount);
            return spc;
        }

        function connectSpaceLeft(fromC, fromR, turnCount, takeTurn) {
            //if cell not at edge proceed
            var c = fromC-1, edge = 1;
            if (c < edge) return null;
            //find furthest empty space
            var lastSpc = null;
            while (c >= edge) {
                var card = this.mCards[c][fromR];
                if (card.isEmpty()) lastSpc = card;
                else break;
                c--;
            }
            //level-based difficulty (takeTurn)
            if (lastSpc && !takeTurn) return lastSpc;
            //if already did max turns return
            turnCount++;
            if (turnCount > val.allowTurns)
                return null;
            //otherwise proceed with turn
            c = lastSpc ? lastSpc.getCell()[0]+1 : edge;
            var spc = connectSpaceUp.call(this, c, fromR, turnCount);
            if (!spc) return connectSpaceDown.call(this, c, fromR, turnCount);
            return spc;
        }

        function connectSpaceRight(fromC, fromR, turnCount, takeTurn) {
            //if cell not at edge proceed
            var c = fromC+1, edge = val.sqCells-2;
            if (c > edge) return null;
            //find furthest empty space
            var lastSpc = null;
            while (c <= edge) {
                var card = this.mCards[c][fromR];
                if (card.isEmpty()) lastSpc = card;
                else break;
                c++;
            }
            //level-based difficulty (takeTurn)
            if (lastSpc && !takeTurn) return lastSpc;
            //if already did max turns return
            turnCount++;
            if (turnCount > val.allowTurns)
                return null;
            //otherwise proceed with turn
            c = lastSpc ? lastSpc.getCell()[0]-1 : edge;
            var spc = connectSpaceDown.call(this, c, fromR, turnCount);
            if (!spc) return connectSpaceUp.call(this, c, fromR, turnCount);
            return spc;
        }

        //walk-through connection validity        
        function posConnects(nCard1, nCard2) {
            //will return null if connection is blocked, otherwise an array of points between the two cards (empty if none)
            var cr1 = nCard1.getCell();
            var cr2 = nCard2.getCell();
            
            var U = connectCardUp.bind(this, cr1[0], cr1[1], cr2[0], cr2[1], 0);
            var D = connectCardDown.bind(this, cr1[0], cr1[1], cr2[0], cr2[1], 0);
            var L = connectCardLeft.bind(this, cr1[0], cr1[1], cr2[0], cr2[1], 0);
            var R = connectCardRight.bind(this, cr1[0], cr1[1], cr2[0], cr2[1], 0);
            var posConnectsCall = function (nFunc) {
                var spaces = [];
                var card = nFunc(spaces);
                if (card && card === nCard2) return spaces;
                return null;
            };

            var spc;
            if (cr1[0] > cr2[0] && cr1[1] > cr2[1]) { //try left-up first
                spc = posConnectsCall(L); if (spc) return spc;
                spc = posConnectsCall(U); if (spc) return spc;
                spc = posConnectsCall(R); if (spc) return spc;
                spc = posConnectsCall(D); if (spc) return spc;

            } else if (cr1[0] > cr2[0] && cr1[1] < cr2[1]) { //try left-down first
                spc = posConnectsCall(L); if (spc) return spc;
                spc = posConnectsCall(D); if (spc) return spc;
                spc = posConnectsCall(R); if (spc) return spc;
                spc = posConnectsCall(U); if (spc) return spc;

            } else if (cr1[0] < cr2[0] && cr1[1] > cr2[1]) { //try right-up first
                spc = posConnectsCall(R); if (spc) return spc;
                spc = posConnectsCall(U); if (spc) return spc;
                spc = posConnectsCall(L); if (spc) return spc;
                spc = posConnectsCall(D); if (spc) return spc;

            } else if (cr1[0] < cr2[0] && cr1[1] < cr2[1]) { //try right-down first
                spc = posConnectsCall(R); if (spc) return spc;
                spc = posConnectsCall(D); if (spc) return spc;
                spc = posConnectsCall(L); if (spc) return spc;
                spc = posConnectsCall(U); if (spc) return spc;

            } else if (cr1[0] === cr2[0]) { //try vert first
                spc = posConnectsCall(U); if (spc) return spc;
                spc = posConnectsCall(D); if (spc) return spc;
                spc = posConnectsCall(L); if (spc) return spc;
                spc = posConnectsCall(R); if (spc) return spc;

            } else { //try horiz first
                spc = posConnectsCall(L); if (spc) return spc;
                spc = posConnectsCall(R); if (spc) return spc;
                spc = posConnectsCall(U); if (spc) return spc;
                spc = posConnectsCall(D); if (spc) return spc;
            }
            return null;
        }

        function connectCardUp(fromC, fromR, toC, toR, turnCount, nSpaces) {
            //if cell not at edge proceed
            var r = fromR-1, edge = 0;
            if (r < edge) return null;
            //branch off empties to find path
            var lastSpc = null;
            while (r >= edge) {
                var card = this.mCards[fromC][r];
                var cr = card.getCell();
                if (card.isEmpty()) {
                    lastSpc = card;
                    if (turnCount < val.allowTurns) {
                        if (connectCardRight.call(this, fromC, r, toC, toR, turnCount + 1, [])) break;
                        if (connectCardLeft.call(this, fromC, r, toC, toR, turnCount + 1, [])) break;
                    }
                } else {                    
                    if (cr[0] === toC && cr[1] === toR)
                        return card;
                    else break;
                }
                r--;
            }
            if (!lastSpc) return null;
            //if already did max turns return
            turnCount++;
            if (turnCount > val.allowTurns)
                return null;
            //otherwise proceed with turn            
            r = lastSpc.getCell()[1];
            nSpaces.push(lastSpc);
            //right
            var len = nSpaces.length;
            var spc = connectCardRight.call(this, fromC, r, toC, toR, turnCount, nSpaces);
            if (spc && spc.getCol() === toC && spc.getRow() === toR) 
                return spc;
            else if (len < nSpaces.length) nSpaces.splice(len, nSpaces.length - len);
            //left
            spc = connectCardLeft.call(this, fromC, r, toC, toR, turnCount, nSpaces);
            if (len < nSpaces.length && (!spc || spc.getCol() !== toC || spc.getRow() !== toR))
                nSpaces.splice(len, nSpaces.length - len);
            return spc;
        }

        function connectCardDown(fromC, fromR, toC, toR, turnCount, nSpaces) {
            //if cell not at edge proceed
            var r = fromR+1, edge = val.sqCells-1;
            if (r > edge) return null;
            //branch off empties to find path
            var lastSpc = null;
            while (r <= edge) {
                var card = this.mCards[fromC][r];
                var cr = card.getCell();
                if (card.isEmpty()) {
                    lastSpc = card;
                    if (turnCount < val.allowTurns) {
                        if (connectCardRight.call(this, fromC, r, toC, toR, turnCount + 1, [])) break;
                        if (connectCardLeft.call(this, fromC, r, toC, toR, turnCount + 1, [])) break;
                    }
                } else {
                    if (cr[0] === toC && cr[1] === toR)
                        return card;
                    else break;
                }
                r++;
            }
            if (!lastSpc) return null;
            //if already did max turns return
            turnCount++;
            if (turnCount > val.allowTurns)
                return null;
            //otherwise proceed with turn            
            r = lastSpc.getCell()[1];
            nSpaces.push(lastSpc);
            //right
            var len = nSpaces.length;
            var spc = connectCardRight.call(this, fromC, r, toC, toR, turnCount, nSpaces);
            if (spc && spc.getCol() === toC && spc.getRow() === toR)
                return spc;
            else if (len < nSpaces.length) nSpaces.splice(len, nSpaces.length - len);
            //left
            spc = connectCardLeft.call(this, fromC, r, toC, toR, turnCount, nSpaces);
            if (len < nSpaces.length && (!spc || spc.getCol() !== toC || spc.getRow() !== toR))
                nSpaces.splice(len, nSpaces.length - len);
            return spc;
        }

        function connectCardLeft(fromC, fromR, toC, toR, turnCount, nSpaces) {
            //if cell not at edge proceed
            var c = fromC-1, edge = 0;
            if (c < edge) return null;
            //branch off empties to find path
            var lastSpc = null;
            while (c >= edge) {
                var card = this.mCards[c][fromR];
                var cr = card.getCell();
                if (card.isEmpty()) {
                    lastSpc = card;
                    if (turnCount < val.allowTurns) {
                        if (connectCardUp.call(this, c, fromR, toC, toR, turnCount + 1, [])) break;
                        if (connectCardDown.call(this, c, fromR, toC, toR, turnCount + 1, [])) break;
                    }
                } else {                    
                    if (cr[0] === toC && cr[1] === toR)
                        return card;
                    else break;
                }
                c--;
            }
            if (!lastSpc) return null;
            //if already did max turns return
            turnCount++;
            if (turnCount > val.allowTurns)
                return null;
            //otherwise proceed with turn            
            c = lastSpc.getCell()[0];
            nSpaces.push(lastSpc);
            //up
            var len = nSpaces.length;
            var spc = connectCardUp.call(this, c, fromR, toC, toR, turnCount, nSpaces);
            if (spc && spc.getCol() === toC && spc.getRow() === toR)
                return spc;
            else if (len < nSpaces.length) nSpaces.splice(len, nSpaces.length - len);
            //down
            spc = connectCardDown.call(this, c, fromR, toC, toR, turnCount, nSpaces);
            if (len < nSpaces.length && (!spc || spc.getCol() !== toC || spc.getRow() !== toR))
                nSpaces.splice(len, nSpaces.length - len);
            return spc;
        }

        function connectCardRight(fromC, fromR, toC, toR, turnCount, nSpaces) {
            //if cell not at edge proceed
            var c = fromC+1, edge = val.sqCells-1;
            if (c > edge) return null;
            //branch off empties to find path
            var lastSpc = null;
            while (c <= edge) {
                var card = this.mCards[c][fromR];
                var cr = card.getCell();
                if (card.isEmpty()) {
                    lastSpc = card;
                    if (turnCount < val.allowTurns) {
                        if (connectCardUp.call(this, c, fromR, toC, toR, turnCount + 1, [])) break;
                        if (connectCardDown.call(this, c, fromR, toC, toR, turnCount + 1, [])) break;                                
                    }
                } else {                    
                    if (cr[0] === toC && cr[1] === toR)
                        return card;
                    else break;
                }
                c++;
            }
            if (!lastSpc) return null;
            //if already did max turns return
            turnCount++;
            if (turnCount > val.allowTurns)
                return null;
            //otherwise proceed with turn            
            c = lastSpc.getCell()[0];
            nSpaces.push(lastSpc);
            //up
            var len = nSpaces.length;
            var spc = connectCardUp.call(this, c, fromR, toC, toR, turnCount, nSpaces);
            if (spc && spc.getCol() === toC && spc.getRow() === toR)
                return spc;
            else if (len < nSpaces.length) nSpaces.splice(len, nSpaces.length - len);
            //down
            spc = connectCardDown.call(this, c, fromR, toC, toR, turnCount, nSpaces);
            if (len < nSpaces.length && (!spc || spc.getCol() !== toC || spc.getRow() !== toR))
                nSpaces.splice(len, nSpaces.length - len);
            return spc;
        }

        return Board;
    })(cLib.gameObject);
    ///////////////////////////////////////////////////
})(window);




















