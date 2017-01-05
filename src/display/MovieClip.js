/*
* @license MovieClip
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2017 gskinner.com, inc.
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

import Container from "./Container";
import DisplayObject from "./DisplayObject";
import Tween from "tweenjs/src/Tween";
import Timeline from "tweenjs/src/Timeline";

/**
 * The MovieClip class associates a TweenJS Timeline with an EaselJS {{#crossLink "Container"}}{{/crossLink}}. It allows
 * you to create objects which encapsulate timeline animations, state changes, and synched actions. Due to the
 * complexities inherent in correctly setting up a MovieClip, it is largely intended for tool output and is not included
 * in the main EaselJS library.
 *
 * Currently MovieClip only works properly if it is tick based (as opposed to time based) though some concessions have
 * been made to support time-based timelines in the future.
 *
 * <h4>Example</h4>
 * This example animates two shapes back and forth. The grey shape starts on the left, but we jump to a mid-point in
 * the animation using {{#crossLink "MovieClip/gotoAndPlay"}}{{/crossLink}}.
 *
 *      var stage = new createjs.Stage("canvas");
 *      createjs.Ticker.addEventListener("tick", stage);
 *
 *      var mc = new createjs.MovieClip(null, 0, true, {start:20});
 *      stage.addChild(mc);
 *
 *      var child1 = new createjs.Shape(
 *          new createjs.Graphics().beginFill("#999999")
 *              .drawCircle(30,30,30));
 *      var child2 = new createjs.Shape(
 *          new createjs.Graphics().beginFill("#5a9cfb")
 *              .drawCircle(30,30,30));
 *
 *      mc.timeline.addTween(
 *          createjs.Tween.get(child1)
 *              .to({x:0}).to({x:60}, 50).to({x:0}, 50));
 *      mc.timeline.addTween(
 *          createjs.Tween.get(child2)
 *              .to({x:60}).to({x:0}, 50).to({x:60}, 50));
 *
 *      mc.gotoAndPlay("start");
 *
 * It is recommended to use <code>tween.to()</code> to animate and set properties (use no duration to have it set
 * immediately), and the <code>tween.wait()</code> method to create delays between animations. Note that using the
 * <code>tween.set()</code> method to affect properties will likely not provide the desired result.
 *
 * @class MovieClip
 * @extends Container
 * @module EaselJS
 */
