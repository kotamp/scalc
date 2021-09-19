
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

    const file$1 = "src/Label.svelte";

    function create_fragment$1(ctx) {
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
    			attr_dev(label_1, "for", "labelId");
    			add_location(label_1, file$1, 12, 2, 296);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "name", "labelId");
    			input.disabled = /*disabled*/ ctx[2];
    			attr_dev(input, "class", "svelte-1chfeer");
    			toggle_class(input, "error", /*error*/ ctx[3]);
    			add_location(input, file$1, 13, 2, 335);
    			add_location(div, file$1, 11, 0, 288);
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
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[4]);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
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

    	return [value, label, disabled, error, input_input_handler];
    }

    class Label extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			label: 1,
    			value: 0,
    			disabled: 2,
    			error: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Label",
    			options,
    			id: create_fragment$1.name
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

    /* src/App.svelte generated by Svelte v3.42.6 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let nav;
    	let button0;
    	let button1;
    	let button2;
    	let t3;
    	let section0;
    	let label0;
    	let updating_value;
    	let t4;
    	let label1;
    	let updating_value_1;
    	let t5;
    	let label2;
    	let updating_value_2;
    	let t6;
    	let section1;
    	let label3;
    	let updating_value_3;
    	let t7;
    	let label4;
    	let updating_value_4;
    	let t8;
    	let section2;
    	let label5;
    	let updating_value_5;
    	let t9;
    	let label6;
    	let updating_value_6;
    	let t10;
    	let section3;
    	let label7;
    	let updating_value_7;
    	let t11;
    	let label8;
    	let updating_value_8;
    	let t12;
    	let label9;
    	let updating_value_9;
    	let t13;
    	let label10;
    	let updating_value_10;
    	let t14;
    	let label11;
    	let updating_value_11;
    	let t15;
    	let label12;
    	let updating_value_12;
    	let current;
    	let mounted;
    	let dispose;

    	function label0_value_binding(value) {
    		/*label0_value_binding*/ ctx[17](value);
    	}

    	let label0_props = { label: "Ширина (см)" };

    	if (/*width*/ ctx[0] !== void 0) {
    		label0_props.value = /*width*/ ctx[0];
    	}

    	label0 = new Label({ props: label0_props, $$inline: true });
    	binding_callbacks.push(() => bind(label0, 'value', label0_value_binding));

    	function label1_value_binding(value) {
    		/*label1_value_binding*/ ctx[18](value);
    	}

    	let label1_props = { label: "Длина (см)" };

    	if (/*length*/ ctx[1] !== void 0) {
    		label1_props.value = /*length*/ ctx[1];
    	}

    	label1 = new Label({ props: label1_props, $$inline: true });
    	binding_callbacks.push(() => bind(label1, 'value', label1_value_binding));

    	function label2_value_binding(value) {
    		/*label2_value_binding*/ ctx[19](value);
    	}

    	let label2_props = {
    		label: "Площадь (кв. м)",
    		disabled: true,
    		error: /*screen*/ ctx[8] === 1 && /*area*/ ctx[2] === 0
    	};

    	if (/*area*/ ctx[2] !== void 0) {
    		label2_props.value = /*area*/ ctx[2];
    	}

    	label2 = new Label({ props: label2_props, $$inline: true });
    	binding_callbacks.push(() => bind(label2, 'value', label2_value_binding));

    	function label3_value_binding(value) {
    		/*label3_value_binding*/ ctx[20](value);
    	}

    	let label3_props = { label: "Цена одного кв. м" };

    	if (/*priceSquare*/ ctx[3] !== void 0) {
    		label3_props.value = /*priceSquare*/ ctx[3];
    	}

    	label3 = new Label({ props: label3_props, $$inline: true });
    	binding_callbacks.push(() => bind(label3, 'value', label3_value_binding));

    	function label4_value_binding(value) {
    		/*label4_value_binding*/ ctx[21](value);
    	}

    	let label4_props = {
    		label: "Цена Плитки",
    		disabled: true,
    		error: /*priceOne*/ ctx[9] === -1
    	};

    	if (/*priceOne*/ ctx[9] !== void 0) {
    		label4_props.value = /*priceOne*/ ctx[9];
    	}

    	label4 = new Label({ props: label4_props, $$inline: true });
    	binding_callbacks.push(() => bind(label4, 'value', label4_value_binding));

    	function label5_value_binding(value) {
    		/*label5_value_binding*/ ctx[22](value);
    	}

    	let label5_props = { label: "Упаковка (кв. м)" };

    	if (/*packArea*/ ctx[4] !== void 0) {
    		label5_props.value = /*packArea*/ ctx[4];
    	}

    	label5 = new Label({ props: label5_props, $$inline: true });
    	binding_callbacks.push(() => bind(label5, 'value', label5_value_binding));

    	function label6_value_binding(value) {
    		/*label6_value_binding*/ ctx[23](value);
    	}

    	let label6_props = {
    		label: "Упаковка (шт)",
    		disabled: true,
    		error: /*packCount*/ ctx[10] === -1
    	};

    	if (/*packCount*/ ctx[10] !== void 0) {
    		label6_props.value = /*packCount*/ ctx[10];
    	}

    	label6 = new Label({ props: label6_props, $$inline: true });
    	binding_callbacks.push(() => bind(label6, 'value', label6_value_binding));

    	function label7_value_binding(value) {
    		/*label7_value_binding*/ ctx[24](value);
    	}

    	let label7_props = { label: "Надо плиток (шт)" };

    	if (/*queryCount*/ ctx[5] !== void 0) {
    		label7_props.value = /*queryCount*/ ctx[5];
    	}

    	label7 = new Label({ props: label7_props, $$inline: true });
    	binding_callbacks.push(() => bind(label7, 'value', label7_value_binding));

    	function label8_value_binding(value) {
    		/*label8_value_binding*/ ctx[25](value);
    	}

    	let label8_props = { label: "Плиток в упаковке (шт)" };

    	if (/*queryPackCount*/ ctx[6] !== void 0) {
    		label8_props.value = /*queryPackCount*/ ctx[6];
    	}

    	label8 = new Label({ props: label8_props, $$inline: true });
    	binding_callbacks.push(() => bind(label8, 'value', label8_value_binding));

    	function label9_value_binding(value) {
    		/*label9_value_binding*/ ctx[26](value);
    	}

    	let label9_props = {
    		label: "Кол-во упаковок",
    		disabled: true,
    		error: /*queryResult*/ ctx[11] === -1
    	};

    	if (/*queryResult*/ ctx[11] !== void 0) {
    		label9_props.value = /*queryResult*/ ctx[11];
    	}

    	label9 = new Label({ props: label9_props, $$inline: true });
    	binding_callbacks.push(() => bind(label9, 'value', label9_value_binding));

    	function label10_value_binding(value) {
    		/*label10_value_binding*/ ctx[27](value);
    	}

    	let label10_props = {
    		label: "Кол-во лишних плиток (шт)",
    		disabled: true,
    		error: /*queryResultRemainder*/ ctx[12] === -1
    	};

    	if (/*queryResultRemainder*/ ctx[12] !== void 0) {
    		label10_props.value = /*queryResultRemainder*/ ctx[12];
    	}

    	label10 = new Label({ props: label10_props, $$inline: true });
    	binding_callbacks.push(() => bind(label10, 'value', label10_value_binding));

    	function label11_value_binding(value) {
    		/*label11_value_binding*/ ctx[28](value);
    	}

    	let label11_props = {
    		label: "Кол-во целых упаковок (шт)",
    		disabled: true,
    		error: /*queryResultCeil*/ ctx[7] === -1
    	};

    	if (/*queryResultCeil*/ ctx[7] !== void 0) {
    		label11_props.value = /*queryResultCeil*/ ctx[7];
    	}

    	label11 = new Label({ props: label11_props, $$inline: true });
    	binding_callbacks.push(() => bind(label11, 'value', label11_value_binding));

    	function label12_value_binding(value) {
    		/*label12_value_binding*/ ctx[29](value);
    	}

    	let label12_props = {
    		label: "Кол-во плиток (шт)",
    		disabled: true,
    		error: /*queryResultCeil*/ ctx[7] === -1
    	};

    	if (/*queryFull*/ ctx[13] !== void 0) {
    		label12_props.value = /*queryFull*/ ctx[13];
    	}

    	label12 = new Label({ props: label12_props, $$inline: true });
    	binding_callbacks.push(() => bind(label12, 'value', label12_value_binding));

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
    			create_component(label0.$$.fragment);
    			t4 = space();
    			create_component(label1.$$.fragment);
    			t5 = space();
    			create_component(label2.$$.fragment);
    			t6 = space();
    			section1 = element("section");
    			create_component(label3.$$.fragment);
    			t7 = space();
    			create_component(label4.$$.fragment);
    			t8 = space();
    			section2 = element("section");
    			create_component(label5.$$.fragment);
    			t9 = space();
    			create_component(label6.$$.fragment);
    			t10 = space();
    			section3 = element("section");
    			create_component(label7.$$.fragment);
    			t11 = space();
    			create_component(label8.$$.fragment);
    			t12 = space();
    			create_component(label9.$$.fragment);
    			t13 = space();
    			create_component(label10.$$.fragment);
    			t14 = space();
    			create_component(label11.$$.fragment);
    			t15 = space();
    			create_component(label12.$$.fragment);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "svelte-ar7zl3");
    			add_location(button0, file, 52, 5, 1171);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "svelte-ar7zl3");
    			add_location(button1, file, 53, 5, 1248);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "svelte-ar7zl3");
    			add_location(button2, file, 54, 5, 1327);
    			attr_dev(nav, "class", "svelte-ar7zl3");
    			add_location(nav, file, 51, 2, 1161);
    			attr_dev(section0, "class", "single-area svelte-ar7zl3");
    			toggle_class(section0, "hidden", /*screen*/ ctx[8] !== 0 && /*screen*/ ctx[8] !== 1);
    			add_location(section0, file, 57, 2, 1420);
    			attr_dev(section1, "class", "calc-single-price svelte-ar7zl3");
    			toggle_class(section1, "hidden", /*screen*/ ctx[8] !== 0);
    			add_location(section1, file, 67, 2, 1743);
    			attr_dev(section2, "class", "calc-pack-count svelte-ar7zl3");
    			toggle_class(section2, "hidden", /*screen*/ ctx[8] !== 1);
    			add_location(section2, file, 76, 2, 2004);
    			attr_dev(section3, "class", "calc-cart svelte-ar7zl3");
    			toggle_class(section3, "hidden", /*screen*/ ctx[8] !== 2);
    			add_location(section3, file, 85, 2, 2263);
    			attr_dev(main, "class", "svelte-ar7zl3");
    			add_location(main, file, 50, 0, 1152);
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
    			mount_component(label0, section0, null);
    			append_dev(section0, t4);
    			mount_component(label1, section0, null);
    			append_dev(section0, t5);
    			mount_component(label2, section0, null);
    			append_dev(main, t6);
    			append_dev(main, section1);
    			mount_component(label3, section1, null);
    			append_dev(section1, t7);
    			mount_component(label4, section1, null);
    			append_dev(main, t8);
    			append_dev(main, section2);
    			mount_component(label5, section2, null);
    			append_dev(section2, t9);
    			mount_component(label6, section2, null);
    			append_dev(main, t10);
    			append_dev(main, section3);
    			mount_component(label7, section3, null);
    			append_dev(section3, t11);
    			mount_component(label8, section3, null);
    			append_dev(section3, t12);
    			mount_component(label9, section3, null);
    			append_dev(section3, t13);
    			mount_component(label10, section3, null);
    			append_dev(section3, t14);
    			mount_component(label11, section3, null);
    			append_dev(section3, t15);
    			mount_component(label12, section3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[14], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[15], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const label0_changes = {};

    			if (!updating_value && dirty & /*width*/ 1) {
    				updating_value = true;
    				label0_changes.value = /*width*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			label0.$set(label0_changes);
    			const label1_changes = {};

    			if (!updating_value_1 && dirty & /*length*/ 2) {
    				updating_value_1 = true;
    				label1_changes.value = /*length*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			label1.$set(label1_changes);
    			const label2_changes = {};
    			if (dirty & /*screen, area*/ 260) label2_changes.error = /*screen*/ ctx[8] === 1 && /*area*/ ctx[2] === 0;

    			if (!updating_value_2 && dirty & /*area*/ 4) {
    				updating_value_2 = true;
    				label2_changes.value = /*area*/ ctx[2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			label2.$set(label2_changes);

    			if (dirty & /*screen*/ 256) {
    				toggle_class(section0, "hidden", /*screen*/ ctx[8] !== 0 && /*screen*/ ctx[8] !== 1);
    			}

    			const label3_changes = {};

    			if (!updating_value_3 && dirty & /*priceSquare*/ 8) {
    				updating_value_3 = true;
    				label3_changes.value = /*priceSquare*/ ctx[3];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			label3.$set(label3_changes);
    			const label4_changes = {};
    			if (dirty & /*priceOne*/ 512) label4_changes.error = /*priceOne*/ ctx[9] === -1;

    			if (!updating_value_4 && dirty & /*priceOne*/ 512) {
    				updating_value_4 = true;
    				label4_changes.value = /*priceOne*/ ctx[9];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			label4.$set(label4_changes);

    			if (dirty & /*screen*/ 256) {
    				toggle_class(section1, "hidden", /*screen*/ ctx[8] !== 0);
    			}

    			const label5_changes = {};

    			if (!updating_value_5 && dirty & /*packArea*/ 16) {
    				updating_value_5 = true;
    				label5_changes.value = /*packArea*/ ctx[4];
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			label5.$set(label5_changes);
    			const label6_changes = {};
    			if (dirty & /*packCount*/ 1024) label6_changes.error = /*packCount*/ ctx[10] === -1;

    			if (!updating_value_6 && dirty & /*packCount*/ 1024) {
    				updating_value_6 = true;
    				label6_changes.value = /*packCount*/ ctx[10];
    				add_flush_callback(() => updating_value_6 = false);
    			}

    			label6.$set(label6_changes);

    			if (dirty & /*screen*/ 256) {
    				toggle_class(section2, "hidden", /*screen*/ ctx[8] !== 1);
    			}

    			const label7_changes = {};

    			if (!updating_value_7 && dirty & /*queryCount*/ 32) {
    				updating_value_7 = true;
    				label7_changes.value = /*queryCount*/ ctx[5];
    				add_flush_callback(() => updating_value_7 = false);
    			}

    			label7.$set(label7_changes);
    			const label8_changes = {};

    			if (!updating_value_8 && dirty & /*queryPackCount*/ 64) {
    				updating_value_8 = true;
    				label8_changes.value = /*queryPackCount*/ ctx[6];
    				add_flush_callback(() => updating_value_8 = false);
    			}

    			label8.$set(label8_changes);
    			const label9_changes = {};
    			if (dirty & /*queryResult*/ 2048) label9_changes.error = /*queryResult*/ ctx[11] === -1;

    			if (!updating_value_9 && dirty & /*queryResult*/ 2048) {
    				updating_value_9 = true;
    				label9_changes.value = /*queryResult*/ ctx[11];
    				add_flush_callback(() => updating_value_9 = false);
    			}

    			label9.$set(label9_changes);
    			const label10_changes = {};
    			if (dirty & /*queryResultRemainder*/ 4096) label10_changes.error = /*queryResultRemainder*/ ctx[12] === -1;

    			if (!updating_value_10 && dirty & /*queryResultRemainder*/ 4096) {
    				updating_value_10 = true;
    				label10_changes.value = /*queryResultRemainder*/ ctx[12];
    				add_flush_callback(() => updating_value_10 = false);
    			}

    			label10.$set(label10_changes);
    			const label11_changes = {};
    			if (dirty & /*queryResultCeil*/ 128) label11_changes.error = /*queryResultCeil*/ ctx[7] === -1;

    			if (!updating_value_11 && dirty & /*queryResultCeil*/ 128) {
    				updating_value_11 = true;
    				label11_changes.value = /*queryResultCeil*/ ctx[7];
    				add_flush_callback(() => updating_value_11 = false);
    			}

    			label11.$set(label11_changes);
    			const label12_changes = {};
    			if (dirty & /*queryResultCeil*/ 128) label12_changes.error = /*queryResultCeil*/ ctx[7] === -1;

    			if (!updating_value_12 && dirty & /*queryFull*/ 8192) {
    				updating_value_12 = true;
    				label12_changes.value = /*queryFull*/ ctx[13];
    				add_flush_callback(() => updating_value_12 = false);
    			}

    			label12.$set(label12_changes);

    			if (dirty & /*screen*/ 256) {
    				toggle_class(section3, "hidden", /*screen*/ ctx[8] !== 2);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label0.$$.fragment, local);
    			transition_in(label1.$$.fragment, local);
    			transition_in(label2.$$.fragment, local);
    			transition_in(label3.$$.fragment, local);
    			transition_in(label4.$$.fragment, local);
    			transition_in(label5.$$.fragment, local);
    			transition_in(label6.$$.fragment, local);
    			transition_in(label7.$$.fragment, local);
    			transition_in(label8.$$.fragment, local);
    			transition_in(label9.$$.fragment, local);
    			transition_in(label10.$$.fragment, local);
    			transition_in(label11.$$.fragment, local);
    			transition_in(label12.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label0.$$.fragment, local);
    			transition_out(label1.$$.fragment, local);
    			transition_out(label2.$$.fragment, local);
    			transition_out(label3.$$.fragment, local);
    			transition_out(label4.$$.fragment, local);
    			transition_out(label5.$$.fragment, local);
    			transition_out(label6.$$.fragment, local);
    			transition_out(label7.$$.fragment, local);
    			transition_out(label8.$$.fragment, local);
    			transition_out(label9.$$.fragment, local);
    			transition_out(label10.$$.fragment, local);
    			transition_out(label11.$$.fragment, local);
    			transition_out(label12.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(label0);
    			destroy_component(label1);
    			destroy_component(label2);
    			destroy_component(label3);
    			destroy_component(label4);
    			destroy_component(label5);
    			destroy_component(label6);
    			destroy_component(label7);
    			destroy_component(label8);
    			destroy_component(label9);
    			destroy_component(label10);
    			destroy_component(label11);
    			destroy_component(label12);
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
    	let width = 0;
    	let length = 0;
    	let area = 0;
    	let priceSquare = 0;
    	let priceOne = 0;
    	let packArea = 0;
    	let packCount = 0;
    	let queryCount = 0;
    	let queryPackCount = 0;
    	let queryResult = 0;
    	let queryResultRemainder = 0;
    	let queryResultCeil = 0;
    	let queryFull = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(8, screen = 0);
    	const click_handler_1 = () => $$invalidate(8, screen = 1);
    	const click_handler_2 = () => $$invalidate(8, screen = 2);

    	function label0_value_binding(value) {
    		width = value;
    		$$invalidate(0, width);
    	}

    	function label1_value_binding(value) {
    		length = value;
    		$$invalidate(1, length);
    	}

    	function label2_value_binding(value) {
    		area = value;
    		(($$invalidate(2, area), $$invalidate(0, width)), $$invalidate(1, length));
    	}

    	function label3_value_binding(value) {
    		priceSquare = value;
    		$$invalidate(3, priceSquare);
    	}

    	function label4_value_binding(value) {
    		priceOne = value;
    		(((($$invalidate(9, priceOne), $$invalidate(3, priceSquare)), $$invalidate(2, area)), $$invalidate(0, width)), $$invalidate(1, length));
    	}

    	function label5_value_binding(value) {
    		packArea = value;
    		$$invalidate(4, packArea);
    	}

    	function label6_value_binding(value) {
    		packCount = value;
    		(((($$invalidate(10, packCount), $$invalidate(2, area)), $$invalidate(4, packArea)), $$invalidate(0, width)), $$invalidate(1, length));
    	}

    	function label7_value_binding(value) {
    		queryCount = value;
    		$$invalidate(5, queryCount);
    	}

    	function label8_value_binding(value) {
    		queryPackCount = value;
    		$$invalidate(6, queryPackCount);
    	}

    	function label9_value_binding(value) {
    		queryResult = value;
    		((($$invalidate(11, queryResult), $$invalidate(6, queryPackCount)), $$invalidate(5, queryCount)), $$invalidate(7, queryResultCeil));
    	}

    	function label10_value_binding(value) {
    		queryResultRemainder = value;
    		((($$invalidate(12, queryResultRemainder), $$invalidate(6, queryPackCount)), $$invalidate(5, queryCount)), $$invalidate(7, queryResultCeil));
    	}

    	function label11_value_binding(value) {
    		queryResultCeil = value;
    		(($$invalidate(7, queryResultCeil), $$invalidate(6, queryPackCount)), $$invalidate(5, queryCount));
    	}

    	function label12_value_binding(value) {
    		queryFull = value;
    		((($$invalidate(13, queryFull), $$invalidate(6, queryPackCount)), $$invalidate(5, queryCount)), $$invalidate(7, queryResultCeil));
    	}

    	$$self.$capture_state = () => ({
    		Label,
    		screen,
    		width,
    		length,
    		area,
    		priceSquare,
    		priceOne,
    		packArea,
    		packCount,
    		queryCount,
    		queryPackCount,
    		queryResult,
    		queryResultRemainder,
    		queryResultCeil,
    		queryFull
    	});

    	$$self.$inject_state = $$props => {
    		if ('screen' in $$props) $$invalidate(8, screen = $$props.screen);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('length' in $$props) $$invalidate(1, length = $$props.length);
    		if ('area' in $$props) $$invalidate(2, area = $$props.area);
    		if ('priceSquare' in $$props) $$invalidate(3, priceSquare = $$props.priceSquare);
    		if ('priceOne' in $$props) $$invalidate(9, priceOne = $$props.priceOne);
    		if ('packArea' in $$props) $$invalidate(4, packArea = $$props.packArea);
    		if ('packCount' in $$props) $$invalidate(10, packCount = $$props.packCount);
    		if ('queryCount' in $$props) $$invalidate(5, queryCount = $$props.queryCount);
    		if ('queryPackCount' in $$props) $$invalidate(6, queryPackCount = $$props.queryPackCount);
    		if ('queryResult' in $$props) $$invalidate(11, queryResult = $$props.queryResult);
    		if ('queryResultRemainder' in $$props) $$invalidate(12, queryResultRemainder = $$props.queryResultRemainder);
    		if ('queryResultCeil' in $$props) $$invalidate(7, queryResultCeil = $$props.queryResultCeil);
    		if ('queryFull' in $$props) $$invalidate(13, queryFull = $$props.queryFull);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*width, length*/ 3) {
    			$$invalidate(2, area = (width || 0) * (length || 0) * 0.0001);
    		}

    		if ($$self.$$.dirty & /*priceSquare, area*/ 12) {
    			{
    				if (priceSquare === 0) {
    					$$invalidate(9, priceOne = -1);
    				} else {
    					$$invalidate(9, priceOne = (area || 0) * priceSquare);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*area, packArea*/ 20) {
    			{
    				if (area === 0) {
    					$$invalidate(10, packCount = -1);
    				} else {
    					$$invalidate(10, packCount = packArea / area);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*queryPackCount, queryCount, queryResultCeil*/ 224) {
    			// queryCount
    			{
    				console.log(queryPackCount);

    				if (queryPackCount === 0 || queryPackCount == null || queryCount == null) {
    					$$invalidate(11, queryResult = -1);
    					$$invalidate(12, queryResultRemainder = -1);
    					$$invalidate(7, queryResultCeil = -1);
    					$$invalidate(13, queryFull = -1);
    				} else {
    					$$invalidate(7, queryResultCeil = Math.ceil(queryCount / queryPackCount));
    					$$invalidate(12, queryResultRemainder = queryResultCeil * queryPackCount - queryCount);
    					$$invalidate(11, queryResult = queryCount / queryPackCount);
    					$$invalidate(13, queryFull = queryResultCeil * queryPackCount);
    				}
    			}
    		}
    	};

    	return [
    		width,
    		length,
    		area,
    		priceSquare,
    		packArea,
    		queryCount,
    		queryPackCount,
    		queryResultCeil,
    		screen,
    		priceOne,
    		packCount,
    		queryResult,
    		queryResultRemainder,
    		queryFull,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		label0_value_binding,
    		label1_value_binding,
    		label2_value_binding,
    		label3_value_binding,
    		label4_value_binding,
    		label5_value_binding,
    		label6_value_binding,
    		label7_value_binding,
    		label8_value_binding,
    		label9_value_binding,
    		label10_value_binding,
    		label11_value_binding,
    		label12_value_binding
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
        props: {
            name: 'world'
        }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
