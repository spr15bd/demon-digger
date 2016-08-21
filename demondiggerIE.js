// 1. Wait for the onload event

window.addEventListener("load",function() {

      
	/* Set up a basic Quintus object
 with the necessary modules and controls
  */  
	var Q = window.Q = Quintus({ audioSupported: [ 'aac','m4a','ogg','wav' ] }).include("Sprites, Scenes, Input, Anim, 2D, UI, Touch, Audio")
.setup({ /*width: 1280, height: 1024, */maximize: true })
.controls(true)

.touch().enableSound();
	
	/* Add in the default keyboard controls
 along with joypad controls for touch*/     
	Q.input.keyboardControls();
      
	Q.input.joypadControls();

      
	Q.gravityX = 0;
      
	Q.gravityY = 0;

  
	
   	
	
	// Constants
	var SPRITE_PLAYER = 8;
      
	var SPRITE_TILES = 2;
      
	var SPRITE_ENEMY = 16;
      
	var SPRITE_SANDPIT = 4;

      
	var SPRITE_DIAMOND=8;

    
	var SPRITE_GREENPOTION=8;

 
	var SPRITE_GRAVEL =8;
 
	var SPRITE_DARKNESS = 0;
	var SPRITE_DUGUP = 0;
	var SPRITE_FLOWER = 8;
	
	Q.component("digControls", {
        
		/* default properties to add onto our entity
     */   
		defaults: { speed: 100 },

        
		/* called when the component is added to
 an entity
*/      
		
		added: function() {
          
			var p = this.entity.p;

          
			/* add in our default properties
     */    
			Q._defaults(p,this.defaults);

       
			
			/* every time our entity steps
, call our step method
 */         
			this.entity.on("step",this,"step");
       
		},

        

		step: function(dt) {
          
			/*grab the entity's properties
 for easy reference
     */     
			var p = this.entity.p;

 
			if (!p.dead) {
				if (p.purplePotionActivated) {
					p.speed = 200;
				} else {
					p.speed = 100;
				}
			
				//'direction' means the direction player would like to go in
				// 
				// grab a direction from the input
          

				p.direction = 	Q.inputs['left']  ? 'left' :
                        
						Q.inputs['right'] ? 'right' :
                        
						Q.inputs['up']    ? 'up' :
                        
						Q.inputs['down']  ? 'down' : 
				p.direction;

          
			
				/* based on our direction, try to add velocity
 in that direction. The quintus engine removes the velocity on collisions.
  */
				switch(p.direction) {
            
					case "left": p.vx = -p.speed; break;
            
					case "right":p.vx = p.speed; break;
            
					case "up":   p.vy = -p.speed; break;
           
					case "down": p.vy = p.speed; break;
      
				}
   
				if(p.vx > 0) {		
         					this.entity.play("walk_right");	//Makes player face right
					p.playerDirection="right";
				} else if (p.vx <0) {
					this.entity.play("walk_left");	//Player faces left
					p.playerDirection="left";
				}
				if(p.vy > 0) {		
         					this.entity.play("walk_down");
					p.playerDirection="down";
				} else if (p.vy <0) {
					this.entity.play("walk_up");
					p.playerDirection="up";
				}

				// End of level
				
				if (p.y>Q("TowerManMap", 1).first().getLevelHeight()) {
					Q.stageScene("level",1);
				}
			}
		}
      
	});


  
   
	Q.Sprite.extend("Player", {
        
		init: function(p) {

          
			this._super(p,{
            
				sheet:"player",
				sprite:"player",
            
				type: SPRITE_PLAYER,
				playerDirection: "right",
				lostLife: false,
				collisionMask: SPRITE_TILES | SPRITE_ENEMY | SPRITE_SANDPIT
          
			});

    
			
			this.add("2d, digControls,animation");
    
			this.on("hit.sprite",this,"hit");
    
		}
,
		hit: function(col) {

          		if(col.obj.isA("Sandpit")) {
 
				/*	Code for dig animation */
				if (this.p.vx<0) {
					this.play("dig_left",1);
				} else if (this.p.vx>0) {
					this.play("dig_right",1);
				} 
				
				this.p.vx=0;
				this.p.vy=0; 
				  
				this.p.direction=null;      //without this player will carry on because step will re-exert the default speed 
				
			} else if (col.obj.isA("Enemy") && !this.p.immune && !this.p.dead) {
				if (col.obj.p.onCreatedTimer < 60) {
					// onCreatedTimer is created to keep track of how 'young' each enemy is
					//  it is used here so that a player doesn't lose a life when they first dig up an enemy
					this.p.immune = true;
    				} else {
					if (this.p.immune = false) {
						this.p.lostLife = true;
						Q.state.set("lives", Q.state.get("lives")-1);
						col.obj.destroy(); 
						Q.stageScene("ui",2);
						this.p.immune = true;
    					}
					if(Q.state.get("lives") == 0){
						
						this.p.dead = true;
						this.p.vx = this.p.vy = 0;
						if (Q.state.get("score") > Q.state.get("hiscore")) {
							Q.state.set("hiscore", Q.state.get("score"));
						}
						this.stage.insert(new Q.Game_over({ x:col.obj.p.x, y:col.obj.p.y+40 }));
						
						this.play("dead",1);
						
						var delay=1000;//1 seconds
						
    						setTimeout(function(){
							Q.clearStages();
							Q.stageScene("hiscores");
	    					},delay);
        				} 
				}
			} 
		}
,
		step: function() {
			if (this.p.immune) {
				this.p.immuneTimer++;
      				if (this.p.immuneTimer > 40) {
        					// remove immunity.
        					this.p.immune = false;
      				}
				this.p.hitSandpit = false;
    			}

			if (this.p.deathPotionActivated) {	
				this.p.deathPotionActivated=false;
				//Q.audio.play('deathpotion.m4a');
				var sandpits = Q("Sandpit");
				var holes = Q("Dugpit");
				holes.each(function() {
					this.play("darknessafterdeath"+this.p.frame); 
				});
				sandpits.each(function() {
					this.play("darknessafterdeath"+this.p.frame);
				});
				
				var enemies = Q("Enemy");
				enemies.each(function() {
  					this.p.vx=0;
					this.p.vy=0;
					this.play("darkness");
					this.p.dead=true;
					this.p.deadTimer = 0; 
					Q.state.set("score", Q.state.get("score")+2);							
				});
		      		Q.stageScene("ui",2);
			} else if (this.p.scroll1Activated) {
				this.p.scroll1Activated = false;
				//Q.audio.play('sandpitspell.m4a');
				var sandpits = Q("Sandpit");
				sandpits.each(function() {
					this.sensor(); 
				});
			} else if (this.p.scroll3Activated) {
				this.p.scroll3Activated=false;
				var magic=new Q.Magic({ x: this.p.x, y: this.p.y});
				this.stage.insert(magic);
				magic.play("portal",1);
				magic.on("end", function() {
					//Q.audio.play('newmonster.m4a');
					var enemy=new Q.Enemy({ x: this.p.x, y: this.p.y});
					this.stage.insert(enemy);
					magic.end();
				});
			} else if (this.p.scroll4Activated) {
				this.p.scroll4Activated = false;
				var flower = new Q.Flower({ x : this.p.x, y : this.p.y });
				this.stage.insert(flower);
			} else if (this.p.firePotionActivated==true) {
				this.p.firePotionActivated = false;
				//Q.audio.play('firepotion.m4a');
				var magic;
				for (x=this.p.x-128; x<=this.p.x+128; x+=32) {
					for (y=this.p.y-128; y<=this.p.y+128; y+=32) {
						magic=new Q.Magic({ x:x, y:y});
						this.stage.insert(magic);
 
						magic.play("sparkle");
						magic.on("end"); 
					}
				}
				var currentPlayerX = this.p.x;
				var currentPlayerY = this.p.y;
				enemies = Q("Enemy");
				enemies.each(function() {
					this.p.vx=0;
					this.p.vy=0;
					if (Math.abs(currentPlayerX-this.p.x-16) <=160 && Math.abs(currentPlayerY-this.p.y-16) <= 160) {
						this.play("fire",1); 
						this.p.dead=true;
						this.p.deadTimer = -35;
					}
				});
				Q.state.set("score", Q.state.get("score")+2);
				Q.stageScene("ui",2);
			} else if (this.p.greenPotionActivated) {
				this.p.greenPotionActivated = false;
				//Q.audio.play('greenpotion.m4a');
				var currentPlayerX = this.p.x;
				var currentPlayerY = this.p.y;
				var magic;
				for (x=this.p.x-96; x<=this.p.x+128; x+=32) {
					for (y=this.p.y-96; y<=this.p.y+128; y+=32) {
						magic=new Q.Magic({ x:x, y:y});
						this.stage.insert(magic);
 
						magic.play("green");
					}
				}
				magic.on("end",  function() {
					var sandpits = Q("Sandpit");
			
					var holes = Q("Dugpit");
					var magics = Q("Magic");
					magics.each(function() {
						this.destroy();		//Clean up any lingering magic sprites
					});				
			
				
					holes.each(function() {
						if (Math.abs(this.p.x-currentPlayerX-16) <=128 && Math.abs(this.p.y-currentPlayerY-16) <= 128) {		
							this.play("darknessaftergreen"+this.p.frame);
						}
					});				
			
					sandpits.each(function() {
						if (Math.abs(this.p.x-currentPlayerX-16) <=128 && Math.abs(this.p.y-currentPlayerY-16) <= 128) {
							this.play("darknessaftergreen"+this.p.frame);
						} 
					});
					
					var enemies = Q("Enemy");
					enemies.each(function() {
						if (Math.abs(this.p.x-currentPlayerX) <=128 && Math.abs(this.p.y-currentPlayerY) <= 128) {
  							this.p.vx=0;
							this.p.vy=0;
							this.play("fall", 1);
							//Q.audio.play('fall.m4a');
							this.p.dead=true;
							this.p.deadTimer = -60; 	
						}
											
					});
				});
			
				Q.state.set("score", Q.state.get("score")+2);
				Q.stageScene("ui",2);
			}
			if (this.p.lostLife) {
				//Q.audio.play('dead.m4a');
				this.p.lostLife=false;
			}
			
		}	
	});


   

	// Diamond sprite
	Q.Sprite.extend("Diamond", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'diamond',
            
				type: SPRITE_DIAMOND
			});
		}   
	});

	// Greenpotion sprite
	Q.Sprite.extend("Greenpotion", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'greenpotion',
            
				type: SPRITE_GREENPOTION
			});	
		}   
	});


 


    

	// Purplepotion sprite
	Q.Sprite.extend("Purplepotion", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'purplepotion',
            
				type: SPRITE_GREENPOTION
			});
		}  
	});




	// Firepotion sprite
	Q.Sprite.extend("Firepotion", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'firepotion',
            
				type: SPRITE_GREENPOTION
			});
		}   
	});




	// Deathpotion sprite
	Q.Sprite.extend("Deathpotion", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'deathpotion',
            
				type: SPRITE_GREENPOTION
			});
		} 
	});




	// Gold jug sprite
	Q.Sprite.extend("Goldjug", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'goldjug',
            
				type: SPRITE_GREENPOTION
			});	
		}   
	});


 


    

	//Treasure chest sprite
	Q.Sprite.extend("Chest", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'chest',
            
				type: SPRITE_GREENPOTION
			});	
		}   
	});


 


   

	Q.Sprite.extend("IntroTitleTop", {
 
		init: function(p) {
          
			this._super(p,{
            
				asset: 'titletop.png',
            
				type: SPRITE_GREENPOTION
			});
		},
		step: function() {
			if(Q.inputs['fire']) {
  				Q.clearStages();
				Q.stageScene('level', 1);
			}
		}   
	});


 


    

	Q.Sprite.extend("TitleTop", {
 
		init: function(p) {
          
			this._super(p,{
            
				asset: 'titletop.png',
            
				type: SPRITE_GREENPOTION
			});
		}   
	});


 


    

	Q.Sprite.extend("TitleBottom", {
 
		init: function(p) {
          
			this._super(p,{
            
				asset: 'titlebottom.png',
            
				type: SPRITE_GREENPOTION
			});	
			this.add("tween");  
		},
		step: function() {
			if (this.p.x<=Q.width/2) {
				this.animate({ x: (Q.width/2)+96, y: 50 }, 8);
				this.animate({ x: (Q.width/2), y: 50 }, 5, {delay: 8});
			}
		}
	});


 


  

	// Scroll sprite
	Q.Sprite.extend("Scroll", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'scroll',
            
				type: SPRITE_GREENPOTION
			});
		}  
	});


 

	// Heart sprite
	Q.Sprite.extend("Heart", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'heart',
            
				type: SPRITE_GREENPOTION
			});
		}   
	});


 

	// Key sprite
	Q.Sprite.extend("Key", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'key',
            
				type: SPRITE_GREENPOTION
			});
		}   
	});


 

	// Gravel sprites
	Q.Sprite.extend("Gravel1", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'gravel1',
            
				type: SPRITE_GRAVEL
			});
		}, 
		step: function(dt) {
			Q("TowerManMap").each(function() {
				levelWidth=this.getLevelWidth();
				levelHeight=this.getLevelHeight();	
			});
			this.p.x-=3;
			this.p.y-=3;
			if (this.p.x<0 || this.p.y<0 || this.p.x>levelWidth || this.p.y>levelHeight) this.destroy();
  		}  
	}); 
	Q.Sprite.extend("Gravel2", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'gravel1',
            
				type: SPRITE_GRAVEL
			});	
		},   
		step: function(dt) {
			Q("TowerManMap").each(function() {
				levelWidth=this.getLevelWidth();
				levelHeight=this.getLevelHeight();	
			});
			
			this.p.x+=3;
			this.p.y-=3;
			if (this.p.y<0 || this.p.x>levelWidth) this.destroy();
  		}  
	}); 
	Q.Sprite.extend("Gravel3", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'gravel3',
            
				type: SPRITE_GREENPOTION
			});	
		},   
		step: function(dt) {
			this.p.y-=5;
			if (this.p.y<0) this.destroy();
  		}   
	}); 
	Q.Sprite.extend("Gravel4", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'gravel4',
            
				type: SPRITE_GREENPOTION
			});
			var tm = Q("TowerManMap",1).first();
			this.levelHeight = tm.getLevelHeight();	
			this.levelWidth = tm.getLevelWidth();	
		},   
		step: function(dt) {
			this.p.y+=5;
			if (this.p.y>this.levelHeight) this.destroy();
  		}   
	}); 

	

	// Sprite to show which inventory item is selected

	Q.Sprite.extend("InventorySelector", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'inventoryselector',
  
				type: SPRITE_SANDPIT
			});
			Q.input.on("fire",this,"useItem");
			Q.input.on("action",this,"nextSelection");
		},
		nextSelection: function() {
			var player = Q("Player",1).first();
			
			if (!player.p.dead) {
				if (this.p.x < this.p.maxInventorySelectorX-32) {
					this.p.x+=32;
					
				} else {
					this.p.x=112;
				}
    				Q.state.set("menuSelectorX", this.p.x);
			}
		},
		useItem: function() {
			var player = Q("Player",1).first();
			
			if (!player.p.dead) {
				if (this.p.x==Q.state.get("deathPotionXPos") && Q.state.get("deathPotion")>0) {
					Q.state.set("deathPotion", Q.state.get("deathPotion")-1);
					if (Q.state.get("deathPotion")<1 && this.p.x>=this.p.maxInventorySelectorX-32) {
						this.p.x-=32;
						
					}
					player.p.deathPotionActivated = true;
				} else if (this.p.x==Q.state.get("firePotionXPos") && Q.state.get("firePotion")>0) {
					Q.state.set("firePotion", Q.state.get("firePotion")-1);
					if (Q.state.get("firePotion")<1 && this.p.x>=this.p.maxInventorySelectorX-32) {
						this.p.x-=32;
					}
					player.p.firePotionActivated = true;
				} else if (this.p.x==Q.state.get("greenPotionXPos") && Q.state.get("greenPotion")>0) {
					Q.state.set("greenPotion", Q.state.get("greenPotion")-1);
					if (Q.state.get("greenPotion")<1 && this.p.x>=this.p.maxInventorySelectorX-32) {
						this.p.x-=32;
					}
					player.p.greenPotionActivated = true;
				} else if (this.p.x==Q.state.get("purplePotionXPos") && Q.state.get("purplePotion")>0){
					var x = Q.state.get("purplePotion");
					x=x-1;
					Q.state.set("purplePotion", x);
					if (Q.state.get("purplePotion")<1 && this.p.x>=this.p.maxInventorySelectorX-32) {
						this.p.x-=32;
					}
					player.p.purplePotionActivated=true;  
					var delay=8000;//8 seconds
    					setTimeout(function(){
						//code to be executed after delay seconds
	    					player.p.purplePotionActivated=false;
					
    					},delay);
				} else if (this.p.x==Q.state.get("scrollXPos") && Q.state.get("scroll")>0){
					Q.state.set("scroll", Q.state.get("scroll")-1);
					if (Q.state.get("scroll")<1 && this.p.x>=this.p.maxInventorySelectorX-32) {
						this.p.x-=32;
					}
					var rand = Math.random();
					if (rand<0.25 && !player.p.scroll2Activated) {		//speed up enemies
						player.p.scroll2Activated = true;
						var delay=8000;//8 seconds
    						setTimeout(function(){
							//code to be executed after delay seconds
	    						player.p.scroll2Activated=false;
						},delay);
					} else if (rand<0.5) {
						player.p.scroll1Activated = true;		//get rid of all blocks
					} else if (rand<0.75) {
						player.p.scroll3Activated = true;		//teleport a new enemy
					} else {
						player.p.scroll4Activated = true;		//flower
					}
				} 
				Q.state.set("menuSelectorX", this.p.x);
				
    				if (Q.state.get("deathPotion")<1 && Q.state.get("firePotion")<1 && Q.state.get("greenPotion")<1 && Q.state.get("purplePotion")<1 && Q.state.get("scroll")<1) {
					this.destroy();
					this.p.x = 112;
					Q.state.set("menuSelectorX", this.p.x);
	
				}
				Q.stageScene("ui",2);
			}
		}
	});


 

	// Exit gate sprite, unlocked either by digging all sandpits or finding a buried key
	Q.Sprite.extend("Exitgate", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'exitgate',
   
				sprite: 'exitgate',
          
				type: SPRITE_TILES
			});	
			this.add("animation");
   
			this.on("hit.sprite",this,"hit");
 
		},
		hit: function(col) {
       
			if(col.obj.isA("Player") && Q.state.get("key")>0) {
				//Q.audio.play('gateopen.m4a');
				this.play("open");
				// use the deadtimer mechanism on the door so that door opening animation can be completed
				this.p.dead=true;	
				this.p.deadTimer = 0;
				col.obj.p.vy=0;
				Q.state.set("key", Q.state.get("key")-1);
				Q.stageScene("ui",2);
	    		}
                
		},
		step: function() {
			if(this.p.dead) {
      				this.p.deadTimer++;
      				if (this.p.deadTimer >40) {
        					// Gate open has been requested for 40 frames, remove it.
        					this.destroy();
      				}
      			}
		}, 
		end: function() {
			//Q.audio.play('gateopen.m4a');
			this.destroy();
			
		}		  
	});


 


     


	// Magic sprite for when an item is activated by the player
	Q.Sprite.extend("Magic", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'magic',
   
				sprite: 'magic',
          
				type: SPRITE_DARKNESS
			});	
			this.add("animation");
   
		},
		end: function() {
			this.destroy(); 
		}		  
	});

	// Flower sprite for when an item is activated by the player
	Q.Sprite.extend("Flower", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'flower',
   
				sprite: 'flower',
        
				type: SPRITE_FLOWER
			});	
			this.on("hit.sprite",this,"hit");
 
			this.on("inserted");
			this.p.deadTimer=0;
		}