export default class MovieClip extends Container {

// constructor:
	/**
	 * @constructor
	 * @param {String} [mode=independent] Initial value for the mode property. One of {{#crossLink "MovieClip/INDEPENDENT:property"}}{{/crossLink}},
	 * {{#crossLink "MovieClip/SINGLE_FRAME:property"}}{{/crossLink}}, or {{#crossLink "MovieClip/SYNCHED:property"}}{{/crossLink}}.
	 * The default is {{#crossLink "MovieClip/INDEPENDENT:property"}}{{/crossLink}}.
	 * @param {Number} [startPosition=0] Initial value for the {{#crossLink "MovieClip/startPosition:property"}}{{/crossLink}}
	 * property.
	 * @param {Boolean} [loop=0] Initial value for the {{#crossLink "MovieClip/loop:property"}}{{/crossLink}}
	 * property. The default is `0`.
	 * @param {Object} [labels=null] A hash of labels to pass to the {{#crossLink "MovieClip/timeline:property"}}{{/crossLink}}
	 * instance associated with this MovieClip. Labels only need to be passed if they need to be used.
	 */
	constructor (mode = MovieClip.INDEPENDENT, startPosition = 0, loop = 0, labels = null) {
		super();
		!MovieClip.inited && MovieClip.init();

// public properties:
		/**
		 * Controls how this MovieClip advances its time. Must be one of 0 (INDEPENDENT), 1 (SINGLE_FRAME), or 2 (SYNCHED).
		 * See each constant for a description of the behaviour.
		 * @property mode
		 * @type String
		 * @default null
		 */
		this.mode = mode;

		/**
		 * Specifies what the first frame to play in this movieclip, or the only frame to display if mode is SINGLE_FRAME.
		 * @property startPosition
		 * @type Number
		 * @default 0
		 */
		this.startPosition = startPosition;

		/**
		 * Indicates whether this MovieClip should loop when it reaches the end of its timeline.
		 * @property loop
		 * @type Boolean
		 * @default true
		 */
		this.loop = loop === true ? -1 : loop;

		/**
		 * The current frame of the movieclip.
		 * @property currentFrame
		 * @type Number
		 * @default 0
		 * @readonly
		 */
		this.currentFrame = 0;

		/**
		 * The TweenJS Timeline that is associated with this MovieClip. This is created automatically when the MovieClip
		 * instance is initialized. Animations are created by adding <a href="http://tweenjs.com">TweenJS</a> Tween
		 * instances to the timeline.
		 *
		 * <h4>Example</h4>
		 *
		 *      var tween = createjs.Tween.get(target).to({x:0}).to({x:100}, 30);
		 *      var mc = new createjs.MovieClip();
		 *      mc.timeline.addTween(tween);
		 *
		 * Elements can be added and removed from the timeline by toggling an "_off" property
		 * using the <code>tweenInstance.to()</code> method. Note that using <code>Tween.set</code> is not recommended to
		 * create MovieClip animations. The following example will toggle the target off on frame 0, and then back on for
		 * frame 1. You can use the "visible" property to achieve the same effect.
		 *
		 *      var tween = createjs.Tween.get(target).to({_off:false})
		 *          .wait(1).to({_off:true})
		 *          .wait(1).to({_off:false});
		 *
		 * @property timeline
		 * @type Timeline
		 * @default null
		 */
		this.timeline = new Timeline({ paused: true, useTicks: true, labels });

		/**
		 * If true, the MovieClip's position will not advance when ticked.
		 * @property paused
		 * @type Boolean
		 * @default false
		 */
		this.paused = false;

		/**
		 * If true, actions in this MovieClip's tweens will be run when the playhead advances.
		 * @property actionsEnabled
		 * @type Boolean
		 * @default true
		 */
		this.actionsEnabled = true;

		/**
		 * If true, the MovieClip will automatically be reset to its first frame whenever the timeline adds
		 * it back onto the display list. This only applies to MovieClip instances with mode=INDEPENDENT.
		 * <br><br>
		 * For example, if you had a character animation with a "body" child MovieClip instance
		 * with different costumes on each frame, you could set body.autoReset = false, so that
		 * you can manually change the frame it is on, without worrying that it will be reset
		 * automatically.
		 * @property autoReset
		 * @type Boolean
		 * @default true
		 */
		this.autoReset = true;

		/**
		 * An array of bounds for each frame in the MovieClip. This is mainly intended for tool output.
		 * @property frameBounds
		 * @type Array
		 * @default null
		 */
		this.frameBounds = this.frameBounds||null; // TODO: Deprecated. This is for backwards support of Flash/Animate

		/**
		 * By default MovieClip instances advance one frame per tick. Specifying a framerate for the MovieClip
		 * will cause it to advance based on elapsed time between ticks as appropriate to maintain the target
		 * framerate.
		 *
		 * For example, if a MovieClip with a framerate of 10 is placed on a Stage being updated at 40fps, then the MovieClip will
		 * advance roughly one frame every 4 ticks. This will not be exact, because the time between each tick will
		 * vary slightly between frames.
		 *
		 * This feature is dependent on the tick event object (or an object with an appropriate "delta" property) being
		 * passed into {{#crossLink "Stage/update"}}{{/crossLink}}.
		 * @property framerate
		 * @type {Number}
		 * @default null
		 */
		this.framerate = null;

	// private properties:
		/**
		 * @property _synchOffset
		 * @type Number
		 * @default 0
		 * @private
		 */
		this._synchOffset = 0;

		/**
		 * @property _rawPosition
		 * @type Number
		 * @default -1
		 * @private
		 */
		this._rawPosition = -1; // TODO: evaluate using a ._reset Boolean prop instead of -1.

		/**
		 * The time remaining from the previous tick, only applicable when .framerate is set.
		 * @property _t
		 * @type Number
		 * @private
		 */
		this._t = 0;

		/**
		 * List of display objects that are actively being managed by the MovieClip.
		 * @property _managed
		 * @type Object
		 * @private
		 */
		this._managed = {};
	}

// static methods:
	static init () {
		if (MovieClip.inited) { return; }
		// plugins introduce some overhead to Tween, so we only install this if an MC is instantiated.
		MovieClipPlugin.install();
		MovieClip.inited = true;
	}

// TODO: can we just proxy `get currentFrame` to timeline.position as well? Ditto for `get loop` (or just remove entirely).
// accessor properties:
	/**
	 * Returns an array of objects with label and position (aka frame) properties, sorted by position.
	 * Shortcut to TweenJS: Timeline.getLabels();
	 * @property labels
	 * @type {Array}
	 * @readonly
	 */
	get labels () {
		return this.timeline.labels;
	}

