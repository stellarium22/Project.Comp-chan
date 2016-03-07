//UI.js:codes to make ui system
//Author:furikake

//Consts
const fr_JUMPKEYCODE = 90;     //Use 'Z' key as jumpbutton
const fr_KICKKEYCODE = 88;     //Use 'Y' key as kickbutton
const fr_KICKPOWERMAX = 100;	//蹴りパワーの最大値、つまりはこの数値のフレーム分長押しすれば蹴りパワーマックス

const fr_NUIW = 28;		//Number UI Width、文字
const fr_NUIH = 40;		//Number UI Height

const fr_FIRSTSPEED = 150;  //初期スピード
const fr_SPEED_PER_SCORE = 0.005;    //スコア1ごとのスピード増加量

var uiLayer = cc.Layer.extend({
    sprite: null,
    kickpower:  0,	//蹴る強さ、蹴りボタンを長押しすると増える
    kickchance: 3,	//蹴れる回数
    score:      0,		//スコア 
    time: 		0,		//時間(ミリ秒) 
    ui_life:    null,	//HP表示パラメータ 
    ui_kick:    [], 	//残りキック回数表示パラメータ
    ui_score:   [],	//スコア表示パラメータ 
    ui_limit:   [], //納期までの距離表示パラメータ
    //Call when game start
    ctor: function () {
        //Superclass
        this._super();
        this.scheduleUpdate();

        //Get screensize
        var size = cc.winSize;

        //////////////////////////////
        //Make sprite
        //////////////////////////////
        //UI関係
        //uiback
        var uiback = cc.Sprite.create(res.fr_uibackpic);
        uiback.setPosition(size.width / 2,size.height / 2);
        uiback.setScale(0.5);
        this.addChild(uiback, 0);
        //KickChance表示
        for(var i=0;i<3;i++){
        	this.ui_kick[i] = cc.Sprite.create(res.fr_kickpic);
        	this.ui_kick[i].setPosition(size.width / 2 - 108 + i*34,size.height / 2 + 122);
        	this.ui_kick[i].setScale(0.5);
        	this.addChild(this.ui_kick[i], 1);
        }
        //Score表示
        for (var i = 0; i < 9; i++) {
            this.ui_score[i] = cc.Sprite.create(res.fr_numberspic);
            this.ui_score[i] = this.fr_getNumUI(this.ui_score[i], 0);
            this.ui_score[i].setPosition(size.width / 2 + 78 + i * fr_NUIW / 2, size.height / 2 + 122);
            this.ui_score[i].setScale(0.5);
            this.addChild(this.ui_score[i], 1);
        }
        //limit表示
        for (var i = 0; i < 3; i++) {
            this.ui_limit[i] = cc.Sprite.create(res.fr_numberspic);
            this.ui_limit[i] = this.fr_getNumUI(this.ui_limit[i], 0);
            this.ui_limit[i].setPosition(size.width / 2 - 122 + i * fr_NUIW / 2, size.height / 2 + 40);
            this.ui_limit[i].setScale(0.5);
            this.addChild(this.ui_limit[i], 1);
        }
        //フレーム関係
        //frame
        var frame = cc.Sprite.create(res.fr_framepic);
        frame.setPosition(size.width / 2,size.height / 2);
        frame.setScale(0.5);
        this.addChild(frame, 100);
        //jumpbutton
        var jumpButton = cc.Sprite.create(res.fr_jumpbuttonpic);
        jumpButton.setPosition(53, 137);
        jumpButton.setScale(0.5);
        this.addChild(jumpButton, 101);
        //kickButton
        var kickButton = cc.Sprite.create(res.fr_kickbuttonpic);
        kickButton.setPosition(size.width - 53, 137);
        kickButton.setScale(0.5);
        this.addChild(kickButton, 101);

        //Key board event
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,

            onKeyPressed: function (keyCode, event) {
                if (keyCode == fr_JUMPKEYCODE) {
                    //jump
                    this.fr_jumpStart();
                }
                if (keyCode == fr_KICKKEYCODE) {
                    //kick_start
                    this.fr_kickStart();
                }

                return true;
            }.bind(this),	//thisがバグらないおまじない

            onKeyReleased: function (keyCode, event) {
                if (keyCode == fr_KICKKEYCODE) {
                    //kick_end
                    this.fr_kickEnd();
                }

                return true;
            }.bind(this),	//thisがバグらないおまじない
        }, this);
        //Touchscreen event(jumpbutton)
        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,

            onTouchBegan: function (touch, event) {
                touchedPos = touch.getLocation();
                buttonArea = jumpButton.getBoundingBox();

                if (cc.rectContainsPoint(buttonArea, touchedPos)) {
                    //jump
                    this.fr_jumpStart();
                }

                return true;
            }.bind(this),	//thisがバグらないおまじない
        }, this);
        //Touchscreen event(kickbutton)
        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,

            onTouchBegan: function (touch, event) {
                touchedPos = touch.getLocation();
                buttonArea = kickButton.getBoundingBox();

                if (cc.rectContainsPoint(buttonArea, touchedPos)) {
                    //kickstart
                    this.fr_kickStart();
                    return true;
                }else{
                	return false;
                }
                
            }.bind(this),	//thisがバグらないおまじない
            onTouchEnded: function (touch, event) {
                //kickend
                this.fr_kickEnd();

                return true;
            }.bind(this),	//thisがバグらないおまじない
        }, this);

        return true;
    },

    //Call when game updates
    update: function (dt) {

    	//システム内での時間カウント
    	this.time += 1;

        //If kickPower is bigger than 0,kickpower plus1.(max is 300)
        if (this.kickpower > 0 && this.kickpower < fr_KICKPOWERMAX) {
            this.kickpower += 30;
        }

        //スコアが0未満にならないように
        if(this.score < 0){
	        this.score = 0;	
        }
        
        //UIのリフレッシュ
	    this.fr_uiRefresh();
    },

    //ジャンプ開始時に読み出される関数
	fr_jumpStart : function() {
    	//描画スクリプトに通達
	    layer_anime.WhenJumpButtonDown();
    	return true;
	},
	//キック開始時に読み出される関数
	fr_kickStart : function() {
    	if(this.kickchance > 0){
    		//パワーカウント開始
	    	if(this.kickpower == 0){
	    		this.kickpower = 1;
	    	}
    		//描画スクリプトに通達
	    	layer_anime.WhenKickButtonDown();
    	}
    	return true;
	},
	//キック終了（キーから手を話した時）に読み出される関数
	fr_kickEnd : function() {
	    if(this.kickchance > 0){
	    	//描画スクリプトに通達
	    	console.log(this.kickpower + "の力で蹴ることをアニメレイヤーに通達");
	    	if(layer_anime.WhenKickButtonUp(this.kickpower / fr_KICKPOWERMAX) == true){	//引数は正規化
	    		//キック回数を1減らす
	    		this.kickchance -=1;
	    	}
	    	//パワーカウント終了、0に戻して増加を止める
	    	this.kickpower = 0;
	    }
	    return true;
	},

	fr_getNumUI : function(spr,param){
		if(typeof param != 'number'){
			console.log("数字以外の変数がUIで表示されようとしています。");
			param = 0;
		}else if(param >= 10 || param < 0){
			console.log("範囲外の数字がUIで表示されようとしています。");
			param = 0;
		}
		//整数にするよう切り捨て
		param = parseInt(param);

		rect1 = cc.rect( param * fr_NUIW , 0 , fr_NUIW , fr_NUIH );
		spr.setTextureRect(rect1);

		return spr;
	},

	//アイテム当たり判定（スコア関係）
	fr_hitItems : function(id) {
		//score増減
		switch(id){
			case 0:
				this.score += 10000;
				break;
			case 3:
				this.score += 100;
				break;
			case 3.5:
				this.score -= 10;
				break;
			case 4:
				this.score += 500;
				break;
			case 4.5:
				this.score -= 50;
				break;
			case 5:
				this.score += 1000;
				break;
			case 5.5:
				this.score -= 100;
				break;
		}
		//kick回数増減
		switch(id){
			case 6:
				if(this.kickchance<3){
					this.kickchance += 1;
				}
				break;
			case 6.5:
				if(this.kickchance>0){
					this.kickchance -= 1;
				}
				break;
		}

        //スピード設定
        var newSpeed = fr_FIRSTSPEED + this.score * fr_SPEED_PER_SCORE;
        layer_anime.accelaration( newSpeed - layer_anime.speed );
	},

	//アイテム出現確率
	fr_getItemFrequency : function(id){

		var frqs = {
			2: 		150, 
			3: 		100,
			3.5: 	5,
			4: 		100,
			4.5: 	5,
			5: 		50,
			5.5: 	5,
			6: 		5,
			6.5: 	1,
			7: 		0,   
		}

		//インデックスにないアイテムだったら0を返す
		if(typeof frqs[id] === "undefined"){
			return 0;
		}

		//時間経過でデメリットアイテム増加
		if(this.time%100==0){
			frqs[2] ++;
			if(frqs[2] > 200)frqs[2] = 200;
			frqs[3.5] += 4;
			if(frqs[3.5] > 50)frqs[3.5] = 50;
			frqs[4.5] += 4;
			if(frqs[4.5] > 50)frqs[4.5] = 50;
			frqs[5.5] += 4;
			if(frqs[5.5] > 50)frqs[5.5] = 50;
			frqs[6.5] += 0.1;
			if(frqs[6.5] > 3)frqs[5.5] = 3;
		}

		//のうききき(締め切りアウト5日以内)
		if(layer_anime.getDeadLine() < 0.05){
			frqs[3] *= 3;
			frqs[4] *= 3;
			frqs[5] *= 3;
			frqs[6] *= 3;
			frqs[7] *= 3;
		}

		//確率正規化準備のため全部のfrqsを総合した和を算出
		var sumfrq = 0;
		for (var index in frqs){
			sumfrq += frqs[index];
		}

		//確率正規化
		var prb = frqs[id] / sumfrq;

		return prb;
	},

	//UIリフレッシュ
	fr_uiRefresh : function() {
	    
	    //キック可能回数
	    for(var i=0;i<3;i++){
	    	if(this.kickchance > i){
	    		this.ui_kick[i].setVisible(true);
	    	}else{
	    		this.ui_kick[i].setVisible(false);
	    	}
        }

        //スコア
        var s = this.score;
        for(var i=8;i>=0;i--){
        	this.ui_score[i] = this.fr_getNumUI(this.ui_score[i],s%10);
        	s /= 10;
        	s = parseInt(s);
        }

	    //距離
        var l = layer_anime.getDeadLine() * 100;
        for (var i = 2; i >= 0; i--) {
            this.ui_limit[i] = this.fr_getNumUI(this.ui_limit[i], l % 10);
            l /= 10;
            l = parseInt(l);
        }

	    return true;
	},
});