,
		hit: function(col) {
          
			if(col.obj.isA("Enemy")) {
 
				col.obj.destroy();
				//Q.audio.play('flower.m4a');
			}
		},
		step: function() {
			this.p.deadTimer++;
      			if (this.p.deadTimer >600) {	//Flower lasts about ten seconds
        				this.destroy();
      			}
      		},
		inserted: function() {
			//Q.audio.play('flower.m4a');
		}		  
	});
	// Darkness square sprite
	Q.Sprite.extend("Darkness", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'darkness',
    
				sprite: 'darkness',        
				type: SPRITE_DARKNESS
			});	
			this.add("animation");
		},
		end: function() {
			this.destroy(); 
		}
	});


 


  

	// Create the Sandpit sprite
      
	Q.Sprite.extend("Sandpit", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'sandpit',
				sprite: 'sandpit',  
				frame: 0,          
				type: SPRITE_SANDPIT,
				/* Set sensor to true so that it gets notified when it's
 hit, but doesn't trigger collisions itself that cause
 the player to stop or change direction
 */          						sensor: true         
			});

       
			this.add("animation");
			this.on("sensor");
      
			this.on("inserted");
      
		},
		
		// When a rock is hit..
        
		 
		sensor: function() {
          
			//Q.audio.play('dig.m4a');
			// Destroy it and keep track of how many pits are left
   
			this.stage.pitCount--;
 
			var player=Q("Player",1).first();
			var newx=this.p.x;
			var newy=this.p.y;
			this.destroy();
			
			if (player.p.playerDirection=="left") {
				var gravel1=new Q.Gravel1({ x: newx, y: newy});
				this.stage.insert(gravel1);
 
			} else if (player.p.playerDirection =="right") {
				var gravel2=new Q.Gravel2({ x: newx, y: newy});
				this.stage.insert(gravel2);
			} else if (player.p.playerDirection=="up") {
				var gravel3=new Q.Gravel3({ x: newx, y: newy});
				this.stage.insert(gravel3);
			} else if (player.p.playerDirection=="down") {
				var gravel4=new Q.Gravel4({ x: newx, y: newy});
				this.stage.insert(gravel4);
			} 


			
										
			if (this.p.sandPit=="enemy") {
				
				var enemy=new Q.Enemy({x: newx, y: newy});
				var player = Q("Player",1);
				player.each(function() {
				this.p.hitSandpit = true;
				this.p.immune = true;
    				this.p.immuneTimer = 0;
				this.p.immuneOpacity = 1;
				});
				
				this.stage.insert(enemy);

				//Q.audio.play('newmonster.m4a');
			} else {
				if (this.p.sandPit=="diamond") {
					var treasure=new Q.Diamond({ x: newx, y: newy});
					this.stage.insert(treasure);

					Q.state.set("score", Q.state.get("score")+2);
				} else if (this.p.sandPit=="goldJug") {
					var treasure=new Q.Goldjug({ x: newx, y: newy});
					this.stage.insert(treasure);

					Q.state.set("score", Q.state.get("score")+1);
				} else if (this.p.sandPit=="chest") {
					var treasure=new Q.Chest({ x: newx, y: newy, scale: 0.9});
					this.stage.insert(treasure);

					Q.state.set("score", Q.state.get("score")+1);
				}else if (this.p.sandPit=="scroll") {
					var treasure=new Q.Scroll({ x: newx, y: newy});
					this.stage.insert(treasure);

					Q.state.set(this.p.sandPit,  Q.state.get(this.p.sandPit)+1);
				} else if (this.p.sandPit=="heart"){
					var treasure=new Q.Heart({ x: newx, y: newy});
					this.stage.insert(treasure);

					Q.state.set("lives", Q.state.get("lives")+1);
					//Q.audio.play('heart.m4a');
				} else if (this.p.sandPit=="key"){
					var treasure=new Q.Key({ x: newx, y: newy});
					this.stage.insert(treasure);

					Q.state.set(this.p.sandPit,  Q.state.get(this.p.sandPit)+1);
				} else if (this.p.sandPit=="greenPotion"){
					var treasure=new Q.Greenpotion({ x: newx, y: newy});
					this.stage.insert(treasure);

					Q.state.set(this.p.sandPit,  Q.state.get(this.p.sandPit)+1);
				} else if (this.p.sandPit=="deathPotion"){
					var treasure=new Q.Deathpotion({ x: newx, y: newy});
					this.stage.insert(treasure);

					Q.state.set(this.p.sandPit,  Q.state.get(this.p.sandPit)+1);
				} else if (this.p.sandPit=="purplePotion"){
					var treasure=new Q.Purplepotion({ x: newx, y: newy});
					this.stage.insert(treasure);

					Q.state.set(this.p.sandPit,  Q.state.get(this.p.sandPit)+1);
				} else if (this.p.sandPit=="firePotion"){
					var treasure=new Q.Firepotion({ x: newx, y: newy});
					this.stage.insert(treasure);

					Q.state.set(this.p.sandPit,  Q.state.get(this.p.sandPit)+1);
				}
				
				Q.stageScene("ui",2);
				var delay=300;//0.3 seconds
    				setTimeout(function(){
					// code to be executed after delay seconds
					if (treasure!=null) {
						treasure.destroy();
					}
    				},delay);
			}
			/*this.stage.sandpitNumber is the index number of each each element (eg potion, treasure, scroll, 1-up heart or zero element) in the sandpit array
			Increment it every time a sandpit is dug up */
			this.stage.sandpitNumber = this.stage.sandpitNumber || 0;		
			this.stage.sandpitNumber++;
			
			// If there are no more sandpits left, open the exit gate   (gate opens animation)
			if(this.stage.pitCount < 1) {
 
				Q("Exitgate",1).first().play("open");  
				Q("Exitgate",1).first().on("end");
			}
        
		},  
    
		/* When a sandpit is inserted, use its parent (the stage)
 to keep track of the total number of pits on the stage
 */

		inserted: function() {
          
			this.stage.pitCount = this.stage.pitCount || 0
          
			this.stage.pitCount++;
        
		}

	});


      

	// Create the empty pit sprite (this shows after the hole has been dug)
      
	Q.Sprite.extend("Dugpit", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'dugup',
				sprite: 'dugup',            
				type: SPRITE_DUGUP,
				frame: 0      						      
			});

       
			this.add("animation");
		}
	});

	// Game Over screen sprite
	Q.Sprite.extend("Game_over", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'gameover',
   
				type: SPRITE_FLOWER
			});
			this.on("inserted");	
		}