	/**
	 * Returns the name of the label on or immediately before the current frame. See TweenJS: Timeline.getCurrentLabel()
	 * for more information.
	 * @property currentLabel
	 * @type {String}
	 * @readonly
	 */
	get currentLabel () {
		return this.timeline.getCurrentLabel();
	}

	 /**
 	 * Returns the duration of this MovieClip in seconds or ticks.
 	 * @property duration
 	 * @type {Number}
 	 * @readonly
 	 */
 	get duration () {
		return this.timeline.duration;
	}

	/**
	 * Returns the duration of this MovieClip in seconds or ticks. Identical to {{#crossLink "MovieClip/duration:property"}}{{/crossLink}}
	 * and provided for Adobe Flash/Animate API compatibility.
	 * @property totalFrames
	 * @type {Number}
	 * @readonly
	 */
	get totalFrames () {
		return this.duration;
	}

// public methods:
	/**
	 * Returns true or false indicating whether the display object would be visible if drawn to a canvas.
	 * This does not account for whether it would be visible within the boundaries of the stage.
	 * NOTE: This method is mainly for internal use, though it may be useful for advanced uses.
	 * @method isVisible
	 * @return {Boolean} Boolean indicating whether the display object would be visible if drawn to a canvas
	 */
	isVisible () {
		// children are placed in draw, so we can't determine if we have content.
		return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0);
	}

	/**
	 * Draws the display object into the specified context ignoring its visible, alpha, shadow, and transform.
	 * Returns true if the draw was handled (useful for overriding functionality).
	 * NOTE: This method is mainly for internal use, though it may be useful for advanced uses.
	 * @method draw
	 * @param {CanvasRenderingContext2D} ctx The canvas 2D context object to draw into.
	 * @param {Boolean} ignoreCache Indicates whether the draw operation should ignore any current cache.
	 * For example, used for drawing the cache (to prevent it from simply drawing an existing cache back
	 * into itself).
	 */
	draw (ctx, ignoreCache) {
		// draw to cache first:
		if (this.drawCache(ctx, ignoreCache)) { return true; }
		super.draw(ctx, ignoreCache);
		return true;
	}

	/**
	 * Sets paused to false.
	 * @method play
	 */
	play () {
		this.paused = false;
	}

	/**
	 * Sets paused to true.
	 * @method stop
	 */
	stop () {
		this.paused = true;
	}

	/**
	 * Advances this movie clip to the specified position or label and sets paused to false.
	 * @method gotoAndPlay
	 * @param {String|Number} positionOrLabel The animation name or frame number to go to.
	 */
	gotoAndPlay (positionOrLabel) {
		this.paused = false;
		this._goto(positionOrLabel);
	}

	/**
	 * Advances this movie clip to the specified position or label and sets paused to true.
	 * @method gotoAndStop
	 * @param {String|Number} positionOrLabel The animation or frame name to go to.
	 */
	gotoAndStop (positionOrLabel) {
		this.paused = true;
		this._goto(positionOrLabel);
	}

	/**
	 * Advances the playhead. This occurs automatically each tick by default.
	 * @param [time] {Number} The amount of time in ms to advance by. Only applicable if framerate is set.
	 * @method advance
	*/
	advance (time) {
		// TODO: should we worry at all about clips who change their own modes via frame scripts?
		let independent = MovieClip.INDEPENDENT;
		if (this.mode !== independent) { return; }
		// if this MC doesn't have a framerate, hunt ancestors for one:
		let o = this, fps = o.framerate;
		while ((o = o.parent) && fps == null) {
			if (o.mode === independent) { fps = o._framerate; }
		}
		this._framerate = fps;

		if (this.paused) { return; }
		// TODO: strict equality here?
		// calculate how many frames to advance:
		let t = (fps !== null && fps !== -1 && time !== null) ? time / (1000 / fps) + this._t : 1;
		let frames = t | 0;
		this._t = t - frames; // leftover time, save to add to next advance.

		while (frames--) {
			this._updateTimeline(this._rawPosition + 1, false);
		}
	}

	/**
	 * MovieClip instances cannot be cloned.
	 * @method clone
	 */
	clone () {
		// TODO: add support for this? Need to clone the Timeline & retarget tweens - pretty complex.
		throw "MovieClip cannot be cloned.";
	}

