/*
 * Copyright MIT © <2013> <Francesco Trillini>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and 
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE 
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var GoogleForce = {}; 
 
;(function(GoogleForce, undefined) {
	
	var self = window.GoogleForce || {}, canvas, context, coords = { x: -99999, y: -99999 }, dots = [], dirtyRegions = [], energyLoss = 0.5, skin = 0, theme = 0, mouseDown = false, lastImpulse = delay = null, FPS = 60;
	
	// Dat GUI default values
	var force = 50, dirty = false, interactive = true;
	
	/*
	 * List of colors.
	 */
	
	var colors = [
	
		{
		
			skin: ['#03ace9', '#035ae9']
					
		},
		
		{
		
			skin: ['#e903e2', '#e90387']
		
		},
		
		{
		
			skin: ['#4de903', '#00bc0e']
		
		}
	
	];
	
	/*
	 * Settings.
	 */
	
	var Settings = function() {
		
		this.force = 50;
		this.dirty = false;
		this.interactive = true;
		
		this.changeForce = function(value) {
		
			force = value;
		
		};
		
		this.enableDirty = function(value) {
			
			dirty = value;
			
			// Ensure that the whole screen has been cleaned
			context.clearRect(0, 0, canvas.width, canvas.height);
		
		};
		
		this.enableInteractivity = function(value) {
		
			interactive = value;
			
			interactive ? mouseDown = false : null;
			
		};
		
		this.changeSkin = function(value) {
			
			skin += 1;
			
			theme = 0;
			
			[].forEach.call(dots, function(dot, index) {
				
				dot.color = colors[skin % colors.length].skin[theme % 2];
				
				theme += 1;
			
			});
		
		}
				
	};	
		
	/*
 	 * Init.
	 */
	
	self.init = function() {
		
		var settings = new Settings();
		var GUI = new dat.GUI();
		
		// Dat GUI main
		GUI.add(settings, 'force').min(1).max(100).onChange(settings.changeForce);
		GUI.add(settings, 'dirty').onChange(settings.enableDirty);
		GUI.add(settings, 'interactive').onChange(settings.enableInteractivity);
		GUI.add(settings, 'changeSkin').onChange(settings.changeSkin);
		
		var body = document.querySelector('body');
		
		canvas = document.createElement('canvas');
			
		canvas.width = innerWidth;
		canvas.height = innerHeight;
		
		canvas.style.backgroundColor = '#000';
		canvas.style.position = 'absolute';
		canvas.style.top = 0;
		canvas.style.bottom = 0;
		canvas.style.left = 0;
		canvas.style.right = 0;
		canvas.style.zIndex = -1;
		
		canvas.style.cursor = 'pointer';
		
		canvas.style.background = '-webkit-radial-gradient(rgb(255, 255, 0), orange)';
    	canvas.style.background = '-moz-radial-gradient(rgb(255, 255, 0), orange)';
    	canvas.style.background = '-ms-radial-gradient(rgb(255, 255, 0), orange)';
    	canvas.style.background = '-o-radial-gradient(rgb(255, 255, 0), orange)';
    	canvas.style.background = 'radial-gradient(rgb(255, 255, 0), orange)';
		
        body.appendChild(canvas);
		
		// Browser supports canvas?
		if(!!(self.gotSupport())) {
		
			context = canvas.getContext('2d');
		
			// Events
			if('ontouchstart' in window) {
				
				canvas.addEventListener('touchstart', self.onTouchStart, false);
				canvas.addEventListener('touchend', self.onTouchEnd, false);
				canvas.addEventListener('touchmove', self.onTouchMove, false);
				
			}	
			
			else {
				
				canvas.addEventListener('mousedown', self.onMouseDown, false);
				canvas.addEventListener('mouseup', self.onMouseUp, false);
				canvas.addEventListener('mousemove', self.onMouseMove, false);
				
			}
			
			window.onresize = onResize;
		
			self.buildTexture();
			
		}
		
		else {
		
			console.error('Please, update your browser for seeing this animation.');
		
		}
        
	};
	
	/*
	 * On resize window event.
	 */
	
	function onResize() {
	
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		
		dots = [], dirtyRegions = [];
	
	}
	
	/*
	 * Checks if browser supports canvas element.
	 */
	
	self.gotSupport = function() {
	
		return canvas.getContext && canvas.getContext('2d');
	
	};
	
	/*
	 * Mouse down event.
	 */
	
	self.onMouseDown = function(event) {
	
		event.preventDefault();
	
		coords.x = event.pageX - canvas.offsetLeft;
		coords.y = event.pageY - canvas.offsetTop;
	
		mouseDown = true;
		
	};
	
	/*
	 * Mouse up event.
	 */
	
	self.onMouseUp = function(event) {
	
		event.preventDefault();
	
		coords = { x: -99999, y: -99999 };
		
		mouseDown = false;
	
	};
	
	/*
	 * Mouse up event.
	 */
	
	self.onMouseMove = function(event) {
	
		event.preventDefault();
	
		if(!!mouseDown) {
		
			coords.x = event.pageX - canvas.offsetLeft;
			coords.y = event.pageY - canvas.offsetTop;
		
		}
			
	};
		
	/*
	 * Touch start event.
	 */
	
	self.onTouchStart = function(event) {
	
		event.preventDefault();
	
		coords.x = event.touches[0].pageX - canvas.offsetLeft;
		coords.y = event.touches[0].pageY - canvas.offsetTop;
	
		mouseDown = true;
	
	};

	/*
	 * Touch end event.
	 */
	
	self.onTouchEnd = function(event) {
	
		event.preventDefault();
	
		coords = { x: -99999, y: -99999 };
		
		mouseDown = false;
	
	};	
		
	/*
	 * Touch move event.
	 */
	
	self.onTouchMove = function(event) {
	
		event.preventDefault();
		
		if(!!mouseDown) {
		
			coords.x = event.touches[0].pageX - canvas.offsetLeft;
			coords.y = event.touches[0].pageY - canvas.offsetTop;
			
		}
	
	};
	
	/*
	 * Building texture.
	 */
	
	self.buildTexture = function() {
		
		!dirty ? self.clear() : null;
				
		// Let's start by drawing the original texture
		if(dots.length === 0) {
		
			context.font = canvas.width / 8 + 'px Arial';
			context.fillStyle = 'rgb(255, 255, 255)';		
			context.textAlign = 'center';
			context.fillText('I love you', canvas.width / 2, canvas.height / 2);
			
			var surface = context.getImageData(0, 0, canvas.width, canvas.height);
			
			context.clearRect(0, 0, canvas.width, canvas.height);
			
			for(var width = 0, len1 = surface.width; width < len1; width += 12) {
			
				for(var height = 0, len2 = surface.height; height < len2; height += 12) {
			
					var color = surface.data[(height * surface.width * 4) + (width * 4) - 1];	
					
					// The pixel color is white? So draw on it...
					if(color === 255) {
					
						var radius = 5 + Math.random() * 5;
						
						dots.push({
						
							x: width,
							y: height,
							vx: 0,
							vy: 0,
							goalX: width,
							goalY: height,
							radius: radius,
							
							color: colors[skin % colors.length].skin[theme % 2],
							
							easeX : Math.random() * 0.2 + 0.2,
							easeY : Math.random() * 0.2 + 0.2,
							
							strength: Math.random() * 20,
							
						});
						
						dirtyRegions.push({
						
							x: width,
							y: height,
							radius: radius
						
						});
						
						theme += 1;
					
					}
					
				}
		
			}
		
		}
		
		// Logic
		!dirty ? self.clear() : null;
		self.update();
		self.render();
		
		requestAnimFrame(self.buildTexture);
	
	};
	
	/*
	 * Clear only dirty regions.
	 */
	
	self.clear = function() {
	
		[].forEach.call(dirtyRegions, function(dirty, index) {
		
			var x, y, width, height;
			
			width = (2 * dirty.radius) + 4;
			height = width;
				
            x = dirty.x - (width / 2);
			y = dirty.y - (height / 2);
			
			context.clearRect(Math.floor(x), Math.floor(y), Math.ceil(width), Math.ceil(height));
		
		});
	
	};
	
	/*
	 * Let's update the dots.
	 */
	
	self.update = function() {
		
		var spring = 50, friction = 0.99;
		
		if(!interactive) {
			
			if(lastImpulse === null && delay === null)
			
				lastImpulse = delay = new Date().getTime();
			
			// Add impulse
			if(new Date().getTime() - lastImpulse > 70 && new Date().getTime() - lastImpulse < 100) {
					
				coords.x = dots[0].goalX + Math.random() * (dots[dots.length - 1].goalX - dots[0].goalX);
				coords.y = dots[0].goalY + Math.random() * (dots[dots.length - 1].goalY - dots[0].goalY);
			
				mouseDown = true;
		
			}
		
			// Reset 'em all
			if(new Date().getTime() - lastImpulse > 100) {
					
				mouseDown = false;
				
				// Wait 6 seconds for the next impulse
				if(new Date().getTime() - delay > 6000)
				
					lastImpulse = delay = new Date().getTime();
			
			}
			
		}
		
		[].forEach.call(dots, function(dot, index) {
			
			dot.x += dot.vx;
			dot.y += dot.vy;
			
			dot.radius = Math.max(dot.radius - 0.1, 2) === 2 ? 5 + Math.random() * 5 : dot.radius -= 0.1;
			
			if(mouseDown) {
			
				var dx = self.distanceTo(dot).dx;
				var dy = self.distanceTo(dot).dy;

				var distance = Math.sqrt(dx * dx + dy * dy);
				var angle = Math.atan2(dot.y - coords.y, dot.x - coords.x);
					
				// Add velocity
				dot.vx += (Math.cos(angle) * dot.strength) * 1 / distance * force;
				dot.vy += (Math.sin(angle) * dot.strength) * 1 / distance * force;
				
			}	
			
			if(!mouseDown) {
				
				// Spring
				dot.vx += (((dot.goalX - dot.x) * dot.easeX) - dot.vx) / spring;
				dot.vy += (((dot.goalY - dot.y) * dot.easeY) - dot.vy) / spring;
			
				// Friction
				dot.vx *= friction;
				dot.vy *= friction;
			
			}
			
			if(mouseDown) {
			
				// Right bounds
				if(dot.x > canvas.width - dot.radius) {
				
					dot.x = canvas.width - dot.radius;
					dot.vx *= -1;
					dot.vx *= energyLoss;
					
				}
				
				// Bottom bounds
				if(dot.y > canvas.height - dot.radius) {
				
					dot.y = canvas.height - dot.radius;
					dot.vy *= -1;
					dot.vy *= energyLoss;
					
				}
				
				// Left bounds
				if(dot.x < dot.radius) {
				
					dot.x = dot.radius;
					dot.vx *= -1;
					dot.vx *= energyLoss;
					
				}
				
				// Top bounds
				if(dot.y < dot.radius) {
				
					dot.y = dot.radius;
					dot.vy *= -1;
					dot.vy *= energyLoss;
					
				}
			
			}
					
		});
		
	};
	
	/*
	 * Let's render the dots.
	 */
	
	self.render = function() {
	
		[].forEach.call(dots, function(dot, index) {
			
			context.save();
			context.beginPath();
			dirty ? context.globalAlpha = 0.05 : null;
			context.fillStyle = dot.color;
			context.translate(dot.x, dot.y);
			context.arc(0, 0, dot.radius, 0, Math.PI * 2);
			context.fill();
			context.closePath();
			context.restore();
			
			// Dirty regions
			dirtyRegions[index].x = dot.x;
			dirtyRegions[index].y = dot.y;
			dirtyRegions[index].radius = dot.radius * 2;
			
		});
	
	};
	
	/*
	 * Distance between two points.
	 */
	
	self.distanceTo = function(dot) {
	
		var dx = Math.abs(dot.x - coords.x);
		var dy = Math.abs(dot.y - coords.y);
		
		return {
		
			dx: dx,
			dy: dy
		
		};
	
	};
	
	/*
	 * Request new frame by Paul Irish.
	 * 60 FPS.
	 */
	
	window.requestAnimFrame = (function() {
	 
		return  window.requestAnimationFrame       || 
				window.webkitRequestAnimationFrame || 
				window.mozRequestAnimationFrame    || 
				window.oRequestAnimationFrame      || 
				window.msRequestAnimationFrame     || 
			  
				function(callback) {
			  
					window.setTimeout(callback, 1000 / FPS);
				
				};
			  
    	})();

	window.addEventListener ? window.addEventListener('load', self.init, false) : window.onload = self.init;
	
})(GoogleForce);
