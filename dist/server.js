exports = globalThis.exports;
let node_fs_promises = require("node:fs/promises");
// ../../../packages/lib/src/server/rateLimit.ts
var SourceLock = class {
	active = new Set();
	async run(source, busy, task) {
		if (this.active.has(source)) return busy;
		this.active.add(source);
		try {
			return await task();
		} finally {
			this.active.delete(source);
		}
	}
	release(source) {
		this.active.delete(source);
	}
}, RateLimit = class {
	count;
	windowMs;
	hits = new Map();
	constructor(count, windowMs) {
		this.count = count, this.windowMs = windowMs;
	}
	take(source) {
		let now = GetGameTimer(), recent = (this.hits.get(source) ?? []).filter((at) => now - at < this.windowMs);
		return recent.length >= this.count ? (this.hits.set(source, recent), !1) : (recent.push(now), this.hits.set(source, recent), !0);
	}
	release(source) {
		this.hits.delete(source);
	}
};
// ../../../packages/lib/src/shared/read.ts
function num(value, fallback, min = -Infinity, max = Infinity) {
	return typeof value == "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
function bool(value, fallback) {
	return typeof value == "boolean" ? value : fallback;
}
function str(value, fallback, max = 64) {
	return typeof value == "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}
function record(value) {
	return typeof value == "object" && value && !Array.isArray(value) ? value : {};
}
// ../../../packages/lib/src/shared/index.ts
function isRecord(value) {
	return typeof value == "object" && !!value && !Array.isArray(value);
}
function logSafe(text, max) {
	return text.replace(/\r?\n/g, " | ").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\^\d/g, "").slice(0, max);
}
function formatText(template, args) {
	return template.replace(/\{(\d+)\}/g, (match, index) => {
		let value = args[Number(index)];
		return value === void 0 ? match : String(value);
	});
}
function createLogger(resource) {
	let prefix = `[${resource}]`;
	return {
		info: (message, ...details) => console.log(`${prefix} ${message}`, ...details),
		warn: (message, ...details) => console.warn(`${prefix} ^3${message}^7`, ...details),
		error: (message, ...details) => console.error(`${prefix} ^1${message}^7`, ...details)
	};
}
function withoutSchemaKey(value) {
	if (!isRecord(value) || !("$schema" in value)) return value;
	let { $schema: _schema, ...rest } = value;
	return rest;
}
var DataFile = class {
	resource;
	name;
	log;
	writes = Promise.resolve();
	pending = void 0;
	timer = null;
	schemaRef = null;
	constructor(resource, name, log) {
		this.resource = resource, this.name = name, this.log = log;
	}
	hasSchemaRef() {
		return (LoadResourceFile(this.resource, this.path) ?? "").includes("\"$schema\"");
	}
	read() {
		for (let path of [this.path, `${this.path}.bak`]) {
			let raw = LoadResourceFile(this.resource, path);
			if (raw) try {
				return withoutSchemaKey(JSON.parse(raw));
			} catch (error) {
				this.log.error(`${this.resource}/${path} is not valid JSON${path === this.path ? ", trying the backup" : ""}`, error);
			}
		}
		return null;
	}
	write(value) {
		this.pending = value, this.timer ||= setTimeout(() => {
			this.timer = null;
			let data = this.schemaRef && isRecord(this.pending) ? {
				$schema: this.schemaRef,
				...this.pending
			} : this.pending, text = `${JSON.stringify(data, null, 2)}\n`;
			this.writes = this.writes.then(() => this.flush(text)).catch((error) => this.log.error(`saving ${this.resource}/${this.path} failed`, error));
		}, 250);
	}
	get path() {
		return `data/${this.name}.json`;
	}
	async flush(text) {
		let file = `${GetResourcePath(this.resource)}/${this.path}`;
		await (0, node_fs_promises.mkdir)(file.slice(0, file.lastIndexOf("/")), { recursive: !0 }), await (0, node_fs_promises.writeFile)(`${file}.tmp`, text, "utf8"), await (0, node_fs_promises.copyFile)(file, `${file}.bak`).catch(() => void 0), await (0, node_fs_promises.rename)(`${file}.tmp`, file);
	}
};
// ../../../packages/shared/src/core.ts
const CORE = {
	resource: "ai-core",
	clientErrorEvent: "ai-core:clientError",
	playerLoadedEvent: "ai-core:playerLoaded",
	playerUnloadedEvent: "ai-core:playerUnloaded",
	moneyChangedEvent: "ai-core:moneyChanged",
	jobsChangedEvent: "ai-core:jobsChanged",
	dutyChangedEvent: "ai-core:dutyChanged",
	gangsChangedEvent: "ai-core:gangsChanged",
	activeGangChangedEvent: "ai-core:activeGangChanged",
	characterScreenEvent: "ai-core:characterScreen",
	inventoryChangedEvent: "ai-core:inventoryChanged",
	itemUsedEvent: "ai-core:itemUsed",
	playerDiedEvent: "ai-core:playerDied",
	clientPlayerLoadedEvent: "ai-core:client:playerLoaded",
	clientPlayerUnloadedEvent: "ai-core:client:playerUnloaded",
	clientCharacterPortraitEvent: "ai-core:client:characterPortrait",
	clientCharacterLookEvent: "ai-core:client:characterLook",
	clientPromptPressedEvent: "ai-core:client:promptPressed",
	clientCacheEvent: "ai-core:client:cache",
	clientHudVisibleEvent: "ai-core:client:hudVisible",
	vehicleTypeCallback: "ai-core:vehicleType",
	interactionStateKey: "ai:interaction",
	charactersCallback: "ai-core:characters",
	createCharacterCallback: "ai-core:createCharacter",
	deleteCharacterCallback: "ai-core:deleteCharacter",
	selectCharacterCallback: "ai-core:selectCharacter",
	clientNotifyEvent: "ai-core:client:notify",
	spawnEvent: "ai-core:client:spawn",
	openCharactersEvent: "ai-core:client:openCharacters"
}, ADMIN = {
	ace: "ai.admin",
	openCallback: "ai-core:admin:open",
	applyCallback: "ai-core:admin:apply",
	closeEvent: "ai-core:admin:close",
	showEvent: "ai-core:admin:show",
	deltaEvent: "ai-core:admin:delta",
	worldEvent: (resource) => `${resource}:admin:world`,
	worldChangesCallback: (resource) => `${resource}:admin:worldChanges`
};
// ../../../packages/lib/src/fivem/exports.ts
function registerExport(name, handler) {
	globalThis.exports(name, handler);
}
function resourceExport(resource) {
	return globalThis.exports[resource];
}
function isResourceStarted(resource) {
	return GetResourceState(resource) === "started";
}
function optionalExport(resource) {
	return isResourceStarted(resource) ? globalThis.exports[resource] : null;
}
function readLocaleFile(resource, lang) {
	let raw = LoadResourceFile(resource, `locales/${lang}.json`);
	if (!raw) return {};
	let parsed = JSON.parse(raw);
	if (!isRecord(parsed)) return {};
	let texts = {};
	for (let [key, value] of Object.entries(parsed)) typeof value == "string" && (texts[key] = value);
	return texts;
}
function createLocale() {
	let texts = loadLocaleTexts();
	return (key, ...args) => formatText(texts[key] ?? key, args);
}
function loadLocaleTexts(resource = GetCurrentResourceName()) {
	let lang = GetConvar("ai:locale", "en"), texts = {
		...readLocaleFile(resource, "en"),
		...lang === "en" ? {} : readLocaleFile(resource, lang)
	};
	for (let key of Object.keys(texts)) texts[key] = (texts[key] ?? "").replace(/\$\{([A-Z0-9_]+)\}/g, (match, ref) => texts[ref] ?? match);
	return texts;
}
// ../../../packages/lib/src/fivem/callbackNames.ts
const requestEvent = (name) => `aicore:cb:${name}`, responseEvent = (resource) => `aicore:cbr:${resource}`;
resourceExport(CORE.resource);
const log$5 = createLogger(GetCurrentResourceName()), gates = new Set();
on("playerDropped", () => {
	let source = Number(globalThis.source);
	for (let gate of gates) gate.release(source);
});
var ClientGate = class {
	name;
	options;
	limit;
	lock;
	constructor(name, options, defaultRate) {
		this.name = name, this.options = options, this.limit = new RateLimit(options.rate?.count ?? defaultRate, options.rate?.windowMs ?? 1e3), this.lock = options.lock ? new SourceLock() : null, gates.add(this);
	}
	check(source, raw) {
		if (!(source > 0) || !GetPlayerName(String(source)) || !this.limit.take(source)) return null;
		for (let guard of this.options.guards ?? []) {
			let verdict = guard(source);
			if (verdict !== !0) return typeof verdict == "string" && this.refuse(source, verdict), null;
		}
		if (!this.options.args) return [];
		let args = this.options.args(raw);
		return args === null && this.refuse(source, `invalid arguments ${logSafe(JSON.stringify(raw) ?? "", 200)}`), args;
	}
	run(source, busy, task) {
		return this.lock ? this.lock.run(source, busy, async () => task()) : Promise.resolve(task());
	}
	release(source) {
		this.limit.release(source), this.lock?.release(source);
	}
	refuse(source, reason) {
		log$5.warn(`${this.name} refused for ${GetPlayerName(String(source))} (${source}): ${reason}`);
	}
};
// ../../../packages/lib/src/server/callback.ts
const log$4 = createLogger(GetCurrentResourceName()), resource$1 = GetCurrentResourceName(), REFUSED = Symbol("refused");
function onClientCallback(name, first, second) {
	let [handler, options] = typeof first == "function" ? [first, second ?? {}] : [second, first], gate = new ClientGate(name, options, 20);
	onNet(requestEvent(name), async (caller, id, ...raw) => {
		let source = Number(globalThis.source);
		if (typeof caller != "string" || caller.length > 64 || typeof id != "number") return;
		let args = gate.check(source, raw);
		if (!args) return emitNet(responseEvent(caller), source, id, !1, null);
		try {
			let result = await gate.run(source, REFUSED, () => handler(source, ...args));
			result === REFUSED ? emitNet(responseEvent(caller), source, id, !1, null) : emitNet(responseEvent(caller), source, id, !0, result ?? null);
		} catch (error) {
			log$4.error(`callback ${name} failed for ${source}`, error), emitNet(responseEvent(caller), source, id, !1, null);
		}
	});
}
const pending = new Map();
onNet(responseEvent(resource$1), (id, ok, result) => {
	let entry = typeof id == "number" ? pending.get(id) : void 0;
	entry && entry.source === Number(globalThis.source) && (pending.delete(id), clearTimeout(entry.timer), ok === !0 ? entry.resolve(result) : entry.reject(Error("client callback failed")));
});
// ../../../packages/lib/src/server/admin/patch.ts
function toPatch(value) {
	if (!isRecord(value) || typeof value.file != "string") return null;
	let key = typeof value.key == "string" ? value.key : void 0;
	switch (value.action) {
		case "set": return typeof value.section == "string" ? {
			file: value.file,
			action: "set",
			key,
			section: value.section,
			value: value.value
		} : null;
		case "create": return key && typeof value.label == "string" ? {
			file: value.file,
			action: "create",
			key,
			label: value.label
		} : null;
		case "delete": return key ? {
			file: value.file,
			action: "delete",
			key
		} : null;
		case "import": {
			if (!isRecord(value.records)) return null;
			let records = {};
			for (let [k, v] of Object.entries(value.records)) isRecord(v) && (records[k] = v);
			return Object.keys(records).length > 0 && Object.keys(records).length <= 500 ? {
				file: value.file,
				action: "import",
				records
			} : null;
		}
		default: return null;
	}
}
const clone = (value) => value === void 0 ? value : JSON.parse(JSON.stringify(value)), core$10 = resourceExport(CORE.resource), ERR = {
	type: "ADMIN_ERR_TYPE",
	range: "ADMIN_ERR_RANGE",
	length: "ADMIN_ERR_LENGTH",
	pattern: "ADMIN_ERR_PATTERN",
	required: "ADMIN_ERR_REQUIRED",
	lookup: "ADMIN_ERR_LOOKUP"
}, lookups = new class {
	lists = new Map();
	values(source) {
		let cached = this.lists.get(source);
		if (cached && Date.now() - cached.at < 2e3) return cached.values.size > 0 ? cached.values : null;
		let list = [];
		try {
			list = core$10.GetLookupValues(source);
		} catch {}
		let values = new Set(Array.isArray(list) ? list.filter((v) => typeof v == "string") : []);
		return this.lists.set(source, {
			at: Date.now(),
			values
		}), values.size > 0 ? values : null;
	}
}(), isVec = (value, keys) => isRecord(value) && keys.every((k) => typeof value[k] == "number" && Number.isFinite(value[k]));
function validate(spec, value, path) {
	if (value == null) return spec.optional ? null : {
		error: ERR.required,
		path
	};
	let fail = (error) => ({
		error,
		path
	});
	switch (spec.type) {
		case "text": return typeof value == "string" ? value.length < (spec.min ?? 1) || value.length > (spec.max ?? 120) ? fail(ERR.length) : spec.pattern && !new RegExp(spec.pattern).test(value) ? fail(ERR.pattern) : spec.lookup && value !== "" && lookups.values(spec.lookup)?.has(value) === !1 ? fail(ERR.lookup) : null : fail(ERR.type);
		case "number": return typeof value != "number" || !Number.isFinite(value) || spec.integer && !Number.isInteger(value) ? fail(ERR.type) : spec.min !== void 0 && value < spec.min || spec.max !== void 0 && value > spec.max ? fail(ERR.range) : null;
		case "bool": return typeof value == "boolean" ? null : fail(ERR.type);
		case "enum": return spec.values.includes(value) ? null : fail(ERR.type);
		case "names": {
			if (!Array.isArray(value) || value.length > (spec.max ?? 50)) return fail(ERR.length);
			let pattern = new RegExp(spec.pattern ?? "^[\\w.:-]+$"), seen = new Set();
			for (let name of value) {
				if (typeof name != "string" || name.length > (spec.itemMax ?? 64) || seen.has(name)) return fail(ERR.type);
				if (!pattern.test(name)) return fail(ERR.pattern);
				if (spec.lookup && lookups.values(spec.lookup)?.has(name) === !1) return fail(ERR.lookup);
				seen.add(name);
			}
			return null;
		}
		case "vec3": return isVec(value, [
			"x",
			"y",
			"z"
		]) ? null : fail(ERR.type);
		case "vec4": return isVec(value, [
			"x",
			"y",
			"z",
			"heading"
		]) ? null : fail(ERR.type);
		case "object":
			if (!isRecord(value)) return fail(ERR.type);
			for (let key of Object.keys(value)) if (!(key in spec.fields)) return {
				error: ERR.type,
				path: `${path}.${key}`
			};
			for (let [key, field] of Object.entries(spec.fields)) {
				let refusal = validate(field, value[key], `${path}.${key}`);
				if (refusal) return refusal;
			}
			return null;
		case "list":
			if (!Array.isArray(value)) return fail(ERR.type);
			if (value.length < (spec.min ?? 0) || value.length > (spec.max ?? 100)) return fail(ERR.length);
			for (let i = 0; i < value.length; i++) {
				let refusal = validate(spec.of, value[i], `${path}.${i + 1}`);
				if (refusal) return refusal;
			}
			return null;
		default: return spec;
	}
}
// ../../../packages/lib/src/server/admin/jsonSchema.ts
const SCHEMA_KEY = {
	type: "string",
	description: "This file's JSON Schema (for editors)."
};
function langFile(resource) {
	try {
		let raw = JSON.parse(LoadResourceFile(resource, "locales/en.json") ?? "{}");
		return isRecord(raw) ? Object.fromEntries(Object.entries(raw).filter((e) => typeof e[1] == "string")) : {};
	} catch {
		return {};
	}
}
function texts$1(resource) {
	return {
		...langFile("ai-core"),
		...langFile(resource)
	};
}
function collect(fields, prefix, lang, out) {
	for (let field of fields) {
		let path = prefix + field.path, label = lang[field.label] ?? field.label, hint = field.hint ? lang[field.hint] ?? field.hint : "";
		out.has(path) || out.set(path, hint ? `${label}: ${hint}` : label), field.widget === "list" && collect(field.rows, `${path}[].`, lang, out);
	}
}
function describe(schema, file, lang) {
	let out = new Map();
	for (let tab of schema.tabs) if (tab.file === file) for (let card of tab.cards) collect(card.fields, "", lang, out);
	return out;
}
function toJson(spec, path, desc) {
	let description = desc.get(path), base = description ? { description } : {};
	switch (spec.type) {
		case "text": return {
			...base,
			type: "string",
			minLength: spec.min,
			maxLength: spec.max,
			pattern: spec.pattern
		};
		case "number": return {
			...base,
			type: spec.integer ? "integer" : "number",
			minimum: spec.min,
			maximum: spec.max
		};
		case "bool": return {
			...base,
			type: "boolean"
		};
		case "enum": return {
			...base,
			enum: spec.values
		};
		case "names": return {
			...base,
			type: "array",
			maxItems: spec.max,
			uniqueItems: !0,
			items: {
				type: "string",
				maxLength: spec.itemMax,
				pattern: spec.pattern
			}
		};
		case "vec3":
		case "vec4": {
			let keys = spec.type === "vec3" ? [
				"x",
				"y",
				"z"
			] : [
				"x",
				"y",
				"z",
				"heading"
			];
			return {
				...base,
				type: "object",
				required: keys,
				properties: Object.fromEntries(keys.map((k) => [k, { type: "number" }]))
			};
		}
		case "object": return {
			...base,
			...objectOf(spec.fields, path ? `${path}.` : "", desc)
		};
		case "list": return {
			...base,
			type: "array",
			minItems: spec.min,
			maxItems: spec.max,
			items: toJson(spec.of, `${path}[]`, desc)
		};
		default: return spec;
	}
}
function objectOf(fields, prefix, desc) {
	return {
		type: "object",
		properties: Object.fromEntries(Object.entries(fields).map(([k, s]) => [k, toJson(s, prefix + k, desc)])),
		required: Object.entries(fields).filter(([, s]) => !s.optional).map(([k]) => k)
	};
}
function fileSchema(resource, schema, name, spec) {
	let desc = describe(schema, name, texts$1(resource)), title = `${resource}/data/${name}.json`, body = spec.kind === "settings" ? (() => {
		let obj = objectOf(spec.sections, "", desc), required = obj.required.filter((k) => !(k in (spec.defaults ?? {})));
		return {
			...obj,
			properties: {
				$schema: SCHEMA_KEY,
				...obj.properties
			},
			required
		};
	})() : {
		type: "object",
		properties: { $schema: SCHEMA_KEY },
		patternProperties: { [spec.keyPattern ?? "^[a-z0-9_]{2,32}$"]: objectOf(spec.sections, "", desc) },
		additionalProperties: !1
	};
	return `${JSON.stringify({
		$schema: "http://json-schema.org/draft-07/schema#",
		title,
		...body
	}, null, 2)}\n`;
}
function writeSchema(resource, name, text, log) {
	let path = `data/schemas/${name}.schema.json`;
	if (LoadResourceFile(resource, path) === text) return;
	let dir = `${GetResourcePath(resource)}/data/schemas`;
	(0, node_fs_promises.mkdir)(dir, { recursive: !0 }).then(() => (0, node_fs_promises.writeFile)(`${dir}/${name}.schema.json`, text, "utf8")).catch((error) => log.error(`writing ${resource}/${path} failed`, error));
}
// ../../../packages/lib/src/server/admin/panel.ts
const core$9 = resourceExport(CORE.resource), DEFAULT_KEY = "^[a-z0-9_]{2,32}$";
function imported(spec, value) {
	let base = clone(spec.newRecord ?? {}), out = {};
	for (let name of Object.keys(spec.sections)) {
		let v = name in value ? value[name] : base[name];
		v !== void 0 && (out[name] = clone(v));
	}
	return out;
}
var AdminPanel = class {
	schema;
	data = new Map();
	dataFiles = new Map();
	handlers = new Map();
	rules = new Map();
	worldChanges = new Map();
	resource = GetCurrentResourceName();
	log = createLogger(this.resource);
	constructor(schema) {
		this.schema = schema;
		for (let [name, spec] of Object.entries(schema.files)) this.load(name, spec);
		registerExport("AdminPanelSnapshot", () => this.snapshot()), registerExport("AdminPanelApply", (admin, patch) => this.apply(admin, patch)), onClientCallback(ADMIN.worldChangesCallback(this.resource), () => Object.fromEntries(this.worldChanges)), setImmediate(() => core$9.RegisterAdminPanel(this.resource));
	}
	get(file) {
		return this.data.get(file) ?? {};
	}
	onChange(file, handler) {
		this.handlers.set(file, [...this.handlers.get(file) ?? [], handler]);
	}
	rule(file, rule) {
		this.rules.set(file, rule);
	}
	snapshot() {
		return {
			resource: this.resource,
			schema: this.schema,
			texts: loadLocaleTexts(),
			data: clone(Object.fromEntries(this.data))
		};
	}
	apply(admin, raw) {
		let patch = toPatch(raw), spec = patch ? this.schema.files[patch.file] : void 0;
		if (!patch || !spec || spec.memory) return {
			ok: !1,
			error: ERR.type
		};
		let error = this.check(patch, spec);
		return error ? (this.log.warn(`admin ${admin} edit refused (${error}): ${JSON.stringify(patch).slice(0, 300)}`), {
			ok: !1,
			error
		}) : (this.store(patch, spec), { ok: !0 });
	}
	commit(file, key, value) {
		let data = this.data.get(file);
		data && (key === void 0 ? isRecord(value) && this.data.set(file, clone(value)) : value === null ? delete data[key] : data[key] = clone(value), this.changed(file, key));
	}
	linked(spec, value) {
		return spec.type === "text" && spec.records && typeof value == "string" && value !== "" && !(value in this.get(spec.records)) ? "ADMIN_ERR_LOOKUP" : null;
	}
	check(patch, spec) {
		let data = this.get(patch.file);
		if (patch.action === "create") return spec.kind !== "records" || !new RegExp(spec.keyPattern ?? DEFAULT_KEY).test(patch.key) ? ERR.pattern : patch.key in data ? "ADMIN_ERR_EXISTS" : null;
		if (patch.action === "delete") return spec.kind !== "records" || !(patch.key in data) ? ERR.type : spec.locked?.includes(patch.key) ? "ADMIN_ERR_LOCKED" : null;
		if (patch.action === "import") {
			if (spec.kind !== "records") return ERR.type;
			let pattern = new RegExp(spec.keyPattern ?? DEFAULT_KEY);
			for (let [key, value] of Object.entries(patch.records)) {
				if (!pattern.test(key)) return ERR.pattern;
				let record = imported(spec, value);
				for (let [name, section] of Object.entries(spec.sections)) {
					let refusal = validate(section, record[name], name);
					if (refusal) return refusal.error;
					let link = this.linked(section, record[name]);
					if (link) return link;
				}
				let ruled = this.rules.get(patch.file)?.(key, record);
				if (ruled) return ruled;
			}
			return null;
		}
		let section = spec.sections[patch.section];
		if (!section || spec.kind === "records" && (!patch.key || !(patch.key in data))) return ERR.type;
		let refusal = validate(section, patch.value, patch.section);
		if (refusal) return refusal.error;
		let link = this.linked(section, patch.value);
		if (link) return link;
		let current = spec.kind === "records" ? data[patch.key ?? ""] : data, next = {
			...isRecord(current) ? current : {},
			[patch.section]: patch.value
		};
		return this.rules.get(patch.file)?.(patch.key, next) ?? null;
	}
	store(patch, spec) {
		let data = this.data.get(patch.file) ?? {};
		if (patch.action === "create") {
			let record = clone(spec.newRecord ?? {});
			spec.labelPath && (record[spec.labelPath] = patch.label), data[patch.key] = record;
		} else if (patch.action === "delete") delete data[patch.key];
		else if (patch.action === "import") {
			for (let [key, value] of Object.entries(patch.records)) data[key] = imported(spec, value);
			this.data.set(patch.file, data);
			for (let key of Object.keys(patch.records)) this.changed(patch.file, key);
			return;
		} else {
			let target = spec.kind === "records" ? data[patch.key ?? ""] : data;
			if (!isRecord(target)) return;
			patch.value === void 0 || patch.value === null ? delete target[patch.section] : target[patch.section] = clone(patch.value);
		}
		this.data.set(patch.file, data), this.changed(patch.file, spec.kind === "records" ? patch.key : void 0);
	}
	changed(file, key) {
		let spec = this.schema.files[file], data = this.get(file), value = key === void 0 ? data : data[key] ?? null;
		this.dataFiles.get(file)?.write(data);
		for (let handler of this.handlers.get(file) ?? []) handler(key, value);
		if (core$9.AdminPanelChanged({
			resource: this.resource,
			file,
			key,
			value: clone(value)
		}), spec?.sync !== "all") return;
		let changes = this.worldChanges.get(file) ?? {};
		changes[key ?? ""] = clone(value), this.worldChanges.set(file, changes), emitNet(ADMIN.worldEvent(this.resource), -1, file, key ?? null, value);
	}
	load(name, spec) {
		if (spec.memory) {
			this.data.set(name, {});
			return;
		}
		let file = new DataFile(this.resource, name, this.log);
		this.dataFiles.set(name, file), file.schemaRef = `./schemas/${name}.schema.json`, writeSchema(this.resource, name, fileSchema(this.resource, this.schema, name, spec), this.log);
		let raw = file.read(), data = isRecord(raw) ? raw : {}, filled = !1;
		if (spec.kind === "settings") for (let [section, value] of Object.entries(spec.defaults ?? {})) section in data || (data[section] = clone(value), filled = !0);
		this.data.set(name, data), (filled || raw === null || !file.hasSchemaRef()) && file.write(data);
	}
};
// ../../../packages/lib/src/server/log.ts
function aiLog(channel, message, options) {
	optionalExport("ai-core")?.Log(channel, message, options);
}
function aiLogChannels(channels) {
	optionalExport("ai-core")?.LogChannels(channels);
}
// ../../../packages/lib/src/server/notify.ts
function notify(source, text, kind = "info", duration) {
	let notification = {
		text,
		kind,
		duration
	};
	emitNet(CORE.clientNotifyEvent, source, notification);
}
resourceExport(CORE.resource);
// ../../../packages/lib/src/server/online.ts
const core$7 = resourceExport(CORE.resource);
var OnlinePlayers = class {
	players = new Map();
	onDuty = new Map();
	started = !1;
	start() {
		if (this.started) return;
		this.started = !0;
		let load = (source, character) => {
			this.put(source, character, (core$7.GetJobs(source) ?? []).map((m) => m.job), (core$7.GetGangs(source) ?? []).map((m) => m.gang)), this.setDuty(source, core$7.GetDutyJob(source));
		};
		on(CORE.playerLoadedEvent, load), on(CORE.playerUnloadedEvent, (source) => this.drop(source)), on(CORE.jobsChangedEvent, (source, jobs) => {
			let player = this.players.get(source);
			player && (player.jobs = jobs.map((m) => m.job));
		}), on(CORE.gangsChangedEvent, (source, gangs) => {
			let player = this.players.get(source);
			player && (player.gangs = gangs.map((m) => m.gang));
		}), on(CORE.dutyChangedEvent, (source, job) => this.setDuty(source, job));
		for (let source of core$7.GetLoadedSources()) {
			let character = core$7.GetCharacter(source);
			character && load(source, character);
		}
	}
	put(source, character, jobs, gangs) {
		this.drop(source), this.players.set(source, {
			character,
			jobs,
			gangs,
			duty: null
		});
	}
	drop(source) {
		this.setDuty(source, null), this.players.delete(source);
	}
	setDuty(source, job) {
		let player = this.players.get(source);
		if (!player || (player.duty && this.onDuty.get(player.duty)?.delete(source), player.duty = job, !job)) return;
		let set = this.onDuty.get(job);
		set || this.onDuty.set(job, set = new Set()), set.add(source);
	}
	sources() {
		return this.start(), this.players.keys();
	}
	get size() {
		return this.start(), this.players.size;
	}
	character(source) {
		return this.start(), this.players.get(source)?.character ?? null;
	}
	jobs(source) {
		return this.start(), this.players.get(source)?.jobs ?? [];
	}
	gangs(source) {
		return this.start(), this.players.get(source)?.gangs ?? [];
	}
	dutyJob(source) {
		return this.start(), this.players.get(source)?.duty ?? null;
	}
	onDutyFor(job) {
		return this.start(), this.onDuty.get(job) ?? EMPTY;
	}
};
const EMPTY = new Set(), online = new OnlinePlayers();
resourceExport(CORE.resource), resourceExport(CORE.resource);
// ../../../packages/lib/src/server/command.ts
const resource = GetCurrentResourceName(), log$3 = createLogger(resource);
let texts = null;
const t = (key, ...args) => formatText((texts ??= loadLocaleTexts(CORE.resource))[key] ?? key, args);
function reply(source, text, kind) {
	source > 0 ? notify(source, text, kind) : log$3.info(text);
}
var Command = class {
	params;
	handler;
	info;
	usage;
	constructor(names, params, help, aces, handler) {
		this.params = params, this.handler = handler, this.info = {
			names,
			help,
			params: params.map((p) => ({ ...p })),
			aces
		}, this.usage = [`/${names[0]}`, ...params.map((p) => p.optional ? `[${p.name}]` : `<${p.name}>`)].join(" ");
	}
	allowed(source, name) {
		let aces = this.info.aces;
		if (source <= 0 || !aces) return !0;
		let player = String(source);
		return aces.some((ace) => IsPlayerAceAllowed(player, ace)) || !!IsPlayerAceAllowed(player, `command.${name}`);
	}
	suggestion(name) {
		return {
			name: `/${name}`,
			help: this.info.help,
			params: this.params.map((p) => ({
				name: p.name,
				help: p.help ?? ""
			}))
		};
	}
	run(source, name, raw, line) {
		if (!this.allowed(source, name)) return reply(source, t("COMMAND_NOT_ALLOWED"), "error");
		let args = this.parse(raw);
		if (typeof args == "string") return reply(source, args, "error"), reply(source, t("COMMAND_USAGE", this.usage), "info");
		let fail = (error) => log$3.error(`command /${name} failed`, error);
		try {
			let result = this.handler(source, args, line);
			result instanceof Promise && result.catch(fail);
		} catch (error) {
			fail(error);
		}
	}
	parse(raw) {
		let args = {};
		for (let [i, param] of this.params.entries()) {
			let token = param.type === "longString" ? raw.slice(i).join(" ").trim() : raw[i] ?? "";
			if (token === "") {
				if (!param.optional) return t("COMMAND_MISSING", param.name);
			} else {
				if (param.type === "number" || param.type === "playerId") {
					let value = Number(token);
					if (!Number.isFinite(value)) return t("COMMAND_NUMBER", param.name);
					if (param.type === "playerId" && (!Number.isInteger(value) || value <= 0 || !GetPlayerName(String(value)))) return t("COMMAND_PLAYER", token);
					args[param.name] = value;
				} else args[param.name] = token;
				if (param.type === "longString") break;
			}
		}
		return args;
	}
};
const commands = new class {
	list = [];
	sent = new Map();
	announced = 0;
	queued = !1;
	listening = !1;
	add(command) {
		this.listening || this.listen(), this.list.push(command), this.queued || (this.queued = !0, setImmediate(() => this.flush()));
	}
	refresh(source) {
		let before = this.sent.get(source), now = new Set(), add = [];
		for (let command of this.list) for (let name of command.info.names) command.allowed(source, name) && (now.add(name), before?.has(name) || add.push(command.suggestion(name)));
		if (this.sent.set(source, now), add.length && emitNet("chat:addSuggestions", source, add), before) for (let name of before) now.has(name) || emitNet("chat:removeSuggestion", source, `/${name}`);
	}
	flush() {
		this.queued = !1, optionalExport(CORE.resource)?.RegisterCommands(resource, this.list.slice(this.announced).map((c) => c.info)), this.announced = this.list.length;
		for (let player of getPlayers()) this.refresh(Number(player));
	}
	listen() {
		this.listening = !0;
		let refresh = (source) => this.refresh(Number(source));
		on(CORE.playerLoadedEvent, refresh), on(CORE.jobsChangedEvent, refresh), on(CORE.gangsChangedEvent, refresh), on("playerDropped", () => this.sent.delete(Number(globalThis.source))), on("onResourceStop", (name) => {
			if (name === resource) for (let command of this.list) for (let n of command.info.names) emitNet("chat:removeSuggestion", -1, `/${n}`);
		});
	}
}();
function addCommand(name, options, handler) {
	let names = (Array.isArray(name) ? name : [name]).map((n) => n.toLowerCase());
	if (names.length === 0) throw Error("addCommand needs a name");
	let restricted = options.restricted ?? !1, aces = restricted === !1 ? null : restricted === !0 ? [ADMIN.ace] : Array.isArray(restricted) ? [...restricted] : [restricted], command = new Command(names, options.params ?? [], options.help ?? "", aces, handler);
	for (let n of names) RegisterCommand(n, (source, raw, line) => command.run(Number(source), n, raw, line), !1);
	commands.add(command);
}
createLogger(GetCurrentResourceName()), createLogger("aicore-lib");
// ../../../packages/lib/src/fivem/state.ts
const isServer = IsDuplicityVersion();
var Mirror = class {
	key;
	parse;
	values = new Map();
	listeners = new Set();
	constructor(key, parse) {
		this.key = key, this.parse = parse;
	}
	onChange(listener) {
		return this.listeners.add(listener), () => this.listeners.delete(listener);
	}
	store(id, raw) {
		this.apply(id, raw == null ? void 0 : this.parse(raw));
	}
	apply(id, value) {
		let old = this.values.get(id);
		if (this.values.set(id, value), old !== value) for (let listener of this.listeners) listener(id, value, old);
	}
}, PlayerState$1 = class extends Mirror {
	seen = new Set();
	constructor(key, parse) {
		super(key, parse), AddStateBagChangeHandler(key, "", (bag, _key, value) => {
			if (!bag.startsWith("player:")) return;
			let id = Number(bag.slice(7));
			this.seen.add(id), this.store(id, value);
		}), isServer && on("playerDropped", () => this.forget(Number(globalThis.source)));
	}
	get(serverId) {
		if (!this.seen.has(serverId)) {
			this.seen.add(serverId);
			let raw = Player(serverId).state[this.key];
			this.values.set(serverId, raw == null ? void 0 : this.parse(raw));
		}
		return this.values.get(serverId);
	}
	put(serverId, value) {
		this.seen.add(serverId), this.apply(serverId, value);
	}
	forget(serverId) {
		this.values.delete(serverId), this.seen.delete(serverId);
	}
}, PlayerState = class extends PlayerState$1 {
	set(source, value) {
		Player(source).state.set(this.key, value ?? null, !0), this.put(source, value);
	}
};
resourceExport(CORE.resource), resourceExport(CORE.resource), resourceExport(CORE.resource);
// resource/common/locale.ts
const Locale = createLocale(), ResourceName = GetCurrentResourceName();
IsDuplicityVersion();
// resource/common/scale.ts
const PLAIN = {
	height: 1,
	width: 1
}, toScale = (v) => {
	let r = record(v);
	return typeof r.height == "number" && typeof r.width == "number" ? {
		height: r.height,
		width: r.width
	} : void 0;
};
function readSettings(raw) {
	let s = record(raw);
	return {
		heightOn: bool(s.heightOn, !0),
		widthOn: bool(s.widthOn, !1),
		minHeight: num(s.minHeight, .85, .5, 1),
		maxHeight: num(s.maxHeight, 1.1, 1, 1.5),
		minWidth: num(s.minWidth, .9, .5, 1),
		maxWidth: num(s.maxWidth, 1.15, 1, 1.5),
		drawDistance: num(s.drawDistance, 100, 20, 300),
		commandAccess: s.commandAccess === "everyone" ? "everyone" : "admins"
	};
}
// resource/server/panel.ts
var Panel = class extends AdminPanel {
	editor = 0;
	apply(admin, raw) {
		this.editor = admin;
		try {
			return super.apply(admin, raw);
		} finally {
			this.editor = 0;
		}
	}
};
// resource/server/schema.ts
const range = (min, max) => ({
	type: "number",
	min,
	max
}), schema = {
	title: "ADMIN_TITLE",
	icon: "user",
	files: {
		settings: {
			kind: "settings",
			sync: "all",
			sections: {
				heightOn: { type: "bool" },
				widthOn: { type: "bool" },
				minHeight: range(.5, 1),
				maxHeight: range(1, 1.5),
				minWidth: range(.5, 1),
				maxWidth: range(1, 1.5),
				drawDistance: {
					type: "number",
					min: 20,
					max: 300,
					integer: !0
				},
				commandAccess: {
					type: "enum",
					values: ["admins", "everyone"]
				}
			},
			defaults: {
				commandAccess: "admins",
				heightOn: !0,
				widthOn: !1,
				minHeight: .85,
				maxHeight: 1.1,
				minWidth: .9,
				maxWidth: 1.15,
				drawDistance: 100
			}
		},
		players: {
			kind: "records",
			sync: "admin",
			memory: !0,
			sections: {}
		},
		edit: {
			kind: "settings",
			sync: "admin",
			sections: {
				player: {
					type: "text",
					min: 0,
					max: 64,
					lookup: "player"
				},
				height: range(.5, 1.5),
				width: range(.5, 1.5)
			},
			defaults: {
				player: "",
				height: 1,
				width: 1
			}
		}
	},
	tabs: [
		{
			id: "settings",
			file: "settings",
			icon: "user",
			label: "ADMIN_TAB",
			desc: "ADMIN_TAB_DESC",
			cards: [
				{
					icon: "terminal",
					title: "ADMIN_C_COMMANDS",
					desc: "ADMIN_C_COMMANDS_DESC",
					fields: [{
						widget: "select",
						path: "commandAccess",
						label: "ADMIN_F_ACCESS",
						hint: "ADMIN_H_ACCESS",
						options: [{
							value: "admins",
							label: "ADMIN_O_ADMINS"
						}, {
							value: "everyone",
							label: "ADMIN_O_EVERYONE"
						}]
					}]
				},
				{
					icon: "triangle-exclamation",
					title: "ADMIN_C_LIMITS",
					desc: "ADMIN_C_LIMITS_DESC",
					fields: []
				},
				{
					icon: "user",
					title: "ADMIN_C_HEIGHT",
					desc: "ADMIN_C_HEIGHT_DESC",
					fields: [
						{
							widget: "switch",
							path: "heightOn",
							label: "ADMIN_F_HEIGHT_ON",
							hint: "ADMIN_H_HEIGHT_ON"
						},
						{
							widget: "number",
							path: "minHeight",
							label: "ADMIN_F_MIN",
							hint: "ADMIN_H_MIN_HEIGHT",
							min: .5,
							max: 1,
							step: .01,
							unit: "x"
						},
						{
							widget: "number",
							path: "maxHeight",
							label: "ADMIN_F_MAX",
							hint: "ADMIN_H_MAX_HEIGHT",
							min: 1,
							max: 1.5,
							step: .01,
							unit: "x"
						}
					]
				},
				{
					icon: "user",
					title: "ADMIN_C_WIDTH",
					desc: "ADMIN_C_WIDTH_DESC",
					fields: [
						{
							widget: "switch",
							path: "widthOn",
							label: "ADMIN_F_WIDTH_ON",
							hint: "ADMIN_H_WIDTH_ON"
						},
						{
							widget: "number",
							path: "minWidth",
							label: "ADMIN_F_MIN",
							hint: "ADMIN_H_MIN_WIDTH",
							min: .5,
							max: 1,
							step: .01,
							unit: "x"
						},
						{
							widget: "number",
							path: "maxWidth",
							label: "ADMIN_F_MAX",
							hint: "ADMIN_H_MAX_WIDTH",
							min: 1,
							max: 1.5,
							step: .01,
							unit: "x"
						},
						{
							widget: "number",
							path: "drawDistance",
							label: "ADMIN_F_DISTANCE",
							hint: "ADMIN_H_DISTANCE",
							min: 20,
							max: 300,
							step: 10,
							unit: "m"
						}
					]
				}
			]
		},
		{
			id: "players",
			file: "players",
			icon: "users",
			label: "ADMIN_TAB_PLAYERS",
			desc: "ADMIN_TAB_PLAYERS_DESC",
			cards: [],
			table: {
				sort: "name",
				columns: [
					{
						path: "id",
						label: "ADMIN_COL_ID",
						width: .6,
						mono: !0
					},
					{
						path: "name",
						label: "ADMIN_COL_NAME",
						width: 2
					},
					{
						path: "height",
						label: "ADMIN_COL_HEIGHT",
						mono: !0
					},
					{
						path: "width",
						label: "ADMIN_COL_WIDTH",
						mono: !0
					}
				]
			}
		},
		{
			id: "edit",
			file: "edit",
			icon: "user",
			label: "ADMIN_TAB_EDIT",
			desc: "ADMIN_TAB_EDIT_DESC",
			cards: [{
				icon: "user",
				title: "ADMIN_C_EDIT",
				desc: "ADMIN_C_EDIT_DESC",
				fields: [
					{
						widget: "text",
						path: "player",
						lookup: "player",
						label: "ADMIN_F_PLAYER",
						hint: "ADMIN_H_PLAYER",
						placeholder: "ADMIN_P_PLAYER"
					},
					{
						widget: "number",
						path: "height",
						label: "ADMIN_F_HEIGHT",
						hint: "ADMIN_H_HEIGHT",
						min: .5,
						max: 1.5,
						step: .01,
						unit: "x"
					},
					{
						widget: "number",
						path: "width",
						label: "ADMIN_F_WIDTH",
						hint: "ADMIN_H_WIDTH",
						min: .5,
						max: 1.5,
						step: .01,
						unit: "x"
					}
				]
			}]
		}
	]
}, core$1 = resourceExport("ai-core"), scaleState = new PlayerState("aiPedScale", toScale), readForm = (raw) => {
	let v = isRecord(raw) ? raw : {};
	return {
		player: str(v.player, "", 64),
		height: num(v.height, 1, .5, 1.5),
		width: num(v.width, 1, .5, 1.5)
	};
};
var Sizes = class {
	panel;
	settings;
	citizen = new Map();
	formPlayer = "";
	constructor(panel, settings) {
		this.panel = panel, this.settings = settings, panel.commit("edit", void 0, {
			player: "",
			height: 1,
			width: 1
		}), panel.onChange("edit", () => this.formEdited()), panel.rule("edit", (_key, next) => this.checkForm(readForm(next)));
	}
	get(source) {
		return scaleState.get(source) ?? PLAIN;
	}
	load(source, character) {
		this.citizen.set(source, character.citizenid), this.show(source, toScale(core$1.GetMeta(source, "pedScale")) ?? PLAIN);
	}
	unload(source) {
		scaleState.set(source, void 0);
		let citizenid = this.citizen.get(source);
		this.citizen.delete(source), citizenid && this.panel.commit("players", citizenid, null);
	}
	set(by, source, scale) {
		this.show(source, scale);
		let plain = scale.height === 1 && scale.width === 1;
		core$1.SetMeta(source, "pedScale", plain ? null : scale), aiLog("sizes", "changed a character size", {
			source: by > 0 ? by : void 0,
			target: source,
			metadata: { ...scale }
		});
		let form = readForm(this.panel.get("edit"));
		form.player === this.citizen.get(source) && (form.height !== scale.height || form.width !== scale.width) && this.panel.commit("edit", void 0, {
			...form,
			...scale
		});
	}
	show(source, scale) {
		let plain = scale.height === 1 && scale.width === 1;
		scaleState.set(source, plain ? void 0 : scale);
		let citizenid = this.citizen.get(source), c = online.character(source);
		citizenid && this.panel.commit("players", citizenid, {
			id: source,
			name: c ? `${c.firstname} ${c.lastname}` : GetPlayerName(String(source)),
			height: scale.height,
			width: scale.width
		});
	}
	sourceOf(citizenid) {
		return citizenid ? core$1.GetSourceByCitizenId(citizenid) : null;
	}
	checkForm(form) {
		if (!form.player || form.player !== this.formPlayer) return null;
		let source = this.sourceOf(form.player);
		if (source === null) return "ERR_OFFLINE";
		let current = this.get(source), s = this.settings();
		if (form.height !== current.height) {
			if (!s.heightOn) return "ERR_HEIGHT_OFF";
			if (form.height < s.minHeight || form.height > s.maxHeight) return "ADMIN_ERR_LIMITS";
		}
		if (form.width !== current.width) {
			if (!s.widthOn) return "ERR_WIDTH_OFF";
			if (form.width < s.minWidth || form.width > s.maxWidth) return "ADMIN_ERR_LIMITS";
		}
		return null;
	}
	formEdited() {
		let admin = this.panel.editor;
		if (admin === 0) return;
		let form = readForm(this.panel.get("edit")), source = this.sourceOf(form.player);
		if (form.player !== this.formPlayer) {
			this.formPlayer = form.player;
			let scale = source === null ? PLAIN : this.get(source);
			setImmediate(() => this.panel.commit("edit", void 0, {
				...form,
				...scale
			}));
		} else source !== null && this.set(admin, source, {
			height: form.height,
			width: form.width
		});
	}
};
// resource/server/index.ts
const log = createLogger(ResourceName), core = resourceExport("ai-core"), panel = new Panel(schema);
let settings = readSettings(panel.get("settings"));
panel.onChange("settings", () => settings = readSettings(panel.get("settings"))), aiLogChannels({ sizes: {} });
const sizes = new Sizes(panel, () => settings);
on(CORE.playerLoadedEvent, (source, character) => sizes.load(source, character)), on(CORE.playerUnloadedEvent, (source) => sizes.unload(source));
for (let source of online.sources()) {
	let character = core.GetCharacter(source);
	character && sizes.load(source, character);
}
const tell = (source, text, kind) => source > 0 ? notify(source, text, kind) : log.info(text), everyone = settings.commandAccess === "everyone";
function targetOf(source, id) {
	let target = id ?? source;
	return target <= 0 ? Locale("ERR_PLAYER_ONLY") : everyone && target !== source && source > 0 && !IsPlayerAceAllowed(String(source), ADMIN.ace) ? Locale("ERR_OWN_ONLY") : online.character(target) ? target : Locale("ERR_OFFLINE");
}
const value = {
	name: "value",
	type: "number",
	help: Locale("COMMAND_P_VALUE")
}, id = {
	name: "id",
	type: "playerId",
	help: Locale("COMMAND_P_ID"),
	optional: !0
};
addCommand("setheight", {
	help: Locale("COMMAND_HEIGHT"),
	params: [value, id],
	restricted: !everyone
}, (source, args) => {
	let target = targetOf(source, args.id);
	if (typeof target == "string") return tell(source, target, "error");
	if (!settings.heightOn) return tell(source, Locale("ERR_HEIGHT_OFF"), "error");
	if (args.value < settings.minHeight || args.value > settings.maxHeight) return tell(source, Locale("ERR_RANGE", settings.minHeight, settings.maxHeight), "error");
	sizes.set(source, target, {
		...sizes.get(target),
		height: args.value
	}), tell(source, Locale("NOTIFY_HEIGHT", args.value), "success");
}), addCommand("setwidth", {
	help: Locale("COMMAND_WIDTH"),
	params: [value, id],
	restricted: !everyone
}, (source, args) => {
	let target = targetOf(source, args.id);
	if (typeof target == "string") return tell(source, target, "error");
	if (!settings.widthOn) return tell(source, Locale("ERR_WIDTH_OFF"), "error");
	if (args.value < settings.minWidth || args.value > settings.maxWidth) return tell(source, Locale("ERR_RANGE", settings.minWidth, settings.maxWidth), "error");
	sizes.set(source, target, {
		...sizes.get(target),
		width: args.value
	}), tell(source, Locale("NOTIFY_WIDTH", args.value), "success");
}), addCommand("resetscale", {
	help: Locale("COMMAND_RESET"),
	params: [id],
	restricted: !everyone
}, (source, args) => {
	let target = targetOf(source, args.id);
	if (typeof target == "string") return tell(source, target, "error");
	sizes.set(source, target, PLAIN), tell(source, Locale("NOTIFY_RESET"), "success");
});