// private methods:
	/**
	 * @method _tick
	 * @param {Object} evtObj An event object that will be dispatched to all tick listeners. This object is reused between dispatchers to reduce construction & GC costs.
	 * function.
	 * @protected
	 */
	_tick (evtObj) {
		this.advance(evtObj && evtObj.delta);
		super._tick(evtObj);
	}

	/**
	 * @method _goto
	 * @param {String|Number} positionOrLabel The animation name or frame number to go to.
	 * @protected
	 */
	_goto (positionOrLabel) {
		let pos = this.timeline.resolve(positionOrLabel);
		if (pos == null) { return; }
		this._t = 0;
		this._updateTimeline(pos, true);
	}

	/**
	 * @method _reset
	 * @private
	 */
	_reset () {
		this._rawPosition = -1;
		this._t = this.currentFrame = 0;
		this.paused = false;
	}

	/**
	 * @method _updateTimeline
	 * @param {Number} rawPosition
	 * @param {Boolean} jump Indicates whether this update is due to jumping (via gotoAndXX) to a new position.
	 * @protected
	 */
	_updateTimeline (rawPosition, jump) {
		if (rawPosition < 1) { rawPosition = 0; }
		if (this._rawPosition === rawPosition) { return; }
		this._rawPosition = rawPosition;

		let tl = this.timeline, synced = this.mode !== MovieClip.INDEPENDENT;
		tl.loop = this.loop; // TODO: should we maintain this on MovieClip, or just have it on timeline.
		let pos = synced ? this.startPosition + (this.mode === MovieClip.SINGLE_FRAME ? 0 : this._synchOffset) : (rawPosition === -1 ? 0 : rawPosition);

		tl.setPosition(pos, !this.actionsEnabled || synced, jump, () => this._resolveState());
	}

	/**
	 * Runs via a callback after timeline property updates and before actions.
	 * @method _resolveState
	 * @protected
	 */
	_resolveState () {
		let tl = this.timeline;
		this.currentFrame = tl.position;

		for (let n in this._managed) { this._managed[n] = 1; }

		let tweens = tl._tweens;
		for (let tween of tl._tweens) {
			let target = tween._target;
			if (target === this || tween.passive) { continue; } // TODO: this assumes the actions tween from Animate has `this` as the target. Likely a better approach.
			let offset = tween._stepPosition;

			if (target instanceof DisplayObject) {
				// motion tween.
				this._addManagedChild(target, offset);
			} else {
				// state tween.
				this._setState(target.state, offset);
			}
		}

		let kids = this.children;
		for (let i=kids.length-1; i>=0; i--) {
			let id = kids[i].id;
			if (this._managed[id] === 1) {
				this.removeChildAt(i);
				delete(this._managed[id]);
			}
		}
	}

	/**
	 * @method _setState
	 * @param {Array} state
	 * @param {Number} offset
	 * @protected
	 */
	_setState (state, offset) {
		if (!state) { return; }
		for (let i = state.length - 1; i >= 0; i--) {
			let o = state[i];
			let target = o.t;
			let props = o.p;
			for (let n in props) { target[n] = props[n]; }
			this._addManagedChild(target, offset);
		}
	}

	/**
	 * Adds a child to the timeline, and sets it up as a managed child.
	 * @method _addManagedChild
	 * @param {MovieClip} child The child MovieClip to manage
	 * @param {Number} offset
	 * @private
	 */
	_addManagedChild (child, offset) {
		if (child._off) { return; }
		this.addChildAt(child, 0);

		if (child instanceof MovieClip) {
			child._synchOffset = offset;
			// TODO: this does not precisely match Adobe Flash/Animate, which loses track of the clip if it is renamed or removed from the timeline, which causes it to reset.
			if (child.mode === MovieClip.INDEPENDENT && child.autoReset && !this._managed[child.id]) { child._reset(); }
		}
		this._managed[child.id] = 2;
	}

	/**
	 * @method _getBounds
	 * @param {Matrix2D} matrix
	 * @param {Boolean} ignoreTransform
	 * @return {Rectangle}
	 * @protected
	 */
	_getBounds (matrix, ignoreTransform) {
		let bounds = this.getBounds();
		if (!bounds && this.frameBounds) { bounds = this._rectangle.copy(this.frameBounds[this.currentFrame]); }
		if (bounds) { return this._transformBounds(bounds, matrix, ignoreTransform); }
		return super._getBounds(matrix, ignoreTransform);
	}

}