,
		inserted: function() {
          
			//Q.audio.play('gameover.m4a');     
		}

	});

	Q.Sprite.extend("LeftArrow", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'leftarrow',
   
				type: SPRITE_FLOWER
			});
		}	
	});

	Q.Sprite.extend("RightArrow", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'rightarrow',
   
				type: SPRITE_FLOWER
			});
		}	
	});

	Q.Sprite.extend("UpArrow", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'uparrow',
   
				type: SPRITE_FLOWER
			});
		}	
	});

	Q.Sprite.extend("DownArrow", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'downarrow',
   
				type: SPRITE_FLOWER
			});
		}	
	});

	Q.Sprite.extend("Z", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'Z',
   
				type: SPRITE_FLOWER
			});
		}	
	});

	Q.Sprite.extend("X", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'X',
   
				type: SPRITE_FLOWER
			});
		}	
	});

	Q.Sprite.extend("Space", {
 
		init: function(p) {
          
			this._super(p,{
            
				sheet: 'space',
   
				type: SPRITE_FLOWER
			});
		}	
	});
     
	/* Return an x and y location from a row and column
 in our tile map
      */

	Q.tilePos = function(col,row) {
        
		return { x: col*32 + 16, y: row*32 + 16 };
      
	}

 

	Q.TileLayer.extend("TowerManMap",{
        
		init: function() {
          
			this._super({
            
				type: SPRITE_TILES,
            
				dataAsset: Q.state.get("levelFile"),
 
				numberOfSandpits: 0,           
				sheet:     'tiles'        		
			});

        
		},
        
        
	
		setup: function() {
          
			// Clone the top level array
          
			var tiles = this.p.tiles = this.p.tiles.concat();
   
	       		for(var y=0;y<tiles.length;y++) {
            
				var row = tiles[y] = tiles[y].concat();
            
				for(var x =0;x<row.length;x++) {
              
					var tile = row[x];

  
					//check the map for (x,y) co-ords of player start position and exit door - these are then added in the level scene    
					if((tile == 0)&&(y!=tiles.length-1)&&(y!=0)&&(x!=row.length-1)&&(x!=0)) {
  
						
						// Under each sandpit sprite there is a dug hole sprite
						var hole=new Q.Dugpit(Q.tilePos(x,y));
						this.stage.insert(hole);
    
						//check that we're not on the player's level start position
						if (y!=this.stage.playerStartY||x!=this.stage.playerStartX) {
							sandpit =  new Q.Sandpit(Q.tilePos(x,y))          
							this.stage.insert(sandpit);
							if (x==1 && y==tiles.length-2) {
								this.p.enemyOneXStart = x;
								this.p.enemyOneYStart = y;
							} else if (x== row.length-2 && y==tiles.length-2) {
								this.p.enemyTwoXStart = x;
								this.p.enemyTwoYStart = y;
							} else if (x== row.length-2 && y==1) {
								this.p.enemyThreeXStart = x;
								this.p.enemyThreeYStart = y;
							} 
						}
      
						this.p.numberOfSandpits++;          
					}
 else if (tile == 2 && y==0) {
						this.p.playerXStart = x;
						this.p.playerYStart = y+1;
					} else if (tile == 0 && y==tiles.length-1) {
						this.p.exitX = x;
						this.p.exitY = y;
					}          
				}
    
				this.levelHeight = tiles.length*32;
				this.levelWidth = row.length*32;     
			}
		}

,

		getLevelWidth: function() {
			return this.levelWidth;
		},
		getLevelHeight: function() {
			return this.levelHeight;
		}
	});

  

	Q.component("enemyControls", {
        
		defaults: { speed: 80, direction: 'left', switchPercent: 2 },

        
		added: function() {
          
			var p = this.entity.p;

          
			Q._defaults(p,this.defaults);

          
			this.entity.on("step",this,"step");
          
			this.entity.on('hit',this,"changeDirection");
        
		},

        
		step: function(dt) {
          
			var p = this.entity.p;

          
			if(Math.random() < p.switchPercent / 100) {
            
				this.tryDirection();
          
			}

          
			switch(p.direction) {
            
				case "left": p.vx = -p.speed; break;
            
				case "right":p.vx = p.speed; break;
            
				case "up":   p.vy = -p.speed; break;
            
				case "down": p.vy = p.speed; break;
          
			}
			this.entity.play("walk");
   
			var player=Q("Player",1).first();
			if (player.p.scroll2Activated) {
				p.speed = 160;
			} else {
				p.speed = 90;
			}  
			
			if (p.y>Q("TowerManMap", 1).first().getLevelHeight()) {
				p.vy=-1*p.vy;
			}
		},

        
		tryDirection: function() {
          
			var p = this.entity.p; 
          
			var from = p.direction;
          
			if(p.vy != 0 && p.vx == 0) {
            
				p.direction = Math.random() < 0.5 ? 'left' : 'right';
          
			} else if(p.vx != 0 && p.vy == 0) {
            
				p.direction = Math.random() < 0.5 ? 'up' : 'down';
          
			}
        
		},

        
		changeDirection: function(collision) {
          
			var p = this.entity.p;
 
			// if enemy hits a wall.........         
			if(p.vx == 0 && p.vy == 0) {
            
				if(collision.normalY) {
              
					p.direction = Math.random() < 0.5 ? 'left' : 'right';
            
				} else if(collision.normalX) {
              
					p.direction = Math.random() < 0.5 ? 'up' : 'down';
            
				}
          
			}
        
		}
      
	});


      

	Q.Sprite.extend("Enemy", {
 
		init: function(p) {

          
			this._super(p,{
            
				sheet:"enemy",
       
				sprite:"enemy",	//needed for enemy animation
      
				type: SPRITE_ENEMY,
				onCreatedTimer
:0,         
				collisionMask: SPRITE_PLAYER | SPRITE_TILES

			});

          
			this.add("2d,enemyControls,animation");
          
			this.on("hit.sprite",this,"hit");
  
			    
		},

        
		hit: function(col) {
          
			if(col.obj.isA("Player") && !col.obj.p.immune && !col.obj.p.dead) {
				Q.state.set("lives", Q.state.get("lives")-1);
				this.destroy(); 
				Q.stageScene("ui",2);
        				if(Q.state.get("lives") == 0){
					col.obj.p.dead = true;
					col.obj.p.vx = col.obj.p.vy = 0;
					if (Q.state.get("score") > Q.state.get("hiscore")) {
						Q.state.set("hiscore", Q.state.get("score"));
					}
					var gameOver=new Q.Game_over({ x:col.obj.p.x, y:col.obj.p.y+40 });
					if (gameOver.p.x < 128) {
						gameOver.p.x = 128;
					}
					this.stage.insert(gameOver);
					col.obj.play("dead",1);
					var delay=6000;//6 seconds
    					setTimeout(function(){
						Q.clearStages();
						Q.stageScene("hiscores");
	    				},delay);
        				} 
			}

		},

		step: function() {
			this.p.onCreatedTimer++;
			if(this.p.dead) {
      				this.del("2d,enemyControls");
      				this.p.deadTimer++;
      				if (this.p.deadTimer > 30) {
        					// Dead for 30 frames, remove it.
        					this.destroy();
      				}
      			}
		}
	});

	Q.scene('ui', function(stage){
        		var container = stage.insert(new Q.UI.Container({
    			x: 0, 
			y: 0
		}));
		
		var levelHeight = Q("TowerManMap",1).first().getLevelHeight();
		var levelWidth=Q("TowerManMap",1).first().getLevelWidth();
			
		
		// nextItemX will hold x-co-ordinate of next interactive inventory item (items other than hearts & keys) as they are added	
		var nextItemX=112;
		
		var label1 = container.insert(new Q.UI.Text({x:levelWidth-188, y: levelHeight-4, label: "Score: " + Q.state.get("score"), color: "green",size:26, family:"Book Antiqua" }));

  		var label2 = container.insert(new Q.Heart({x: 16, y: levelHeight+14, scale: 0.8}));

		var label3 = container.insert(new Q.UI.Text({x:30, y: levelHeight+10, label: "" +Q.state.get("lives"), color: "red",size:14 }));

		var label4 = container.insert(new Q.UI.Text({x:levelWidth-64, y: levelHeight-4, label: "Hi-sc: " + Q.state.get("hiscore0"), color: "purple",size:26, family:"Book Antiqua" }));
	
		if (Q.state.get("scroll")>0) {
			var label5 = container.insert(new Q.Scroll({x: nextItemX, y: levelHeight+14, scale:0.8}));
			container.insert(new Q.UI.Text({x: nextItemX+16, y: levelHeight+10, label: "" +Q.state.get("scroll"), color: "white",size:14 }));
			Q.state.set("scrollXPos", nextItemX);		// keep track of x co-ordinate of each menu item acquired
			nextItemX+=32;
		}
		if (Q.state.get("greenPotion")>0) {
			var label6 = container.insert(new Q.Greenpotion({x: nextItemX, y: levelHeight+14, scale:0.8}));
			container.insert(new Q.UI.Text({x: nextItemX+16, y: levelHeight+10, label: "" +Q.state.get("greenPotion"), color: "#0b5c24",size:14 }));
			Q.state.set("greenPotionXPos", nextItemX);		// keep track of x co-ordinate of each menu item acquired
			nextItemX+=32;
		}
		if (Q.state.get("deathPotion")>0) {
			var label7 = container.insert(new Q.Deathpotion({x: nextItemX, y: levelHeight+14, scale:0.8}));
			container.insert(new Q.UI.Text({x:nextItemX+16, y:levelHeight+10, label: "" +Q.state.get("deathPotion"), color: "pink",size:14 }));
			Q.state.set("deathPotionXPos", nextItemX);		// keep track of x co-ordinate of each menu item acquired
			nextItemX+=32;
		}
		if (Q.state.get("firePotion")>0) {
			var label5 = container.insert(new Q.Firepotion({x: nextItemX, y: levelHeight+14, scale:0.8}));
			container.insert(new Q.UI.Text({x: nextItemX+16, y: levelHeight+10, label: "" +Q.state.get("firePotion"), color: "orange",size:14 }));
			Q.state.set("firePotionXPos", nextItemX);		// keep track of x co-ordinate of each menu item acquired
			nextItemX+=32;
		}
		if (Q.state.get("purplePotion")>0) {
			var label6 = container.insert(new Q.Purplepotion({x: nextItemX, y: levelHeight+14, scale:0.8}));
			container.insert(new Q.UI.Text({x: nextItemX+16, y: levelHeight+10, label: "" +Q.state.get("purplePotion"), color: "purple",size:14 }));
			Q.state.set("purplePotionXPos", nextItemX);		// keep track of x co-ordinate of each menu item acquired
			nextItemX+=32;
		}
		if (Q.state.get("key")>0) {
			var label6 = container.insert(new Q.Key({x: 284, y: levelHeight+14, scale:0.8}));
		}
		// If there is one or more selectable inventory item, add a menu selector for choosing between items
		if (nextItemX>112) {
			var menuselector =new Q.InventorySelector({x: Q.state.get("menuSelectorX"), y: levelHeight+14});
			container.insert(menuselector);
			menuselector.p.maxInventorySelectorX = nextItemX;
		} 
		container.fit(20);
	});

	Q.scene("gameOver",function(stage) {

		var container = stage.insert(new Q.UI.Container({
    			x: Q.width/2, 
			y: Q.height/2, 
			fill: "rgba(0,0,0,0.5)"
  		}));
		gameOver = new Q.Game_over({ x: 10, y: 10});
		container.insert(gameOver);
		stage.insert(gameOver);
		
		// Expand the container to visibily fit it's contents
  		// (with a padding of 20 pixels)
  		container.fit(20);
	});

	Q.scene("intro",function(stage) {

		// Reset game variables
		Q.state.set({	
				lives:3, score:0, levelNumber: 0, 
				scroll:0, greenPotion:0,deathPotion:0, firePotion:0, purplePotion:0, key:0, 
				scrollXPos:0, greenPotionXPos:0, deathPotionXPos:0, firePotionXPos:0, purplePotionXPos:0, 
				menuSelectorX: 112, 
		});

		// If this is the first time the intro screen is displayed, set the top ten hiscores
		if (Q.state.get("firstIntro")!=0) {
			Q.state.set({	
				name0: "Eric", name1: "Rob", name2: "Anita Chipmunk", name3: "John", name4: "Mary", name5: "Snaz", name6: "Tess", name7: "Bert", name8: "Ficklefan", name9: "Howard",
				hiscore0: 956, hiscore1: 803, hiscore2: 691, hiscore3: 654, hiscore4: 483, hiscore5: 402, hiscore6: 257, hiscore7: 176, hiscore8: 138, hiscore9: 78
			});
		}
		Q.state.set("firstIntro", 0);
		var levels = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
		// Randomise levels
		levels = Q._shuffle(levels);
		Q.state.set("levelsArray", levels);
		// No need to reset the menu items' x co-ords because the ui component overwrites the values
		// as they're added
	
		var gameTitleBottom = stage.insert(new Q.TitleBottom({x: Q.width/2, y:50, scale: 1.1}));
		var gameTitleTop = stage.insert(new Q.IntroTitleTop({x: Q.width/2, y:50, scale: 1.1}));
		var title = stage.insert(new Q.UI.Text({x:Q.width/2, y: 100, label: "Controls", color: "orange",size:26, family:"Book Antiqua" }));
		var hs = stage.insert(new Q.UI.Text({x:Q.width/2, y: 370, label: "Hi-score:  "+ Q.state.get("hiscore0"), color: "purple",size:26, family:"Book Antiqua" }));
		var caption = stage.insert(new Q.UI.Text({x:Q.width/2, y: 470, label: "Enter", color: "orange", size:26, family:"Book Antiqua" }));
		var container = stage.insert(new Q.UI.Container({
    			
			x: Q.width/2, 
			y: 200,
			fill: "black",
			border: 5,
      			shadow: 10,
			shadowColor: "orange"
		}));

		container.insert(new Q.LeftArrow({ x:-240, y:0 }));
		container.insert(new Q.RightArrow({ x:-200, y:0 }));
		container.insert(new Q.UpArrow({ x:-160, y:0 }));
		container.insert(new Q.DownArrow({ x:-120, y:0 }));
		container.insert(new Q.Z({ x:-120, y:58 }));
		container.insert(new Q.Space({ x:-179, y:116 }));
	

		stage.insert(new Q.UI.Text({ 
      			label: "Move\n\nSelect inventory item\n\nUse item",
			align: "left",
      			color: "orange",
			family:"Book Antiqua",
      			x: 0,
      			y: -17
    		}),container);

		// Expand the container to visibily fit it's contents (with a padding of 20 pixels)
  		container.fit(20);
		stage.insert(new Q.UI.Button({
			asset: "exitgate.png",
			y: 435,
      			x: Q.width/2
		}, function() {
			Q.clearStages();
			Q.stageScene('level', 1);
	    	}));
		
		
		//Q.audio.play("title.m4a");
	});

	Q.scene("level",function(stage) {

		Q.state.set("levelNumber", Q.state.get("levelNumber")+1);
		var enemyXPosition = [], enemyYPosition = [];
		if (Q.state.get("levelNumber")==1) {
			Q.state.set("levelFile", "level1.json");
		} else {
			var levelArray=Q.state.get("levelsArray") ;
			var levelNumber = Q.state.get("levelNumber");
			Q.state.set("levelFile", "level"+ levelArray[levelNumber-2] +".json");
		}
		
		var map = stage.collisionLayer(towerManMap = new Q.TowerManMap());
     
		map.setup();

 
		var sandPit = [];
			
		var items = [ "heart", "greenPotion", "purplePotion", "deathPotion", "firePotion", "scroll", "greenPotion", "purplePotion", "deathPotion", "firePotion", "scroll", "key","greenPotion","greenPotion","greenPotion",  "greenPotion", "greenPotion"];
		items = Q._shuffle(items);
		for (var z=0;z<towerManMap.p.numberOfSandpits; z++) {
			if (z < 20*(towerManMap.p.numberOfSandpits/100)) {
				sandPit[z]="diamond";
			} else if (z < 40*(towerManMap.p.numberOfSandpits/100)) {
				sandPit[z]="goldJug";
			} else if (z < 60*(towerManMap.p.numberOfSandpits/100)) {
				sandPit[z]="chest";
			} else if (z < 61*(towerManMap.p.numberOfSandpits/100)) {
				sandPit[z]=items[0];
			} else if (z < 62*(towerManMap.p.numberOfSandpits/100)) {
				sandPit[z]=items[1];
			} else if (z < 66*(towerManMap.p.numberOfSandpits/100)) {
				sandPit[z]="enemy";
			} else {
				sandPit[z]="";
			}
		}
   
		// Randomise the contents of each sandpit
		sandPit =Q._shuffle(sandPit); 

		// Insert the player and exit gate according to co-ordinates obtained from within the map class
		var hole=new Q.Dugpit(Q.tilePos(towerManMap.p.exitX, towerManMap.p.exitY));
		stage.insert(hole);
  
		var exit = new Q.Exitgate(Q.tilePos(towerManMap.p.exitX, towerManMap.p.exitY));
		stage.insert(exit);
		var player;
		stage.insert(player=new Q.Player(Q.tilePos(towerManMap.p.playerXStart,towerManMap.p.playerYStart)));

		// Insert initial enemies, two on first few levels, three thereafter
		stage.insert(new Q.Enemy(Q.tilePos(towerManMap.p.enemyOneXStart,towerManMap.p.enemyOneYStart)));
		stage.insert(new Q.Enemy(Q.tilePos(towerManMap.p.enemyTwoXStart,towerManMap.p.enemyTwoYStart)));
		if (Q.state.get("levelNumber")>3) {
			stage.insert(new Q.Enemy(Q.tilePos(towerManMap.p.enemyThreeXStart,towerManMap.p.enemyThreeYStart)));	
		}
		var pit;
		var dug;
		var pitTextures=Math.floor(Math.random()*10);
		for (var z=0;z<towerManMap.p.numberOfSandpits; z++) {
			pit = Q("Sandpit").at(z);
			dug = Q("Dugpit").at(z);
			pit.p.sandPit=sandPit[z];
				
			if (Q.state.get("levelNumber")==1) {
				pit.p.frame=0;
				dug.p.frame=0;
				hole.p.frame=0;
			} else {
				
				pit.p.frame=pitTextures;
				dug.p.frame=pitTextures;
				hole.p.frame=pitTextures;
			}
		}
   
	});

 

	Q.scene("hiscores",function(stage) {

		
		var gameTitleBottom = stage.insert(new Q.TitleBottom({x: Q.width/2, y:50, scale: 1.1}));
		var gameTitleTop = stage.insert(new Q.TitleTop({x: Q.width/2, y:50, scale: 1.1}));
		var title = stage.insert(new Q.UI.Text({x:Q.width/2, y: 100, label: "Hi-Scores", color: "yellow",size:26, family:"Book Antiqua" }));
		
		if (Q.state.get("score")>Q.state.get("hiscore9")) {
			var caption = stage.insert(new Q.UI.Text({x:Q.width/2, y: 150, label: "You have made the Hall of Fame. Brutal! Please enter your name.", color: "yellow",size:18, family:"Book Antiqua" }));
			var letters=[];
			var upper=[ "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
			var lower=[ "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
			letters=upper;
			var i=0;


			var container = stage.insert(new Q.UI.Container({
    			
				x: Q.width/2, 
				y: 225,
				fill: "black",
				border: 5,
      				shadow: 10,
				align: "center",
				shadowColor: "orange"
			}));

			container.insert(leftButton=new Q.UI.Button({
				asset: "leftArrow.png",
				x:-150,
				y: 25
			}, function() {
				i--;
				if (i<0) i=25;
				letterButton.p.label = letters[i];
			}));

			container.insert(rightButton=new Q.UI.Button({
				asset: "rightArrow.png",
				x: -100,
				y: 25
			}, function() {
				i++;
				if (i>25) i=0;
				letterButton.p.label = letters[i];
			}));

			container.insert(letterButton=new Q.UI.Button({
				label: letters[i],
				x:-35,
				y: 25,
				width: 50,
				height: 50,
				scale: 1.5,
				fill: "purple",
				border: 5,
				shadow: 10
			}, function() {
				nameText.p.label += letters[i];
				if (letters ==upper) {
					letters = lower;
				}
				i=0;
				this.p.label = letters[i];
			}));

			container.insert(selectButton=new Q.UI.Button({
				asset: "select.png",
				x:50,
				y: 25
			}, function() {
				if (nameText.p.label =="") {
					nameText.p.label = letters[i];
				} else {
					nameText.p.label += letters[i];
				}
				if (letters ==upper) {
					letters = lower;
				}
				i=0;
				letterButton.p.label = letters[i];
			}));

			container.insert(spaceButton=new Q.UI.Button({
				asset: "space.png",
				x:125,
				y: 25
			}, function() {
				i=0;
				letters = upper;
				nameText.p.label += " ";
				letterButton.p.label = letters[i];
			}));

			container.insert(deleteButton=new Q.UI.Button({
				asset: "delete.png",
				x:200,
				y: 25
			}, function() {
				var len = nameText.p.label.length-1;
				var name = nameText.p.label.substr(0, len);
				nameText.p.label = name;
				len = nameText.p.label.length;
				if (nameText.p.label.charAt(len-1)==" " || nameText.p.label == "") {
					letters=upper;
				} else {
					letters=lower;
				}
				x=0;
				letterButton.p.label = ""+ letters[x];
			}));

			var nameText = container.insert(new Q.UI.Text({x:0, y: 75, label: " ", color: "red",size:22, family:"Book Antiqua" }));

			stage.insert(new Q.UI.Button({
				asset: "exitgate.png",
				y: 445,
      				x: (Q.width/2),
			}, function() {
				nameText.p.label = nameText.p.label.trim();
				if (nameText.p.label != "") {
					var names = [];
					var hiscores = [];
					names[0] = Q.state.get("name0");	hiscores[0] = Q.state.get("hiscore0");
					names[1] = Q.state.get("name1");	hiscores[1] = Q.state.get("hiscore1");
					names[2] = Q.state.get("name2");	hiscores[2] = Q.state.get("hiscore2");
					names[3] = Q.state.get("name3");	hiscores[3] = Q.state.get("hiscore3");
					names[4] = Q.state.get("name4");	hiscores[4] = Q.state.get("hiscore4");
					names[5] = Q.state.get("name5");	hiscores[5] = Q.state.get("hiscore5");
					names[6] = Q.state.get("name6");	hiscores[6] = Q.state.get("hiscore6");
					names[7] = Q.state.get("name7");	hiscores[7] = Q.state.get("hiscore7");
					names[8] = Q.state.get("name8");	hiscores[8] = Q.state.get("hiscore8");
					names[9] = Q.state.get("name9");	hiscores[9] = Q.state.get("hiscore9");
					names[10] = nameText.p.label;		hiscores[10] = Q.state.get("score");
					var i = 10;
					var tempName, tempScore;
					do {
						tempName = names[i-1];
						tempScore = hiscores[i-1];
						names[i-1] = names[i];
						hiscores[i-1] = hiscores[i];
						names[i] = tempName;
						hiscores[i] = tempScore;
						i--;
						
					} while (i>0 && hiscores[i]>hiscores[i-1]);
				
					Q.state.set("name0", names[0]);		Q.state.set("hiscore0", hiscores[0]);
					Q.state.set("name1", names[1]);		Q.state.set("hiscore1", hiscores[1]);
					Q.state.set("name2", names[2]);		Q.state.set("hiscore2", hiscores[2]);
					Q.state.set("name3", names[3]);		Q.state.set("hiscore3", hiscores[3]);
					Q.state.set("name4", names[4]);		Q.state.set("hiscore4", hiscores[4]);
					Q.state.set("name5", names[5]);		Q.state.set("hiscore5", hiscores[5]);
					Q.state.set("name6", names[6]);		Q.state.set("hiscore6", hiscores[6]);
					Q.state.set("name7", names[7]);		Q.state.set("hiscore7", hiscores[7]);
					Q.state.set("name8", names[8]);		Q.state.set("hiscore8", hiscores[8]);
					Q.state.set("name9", names[9]);		Q.state.set("hiscore9", hiscores[9]);
					Q.clearStages();
					Q.state.set("score", 0);
      					Q.stageScene('hiscores');
				}
    			}));
			var caption = stage.insert(new Q.UI.Text({x:Q.width/2, y: 480, label: "Done", color: "orange", size:26, family:"Book Antiqua" }));
			
			
		} else {
			var container = stage.insert(new Q.UI.Container({
    				x: Q.width/2, 
				y: 175,
				fill: "black",
				border: 5,
      				shadow: 10,
				align: "center",
				shadowColor: "orange"
			}));

			stage.insert(new Q.UI.Text({align: "left", x:-100, y: 0, label: ""+Q.state.get("name0"), color: "orange",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({align: "left", x:-100, y: 32, label: ""+Q.state.get("name1"), color: "orange",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({align: "left", x:-100, y: 64, label: ""+Q.state.get("name2"), color: "orange",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({align: "left", x:-100, y: 96, label: ""+Q.state.get("name3"), color: "orange",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({align: "left", x:-100, y: 128, label: ""+Q.state.get("name4"), color: "orange",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({align: "left", x:-100, y: 160, label: ""+Q.state.get("name5"), color: "orange",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({align: "left", x:-100, y: 192, label: ""+Q.state.get("name6"), color: "orange",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({align: "left", x:-100, y: 224, label: ""+Q.state.get("name7"), color: "orange",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({align: "left", x:-100, y: 256, label: ""+Q.state.get("name8"), color: "orange",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({align: "left", x:-100, y: 288, label: ""+Q.state.get("name9"), color: "orange",size:16, family:"Book Antiqua" }), container);

			stage.insert(new Q.UI.Text({x:100, y: 0, label: ""+Q.state.get("hiscore0"), color: "red",size:16,  family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({x:100, y: 32, label: ""+Q.state.get("hiscore1"), color: "red",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({x:100, y: 64, label: ""+Q.state.get("hiscore2"), color: "red",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({x:100, y: 96, label: ""+Q.state.get("hiscore3"), color: "red",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({x:100, y: 128, label: ""+Q.state.get("hiscore4"), color: "red",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({x:100, y: 160, label: ""+Q.state.get("hiscore5"), color: "red",size:16,  family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({x:100, y: 192, label: ""+Q.state.get("hiscore6"), color: "red",size:16, family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({x:100, y: 224, label: ""+Q.state.get("hiscore7"), color: "red",size:16,  family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({x:100, y: 256, label: ""+Q.state.get("hiscore8"), color: "red",size:16,  family:"Book Antiqua" }), container);
			stage.insert(new Q.UI.Text({x:100, y: 288, label: ""+Q.state.get("hiscore9"), color: "red",size:16, family:"Book Antiqua" }), container);
		
			// Expand the container to visibily fit it's contents
			// (with a padding of 20 pixels)
  			container.fit(20);
			stage.insert(new Q.UI.Button({
				asset: "exitgate.png",
				y: 560,
      				x: (Q.width/2)
			}, function() {
				Q.stageScene('intro');
			}));
			var caption = stage.insert(new Q.UI.Text({x:Q.width/2, y: 590, label: "Done", color: "orange",size:26, family:"Book Antiqua" }));
		}
	});
		
	Q.load(["sprites.png", "sprites.json", "level1.json", "level2.json","level3.json","level4.json", "level5.json", "level6.json", "level7.json", "level8.json", "level9.json", "level10.json", "level11.json", "level12.json", "level13.json", "level14.json", "level15.json", "level16.json", "level17.json", "level18.json", "level19.json", "level20.json", "level21.json", "tiles.png", "exitgate.png", "titletop.png", "titlebottom.png", "leftArrow.png", "rightArrow.png", "select.png", "space.png", "delete.png", "dig.m4a", "dead.m4a", "deathpotion.m4a", "fall.m4a", "firepotion.m4a", "gameover.m4a", "gateopen.m4a", "greenpotion.m4a", "heart.m4a", "newmonster.m4a", "sandpitspell.m4a", "title.m4a"], function() {
        		
		Q.sheet("tiles","tiles.png", { tileW: 32, tileH: 32 });

        
		Q.compileSheets("sprites.png","sprites.json");

        
		Q.animations("player", {
      			walk_right: { frames: [0,1], rate: 1/5, flip: false, loop: false, next: "stand_right" },
      			walk_left: { frames:  [0,1], rate: 1/5, flip:"x", loop: false, next: "stand_left" },
			walk_up: { frames:  [2,3], rate: 1/5, loop: false, next: "stand_up" },
			walk_down: { frames:  [4,5], rate: 1/5, loop: false, next: "stand_down" },
			dig_left: { frames: [6,7,8], rate: 1/5,  flip:"x", loop: false, next: "stand_left" },
      			dig_right: { frames: [6,7,8], rate: 1/5, flip:false, loop: false, next: "stand_right" },
			dig_up: { frames: [8], rate: 1/6, loop: false, next: "stand_up" },
      			dig_down: { frames: [10,11,12], rate: 1/5, loop: false, next: "stand_down" },
			stand_right: { frames: [9], rate: 1/5, flip: false, loop: false },
      			stand_left: { frames:  [9], rate: 1/5, flip:"x", loop: false },
			stand_down: { frames:  [13], rate: 1/5, flip:false, loop: false },
			stand_up: { frames:  [14], rate: 1/5, flip:false, loop: false },
			dead: { frames:  [15], rate: 7, flip:false, loop: false }
    		});
		
		Q.animations("enemy", {
      			walk: { frames: [0,1], rate: 1/2, flip: false, loop: true },
      			darkness: { frames: [10], rate: 1/2, flip: false, loop: false },
			fire: { frames: [5,6,7,8,9], rate: 2/5, flip: false, loop: false },
			fall: { frames: [1,2,3,4], rate: 7/10, flip: false, loop: false }
    		});

		Q.animations("exitgate", {
      			open: { frames: [0,1,2,3,4], rate: 1/5, flip: false, loop: false, trigger: "end" }
      		});

		Q.animations("magic", {
      			sparkle: { frames: [10,11,12,10,11,12], rate: 1/2, flip: false, loop: false, trigger: "end" },
			green: { frames: [7,8,9,7,8,9], rate: 1/2, flip: false, loop: false, trigger: "end" },
			portal: { frames: [4,5,6,4,5,6,4,5,6,4,5,6], rate: 1/2, flip: false, loop: false, trigger: "end" }
    		});
		Q.animations("sandpit", {
      			darknessafterdeath0: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal0" },
			darknessaftergreen0: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal0" },
			darknessafterdeath1: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal1" },
			darknessaftergreen1: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal1" },
			darknessafterdeath2: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal2" },
			darknessaftergreen2: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal2" },
			darknessafterdeath3: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal3" },
			darknessaftergreen3: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal3" },
			darknessafterdeath4: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal4" },
			darknessaftergreen4: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal4" },
			darknessafterdeath5: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal5" },
			darknessaftergreen5: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal5" },
			darknessafterdeath6: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal6" },
			darknessaftergreen6: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal6" },
			darknessafterdeath7: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal7" },
			darknessaftergreen7: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal7" },
			darknessafterdeath8: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal8" },
			darknessaftergreen8: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal8" },
			darknessafterdeath9: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal9" },
			darknessaftergreen9: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal9" },
			normal0: { frames: [0], rate: 1/5, flip: false, loop: false },
			normal1: { frames: [1], rate: 1/5, flip: false, loop: false },
			normal2: { frames: [2], rate: 1/5, flip: false, loop: false },
			normal3: { frames: [3], rate: 1/5, flip: false, loop: false },
			normal4: { frames: [4], rate: 1/5, flip: false, loop: false },
			normal5: { frames: [5], rate: 1/5, flip: false, loop: false },
			normal6: { frames: [6], rate: 1/5, flip: false, loop: false },
			normal7: { frames: [7], rate: 1/5, flip: false, loop: false },
			normal8: { frames: [8], rate: 1/5, flip: false, loop: false },
			normal9: { frames: [9], rate: 1/5, flip: false, loop: false }
		});
		Q.animations("dugup", {
      			darknessafterdeath0: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal0" },
			darknessafterdeath1: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal1" },
			darknessafterdeath2: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal2" },
			darknessafterdeath3: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal3" },
			darknessafterdeath4: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal4" },
			darknessafterdeath5: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal5" },
			darknessafterdeath6: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal6" },
			darknessafterdeath7: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal7" },
			darknessafterdeath8: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal8" },
			darknessafterdeath9: { frames: [10], rate: 7/5, flip: false, loop: false, next: "normal9" },
			darknessaftergreen0: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal0" },
			darknessaftergreen1: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal1" },
			darknessaftergreen2: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal2" },
			darknessaftergreen3: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal3" },
			darknessaftergreen4: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal4" },
			darknessaftergreen5: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal5" },
			darknessaftergreen6: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal6" },
			darknessaftergreen7: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal7" },
			darknessaftergreen8: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal8" },
			darknessaftergreen9: { frames: [10], rate: 35/10, flip: false, loop: false, next: "normal9" },
			normal0: { frames: [0], rate: 1/5, flip: false, loop: false },
			normal1: { frames: [1], rate: 1/5, flip: false, loop: false },
			normal2: { frames: [2], rate: 1/5, flip: false, loop: false },
			normal3: { frames: [3], rate: 1/5, flip: false, loop: false },
			normal4: { frames: [4], rate: 1/5, flip: false, loop: false },
			normal5: { frames: [5], rate: 1/5, flip: false, loop: false },
			normal6: { frames: [6], rate: 1/5, flip: false, loop: false },
			normal7: { frames: [7], rate: 1/5, flip: false, loop: false },
			normal8: { frames: [8], rate: 1/5, flip: false, loop: false },
			normal9: { frames: [9], rate: 1/5, flip: false, loop: false }
    		});
		Q.animations("darkness", {
      			black: { frames: [0], rate: 1/3, flip: false, loop: false, trigger: "end" }
    		});
			
		Q.state.reset({lives: 3, score: 0, hiscore: 0});
		Q.stageScene("intro");
     
	});

    
});
