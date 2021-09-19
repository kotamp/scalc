
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.6' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Label.svelte generated by Svelte v3.42.6 */

    const file$5 = "src/Label.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let label_1;
    	let t0;
    	let t1;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			input = element("input");
    			attr_dev(label_1, "for", /*labelId*/ ctx[4]);
    			attr_dev(label_1, "class", "svelte-mtc8lp");
    			add_location(label_1, file$5, 12, 2, 296);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "name", /*labelId*/ ctx[4]);
    			input.disabled = /*disabled*/ ctx[2];
    			attr_dev(input, "class", "svelte-mtc8lp");
    			toggle_class(input, "error", /*error*/ ctx[3]);
    			add_location(input, file$5, 13, 2, 335);
    			attr_dev(div, "class", "svelte-mtc8lp");
    			add_location(div, file$5, 11, 0, 288);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label_1);
    			append_dev(label_1, t0);
    			append_dev(div, t1);
    			append_dev(div, input);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 2) set_data_dev(t0, /*label*/ ctx[1]);

    			if (dirty & /*disabled*/ 4) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[2]);
    			}

    			if (dirty & /*value*/ 1 && to_number(input.value) !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}

    			if (dirty & /*error*/ 8) {
    				toggle_class(input, "error", /*error*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Label', slots, []);
    	let { label = 'Label' } = $$props;
    	let { value = 0.4 } = $$props;
    	let { disabled = false } = $$props;
    	let { error = '' } = $$props;
    	const labelId = label.toLowerCase() + Math.random();
    	const writable_props = ['label', 'value', 'disabled', 'error'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Label> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = to_number(this.value);
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ('error' in $$props) $$invalidate(3, error = $$props.error);
    	};

    	$$self.$capture_state = () => ({ label, value, disabled, error, labelId });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ('error' in $$props) $$invalidate(3, error = $$props.error);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, label, disabled, error, labelId, input_input_handler];
    }

    class Label extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			label: 1,
    			value: 0,
    			disabled: 2,
    			error: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Label",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get label() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const round = (num) => {
        return Math.round(num * 1e7) / 1e7;
    };

    /* src/sections/Area.svelte generated by Svelte v3.42.6 */

    const { console: console_1 } = globals;
    const file$4 = "src/sections/Area.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let label0;
    	let updating_value;
    	let t0;
    	let div1;
    	let label1;
    	let updating_value_1;
    	let t1;
    	let div4;
    	let div3;
    	let label2;
    	let updating_value_2;
    	let current;

    	function label0_value_binding(value) {
    		/*label0_value_binding*/ ctx[4](value);
    	}

    	let label0_props = {
    		label: "Ширина (см)",
    		error: /*width*/ ctx[2] == null
    	};

    	if (/*width*/ ctx[2] !== void 0) {
    		label0_props.value = /*width*/ ctx[2];
    	}

    	label0 = new Label({ props: label0_props, $$inline: true });
    	binding_callbacks.push(() => bind(label0, 'value', label0_value_binding));

    	function label1_value_binding(value) {
    		/*label1_value_binding*/ ctx[5](value);
    	}

    	let label1_props = {
    		label: "Длина (см)",
    		error: /*length*/ ctx[3] == null
    	};

    	if (/*length*/ ctx[3] !== void 0) {
    		label1_props.value = /*length*/ ctx[3];
    	}

    	label1 = new Label({ props: label1_props, $$inline: true });
    	binding_callbacks.push(() => bind(label1, 'value', label1_value_binding));

    	function label2_value_binding(value) {
    		/*label2_value_binding*/ ctx[6](value);
    	}

    	let label2_props = {
    		label: "Площадь (кв. м)",
    		disabled: true,
    		error: /*mustNotZero*/ ctx[1] && /*singleArea*/ ctx[0] === 0
    	};

    	if (/*singleArea*/ ctx[0] !== void 0) {
    		label2_props.value = /*singleArea*/ ctx[0];
    	}

    	label2 = new Label({ props: label2_props, $$inline: true });
    	binding_callbacks.push(() => bind(label2, 'value', label2_value_binding));

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(label0.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(label1.$$.fragment);
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			create_component(label2.$$.fragment);
    			attr_dev(div0, "class", "cell");
    			add_location(div0, file$4, 20, 2, 491);
    			attr_dev(div1, "class", "cell");
    			add_location(div1, file$4, 23, 2, 596);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$4, 19, 0, 471);
    			attr_dev(div3, "class", "cell");
    			add_location(div3, file$4, 28, 2, 727);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$4, 27, 0, 707);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(label0, div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			mount_component(label1, div1, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			mount_component(label2, div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const label0_changes = {};
    			if (dirty & /*width*/ 4) label0_changes.error = /*width*/ ctx[2] == null;

    			if (!updating_value && dirty & /*width*/ 4) {
    				updating_value = true;
    				label0_changes.value = /*width*/ ctx[2];
    				add_flush_callback(() => updating_value = false);
    			}

    			label0.$set(label0_changes);
    			const label1_changes = {};
    			if (dirty & /*length*/ 8) label1_changes.error = /*length*/ ctx[3] == null;

    			if (!updating_value_1 && dirty & /*length*/ 8) {
    				updating_value_1 = true;
    				label1_changes.value = /*length*/ ctx[3];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			label1.$set(label1_changes);
    			const label2_changes = {};
    			if (dirty & /*mustNotZero, singleArea*/ 3) label2_changes.error = /*mustNotZero*/ ctx[1] && /*singleArea*/ ctx[0] === 0;

    			if (!updating_value_2 && dirty & /*singleArea*/ 1) {
    				updating_value_2 = true;
    				label2_changes.value = /*singleArea*/ ctx[0];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			label2.$set(label2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label0.$$.fragment, local);
    			transition_in(label1.$$.fragment, local);
    			transition_in(label2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label0.$$.fragment, local);
    			transition_out(label1.$$.fragment, local);
    			transition_out(label2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(label0);
    			destroy_component(label1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div4);
    			destroy_component(label2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Area', slots, []);
    	let width = null;
    	let length = null;
    	let { singleArea = null } = $$props;
    	let { mustNotZero = null } = $$props;
    	const writable_props = ['singleArea', 'mustNotZero'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Area> was created with unknown prop '${key}'`);
    	});

    	function label0_value_binding(value) {
    		width = value;
    		$$invalidate(2, width);
    	}

    	function label1_value_binding(value) {
    		length = value;
    		$$invalidate(3, length);
    	}

    	function label2_value_binding(value) {
    		singleArea = value;
    		(($$invalidate(0, singleArea), $$invalidate(2, width)), $$invalidate(3, length));
    	}

    	$$self.$$set = $$props => {
    		if ('singleArea' in $$props) $$invalidate(0, singleArea = $$props.singleArea);
    		if ('mustNotZero' in $$props) $$invalidate(1, mustNotZero = $$props.mustNotZero);
    	};

    	$$self.$capture_state = () => ({
    		round,
    		Label,
    		width,
    		length,
    		singleArea,
    		mustNotZero
    	});

    	$$self.$inject_state = $$props => {
    		if ('width' in $$props) $$invalidate(2, width = $$props.width);
    		if ('length' in $$props) $$invalidate(3, length = $$props.length);
    		if ('singleArea' in $$props) $$invalidate(0, singleArea = $$props.singleArea);
    		if ('mustNotZero' in $$props) $$invalidate(1, mustNotZero = $$props.mustNotZero);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*width, length*/ 12) {
    			console.log(width, length);
    		}

    		if ($$self.$$.dirty & /*width, length*/ 12) {
    			{
    				if (width == null || length == null) {
    					$$invalidate(0, singleArea = null);
    				} else {
    					const result = (width || 0) * (length || 0) * 0.0001;
    					console.log(result, width, length);
    					$$invalidate(0, singleArea = round(result));
    				}
    			}
    		}
    	};

    	return [
    		singleArea,
    		mustNotZero,
    		width,
    		length,
    		label0_value_binding,
    		label1_value_binding,
    		label2_value_binding
    	];
    }

    class Area extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { singleArea: 0, mustNotZero: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Area",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get singleArea() {
    		throw new Error("<Area>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set singleArea(value) {
    		throw new Error("<Area>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mustNotZero() {
    		throw new Error("<Area>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mustNotZero(value) {
    		throw new Error("<Area>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/sections/AreaToPrice.svelte generated by Svelte v3.42.6 */
    const file$3 = "src/sections/AreaToPrice.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let label0;
    	let updating_value;
    	let t0;
    	let div1;
    	let label1;
    	let updating_value_1;
    	let t1;
    	let div5;
    	let div3;
    	let label2;
    	let updating_value_2;
    	let t2;
    	let div4;
    	let label3;
    	let updating_value_3;
    	let current;

    	function label0_value_binding(value) {
    		/*label0_value_binding*/ ctx[5](value);
    	}

    	let label0_props = {
    		label: "Цена 1 кв. м",
    		error: /*squarePrice*/ ctx[0] == null
    	};

    	if (/*squarePrice*/ ctx[0] !== void 0) {
    		label0_props.value = /*squarePrice*/ ctx[0];
    	}

    	label0 = new Label({ props: label0_props, $$inline: true });
    	binding_callbacks.push(() => bind(label0, 'value', label0_value_binding));

    	function label1_value_binding(value) {
    		/*label1_value_binding*/ ctx[6](value);
    	}

    	let label1_props = {
    		label: "Плитки (шт)",
    		error: /*count*/ ctx[1] == null
    	};

    	if (/*count*/ ctx[1] !== void 0) {
    		label1_props.value = /*count*/ ctx[1];
    	}

    	label1 = new Label({ props: label1_props, $$inline: true });
    	binding_callbacks.push(() => bind(label1, 'value', label1_value_binding));

    	function label2_value_binding(value) {
    		/*label2_value_binding*/ ctx[7](value);
    	}

    	let label2_props = { label: "Общая цена", disabled: true };

    	if (/*resultPrice*/ ctx[2] !== void 0) {
    		label2_props.value = /*resultPrice*/ ctx[2];
    	}

    	label2 = new Label({ props: label2_props, $$inline: true });
    	binding_callbacks.push(() => bind(label2, 'value', label2_value_binding));

    	function label3_value_binding(value) {
    		/*label3_value_binding*/ ctx[8](value);
    	}

    	let label3_props = {
    		label: "Общая площадь (кв. м)",
    		disabled: true
    	};

    	if (/*resultArea*/ ctx[3] !== void 0) {
    		label3_props.value = /*resultArea*/ ctx[3];
    	}

    	label3 = new Label({ props: label3_props, $$inline: true });
    	binding_callbacks.push(() => bind(label3, 'value', label3_value_binding));

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(label0.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(label1.$$.fragment);
    			t1 = space();
    			div5 = element("div");
    			div3 = element("div");
    			create_component(label2.$$.fragment);
    			t2 = space();
    			div4 = element("div");
    			create_component(label3.$$.fragment);
    			attr_dev(div0, "class", "cell");
    			add_location(div0, file$3, 21, 2, 542);
    			attr_dev(div1, "class", "cell");
    			add_location(div1, file$3, 28, 2, 682);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$3, 20, 0, 522);
    			attr_dev(div3, "class", "cell");
    			add_location(div3, file$3, 33, 2, 812);
    			attr_dev(div4, "class", "cell");
    			add_location(div4, file$3, 36, 2, 909);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$3, 32, 0, 792);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(label0, div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			mount_component(label1, div1, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div3);
    			mount_component(label2, div3, null);
    			append_dev(div5, t2);
    			append_dev(div5, div4);
    			mount_component(label3, div4, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const label0_changes = {};
    			if (dirty & /*squarePrice*/ 1) label0_changes.error = /*squarePrice*/ ctx[0] == null;

    			if (!updating_value && dirty & /*squarePrice*/ 1) {
    				updating_value = true;
    				label0_changes.value = /*squarePrice*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			label0.$set(label0_changes);
    			const label1_changes = {};
    			if (dirty & /*count*/ 2) label1_changes.error = /*count*/ ctx[1] == null;

    			if (!updating_value_1 && dirty & /*count*/ 2) {
    				updating_value_1 = true;
    				label1_changes.value = /*count*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			label1.$set(label1_changes);
    			const label2_changes = {};

    			if (!updating_value_2 && dirty & /*resultPrice*/ 4) {
    				updating_value_2 = true;
    				label2_changes.value = /*resultPrice*/ ctx[2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			label2.$set(label2_changes);
    			const label3_changes = {};

    			if (!updating_value_3 && dirty & /*resultArea*/ 8) {
    				updating_value_3 = true;
    				label3_changes.value = /*resultArea*/ ctx[3];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			label3.$set(label3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label0.$$.fragment, local);
    			transition_in(label1.$$.fragment, local);
    			transition_in(label2.$$.fragment, local);
    			transition_in(label3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label0.$$.fragment, local);
    			transition_out(label1.$$.fragment, local);
    			transition_out(label2.$$.fragment, local);
    			transition_out(label3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(label0);
    			destroy_component(label1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div5);
    			destroy_component(label2);
    			destroy_component(label3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AreaToPrice', slots, []);
    	let { singleArea = null } = $$props;
    	let squarePrice = null;
    	let count = 1;
    	let resultPrice = null;
    	let resultArea = null;
    	const writable_props = ['singleArea'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AreaToPrice> was created with unknown prop '${key}'`);
    	});

    	function label0_value_binding(value) {
    		squarePrice = value;
    		$$invalidate(0, squarePrice);
    	}

    	function label1_value_binding(value) {
    		count = value;
    		$$invalidate(1, count);
    	}

    	function label2_value_binding(value) {
    		resultPrice = value;
    		((($$invalidate(2, resultPrice), $$invalidate(0, squarePrice)), $$invalidate(4, singleArea)), $$invalidate(1, count));
    	}

    	function label3_value_binding(value) {
    		resultArea = value;
    		((($$invalidate(3, resultArea), $$invalidate(0, squarePrice)), $$invalidate(4, singleArea)), $$invalidate(1, count));
    	}

    	$$self.$$set = $$props => {
    		if ('singleArea' in $$props) $$invalidate(4, singleArea = $$props.singleArea);
    	};

    	$$self.$capture_state = () => ({
    		round,
    		Label,
    		singleArea,
    		squarePrice,
    		count,
    		resultPrice,
    		resultArea
    	});

    	$$self.$inject_state = $$props => {
    		if ('singleArea' in $$props) $$invalidate(4, singleArea = $$props.singleArea);
    		if ('squarePrice' in $$props) $$invalidate(0, squarePrice = $$props.squarePrice);
    		if ('count' in $$props) $$invalidate(1, count = $$props.count);
    		if ('resultPrice' in $$props) $$invalidate(2, resultPrice = $$props.resultPrice);
    		if ('resultArea' in $$props) $$invalidate(3, resultArea = $$props.resultArea);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*squarePrice, singleArea, count*/ 19) {
    			{
    				if (squarePrice == null || singleArea == null || count === null) {
    					$$invalidate(2, resultPrice = null);
    					$$invalidate(3, resultArea = null);
    				} else {
    					let singlePrice = squarePrice * singleArea;
    					$$invalidate(2, resultPrice = round(singlePrice * count));
    					$$invalidate(3, resultArea = round(singleArea * count));
    				}
    			}
    		}
    	};

    	return [
    		squarePrice,
    		count,
    		resultPrice,
    		resultArea,
    		singleArea,
    		label0_value_binding,
    		label1_value_binding,
    		label2_value_binding,
    		label3_value_binding
    	];
    }

    class AreaToPrice extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { singleArea: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AreaToPrice",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get singleArea() {
    		throw new Error("<AreaToPrice>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set singleArea(value) {
    		throw new Error("<AreaToPrice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/sections/AreaToPackage.svelte generated by Svelte v3.42.6 */
    const file$2 = "src/sections/AreaToPackage.svelte";

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let label0;
    	let updating_value;
    	let t;
    	let div1;
    	let label1;
    	let updating_value_1;
    	let current;

    	function label0_value_binding(value) {
    		/*label0_value_binding*/ ctx[3](value);
    	}

    	let label0_props = {
    		label: "В упаковкe (кв. м)",
    		error: /*packArea*/ ctx[0] == null
    	};

    	if (/*packArea*/ ctx[0] !== void 0) {
    		label0_props.value = /*packArea*/ ctx[0];
    	}

    	label0 = new Label({ props: label0_props, $$inline: true });
    	binding_callbacks.push(() => bind(label0, 'value', label0_value_binding));

    	function label1_value_binding(value) {
    		/*label1_value_binding*/ ctx[4](value);
    	}

    	let label1_props = {
    		label: "В упаковке (шт)",
    		disabled: true,
    		error: /*packCount*/ ctx[1] === -1
    	};

    	if (/*packCount*/ ctx[1] !== void 0) {
    		label1_props.value = /*packCount*/ ctx[1];
    	}

    	label1 = new Label({ props: label1_props, $$inline: true });
    	binding_callbacks.push(() => bind(label1, 'value', label1_value_binding));

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(label0.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(label1.$$.fragment);
    			attr_dev(div0, "class", "cell");
    			add_location(div0, file$2, 16, 2, 369);
    			attr_dev(div1, "class", "cell");
    			add_location(div1, file$2, 23, 2, 509);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$2, 15, 0, 349);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(label0, div0, null);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			mount_component(label1, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const label0_changes = {};
    			if (dirty & /*packArea*/ 1) label0_changes.error = /*packArea*/ ctx[0] == null;

    			if (!updating_value && dirty & /*packArea*/ 1) {
    				updating_value = true;
    				label0_changes.value = /*packArea*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			label0.$set(label0_changes);
    			const label1_changes = {};
    			if (dirty & /*packCount*/ 2) label1_changes.error = /*packCount*/ ctx[1] === -1;

    			if (!updating_value_1 && dirty & /*packCount*/ 2) {
    				updating_value_1 = true;
    				label1_changes.value = /*packCount*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			label1.$set(label1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label0.$$.fragment, local);
    			transition_in(label1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label0.$$.fragment, local);
    			transition_out(label1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(label0);
    			destroy_component(label1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AreaToPackage', slots, []);
    	let { singleArea = null } = $$props;
    	let packArea = null;
    	let packCount = null;
    	const writable_props = ['singleArea'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AreaToPackage> was created with unknown prop '${key}'`);
    	});

    	function label0_value_binding(value) {
    		packArea = value;
    		$$invalidate(0, packArea);
    	}

    	function label1_value_binding(value) {
    		packCount = value;
    		(($$invalidate(1, packCount), $$invalidate(2, singleArea)), $$invalidate(0, packArea));
    	}

    	$$self.$$set = $$props => {
    		if ('singleArea' in $$props) $$invalidate(2, singleArea = $$props.singleArea);
    	};

    	$$self.$capture_state = () => ({
    		round,
    		Label,
    		singleArea,
    		packArea,
    		packCount
    	});

    	$$self.$inject_state = $$props => {
    		if ('singleArea' in $$props) $$invalidate(2, singleArea = $$props.singleArea);
    		if ('packArea' in $$props) $$invalidate(0, packArea = $$props.packArea);
    		if ('packCount' in $$props) $$invalidate(1, packCount = $$props.packCount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*singleArea, packArea*/ 5) {
    			{
    				if (singleArea == null || packArea == null || singleArea === 0) {
    					$$invalidate(1, packCount = null);
    				} else {
    					$$invalidate(1, packCount = round(packArea / singleArea));
    				}
    			}
    		}
    	};

    	return [packArea, packCount, singleArea, label0_value_binding, label1_value_binding];
    }

    class AreaToPackage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { singleArea: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AreaToPackage",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get singleArea() {
    		throw new Error("<AreaToPackage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set singleArea(value) {
    		throw new Error("<AreaToPackage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/sections/CountToPackage.svelte generated by Svelte v3.42.6 */
    const file$1 = "src/sections/CountToPackage.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let label0;
    	let updating_value;
    	let t0;
    	let div3;
    	let div2;
    	let label1;
    	let updating_value_1;
    	let t1;
    	let div5;
    	let div4;
    	let label2;
    	let updating_value_2;
    	let t2;
    	let div8;
    	let div6;
    	let label3;
    	let updating_value_3;
    	let t3;
    	let div7;
    	let label4;
    	let updating_value_4;
    	let t4;
    	let div10;
    	let div9;
    	let label5;
    	let updating_value_5;
    	let current;

    	function label0_value_binding(value) {
    		/*label0_value_binding*/ ctx[6](value);
    	}

    	let label0_props = {
    		label: "Надо плиток (шт)",
    		error: /*count*/ ctx[0] == null
    	};

    	if (/*count*/ ctx[0] !== void 0) {
    		label0_props.value = /*count*/ ctx[0];
    	}

    	label0 = new Label({ props: label0_props, $$inline: true });
    	binding_callbacks.push(() => bind(label0, 'value', label0_value_binding));

    	function label1_value_binding(value) {
    		/*label1_value_binding*/ ctx[7](value);
    	}

    	let label1_props = {
    		label: "Плиток в упаковке (шт)",
    		error: /*packCount*/ ctx[1] == null || /*packCount*/ ctx[1] === 0
    	};

    	if (/*packCount*/ ctx[1] !== void 0) {
    		label1_props.value = /*packCount*/ ctx[1];
    	}

    	label1 = new Label({ props: label1_props, $$inline: true });
    	binding_callbacks.push(() => bind(label1, 'value', label1_value_binding));

    	function label2_value_binding(value) {
    		/*label2_value_binding*/ ctx[8](value);
    	}

    	let label2_props = {
    		label: "Кол-во упаковок",
    		disabled: true,
    		error: /*result*/ ctx[3] === -1
    	};

    	if (/*result*/ ctx[3] !== void 0) {
    		label2_props.value = /*result*/ ctx[3];
    	}

    	label2 = new Label({ props: label2_props, $$inline: true });
    	binding_callbacks.push(() => bind(label2, 'value', label2_value_binding));

    	function label3_value_binding(value) {
    		/*label3_value_binding*/ ctx[9](value);
    	}

    	let label3_props = {
    		label: "Целые упаковки (шт)",
    		disabled: true,
    		error: /*resultCeil*/ ctx[2] === -1
    	};

    	if (/*resultCeil*/ ctx[2] !== void 0) {
    		label3_props.value = /*resultCeil*/ ctx[2];
    	}

    	label3 = new Label({ props: label3_props, $$inline: true });
    	binding_callbacks.push(() => bind(label3, 'value', label3_value_binding));

    	function label4_value_binding(value) {
    		/*label4_value_binding*/ ctx[10](value);
    	}

    	let label4_props = {
    		label: "Всего плиток (шт)",
    		disabled: true,
    		error: /*resultCeil*/ ctx[2] === -1
    	};

    	if (/*resultCount*/ ctx[5] !== void 0) {
    		label4_props.value = /*resultCount*/ ctx[5];
    	}

    	label4 = new Label({ props: label4_props, $$inline: true });
    	binding_callbacks.push(() => bind(label4, 'value', label4_value_binding));

    	function label5_value_binding(value) {
    		/*label5_value_binding*/ ctx[11](value);
    	}

    	let label5_props = {
    		label: "Лишниe плитки (шт)",
    		disabled: true,
    		error: /*resultRemain*/ ctx[4] === -1
    	};

    	if (/*resultRemain*/ ctx[4] !== void 0) {
    		label5_props.value = /*resultRemain*/ ctx[4];
    	}

    	label5 = new Label({ props: label5_props, $$inline: true });
    	binding_callbacks.push(() => bind(label5, 'value', label5_value_binding));

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(label0.$$.fragment);
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			create_component(label1.$$.fragment);
    			t1 = space();
    			div5 = element("div");
    			div4 = element("div");
    			create_component(label2.$$.fragment);
    			t2 = space();
    			div8 = element("div");
    			div6 = element("div");
    			create_component(label3.$$.fragment);
    			t3 = space();
    			div7 = element("div");
    			create_component(label4.$$.fragment);
    			t4 = space();
    			div10 = element("div");
    			div9 = element("div");
    			create_component(label5.$$.fragment);
    			attr_dev(div0, "class", "cell");
    			add_location(div0, file$1, 24, 2, 607);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$1, 23, 0, 587);
    			attr_dev(div2, "class", "cell");
    			add_location(div2, file$1, 29, 2, 742);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$1, 28, 0, 722);
    			attr_dev(div4, "class", "cell");
    			add_location(div4, file$1, 38, 2, 932);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$1, 37, 0, 912);
    			attr_dev(div6, "class", "cell");
    			add_location(div6, file$1, 48, 2, 1104);
    			attr_dev(div7, "class", "cell");
    			add_location(div7, file$1, 56, 2, 1263);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$1, 47, 0, 1084);
    			attr_dev(div9, "class", "cell");
    			add_location(div9, file$1, 66, 2, 1446);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$1, 65, 0, 1426);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(label0, div0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			mount_component(label1, div2, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			mount_component(label2, div4, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div6);
    			mount_component(label3, div6, null);
    			append_dev(div8, t3);
    			append_dev(div8, div7);
    			mount_component(label4, div7, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div9);
    			mount_component(label5, div9, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const label0_changes = {};
    			if (dirty & /*count*/ 1) label0_changes.error = /*count*/ ctx[0] == null;

    			if (!updating_value && dirty & /*count*/ 1) {
    				updating_value = true;
    				label0_changes.value = /*count*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			label0.$set(label0_changes);
    			const label1_changes = {};
    			if (dirty & /*packCount*/ 2) label1_changes.error = /*packCount*/ ctx[1] == null || /*packCount*/ ctx[1] === 0;

    			if (!updating_value_1 && dirty & /*packCount*/ 2) {
    				updating_value_1 = true;
    				label1_changes.value = /*packCount*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			label1.$set(label1_changes);
    			const label2_changes = {};
    			if (dirty & /*result*/ 8) label2_changes.error = /*result*/ ctx[3] === -1;

    			if (!updating_value_2 && dirty & /*result*/ 8) {
    				updating_value_2 = true;
    				label2_changes.value = /*result*/ ctx[3];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			label2.$set(label2_changes);
    			const label3_changes = {};
    			if (dirty & /*resultCeil*/ 4) label3_changes.error = /*resultCeil*/ ctx[2] === -1;

    			if (!updating_value_3 && dirty & /*resultCeil*/ 4) {
    				updating_value_3 = true;
    				label3_changes.value = /*resultCeil*/ ctx[2];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			label3.$set(label3_changes);
    			const label4_changes = {};
    			if (dirty & /*resultCeil*/ 4) label4_changes.error = /*resultCeil*/ ctx[2] === -1;

    			if (!updating_value_4 && dirty & /*resultCount*/ 32) {
    				updating_value_4 = true;
    				label4_changes.value = /*resultCount*/ ctx[5];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			label4.$set(label4_changes);
    			const label5_changes = {};
    			if (dirty & /*resultRemain*/ 16) label5_changes.error = /*resultRemain*/ ctx[4] === -1;

    			if (!updating_value_5 && dirty & /*resultRemain*/ 16) {
    				updating_value_5 = true;
    				label5_changes.value = /*resultRemain*/ ctx[4];
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			label5.$set(label5_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label0.$$.fragment, local);
    			transition_in(label1.$$.fragment, local);
    			transition_in(label2.$$.fragment, local);
    			transition_in(label3.$$.fragment, local);
    			transition_in(label4.$$.fragment, local);
    			transition_in(label5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label0.$$.fragment, local);
    			transition_out(label1.$$.fragment, local);
    			transition_out(label2.$$.fragment, local);
    			transition_out(label3.$$.fragment, local);
    			transition_out(label4.$$.fragment, local);
    			transition_out(label5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(label0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div3);
    			destroy_component(label1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div5);
    			destroy_component(label2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div8);
    			destroy_component(label3);
    			destroy_component(label4);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div10);
    			destroy_component(label5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CountToPackage', slots, []);
    	let count = null;
    	let packCount = null;
    	let result = null;
    	let resultRemain = null;
    	let resultCeil = null;
    	let resultCount = null;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CountToPackage> was created with unknown prop '${key}'`);
    	});

    	function label0_value_binding(value) {
    		count = value;
    		$$invalidate(0, count);
    	}

    	function label1_value_binding(value) {
    		packCount = value;
    		$$invalidate(1, packCount);
    	}

    	function label2_value_binding(value) {
    		result = value;
    		((($$invalidate(3, result), $$invalidate(1, packCount)), $$invalidate(0, count)), $$invalidate(2, resultCeil));
    	}

    	function label3_value_binding(value) {
    		resultCeil = value;
    		(($$invalidate(2, resultCeil), $$invalidate(1, packCount)), $$invalidate(0, count));
    	}

    	function label4_value_binding(value) {
    		resultCount = value;
    		((($$invalidate(5, resultCount), $$invalidate(1, packCount)), $$invalidate(0, count)), $$invalidate(2, resultCeil));
    	}

    	function label5_value_binding(value) {
    		resultRemain = value;
    		((($$invalidate(4, resultRemain), $$invalidate(1, packCount)), $$invalidate(0, count)), $$invalidate(2, resultCeil));
    	}

    	$$self.$capture_state = () => ({
    		Label,
    		count,
    		packCount,
    		result,
    		resultRemain,
    		resultCeil,
    		resultCount
    	});

    	$$self.$inject_state = $$props => {
    		if ('count' in $$props) $$invalidate(0, count = $$props.count);
    		if ('packCount' in $$props) $$invalidate(1, packCount = $$props.packCount);
    		if ('result' in $$props) $$invalidate(3, result = $$props.result);
    		if ('resultRemain' in $$props) $$invalidate(4, resultRemain = $$props.resultRemain);
    		if ('resultCeil' in $$props) $$invalidate(2, resultCeil = $$props.resultCeil);
    		if ('resultCount' in $$props) $$invalidate(5, resultCount = $$props.resultCount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*packCount, count, resultCeil*/ 7) {
    			{
    				if (packCount === 0 || packCount == null || count == null) {
    					$$invalidate(3, result = null);
    					$$invalidate(4, resultRemain = null);
    					$$invalidate(2, resultCeil = null);
    					$$invalidate(5, resultCount = null);
    				} else {
    					$$invalidate(2, resultCeil = Math.ceil(count / packCount));
    					$$invalidate(4, resultRemain = resultCeil * packCount - count);
    					$$invalidate(3, result = count / packCount);
    					$$invalidate(5, resultCount = resultCeil * packCount);
    				}
    			}
    		}
    	};

    	return [
    		count,
    		packCount,
    		resultCeil,
    		result,
    		resultRemain,
    		resultCount,
    		label0_value_binding,
    		label1_value_binding,
    		label2_value_binding,
    		label3_value_binding,
    		label4_value_binding,
    		label5_value_binding
    	];
    }

    class CountToPackage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CountToPackage",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.42.6 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let nav;
    	let button0;
    	let button1;
    	let button2;
    	let t3;
    	let section0;
    	let area;
    	let updating_singleArea;
    	let t4;
    	let section1;
    	let areatoprice;
    	let updating_singleArea_1;
    	let t5;
    	let section2;
    	let areatopackage;
    	let updating_singleArea_2;
    	let t6;
    	let section3;
    	let counttopackage;
    	let current;
    	let mounted;
    	let dispose;

    	function area_singleArea_binding(value) {
    		/*area_singleArea_binding*/ ctx[5](value);
    	}

    	let area_props = { mustNotZero: /*screen*/ ctx[0] === 1 };

    	if (/*singleArea*/ ctx[1] !== void 0) {
    		area_props.singleArea = /*singleArea*/ ctx[1];
    	}

    	area = new Area({ props: area_props, $$inline: true });
    	binding_callbacks.push(() => bind(area, 'singleArea', area_singleArea_binding));

    	function areatoprice_singleArea_binding(value) {
    		/*areatoprice_singleArea_binding*/ ctx[6](value);
    	}

    	let areatoprice_props = {};

    	if (/*singleArea*/ ctx[1] !== void 0) {
    		areatoprice_props.singleArea = /*singleArea*/ ctx[1];
    	}

    	areatoprice = new AreaToPrice({ props: areatoprice_props, $$inline: true });
    	binding_callbacks.push(() => bind(areatoprice, 'singleArea', areatoprice_singleArea_binding));

    	function areatopackage_singleArea_binding(value) {
    		/*areatopackage_singleArea_binding*/ ctx[7](value);
    	}

    	let areatopackage_props = {};

    	if (/*singleArea*/ ctx[1] !== void 0) {
    		areatopackage_props.singleArea = /*singleArea*/ ctx[1];
    	}

    	areatopackage = new AreaToPackage({
    			props: areatopackage_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(areatopackage, 'singleArea', areatopackage_singleArea_binding));
    	counttopackage = new CountToPackage({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			nav = element("nav");
    			button0 = element("button");
    			button0.textContent = "Цена Плитки";
    			button1 = element("button");
    			button1.textContent = "Кол-во Плиток";
    			button2 = element("button");
    			button2.textContent = "Кол-во Упаковок";
    			t3 = space();
    			section0 = element("section");
    			create_component(area.$$.fragment);
    			t4 = space();
    			section1 = element("section");
    			create_component(areatoprice.$$.fragment);
    			t5 = space();
    			section2 = element("section");
    			create_component(areatopackage.$$.fragment);
    			t6 = space();
    			section3 = element("section");
    			create_component(counttopackage.$$.fragment);
    			attr_dev(button0, "class", "cell svelte-23hwrx");
    			attr_dev(button0, "type", "button");
    			toggle_class(button0, "selected", /*screen*/ ctx[0] === 0);
    			add_location(button0, file, 14, 4, 409);
    			attr_dev(button1, "class", "cell svelte-23hwrx");
    			attr_dev(button1, "type", "button");
    			toggle_class(button1, "selected", /*screen*/ ctx[0] === 1);
    			add_location(button1, file, 19, 5, 553);
    			attr_dev(button2, "class", "cell svelte-23hwrx");
    			attr_dev(button2, "type", "button");
    			toggle_class(button2, "selected", /*screen*/ ctx[0] === 2);
    			add_location(button2, file, 24, 5, 699);
    			attr_dev(nav, "class", "row svelte-23hwrx");
    			add_location(nav, file, 13, 2, 387);
    			attr_dev(section0, "class", "single-area svelte-23hwrx");
    			toggle_class(section0, "hidden", /*screen*/ ctx[0] !== 0 && /*screen*/ ctx[0] !== 1);
    			add_location(section0, file, 31, 2, 859);
    			attr_dev(section1, "class", "calc-single-price svelte-23hwrx");
    			toggle_class(section1, "hidden", /*screen*/ ctx[0] !== 0);
    			add_location(section1, file, 34, 2, 1004);
    			attr_dev(section2, "class", "calc-pack-count svelte-23hwrx");
    			toggle_class(section2, "hidden", /*screen*/ ctx[0] !== 1);
    			add_location(section2, file, 37, 2, 1119);
    			attr_dev(section3, "class", "calc-cart svelte-23hwrx");
    			toggle_class(section3, "hidden", /*screen*/ ctx[0] !== 2);
    			add_location(section3, file, 40, 2, 1234);
    			attr_dev(main, "class", "svelte-23hwrx");
    			add_location(main, file, 12, 0, 378);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, nav);
    			append_dev(nav, button0);
    			append_dev(nav, button1);
    			append_dev(nav, button2);
    			append_dev(main, t3);
    			append_dev(main, section0);
    			mount_component(area, section0, null);
    			append_dev(main, t4);
    			append_dev(main, section1);
    			mount_component(areatoprice, section1, null);
    			append_dev(main, t5);
    			append_dev(main, section2);
    			mount_component(areatopackage, section2, null);
    			append_dev(main, t6);
    			append_dev(main, section3);
    			mount_component(counttopackage, section3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[3], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*screen*/ 1) {
    				toggle_class(button0, "selected", /*screen*/ ctx[0] === 0);
    			}

    			if (dirty & /*screen*/ 1) {
    				toggle_class(button1, "selected", /*screen*/ ctx[0] === 1);
    			}

    			if (dirty & /*screen*/ 1) {
    				toggle_class(button2, "selected", /*screen*/ ctx[0] === 2);
    			}

    			const area_changes = {};
    			if (dirty & /*screen*/ 1) area_changes.mustNotZero = /*screen*/ ctx[0] === 1;

    			if (!updating_singleArea && dirty & /*singleArea*/ 2) {
    				updating_singleArea = true;
    				area_changes.singleArea = /*singleArea*/ ctx[1];
    				add_flush_callback(() => updating_singleArea = false);
    			}

    			area.$set(area_changes);

    			if (dirty & /*screen*/ 1) {
    				toggle_class(section0, "hidden", /*screen*/ ctx[0] !== 0 && /*screen*/ ctx[0] !== 1);
    			}

    			const areatoprice_changes = {};

    			if (!updating_singleArea_1 && dirty & /*singleArea*/ 2) {
    				updating_singleArea_1 = true;
    				areatoprice_changes.singleArea = /*singleArea*/ ctx[1];
    				add_flush_callback(() => updating_singleArea_1 = false);
    			}

    			areatoprice.$set(areatoprice_changes);

    			if (dirty & /*screen*/ 1) {
    				toggle_class(section1, "hidden", /*screen*/ ctx[0] !== 0);
    			}

    			const areatopackage_changes = {};

    			if (!updating_singleArea_2 && dirty & /*singleArea*/ 2) {
    				updating_singleArea_2 = true;
    				areatopackage_changes.singleArea = /*singleArea*/ ctx[1];
    				add_flush_callback(() => updating_singleArea_2 = false);
    			}

    			areatopackage.$set(areatopackage_changes);

    			if (dirty & /*screen*/ 1) {
    				toggle_class(section2, "hidden", /*screen*/ ctx[0] !== 1);
    			}

    			if (dirty & /*screen*/ 1) {
    				toggle_class(section3, "hidden", /*screen*/ ctx[0] !== 2);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(area.$$.fragment, local);
    			transition_in(areatoprice.$$.fragment, local);
    			transition_in(areatopackage.$$.fragment, local);
    			transition_in(counttopackage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(area.$$.fragment, local);
    			transition_out(areatoprice.$$.fragment, local);
    			transition_out(areatopackage.$$.fragment, local);
    			transition_out(counttopackage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(area);
    			destroy_component(areatoprice);
    			destroy_component(areatopackage);
    			destroy_component(counttopackage);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let screen = 0;
    	let singleArea = null;
    	let singlePrice = null;
    	let packArea = 0;
    	let packCount = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, screen = 0);
    	const click_handler_1 = () => $$invalidate(0, screen = 1);
    	const click_handler_2 = () => $$invalidate(0, screen = 2);

    	function area_singleArea_binding(value) {
    		singleArea = value;
    		$$invalidate(1, singleArea);
    	}

    	function areatoprice_singleArea_binding(value) {
    		singleArea = value;
    		$$invalidate(1, singleArea);
    	}

    	function areatopackage_singleArea_binding(value) {
    		singleArea = value;
    		$$invalidate(1, singleArea);
    	}

    	$$self.$capture_state = () => ({
    		Area,
    		AreaToPrice,
    		AreaToPackage,
    		CountToPackage,
    		screen,
    		singleArea,
    		singlePrice,
    		packArea,
    		packCount
    	});

    	$$self.$inject_state = $$props => {
    		if ('screen' in $$props) $$invalidate(0, screen = $$props.screen);
    		if ('singleArea' in $$props) $$invalidate(1, singleArea = $$props.singleArea);
    		if ('singlePrice' in $$props) singlePrice = $$props.singlePrice;
    		if ('packArea' in $$props) packArea = $$props.packArea;
    		if ('packCount' in $$props) packCount = $$props.packCount;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		screen,
    		singleArea,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		area_singleArea_binding,
    		areatoprice_singleArea_binding,
    		areatopackage_singleArea_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