// static constants:
/**
 * The MovieClip will advance independently of its parent, even if its parent is paused.
 * This is the default mode.
 * @property INDEPENDENT
 * @static
 * @type String
 * @default "independent"
 * @readonly
 */
/**
 * The MovieClip will only display a single frame (as determined by the startPosition property).
 * @property SINGLE_FRAME
 * @static
 * @type String
 * @default "single"
 * @readonly
 */
/**
 * The MovieClip will be advanced only when its parent advances and will be synched to the position of
 * the parent MovieClip.
 * @property SYNCHED
 * @static
 * @type String
 * @default "synched"
 * @readonly
 */
{
	MovieClip.INDEPENDENT = "independent";
	MovieClip.SINGLE_FRAME = "single";
	MovieClip.SYNCHED = "synched";
	MovieClip.inited = false;
}

/**
 * This plugin works with <a href="http://tweenjs.com" target="_blank">TweenJS</a> to prevent the startPosition
 * property from tweening.
 * @class MovieClipPlugin
 * @todo update to new plugin model
 * @static
 * @private
 */
class MovieClipPlugin {

// constructor:
	/**
	 * @constructor
	 */
	constructor () {
		throw "MovieClipPlugin cannot be instantiated.";
	}

	/**
	 * @method install
	 * @private
	 */
	static install () {
		// Tween._installPlugin(MovieClipPlugin);
	}

	/**
	 * @method init
	 * @param {Tween} tween
	 * @param {String} prop
	 * @param {String|Number|Boolean} value
	 * @private
	 */
	static init (tween, prop, value) {
		return value;
	}

	/**
	 * @method tween
	 * @param {Tween} tween
	 * @param {String} prop
	 * @param {String | Number | Boolean} value
	 * @param {Array} startValues
	 * @param {Array} endValues
	 * @param {Number} ratio
	 * @param {Object} wait
	 * @param {Object} end
	 * @return {*}
	 */
	static tween (tween, prop, value, startValues, endValues, ratio, wait, end) {
		if (!(tween.target instanceof MovieClip)) { return value; }
		return (ratio === 1 ? endValues[prop] : startValues[prop]);
	}

}

/**
 * @property priority
 * @static
 */
{
	MovieClipPlugin.priority = 100;
}